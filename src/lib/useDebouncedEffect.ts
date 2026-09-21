import { useEffect, useRef } from 'react'

/** Roda `effect` `delayMs` depois da última mudança em `deps`, pulando a primeira renderização. */
export function useDebouncedEffect(effect: () => void, deps: unknown[], delayMs: number): void {
  const primeiraRenderizacao = useRef(true)

  useEffect(() => {
    if (primeiraRenderizacao.current) {
      primeiraRenderizacao.current = false
      return
    }
    const timeout = setTimeout(effect, delayMs)
    return () => clearTimeout(timeout)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
}
