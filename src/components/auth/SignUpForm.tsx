'use client'

import { useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PasswordStrength } from '@/components/auth/PasswordStrength'
import { signUpAction } from '@/lib/actions/auth'
import { signUpSchema, type SignUpData } from '@/types'

export function SignUpForm() {
  const [isPending, startTransition] = useTransition()
  const [passwordValue, setPasswordValue] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignUpData>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { full_name: '', email: '', password: '' },
  })

  const onSubmit = (data: SignUpData) => {
    startTransition(async () => {
      try {
        const formData = new FormData()
        formData.set('full_name', data.full_name)
        formData.set('email', data.email)
        formData.set('password', data.password)

        const result = await signUpAction(formData)
        if (result?.error) {
          toast.error(result.error)
        }
      } catch {
        toast.error('Une erreur est survenue, veuillez réessayer')
      }
    })
  }

  const passwordRegister = register('password', {
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
      setPasswordValue(e.target.value)
    },
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Prénom */}
      <div className="space-y-2">
        <Label htmlFor="full_name">Prénom</Label>
        <Input
          id="full_name"
          placeholder="Votre prénom"
          autoFocus
          autoComplete="given-name"
          aria-invalid={!!errors.full_name}
          {...register('full_name')}
        />
        {errors.full_name && (
          <p className="text-xs text-destructive">{errors.full_name.message}</p>
        )}
      </div>

      {/* Email */}
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="vous@exemple.com"
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
        <Label htmlFor="password">Mot de passe</Label>
        <Input
          id="password"
          type="password"
          placeholder="Minimum 8 caractères"
          autoComplete="new-password"
          aria-invalid={!!errors.password}
          {...passwordRegister}
        />
        {errors.password && (
          <p className="text-xs text-destructive">{errors.password.message}</p>
        )}
        {/* Indicateur de force */}
        <PasswordStrength password={passwordValue} />
      </div>

      {/* Bouton */}
      <Button type="submit" className="h-11 w-full" disabled={isPending}>
        {isPending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Création en cours...
          </>
        ) : (
          'Créer mon compte'
        )}
      </Button>
    </form>
  )
}
