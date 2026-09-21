import { motion, useReducedMotion, type HTMLMotionProps } from 'motion/react'
import { Loader2 } from 'lucide-react'
import { forwardRef } from 'react'

type Variant = 'primary' | 'secondary' | 'dark'

interface ButtonProps extends Omit<HTMLMotionProps<'button'>, 'ref'> {
  variant?: Variant
  loading?: boolean
  fullWidth?: boolean
}

const variantClasses: Record<Variant, string> = {
  primary: 'bg-sun text-graphite',
  secondary: 'bg-surface text-graphite border border-[#D9D3C7]',
  dark: 'bg-graphite text-ivory',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', loading, fullWidth, className = '', children, disabled, ...props }, ref) => {
    const shouldReduceMotion = useReducedMotion()

    return (
      <motion.button
        ref={ref}
        disabled={disabled || loading}
        whileTap={shouldReduceMotion ? undefined : { scale: 0.97 }}
        transition={{ type: 'spring', bounce: 0, duration: 0.2 }}
        className={`inline-flex items-center justify-center gap-2 rounded-button px-6 font-extrabold text-sm
          h-14 md:h-[52px] min-w-[44px] min-h-[44px]
          transition-opacity disabled:opacity-50 disabled:pointer-events-none
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sun focus-visible:ring-offset-2
          ${variantClasses[variant]} ${fullWidth ? 'w-full' : ''} ${className}`}
        {...props}
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
        {children}
      </motion.button>
    )
  },
)
Button.displayName = 'Button'
