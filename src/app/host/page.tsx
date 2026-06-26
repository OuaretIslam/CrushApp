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
      alert('Something went wong, try again')
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
      <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fafaf9', padding: '2rem' }}>
        <div style={{ maxWidth: 460, width: '100%', textAlign: 'center' }}>
          <div className="logo-mark soft">OK</div>
          <h1 style={{ fontSize: 24, fontWeight: 600, color: '#1a1a1a', marginBottom: 8 }}>Your link is ready</h1>
          <p style={{ color: '#666', marginBottom: '2rem', fontSize: 15 }}>Send this to them however feels natural - WhatsApp, Instagram, anywhere. The link works for 3 days.</p>

          <div style={{ background: '#fff', border: '1px solid #e5e5e5', borderRadius: 12, padding: '1.25rem', marginBottom: '1rem' }}>
            <div style={{ fontSize: 12, color: '#999', marginBottom: 6, textAlign: 'left' }}>Your link</div>
            <div style={{ fontSize: 14, color: '#333', wordBreak: 'break-all', marginBottom: '1rem', textAlign: 'left' }}>{link}</div>
            <button
              onClick={copyLink}
              style={{ width: '100%', padding: '12px', background: copied ? '#10b981' : '#111', color: '#fff', border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 500, cursor: 'pointer', transition: 'background 0.2s' }}
            >
              {copied ? 'Copied!' : 'Copy link'}
            </button>
          </div>

          <div style={{ background: '#fff', border: '1px solid #e5e5e5', borderRadius: 12, padding: '1.25rem', textAlign: 'left' }}>
            <div style={{ fontSize: 12, color: '#999', marginBottom: 8 }}>Your session code</div>
            <div style={{ fontSize: 22, fontWeight: 600, color: '#111', letterSpacing: '0.02em' }}>{code}</div>
            <div style={{ fontSize: 13, color: '#888', marginTop: 4 }}>You can also tell them the code and they can enter it at {appUrl}. It expires in 3 days.</div>
          </div>

          <p style={{ fontSize: 13, color: '#aaa', marginTop: '1.5rem' }}>We'll email you at <strong>{form.email}</strong> the moment the quiz is done.</p>
        </div>
      </main>
    )
  }

  return (
    <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fafaf9', padding: '2rem' }}>
      <div style={{ maxWidth: 460, width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div className="logo-mark">CC</div>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: '#1a1a1a', marginBottom: 8 }}>CrushCode</h1>
          <p style={{ color: '#666', fontSize: 15, lineHeight: 1.6 }}>Find out if they like you back - without the awkward part.</p>
        </div>

        <form onSubmit={handleSubmit} style={{ background: '#fff', border: '1px solid #e5e5e5', borderRadius: 16, padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#444', marginBottom: 6 }}>Your name</label>
            <input
              required
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="What should they call you?"
              style={{ width: '100%', padding: '10px 14px', border: '1px solid #e0e0e0', borderRadius: 8, fontSize: 15, outline: 'none', boxSizing: 'border-box' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#444', marginBottom: 6 }}>A little about yourself <span style={{ color: '#aaa', fontWeight: 400 }}>(optional)</span></label>
            <textarea
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="e.g. we're in the same class, we play basketball together..."
              rows={3}
              style={{ width: '100%', padding: '10px 14px', border: '1px solid #e0e0e0', borderRadius: 8, fontSize: 15, resize: 'none', outline: 'none', boxSizing: 'border-box' }}
            />
            <div style={{ fontSize: 12, color: '#aaa', marginTop: 4 }}>This helps the AI make the conversation feel natural</div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#444', marginBottom: 6 }}>Your email</label>
            <input
              required
              type="email"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              placeholder="For your private result notification"
              style={{ width: '100%', padding: '10px 14px', border: '1px solid #e0e0e0', borderRadius: 8, fontSize: 15, outline: 'none', boxSizing: 'border-box' }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{ padding: '13px', background: '#111', color: '#fff', border: 'none', borderRadius: 10, fontSize: 16, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, marginTop: 4 }}
          >
            {loading ? 'Creating your link...' : 'Generate my link ->'}
          </button>
        </form>

        <p style={{ textAlign: 'center', fontSize: 12, color: '#bbb', marginTop: '1.25rem' }}>They'll never know it was you - unless they say yes.</p>
      </div>
    </main>
  )
}
