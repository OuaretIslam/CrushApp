'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function Home() {
  const router = useRouter()
  const [code, setCode] = useState('')

  function enterCode(e: React.FormEvent) {
    e.preventDefault()
    if (code.trim()) router.push(`/session/${code.trim().toLowerCase()}`)
  }

  return (
    <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#fafaf9', padding: '2rem', gap: '2rem' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 52, marginBottom: 12 }}>CC</div>
        <h1 style={{ fontSize: 32, fontWeight: 800, color: '#1a1a1a', marginBottom: 8 }}>CrushCode</h1>
        <p style={{ color: '#666', fontSize: 16, maxWidth: 340, margin: '0 auto' }}>
          Find out if they feel the same - without saying a word.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%', maxWidth: 360 }}>
        <button
          onClick={() => router.push('/host')}
          style={{ padding: '14px', background: '#111', color: '#fff', border: 'none', borderRadius: 12, fontSize: 16, fontWeight: 600, cursor: 'pointer' }}
        >
          Create my link -&gt;
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ flex: 1, height: 1, background: '#e5e5e5' }} />
          <span style={{ fontSize: 13, color: '#aaa' }}>or enter a code</span>
          <div style={{ flex: 1, height: 1, background: '#e5e5e5' }} />
        </div>

        <form onSubmit={enterCode} style={{ display: 'flex', gap: 8 }}>
          <input
            value={code}
            onChange={e => setCode(e.target.value)}
            placeholder="e.g. crush-star"
            style={{ flex: 1, padding: '11px 14px', border: '1px solid #e0e0e0', borderRadius: 10, fontSize: 15, outline: 'none' }}
          />
          <button
            type="submit"
            style={{ padding: '11px 16px', background: '#fff', border: '1px solid #e0e0e0', borderRadius: 10, fontSize: 15, cursor: 'pointer', fontWeight: 500 }}
          >
            Go
          </button>
        </form>
      </div>

      <p style={{ fontSize: 12, color: '#bbb', textAlign: 'center', maxWidth: 280 }}>
        100% private. They'll never know who sent it unless they say yes.
      </p>
    </main>
  )
}
