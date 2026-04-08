'use client'

import { useEffect, useState } from 'react'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { SlideContainer } from '@/components/wrapped/SlideContainer'
import { WelcomeSlide } from '@/components/wrapped/slides/WelcomeSlide'
import { StatSlide } from '@/components/wrapped/slides/StatSlide'
import { TopListSlide } from '@/components/wrapped/slides/TopListSlide'
import { PodiumSlide } from '@/components/wrapped/slides/PodiumSlide'
import { ProductSlide } from '@/components/wrapped/slides/ProductSlide'
import { colors } from '@/lib/design'
import type { CompanyWrapped } from '@/lib/types'

function periodLabel(period: string, year: string) {
  const map: Record<string, string> = {
    year: `Ano ${year}`, q1: `Q1 ${year}`, q2: `Q2 ${year}`, q3: `Q3 ${year}`, q4: `Q4 ${year}`,
  }
  return map[period] ?? year
}

function fmt(n: number) {
  return n.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

export default function CompanyWrappedPage() {
  const params       = useParams()
  const searchParams = useSearchParams()
  const router       = useRouter()

  const companyId = params.company_id as string
  const period    = searchParams.get('period') ?? 'year'
  const year      = searchParams.get('year') ?? String(new Date().getFullYear())

  const [data, setData]       = useState<CompanyWrapped | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/wrapped/company?company_id=${companyId}&period=${period}&year=${year}`)
      .then(r => r.json())
      .then(d => { if (d.error) setError(d.error); else setData(d) })
      .catch(() => setError('Erro ao carregar dados'))
      .finally(() => setLoading(false))
  }, [companyId, period, year])

  if (loading) return (
    <div className="min-h-screen bg-[#eef3ff] flex flex-col items-center justify-center gap-4">
      <div className="relative">
        <div className="w-14 h-14 border-4 border-[#2872fa]/30 border-t-[#2872fa] rounded-full animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center text-xl">✈️</div>
      </div>
      <p className="text-[#0d1b2e]/60 text-sm">Carregando dados da empresa…</p>
    </div>
  )

  if (error || !data) return (
    <div className="min-h-screen bg-[#eef3ff] flex flex-col items-center justify-center gap-4 text-[#0d1b2e] px-8 text-center">
      <span className="text-5xl">😕</span>
      <p className="text-xl font-semibold">{error ?? 'Dados não encontrados'}</p>
      <button onClick={() => router.push('/')} className="text-[#2872fa] underline text-sm mt-2">Voltar ao início</button>
    </div>
  )

  const label = periodLabel(period, year)

  const slides = [
    <WelcomeSlide key="welcome" name={data.companyName} period={label} subtitle="visão da empresa" />,

    <StatSlide key="bookings" emoji="📋" label="Reservas realizadas"
      value={String(data.totalBookings)} subtitle={`em ${label}`} color="#2872fa"
      funFact={data.totalBookings > 1000 ? `Média de ${Math.round(data.totalBookings / 12)} reservas/mês 🚀` : undefined} />,

    <StatSlide key="travelers" emoji="👥" label="Colaboradores viajantes"
      value={String(data.uniqueTravelers)} subtitle="pessoas que viajaram"
      color="#009EFB"
      funFact={data.uniqueTravelers > 100
        ? 'Uma legião de viajantes corporativos! 🚀'
        : data.uniqueTravelers > 20 ? 'Time engajado em movimento!' : 'Equipe focada e ativa!'} />,

    ...(data.uniqueTravelers > 0 ? [
      <div key="per-traveler" className="flex flex-col items-center justify-center text-center px-8 gap-4 w-full h-full relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #009EFB 0%, #2872FA 100%)' }}>
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at 50% 30%, rgba(255,255,255,0.12) 0%, transparent 65%)' }} />
        <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200 }} className="text-5xl z-10">📊</motion.span>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }} className="z-10">
          <p className="text-white/60 uppercase tracking-widest text-xs font-semibold mb-2">Média por colaborador</p>
          <motion.p initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.4, type: 'spring', stiffness: 150 }}
            className="text-8xl font-black text-white leading-none">
            {Math.round(data.totalBookings / data.uniqueTravelers)}
          </motion.p>
          <p className="text-white/70 text-lg font-semibold mt-1 mb-3">reservas / pessoa</p>
          <p className="text-white/60 text-sm max-w-[260px]">
            R$ {fmt(Math.round(data.totalSpent / data.uniqueTravelers))} investido por colaborador em {label}
          </p>
        </motion.div>
      </div>
    ] : []),

    <StatSlide key="spent" emoji="💰" label="Total investido"
      value={String(Math.round(data.totalSpent))} prefix="R$" subtitle="em viagens corporativas"
      color="#009EFB"
      funFact={`R$ ${fmt(Math.round(data.totalSpent / Math.max(data.totalBookings, 1)))} por reserva · R$ ${fmt(Math.round(data.totalSpent / Math.max(data.uniqueTravelers, 1)))} por colaborador`} />,

    ...(data.busiestMonth ? [
      <div key="month" className="flex flex-col items-center justify-center text-center px-8 gap-6 w-full h-full relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #009EFB 0%, #2872FA 100%)' }}>
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(255,255,255,0.1) 0%, transparent 55%)' }} />
        <motion.span initial={{ scale: 0, rotate: -15 }} animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 200 }} className="text-6xl z-10">🗓️</motion.span>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }} className="z-10">
          <p className="text-white/60 uppercase tracking-widest text-xs font-semibold mb-3">Mês mais movimentado</p>
          <h2 className="text-4xl font-black capitalize mb-2 text-white">{data.busiestMonth}</h2>
          <p className="text-white/70 text-sm">{data.busiestMonthBookings} reservas — o time voou nesse mês! ✈️</p>
        </motion.div>
      </div>
    ] : []),

    ...(data.topDestinations.length > 0 ? [
      <div key="company-city" className="flex flex-col items-center justify-center text-center px-8 gap-5 w-full h-full relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #009EFB 0%, #2872FA 100%)' }}>
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(255,255,255,0.12) 0%, transparent 60%)' }} />
        <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 180, delay: 0.1 }} className="text-5xl z-10">🏆</motion.span>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }} className="z-10">
          <p className="text-white/60 uppercase tracking-widest text-xs font-semibold mb-3">Destino favorito da empresa</p>
          <motion.h2
            initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.5, type: 'spring', stiffness: 150 }}
            className="text-4xl font-black text-white mb-1">{data.topDestinations[0].city}</motion.h2>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}
            className="text-white/50 text-sm mb-3">{data.topDestinations[0].country}</motion.p>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9 }}
            className="text-white/70 text-sm">{data.topDestinations[0].count} chegadas em {label}</motion.p>
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.1 }}
            className="inline-block mt-3 px-4 py-1.5 rounded-full text-xs font-semibold"
            style={{ background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.3)' }}>
            {data.topDestinations[0].count >= 50 ? '🔥 Destino dominante do time!'
              : data.topDestinations[0].count >= 20 ? '✅ Rota mais frequente!'
              : '⭐ O destino do ano!'}
          </motion.div>
        </motion.div>
      </div>,
      <PodiumSlide key="destinations" emoji="📍" title="Destinos mais visitados"
        subtitle="cidades com mais chegadas"
        items={data.topDestinations.map((d, i) => ({
          label: d.city, sublabel: d.country, value: `${d.count}×`, rank: i + 1, rawCount: d.count,
        }))} />
    ] : []),

    ...(data.topTravelers.length > 0 ? [
      <PodiumSlide key="travelers" emoji="🧳" title="Viajantes mais frequentes"
        subtitle="quem mais viajou pela empresa"
        items={data.topTravelers.map((t, i) => ({
          label: t.name, sublabel: t.email, value: `${t.trips} viagens`, rank: i + 1, rawCount: t.trips,
        }))} />
    ] : []),

    ...(data.productBreakdown.length > 0 ? [
      <ProductSlide key="products" title="Distribuição de reservas" items={data.productBreakdown} />
    ] : []),

    ...(data.topHotels.length > 0 ? [
      <PodiumSlide key="hotels" emoji="🏨" title="Hotéis preferidos"
        subtitle="onde a equipe mais se hospedou"
        items={data.topHotels.map((h, i) => ({
          label: h.name, sublabel: h.city, value: `${h.count}×`, rank: i + 1, rawCount: h.count,
        }))} />
    ] : []),

    <StatSlide key="intl" emoji="🌍" label="Viagens internacionais"
      value={String(data.internationalRatio)} suffix="%" subtitle="dos voos foram internacionais"
      color="#7c3aed"
      funFact={data.internationalRatio > 30 ? 'Time global! 🌐' : 'Foco no mercado nacional'} />,

    // End card
    <div key="end" className="flex flex-col items-center justify-center text-center px-8 gap-5 w-full h-full relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #009EFB 0%, #2872FA 100%)' }}>
      {[...Array(5)].map((_, i) => (
        <motion.div key={i} className="absolute w-20 h-20 rounded-full blur-3xl pointer-events-none"
          style={{ background: '#ffffff', opacity: 0.08, left: `${(i * 21 + 5) % 80}%`, top: `${(i * 31 + 8) % 75}%` }}
          animate={{ scale: [1,1.4,1], opacity: [0.05,0.12,0.05] }}
          transition={{ duration: 2.5 + i * 0.3, repeat: Infinity }} />
      ))}
      <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 200 }} className="text-5xl sm:text-7xl z-10">🎊</motion.span>
      <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }} className="z-10">
        <h2 className="text-3xl font-black text-white">{data.companyName}</h2>
        <p className="text-white/70 max-w-xs mt-2 text-sm leading-relaxed">
          {data.totalBookings} reservas e R$ {fmt(Math.round(data.totalSpent))} investidos em {label}.
        </p>
      </motion.div>
      <motion.button initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        onClick={() => router.push('/')}
        className="z-10 px-6 min-h-[48px] py-3 rounded-xl font-semibold text-white transition-colors"
        style={{ background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.35)' }}>
        Nova busca
      </motion.button>
    </div>,
  ]

  const cleanName = (data.companyName ?? '').replace(/[()[\]{}<>'"!?@#$%^&*=+|\\]/g, '').replace(/\s{2,}/g, ' ').trim()
  const shareText = `${cleanName} fez ${data.totalBookings} reservas e investiu R$ ${fmt(Math.round(data.totalSpent))} em viagens corporativas em ${label}. Esse e o nosso Onfly Wrapped. #OnflyWrapped #ViagensCorporativas #Onfly`

  const captionData = {
    type: 'company' as const,
    period: label,
    data: {
      companyName: data.companyName,
      totalBookings: data.totalBookings,
      totalSpent: data.totalSpent,
      topDestinations: data.topDestinations,
    },
  }

  return <SlideContainer slides={slides} onComplete={() => router.push('/')} shareText={shareText} captionData={captionData} />
}
