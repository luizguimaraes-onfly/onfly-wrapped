'use client'

import { motion } from 'framer-motion'
import { gradients } from '@/lib/design'

interface ProductSlideProps {
  title?: string
  items: { type: string; count: number; amount?: number }[]
}

const PRODUCT_CONFIG: Record<string, { emoji: string; label: string }> = {
  flight: { emoji: '✈️', label: 'Aéreo' },
  hotel:  { emoji: '🏨', label: 'Hotel' },
  bus:    { emoji: '🚌', label: 'Ônibus' },
  auto:   { emoji: '🚗', label: 'Carro' },
}

function resolveConfig(type: string) {
  const t = type.toLowerCase()
  if (t.includes('flight') || t.includes('aéreo') || t.includes('voo')) return PRODUCT_CONFIG.flight
  if (t.includes('hotel'))                                                return PRODUCT_CONFIG.hotel
  if (t.includes('bus')   || t.includes('ônibus'))                       return PRODUCT_CONFIG.bus
  if (t.includes('auto')  || t.includes('carro') || t.includes('car'))  return PRODUCT_CONFIG.auto
  return { emoji: '🌍', label: type }
}

export function ProductSlide({ title = 'Como você viajou', items }: ProductSlideProps) {
  const total = items.reduce((s, i) => s + i.count, 0) || 1

  return (
    <div className="flex flex-col px-6 py-8 gap-5 w-full h-full relative overflow-hidden justify-center"
      style={{ background: gradients.slide }}>

      <div className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(255,255,255,0.1) 0%, transparent 55%)' }} />

      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }} className="z-10">
        <h2 className="text-xl font-black text-white">{title}</h2>
        <p className="text-white/60 text-xs mt-0.5">distribuição de reservas</p>
      </motion.div>

      <div className="flex flex-col gap-3 z-10">
        {items.map((item, i) => {
          const cfg = resolveConfig(item.type)
          const pct = Math.round((item.count / total) * 100)
          return (
            <motion.div key={i}
              initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 + i * 0.1 }}
              className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{cfg.emoji}</span>
                  <span className="text-white font-semibold text-sm">{cfg.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-white/55 text-xs">{item.count}×</span>
                  <span className="font-bold text-sm text-white">{pct}%</span>
                </div>
              </div>
              <div className="h-2 rounded-full overflow-hidden bg-white/20">
                <motion.div className="h-full rounded-full relative overflow-hidden bg-white/80"
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ delay: 0.3 + i * 0.1, duration: 0.7, ease: 'easeOut' }}>
                  <motion.div className="absolute inset-0 bg-white/40"
                    animate={{ x: ['-100%', '200%'] }}
                    transition={{ delay: 0.8 + i * 0.1, duration: 0.6, ease: 'easeInOut' }} />
                </motion.div>
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
