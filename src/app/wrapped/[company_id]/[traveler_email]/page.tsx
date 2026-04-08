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
import { NarrativeSlide } from '@/components/wrapped/slides/NarrativeSlide'
import { colors, gradients } from '@/lib/design'
import type { TravelerWrapped } from '@/lib/types'

function periodLabel(period: string, year: string) {
  const map: Record<string, string> = {
    year: `Ano ${year}`, q1: `Q1 ${year}`, q2: `Q2 ${year}`, q3: `Q3 ${year}`, q4: `Q4 ${year}`,
  }
  return map[period] ?? year
}

function formatDate(d: string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
}

const PERSONALITY_DETAILS: Record<string, { emoji: string; badge: string; description: string }> = {
  'Viajante Aéreo':    { emoji: '✈️', badge: 'Especialista em Voos',  description: 'O lounge é seu escritório e o boarding pass, seu bilhete para o mundo. Você vive pelas alturas — e não troca por nada.' },
  'Hóspede Frequente': { emoji: '🏨', badge: 'Hóspede VIP',           description: 'Você sabe pedir o quarto certo, conhece o cardápio do café e nunca esquece o carregador na tomada. Hotel é sua segunda casa.' },
  'Viajante de Ônibus':{ emoji: '🚌', badge: 'Rei das Estradas',       description: 'Econômico, confortável e pontual. As melhores histórias acontecem no caminho, não só no destino.' },
  'Viajante de Carro': { emoji: '🚗', badge: 'Mestre da Liberdade',    description: 'GPS ligado, janela aberta, trilha sonora perfeita. Você decide quando sair, quando parar e qual caminho tomar.' },
  'Viajante Completo': { emoji: '🌟', badge: 'Expert Multimodal',      description: 'Avião, hotel, carro, ônibus — você domina todos os meios. Adaptar-se é o seu superpoder.' },
}

function getPersonality(p: string) {
  return PERSONALITY_DETAILS[p] ?? { emoji: '🌍', badge: 'Viajante Único', description: 'Um perfil único, assim como cada viagem que você faz.' }
}

export default function TravelerWrappedPage() {
  const params       = useParams()
  const searchParams = useSearchParams()
  const router       = useRouter()

  const companyId     = params.company_id as string
  const travelerEmail = decodeURIComponent(params.traveler_email as string)
  const period        = searchParams.get('period') ?? 'year'
  const year          = searchParams.get('year') ?? String(new Date().getFullYear())

  const [data, setData]       = useState<TravelerWrapped | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/wrapped/traveler?email=${encodeURIComponent(travelerEmail)}&company_id=${companyId}&period=${period}&year=${year}`)
      .then(r => r.json())
      .then(d => { if (d.error) setError(d.error); else setData(d) })
      .catch(() => setError('Erro ao carregar dados'))
      .finally(() => setLoading(false))
  }, [travelerEmail, companyId, period, year])

  if (loading) return (
    <div className="min-h-screen bg-[#eef3ff] flex flex-col items-center justify-center gap-4">
      <div className="relative">
        <div className="w-14 h-14 border-4 border-[#2872fa]/30 border-t-[#2872fa] rounded-full animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center text-xl">✈️</div>
      </div>
      <p className="text-[#0d1b2e]/60 text-sm">Preparando sua jornada…</p>
    </div>
  )

  if (error || !data) return (
    <div className="min-h-screen bg-[#eef3ff] flex flex-col items-center justify-center gap-4 text-[#0d1b2e] px-8 text-center">
      <span className="text-5xl">😕</span>
      <p className="text-xl font-semibold">{error ?? 'Dados não encontrados'}</p>
      <button onClick={() => router.push('/')} className="text-[#2872fa] underline text-sm mt-2">Voltar ao início</button>
    </div>
  )

  if (!data.travelerName && data.totalTrips === 0) return (
    <div className="min-h-screen bg-[#eef3ff] flex flex-col items-center justify-center gap-4 text-[#0d1b2e] px-8 text-center">
      <span className="text-5xl">🔍</span>
      <p className="text-xl font-semibold">Nenhuma viagem encontrada</p>
      <p className="text-[#0d1b2e]/50 text-sm max-w-xs">Não encontramos viagens para <strong>{travelerEmail}</strong> no período selecionado.</p>
      <button onClick={() => router.push('/')} className="text-[#2872fa] underline text-sm mt-2">Voltar ao início</button>
    </div>
  )

  const label       = periodLabel(period, year)
  const personality = getPersonality(data.personality)
  const firstName   = (data.travelerName ?? travelerEmail).split(/[\s@]/)[0]
  const hoursInAir   = Math.round(data.totalFlightLegs * 1.5)
  const kmFlown      = data.totalFlightLegs * 850
  const earthLaps    = (kmFlown / 40075).toFixed(1)
  const travelRhythm = Math.round(365 / Math.max(data.totalFlightLegs, 1))
  const yearPercent  = Math.round(data.totalNightsAway / 365 * 100)
  const rhythmCopy   = travelRhythm <= 3  ? 'Você viajou quase todos os dias! Insano! 🔥'
    : travelRhythm <= 7  ? 'Uma nova aventura toda semana! Você não para! ✈️'
    : travelRhythm <= 14 ? 'A cada duas semanas, novo destino! Ritmo de campeão! 🏆'
    : travelRhythm <= 30 ? 'Uma aventura por mês — equilíbrio perfeito!'
    : 'Cada viagem foi especial e bem planejada!'
  const kmStory      = kmFlown > 40075 ? `${earthLaps}× a volta ao mundo! A Terra ficou pequena! 🌐`
    : kmFlown > 18500 ? `SP → Tokyo ${Math.round(kmFlown / 18500)}× 🗼`
    : kmFlown > 9600  ? `SP → NY ${Math.round(kmFlown / 9600)}× 🗽`
    : kmFlown > 3500  ? `SP → Lisboa ${Math.round(kmFlown / 3500)}× 🇵🇹`
    : kmFlown > 430   ? `São Paulo → Rio ${Math.round(kmFlown / 430)}×`
    : 'Cada km conta!'

  const slides = [
    <WelcomeSlide key="welcome" name={firstName} period={label} />,

    <StatSlide key="trips" emoji="✈️" label="Viagens realizadas"
      value={String(data.totalTrips)} subtitle={`em ${label}`} color="#2872fa"
      funFact={data.totalTrips >= 30 ? 'Top 1% dos viajantes mais frequentes do Brasil 🏆'
        : data.totalTrips >= 20 ? 'Top 5% — você quase mora nos aeroportos! 🛫'
        : data.totalTrips >= 10 ? 'Top 15% dos viajantes mais frequentes 🎖️'
        : 'Cada viagem é uma nova história! Vamos viajar mais? 😄'} />,

    <StatSlide key="legs" emoji="🛫" label="Trechos de voo"
      value={String(data.totalFlightLegs)} subtitle="decolagens e aterrissagens" color="#009EFB"
      funFact={hoursInAir >= 100 ? `${hoursInAir}h no ar! Você é praticamente um piloto 👨‍✈️`
        : hoursInAir > 0 ? `≈ ${hoursInAir}h no ar — assistiu ${Math.round(hoursInAir / 2)} filmes de 2h! 🎬`
        : undefined} />,

    <StatSlide key="km" emoji="🌍" label="Km estimados no ar"
      value={String(kmFlown)} prefix="~" subtitle="quilômetros voados"
      color="#009EFB"
      funFact={kmStory} />,

    ...(data.totalFlightLegs >= 2 ? [
      <div key="rhythm" className="flex flex-col items-center justify-center text-center px-8 gap-4 w-full h-full relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #009EFB 0%, #2872FA 100%)' }}>
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at 50% 30%, rgba(255,255,255,0.12) 0%, transparent 65%)' }} />
        <motion.span initial={{ scale: 0, rotate: -15 }} animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 200 }} className="text-5xl z-10">⚡</motion.span>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }} className="z-10">
          <p className="text-white/60 uppercase tracking-widest text-xs font-semibold mb-2">Seu ritmo de aventura</p>
          <p className="text-white/70 text-sm mb-1">uma nova decolagem a cada</p>
          <motion.p initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.4, type: 'spring', stiffness: 150 }}
            className="text-8xl font-black text-white leading-none">{travelRhythm}</motion.p>
          <p className="text-white/70 text-lg font-semibold mt-1 mb-3">dias</p>
          <p className="text-white/60 text-sm max-w-[260px]">{rhythmCopy}</p>
        </motion.div>
      </div>
    ] : []),

    ...(data.topDestinations.length > 0 ? [
      <div key="adopted-city" className="flex flex-col items-center justify-center text-center px-8 gap-5 w-full h-full relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #009EFB 0%, #2872FA 100%)' }}>
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(255,255,255,0.12) 0%, transparent 60%)' }} />
        <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 180, delay: 0.1 }} className="text-5xl z-10">📍</motion.span>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }} className="z-10">
          <p className="text-white/60 uppercase tracking-widest text-xs font-semibold mb-3">Sua cidade adotada</p>
          <motion.h2
            initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.5, type: 'spring', stiffness: 150 }}
            className="text-4xl font-black text-white mb-1">{data.topDestinations[0].city}</motion.h2>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}
            className="text-white/50 text-sm mb-3">{data.topDestinations[0].country}</motion.p>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9 }}
            className="text-white/70 text-sm">você pousou aqui {data.topDestinations[0].count}× em {label}</motion.p>
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.1 }}
            className="inline-block mt-3 px-4 py-1.5 rounded-full text-xs font-semibold"
            style={{ background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.3)' }}>
            {data.topDestinations[0].count >= 6 ? '🏡 Quase um morador local!'
              : data.topDestinations[0].count >= 3 ? '✅ Destino de confiança!'
              : '⭐ O favorito do ano!'}
          </motion.div>
        </motion.div>
      </div>,
      <PodiumSlide key="destinations" emoji="📍" title="Seus destinos favoritos"
        subtitle="onde você mais pousou"
        items={data.topDestinations.map((d, i) => ({
          label: d.city, sublabel: d.country, value: `${d.count}×`, rank: i + 1, rawCount: d.count,
        }))} />
    ] : []),

    <StatSlide key="cities" emoji="🏙️" label="Cidades visitadas"
      value={String(data.uniqueCities)} subtitle="destinos diferentes"
      color="#7c3aed"
      funFact={data.uniqueCities >= 10
        ? 'Você é um verdadeiro explorador! 🗺️'
        : data.uniqueCities >= 5 ? 'Diversidade de destinos invejável!' : 'Qualidade > quantidade!'} />,

    <StatSlide key="nights" emoji="🌙" label="Noites em hotéis"
      value={String(data.totalNightsAway)}
      subtitle={data.favoriteHotel ? `Favorito: ${data.favoriteHotel}` : 'fora de casa, vivendo experiências'}
      color="#7c3aed"
      funFact={data.totalNightsAway >= 180 ? `${yearPercent}% do ano fora — você mal tem endereço fixo! 🏡`
        : data.totalNightsAway >= 60  ? `${yearPercent}% do ano dormindo fora — hotel virou segunda casa! 🏨`
        : data.totalNightsAway >= 30  ? `${yearPercent}% do ano na estrada — equilíbrio perfeito!`
        : data.totalNightsAway >= 10  ? `${yearPercent}% do ano viajando — a cama de casa sentiu falta! 🛏️`
        : 'Viagens relâmpago — eficiência máxima! ⚡'} />,

    ...(data.productBreakdown.length > 0 ? [
      <ProductSlide key="products" title="Como você preferiu viajar" items={data.productBreakdown} />
    ] : []),

    // Timeline
    <div key="timeline" className="flex flex-col items-center justify-center text-center px-8 gap-6 w-full h-full relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #009EFB 0%, #2872FA 100%)' }}>
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(255,255,255,0.1) 0%, transparent 55%)' }} />
      <motion.span initial={{ scale: 0, rotate: -15 }} animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 200 }} className="text-5xl z-10">📅</motion.span>
      <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }} className="z-10">
        <h2 className="text-2xl font-bold text-white">Sua linha do tempo</h2>
        <p className="text-white/60 text-sm mt-1">de início ao fim de {label}</p>
      </motion.div>
      <div className="flex flex-col gap-3 w-full z-10">
        {[
          { label: 'Primeira viagem', date: data.firstTrip, emoji: '🚀' },
          { label: 'Última viagem',   date: data.lastTrip,  emoji: '🏁' },
        ].map((item, i) => (
          <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 + i * 0.2 }}
            className="rounded-xl px-5 py-4 text-left"
            style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)' }}>
            <p className="text-white/60 text-xs uppercase tracking-wider">{item.emoji} {item.label}</p>
            <p className="text-white font-semibold mt-1">{formatDate(item.date)}</p>
          </motion.div>
        ))}
      </div>
    </div>,

    ...(data.busiestMonth ? [
      <div key="month" className="flex flex-col items-center justify-center text-center px-8 gap-6 w-full h-full relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #009EFB 0%, #2872FA 100%)' }}>
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(255,255,255,0.1) 0%, transparent 55%)' }} />
        <motion.span initial={{ scale: 0, rotate: -15 }} animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 200 }} className="text-6xl z-10">🗓️</motion.span>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }} className="z-10">
          <p className="text-white/60 uppercase tracking-widest text-xs font-semibold mb-3">Seu mês mais intenso</p>
          <h2 className="text-4xl font-black capitalize mb-2 text-white">{data.busiestMonth}</h2>
          <p className="text-white/70 text-sm">{data.busiestMonthTrips} viagens nesse mês — mala a postos! 🧳</p>
        </motion.div>
      </div>
    ] : []),

    // Personality
    <div key="personality" className="flex flex-col items-center justify-center text-center px-8 gap-6 w-full h-full relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #009EFB 0%, #2872FA 100%)' }}>
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at 50% 40%, rgba(255,255,255,0.12) 0%, transparent 65%)' }} />
      <motion.span initial={{ scale: 0, rotate: -20 }} animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 12 }} className="text-5xl sm:text-7xl z-10">
        {personality.emoji}
      </motion.span>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }} className="z-10">
        <p className="text-white/60 uppercase tracking-widest text-xs font-semibold mb-3">Seu perfil de viajante</p>
        <h2 className="text-3xl sm:text-4xl font-black mb-2 text-white">{data.personality}</h2>
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold mb-4"
          style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)' }}>
          🏅 {personality.badge}
        </motion.div>
        <p className="text-white/70 text-sm max-w-xs leading-relaxed">{personality.description}</p>
      </motion.div>
    </div>,

    <NarrativeSlide key="narrative" data={data} period={label} />,

    // End
    <div key="end" className="flex flex-col items-center justify-center text-center px-8 gap-5 w-full h-full relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #009EFB 0%, #2872FA 100%)' }}>
      {[...Array(6)].map((_, i) => (
        <motion.div key={i} className="absolute w-16 h-16 rounded-full blur-2xl pointer-events-none"
          style={{ background: '#ffffff', opacity: 0.08, left: `${(i * 19 + 5) % 85}%`, top: `${(i * 29 + 8) % 80}%` }}
          animate={{ scale: [1,1.5,1], opacity: [0.05,0.12,0.05] }}
          transition={{ duration: 2.5 + i * 0.3, repeat: Infinity }} />
      ))}
      <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 200 }} className="text-5xl sm:text-7xl z-10">🎊</motion.span>
      <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }} className="z-10">
        <h2 className="text-3xl font-black text-white">Até a próxima,<br />{firstName}!</h2>
        <p className="text-white/70 max-w-xs mt-3 text-sm leading-relaxed">
          {data.totalTrips} viagens, {data.totalFlightLegs} trechos e {data.totalNightsAway} noites em {label}.
        </p>
      </motion.div>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }} className="flex gap-3 flex-col w-full max-w-xs z-10">
        <button onClick={() => router.push(`/wrapped/${companyId}?period=${period}&year=${year}`)}
          className="text-white px-6 min-h-[48px] py-3 rounded-xl font-semibold transition-colors"
          style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)' }}>
          Ver visão da empresa
        </button>
        <button onClick={() => router.push('/')}
          className="bg-white text-[#2872fa] px-6 min-h-[48px] py-3 rounded-xl font-semibold hover:bg-white/90 transition-colors">
          Nova busca
        </button>
      </motion.div>
    </div>,
  ]

  const shareText = `✈️ ${data.totalTrips} viagens, ${data.totalFlightLegs} trechos e ${data.totalNightsAway} noites em ${label}.\n\nEsse é o meu Onfly Wrapped!\n\n#OnflyWrapped #ViagensCorporativas #Onfly`

  const captionData = {
    type: 'traveler' as const,
    period: label,
    data: {
      travelerName:   data.travelerName,
      totalTrips:     data.totalTrips,
      totalFlightLegs: data.totalFlightLegs,
      totalNights:    data.totalNightsAway,
      topDestinations: data.topDestinations,
      personality:    data.personality,
    },
  }

  return <SlideContainer slides={slides} onComplete={() => router.push('/')} shareText={shareText} captionData={captionData} />
}
