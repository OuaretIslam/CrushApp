import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

const ADJECTIVES = ['crush', 'heart', 'vibe', 'spark', 'glow', 'fire', 'moon', 'sun', 'rose', 'star']
const NOUNS = ['wave', 'dream', 'night', 'light', 'soul', 'code', 'link', 'bond', 'joy', 'beat']

function generateCode(): string {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)]
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)]
  return `${adj}-${noun}`
}

export async function POST(req: NextRequest) {
  try {
    const { hostName, hostDescription, hostEmail } = await req.json()

    if (!hostName || !hostEmail) {
      return NextResponse.json({ error: 'Name and email required' }, { status: 400 })
    }

    await supabaseAdmin
      .from('sessions')
      .delete()
      .lt('expires_at', new Date().toISOString())

    let code = generateCode()
    let attempts = 0

    // make sure code is unique
    while (attempts < 10) {
      const { data } = await supabaseAdmin.from('sessions').select('id').eq('code', code).single()
      if (!data) break
      code = generateCode()
      attempts++
    }

    const { data: session, error } = await supabaseAdmin
      .from('sessions')
      .insert({
        code,
        host_name: hostName,
        host_description: hostDescription,
        host_email: hostEmail,
        expires_at: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ code: session.code, sessionId: session.id })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to create session' }, { status: 500 })
  }
}
