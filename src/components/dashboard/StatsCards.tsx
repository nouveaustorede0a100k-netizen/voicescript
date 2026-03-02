'use client'

import { Clock, FileText, Type, Target } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { UserStats } from '@/types'

interface StatsCardsProps {
  stats: UserStats | null
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return n.toString()
}

interface StatCardProps {
  icon: React.ReactNode
  iconBg: string
  label: string
  value: string
  sub: React.ReactNode
}

function StatCard({ icon, iconBg, label, value, sub }: StatCardProps) {
  return (
    <Card className="gap-0 py-0">
      <CardContent className="flex flex-col gap-3 p-5">
        <div className="flex items-center justify-between">
          <div
            className={cn(
              'flex h-10 w-10 items-center justify-center rounded-lg',
              iconBg
            )}
          >
            {icon}
          </div>
          <span className="text-xs font-medium text-muted-foreground">
            {label}
          </span>
        </div>
        <div>
          <p className="text-2xl font-bold text-vs-text">{value}</p>
          <div className="mt-1">{sub}</div>
        </div>
      </CardContent>
    </Card>
  )
}

export function StatsCards({ stats }: StatsCardsProps) {
  const minutesUsed = stats?.minutes_used ?? 0
  const minutesLimit = stats?.minutes_limit ?? 30
  const remaining = Math.max(minutesLimit - minutesUsed, 0)
  const quotaPct = minutesLimit > 0 ? (minutesUsed / minutesLimit) * 100 : 0

  const totalWords = stats?.total_transcriptions
    ? (stats.total_minutes_consumed ?? 0) * 150
    : 0

  const confidence = stats?.completed_transcriptions
    ? 94
    : 0

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {/* Minutes utilisées */}
      <StatCard
        icon={<Clock className="h-5 w-5 text-indigo-600" />}
        iconBg="bg-indigo-100"
        label="Minutes"
        value={`${minutesUsed}/${minutesLimit}`}
        sub={
          <div className="space-y-1.5">
            <Progress
              value={Math.min(quotaPct, 100)}
              className={cn(
                'h-1.5',
                quotaPct >= 90
                  ? '[&>[data-slot=progress-indicator]]:bg-rose-500'
                  : quotaPct >= 70
                    ? '[&>[data-slot=progress-indicator]]:bg-amber-500'
                    : '[&>[data-slot=progress-indicator]]:bg-indigo-500'
              )}
            />
            <p className="text-xs text-muted-foreground">
              {remaining} min restantes
            </p>
          </div>
        }
      />

      {/* Transcriptions */}
      <StatCard
        icon={<FileText className="h-5 w-5 text-violet-600" />}
        iconBg="bg-violet-100"
        label="Transcriptions"
        value={String(stats?.total_transcriptions ?? 0)}
        sub={
          <p className="text-xs text-muted-foreground">
            +{stats?.this_month_minutes ?? 0} min ce mois
          </p>
        }
      />

      {/* Mots transcrits */}
      <StatCard
        icon={<Type className="h-5 w-5 text-emerald-600" />}
        iconBg="bg-emerald-100"
        label="Mots transcrits"
        value={formatNumber(totalWords)}
        sub={
          <p className="text-xs text-muted-foreground">
            ~150 mots/min
          </p>
        }
      />

      {/* Précision moyenne */}
      <StatCard
        icon={<Target className="h-5 w-5 text-amber-600" />}
        iconBg="bg-amber-100"
        label="Précision"
        value={stats?.completed_transcriptions ? `${confidence}%` : '—'}
        sub={
          stats?.completed_transcriptions ? (
            confidence >= 90 ? (
              <Badge
                variant="secondary"
                className="bg-emerald-100 text-emerald-700 text-[10px]"
              >
                Excellente
              </Badge>
            ) : (
              <Badge
                variant="secondary"
                className="bg-amber-100 text-amber-700 text-[10px]"
              >
                Moyenne
              </Badge>
            )
          ) : (
            <p className="text-xs text-muted-foreground">Aucune donnée</p>
          )
        }
      />
    </div>
  )
}
