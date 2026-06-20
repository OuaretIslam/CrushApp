'use client'
import { useState, useEffect, useRef } from 'react'
import { useParams } from 'next/navigation'

type Message = { role: 'user' | 'assistant'; content: string }

export default function SessionPage() {
  const params = useParams()
  const code = params.code as string

  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const [outcome, setOutcome] = useState<string | null>(null)
  const [started, setStarted] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function startChat() {
    setStarted(true)
    setLoading(true)
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionCode: code, conversationId: null, userMessage: null }),
      })
      const data = await res.json()
      if (!res.ok) {
        const waitText = data.retryAfter ? ` Try again in about ${data.retryAfter} seconds.` : ''
        throw new Error(`${data.error || 'Could not start the quiz.'}${waitText}`)
      }
      if (data.reply) {
        setMessages([{ role: 'assistant', content: data.reply }])
        setConversationId(data.conversationId)
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Could not start the quiz. Check the code and try again.')
      setStarted(false)
    }
    setLoading(false)
  }

  async function sendMessage() {
    if (!input.trim() || loading || done) return
    const userMsg = input.trim()
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: userMsg }])
    setLoading(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionCode: code, conversationId, userMessage: userMsg }),
      })
      const data = await res.json()
      if (!res.ok) {
        const waitText = data.retryAfter ? ` Try again in about ${data.retryAfter} seconds.` : ''
        throw new Error(`${data.error || 'Something went wrong.'}${waitText}`)
      }
      if (data.reply) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.reply }])
        if (data.conversationId) setConversationId(data.conversationId)
        if (data.done) {
          setDone(true)
          setOutcome(data.outcome)
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Oops, something glitched. Try sending again!'
      setMessages(prev => [...prev, { role: 'assistant', content: message }])
    }
    setLoading(false)
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  if (!started) {
    return (
      <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fafaf9', padding: '2rem' }}>
        <div style={{ maxWidth: 400, width: '100%', textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: '1rem' }}>*</div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1a1a1a', marginBottom: 10 }}>Someone made a vibe check for you</h1>
          <p style={{ color: '#666', fontSize: 15, lineHeight: 1.6, marginBottom: '2rem' }}>It's a quick chat - just answer honestly. No wrong answers, promise.</p>
          <button
            onClick={startChat}
            style={{ padding: '14px 32px', background: '#111', color: '#fff', border: 'none', borderRadius: 10, fontSize: 16, fontWeight: 600, cursor: 'pointer' }}
          >
            Let's go -&gt;
          </button>
          <p style={{ fontSize: 12, color: '#bbb', marginTop: '1rem' }}>Takes about 5 minutes</p>
        </div>
      </main>
    )
  }

  return (
    <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#fafaf9' }}>
      <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #eee', background: '#fff', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>*</div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#111' }}>Vibe check</div>
          <div style={{ fontSize: 12, color: '#aaa' }}>anonymous quiz</div>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {messages.map((msg, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
            }}
          >
            <div style={{
              maxWidth: '78%',
              padding: '10px 14px',
              borderRadius: msg.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
              background: msg.role === 'user' ? '#111' : '#fff',
              color: msg.role === 'user' ? '#fff' : '#1a1a1a',
              fontSize: 15,
              lineHeight: 1.5,
              border: msg.role === 'assistant' ? '1px solid #eee' : 'none',
            }}>
              {msg.content}
            </div>
          </div>
        ))}

        {loading && (
          <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <div style={{ padding: '10px 16px', borderRadius: '18px 18px 18px 4px', background: '#fff', border: '1px solid #eee', display: 'flex', gap: 4, alignItems: 'center' }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#ccc', animation: 'pulse 1s infinite 0s' }} />
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#ccc', animation: 'pulse 1s infinite 0.2s' }} />
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#ccc', animation: 'pulse 1s infinite 0.4s' }} />
            </div>
          </div>
        )}

        {done && (
          <div style={{ textAlign: 'center', padding: '1.5rem 1rem', color: '#666', fontSize: 14 }}>
            {outcome === 'green'
              ? 'Quiz done! You were honest and that\'s all that matters.'
              : 'All done! Thanks for taking the quiz.'}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {!done && (
        <div style={{ padding: '1rem 1.25rem', borderTop: '1px solid #eee', background: '#fff', display: 'flex', gap: 10 }}>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Type your answer..."
            disabled={loading}
            style={{ flex: 1, padding: '11px 16px', border: '1px solid #e0e0e0', borderRadius: 24, fontSize: 15, outline: 'none', background: '#fafaf9' }}
          />
          <button
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            style={{ width: 44, height: 44, borderRadius: '50%', background: '#111', border: 'none', color: '#fff', fontSize: 18, cursor: 'pointer', opacity: loading || !input.trim() ? 0.4 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
          >
            ^
          </button>
        </div>
      )}

      <style>{`@keyframes pulse { 0%,100%{opacity:.3} 50%{opacity:1} }`}</style>
    </main>
  )
}
