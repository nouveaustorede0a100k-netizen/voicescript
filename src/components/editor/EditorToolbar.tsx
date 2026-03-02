'use client'

import { useRef, useState, useCallback, useEffect } from 'react'
import Link from 'next/link'
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
import {
  ArrowLeft,
  FileText,
  MoreHorizontal,
  Trash2,
  Info,
  Undo2,
  Redo2,
  Check,
  Loader2,
} from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { ExportPanel } from '@/components/editor/ExportPanel'
import { RepurposePanel } from '@/components/editor/RepurposePanel'

interface EditorToolbarProps {
  transcriptionId: string
  title: string
  isSaving: boolean
  lastSavedAt: Date | null
  canUndo: boolean
  canRedo: boolean
  onTitleChange: (title: string) => void
  onSave: () => void
  onUndo: () => void
  onRedo: () => void
  onDelete: () => void
}

export function EditorToolbar({
  transcriptionId,
  title,
  isSaving,
  lastSavedAt,
  canUndo,
  canRedo,
  onTitleChange,
  onSave,
  onUndo,
  onRedo,
  onDelete,
}: EditorToolbarProps) {
  const titleRef = useRef<HTMLInputElement>(null)
  const [editingTitle, setEditingTitle] = useState(false)
  const [localTitle, setLocalTitle] = useState(title)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  useEffect(() => {
    setLocalTitle(title)
  }, [title])

  const handleTitleSubmit = useCallback(() => {
    setEditingTitle(false)
    const trimmed = localTitle.trim()
    if (trimmed && trimmed !== title) {
      onTitleChange(trimmed)
    } else {
      setLocalTitle(title)
    }
  }, [localTitle, title, onTitleChange])

  const handleTitleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault()
        handleTitleSubmit()
      }
      if (e.key === 'Escape') {
        setEditingTitle(false)
        setLocalTitle(title)
      }
    },
    [handleTitleSubmit, title]
  )

  const savedLabel = (() => {
    if (isSaving) return <><Loader2 className="h-3 w-3 animate-spin" /> Sauvegarde...</>
    if (lastSavedAt) return <><Check className="h-3 w-3 text-emerald-500" /> Sauvegardé</>
    return null
  })()

  return (
    <>
      <div className="flex items-center gap-2 px-4 py-2 border-b bg-white shrink-0">
        {/* Retour */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
              <Link href="/dashboard" aria-label="Retour au dashboard">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
          </TooltipTrigger>
          <TooltipContent>Retour</TooltipContent>
        </Tooltip>

        {/* Titre éditable */}
        {editingTitle ? (
          <input
            ref={titleRef}
            value={localTitle}
            onChange={(e) => setLocalTitle(e.target.value)}
            onBlur={handleTitleSubmit}
            onKeyDown={handleTitleKeyDown}
            className="text-sm font-semibold bg-transparent border-b border-primary outline-none px-1 max-w-[300px]"
            autoFocus
          />
        ) : (
          <button
            onClick={() => {
              setEditingTitle(true)
              setTimeout(() => titleRef.current?.focus(), 0)
            }}
            className="text-sm font-semibold truncate max-w-[300px] hover:text-primary transition-colors cursor-text"
          >
            {localTitle}
          </button>
        )}

        {/* Indicateur de sauvegarde */}
        {savedLabel && (
          <span className="flex items-center gap-1 text-xs text-muted-foreground ml-2">
            {savedLabel}
          </span>
        )}

        <div className="flex-1" />

        {/* Undo / Redo */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              disabled={!canUndo}
              onClick={onUndo}
              aria-label="Annuler"
            >
              <Undo2 className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Annuler (Ctrl+Z)</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              disabled={!canRedo}
              onClick={onRedo}
              aria-label="Rétablir"
            >
              <Redo2 className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Rétablir (Ctrl+Shift+Z)</TooltipContent>
        </Tooltip>

        <Button variant="ghost" size="sm" onClick={onSave} className="h-8 text-xs">
          <Check className="h-3.5 w-3.5 mr-1" />
          Sauvegarder
        </Button>

        {/* Export */}
        <ExportPanel transcriptionId={transcriptionId} title={title} />

        {/* Repurposing IA */}
        <RepurposePanel transcriptionId={transcriptionId} />

        {/* Menu contextuel */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setEditingTitle(true)}>
              <FileText className="h-4 w-4 mr-2" /> Renommer
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Info className="h-4 w-4 mr-2" /> Informations
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => setShowDeleteDialog(true)}
            >
              <Trash2 className="h-4 w-4 mr-2" /> Supprimer
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Dialog de confirmation de suppression */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer la transcription ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. La transcription et tous ses segments seront
              définitivement supprimés.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={onDelete}
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
