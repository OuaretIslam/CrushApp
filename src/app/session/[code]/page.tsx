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
  const [startError, setStartError] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function startChat() {
    setStarted(true)
    setStartError('')
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
      setStartError(err instanceof Error ? err.message : 'Could not start the quiz. Check the code and try again.')
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
      const message = err instanceof Error ? err.message : 'Oops, something glitched. Try sending again.'
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
      <main className="app-shell">
        <div className="stack">
          <div className="brand">
            <div className="brand-mark">?</div>
            <h1 className="title">Someone made a vibe check for you</h1>
            <p className="subtitle">A quick chat. No wrong answers, just answer honestly.</p>
          </div>

          <section className="panel">
            {startError && (
              <div className="link-box" style={{ marginTop: 0, marginBottom: 14 }}>
                <div className="hint">{startError}</div>
              </div>
            )}
            <button className="primary-button" onClick={startChat} disabled={loading}>
              {loading ? 'Starting...' : 'Start the chat'}
            </button>
          </section>

          <p className="fine-print">Takes about 5 minutes. This link expires 3 days after it was created.</p>
        </div>
      </main>
    )
  }

  return (
    <main className="chat-shell">
      <div className="chat-header">
        <div className="chat-avatar">CC</div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 750 }}>Vibe check</div>
          <div className="hint">anonymous quiz</div>
        </div>
      </div>

      <div className="chat-feed">
        {messages.map((msg, i) => (
          <div className={`message-row ${msg.role === 'user' ? 'user' : ''}`} key={i}>
            <div className={`bubble ${msg.role}`}>{msg.content}</div>
          </div>
        ))}

        {loading && (
          <div className="message-row">
            <div className="typing">
              <span />
              <span />
              <span />
            </div>
          </div>
        )}

        {done && (
          <div className="link-box" style={{ textAlign: 'center' }}>
            <div className="hint">
              {outcome === 'green'
                ? 'Quiz done. You gave the honest answer, and that is the brave part.'
                : 'All done. Thanks for taking the quiz.'}
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {!done && (
        <div className="chat-input-bar">
          <input
            className="input"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Type your answer..."
            disabled={loading}
          />
          <button className="send-button" onClick={sendMessage} disabled={loading || !input.trim()}>
            ^
          </button>
        </div>
      )}
    </main>
  )
}
