import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { CheckCircle2 } from 'lucide-react'
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

interface ToastOpcoes {
  mensagem: string
  /** Botão de ação (ex.: "Desfazer"). */
  acao?: { rotulo: string; onClick: () => void | Promise<void> }
  duracaoMs?: number
}

interface ToastAtivo extends ToastOpcoes {
  id: number
}

const ToastContext = createContext<((opcoes: ToastOpcoes) => void) | null>(null)

/** Mostra um aviso curto no rodapé. Precisa estar dentro de `ToastProvider`. */
export function useToast() {
  const mostrar = useContext(ToastContext)
  if (!mostrar) throw new Error('useToast precisa estar dentro de <ToastProvider>.')
  return mostrar
}

/**
 * Avisos rápidos com ação de desfazer — o padrão para ações reversíveis (mover para a lixeira):
 * em vez de perguntar antes, faz na hora e oferece desfazer. Um aviso por vez; o novo substitui
 * o anterior. Fica parado enquanto o ponteiro está em cima.
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastAtivo | null>(null)
  const [pausado, setPausado] = useState(false)
  const [executando, setExecutando] = useState(false)
  const contador = useRef(0)
  const reduzir = useReducedMotion()

  const mostrar = useCallback((opcoes: ToastOpcoes) => {
    contador.current += 1
    setToast({ ...opcoes, id: contador.current })
    setExecutando(false)
  }, [])

  useEffect(() => {
    if (!toast || pausado) return
    const t = window.setTimeout(() => setToast(null), toast.duracaoMs ?? 6000)
    return () => window.clearTimeout(t)
  }, [toast, pausado])

  async function executarAcao() {
    if (!toast?.acao || executando) return
    setExecutando(true)
    try {
      await toast.acao.onClick()
      setToast(null)
    } catch (e) {
      console.error(e)
      setExecutando(false)
    }
  }

  return (
    <ToastContext.Provider value={mostrar}>
      {children}
      {createPortal(
        <div
          className="pointer-events-none fixed inset-x-0 z-[70] flex justify-center px-4 bottom-[calc(84px+env(safe-area-inset-bottom,0px))] sm:bottom-6"
          aria-live="polite"
        >
          <AnimatePresence>
            {toast && (
              <motion.div
                key={toast.id}
                role="status"
                onPointerEnter={() => setPausado(true)}
                onPointerLeave={() => setPausado(false)}
                initial={reduzir ? { opacity: 0 } : { opacity: 0, y: 24, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={reduzir ? { opacity: 0 } : { opacity: 0, y: 24, scale: 0.96 }}
                transition={reduzir ? { duration: 0.15 } : { type: 'spring', bounce: 0, duration: 0.35 }}
                className="pointer-events-auto flex max-w-md items-center gap-3 rounded-pill bg-[#0F1B2D] py-2 pl-4 pr-2 text-sm text-[#F7F4EE] shadow-[0_12px_32px_rgba(15,27,45,0.3)]"
              >
                <CheckCircle2 className="h-4 w-4 shrink-0 text-[#F2A516]" aria-hidden />
                <span className="font-semibold">{toast.mensagem}</span>
                {toast.acao && (
                  <button
                    type="button"
                    onClick={executarAcao}
                    disabled={executando}
                    className="shrink-0 cursor-pointer rounded-pill bg-white/10 px-3 py-1.5 text-xs font-extrabold text-[#F2A516] transition-colors hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F2A516] disabled:opacity-60"
                  >
                    {executando ? '…' : toast.acao.rotulo}
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>,
        document.body,
      )}
    </ToastContext.Provider>
  )
}
