'use client'

import { useCallback, useEffect, useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  FileAudio,
  Headphones,
  Video,
  MoreHorizontal,
  ExternalLink,
  Download,
  Trash2,
  Loader2,
  Upload,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import type { TranscriptionListItem, TranscriptionStatus } from '@/types'

interface RecentFilesProps {
  initialTranscriptions: TranscriptionListItem[]
}

const STATUS_CONFIG: Record<
  TranscriptionStatus,
  { label: string; className: string; spinning?: boolean }
> = {
  completed: { label: 'Terminé', className: 'bg-emerald-100 text-emerald-700' },
  processing: {
    label: 'En cours',
    className: 'bg-blue-100 text-blue-700',
    spinning: true,
  },
  pending: { label: 'En attente', className: 'bg-amber-100 text-amber-700' },
  error: { label: 'Erreur', className: 'bg-rose-100 text-rose-700' },
}

function formatDuration(seconds: number | null): string {
  if (!seconds || seconds <= 0) return '—'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

function formatRelativeDate(dateStr: string): string {
  try {
    return formatDistanceToNow(new Date(dateStr), {
      addSuffix: true,
      locale: fr,
    })
  } catch {
    return '—'
  }
}

function FileTypeIcon({ type }: { type: string | null }) {
  if (type?.startsWith('video'))
    return <Video className="h-4 w-4 text-violet-500" />
  return <Headphones className="h-4 w-4 text-indigo-500" />
}

function StatusBadge({ status }: { status: TranscriptionStatus }) {
  const config = STATUS_CONFIG[status]
  return (
    <Badge variant="secondary" className={cn('gap-1.5 text-[11px]', config.className)}>
      {config.spinning && <Loader2 className="h-3 w-3 animate-spin" />}
      {config.label}
    </Badge>
  )
}

export function RecentFiles({ initialTranscriptions }: RecentFilesProps) {
  const [transcriptions, setTranscriptions] =
    useState<TranscriptionListItem[]>(initialTranscriptions)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const hasProcessing = transcriptions.some(
    (t) => t.status === 'processing' || t.status === 'pending'
  )

  const pollTranscriptions = useCallback(async () => {
    try {
      const supabase = createClient()
      const { data } = await supabase
        .from('transcriptions')
        .select(
          'id, title, status, file_duration, file_type, language, accent, word_count, confidence_avg, created_at, updated_at'
        )
        .in(
          'id',
          transcriptions
            .filter((t) => t.status === 'processing' || t.status === 'pending')
            .map((t) => t.id)
        )

      if (data) {
        setTranscriptions((prev) =>
          prev.map((t) => {
            const updated = data.find((d) => d.id === t.id)
            return updated ? { ...t, ...updated } : t
          })
        )
      }
    } catch {
      /* silently fail polling */
    }
  }, [transcriptions])

  useEffect(() => {
    if (!hasProcessing) return
    const interval = setInterval(pollTranscriptions, 5000)
    return () => clearInterval(interval)
  }, [hasProcessing, pollTranscriptions])

  const handleDelete = (id: string) => {
    startTransition(async () => {
      setTranscriptions((prev) => prev.filter((t) => t.id !== id))
      setDeleteId(null)

      try {
        const supabase = createClient()
        const { error } = await supabase
          .from('transcriptions')
          .delete()
          .eq('id', id)

        if (error) {
          setTranscriptions(initialTranscriptions)
          toast.error('Impossible de supprimer la transcription')
        } else {
          toast.success('Transcription supprimée')
          router.refresh()
        }
      } catch {
        setTranscriptions(initialTranscriptions)
        toast.error('Une erreur est survenue')
      }
    })
  }

  if (transcriptions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-white py-16 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
          <FileAudio className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="mt-4 text-lg font-semibold text-vs-text">
          Aucune transcription
        </h3>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          Commencez par uploader votre premier fichier audio ou vidéo
        </p>
        <Button asChild className="mt-6">
          <Link href="/upload">
            <Upload className="h-4 w-4" />
            Uploader un fichier
          </Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-vs-text">
        Transcriptions récentes
      </h2>

      {/* Vue desktop : tableau */}
      <div className="hidden overflow-hidden rounded-xl border border-border bg-white md:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-slate-50/50">
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                Titre
              </th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                Durée
              </th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                Langue
              </th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                Statut
              </th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                Date
              </th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {transcriptions.map((t) => (
              <tr
                key={t.id}
                className="group cursor-pointer border-b border-border last:border-0 hover:bg-slate-50/50"
                onClick={() => router.push(`/editor/${t.id}`)}
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <FileTypeIcon type={t.file_type} />
                    <span className="font-medium text-vs-text">{t.title}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {formatDuration(t.file_duration)}
                </td>
                <td className="px-4 py-3">
                  <span className="text-xs font-medium uppercase text-muted-foreground">
                    {t.language}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={t.status} />
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {formatRelativeDate(t.created_at)}
                </td>
                <td className="px-4 py-3 text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        className="opacity-0 group-hover:opacity-100"
                        onClick={(e) => e.stopPropagation()}
                        aria-label="Actions"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/editor/${t.id}`}>
                          <ExternalLink className="h-4 w-4" />
                          Ouvrir l&apos;éditeur
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem disabled={t.status !== 'completed'}>
                        <Download className="h-4 w-4" />
                        Exporter
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        variant="destructive"
                        onClick={(e) => {
                          e.stopPropagation()
                          setDeleteId(t.id)
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                        Supprimer
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Vue mobile : cartes */}
      <div className="space-y-3 md:hidden">
        {transcriptions.map((t) => (
          <Link
            key={t.id}
            href={`/editor/${t.id}`}
            className="flex items-center justify-between rounded-xl border border-border bg-white p-4 transition-colors hover:bg-slate-50/50"
          >
            <div className="flex items-center gap-3 min-w-0">
              <FileTypeIcon type={t.file_type} />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-vs-text">
                  {t.title}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatDuration(t.file_duration)} ·{' '}
                  {formatRelativeDate(t.created_at)}
                </p>
              </div>
            </div>
            <StatusBadge status={t.status} />
          </Link>
        ))}
      </div>

      {/* AlertDialog de confirmation de suppression */}
      <AlertDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette transcription ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Le fichier audio et la
              transcription seront définitivement supprimés.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={isPending}
              onClick={() => deleteId && handleDelete(deleteId)}
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Suppression...
                </>
              ) : (
                'Supprimer'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
