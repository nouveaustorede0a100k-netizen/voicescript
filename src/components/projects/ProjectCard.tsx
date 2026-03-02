'use client'

import { useState } from 'react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'
import { FolderOpen, MoreHorizontal, Pencil, Palette, Trash2 } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import type { ProjectWithCount } from '@/types'

interface ProjectCardProps {
  project: ProjectWithCount
  onRename: (id: string, currentName: string) => void
  onChangeColor: (id: string, currentColor: string) => void
  onDelete: (id: string) => void
}

export function ProjectCard({ project, onRename, onChangeColor, onDelete }: ProjectCardProps) {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <Link
      href={`/projects/${project.id}`}
      className="group block rounded-xl border bg-white shadow-sm hover:shadow-md transition-shadow overflow-hidden"
    >
      {/* Bande de couleur */}
      <div className="h-2" style={{ backgroundColor: project.color }} />

      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-lg"
              style={{ backgroundColor: project.color + '20' }}
            >
              <FolderOpen className="h-4 w-4" style={{ color: project.color }} />
            </div>
            <div>
              <h3 className="font-medium text-sm truncate max-w-[180px]">{project.name}</h3>
              <p className="text-xs text-muted-foreground">
                {project.transcription_count} transcription{project.transcription_count !== 1 ? 's' : ''}
              </p>
            </div>
          </div>

          {/* Menu contextuel */}
          <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  setMenuOpen(true)
                }}
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
              <DropdownMenuItem
                onClick={(e) => {
                  e.preventDefault()
                  setMenuOpen(false)
                  onRename(project.id, project.name)
                }}
              >
                <Pencil className="h-4 w-4 mr-2" /> Renommer
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => {
                  e.preventDefault()
                  setMenuOpen(false)
                  onChangeColor(project.id, project.color)
                }}
              >
                <Palette className="h-4 w-4 mr-2" /> Changer la couleur
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={(e) => {
                  e.preventDefault()
                  setMenuOpen(false)
                  onDelete(project.id)
                }}
              >
                <Trash2 className="h-4 w-4 mr-2" /> Supprimer
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {project.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">{project.description}</p>
        )}

        <p className="text-[11px] text-muted-foreground">
          Créé {formatDistanceToNow(new Date(project.created_at), { addSuffix: true, locale: fr })}
        </p>
      </div>
    </Link>
  )
}
