'use client'

import { useEffect, useState } from 'react'
import type { LinkedInStatusResponse } from '@/lib/linkedin/types'

type State = 'loading' | 'disconnected' | 'active' | 'expired'

export default function LinkedInConnect() {
  const [state, setState]       = useState<State>('loading')
  const [account, setAccount]   = useState<LinkedInStatusResponse | null>(null)
  const [working, setWorking]   = useState(false)

  useEffect(() => {
    fetch('/api/auth/linkedin/status')
      .then(r => r.json())
      .then((data: LinkedInStatusResponse) => {
        if (!data.connected) {
          setState('disconnected')
        } else if (data.status === 'EXPIRED') {
          setState('expired')
          setAccount(data)
        } else {
          setState('active')
          setAccount(data)
        }
      })
      .catch(() => setState('disconnected'))
  }, [])

  async function connect() {
    setWorking(true)
    const returnTo = encodeURIComponent(window.location.pathname + window.location.search)
    window.location.href = `/api/auth/linkedin/login?returnTo=${returnTo}`
  }

  async function disconnect() {
    setWorking(true)
    await fetch('/api/auth/linkedin/disconnect', { method: 'DELETE' })
    setState('disconnected')
    setAccount(null)
    setWorking(false)
  }

  if (state === 'loading') {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-xl opacity-40">
        <div className="w-4 h-4 border-2 border-[#0A66C2]/40 border-t-[#0A66C2] rounded-full animate-spin" />
        <span className="text-xs text-[#0d1b2e]/50">LinkedIn</span>
      </div>
    )
  }

  if (state === 'active' && account) {
    return (
      <div className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl"
        style={{ background: 'rgba(10,102,194,0.07)', border: '1px solid rgba(10,102,194,0.18)' }}>
        <div className="flex items-center gap-2.5 min-w-0">
          {account.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={account.avatarUrl} alt="" className="w-7 h-7 rounded-full flex-shrink-0 ring-2 ring-[#0A66C2]/30" />
          ) : (
            <LinkedInIcon className="w-5 h-5 text-[#0A66C2] flex-shrink-0" />
          )}
          <div className="min-w-0">
            <p className="text-xs font-semibold text-[#0d1b2e]/80 truncate">
              {account.displayName ?? 'LinkedIn conectado'}
            </p>
            {account.daysUntilExpiry !== undefined && account.daysUntilExpiry <= 7 && (
              <p className="text-[10px] text-amber-600">
                Expira em {account.daysUntilExpiry}d
              </p>
            )}
          </div>
        </div>
        <button
          onClick={disconnect}
          disabled={working}
          className="text-[10px] text-[#0d1b2e]/35 hover:text-red-500 transition-colors flex-shrink-0 font-medium"
        >
          {working ? '…' : 'Desconectar'}
        </button>
      </div>
    )
  }

  if (state === 'expired') {
    return (
      <button
        onClick={connect}
        disabled={working}
        className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl font-semibold text-sm text-amber-700 transition-all hover:bg-amber-50 disabled:opacity-50"
        style={{ background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.35)' }}
      >
        <LinkedInIcon className="w-4 h-4" />
        {working ? 'Redirecionando…' : 'Reconectar LinkedIn'}
      </button>
    )
  }

  return (
    <button
      onClick={connect}
      disabled={working}
      className="w-full flex items-center justify-center gap-2 min-h-[44px] px-3 py-2.5 rounded-xl font-semibold text-sm text-white transition-all hover:brightness-110 disabled:opacity-50"
      style={{ background: '#0A66C2', boxShadow: '0 4px 12px rgba(10,102,194,0.35)' }}
    >
      <LinkedInIcon className="w-4 h-4 text-white" />
      {working ? 'Redirecionando…' : 'Conectar LinkedIn'}
    </button>
  )
}

function LinkedInIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  )
}
