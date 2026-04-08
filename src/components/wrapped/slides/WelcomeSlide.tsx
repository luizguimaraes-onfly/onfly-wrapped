'use client'

import { motion } from 'framer-motion'
import { gradients } from '@/lib/design'

interface WelcomeSlideProps {
  name: string
  period: string
  subtitle?: string
}

export function WelcomeSlide({ name, period, subtitle }: WelcomeSlideProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center px-8 gap-5 w-full h-full relative overflow-hidden"
      style={{ background: gradients.slide }}>

      {/* Subtle white orbs for depth */}
      {[
        { size: 280, x: '-10%', y: '-20%', delay: 0 },
        { size: 200, x: '65%',  y: '60%',  delay: 0.4 },
        { size: 160, x: '70%',  y: '-25%', delay: 0.8 },
      ].map((orb, i) => (
        <motion.div key={i} className="absolute rounded-full blur-3xl pointer-events-none"
          style={{ width: orb.size, height: orb.size, background: '#ffffff', opacity: 0.08, left: orb.x, top: orb.y }}
          animate={{ scale: [1, 1.15, 1], opacity: [0.06, 0.12, 0.06] }}
          transition={{ duration: 3 + i * 0.5, repeat: Infinity, delay: orb.delay }} />
      ))}

      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 14 }}
        className="z-10 w-16 h-16 rounded-2xl flex items-center justify-center overflow-hidden"
        style={{ background: 'rgba(255,255,255,0.2)', border: '1.5px solid rgba(255,255,255,0.35)', boxShadow: '0 8px 32px rgba(0,0,0,0.15)' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo-onfly.svg" alt="Onfly" className="w-10 h-10 brightness-0 invert" />
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }} className="z-10 flex flex-col gap-2">
        <p className="text-white/60 text-xs uppercase tracking-widest font-semibold">Onfly Wrapped</p>
        <h1 className="text-3xl sm:text-4xl font-black text-white leading-tight">{name}</h1>
        <p className="text-white font-bold text-lg opacity-90">{period}</p>
        {subtitle && <p className="text-white/60 text-sm">{subtitle}</p>}
      </motion.div>

      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
        className="z-10 text-white/40 text-xs mt-2">
        Toque para avançar →
      </motion.p>
    </div>
  )
}
