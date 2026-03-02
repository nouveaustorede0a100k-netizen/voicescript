'use client'

import { useState, useCallback } from 'react'
import { toast } from 'sonner'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Sparkles, FileText, Twitter, Mail, ListChecks, HelpCircle, Loader2 } from 'lucide-react'
import {
  useRepurpose,
  type RepurposeType,
  type RepurposeOptions,
} from '@/lib/hooks/useRepurpose'
import { RepurposeResult } from '@/components/editor/RepurposeResult'

interface RepurposePanelProps {
  transcriptionId: string
}

interface TypeCard {
  type: RepurposeType
  icon: React.ReactNode
  label: string
  description: string
}

const TYPE_CARDS: TypeCard[] = [
  {
    type: 'article',
    icon: <FileText className="h-5 w-5" />,
    label: 'Article de blog',
    description: 'Transformez en article SEO structuré',
  },
  {
    type: 'thread',
    icon: <Twitter className="h-5 w-5" />,
    label: 'Thread Twitter/X',
    description: 'Créez un thread viral',
  },
  {
    type: 'newsletter',
    icon: <Mail className="h-5 w-5" />,
    label: 'Newsletter',
    description: 'Format Substack engageant',
  },
  {
    type: 'summary',
    icon: <ListChecks className="h-5 w-5" />,
    label: 'Résumé',
    description: '5 points clés à retenir',
  },
  {
    type: 'faq',
    icon: <HelpCircle className="h-5 w-5" />,
    label: 'FAQ',
    description: 'Questions-réponses automatiques',
  },
]

export function RepurposePanel({ transcriptionId }: RepurposePanelProps) {
  const [open, setOpen] = useState(false)
  const [selectedType, setSelectedType] = useState<RepurposeType>('article')
  const [tone, setTone] = useState<RepurposeOptions['tone']>('décontracté')
  const [length, setLength] = useState<RepurposeOptions['length']>('moyen')
  const [showResult, setShowResult] = useState(false)

  const { result, isGenerating, error, generate, reset } = useRepurpose()

  const handleGenerate = useCallback(async () => {
    setShowResult(true)
    try {
      await generate(transcriptionId, selectedType, { tone, length })
    } catch {
      toast.error('La génération a échoué. Réessayez.')
    }
  }, [transcriptionId, selectedType, tone, length, generate])

  const handleRegenerate = useCallback(() => {
    handleGenerate()
  }, [handleGenerate])

  const handleBack = useCallback(() => {
    reset()
    setShowResult(false)
  }, [reset])

  const handleOpenChange = useCallback(
    (v: boolean) => {
      setOpen(v)
      if (!v) {
        reset()
        setShowResult(false)
      }
    },
    [reset]
  )

  // Options de ton et longueur visibles seulement pour certains types
  const showTone = selectedType === 'article' || selectedType === 'newsletter'
  const showLength =
    selectedType === 'article' || selectedType === 'newsletter'

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <Tooltip>
        <TooltipTrigger asChild>
          <SheetTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 text-xs gap-1.5">
              <Sparkles className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Repurposing IA</span>
            </Button>
          </SheetTrigger>
        </TooltipTrigger>
        <TooltipContent>Repurposing IA</TooltipContent>
      </Tooltip>

      <SheetContent className="w-full sm:max-w-[440px] p-0 flex flex-col">
        {showResult ? (
          <RepurposeResult
            type={selectedType}
            result={result}
            isGenerating={isGenerating}
            onBack={handleBack}
            onRegenerate={handleRegenerate}
          />
        ) : (
          <>
            <SheetHeader className="px-5 pt-5 pb-3">
              <SheetTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Repurposing IA
              </SheetTitle>
              <p className="text-sm text-muted-foreground">
                Que voulez-vous créer ?
              </p>
            </SheetHeader>

            <div className="flex-1 overflow-y-auto px-5 pb-5 space-y-5">
              {/* Sélection du type */}
              <div className="space-y-2">
                {TYPE_CARDS.map((card) => (
                  <button
                    key={card.type}
                    onClick={() => setSelectedType(card.type)}
                    className={`w-full flex items-start gap-3 rounded-lg border p-3 text-left transition-colors ${
                      selectedType === card.type
                        ? 'border-primary bg-indigo-50/60 ring-1 ring-primary/20'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div
                      className={`mt-0.5 shrink-0 ${
                        selectedType === card.type
                          ? 'text-primary'
                          : 'text-muted-foreground'
                      }`}
                    >
                      {card.icon}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{card.label}</p>
                      <p className="text-xs text-muted-foreground">
                        {card.description}
                      </p>
                    </div>
                  </button>
                ))}
              </div>

              {/* Options */}
              {(showTone || showLength) && (
                <div className="space-y-3 pt-1">
                  <p className="text-sm font-medium text-foreground">Options</p>
                  {showTone && (
                    <div className="space-y-1.5">
                      <Label className="text-xs">Ton</Label>
                      <Select
                        value={tone}
                        onValueChange={(v) =>
                          setTone(v as RepurposeOptions['tone'])
                        }
                      >
                        <SelectTrigger className="h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="décontracté">Décontracté</SelectItem>
                          <SelectItem value="professionnel">Professionnel</SelectItem>
                          <SelectItem value="formel">Formel</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  {showLength && (
                    <div className="space-y-1.5">
                      <Label className="text-xs">Longueur</Label>
                      <Select
                        value={length}
                        onValueChange={(v) =>
                          setLength(v as RepurposeOptions['length'])
                        }
                      >
                        <SelectTrigger className="h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="court">Court (~500 mots)</SelectItem>
                          <SelectItem value="moyen">Moyen (~1000 mots)</SelectItem>
                          <SelectItem value="long">Long (~2000 mots)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              )}

              {/* Erreur */}
              {error && (
                <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
                  {error}
                </div>
              )}
            </div>

            {/* Bouton Générer */}
            <div className="px-5 py-4 border-t shrink-0">
              <Button
                className="w-full"
                onClick={handleGenerate}
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Génération en cours…
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Générer
                  </>
                )}
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
