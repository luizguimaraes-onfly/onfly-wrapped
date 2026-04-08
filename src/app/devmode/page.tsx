'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ORBS, gradients, cardStyle, primaryButtonStyle, inputBorder, inputBorderFocus } from '@/lib/design'

interface Company  { company_id: number; name: string }
interface Traveler { email: string; name: string | null }

const YEARS  = [2025, 2024, 2023]
const PERIODS = [
  { value: 'year', label: 'Ano completo' },
  { value: 'q1',   label: 'Q1 (Jan–Mar)' },
  { value: 'q2',   label: 'Q2 (Abr–Jun)' },
  { value: 'q3',   label: 'Q3 (Jul–Set)' },
  { value: 'q4',   label: 'Q4 (Out–Dez)' },
]

export default function HomePage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  // Company search
  const [query, setQuery]       = useState('')
  const [results, setResults]   = useState<Company[]>([])
  const [selected, setSelected] = useState<Company | null>(null)
  const [dropOpen, setDropOpen] = useState(false)
  const [searching, setSearching] = useState(false)
  const companyRef = useRef<HTMLDivElement>(null)

  // Traveler search
  const [travelerQuery, setTravelerQuery]       = useState('')
  const [travelerResults, setTravelerResults]   = useState<Traveler[]>([])
  const [selectedTraveler, setSelectedTraveler] = useState<Traveler | null>(null)
  const [travelerDropOpen, setTravelerDropOpen] = useState(false)
  const [travelerSearching, setTravelerSearching] = useState(false)
  const travelerRef = useRef<HTMLDivElement>(null)

  // Misc
  const [period, setPeriod] = useState('year')
  const [year, setYear]     = useState(2025)
  // Company autocomplete
  useEffect(() => {
    if (query.length < 2) { setResults([]); return }
    const t = setTimeout(async () => {
      setSearching(true)
      try {
        const r = await fetch(`/api/companies/search?q=${encodeURIComponent(query)}`)
        setResults(await r.json())
        setDropOpen(true)
      } catch { setResults([]) }
      finally { setSearching(false) }
    }, 300)
    return () => clearTimeout(t)
  }, [query])

  // Traveler autocomplete (only when company selected)
  useEffect(() => {
    if (!selected || travelerQuery.length < 2) { setTravelerResults([]); return }
    const t = setTimeout(async () => {
      setTravelerSearching(true)
      try {
        const r = await fetch(
          `/api/travelers/search?q=${encodeURIComponent(travelerQuery)}&company_id=${selected.company_id}&year=${year}`
        )
        setTravelerResults(await r.json())
        setTravelerDropOpen(true)
      } catch { setTravelerResults([]) }
      finally { setTravelerSearching(false) }
    }, 300)
    return () => clearTimeout(t)
  }, [travelerQuery, selected, year])

  // Close dropdowns on outside click
  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (!companyRef.current?.contains(e.target as Node))   setDropOpen(false)
      if (!travelerRef.current?.contains(e.target as Node))  setTravelerDropOpen(false)
    }
    document.addEventListener('mousedown', fn)
    return () => document.removeEventListener('mousedown', fn)
  }, [])

  const selectCompany = (c: Company) => {
    setSelected(c); setQuery(c.name); setDropOpen(false)
    // Reset traveler when company changes
    setSelectedTraveler(null); setTravelerQuery('')
  }

  const selectTraveler = (t: Traveler) => {
    setSelectedTraveler(t)
    setTravelerQuery(t.name ?? t.email)
    setTravelerDropOpen(false)
  }

  const useMyEmail = () => {
    if (!session?.user?.email) return
    const email = session.user.email
    const name  = session.user.name ?? email.split('@')[0]
    selectTraveler({ email, name })
  }

  const goTraveler = () => {
    if (!selected || !selectedTraveler) return
    router.push(`/wrapped/${selected.company_id}/${encodeURIComponent(selectedTraveler.email)}?period=${period}&year=${year}`)
  }

  const goCompany = () => selected && router.push(`/wrapped/${selected.company_id}?period=${period}&year=${year}`)

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
        className="relative z-10 w-full max-w-md rounded-3xl p-8 flex flex-col gap-6"
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

        {status === 'loading' ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-8 h-8 border-2 border-[#2872fa]/30 border-t-[#2872fa] rounded-full animate-spin" />
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {/* Session info */}
            <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-[#2872fa]/06 border border-[#2872fa]/15">
              <div className="flex items-center gap-2 min-w-0">
                {session?.user?.image && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={session.user.image} alt="" className="w-7 h-7 rounded-full flex-shrink-0" />
                )}
                <div className="min-w-0">
                  <p className="text-[#0d1b2e]/70 text-xs font-medium truncate">{session?.user?.name ?? session?.user?.email}</p>
                  {session?.user?.companyName && (
                    <p className="text-[#0d1b2e]/40 text-[10px] truncate">{session.user.companyName}</p>
                  )}
                </div>
              </div>
              <button onClick={() => signOut({ callbackUrl: '/login' })}
                className="text-[#0d1b2e]/35 text-xs hover:text-[#0d1b2e]/60 transition-colors flex-shrink-0">
                Sair
              </button>
            </div>

            {/* Acesso rápido — visível apenas quando companyId vem do Onfly SSO */}
            {session?.user?.companyId && (
              <div className="flex flex-col gap-2 pb-1 border-b border-[#0d1b2e]/08">
                <p className="text-xs font-semibold text-[#0d1b2e]/45 uppercase tracking-wider">Acesso rápido</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => router.push(`/wrapped/${session.user!.companyId}/${encodeURIComponent(session.user!.email!)}?period=${period}&year=${year}`)}
                    className="flex-1 min-h-[44px] py-2.5 rounded-xl font-semibold text-white text-sm transition-all hover:brightness-110"
                    style={primaryButtonStyle}>
                    ✈️ Meu Wrapped
                  </button>
                  <button
                    onClick={() => router.push(`/wrapped/${session.user!.companyId}?period=${period}&year=${year}`)}
                    className="flex-1 min-h-[44px] py-2.5 rounded-xl font-semibold text-sm transition-all hover:bg-[#0d1b2e]/06 text-[#0d1b2e]"
                    style={{ border: '1.5px solid rgba(13,27,46,0.15)' }}>
                    🏢 Empresa
                  </button>
                </div>
              </div>
            )}

            {/* Company search */}
            <div ref={companyRef} className="relative flex flex-col gap-1">
              <label className="text-xs font-semibold text-[#0d1b2e]/45 uppercase tracking-wider">Empresa</label>
              <div className="relative">
                <input type="text" value={query}
                  onChange={e => { setQuery(e.target.value); setSelected(null) }}
                  placeholder="Buscar empresa…"
                  className="w-full px-4 min-h-[48px] py-3 rounded-xl border text-[#0d1b2e] text-sm outline-none transition-all"
                  style={{ background: '#ffffff', border: inputBorder }}
                  onFocus={e => { e.currentTarget.style.borderColor = inputBorderFocus; if (results.length > 0) setDropOpen(true) }}
                  onBlur={e => { e.currentTarget.style.borderColor = 'rgba(40,114,250,0.2)' }} />
                {searching && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-[#2872fa]/30 border-t-[#2872fa] rounded-full animate-spin" />
                )}
              </div>
              <AnimatePresence>
                {dropOpen && results.length > 0 && (
                  <motion.ul initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                    className="absolute top-full left-0 right-0 z-50 rounded-xl border overflow-hidden"
                    style={{ background: '#ffffff', border: '1px solid rgba(40,114,250,0.15)', boxShadow: '0 8px 24px rgba(40,114,250,0.12)', marginTop: 4 }}>
                    {results.map(c => (
                      <li key={c.company_id} onMouseDown={() => selectCompany(c)}
                        className="px-4 py-3 text-sm text-[#0d1b2e] hover:bg-[#2872fa]/06 cursor-pointer transition-colors">
                        {c.name}
                      </li>
                    ))}
                  </motion.ul>
                )}
              </AnimatePresence>
            </div>

            {/* Period + Year */}
            <div className="flex gap-3">
              <div className="flex flex-col gap-1 flex-1">
                <label className="text-xs font-semibold text-[#0d1b2e]/45 uppercase tracking-wider">Período</label>
                <select value={period} onChange={e => setPeriod(e.target.value)}
                  className="px-3 min-h-[48px] py-3 rounded-xl text-sm text-[#0d1b2e] outline-none cursor-pointer"
                  style={{ background: '#ffffff', border: inputBorder }}>
                  {PERIODS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1 w-24">
                <label className="text-xs font-semibold text-[#0d1b2e]/45 uppercase tracking-wider">Ano</label>
                <select value={year} onChange={e => setYear(Number(e.target.value))}
                  className="px-3 min-h-[48px] py-3 rounded-xl text-sm text-[#0d1b2e] outline-none cursor-pointer"
                  style={{ background: '#ffffff', border: inputBorder }}>
                  {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
            </div>

            {/* Traveler search */}
            <div ref={travelerRef} className="relative flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-[#0d1b2e]/45 uppercase tracking-wider">Colaborador</label>
                {session?.user?.email && selected && (
                  <button onClick={useMyEmail}
                    className="text-xs text-[#2872fa] hover:underline transition-colors">
                    Usar meu email
                  </button>
                )}
              </div>
              <div className="relative">
                <input type="text" value={travelerQuery}
                  onChange={e => { setTravelerQuery(e.target.value); setSelectedTraveler(null) }}
                  placeholder={selected ? 'Buscar por nome ou email…' : 'Selecione uma empresa primeiro'}
                  disabled={!selected}
                  className="w-full px-4 min-h-[48px] py-3 rounded-xl border text-[#0d1b2e] text-sm outline-none transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ background: '#ffffff', border: inputBorder }}
                  onFocus={e => { e.currentTarget.style.borderColor = inputBorderFocus; if (travelerResults.length > 0) setTravelerDropOpen(true) }}
                  onBlur={e => { e.currentTarget.style.borderColor = 'rgba(40,114,250,0.2)' }} />
                {travelerSearching && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-[#2872fa]/30 border-t-[#2872fa] rounded-full animate-spin" />
                )}
              </div>
              <AnimatePresence>
                {travelerDropOpen && travelerResults.length > 0 && (
                  <motion.ul initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                    className="absolute top-full left-0 right-0 z-50 rounded-xl border overflow-hidden"
                    style={{ background: '#ffffff', border: '1px solid rgba(40,114,250,0.15)', boxShadow: '0 8px 24px rgba(40,114,250,0.12)', marginTop: 4 }}>
                    {travelerResults.map(t => (
                      <li key={t.email} onMouseDown={() => selectTraveler(t)}
                        className="px-4 py-3 text-sm text-[#0d1b2e] hover:bg-[#2872fa]/06 cursor-pointer transition-colors">
                        <p className="font-medium truncate">{t.name ?? t.email}</p>
                        {t.name && <p className="text-[#0d1b2e]/45 text-xs truncate">{t.email}</p>}
                      </li>
                    ))}
                  </motion.ul>
                )}
              </AnimatePresence>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-2 pt-1">
              <button onClick={goTraveler} disabled={!selected || !selectedTraveler}
                className="w-full min-h-[48px] py-3 rounded-xl font-semibold text-white transition-all hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed"
                style={primaryButtonStyle}>
                ✈️ Wrapped do Colaborador
              </button>
              <button onClick={goCompany} disabled={!selected}
                className="w-full min-h-[48px] py-3 rounded-xl font-semibold transition-all hover:bg-[#0d1b2e]/06 disabled:opacity-40 disabled:cursor-not-allowed text-[#0d1b2e]"
                style={{ border: '1.5px solid rgba(13,27,46,0.15)' }}>
                🏢 Wrapped da Empresa
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  )
}
