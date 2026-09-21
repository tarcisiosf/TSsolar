import { zodResolver } from '@hookform/resolvers/zod'
import { FirebaseError } from 'firebase/app'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Navigate, useLocation } from 'react-router-dom'
import { z } from 'zod'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { SunLogo } from '@/components/ui/SunLogo'
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

  return (
    <div className="flex min-h-screen items-center justify-center bg-ivory px-5">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <SunLogo size={40} />
          <div>
            <h1 className="text-xl font-extrabold text-graphite">TS Solar</h1>
            <p className="text-xs text-muted">em parceria com TechSolar</p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 rounded-card bg-surface p-6 shadow-card">
          <Input
            label="E-mail"
            type="email"
            autoComplete="email"
            error={errors.email?.message}
            {...register('email')}
          />
          <Input
            label="Senha"
            type="password"
            autoComplete="current-password"
            error={errors.senha?.message}
            {...register('senha')}
          />
          {erroGeral && (
            <p role="alert" className="text-sm font-medium text-danger">
              {erroGeral}
            </p>
          )}
          <Button type="submit" variant="primary" fullWidth loading={isSubmitting} className="mt-2">
            Entrar
          </Button>
        </form>
      </div>
    </div>
  )
}
