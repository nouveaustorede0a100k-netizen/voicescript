'use client'

import { useState, useCallback, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import {
  Crown,
  Star,
  Check,
  Loader2,
  ExternalLink,
  Zap,
} from 'lucide-react'
import { PLANS, formatPrice } from '@/lib/config/plans'
import type { Profile, PlanType } from '@/types'

interface BillingSectionProps {
  profile: Profile
}

const PLAN_ORDER: PlanType[] = ['free', 'creator', 'pro', 'studio']

const PLAN_BADGE_COLORS: Record<PlanType, string> = {
  free: 'bg-slate-100 text-slate-700',
  creator: 'bg-indigo-100 text-indigo-700',
  pro: 'bg-violet-100 text-violet-700',
  studio: 'bg-amber-100 text-amber-700',
}

const PLAN_ICONS: Record<PlanType, React.ReactNode> = {
  free: <Zap className="h-5 w-5" />,
  creator: <Star className="h-5 w-5" />,
  pro: <Crown className="h-5 w-5" />,
  studio: <Crown className="h-5 w-5" />,
}

export function BillingSection({ profile }: BillingSectionProps) {
  const searchParams = useSearchParams()
  const [loadingPlan, setLoadingPlan] = useState<PlanType | null>(null)
  const [loadingPortal, setLoadingPortal] = useState(false)

  const currentPlan = profile.plan as PlanType
  const planConfig = PLANS[currentPlan]
  const usagePercent = planConfig.minutes_limit > 0
    ? Math.min((profile.minutes_used / planConfig.minutes_limit) * 100, 100)
    : 0
  const minutesRemaining = Math.max(
    planConfig.minutes_limit - profile.minutes_used,
    0
  )

  useEffect(() => {
    if (searchParams.get('success') === 'true') {
      toast.success('Abonnement mis à jour avec succès !')
    }
    if (searchParams.get('canceled') === 'true') {
      toast.info('Mise à jour annulée')
    }
  }, [searchParams])

  const handleCheckout = useCallback(async (plan: PlanType) => {
    const config = PLANS[plan]
    if (!config.stripe_price_id) {
      toast.error("Ce plan n'est pas encore disponible")
      return
    }

    setLoadingPlan(plan)
    try {
      const res = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ price_id: config.stripe_price_id }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.error ?? 'Erreur lors de la redirection')
      }

      const { url } = await res.json()
      window.location.href = url
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Erreur lors de la redirection'
      )
    } finally {
      setLoadingPlan(null)
    }
  }, [])

  const handlePortal = useCallback(async () => {
    setLoadingPortal(true)
    try {
      const res = await fetch('/api/billing/portal', {
        method: 'POST',
      })

      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.error ?? 'Erreur')
      }

      const { url } = await res.json()
      window.location.href = url
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Erreur lors de la redirection'
      )
    } finally {
      setLoadingPortal(false)
    }
  }, [])

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Plan actuel */}
      <Card>
        <CardHeader>
          <CardTitle>Votre plan actuel</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <div
              className={`flex items-center justify-center h-10 w-10 rounded-full ${PLAN_BADGE_COLORS[currentPlan]}`}
            >
              {PLAN_ICONS[currentPlan]}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="font-semibold text-lg">{planConfig.name}</p>
                <Badge variant="secondary" className={PLAN_BADGE_COLORS[currentPlan]}>
                  Plan actuel
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {planConfig.minutes_limit} minutes / mois
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Minutes utilisées</span>
              <span className="font-medium">
                {profile.minutes_used} / {planConfig.minutes_limit}
              </span>
            </div>
            <Progress value={usagePercent} className="h-2" />
            <p className="text-xs text-muted-foreground">
              {minutesRemaining} minute{minutesRemaining !== 1 ? 's' : ''}{' '}
              restante{minutesRemaining !== 1 ? 's' : ''}
            </p>
          </div>

          {currentPlan !== 'free' && (
            <Button
              variant="outline"
              onClick={handlePortal}
              disabled={loadingPortal}
            >
              {loadingPortal ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <ExternalLink className="h-4 w-4 mr-2" />
              )}
              Gérer mon abonnement
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Changer de plan */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Changer de plan</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {PLAN_ORDER.filter((p) => p !== 'free').map((planKey) => {
            const plan = PLANS[planKey]
            const isCurrent = planKey === currentPlan
            const isPopular = planKey === 'pro'
            const currentIndex = PLAN_ORDER.indexOf(currentPlan)
            const planIndex = PLAN_ORDER.indexOf(planKey)
            const isDowngrade = planIndex < currentIndex
            const isUpgrade = planIndex > currentIndex

            return (
              <Card
                key={planKey}
                className={`relative ${
                  isPopular
                    ? 'border-primary shadow-md ring-1 ring-primary/20'
                    : ''
                } ${isCurrent ? 'opacity-70' : ''}`}
              >
                {isPopular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground">
                      <Star className="h-3 w-3 mr-1" />
                      Populaire
                    </Badge>
                  </div>
                )}
                <CardContent className="pt-6 space-y-4">
                  <div>
                    <h3 className="font-semibold text-lg">{plan.name}</h3>
                    <div className="flex items-baseline gap-1 mt-1">
                      <span className="text-3xl font-bold">
                        {formatPrice(plan.price)}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        / mois
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {plan.minutes_limit} minutes / mois
                    </p>
                  </div>

                  <ul className="space-y-2">
                    {plan.features.map((feature) => (
                      <li
                        key={feature}
                        className="flex items-start gap-2 text-sm"
                      >
                        <Check className="h-4 w-4 shrink-0 text-emerald-500 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {isCurrent ? (
                    <Button disabled className="w-full" variant="secondary">
                      Plan actuel
                    </Button>
                  ) : isDowngrade ? (
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={handlePortal}
                      disabled={loadingPortal}
                    >
                      Rétrograder
                    </Button>
                  ) : isUpgrade ? (
                    <Button
                      className="w-full"
                      onClick={() => handleCheckout(planKey)}
                      disabled={!!loadingPlan}
                    >
                      {loadingPlan === planKey ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Redirection…
                        </>
                      ) : (
                        'Choisir ce plan'
                      )}
                    </Button>
                  ) : null}
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Historique de facturation */}
      {currentPlan !== 'free' && (
        <Card>
          <CardHeader>
            <CardTitle>Historique de facturation</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Consultez et téléchargez vos factures depuis le{' '}
              <button
                onClick={handlePortal}
                className="text-primary underline-offset-4 hover:underline"
                disabled={loadingPortal}
              >
                portail de facturation Stripe
              </button>
              .
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
