'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { signUpSchema, signInSchema } from '@/types'

interface AuthResult {
  error?: string
}

export async function signUpAction(formData: FormData): Promise<AuthResult> {
  const raw = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
    full_name: formData.get('full_name') as string,
  }

  const validated = signUpSchema.safeParse(raw)
  if (!validated.success) {
    return { error: validated.error.issues[0].message }
  }

  const supabase = await createServerSupabaseClient()
  const { error } = await supabase.auth.signUp({
    email: raw.email,
    password: raw.password,
    options: {
      data: { full_name: raw.full_name },
    },
  })

  if (error) {
    if (error.message.includes('already registered')) {
      return { error: 'Cet email est déjà utilisé' }
    }
    return { error: error.message }
  }

  redirect('/dashboard')
}

export async function signInAction(formData: FormData): Promise<AuthResult> {
  const raw = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const validated = signInSchema.safeParse(raw)
  if (!validated.success) {
    return { error: validated.error.issues[0].message }
  }

  const supabase = await createServerSupabaseClient()
  const { error } = await supabase.auth.signInWithPassword({
    email: raw.email,
    password: raw.password,
  })

  if (error) {
    return { error: 'Email ou mot de passe incorrect' }
  }

  redirect('/dashboard')
}

export async function signOutAction(): Promise<void> {
  const supabase = await createServerSupabaseClient()
  await supabase.auth.signOut()
  redirect('/login')
}
