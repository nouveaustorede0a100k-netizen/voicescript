'use client'

import { useTransition } from 'react'
import { useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { signInAction } from '@/lib/actions/auth'
import { signInSchema, type SignInData } from '@/types'

export function SignInForm() {
  const [isPending, startTransition] = useTransition()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirect') ?? '/dashboard'

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignInData>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: '', password: '' },
  })

  const onSubmit = (data: SignInData) => {
    startTransition(async () => {
      try {
        const formData = new FormData()
        formData.set('email', data.email)
        formData.set('password', data.password)
        formData.set('redirect', redirectTo)

        const result = await signInAction(formData)
        if (result?.error) {
          toast.error(result.error)
        }
      } catch {
        toast.error('Une erreur est survenue, veuillez réessayer')
      }
    })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Email */}
      <div className="space-y-2">
        <Label htmlFor="login-email">Email</Label>
        <Input
          id="login-email"
          type="email"
          placeholder="vous@exemple.com"
          autoFocus
          autoComplete="email"
          aria-invalid={!!errors.email}
          {...register('email')}
        />
        {errors.email && (
          <p className="text-xs text-destructive">{errors.email.message}</p>
        )}
      </div>

      {/* Mot de passe */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="login-password">Mot de passe</Label>
          <button
            type="button"
            className="text-xs font-medium text-primary hover:underline"
            tabIndex={-1}
          >
            Mot de passe oublié ?
          </button>
        </div>
        <Input
          id="login-password"
          type="password"
          placeholder="Votre mot de passe"
          autoComplete="current-password"
          aria-invalid={!!errors.password}
          {...register('password')}
        />
        {errors.password && (
          <p className="text-xs text-destructive">{errors.password.message}</p>
        )}
      </div>

      {/* Bouton */}
      <Button type="submit" className="h-11 w-full" disabled={isPending}>
        {isPending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Connexion en cours...
          </>
        ) : (
          'Se connecter'
        )}
      </Button>
    </form>
  )
}
