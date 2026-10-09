import { AlertTriangle, Loader2 } from 'lucide-react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

interface ConfirmDialogProps {
  open: boolean
  title: string
  description: ReactNode
  confirmLabel: string
  onConfirm: () => Promise<void> | void
  onClose: () => void
}

/**
 * Confirmação para ações destrutivas (apagar). O foco começa em "Cancelar" — Enter por engano
 * nunca apaga. Fecha com Esc ou clique fora, exceto enquanto a ação está em andamento.
 */
export function ConfirmDialog({ open, title, description, confirmLabel, onConfirm, onClose }: ConfirmDialogProps) {
  const reduzir = useReducedMotion()
  const [executando, setExecutando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const cancelarRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    setErro(null)
    const t = window.setTimeout(() => cancelarRef.current?.focus(), 50)
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !executando) onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => {
      window.clearTimeout(t)
      document.removeEventListener('keydown', onKey)
    }
  }, [open, executando, onClose])

  async function confirmar() {
    setExecutando(true)
    setErro(null)
    try {
      await onConfirm()
      onClose()
    } catch (e) {
      console.error(e)
      setErro('Não foi possível apagar agora. Verifique a conexão e tente de novo.')
    } finally {
      setExecutando(false)
    }
  }

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center p-4 sm:items-center">
          <motion.div
            className="absolute inset-0 bg-graphite/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => !executando && onClose()}
            aria-hidden
          />
          <motion.div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-title"
            initial={reduzir ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={reduzir ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: 12 }}
            transition={reduzir ? { duration: 0.15 } : { type: 'spring', bounce: 0, duration: 0.3 }}
            className="relative w-full max-w-sm rounded-card bg-surface p-6 shadow-[0_24px_60px_rgba(15,27,45,0.25)]"
            style={{ marginBottom: 'env(safe-area-inset-bottom, 0px)' }}
          >
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-danger-soft">
              <AlertTriangle className="h-5 w-5 text-danger" aria-hidden />
            </div>
            <h2 id="confirm-title" className="text-lg font-bold text-graphite">
              {title}
            </h2>
            <div className="mt-1.5 text-sm text-muted">{description}</div>
            {erro && (
              <p role="alert" className="mt-3 text-sm font-medium text-danger">
                {erro}
              </p>
            )}
            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                ref={cancelarRef}
                type="button"
                onClick={onClose}
                disabled={executando}
                className="h-12 cursor-pointer rounded-button border border-[#D9D3C7] bg-surface px-5 text-sm font-bold text-graphite transition-colors hover:bg-chip focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sun disabled:opacity-50"
              >
                Cancelar
              </button>
              <motion.button
                type="button"
                onClick={confirmar}
                disabled={executando}
                whileTap={reduzir ? undefined : { scale: 0.97 }}
                className="flex h-12 cursor-pointer items-center justify-center gap-2 rounded-button bg-[#9A3412] px-5 text-sm font-extrabold text-white transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9A3412] focus-visible:ring-offset-2 disabled:opacity-60"
              >
                {executando && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
                {executando ? 'Apagando…' : confirmLabel}
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
