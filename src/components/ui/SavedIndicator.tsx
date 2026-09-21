import { Check, Loader2 } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

export function SavedIndicator({ status }: { status: SaveStatus }) {
  return (
    <AnimatePresence mode="wait">
      {status !== 'idle' && (
        <motion.div
          key={status}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="flex items-center gap-1.5 text-xs font-semibold text-muted"
        >
          {status === 'saving' && (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden /> Salvando…
            </>
          )}
          {status === 'saved' && (
            <>
              <Check className="h-3.5 w-3.5 text-success" aria-hidden /> Salvo
            </>
          )}
          {status === 'error' && <span className="text-danger">Não foi possível salvar. Tente de novo.</span>}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
