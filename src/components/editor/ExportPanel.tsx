'use client'

import { useState, useCallback } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Download,
  FileText,
  Subtitles,
  FileType,
  FileJson,
  Loader2,
  Check,
} from 'lucide-react'
import type { ExportFormat } from '@/types'

interface ExportPanelProps {
  transcriptionId: string
  title: string
}

interface FormatOption {
  value: ExportFormat
  label: string
  ext: string
  icon: React.ReactNode
  badge?: string
}

const FORMAT_OPTIONS: FormatOption[] = [
  {
    value: 'txt',
    label: 'Texte brut',
    ext: '.txt',
    icon: <FileText className="h-4 w-4" />,
  },
  {
    value: 'srt',
    label: 'Sous-titres SRT',
    ext: '.srt',
    icon: <Subtitles className="h-4 w-4" />,
    badge: 'YouTube',
  },
  {
    value: 'vtt',
    label: 'Sous-titres VTT',
    ext: '.vtt',
    icon: <Subtitles className="h-4 w-4" />,
  },
  {
    value: 'docx',
    label: 'Document Word',
    ext: '.docx',
    icon: <FileType className="h-4 w-4" />,
  },
  {
    value: 'json',
    label: 'JSON structuré',
    ext: '.json',
    icon: <FileJson className="h-4 w-4" />,
  },
]

export function ExportPanel({ transcriptionId, title }: ExportPanelProps) {
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('txt')
  const [includeTimestamps, setIncludeTimestamps] = useState(true)
  const [includeSpeakers, setIncludeSpeakers] = useState(true)
  const [isExporting, setIsExporting] = useState(false)
  const [open, setOpen] = useState(false)

  const showTimestampOption = selectedFormat === 'txt'
  const showSpeakerOption = selectedFormat === 'txt' || selectedFormat === 'vtt'

  const handleExport = useCallback(async () => {
    setIsExporting(true)

    try {
      const res = await fetch('/api/exports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcription_id: transcriptionId,
          format: selectedFormat,
          options: {
            includeTimestamps,
            includeSpeakers,
          },
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.error ?? `Erreur HTTP ${res.status}`)
      }

      const blob = await res.blob()
      const safeName =
        title
          .replace(/[^a-zA-Z0-9àâäéèêëïîôùûüÿçœæ\s-]/gi, '')
          .trim()
          .replace(/\s+/g, '_')
          .substring(0, 100) || 'transcription'

      const ext = FORMAT_OPTIONS.find((f) => f.value === selectedFormat)?.ext ?? '.txt'
      const fileName = `${safeName}${ext}`

      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = fileName
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast.success(`Export ${ext} téléchargé`)
      setOpen(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur lors de l'export")
    } finally {
      setIsExporting(false)
    }
  }, [transcriptionId, selectedFormat, includeTimestamps, includeSpeakers, title])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 text-xs">
          <Download className="h-3.5 w-3.5 mr-1" />
          Exporter
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[300px] p-0">
        <div className="p-3 border-b">
          <p className="font-medium text-sm">Exporter la transcription</p>
        </div>

        {/* Sélection du format */}
        <div className="p-2 space-y-0.5">
          {FORMAT_OPTIONS.map((fmt) => (
            <button
              key={fmt.value}
              onClick={() => setSelectedFormat(fmt.value)}
              className={`flex items-center gap-2 w-full rounded-md px-2.5 py-2 text-sm transition-colors ${
                selectedFormat === fmt.value
                  ? 'bg-primary/10 text-primary'
                  : 'hover:bg-slate-50 text-foreground'
              }`}
            >
              {selectedFormat === fmt.value ? (
                <Check className="h-4 w-4 text-primary" />
              ) : (
                fmt.icon
              )}
              <span className="flex-1 text-left">{fmt.label}</span>
              <span className="text-[11px] text-muted-foreground font-mono">{fmt.ext}</span>
              {fmt.badge && (
                <Badge variant="secondary" className="text-[9px] px-1 py-0">{fmt.badge}</Badge>
              )}
            </button>
          ))}
        </div>

        {/* Options conditionnelles */}
        {(showTimestampOption || showSpeakerOption) && (
          <div className="p-3 border-t space-y-2.5">
            <p className="text-xs font-medium text-muted-foreground">Options</p>

            {showTimestampOption && (
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeTimestamps}
                  onChange={(e) => setIncludeTimestamps(e.target.checked)}
                  className="rounded border-slate-300"
                />
                <Label className="text-sm font-normal cursor-pointer">
                  Inclure les timestamps
                </Label>
              </label>
            )}

            {showSpeakerOption && (
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeSpeakers}
                  onChange={(e) => setIncludeSpeakers(e.target.checked)}
                  className="rounded border-slate-300"
                />
                <Label className="text-sm font-normal cursor-pointer">
                  Inclure les locuteurs
                </Label>
              </label>
            )}
          </div>
        )}

        {/* Bouton télécharger */}
        <div className="p-3 border-t">
          <Button
            className="w-full"
            size="sm"
            onClick={handleExport}
            disabled={isExporting}
          >
            {isExporting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Génération...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Télécharger
              </>
            )}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
