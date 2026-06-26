import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { buildSystemPrompt, parseOutcome, cleanMessage, Message } from '@/lib/ai'

class AiProviderError extends Error {
  status: number
  retryAfter: number | null
  provider: string

  constructor(provider: string, message: string, status: number, retryAfter: number | null = null) {
    super(message)
    this.name = 'AiProviderError'
    this.provider = provider
    this.status = status
    this.retryAfter = retryAfter
  }
}

// Brevo (formerly Sendinblue) - 300 free emails/day, no credit card.
async function sendEmail(to: string, subject: string, html: string) {
  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': process.env.BREVO_API_KEY!,
    },
    body: JSON.stringify({
      sender: { name: 'CrushCode', email: process.env.BREVO_SENDER_EMAIL },
      to: [{ email: to }],
      subject,
      htmlContent: html,
    }),
  })
  if (!res.ok) {
    const err = await res.text()
    console.error('[Brevo] Email failed:', { to, subject, status: res.status, err })
    // Don't throw — we don't want email failure to kill the whole response
    // But you'll now see it clearly in Vercel logs
  } else {
    console.log('[Brevo] Email sent to', to)
  }
}

async function callGemini(systemPrompt: string, messages: Message[]): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY
  const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash-lite'

  if (!apiKey) {
    throw new AiProviderError('Gemini', 'Gemini API key is missing.', 500)
  }

  const geminiMessages = messages.length === 0
    ? [{ role: 'user', parts: [{ text: 'start' }] }]
    : messages.map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      }))

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemPrompt }] },
        contents: geminiMessages,
        generationConfig: { maxOutputTokens: 300, temperature: 0.9 },
      }),
    }
  )

  if (!res.ok) {
    const retryAfterHeader = res.headers.get('retry-after')
    let retryAfter = retryAfterHeader ? Number(retryAfterHeader) : null
    let message = 'The AI service is temporarily unavailable.'

    try {
      const data = await res.json()
      message = data.error?.message || message
      const retryInfo = data.error?.details?.find((detail: { '@type'?: string }) =>
        detail['@type'] === 'type.googleapis.com/google.rpc.RetryInfo'
      )
      if (!retryAfter && retryInfo?.retryDelay) {
        retryAfter = Number.parseInt(retryInfo.retryDelay, 10)
      }
    } catch {
      message = 'The AI service is temporarily unavailable.'
    }

    throw new AiProviderError('Gemini', message, res.status, retryAfter)
  }

  const data = await res.json()
  return data.candidates?.[0]?.content?.parts?.[0]?.text || ''
}

async function callOpenAiCompatibleProvider(
  provider: string,
  baseUrl: string,
  apiKey: string | undefined,
  model: string,
  systemPrompt: string,
  messages: Message[],
  extraHeaders: Record<string, string> = {}
): Promise<string> {
  if (!apiKey) {
    throw new AiProviderError(provider, `${provider} API key is missing.`, 500)
  }

  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
      ...extraHeaders,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        ...(messages.length === 0 ? [{ role: 'user' as const, content: 'start' }] : messages),
      ],
      max_tokens: 300,
      temperature: 0.9,
    }),
  })

  if (!res.ok) {
    const retryAfterHeader = res.headers.get('retry-after')
    const retryAfter = retryAfterHeader ? Number(retryAfterHeader) : null
    let message = `${provider} is temporarily unavailable.`

    try {
      const data = await res.json()
      message = data.error?.message || message
    } catch {
      message = `${provider} is temporarily unavailable.`
    }

    throw new AiProviderError(provider, message, res.status, retryAfter)
  }

  const data = await res.json()
  return data.choices?.[0]?.message?.content || ''
}

function isFallbackError(err: unknown) {
  if (!(err instanceof AiProviderError)) return false
  return err.status === 408 || err.status === 409 || err.status === 429 || err.status >= 500
}

function isFinalQuestion(reply: string) {
  return (
    /[?]\s*$/.test(reply) ||
    /\byes or no\b/i.test(reply) ||
    /\blast question\b/i.test(reply)
  )
}

function logAiProviderError(err: AiProviderError) {
  console.warn('AI provider failed, trying fallback:', {
    provider: err.provider,
    status: err.status,
    retryAfter: err.retryAfter,
    message: err.message,
  })
}

function logRouteError(err: unknown) {
  if (err instanceof AiProviderError) {
    console.error('AI provider error:', {
      provider: err.provider,
      status: err.status,
      retryAfter: err.retryAfter,
      message: err.message,
    })
    return
  }

  console.error('Chat route error:', err)
}

async function callGroq(systemPrompt: string, messages: Message[]): Promise<string> {
  return callOpenAiCompatibleProvider(
    'Groq',
    'https://api.groq.com/openai/v1',
    process.env.GROQ_API_KEY,
    process.env.GROQ_MODEL || 'llama-3.1-8b-instant',
    systemPrompt,
    messages
  )
}

async function callOpenRouter(systemPrompt: string, messages: Message[]): Promise<string> {
  return callOpenAiCompatibleProvider(
    'OpenRouter',
    'https://openrouter.ai/api/v1',
    process.env.OPENROUTER_API_KEY,
    process.env.OPENROUTER_MODEL || 'qwen/qwen3-8b:free',
    systemPrompt,
    messages,
    {
      'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      'X-Title': 'CrushCode',
    }
  )
}

async function callAi(systemPrompt: string, messages: Message[]): Promise<string> {
  const providers = [callGemini, callGroq, callOpenRouter]
  const errors: AiProviderError[] = []

  for (const provider of providers) {
    try {
      const reply = await provider(systemPrompt, messages)
      if (reply.trim()) return reply
      throw new AiProviderError(provider.name, 'The AI provider returned an empty response.', 502)
    } catch (err) {
      if (err instanceof AiProviderError) {
        errors.push(err)
      }

      if (!isFallbackError(err)) {
        throw err
      }

      if (err instanceof AiProviderError) {
        logAiProviderError(err)
      }
    }
  }

  const lastError = errors[errors.length - 1]
  throw new AiProviderError(
    'AI',
    'All AI providers are temporarily unavailable.',
    lastError?.status || 503,
    lastError?.retryAfter || null
  )
}

export async function POST(req: NextRequest) {
  try {
    const { conversationId, sessionCode, userMessage } = await req.json()

    const { data: session } = await supabaseAdmin
      .from('sessions')
      .select('*')
      .eq('code', sessionCode)
      .single()

    if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 })

    if (session.expires_at && new Date(session.expires_at).getTime() < Date.now()) {
      return NextResponse.json(
        { error: 'This quiz link expired. Ask them to generate a new one.' },
        { status: 410 }
      )
    }

    let conversation
    if (conversationId) {
      const { data } = await supabaseAdmin
        .from('conversations')
        .select('*')
        .eq('id', conversationId)
        .single()
      conversation = data
    }

    if (!conversation) {
      const { data } = await supabaseAdmin
        .from('conversations')
        .insert({ session_id: session.id, messages: [], outcome: 'pending' })
        .select()
        .single()
      conversation = data
    }

    const messages: Message[] = conversation.messages || []

    if (userMessage) {
      messages.push({ role: 'user', content: userMessage })
    }

    const rawReply = await callAi(
      buildSystemPrompt(session.host_name, session.host_description || ''),
      messages
    )

    const cleanReply = cleanMessage(rawReply)
    const outcome = parseOutcome(rawReply)
    const storedReply = cleanReply

    messages.push({ role: 'assistant', content: storedReply })

    const updatePayload: Record<string, unknown> = {
      messages,
      updated_at: new Date().toISOString(),
    }

    if (outcome) {
      updatePayload.score = outcome.score
      updatePayload.outcome = outcome.outcome

      if (outcome.outcome === 'green') {
        await sendEmail(
          session.host_email,
          'Green light - go ask them!',
          `
            <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:2rem;">
              <h2 style="color:#111;">Good news, ${session.host_name}!</h2>
              <p style="color:#444;font-size:15px;">The quiz is done. Based on the full conversation, things look very promising.</p>
              <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:1rem;margin:1.5rem 0;">
                <div style="font-size:13px;color:#166534;">Confidence score</div>
                <div style="font-size:32px;font-weight:700;color:#15803d;">${outcome.score}/100</div>
              </div>
              <p style="color:#444;font-size:15px;">They said they'd be open if you asked. Now's your moment - go for it!</p>
            </div>
          `
        )
      } else {
        await sendEmail(
          session.host_email,
          'Quiz done - here\'s the result',
          `
            <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:2rem;">
              <h2 style="color:#111;">Hey ${session.host_name}</h2>
              <p style="color:#444;font-size:15px;">The quiz is done.</p>
              <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:1rem;margin:1.5rem 0;">
                <div style="font-size:13px;color:#6b7280;">Confidence score</div>
                <div style="font-size:32px;font-weight:700;color:#374151;">${outcome.score}/100</div>
              </div>
              <p style="color:#444;font-size:15px;">Not quite the romantic signal yet - but they're open to hanging out as friends. That's still a great starting point.</p>
            </div>
          `
        )
      }
    }

    await supabaseAdmin
      .from('conversations')
      .update(updatePayload)
      .eq('id', conversation.id)

    return NextResponse.json({
      reply: cleanReply,
      conversationId: conversation.id,
      outcome: outcome ? outcome.outcome : null,
      score: outcome ? outcome.score : null,
      done: !!outcome,
    })
  } catch (err) {
    logRouteError(err)
    if (err instanceof AiProviderError && err.status === 429) {
      return NextResponse.json(
        {
          error: 'All AI provider quota limits were reached. Please wait a little and try again, or add another fallback API key/model.',
          retryAfter: err.retryAfter,
        },
        { status: 429 }
      )
    }

    if (err instanceof AiProviderError) {
      return NextResponse.json({ error: err.message }, { status: err.status })
    }

    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
