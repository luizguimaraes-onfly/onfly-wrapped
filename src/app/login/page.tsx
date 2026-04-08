'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { signIn, useSession } from 'next-auth/react'
import { motion } from 'framer-motion'
import { gradients, primaryButtonStyle, inputBorder } from '@/lib/design'

function LoginContent() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const { status }   = useSession()

  const [devEmail,  setDevEmail]  = useState('')
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState<string | null>(null)
  const [providers, setProviders] = useState<string[]>([])

  useEffect(() => {
    fetch('/api/auth/providers')
      .then(r => r.json())
      .then(d => setProviders(Object.keys(d ?? {})))
  }, [])

  // Redirecionar se já autenticado
  useEffect(() => {
    if (status === 'authenticated') router.replace('/')
  }, [status, router])

  // Processar token do callback do Onfly OAuth
  useEffect(() => {
    const onflyToken  = searchParams.get('onflyToken')
    const callbackUrl = searchParams.get('callbackUrl') ?? '/'
    if (!onflyToken) return

    setLoading(true)
    signIn('onfly-sso', { onflyToken, callbackUrl, redirect: false })
      .then(result => {
        if (result?.ok) router.replace(callbackUrl)
        else setError('Não foi possível criar a sessão. Tente novamente.')
      })
      .catch(() => setError('Erro inesperado. Tente novamente.'))
      .finally(() => setLoading(false))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Exibir erros vindos do OAuth
  useEffect(() => {
    const errParam = searchParams.get('error')
    if (errParam) setError(`Erro de autenticação: ${errParam.replace(/_/g, ' ')}`)
  }, [searchParams])

  const handleOnflyLogin = () => {
    setLoading(true)
    const callbackUrl = searchParams.get('callbackUrl') ?? '/'
    window.location.href = `/api/auth/onfly/login?callbackUrl=${encodeURIComponent(callbackUrl)}`
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden px-4"
      style={{ background: gradients.background }}>

      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-sm bg-white rounded-3xl p-8 flex flex-col gap-6"
        style={{ boxShadow: '0 20px 60px rgba(40,114,250,0.12), 0 4px 16px rgba(0,0,0,0.06)' }}>

        {/* Logo + título */}
        <div className="flex flex-col items-center text-center gap-2">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-1"
            style={{ background: gradients.primary, boxShadow: '0 8px 24px rgba(40,114,250,0.35)' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-onfly.svg" alt="Onfly" className="w-9 h-9 brightness-0 invert" />
          </div>
          <h1 className="text-2xl font-black text-[#0d1b2e]">Onfly Wrapped</h1>
          <p className="text-[#0d1b2e]/50 text-sm">Sua retrospectiva de viagens corporativas</p>
        </div>

        {/* Erro */}
        {error && (
          <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-100">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {loading || status === 'loading' ? (
          <div className="flex flex-col items-center gap-3 py-4">
            <div className="w-8 h-8 border-2 border-[#2872fa]/30 border-t-[#2872fa] rounded-full animate-spin" />
            <p className="text-[#0d1b2e]/50 text-sm">Autenticando…</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <button onClick={handleOnflyLogin}
              className="w-full min-h-[48px] py-3 rounded-xl font-semibold text-white flex items-center justify-center gap-3 transition-all hover:brightness-110"
              style={{ background: gradients.primary }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo-onfly.svg" alt="" className="w-5 h-5 brightness-0 invert" />
              Entrar com Onfly
            </button>

            {/* Dev mode */}
            {providers.includes('dev') && (
              <div className="flex flex-col gap-2 pt-2 border-t border-[#0d1b2e]/08">
                <p className="text-[#0d1b2e]/35 text-xs text-center">Dev mode — sem OAuth</p>
                <input type="email" value={devEmail} onChange={e => setDevEmail(e.target.value)}
                  placeholder="seu@onfly.com.br"
                  className="w-full px-4 min-h-[44px] py-2.5 rounded-xl text-[#0d1b2e] text-sm outline-none"
                  style={{ background: '#ffffff', border: inputBorder }}
                  onKeyDown={e => e.key === 'Enter' && signIn('dev', { email: devEmail, callbackUrl: '/' })} />
                <button
                  onClick={() => signIn('dev', { email: devEmail, callbackUrl: '/' })}
                  disabled={!devEmail.includes('@')}
                  className="w-full min-h-[44px] py-2.5 rounded-xl font-semibold text-sm transition-all disabled:opacity-40"
                  style={{ ...primaryButtonStyle }}>
                  Entrar (dev)
                </button>
              </div>
            )}
          </div>
        )}
      </motion.div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#eef3ff' }}>
        <div className="w-8 h-8 border-2 border-[#2872fa]/30 border-t-[#2872fa] rounded-full animate-spin" />
      </div>
    }>
      <LoginContent />
    </Suspense>
  )
}
