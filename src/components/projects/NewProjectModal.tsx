'use client'

import { useState, useCallback } from 'react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'

interface NewProjectModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated: (project: { id: string; name: string; color: string }) => void
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

export function NewProjectModal({ open, onOpenChange, onCreated }: NewProjectModalProps) {
  const [name, setName] = useState('')
  const [color, setColor] = useState('#4F46E5')
  const [description, setDescription] = useState('')
  const [isCreating, setIsCreating] = useState(false)

  const resetForm = useCallback(() => {
    setName('')
    setColor('#4F46E5')
    setDescription('')
  }, [])

  const handleCreate = useCallback(async () => {
    const trimmedName = name.trim()
    if (!trimmedName) {
      toast.error('Le nom du projet est requis')
      return
    }

    setIsCreating(true)
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmedName, color, description: description.trim() }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.error ?? 'Erreur de création')
      }

      const project = await res.json()
      toast.success('Projet créé')
      onCreated(project)
      resetForm()
      onOpenChange(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur de création')
    } finally {
      setIsCreating(false)
    }
  }, [name, color, description, onCreated, resetForm, onOpenChange])

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) resetForm()
        onOpenChange(v)
      }}
    >
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle>Nouveau projet</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Nom */}
          <div className="space-y-2">
            <Label htmlFor="project-name">Nom du projet *</Label>
            <Input
              id="project-name"
              placeholder="Ex : Mon podcast"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={100}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreate()
              }}
            />
          </div>

          {/* Couleur */}
          <div className="space-y-2">
            <Label>Couleur</Label>
            <div className="flex gap-2 flex-wrap">
              {COLOR_OPTIONS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setColor(c.value)}
                  className={`h-8 w-8 rounded-full border-2 transition-transform hover:scale-110 ${
                    color === c.value ? 'border-foreground scale-110' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: c.value }}
                  aria-label={c.label}
                  title={c.label}
                />
              ))}
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="project-desc">Description (optionnel)</Label>
            <Textarea
              id="project-desc"
              placeholder="Description du projet…"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={500}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isCreating}>
            Annuler
          </Button>
          <Button onClick={handleCreate} disabled={isCreating || !name.trim()}>
            {isCreating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Création…
              </>
            ) : (
              'Créer le projet'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
