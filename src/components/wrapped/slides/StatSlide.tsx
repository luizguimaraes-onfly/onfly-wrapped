'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { gradients } from '@/lib/design'

interface StatSlideProps {
  emoji: string
  label: string
  value: string
  subtitle?: string
  color?: string
  funFact?: string
  prefix?: string
  suffix?: string
}

function useCountUp(target: number, duration = 1.8) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (target === 0) return
    const start = performance.now()
    let raf: number

    const tick = (now: number) => {
      const elapsed = (now - start) / 1000
      const progress = Math.min(elapsed / duration, 1)
      const ease = 1 - Math.pow(1 - progress, 3)
      setCount(Math.round(ease * target))
      if (progress < 1) raf = requestAnimationFrame(tick)
    }

    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, duration])

  return count
}

export function StatSlide({ emoji, label, value, subtitle, funFact, prefix = '', suffix = '' }: StatSlideProps) {
  const numeric = parseInt(value.replace(/\D/g, ''), 10) || 0
  const isNumeric = !isNaN(numeric) && numeric > 0
  const displayed = useCountUp(isNumeric ? numeric : 0)
  const isCurrency = prefix === 'R$'

  const formattedValue = isNumeric
    ? isCurrency
      ? displayed.toLocaleString('pt-BR')
      : String(displayed)
    : value

  const len = formattedValue.length
  const numFontSize = len <= 4 ? '4rem' : len <= 7 ? '3.25rem' : len <= 10 ? '2.5rem' : '2rem'

  return (
    <div className="flex flex-col items-center justify-center text-center px-8 gap-5 w-full h-full relative overflow-hidden"
      style={{ background: gradients.slide }}>

      {/* Subtle white glow */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at 50% 30%, rgba(255,255,255,0.12) 0%, transparent 60%)' }} />

      <motion.span initial={{ scale: 0, rotate: -15 }} animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 200 }} className="text-5xl z-10">{emoji}</motion.span>

      <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }} className="z-10 flex flex-col items-center gap-2">
        <p className="text-white/60 text-sm uppercase tracking-widest font-semibold">{label}</p>
        {isCurrency && (
          <p className="text-xs font-semibold text-white/60 uppercase tracking-widest -mb-1">R$</p>
        )}
        <p className="font-black leading-none text-white w-full text-center"
          style={{ fontSize: numFontSize }}>
          {!isCurrency && prefix && <span className="text-2xl mr-1 opacity-80">{prefix}</span>}
          {formattedValue}
          {suffix && <span className="text-3xl ml-1 opacity-80">{suffix}</span>}
        </p>
        {subtitle && <p className="text-white/70 text-sm">{subtitle}</p>}
      </motion.div>

      {funFact && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="z-10 rounded-2xl px-4 py-3 text-sm text-center text-white"
          style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)' }}>
          {funFact}
        </motion.div>
      )}
    </div>
  )
}
