'use client'

import { useState, useMemo, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'
import {
  ArrowLeft,
  Upload,
  FileText,
  Clock,
  Headphones,
  Video,
  MoreHorizontal,
  ExternalLink,
  Trash2,
  FolderOpen,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
import type { Project, TranscriptionListItem } from '@/types'

interface ProjectDetailProps {
  project: Project
  initialTranscriptions: TranscriptionListItem[]
}

const STATUS_MAP: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  completed: { label: 'Terminé', variant: 'default' },
  processing: { label: 'En cours', variant: 'secondary' },
  pending: { label: 'En attente', variant: 'outline' },
  error: { label: 'Erreur', variant: 'destructive' },
}

function formatDuration(seconds: number | null): string {
  if (!seconds) return '—'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export function ProjectDetail({ project, initialTranscriptions }: ProjectDetailProps) {
  const router = useRouter()
  const [transcriptions, setTranscriptions] = useState(initialTranscriptions)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const stats = useMemo(() => {
    const total = transcriptions.length
    const totalDuration = transcriptions.reduce((acc, t) => acc + (t.file_duration ?? 0), 0)
    const lastActivity = transcriptions[0]?.updated_at ?? project.updated_at
    return { total, totalDuration, lastActivity }
  }, [transcriptions, project.updated_at])

  const handleDeleteTranscription = useCallback(async () => {
    if (!deleteId) return
    setTranscriptions((prev) => prev.filter((t) => t.id !== deleteId))
    setDeleteId(null)

    const res = await fetch(`/api/transcriptions/${deleteId}`, { method: 'DELETE' })
    if (!res.ok) {
      toast.error('Erreur de suppression')
      router.refresh()
      return
    }
    toast.success('Transcription supprimée')
  }, [deleteId, router])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <Button variant="ghost" size="sm" className="h-8 -ml-2" asChild>
          <Link href="/projects">
            <ArrowLeft className="h-4 w-4 mr-1" /> Projets
          </Link>
        </Button>

        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div
              className="flex h-12 w-12 items-center justify-center rounded-xl"
              style={{ backgroundColor: project.color + '20' }}
            >
              <FolderOpen className="h-6 w-6" style={{ color: project.color }} />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{project.name}</h1>
              {project.description && (
                <p className="text-sm text-muted-foreground mt-0.5">{project.description}</p>
              )}
            </div>
          </div>
          <Button asChild>
            <Link href={`/upload?project=${project.id}`}>
              <Upload className="h-4 w-4 mr-2" />
              Ajouter
            </Link>
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-lg border bg-white p-3">
            <p className="text-xs text-muted-foreground">Transcriptions</p>
            <p className="text-xl font-bold">{stats.total}</p>
          </div>
          <div className="rounded-lg border bg-white p-3">
            <p className="text-xs text-muted-foreground">Durée totale</p>
            <p className="text-xl font-bold">{formatDuration(stats.totalDuration)}</p>
          </div>
          <div className="rounded-lg border bg-white p-3">
            <p className="text-xs text-muted-foreground">Dernière activité</p>
            <p className="text-sm font-medium">
              {formatDistanceToNow(new Date(stats.lastActivity), { addSuffix: true, locale: fr })}
            </p>
          </div>
        </div>
      </div>

      {/* Liste des transcriptions */}
      {transcriptions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mb-4">
            <FileText className="h-7 w-7 text-slate-400" />
          </div>
          <h2 className="text-lg font-semibold mb-1">Aucune transcription</h2>
          <p className="text-sm text-muted-foreground max-w-sm mb-6">
            Ajoutez votre première transcription à ce projet
          </p>
          <Button asChild>
            <Link href={`/upload?project=${project.id}`}>
              <Upload className="h-4 w-4 mr-2" />
              Uploader un fichier
            </Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          <h2 className="text-sm font-medium text-muted-foreground">
            {transcriptions.length} transcription{transcriptions.length !== 1 ? 's' : ''}
          </h2>
          <div className="divide-y rounded-lg border bg-white">
            {transcriptions.map((t) => {
              const status = STATUS_MAP[t.status] ?? STATUS_MAP.pending
              const isAudio = t.file_type?.startsWith('audio')
              return (
                <div
                  key={t.id}
                  className="flex items-center gap-3 p-3 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 shrink-0">
                    {isAudio ? (
                      <Headphones className="h-4 w-4 text-slate-500" />
                    ) : (
                      <Video className="h-4 w-4 text-slate-500" />
                    )}
                  </div>

                  <Link
                    href={`/editor/${t.id}`}
                    className="flex-1 min-w-0"
                  >
                    <p className="text-sm font-medium truncate hover:text-primary transition-colors">
                      {t.title}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>{formatDuration(t.file_duration)}</span>
                      <span>·</span>
                      <span>
                        {formatDistanceToNow(new Date(t.created_at), { addSuffix: true, locale: fr })}
                      </span>
                    </div>
                  </Link>

                  <Badge variant={status.variant} className="shrink-0 text-[11px]">
                    {status.label}
                  </Badge>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/editor/${t.id}`}>
                          <ExternalLink className="h-4 w-4 mr-2" /> Ouvrir
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => setDeleteId(t.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" /> Supprimer
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Dialog suppression */}
      <AlertDialog open={!!deleteId} onOpenChange={(v) => { if (!v) setDeleteId(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette transcription ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. La transcription et tous ses segments seront
              définitivement supprimés.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={handleDeleteTranscription}
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
