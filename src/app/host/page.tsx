'use client'
import { useState } from 'react'

export default function HostPage() {
  const [step, setStep] = useState<'form' | 'done'>('form')
  const [loading, setLoading] = useState(false)
  const [code, setCode] = useState('')
  const [copied, setCopied] = useState(false)
  const [form, setForm] = useState({ name: '', description: '', email: '' })

  const appUrl = typeof window !== 'undefined'
    ? window.location.origin
    : process.env.NEXT_PUBLIC_APP_URL || ''

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hostName: form.name,
          hostDescription: form.description,
          hostEmail: form.email,
        }),
      })
      const data = await res.json()
      if (data.code) {
        setCode(data.code)
        setStep('done')
      }
    } catch {
      alert('Something went wrong, try again')
    }
    setLoading(false)
  }

  const link = `${appUrl}/session/${code}`

  function copyLink() {
    navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (step === 'done') {
    return (
      <main className="app-shell">
        <div className="stack">
          <div className="brand">
            <div className="brand-mark">OK</div>
            <h1 className="title">Your link is ready</h1>
            <p className="subtitle">Send it however feels natural. The link works for 3 days.</p>
          </div>

          <section className="panel">
            <div className="hint">Your link</div>
            <div className="link-box">
              <div className="link-text">{link}</div>
              <button className="primary-button" onClick={copyLink}>
                {copied ? 'Copied' : 'Copy link'}
              </button>
            </div>

            <div className="link-box">
              <div className="hint">Session code</div>
              <div className="code-text">{code}</div>
              <p className="hint" style={{ marginTop: 8 }}>
                They can also enter this code at {appUrl}. It expires in 3 days.
              </p>
            </div>
          </section>

          <p className="fine-print">We will email you at <strong>{form.email}</strong> when the quiz is done.</p>
        </div>
      </main>
    )
  }

  return (
    <main className="app-shell">
      <div className="stack">
        <div className="brand">
          <div className="brand-mark">CC</div>
          <h1 className="title">Create a quiet signal</h1>
          <p className="subtitle">Set up a short chat that helps you read the room before asking directly.</p>
        </div>

        <form className="panel form-stack" onSubmit={handleSubmit}>
          <div>
            <label className="label">Your name</label>
            <input
              className="input"
              required
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="What should they call you?"
            />
          </div>

          <div>
            <label className="label">A little context <span className="hint">(optional)</span></label>
            <textarea
              className="textarea"
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="e.g. same class, same friend group, basketball together..."
              rows={3}
            />
            <div className="hint" style={{ marginTop: 6 }}>This helps the AI make the chat feel natural.</div>
          </div>

          <div>
            <label className="label">Your email</label>
            <input
              className="input"
              required
              type="email"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              placeholder="For your private result notification"
            />
          </div>

          <button className="primary-button" type="submit" disabled={loading}>
            {loading ? 'Creating your link...' : 'Generate my link'}
          </button>
        </form>

        <p className="fine-print">They will never know it was you unless the conversation turns green.</p>
      </div>
    </main>
  )
}
