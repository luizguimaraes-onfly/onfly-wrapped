'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ORBS, gradients, cardStyle, primaryButtonStyle, inputBorder } from '@/lib/design'

const YEARS   = [2025, 2024, 2023]
const PERIODS = [
  { value: 'year', label: 'Ano completo' },
  { value: 'q1',   label: 'Q1 (Jan–Mar)' },
  { value: 'q2',   label: 'Q2 (Abr–Jun)' },
  { value: 'q3',   label: 'Q3 (Jul–Set)' },
  { value: 'q4',   label: 'Q4 (Out–Dez)' },
]

interface Employee {
  id: string | number
  email: string
  name?: string
  first_name?: string
  company?: { id: string | number; social_name?: string; name?: string }
}

export default function HomePage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [period, setPeriod]           = useState('year')
  const [year, setYear]               = useState(2025)
  const [resolving, setResolving]     = useState(false)
  const [companyId, setCompanyId]     = useState<string>('')
  const [companyName, setCompanyName] = useState<string>('')
  const [email, setEmail]             = useState<string>('')
  const [displayName, setDisplayName] = useState<string>('')

  useEffect(() => {
    if (status !== 'authenticated') return

    // Se a sessão já tem companyId, usa direto
    if (session?.user?.companyId) {
      setCompanyId(session.user.companyId)
      setCompanyName(session.user.companyName ?? '')
      setEmail(session.user.email ?? '')
      setDisplayName(session.user.name ?? session.user.email ?? '')
      return
    }

    // Email da sessão como fallback imediato
    if (session?.user?.email) setEmail(session.user.email)

    setResolving(true)
    fetch('/api/me')
      .then(r => r.json())
      .then((body: { data?: Employee }) => {
        console.log('[/api/me] response:', JSON.stringify(body))
        const emp = body?.data
        if (!emp) return
        setEmail(emp.email ?? session?.user?.email ?? '')
        setDisplayName(emp.name ?? emp.first_name ?? emp.email)
        if (emp.company?.id) {
          setCompanyId(String(emp.company.id))
          setCompanyName(emp.company.social_name ?? emp.company.name ?? '')
        }
      })
      .catch(console.error)
      .finally(() => setResolving(false))
  }, [status, session])

  const goCompany  = () => companyId && router.push(`/wrapped/${companyId}?period=${period}&year=${year}`)
  const goTraveler = () => companyId && email && router.push(`/wrapped/${companyId}/${encodeURIComponent(email)}?period=${period}&year=${year}`)

  const loading = status === 'loading' || resolving

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden px-4"
      style={{ background: gradients.background }}>

      {ORBS.map((orb, i) => (
        <motion.div key={i} className="absolute rounded-full blur-3xl pointer-events-none"
          style={{ width: orb.size, height: orb.size, background: orb.color, opacity: 0.08, left: orb.x, top: orb.y }}
          animate={{ scale: [1, 1.12, 1], opacity: [0.06, 0.11, 0.06] }}
          transition={{ duration: 4 + i * 0.6, repeat: Infinity, delay: orb.delay }} />
      ))}

      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-sm rounded-3xl p-8 flex flex-col gap-6"
        style={cardStyle}>

        {/* Header */}
        <div className="flex flex-col items-center text-center gap-2">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-1 overflow-hidden"
            style={{ background: gradients.primary, boxShadow: '0 8px 24px rgba(40,114,250,0.35)' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-onfly.svg" alt="Onfly" className="w-9 h-9 brightness-0 invert" />
          </div>
          <h1 className="text-2xl font-black text-[#0d1b2e]">Onfly Wrapped</h1>
          <p className="text-[#0d1b2e]/60 text-sm">Sua retrospectiva de viagens corporativas</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-8 h-8 border-2 border-[#2872fa]/30 border-t-[#2872fa] rounded-full animate-spin" />
          </div>
        ) : (
          <div className="flex flex-col gap-5">

            {/* User info */}
            <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-[#2872fa]/06 border border-[#2872fa]/15">
              {session?.user?.image && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={session.user.image} alt="" className="w-8 h-8 rounded-full flex-shrink-0" />
              )}
              <div className="min-w-0 flex-1">
                <p className="text-[#0d1b2e]/80 text-sm font-semibold truncate">{displayName || session?.user?.name || session?.user?.email}</p>
                {companyName && (
                  <p className="text-[#0d1b2e]/45 text-xs truncate">{companyName}</p>
                )}
              </div>
            </div>

            {/* Period + Year */}
            <div className="flex gap-3">
              <div className="flex flex-col gap-1 flex-1">
                <label className="text-xs font-semibold text-[#0d1b2e]/45 uppercase tracking-wider">Período</label>
                <select value={period} onChange={e => setPeriod(e.target.value)}
                  className="px-3 min-h-[44px] py-2.5 rounded-xl text-sm text-[#0d1b2e] outline-none cursor-pointer"
                  style={{ background: '#ffffff', border: inputBorder }}>
                  {PERIODS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1 w-24">
                <label className="text-xs font-semibold text-[#0d1b2e]/45 uppercase tracking-wider">Ano</label>
                <select value={year} onChange={e => setYear(Number(e.target.value))}
                  className="px-3 min-h-[44px] py-2.5 rounded-xl text-sm text-[#0d1b2e] outline-none cursor-pointer"
                  style={{ background: '#ffffff', border: inputBorder }}>
                  {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
            </div>

            {/* Menu */}
            <div className="flex flex-col gap-2.5">
              <button onClick={goTraveler} disabled={!companyId || !email}
                className="w-full min-h-[52px] py-3 rounded-xl font-semibold text-white transition-all hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed text-sm"
                style={primaryButtonStyle}>
                ✈️ Retrospectiva do Colaborador
              </button>
              <button onClick={goCompany} disabled={!companyId}
                className="w-full min-h-[52px] py-3 rounded-xl font-semibold transition-all hover:bg-[#0d1b2e]/06 disabled:opacity-40 disabled:cursor-not-allowed text-[#0d1b2e] text-sm"
                style={{ border: '1.5px solid rgba(13,27,46,0.15)' }}>
                🏢 Retrospectiva da Empresa
              </button>
              <button onClick={() => signOut({ callbackUrl: '/login' })}
                className="w-full min-h-[44px] py-2.5 rounded-xl text-sm font-medium text-[#0d1b2e]/45 hover:text-[#0d1b2e]/70 transition-colors">
                Sair
              </button>
            </div>

            {/* Link para devmode */}
            <p className="text-center text-[10px] text-[#0d1b2e]/25">
              <a href="/devmode" className="hover:text-[#0d1b2e]/50 transition-colors">Busca manual</a>
            </p>

          </div>
        )}
      </motion.div>
    </div>
  )
}
