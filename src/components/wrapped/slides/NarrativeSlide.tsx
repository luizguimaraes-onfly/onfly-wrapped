'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { gradients } from '@/lib/design'
import type { TravelerWrapped } from '@/lib/types'

interface NarrativeSlideProps {
  data: TravelerWrapped
  period: string
}

export function NarrativeSlide({ data, period }: NarrativeSlideProps) {
  const [text, setText]           = useState('')
  const [loading, setLoading]     = useState(true)
  const [displayed, setDisplayed] = useState('')

  useEffect(() => {
    fetch('/api/wrapped/narrative', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        travelerName:    data.travelerName,
        totalTrips:      data.totalTrips,
        topDestinations: data.topDestinations,
        personality:     data.personality,
        totalNights:     data.totalNightsAway,
        totalFlightLegs: data.totalFlightLegs,
        period,
      }),
    })
      .then(r => r.json())
      .then(d => { setText(d.text ?? ''); setLoading(false) })
      .catch(() => { setText('Que ano incrível de viagens — cada destino, uma história nova!'); setLoading(false) })
  }, [data, period])

  useEffect(() => {
    if (loading || !text) return
    let i = 0
    setDisplayed('')
    const timer = setInterval(() => {
      i++
      setDisplayed(text.slice(0, i))
      if (i >= text.length) clearInterval(timer)
    }, 22)
    return () => clearInterval(timer)
  }, [text, loading])

  return (
    <div className="flex flex-col items-center justify-center text-center px-8 gap-6 w-full h-full relative overflow-hidden"
      style={{ background: gradients.slide }}>

      <div className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at 50% 30%, rgba(255,255,255,0.1) 0%, transparent 60%)' }} />

      <motion.span initial={{ scale: 0, rotate: -20 }} animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 200 }} className="text-5xl z-10">✨</motion.span>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }} className="z-10 flex flex-col items-center gap-4">
        <p className="text-white/60 uppercase tracking-widest text-xs font-semibold">
          Sua história em palavras
        </p>

        {loading ? (
          <div className="flex flex-col items-center gap-3 min-h-24 justify-center">
            <div className="flex gap-1">
              {[0, 1, 2].map(i => (
                <motion.div key={i} className="w-2 h-2 rounded-full bg-white"
                  animate={{ opacity: [0.3, 1, 0.3], y: [0, -6, 0] }}
                  transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }} />
              ))}
            </div>
            <p className="text-white/40 text-xs">A IA está escrevendo sua história…</p>
          </div>
        ) : (
          <p className="text-white text-lg font-medium leading-relaxed max-w-xs min-h-24">
            {displayed}
            {displayed.length < text.length && (
              <motion.span animate={{ opacity: [1, 0] }} transition={{ duration: 0.5, repeat: Infinity }}
                className="inline-block w-0.5 h-[1.1em] bg-white ml-0.5 align-text-bottom" />
            )}
          </p>
        )}
      </motion.div>

      <motion.p initial={{ opacity: 0 }} animate={{ opacity: loading ? 0 : 0.7 }}
        transition={{ delay: 1 }}
        className="absolute bottom-8 z-10 text-white text-xs flex items-center gap-1">
        <span>✨</span> gerado por IA
      </motion.p>
    </div>
  )
}
