import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useEffect, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

interface SheetProps {
  open: boolean
  onClose: () => void
  title?: string
  children: ReactNode
}

/**
 * Sheet inferior arrastável (celular) / modal (computador). Segue a skill apple-design:
 * arrastável para fechar com rubber-band no limite superior, resposta a partir do valor
 * atual (não trava input durante a transição) e reduced-motion vira só fade.
 */
export function Sheet({ open, onClose, title, children }: SheetProps) {
  const shouldReduceMotion = useReducedMotion()

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = previousOverflow
    }
  }, [open, onClose])

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50">
          <motion.div
            key="scrim"
            className="absolute inset-0 bg-graphite/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            aria-hidden
          />
          <motion.div
            key="sheet"
            role="dialog"
            aria-modal="true"
            aria-label={title}
            className="absolute inset-x-0 bottom-0 mx-auto max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-t-hero
              bg-ivory shadow-card md:inset-0 md:top-1/2 md:bottom-auto md:-translate-y-1/2 md:rounded-card"
            style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={shouldReduceMotion ? { duration: 0.2 } : { type: 'spring', bounce: 0.2, duration: 0.3 }}
            drag={shouldReduceMotion ? false : 'y'}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0.15, bottom: 0.6 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 120 || info.velocity.y > 500) onClose()
            }}
          >
            <div className="mx-auto mt-3 h-1.5 w-10 shrink-0 rounded-pill bg-line md:hidden" aria-hidden />
            {title && <h2 className="px-5 pt-4 text-lg font-bold text-graphite md:pt-5">{title}</h2>}
            <div className="p-5">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
