'use client'

import { useState, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Plus, Search, FolderOpen, ArrowUpDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { ProjectCard } from '@/components/projects/ProjectCard'
import { NewProjectModal } from '@/components/projects/NewProjectModal'
import type { ProjectWithCount } from '@/types'

type SortKey = 'date' | 'name' | 'count'

interface ProjectsContentProps {
  initialProjects: ProjectWithCount[]
}

const COLOR_OPTIONS = [
  { value: '#4F46E5', label: 'Indigo' },
  { value: '#7C3AED', label: 'Violet' },
  { value: '#10B981', label: 'Émeraude' },
  { value: '#F59E0B', label: 'Ambre' },
  { value: '#F43F5E', label: 'Rose' },
  { value: '#0EA5E9', label: 'Ciel' },
  { value: '#F97316', label: 'Orange' },
  { value: '#64748B', label: 'Ardoise' },
]

export function ProjectsContent({ initialProjects }: ProjectsContentProps) {
  const router = useRouter()
  const [projects, setProjects] = useState(initialProjects)
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState<SortKey>('date')
  const [showNewModal, setShowNewModal] = useState(false)

  // Dialogs d'action
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [renameState, setRenameState] = useState<{ id: string; name: string } | null>(null)
  const [colorState, setColorState] = useState<{ id: string; color: string } | null>(null)

  // Filtrage + tri côté client
  const filtered = useMemo(() => {
    let list = projects
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter((p) => p.name.toLowerCase().includes(q))
    }
    return [...list].sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name, 'fr')
      if (sortBy === 'count') return b.transcription_count - a.transcription_count
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })
  }, [projects, search, sortBy])

  const handleCreated = useCallback(
    (project: { id: string; name: string; color: string }) => {
      setProjects((prev) => [
        { ...project, user_id: '', description: '', created_at: new Date().toISOString(), updated_at: new Date().toISOString(), transcription_count: 0 },
        ...prev,
      ])
      router.push(`/projects/${project.id}`)
    },
    [router]
  )

  // Supprimer
  const handleDelete = useCallback(async () => {
    if (!deleteId) return
    setProjects((prev) => prev.filter((p) => p.id !== deleteId))
    setDeleteId(null)

    const res = await fetch(`/api/projects/${deleteId}`, { method: 'DELETE' })
    if (!res.ok) {
      toast.error('Erreur de suppression')
      router.refresh()
      return
    }
    toast.success('Projet supprimé')
  }, [deleteId, router])

  // Renommer
  const handleRename = useCallback(async () => {
    if (!renameState) return
    const trimmed = renameState.name.trim()
    if (!trimmed) return

    setProjects((prev) =>
      prev.map((p) => (p.id === renameState.id ? { ...p, name: trimmed } : p))
    )
    setRenameState(null)

    const res = await fetch(`/api/projects/${renameState.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: trimmed }),
    })
    if (!res.ok) toast.error('Erreur de renommage')
  }, [renameState])

  // Changer couleur
  const handleColorChange = useCallback(
    async (newColor: string) => {
      if (!colorState) return
      setProjects((prev) =>
        prev.map((p) => (p.id === colorState.id ? { ...p, color: newColor } : p))
      )
      setColorState(null)

      const res = await fetch(`/api/projects/${colorState.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ color: newColor }),
      })
      if (!res.ok) toast.error('Erreur de mise à jour')
    },
    [colorState]
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Mes projets</h1>
          <p className="text-sm text-muted-foreground">
            Organisez vos transcriptions par thème ou client
          </p>
        </div>
        <Button onClick={() => setShowNewModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nouveau projet
        </Button>
      </div>

      {/* Barre de recherche + tri */}
      {projects.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher un projet…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortKey)}>
            <SelectTrigger className="w-[180px]">
              <ArrowUpDown className="h-3.5 w-3.5 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date">Date de création</SelectItem>
              <SelectItem value="name">Nom A→Z</SelectItem>
              <SelectItem value="count">Nb de fichiers</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Grille / Empty state */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
            <FolderOpen className="h-8 w-8 text-slate-400" />
          </div>
          <h2 className="text-lg font-semibold mb-1">
            {search ? 'Aucun résultat' : 'Aucun projet'}
          </h2>
          <p className="text-sm text-muted-foreground max-w-sm mb-6">
            {search
              ? `Aucun projet ne correspond à « ${search} »`
              : 'Créez votre premier projet pour organiser vos transcriptions'}
          </p>
          {!search && (
            <Button onClick={() => setShowNewModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Créer un projet
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onRename={(id, name) => setRenameState({ id, name })}
              onChangeColor={(id, color) => setColorState({ id, color })}
              onDelete={(id) => setDeleteId(id)}
            />
          ))}
        </div>
      )}

      {/* Modales */}
      <NewProjectModal
        open={showNewModal}
        onOpenChange={setShowNewModal}
        onCreated={handleCreated}
      />

      {/* Dialog suppression */}
      <AlertDialog open={!!deleteId} onOpenChange={(v) => { if (!v) setDeleteId(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce projet ?</AlertDialogTitle>
            <AlertDialogDescription>
              Le projet sera supprimé. Les transcriptions associées ne seront pas supprimées,
              elles seront simplement dissociées du projet.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive hover:bg-destructive/90" onClick={handleDelete}>
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog renommage */}
      <Dialog open={!!renameState} onOpenChange={(v) => { if (!v) setRenameState(null) }}>
        <DialogContent className="sm:max-w-[380px]">
          <DialogHeader>
            <DialogTitle>Renommer le projet</DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <Label htmlFor="rename-input">Nouveau nom</Label>
            <Input
              id="rename-input"
              value={renameState?.name ?? ''}
              onChange={(e) => setRenameState((prev) => prev ? { ...prev, name: e.target.value } : null)}
              maxLength={100}
              autoFocus
              onKeyDown={(e) => { if (e.key === 'Enter') handleRename() }}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameState(null)}>Annuler</Button>
            <Button onClick={handleRename} disabled={!renameState?.name.trim()}>Renommer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog couleur */}
      <Dialog open={!!colorState} onOpenChange={(v) => { if (!v) setColorState(null) }}>
        <DialogContent className="sm:max-w-[320px]">
          <DialogHeader>
            <DialogTitle>Changer la couleur</DialogTitle>
          </DialogHeader>
          <div className="flex gap-3 flex-wrap justify-center py-4">
            {COLOR_OPTIONS.map((c) => (
              <button
                key={c.value}
                type="button"
                onClick={() => handleColorChange(c.value)}
                className={`h-10 w-10 rounded-full border-2 transition-transform hover:scale-110 ${
                  colorState?.color === c.value ? 'border-foreground scale-110' : 'border-transparent'
                }`}
                style={{ backgroundColor: c.value }}
                aria-label={c.label}
                title={c.label}
              />
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
