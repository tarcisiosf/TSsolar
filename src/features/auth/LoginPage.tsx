import { zodResolver } from '@hookform/resolvers/zod'
import { FirebaseError } from 'firebase/app'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Navigate, useLocation } from 'react-router-dom'
import { z } from 'zod'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useAuth } from '@/lib/auth'

const schema = z.object({
  email: z.string().min(1, 'Informe seu e-mail').email('Informe um e-mail válido'),
  senha: z.string().min(1, 'Informe sua senha'),
})

type FormValues = z.infer<typeof schema>

function mensagemErro(error: unknown): string {
  if (error instanceof FirebaseError) {
    switch (error.code) {
      case 'auth/invalid-credential':
      case 'auth/wrong-password':
      case 'auth/user-not-found':
        return 'E-mail ou senha incorretos. Confira e tente de novo.'
      case 'auth/invalid-email':
        return 'Esse e-mail não parece válido.'
      case 'auth/too-many-requests':
        return 'Muitas tentativas seguidas. Aguarde um pouco antes de tentar de novo.'
      default:
        return 'Não foi possível entrar agora. Tente novamente em instantes.'
    }
  }
  return 'Não foi possível entrar agora. Tente novamente em instantes.'
}

export function LoginPage() {
  const { user, isAdmin, signIn } = useAuth()
  const location = useLocation()
  const [erroGeral, setErroGeral] = useState<string | null>(null)
  const reduzir = useReducedMotion()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  if (user && isAdmin) {
    const destino = (location.state as { from?: Location })?.from?.pathname ?? '/app'
    return <Navigate to={destino} replace />
  }

  async function onSubmit(values: FormValues) {
    setErroGeral(null)
    try {
      await signIn(values.email, values.senha)
    } catch (error) {
      setErroGeral(mensagemErro(error))
    }
  }

  const entrar = (delay: number) =>
    reduzir
      ? { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { duration: 0.2 } }
      : { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 }, transition: { type: 'spring' as const, bounce: 0, duration: 0.6, delay } }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-ivory px-5">
      {/* Sol nascendo atrás do formulário */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-[-180px] h-[560px] w-[560px] rounded-full"
        style={{ x: '-50%', background: 'radial-gradient(circle, rgba(242,165,22,0.30) 0%, rgba(242,165,22,0.10) 40%, rgba(242,165,22,0) 70%)' }}
        initial={reduzir ? { opacity: 0 } : { opacity: 0, y: 140 }}
        animate={{ opacity: 1, y: 0 }}
        transition={reduzir ? { duration: 0.3 } : { type: 'spring', bounce: 0, duration: 1.6 }}
      />

      <div className="relative w-full max-w-sm">
        <motion.div {...entrar(0.1)} className="mb-8 flex flex-col items-center gap-3 text-center">
          <motion.img
            src="/logo.png"
            alt="TS Energia Solar"
            className="h-36 w-auto"
            initial={reduzir ? false : { scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', bounce: 0.2, duration: 0.9, delay: 0.15 }}
          />
          <h1 className="sr-only">TS Solar</h1>
          <p className="text-xs text-muted">em parceria com TechSolar</p>
        </motion.div>

        <motion.form
          {...entrar(0.22)}
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col gap-4 rounded-card border border-white/70 bg-surface/90 p-6 shadow-[0_20px_50px_rgba(15,27,45,0.08)] backdrop-blur-md"
        >
          <div className="mb-1">
            <p className="text-lg font-bold text-graphite">Entrar no painel</p>
            <p className="text-xs text-muted">Use o e-mail e a senha de administrador.</p>
          </div>
          <Input label="E-mail" type="email" autoComplete="email" error={errors.email?.message} {...register('email')} />
          <Input label="Senha" type="password" autoComplete="current-password" error={errors.senha?.message} {...register('senha')} />
          <AnimatePresence>
            {erroGeral && (
              <motion.p
                role="alert"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden text-sm font-medium text-danger"
              >
                {erroGeral}
              </motion.p>
            )}
          </AnimatePresence>
          <Button type="submit" variant="primary" fullWidth loading={isSubmitting} className="mt-2">
            Entrar
          </Button>
        </motion.form>
      </div>
    </div>
  )
}
