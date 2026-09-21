import { AnimatePresence, motion, useDragControls, useReducedMotion } from 'motion/react'
import { X } from 'lucide-react'
import { useEffect, useRef, type FocusEvent, type PointerEvent, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

interface SheetProps {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  footer?: ReactNode
  isDirty?: boolean
}

const CONFIRM_DESCARTE = 'Descartar as alterações não salvas?'

/**
 * Sheet inferior arrastável (celular) / diálogo centralizado (tablet/computador), em portal
 * no <body>. Segue a skill apple-design: o arraste para fechar só começa a partir da alça no
 * cabeçalho (nunca do corpo, que precisa rolar livremente), com mola e respeito à velocidade
 * do gesto; reduced-motion vira só fade.
 */
export function Sheet({ open, onClose, title, children, footer, isDirty }: SheetProps) {
  const shouldReduceMotion = useReducedMotion()
  const dragControls = useDragControls()
  const bodyRef = useRef<HTMLDivElement>(null)

  function attemptClose() {
    if (isDirty && !window.confirm(CONFIRM_DESCARTE)) return
    onClose()
  }

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') attemptClose()
    }
    document.addEventListener('keydown', onKey)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = previousOverflow
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, isDirty])

  function handleBodyFocus(e: FocusEvent<HTMLDivElement>) {
    const target = e.target
    if (target instanceof HTMLElement && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) {
      window.setTimeout(() => target.scrollIntoView({ block: 'center', behavior: 'smooth' }), 300)
    }
  }

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
            onClick={attemptClose}
            aria-hidden
          />
          <motion.div
            key="panel"
            role="dialog"
            aria-modal="true"
            aria-label={title}
            drag={shouldReduceMotion ? false : 'y'}
            dragListener={false}
            dragControls={dragControls}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0.15, bottom: 0.6 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 120 || info.velocity.y > 500) onClose()
            }}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={shouldReduceMotion ? { duration: 0.2 } : { type: 'spring', bounce: 0.2, duration: 0.3 }}
            className="absolute inset-x-0 bottom-0 flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-hero bg-ivory shadow-card
              md:inset-0 md:m-auto md:h-fit md:max-h-[85dvh] md:w-full md:max-w-[560px] md:rounded-card"
          >
            <div
              className="flex shrink-0 touch-none justify-center pb-1 pt-3 md:hidden"
              onPointerDown={(e: PointerEvent) => dragControls.start(e)}
            >
              <div className="h-1.5 w-10 rounded-pill bg-line" aria-hidden />
            </div>
            <div className="flex shrink-0 items-center justify-between gap-3 px-5 pb-3 pt-1 md:pt-5">
              <h2 className="text-lg font-bold text-graphite">{title}</h2>
              <button
                type="button"
                onClick={attemptClose}
                aria-label="Fechar"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-muted hover:bg-chip
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sun"
              >
                <X className="h-5 w-5" aria-hidden />
              </button>
            </div>
            <div
              ref={bodyRef}
              onFocus={handleBodyFocus}
              className="flex-1 overflow-y-auto overscroll-contain px-5"
              style={{ paddingBottom: footer ? '20px' : 'max(20px, env(safe-area-inset-bottom, 0px))' }}
            >
              {children}
            </div>
            {footer && (
              <div
                className="shrink-0 border-t border-line-soft bg-ivory px-5 py-4"
                style={{ paddingBottom: 'max(16px, env(safe-area-inset-bottom, 0px))' }}
              >
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
