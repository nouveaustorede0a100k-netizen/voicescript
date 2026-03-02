import Link from 'next/link'
import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { PlanType } from '@/types'

interface UpgradeBannerProps {
  plan: PlanType
  minutesUsed: number
  minutesLimit: number
}

const UPGRADE_MAP: Partial<
  Record<PlanType, { nextPlan: string; price: string }>
> = {
  free: { nextPlan: 'Creator', price: '9,90€' },
  creator: { nextPlan: 'Pro', price: '19,90€' },
  pro: { nextPlan: 'Studio', price: '49,90€' },
}

export function UpgradeBanner({
  plan,
  minutesUsed,
  minutesLimit,
}: UpgradeBannerProps) {
  const remaining = Math.max(minutesLimit - minutesUsed, 0)
  const pct = minutesLimit > 0 ? (minutesUsed / minutesLimit) * 100 : 0

  if (pct < 80 || plan === 'studio') return null

  const upgrade = UPGRADE_MAP[plan]
  if (!upgrade) return null

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-100">
          <AlertTriangle className="h-5 w-5 text-amber-600" />
        </div>
        <div>
          <p className="text-sm font-semibold text-amber-900">
            Il vous reste seulement {remaining}{' '}
            {remaining <= 1 ? 'minute' : 'minutes'} de transcription
          </p>
          <p className="text-sm text-amber-700">
            Passez au plan {upgrade.nextPlan} pour {upgrade.price}/mois
          </p>
        </div>
      </div>
      <Button
        asChild
        size="sm"
        className="shrink-0 bg-amber-600 hover:bg-amber-700"
      >
        <Link href="/pricing">Voir les plans</Link>
      </Button>
    </div>
  )
}
