'use client'

import { useState, useCallback } from 'react'
import Markdown from 'react-markdown'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  ArrowLeft,
  Copy,
  RefreshCw,
  Pencil,
  Download,
  Check,
  Loader2,
} from 'lucide-react'
import type { RepurposeType } from '@/lib/hooks/useRepurpose'

interface RepurposeResultProps {
  type: RepurposeType
  result: string
  isGenerating: boolean
  onBack: () => void
  onRegenerate: () => void
}

const TYPE_LABELS: Record<RepurposeType, string> = {
  article: 'Article de blog',
  thread: 'Thread Twitter/X',
  newsletter: 'Newsletter',
  summary: 'Résumé',
  faq: 'FAQ',
}

export function RepurposeResult({
  type,
  result,
  isGenerating,
  onBack,
  onRegenerate,
}: RepurposeResultProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editedText, setEditedText] = useState('')
  const [copied, setCopied] = useState(false)

  const displayText = isEditing ? editedText : result

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(displayText)
    setCopied(true)
    toast.success('Copié dans le presse-papier')
    setTimeout(() => setCopied(false), 2000)
  }, [displayText])

  const handleEdit = useCallback(() => {
    setEditedText(result)
    setIsEditing(true)
  }, [result])

  const handleExport = useCallback(
    (format: 'txt' | 'md') => {
      const content = displayText
      const ext = format
      const mime = format === 'md' ? 'text/markdown' : 'text/plain'
      const blob = new Blob([content], { type: `${mime};charset=utf-8` })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `repurpose-${type}.${ext}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      toast.success(`Fichier .${ext} téléchargé`)
    },
    [displayText, type]
  )

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b shrink-0">
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <span className="text-sm font-medium">{TYPE_LABELS[type]}</span>
        {isGenerating && (
          <Loader2 className="h-3.5 w-3.5 animate-spin text-primary ml-1" />
        )}
      </div>

      {/* Contenu */}
      <ScrollArea className="flex-1">
        <div className="p-4">
          {isEditing ? (
            <Textarea
              value={editedText}
              onChange={(e) => setEditedText(e.target.value)}
              className="min-h-[400px] font-mono text-sm"
            />
          ) : (
            <div className="prose prose-sm prose-slate max-w-none">
              <Markdown>{result || ' '}</Markdown>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Indicateur de streaming */}
      {isGenerating && (
        <div className="px-4 py-2 border-t">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <div className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
              <div className="h-full bg-primary/60 rounded-full animate-pulse w-3/4" />
            </div>
            <span>Génération…</span>
          </div>
        </div>
      )}

      {/* Actions */}
      {!isGenerating && result && (
        <div className="flex items-center gap-2 px-4 py-3 border-t shrink-0 flex-wrap">
          <Button variant="outline" size="sm" onClick={handleCopy}>
            {copied ? (
              <Check className="h-3.5 w-3.5 mr-1.5 text-emerald-500" />
            ) : (
              <Copy className="h-3.5 w-3.5 mr-1.5" />
            )}
            {copied ? 'Copié' : 'Copier'}
          </Button>
          <Button variant="outline" size="sm" onClick={onRegenerate}>
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
            Régénérer
          </Button>
          {isEditing ? (
            <Button size="sm" onClick={() => setIsEditing(false)}>
              <Check className="h-3.5 w-3.5 mr-1.5" />
              Terminé
            </Button>
          ) : (
            <Button variant="outline" size="sm" onClick={handleEdit}>
              <Pencil className="h-3.5 w-3.5 mr-1.5" />
              Modifier
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => handleExport('md')}>
            <Download className="h-3.5 w-3.5 mr-1.5" />
            .md
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleExport('txt')}>
            <Download className="h-3.5 w-3.5 mr-1.5" />
            .txt
          </Button>
        </div>
      )}
    </div>
  )
}
