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
    <main className="app-shell">
      <div className="stack">
        <div className="brand">
          <div className="brand-mark">CC</div>
          <h1 className="title">CrushCode</h1>
          <p className="subtitle">Find out if they feel the same without making the first move awkward.</p>
        </div>

        <section className="panel">
          <button className="primary-button" onClick={() => router.push('/host')}>
            Create my link
          </button>

          <div className="divider">or enter a code</div>

          <form onSubmit={enterCode} style={{ display: 'flex', gap: 8 }}>
            <input
              className="input"
              value={code}
              onChange={e => setCode(e.target.value)}
              placeholder="e.g. crush-star"
              style={{ flex: 1 }}
            />
            <button className="secondary-button" type="submit">
              Go
            </button>
          </form>
        </section>

        <p className="fine-print">Private by default. They only learn who sent it if the conversation gets there.</p>
      </div>
    </main>
  )
}
