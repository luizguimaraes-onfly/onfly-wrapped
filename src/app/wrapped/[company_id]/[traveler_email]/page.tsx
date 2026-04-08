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
import { gradients } from '@/lib/design'
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

function getTravelerStyle(avgNightsPerTrip: number, explorationRatio: number, repeatRatio: number, totalNightsAway: number, totalTrips: number) {
  if (avgNightsPerTrip < 1.5 && totalTrips >= 5)
    return { style: 'Bate e Volta', emoji: '⚡', badge: 'Mestre da Eficiência', description: 'Você aparece, resolve e volta — sem enrolação. Presença máxima, tempo mínimo.' }
  if (explorationRatio > 0.7)
    return { style: 'Explorador Nato', emoji: '🗺️', badge: 'Caçador de Destinos', description: 'Cada viagem, uma nova cidade. Você não repete — você expande horizontes.' }
  if (repeatRatio > 0.4)
    return { style: 'Especialista em Rota', emoji: '📍', badge: 'Conhecedor do Terreno', description: 'Você conhece esse destino de cor. É praticamente um segundo escritório.' }
  if (totalNightsAway >= 60)
    return { style: 'Nômade Corporativo', emoji: '🌐', badge: 'Sem Endereço Fixo', description: 'Mala sempre pronta. Para você, trabalho e mundo caminham juntos.' }
  return { style: 'Estrategista', emoji: '🧭', badge: 'Viagem com Propósito', description: 'Você não viaja à toa. Cada deslocamento é calculado para gerar o máximo impacto.' }
}

interface Badge { emoji: string; name: string; desc: string }

function buildBadges(
  totalTrips: number,
  totalFlightLegs: number,
  uniqueCities: number,
  totalNightsAway: number,
  avgNightsPerTrip: number,
  dominantDestCount: number,
  busiestMonthTrips: number,
): Badge[] {
  const list: Badge[] = []

  if (totalTrips >= 50)       list.push({ emoji: '🔥', name: 'Sem Parar',           desc: '50+ viagens' })
  else if (totalTrips >= 20)  list.push({ emoji: '💼', name: 'Road Warrior',         desc: '20+ viagens' })
  else if (totalTrips >= 10)  list.push({ emoji: '🚀', name: 'Em Órbita',            desc: '10+ viagens' })

  if (totalFlightLegs >= 100)      list.push({ emoji: '✈️', name: 'Maratonista Aéreo',  desc: '100+ trechos de voo' })
  else if (totalFlightLegs >= 50)  list.push({ emoji: '🛫', name: 'Frequentador do Ar', desc: '50+ trechos' })

  if (uniqueCities >= 10)    list.push({ emoji: '🗺️', name: 'Explorador',            desc: `${uniqueCities} cidades` })
  if (totalNightsAway >= 60) list.push({ emoji: '🌙', name: 'Nômade',                desc: '60+ noites fora' })
  if (dominantDestCount >= 5)list.push({ emoji: '🏠', name: 'Habitué',               desc: `${dominantDestCount}× no mesmo destino` })
  if (avgNightsPerTrip < 1.5 && totalTrips >= 5) list.push({ emoji: '⚡', name: 'Bate e Volta', desc: 'Mestre das visitas relâmpago' })
  if (busiestMonthTrips >= 8)list.push({ emoji: '📈', name: 'Mês Épico',             desc: `${busiestMonthTrips} viagens em um mês` })

  return list
}

function buildProfessionalInsights(
  totalTrips: number,
  uniqueCities: number,
  avgNightsPerTrip: number,
  totalNightsAway: number,
  hoursInAir: number,
): string[] {
  const list: string[] = []
  if (totalTrips >= 10)
    list.push('Você resolve coisas presencialmente — uma reunião cara a cara vale mais do que mil e-mails.')
  if (uniqueCities >= 8)
    list.push('Você não tem medo do desconhecido. Cada nova cidade é uma nova oportunidade de negócio.')
  if (avgNightsPerTrip < 1.5 && totalTrips >= 5)
    list.push('Eficiência é sua marca: você opera em múltiplas frentes sem perder o foco.')
  if (totalNightsAway >= 30)
    list.push('Você investe tempo de qualidade — as melhores parcerias se constroem fora do escritório.')
  if (hoursInAir >= 30 && list.length < 2)
    list.push(`${Math.round(hoursInAir)}h no ar — tempo precioso reinvestido em conexões que importam.`)
  if (list.length === 0)
    list.push('Sua presença é intencional. Quando você viaja, é porque precisa estar lá.')
  return list
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

  // Derived flight metrics
  const hoursInAir        = Math.round(data.totalFlightLegs * 1.5)
  const kmFlown           = data.totalFlightLegs * 850
  const earthLaps         = (kmFlown / 40075).toFixed(1)
  const travelRhythm      = Math.round(365 / Math.max(data.totalFlightLegs, 1))
  const yearPercent       = Math.round(data.totalNightsAway / 365 * 100)

  const rhythmCopy = travelRhythm <= 3  ? 'Você viajou quase todos os dias! Insano! 🔥'
    : travelRhythm <= 7  ? 'Uma nova aventura toda semana! Você não para! ✈️'
    : travelRhythm <= 14 ? 'A cada duas semanas, novo destino! Ritmo de campeão! 🏆'
    : travelRhythm <= 30 ? 'Uma aventura por mês — equilíbrio perfeito!'
    : 'Cada viagem foi especial e bem planejada!'

  const kmStory = kmFlown > 40075 ? `${earthLaps}× a volta ao mundo! A Terra ficou pequena! 🌐`
    : kmFlown > 18500 ? `SP → Tokyo ${Math.round(kmFlown / 18500)}× 🗼`
    : kmFlown > 9600  ? `SP → NY ${Math.round(kmFlown / 9600)}× 🗽`
    : kmFlown > 3500  ? `SP → Lisboa ${Math.round(kmFlown / 3500)}× 🇵🇹`
    : kmFlown > 430   ? `São Paulo → Rio ${Math.round(kmFlown / 430)}×`
    : 'Cada km conta!'

  // Transit time (air + airport wait)
  const hoursAtAirport     = data.totalFlightLegs * 2
  const totalTransitHours  = Math.round(hoursInAir + hoursAtAirport)
  const daysInTransit      = (totalTransitHours / 24).toFixed(1)
  const transitComparison  = totalTransitHours >= 240
    ? `praticamente ${Math.round(totalTransitHours / 24)} dias vividos em trânsito 🌍`
    : totalTransitHours >= 48
    ? `como ${Math.round(totalTransitHours / 2)} filmes de 2h assistidos em voos 🎬`
    : `${totalTransitHours}h de aeroportos e céus — cada minuto valeu ✈️`

  // Traveler style (behavior-based, different from personality which is product-based)
  const avgNightsPerTrip  = data.totalTrips > 0 ? data.totalNightsAway / data.totalTrips : 0
  const explorationRatio  = data.totalTrips > 0 ? data.uniqueCities / data.totalTrips : 0
  const dominantDest      = data.topDestinations[0]
  const repeatRatio       = dominantDest && data.totalTrips > 0 ? dominantDest.count / data.totalTrips : 0
  const travelerStyle     = getTravelerStyle(avgNightsPerTrip, explorationRatio, repeatRatio, data.totalNightsAway, data.totalTrips)

  // Achievements
  const badges = buildBadges(
    data.totalTrips, data.totalFlightLegs, data.uniqueCities, data.totalNightsAway,
    avgNightsPerTrip, dominantDest?.count ?? 0, data.busiestMonthTrips,
  )

  // Professional insights
  const professionalInsights = buildProfessionalInsights(
    data.totalTrips, data.uniqueCities, avgNightsPerTrip, data.totalNightsAway, hoursInAir,
  )

  const gradBg = { background: gradients.slide }
  const glowTop = { background: 'radial-gradient(ellipse at 50% 0%, rgba(255,255,255,0.12) 0%, transparent 55%)' }
  const glowMid = { background: 'radial-gradient(ellipse at 50% 30%, rgba(255,255,255,0.12) 0%, transparent 60%)' }
  const glassCard = { background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)' }
  const glassCardSm = { background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)' }

  const slides = [
    /* 1 — Welcome */
    <WelcomeSlide key="welcome" name={firstName} period={label} />,

    /* 2 — Total trips */
    <StatSlide key="trips" emoji="✈️" label="Viagens realizadas"
      value={String(data.totalTrips)} subtitle={`em ${label}`} color="#2872fa"
      funFact={data.totalTrips >= 30 ? 'Top 1% dos viajantes mais frequentes do Brasil 🏆'
        : data.totalTrips >= 20 ? 'Top 5% — você quase mora nos aeroportos! 🛫'
        : data.totalTrips >= 10 ? 'Top 15% dos viajantes mais frequentes 🎖️'
        : 'Cada viagem é uma nova história! Vamos viajar mais? 😄'} />,

    /* 3 — Flight legs */
    <StatSlide key="legs" emoji="🛫" label="Trechos de voo"
      value={String(data.totalFlightLegs)} subtitle="decolagens e aterrissagens" color="#009EFB"
      funFact={hoursInAir >= 100 ? `${hoursInAir}h no ar! Você é praticamente um piloto 👨‍✈️`
        : hoursInAir > 0 ? `≈ ${hoursInAir}h no ar — assistiu ${Math.round(hoursInAir / 2)} filmes de 2h! 🎬`
        : undefined} />,

    /* 4 — Km flown */
    <StatSlide key="km" emoji="🌍" label="Km estimados no ar"
      value={String(kmFlown)} prefix="~" subtitle="quilômetros voados"
      color="#009EFB"
      funFact={kmStory} />,

    /* 5 — Transit time [new] */
    ...(data.totalFlightLegs > 0 ? [
      <div key="transit" className="flex flex-col items-center justify-center text-center px-8 gap-5 w-full h-full relative overflow-hidden"
        style={gradBg}>
        <div className="absolute inset-0 pointer-events-none" style={glowTop} />
        <motion.span initial={{ scale: 0, rotate: -15 }} animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 200 }} className="text-5xl z-10">⏱️</motion.span>
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }} className="z-10 flex flex-col items-center gap-2">
          <p className="text-white/60 uppercase tracking-widest text-xs font-semibold">Seu tempo em trânsito</p>
          <motion.p initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.4, type: 'spring', stiffness: 150 }}
            className="text-7xl font-black text-white leading-none">{totalTransitHours}</motion.p>
          <p className="text-white/70 text-base font-semibold">horas em aeroportos e voos</p>
          <p className="text-white/55 text-sm">≈ {daysInTransit} dias vividos em trânsito</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="z-10 rounded-2xl px-4 py-3 text-sm text-center text-white max-w-xs"
          style={glassCard}>
          {transitComparison}
        </motion.div>
      </div>
    ] : []),

    /* 6 — Rhythm */
    ...(data.totalFlightLegs >= 2 ? [
      <div key="rhythm" className="flex flex-col items-center justify-center text-center px-8 gap-4 w-full h-full relative overflow-hidden"
        style={gradBg}>
        <div className="absolute inset-0 pointer-events-none" style={glowMid} />
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

    /* 7 — Adopted city */
    ...(data.topDestinations.length > 0 ? [
      <div key="adopted-city" className="flex flex-col items-center justify-center text-center px-8 gap-5 w-full h-full relative overflow-hidden"
        style={gradBg}>
        <div className="absolute inset-0 pointer-events-none" style={glowTop} />
        <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 180, delay: 0.1 }} className="text-5xl z-10">📍</motion.span>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }} className="z-10">
          <p className="text-white/60 uppercase tracking-widest text-xs font-semibold mb-3">Sua cidade adotada</p>
          <motion.h2 initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
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

      /* 8 — Destinations podium */
      <PodiumSlide key="destinations" emoji="📍" title="Seus destinos favoritos"
        subtitle="onde você mais pousou"
        items={data.topDestinations.map((d, i) => ({
          label: d.city, sublabel: d.country, value: `${d.count}×`, rank: i + 1, rawCount: d.count,
        }))} />,
    ] : []),

    /* 9 — Unique cities */
    <StatSlide key="cities" emoji="🏙️" label="Cidades visitadas"
      value={String(data.uniqueCities)} subtitle="destinos diferentes"
      color="#7c3aed"
      funFact={data.uniqueCities >= 10
        ? 'Você é um verdadeiro explorador! 🗺️'
        : data.uniqueCities >= 5 ? 'Diversidade de destinos invejável!' : 'Qualidade > quantidade!'} />,

    /* 10 — Nights */
    <StatSlide key="nights" emoji="🌙" label="Noites em hotéis"
      value={String(data.totalNightsAway)}
      subtitle={data.favoriteHotel ? `Favorito: ${data.favoriteHotel}` : 'fora de casa, vivendo experiências'}
      color="#7c3aed"
      funFact={data.totalNightsAway >= 180 ? `${yearPercent}% do ano fora — você mal tem endereço fixo! 🏡`
        : data.totalNightsAway >= 60  ? `${yearPercent}% do ano dormindo fora — hotel virou segunda casa! 🏨`
        : data.totalNightsAway >= 30  ? `${yearPercent}% do ano na estrada — equilíbrio perfeito!`
        : data.totalNightsAway >= 10  ? `${yearPercent}% do ano viajando — a cama de casa sentiu falta! 🛏️`
        : 'Viagens relâmpago — eficiência máxima! ⚡'} />,

    /* 11 — Products */
    ...(data.productBreakdown.length > 0 ? [
      <ProductSlide key="products" title="Como você preferiu viajar" items={data.productBreakdown} />,
    ] : []),

    /* 12 — Timeline */
    <div key="timeline" className="flex flex-col items-center justify-center text-center px-8 gap-6 w-full h-full relative overflow-hidden"
      style={gradBg}>
      <div className="absolute inset-0 pointer-events-none" style={glowTop} />
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
            style={glassCard}>
            <p className="text-white/60 text-xs uppercase tracking-wider">{item.emoji} {item.label}</p>
            <p className="text-white font-semibold mt-1">{formatDate(item.date)}</p>
          </motion.div>
        ))}
      </div>
    </div>,

    /* 13 — Busiest month */
    ...(data.busiestMonth ? [
      <div key="month" className="flex flex-col items-center justify-center text-center px-8 gap-6 w-full h-full relative overflow-hidden"
        style={gradBg}>
        <div className="absolute inset-0 pointer-events-none" style={glowTop} />
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

    /* 14 — Personality (product-based) */
    <div key="personality" className="flex flex-col items-center justify-center text-center px-8 gap-6 w-full h-full relative overflow-hidden"
      style={gradBg}>
      <div className="absolute inset-0 pointer-events-none" style={glowMid} />
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
          style={glassCard}>
          🏅 {personality.badge}
        </motion.div>
        <p className="text-white/70 text-sm max-w-xs leading-relaxed">{personality.description}</p>
      </motion.div>
    </div>,

    /* 15 — Traveler style (behavior-based) [new] */
    <div key="style" className="flex flex-col items-center justify-center text-center px-8 gap-6 w-full h-full relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #2872FA 100%)' }}>
      <div className="absolute inset-0 pointer-events-none" style={glowMid} />
      <motion.span initial={{ scale: 0, rotate: -20 }} animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 12 }} className="text-5xl sm:text-7xl z-10">
        {travelerStyle.emoji}
      </motion.span>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }} className="z-10">
        <p className="text-white/60 uppercase tracking-widest text-xs font-semibold mb-3">Seu estilo de viagem</p>
        <h2 className="text-3xl sm:text-4xl font-black mb-2 text-white">{travelerStyle.style}</h2>
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold mb-4"
          style={glassCard}>
          ✨ {travelerStyle.badge}
        </motion.div>
        <p className="text-white/70 text-sm max-w-xs leading-relaxed">{travelerStyle.description}</p>
      </motion.div>
    </div>,

    /* 16 — Achievements [new] */
    ...(badges.length > 0 ? [
      <div key="badges" className="flex flex-col items-center justify-center text-center px-8 gap-4 w-full h-full relative overflow-hidden"
        style={gradBg}>
        <div className="absolute inset-0 pointer-events-none" style={glowTop} />
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="z-10">
          <p className="text-white/60 uppercase tracking-widest text-xs font-semibold mb-1">Conquistas desbloqueadas</p>
          <h2 className="text-2xl font-black text-white">
            {badges.length} badge{badges.length > 1 ? 's' : ''} conquistado{badges.length > 1 ? 's' : ''}! 🏆
          </h2>
        </motion.div>
        <div className={`grid gap-2.5 z-10 w-full ${
          badges.length <= 2 ? 'grid-cols-1 max-w-[220px]'
          : badges.length <= 4 ? 'grid-cols-2 max-w-[280px]'
          : 'grid-cols-2 max-w-[300px]'
        }`}>
          {badges.map((b, i) => (
            <motion.div key={i}
              initial={{ opacity: 0, scale: 0.6, rotate: -5 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{ delay: 0.2 + i * 0.1, type: 'spring', stiffness: 220 }}
              className="flex flex-col items-center gap-1 rounded-2xl px-3 py-3"
              style={glassCard}>
              <span className="text-2xl">{b.emoji}</span>
              <p className="text-white text-xs font-bold leading-tight">{b.name}</p>
              <p className="text-white/55 text-[10px]">{b.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    ] : []),

    /* 17 — What this says about you [new] */
    <div key="insight" className="flex flex-col items-center justify-center text-center px-8 gap-5 w-full h-full relative overflow-hidden"
      style={gradBg}>
      <div className="absolute inset-0 pointer-events-none" style={glowTop} />
      <motion.span initial={{ scale: 0, rotate: 5 }} animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 180 }} className="text-5xl z-10">💡</motion.span>
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }} className="z-10">
        <p className="text-white/60 uppercase tracking-widest text-xs font-semibold">O que isso diz sobre você</p>
      </motion.div>
      <div className="flex flex-col gap-3 z-10 w-full">
        {professionalInsights.slice(0, 2).map((insight, i) => (
          <motion.div key={i}
            initial={{ opacity: 0, x: -15 }} animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.35 + i * 0.2 }}
            className="rounded-xl px-4 py-3.5 text-left"
            style={glassCardSm}>
            <p className="text-white/85 text-sm leading-relaxed">&ldquo;{insight}&rdquo;</p>
          </motion.div>
        ))}
      </div>
    </div>,

    /* 18 — Narrative */
    <NarrativeSlide key="narrative" data={data} period={label} />,

    /* 19 — End card (LinkedIn-first) [redesigned] */
    <div key="end" className="flex flex-col items-center justify-center text-center px-6 gap-4 w-full h-full relative overflow-hidden"
      style={gradBg}>
      {[...Array(6)].map((_, i) => (
        <motion.div key={i} className="absolute w-16 h-16 rounded-full blur-2xl pointer-events-none"
          style={{ background: '#ffffff', opacity: 0.08, left: `${(i * 19 + 5) % 85}%`, top: `${(i * 29 + 8) % 80}%` }}
          animate={{ scale: [1, 1.5, 1], opacity: [0.05, 0.12, 0.05] }}
          transition={{ duration: 2.5 + i * 0.3, repeat: Infinity }} />
      ))}

      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="z-10">
        <p className="text-white/55 text-[10px] uppercase tracking-widest mb-0.5">Onfly Wrapped {year}</p>
        <h2 className="text-2xl font-black text-white">{firstName} em {label}</h2>
      </motion.div>

      {/* Key metrics grid */}
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
        className="z-10 grid grid-cols-2 gap-2 w-full max-w-[280px]">
        {[
          { emoji: '✈️', value: String(data.totalTrips),      label: 'viagens' },
          { emoji: '🛫', value: String(data.totalFlightLegs), label: 'trechos' },
          { emoji: '🏙️', value: String(data.uniqueCities),    label: 'cidades' },
          { emoji: '🌙', value: String(data.totalNightsAway), label: 'noites' },
        ].map((m, i) => (
          <motion.div key={i}
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + i * 0.08 }}
            className="rounded-2xl px-3 py-3 flex flex-col items-center"
            style={glassCard}>
            <span className="text-xl mb-0.5">{m.emoji}</span>
            <p className="text-white font-black text-xl leading-tight">{m.value}</p>
            <p className="text-white/60 text-[10px] uppercase tracking-wide">{m.label}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* Style + personality badges */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
        className="z-10 flex flex-wrap justify-center gap-2">
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
          style={glassCard}>
          <span>{personality.emoji}</span>
          <span className="text-white">{personality.badge}</span>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
          style={glassCard}>
          <span>{travelerStyle.emoji}</span>
          <span className="text-white">{travelerStyle.style}</span>
        </div>
      </motion.div>

    </div>,
  ]

  const shareText = `${data.totalTrips} viagens, ${data.totalFlightLegs} trechos de voo e ${data.totalNightsAway} noites de hotel em ${label}. Esse e o meu Onfly Wrapped. #OnflyWrapped #ViagensCorporativas #Onfly`

  const captionData = {
    type: 'traveler' as const,
    period: label,
    data: {
      travelerName:    data.travelerName,
      totalTrips:      data.totalTrips,
      totalFlightLegs: data.totalFlightLegs,
      totalNights:     data.totalNightsAway,
      uniqueCities:    data.uniqueCities,
      topDestinations: data.topDestinations,
      personality:     data.personality,
      travelerStyle:   travelerStyle.style,
      badges:          badges.map(b => b.name),
    },
  }

  return <SlideContainer slides={slides} onComplete={() => router.push('/')} shareText={shareText} captionData={captionData} />
}
