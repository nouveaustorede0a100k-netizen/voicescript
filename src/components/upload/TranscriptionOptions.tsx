'use client'

import { useEffect, useState, useCallback } from 'react'
import { Sparkles, Plus, FolderOpen } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { NewProjectModal } from '@/components/projects/NewProjectModal'
import type { AccentType, Project } from '@/types'

interface TranscriptionOptionsProps {
  title: string
  onTitleChange: (title: string) => void
  language: string
  onLanguageChange: (language: string) => void
  accent: AccentType
  onAccentChange: (accent: AccentType) => void
  projectId: string | null
  onProjectIdChange: (projectId: string | null) => void
  projects: Pick<Project, 'id' | 'name' | 'color'>[]
  selectedFile: File | null
  minutesRemaining: number
  isUploading: boolean
  isDisabled: boolean
  onSubmit: () => void
}

const LANGUAGE_OPTIONS = [
  { value: 'fr', label: '🇫🇷 Français' },
  { value: 'en', label: '🇬🇧 English' },
  { value: 'auto', label: '🔍 Auto-détection' },
]

const ACCENT_OPTIONS: { value: AccentType; label: string }[] = [
  { value: 'fr-standard', label: '🇫🇷 Standard' },
  { value: 'fr-quebec', label: '🇨🇦 Québécois' },
  { value: 'fr-africa', label: '🌍 Africain' },
  { value: 'fr-belgium', label: '🇧🇪 Belge' },
  { value: 'fr-swiss', label: '🇨🇭 Suisse' },
]

function formatSize(bytes: number): string {
  if (bytes >= 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${(bytes / 1024).toFixed(0)} KB`
}

function stripExtension(fileName: string): string {
  return fileName.replace(/\.[^/.]+$/, '')
}

export function TranscriptionOptions({
  title,
  onTitleChange,
  language,
  onLanguageChange,
  accent,
  onAccentChange,
  projectId,
  onProjectIdChange,
  projects,
  selectedFile,
  minutesRemaining,
  isUploading,
  isDisabled,
  onSubmit,
}: TranscriptionOptionsProps) {
  const [localProjects, setLocalProjects] = useState(projects)
  const [showNewProject, setShowNewProject] = useState(false)

  const handleProjectCreated = useCallback(
    (project: { id: string; name: string; color: string }) => {
      setLocalProjects((prev) => [...prev, project])
      onProjectIdChange(project.id)
    },
    [onProjectIdChange]
  )
  const estimatedMinutes = selectedFile
    ? Math.max(Math.ceil(selectedFile.size / (1024 * 1024) / 2), 1)
    : 0

  const showAccent = language === 'fr'

  useEffect(() => {
    if (selectedFile && !title) {
      onTitleChange(stripExtension(selectedFile.name))
    }
  }, [selectedFile, title, onTitleChange])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Options de transcription</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Titre */}
        <div className="space-y-2">
          <Label htmlFor="upload-title">Titre</Label>
          <Input
            id="upload-title"
            placeholder="Ex : Épisode 42 — Interview de…"
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            maxLength={200}
          />
        </div>

        {/* Langue */}
        <div className="space-y-2">
          <Label>Langue</Label>
          <Select value={language} onValueChange={onLanguageChange}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LANGUAGE_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Accent francophone */}
        {showAccent && (
          <div className="space-y-2">
            <Label>Accent francophone</Label>
            <Select
              value={accent}
              onValueChange={(v) => onAccentChange(v as AccentType)}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ACCENT_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Projet */}
        <div className="space-y-2">
          <Label>Projet (optionnel)</Label>
          <Select
            value={projectId ?? '_none'}
            onValueChange={(v) => onProjectIdChange(v === '_none' ? null : v)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Aucun projet" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="_none">Aucun projet</SelectItem>
              {localProjects.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  <span className="flex items-center gap-2">
                    <span
                      className="inline-block h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: p.color }}
                    />
                    {p.name}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 text-xs -ml-1"
            onClick={() => setShowNewProject(true)}
          >
            <Plus className="h-3 w-3 mr-1" />
            Créer un projet
          </Button>
          <NewProjectModal
            open={showNewProject}
            onOpenChange={setShowNewProject}
            onCreated={handleProjectCreated}
          />
        </div>

        {/* Résumé */}
        {selectedFile && (
          <div className="space-y-2 rounded-lg border border-border bg-slate-50 p-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Fichier</span>
              <span className="max-w-[180px] truncate font-medium text-vs-text">
                {selectedFile.name}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Taille</span>
              <span className="font-medium text-vs-text">
                {formatSize(selectedFile.size)}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Durée estimée</span>
              <span className="font-medium text-vs-text">
                ~{estimatedMinutes} min
              </span>
            </div>
          </div>
        )}

        {/* Bouton de lancement */}
        <Button
          className="h-11 w-full"
          disabled={!selectedFile || isUploading || isDisabled || !title.trim()}
          onClick={onSubmit}
        >
          <Sparkles className="h-4 w-4" />
          Lancer la transcription
        </Button>

        {selectedFile && (
          <p className="text-center text-xs text-muted-foreground">
            Cela consommera environ {estimatedMinutes} min de votre quota (
            {minutesRemaining} restantes)
          </p>
        )}
      </CardContent>
    </Card>
  )
}
