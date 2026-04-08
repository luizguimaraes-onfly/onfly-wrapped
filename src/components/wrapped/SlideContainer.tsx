'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { motion, AnimatePresence, useMotionValue, useTransform, animate, type MotionValue } from 'framer-motion'
import { colors, slideContainerShadow } from '@/lib/design'

const SLIDE_DURATION = 7

export interface CaptionData {
  type: 'traveler' | 'company'
  period: string
  data: Record<string, unknown>
}

interface SlideContainerProps {
  slides: React.ReactNode[]
  onComplete?: () => void
  shareText?: string
  captionData?: CaptionData
}

const variants = {
  enter: (dir: number) => ({ x: dir > 0 ? '30%' : '-30%', opacity: 0, scale: 0.98 }),
  center: { x: 0, opacity: 1, scale: 1 },
  exit:  (dir: number) => ({ x: dir > 0 ? '-12%' : '12%', opacity: 0, scale: 0.98 }),
}

function ProgressBar({ state, progress }: { state: 'past' | 'active' | 'future'; progress: MotionValue<number> }) {
  const width = useTransform(progress, v => `${v}%`)
  return (
    <div className="flex-1 h-[3px] rounded-full overflow-hidden bg-white/25">
      {state === 'past'   && <div className="h-full bg-white/70 w-full rounded-full" />}
      {state === 'active' && <motion.div className="h-full bg-white rounded-full" style={{ width }} />}
    </div>
  )
}

export function SlideContainer({ slides, onComplete, shareText, captionData }: SlideContainerProps) {
  const [current, setCurrent]     = useState(0)
  const [direction, setDirection] = useState(1)
  const [paused, setPaused]       = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [imageUrl, setImageUrl]   = useState<string | null>(null)
  const [imageBlob, setImageBlob] = useState<Blob | null>(null)
  const [capturing, setCapturing] = useState(false)
  const [copied, setCopied]       = useState(false)
  const [aiCaption, setAiCaption]         = useState<string | null>(null)
  const [captionLoading, setCaptionLoading] = useState(false)

  const containerRef = useRef<HTMLDivElement>(null)
  const modalRef     = useRef<HTMLDivElement>(null)
  const animRef      = useRef<{ stop: () => void; pause: () => void; play: () => void } | null>(null)
  const goNextRef    = useRef<() => void>(() => {})
  const progress     = useMotionValue(0)

  const postText = aiCaption ?? shareText ?? '✈️ Esse foi meu ano em viagens corporativas!\n\n#OnflyWrapped #ViagensCorporativas #Onfly'

  const goNext = useCallback(() => {
    if (current < slides.length - 1) { setDirection(1); setCurrent(c => c + 1) }
    else onComplete?.()
  }, [current, slides.length, onComplete])

  const goPrev = useCallback(() => {
    if (current > 0) { setDirection(-1); setCurrent(c => c - 1) }
  }, [current])

  useEffect(() => { goNextRef.current = goNext }, [goNext])

  useEffect(() => {
    if (modalOpen) { animRef.current?.stop(); return }
    progress.set(0)
    const anim = animate(progress, 100, {
      duration: SLIDE_DURATION,
      ease: 'linear',
      onComplete: () => goNextRef.current(),
    })
    animRef.current = anim
    return () => anim.stop()
  }, [current, modalOpen, progress])

  useEffect(() => {
    if (paused) animRef.current?.pause()
    else animRef.current?.play()
  }, [paused])

  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      if (modalOpen) { if (e.key === 'Escape') setModalOpen(false); return }
      if (['ArrowRight', 'ArrowDown', ' '].includes(e.key)) goNext()
      if (['ArrowLeft', 'ArrowUp'].includes(e.key)) goPrev()
    }
    window.addEventListener('keydown', fn)
    return () => window.removeEventListener('keydown', fn)
  }, [goNext, goPrev, modalOpen])

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (modalOpen) return
    if ((e.target as HTMLElement).closest('button, a, input, select, [data-interactive]')) return
    const rect = e.currentTarget.getBoundingClientRect()
    if (e.clientX - rect.left < rect.width * 0.33) goPrev()
    else goNext()
  }

  const captureSlide = useCallback(async () => {
    if (!containerRef.current) return
    setCapturing(true)
    const modal = modalRef.current
    try {
      const { toPng } = await import('html-to-image')
      if (modal) modal.style.visibility = 'hidden'
      await new Promise(r => setTimeout(r, 60))
      const dataUrl = await toPng(containerRef.current, { pixelRatio: 2, backgroundColor: '#ffffff' })
      if (modal) modal.style.visibility = ''
      setImageUrl(dataUrl)
      const res = await fetch(dataUrl)
      setImageBlob(await res.blob())
    } catch (err) {
      console.error('[capture]', err)
      if (modal) modal.style.visibility = ''
    } finally { setCapturing(false) }
  }, [])

  useEffect(() => {
    if (modalOpen) { const t = setTimeout(captureSlide, 120); return () => clearTimeout(t) }
  }, [modalOpen, captureSlide])

  const handleGenerateCaption = async () => {
    if (!captionData || captionLoading) return
    setCaptionLoading(true)
    try {
      const res = await fetch('/api/wrapped/caption', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(captionData),
      })
      const d = await res.json()
      if (d.text) setAiCaption(d.text)
    } catch { /* mantém texto estático */ }
    finally { setCaptionLoading(false) }
  }

  const handleCopy = async () => {
    try { await navigator.clipboard.writeText(postText); setCopied(true); setTimeout(() => setCopied(false), 2000) }
    catch { /* ignore */ }
  }

  const handleDownload = () => {
    if (!imageBlob) return
    const url = URL.createObjectURL(imageBlob)
    Object.assign(document.createElement('a'), { href: url, download: 'onfly-wrapped.png' }).click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#eef3ff] md:p-6">
      <div
        ref={containerRef}
        className="relative overflow-hidden select-none cursor-pointer w-full h-[100dvh] md:w-[400px] md:h-[780px] md:rounded-[2.5rem]"
        style={{ background: '#ffffff', boxShadow: slideContainerShadow }}
        onClick={handleClick}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        {/* Progress bars */}
        <div className="absolute top-0 left-0 right-0 z-30 flex gap-1 px-3 pt-3">
          {slides.map((_, i) => (
            <ProgressBar key={i} state={i < current ? 'past' : i === current ? 'active' : 'future'} progress={progress} />
          ))}
        </div>

        {/* Share button */}
        <button
          onClick={e => { e.stopPropagation(); setModalOpen(true) }}
          className="absolute top-8 right-4 z-30 w-9 h-9 rounded-full flex items-center justify-center transition-colors"
          style={{ background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.35)' }}
        >
          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
          </svg>
        </button>

        {/* Paused indicator */}
        <AnimatePresence>
          {paused && !modalOpen && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute top-10 left-4 z-30 flex gap-0.5 pointer-events-none">
              <div className="w-1 h-3.5 bg-[#0d1b2e]/50 rounded-full" />
              <div className="w-1 h-3.5 bg-[#0d1b2e]/50 rounded-full" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Slides */}
        <AnimatePresence mode="sync" custom={direction}>
          <motion.div
            key={current}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 1.4, ease: [0.32, 0.72, 0, 1] }}
            className="absolute inset-0 flex items-center justify-center"
          >
            {slides[current]}
          </motion.div>
        </AnimatePresence>

        {/* Counter */}
        {!modalOpen && (
          <div className="absolute bottom-5 left-0 right-0 z-30 flex justify-center pointer-events-none">
            <span className="text-[#0d1b2e]/30 text-xs">{current + 1} / {slides.length}</span>
          </div>
        )}
      </div>

      {/* Share modal */}
      <AnimatePresence>
        {modalOpen && (
          <motion.div ref={modalRef} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setModalOpen(false)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.93, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.93, y: 16 }}
              transition={{ type: 'spring', stiffness: 320, damping: 30 }}
              className="w-full max-w-sm rounded-3xl p-6 flex flex-col gap-4"
              style={{ background: '#1a2d45', border: '1px solid rgba(255,255,255,0.1)' }}
              onClick={e => e.stopPropagation()}>

              <div className="flex items-center justify-between">
                <h3 className="text-white font-bold text-lg">Compartilhar</h3>
                <button onClick={() => setModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/60 hover:bg-white/20 transition-colors text-lg leading-none">×</button>
              </div>

              {/* Preview */}
              <div className="w-full rounded-2xl border border-white/10 overflow-hidden flex items-center justify-center"
                style={{ height: 160, background: 'rgba(255,255,255,0.04)' }}>
                {imageUrl
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img src={imageUrl} alt="Preview" className="w-full h-full object-cover object-center" />
                  : <div className="flex flex-col items-center gap-2 text-white/30">
                      <div className="w-5 h-5 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
                      <span className="text-xs">{capturing ? 'Capturando…' : 'Indisponível'}</span>
                    </div>}
              </div>

              {/* Caption */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-white/40 text-xs uppercase tracking-wider">Texto sugerido</p>
                  {captionData && (
                    <button onClick={handleGenerateCaption} disabled={captionLoading}
                      className="flex items-center gap-1 text-xs text-[#5a9fff] hover:text-white transition-colors disabled:opacity-50">
                      {captionLoading
                        ? <span className="w-3 h-3 border border-[#5a9fff] border-t-transparent rounded-full animate-spin inline-block" />
                        : '✨'}
                      {captionLoading ? 'Gerando…' : aiCaption ? 'Gerar novamente' : 'Gerar com IA'}
                    </button>
                  )}
                </div>
                <div className="rounded-xl p-3 text-white/70 text-sm leading-relaxed border border-white/10 whitespace-pre-line max-h-32 overflow-y-auto"
                  style={{ background: 'rgba(255,255,255,0.05)' }}>{postText}</div>
              </div>

              <div className="flex gap-3">
                <button onClick={handleCopy}
                  className="flex-1 py-2.5 rounded-xl font-semibold text-sm border border-white/20 text-white hover:bg-white/10 transition-colors">
                  {copied ? '✓ Copiado!' : 'Copiar texto'}
                </button>
                <button onClick={handleDownload} disabled={!imageBlob}
                  className="flex-1 py-2.5 rounded-xl font-semibold text-sm border border-white/20 text-white hover:bg-white/10 transition-colors disabled:opacity-35 disabled:cursor-not-allowed">
                  Baixar imagem
                </button>
              </div>

              <a href="https://www.linkedin.com/feed/" target="_blank" rel="noopener noreferrer" onClick={handleCopy}
                className="w-full py-3 rounded-xl font-semibold text-white text-sm flex items-center justify-center gap-2 hover:brightness-110 transition-all"
                style={{ background: '#0A66C2' }}>
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
                Abrir LinkedIn e colar
              </a>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
