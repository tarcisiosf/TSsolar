import { animate, motion, useInView, useReducedMotion, type HTMLMotionProps, type Transition } from 'motion/react'
import { useEffect, useRef, useState, type ReactNode } from 'react'

/** Mola padrão da casa (apple-design): criticamente amortecida, sem quique. */
export const SPRING: Transition = { type: 'spring', bounce: 0, duration: 0.5 }
/** Mola curta para toque/feedback. */
export const SPRING_TAP: Transition = { type: 'spring', bounce: 0, duration: 0.2 }
const FADE: Transition = { duration: 0.2, ease: 'easeOut' }

interface RevealProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
  children?: ReactNode
  /** Atraso em segundos — use para escalonar elementos irmãos. */
  delay?: number
  /** Deslocamento vertical de entrada em px. */
  y?: number
}

/** Entra com leve subida + fade quando aparece na tela (uma vez só).
 * Com reduced-motion vira só fade, sem deslocamento. */
export function Reveal({ children, delay = 0, y = 16, ...props }: RevealProps) {
  const reduzir = useReducedMotion()
  return (
    <motion.div
      initial={{ opacity: 0, y: reduzir ? 0 : y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '0px 0px -8% 0px' }}
      transition={reduzir ? FADE : { ...SPRING, delay }}
      {...props}
    >
      {children}
    </motion.div>
  )
}

/** Container que escalona a entrada dos filhos `StaggerItem`.
 * Por padrão anima assim que monta — seguro para listas que chegam vazias e se enchem depois
 * (um container de altura zero pode nunca ser detectado na tela e deixaria os itens invisíveis).
 * `quandoVisivel` espera o container aparecer: use só em blocos que já nascem com conteúdo. */
export function Stagger({
  children,
  className,
  gap = 0.06,
  quandoVisivel = false,
  ...props
}: Omit<HTMLMotionProps<'div'>, 'children'> & { children?: ReactNode; gap?: number; quandoVisivel?: boolean }) {
  const gatilho = quandoVisivel ? { whileInView: 'visivel', viewport: { once: true, margin: '0px 0px -8% 0px' } } : { animate: 'visivel' }
  return (
    <motion.div
      className={className}
      initial="oculto"
      {...gatilho}
      variants={{ oculto: {}, visivel: { transition: { staggerChildren: gap } } }}
      {...props}
    >
      {children}
    </motion.div>
  )
}

export function StaggerItem({ children, className, ...props }: Omit<HTMLMotionProps<'div'>, 'children'> & { children?: ReactNode }) {
  const reduzir = useReducedMotion()
  return (
    <motion.div
      className={className}
      variants={{
        oculto: { opacity: 0, y: reduzir ? 0 : 12 },
        visivel: { opacity: 1, y: 0, transition: reduzir ? FADE : SPRING },
      }}
      {...props}
    >
      {children}
    </motion.div>
  )
}

/** Número que conta do zero até o valor quando entra na tela. Com reduced-motion
 * mostra o valor final direto. O texto final é sempre o formatado exato. */
export function CountUp({ value, format, duration = 1.1, className }: { value: number; format: (v: number) => string; duration?: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const visivel = useInView(ref, { once: true })
  const reduzir = useReducedMotion()
  const [atual, setAtual] = useState(reduzir ? value : 0)

  useEffect(() => {
    // Sem animação (reduced-motion ou aba em segundo plano, onde o navegador pausa os quadros):
    // mostra o valor final direto — nunca deixa um número parado no meio, como "Economia de 0%".
    if (reduzir || (typeof document !== 'undefined' && document.hidden)) {
      setAtual(value)
      return
    }
    if (!visivel) return
    const controles = animate(0, value, { duration, ease: [0.16, 1, 0.3, 1], onUpdate: setAtual, onComplete: () => setAtual(value) })
    // Garantia: mesmo se os quadros pararem no meio, o valor final aparece logo depois do fim previsto.
    const garantia = window.setTimeout(() => setAtual(value), duration * 1000 + 400)
    const aoVoltar = () => {
      if (document.hidden) return
      controles.stop()
      setAtual(value)
    }
    document.addEventListener('visibilitychange', aoVoltar)
    return () => {
      controles.stop()
      window.clearTimeout(garantia)
      document.removeEventListener('visibilitychange', aoVoltar)
    }
  }, [visivel, value, duration, reduzir])

  return (
    <span ref={ref} className={className}>
      {format(atual)}
    </span>
  )
}

/** Barra horizontal que cresce até `percent` (0–100) quando aparece. Ocupa o trilho inteiro:
 * quem é observado é o wrapper (largura real), porque a barra em scaleX 0 tem área zero e o
 * IntersectionObserver nem sempre a considera visível. */
export function GrowBar({ percent, className, delay = 0 }: { percent: number; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const visivel = useInView(ref, { once: true })
  const reduzir = useReducedMotion()
  const largura = `${Math.max(0, Math.min(100, percent))}%`
  return (
    <div ref={ref} className="h-full w-full">
      <motion.div
        className={className}
        style={{ width: largura, originX: 0 }}
        initial={{ scaleX: reduzir ? 1 : 0 }}
        animate={{ scaleX: visivel || reduzir ? 1 : 0 }}
        transition={reduzir ? { duration: 0 } : { type: 'spring', bounce: 0, duration: 0.9, delay }}
      />
    </div>
  )
}

/** Feedback de toque no pointer-down + leve elevação no hover (só transform, sem deslocar layout). */
export function Pressable({ children, className, lift = true, ...props }: Omit<HTMLMotionProps<'div'>, 'children'> & { children?: ReactNode; lift?: boolean }) {
  const reduzir = useReducedMotion()
  return (
    <motion.div
      className={className}
      whileHover={reduzir || !lift ? undefined : { y: -2 }}
      whileTap={reduzir ? undefined : { scale: 0.98 }}
      transition={SPRING_TAP}
      {...props}
    >
      {children}
    </motion.div>
  )
}
