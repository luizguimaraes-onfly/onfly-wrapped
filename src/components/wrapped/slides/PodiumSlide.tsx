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

interface PodiumSlideProps {
  emoji: string
  title: string
  subtitle?: string
  items: Item[]
}

// Display order: 2nd (left), 1st (center), 3rd (right)
const PODIUM = [
  { srcIdx: 1, height: 76,  medal: '🥈', rankLabel: '2', growDelay: 0.45 },
  { srcIdx: 0, height: 104, medal: '🥇', rankLabel: '1', growDelay: 0.62 },
  { srcIdx: 2, height: 52,  medal: '🥉', rankLabel: '3', growDelay: 0.32 },
]

export function PodiumSlide({ emoji, title, subtitle, items }: PodiumSlideProps) {
  const podiumPositions = PODIUM.map(p => ({ ...p, item: items[p.srcIdx] })).filter(p => p.item)
  const honorable = items.slice(3, 5)

  return (
    <div className="flex flex-col px-5 py-5 gap-3 w-full h-full relative overflow-hidden justify-center"
      style={{ background: gradients.slide }}>

      <div className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(255,255,255,0.1) 0%, transparent 55%)' }} />

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }} className="z-10 flex-shrink-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-3xl">{emoji}</span>
        </div>
        <h2 className="text-xl font-black text-white">{title}</h2>
        {subtitle && <p className="text-white/60 text-xs mt-0.5">{subtitle}</p>}
      </motion.div>

      {/* Podium */}
      <div className="flex items-end justify-center gap-1.5 z-10 flex-shrink-0">
        {podiumPositions.map((pos, displayIdx) => {
          const is1st = pos.rankLabel === '1'
          const labelDelay = pos.growDelay + 0.22

          return (
            // min-w-0 is critical for truncate to work inside flex-1
            <div key={displayIdx} className="flex-1 min-w-0 flex flex-col items-center">

              {/* Label above block — w-full + overflow-hidden ensures truncate works */}
              <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: labelDelay }}
                className="w-full overflow-hidden text-center px-0.5 mb-1.5">
                <motion.span
                  initial={{ scale: 0 }} animate={{ scale: 1 }}
                  transition={{ delay: labelDelay, type: 'spring', stiffness: 260, damping: 15 }}
                  className={`block ${is1st ? 'text-2xl' : 'text-lg'}`}>{pos.medal}</motion.span>
                <p className="text-white text-[11px] font-bold truncate mt-0.5 leading-tight">
                  {pos.item.label}
                </p>
                <p className="text-white/60 text-[10px] font-semibold mt-0.5 leading-tight">
                  {pos.item.value}
                </p>
              </motion.div>

              {/* Podium block grows upward */}
              <motion.div
                initial={{ height: 0 }} animate={{ height: pos.height }}
                transition={{ delay: pos.growDelay, duration: 0.5, ease: [0.34, 1.1, 0.64, 1] }}
                className="w-full rounded-t-xl overflow-hidden"
                style={{
                  background: is1st ? 'rgba(255,255,255,0.26)' : 'rgba(255,255,255,0.13)',
                  border: '1px solid rgba(255,255,255,0.22)',
                  borderBottom: 'none',
                }}>
                {is1st && (
                  <div className="w-full h-full"
                    style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.14) 0%, transparent 60%)' }} />
                )}
              </motion.div>
            </div>
          )
        })}
      </div>

      {/* Honorable mentions */}
      {honorable.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0 }} className="z-10 flex-shrink-0">
          <div className="flex items-center gap-2 mb-2">
            <div className="flex-1 h-px bg-white/20" />
            <p className="text-white/40 text-[10px] uppercase tracking-widest flex-shrink-0">menções honrosas</p>
            <div className="flex-1 h-px bg-white/20" />
          </div>
          <div className="flex flex-col gap-1.5">
            {honorable.map((item, i) => (
              <motion.div key={i}
                initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1.05 + i * 0.08 }}
                className="flex items-center justify-between px-3 py-1.5 rounded-xl min-w-0"
                style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <span className="text-white/40 text-xs font-bold flex-shrink-0">#{i + 4}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-white/80 text-xs font-semibold truncate">{item.label}</p>
                    {item.sublabel && (
                      <p className="text-white/40 text-[10px] truncate">{item.sublabel}</p>
                    )}
                  </div>
                </div>
                <span className="text-white/50 text-xs ml-2 flex-shrink-0">{item.value}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  )
}
