'use client'

import { motion } from 'framer-motion'
import { gradients } from '@/lib/design'

interface Item {
  label: string
  sublabel?: string
  value: string
  rank: number
  rawCount: number
}

interface TopListSlideProps {
  emoji: string
  title: string
  subtitle?: string
  items: Item[]
  accentColor?: string
}

const MEDALS = ['🥇', '🥈', '🥉']

export function TopListSlide({ emoji, title, subtitle, items }: TopListSlideProps) {
  const max = Math.max(...items.map(i => i.rawCount), 1)

  return (
    <div className="flex flex-col items-center justify-center px-6 py-8 gap-5 w-full h-full relative overflow-hidden"
      style={{ background: gradients.slide }}>

      <div className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(255,255,255,0.1) 0%, transparent 60%)' }} />

      <div className="flex flex-col gap-4 w-full z-10">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-3xl">{emoji}</span>
          </div>
          <h2 className="text-xl font-black text-white">{title}</h2>
          {subtitle && <p className="text-white/60 text-xs mt-0.5">{subtitle}</p>}
        </motion.div>

        <div className="flex flex-col gap-2.5">
          {items.map((item, i) => (
            <motion.div key={i}
              initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 + i * 0.1 }}
              className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-base flex-shrink-0">{MEDALS[i] ?? `#${item.rank}`}</span>
                  <div className="min-w-0">
                    <p className="text-white font-semibold text-sm truncate">{item.label}</p>
                    {item.sublabel && <p className="text-white/55 text-xs truncate">{item.sublabel}</p>}
                  </div>
                </div>
                <span className="text-xs font-bold flex-shrink-0 ml-2 text-white/80">{item.value}</span>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden bg-white/20">
                <motion.div className="h-full rounded-full bg-white"
                  initial={{ width: 0 }}
                  animate={{ width: `${(item.rawCount / max) * 100}%` }}
                  transition={{ delay: 0.3 + i * 0.1, duration: 0.6, ease: 'easeOut' }} />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}
