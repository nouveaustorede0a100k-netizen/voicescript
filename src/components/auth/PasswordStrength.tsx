'use client'

import { Check, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PasswordStrengthProps {
  password: string
}

interface Criterion {
  label: string
  test: (pw: string) => boolean
}

const CRITERIA: Criterion[] = [
  { label: 'Minimum 8 caractères', test: (pw) => pw.length >= 8 },
  { label: 'Au moins 1 majuscule', test: (pw) => /[A-Z]/.test(pw) },
  { label: 'Au moins 1 chiffre', test: (pw) => /\d/.test(pw) },
]

function getStrength(password: string): number {
  if (!password) return 0
  return CRITERIA.filter((c) => c.test(password)).length
}

export function PasswordStrength({ password }: PasswordStrengthProps) {
  const strength = getStrength(password)

  const barColor = (index: number): string => {
    if (index >= strength) return 'bg-border'
    if (strength === 1) return 'bg-rose-500'
    if (strength === 2) return 'bg-amber-500'
    return 'bg-emerald-500'
  }

  return (
    <div className="space-y-3">
      {/* Barres de force */}
      <div className="flex gap-1.5">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={cn(
              'h-1.5 flex-1 rounded-full transition-colors duration-200',
              barColor(i)
            )}
          />
        ))}
      </div>

      {/* Critères */}
      <ul className="space-y-1">
        {CRITERIA.map((criterion) => {
          const met = criterion.test(password)
          return (
            <li
              key={criterion.label}
              className={cn(
                'flex items-center gap-2 text-xs transition-colors',
                met ? 'text-emerald-600' : 'text-muted-foreground'
              )}
            >
              {met ? (
                <Check className="h-3.5 w-3.5 shrink-0" />
              ) : (
                <X className="h-3.5 w-3.5 shrink-0" />
              )}
              {criterion.label}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
