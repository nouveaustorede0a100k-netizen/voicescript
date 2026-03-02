'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2, Globe, Mic2, Bell, Palette } from 'lucide-react'
import type { Profile, AccentType } from '@/types'

interface PreferencesFormProps {
  profile: Profile
}

const ACCENT_OPTIONS: { value: AccentType; label: string }[] = [
  { value: 'fr-standard', label: 'Français (Standard)' },
  { value: 'fr-quebec', label: 'Français (Québécois)' },
  { value: 'fr-africa', label: 'Français (Africain)' },
  { value: 'fr-belgium', label: 'Français (Belge)' },
  { value: 'fr-swiss', label: 'Français (Suisse)' },
]

export function PreferencesForm({ profile }: PreferencesFormProps) {
  const router = useRouter()
  const supabase = createClient()

  const [accent, setAccent] = useState<AccentType>(profile.preferred_accent)
  const [emailNotifs, setEmailNotifs] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  const initialAccent = profile.preferred_accent
  const hasChanges = accent !== initialAccent

  const handleSave = useCallback(async () => {
    setIsSaving(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ preferred_accent: accent })
        .eq('id', profile.id)

      if (error) throw error

      toast.success('Préférences mises à jour')
      router.refresh()
    } catch {
      toast.error('Erreur lors de la sauvegarde')
    } finally {
      setIsSaving(false)
    }
  }, [accent, profile.id, supabase, router])

  return (
    <div className="space-y-6 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Préférences</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Langue interface */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-muted-foreground" />
              Langue de l'interface
            </Label>
            <Select value="fr" disabled>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fr">Français</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              D'autres langues seront disponibles prochainement
            </p>
          </div>

          {/* Accent par défaut */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Mic2 className="h-4 w-4 text-muted-foreground" />
              Accent par défaut pour les transcriptions
            </Label>
            <Select
              value={accent}
              onValueChange={(v) => setAccent(v as AccentType)}
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

          {/* Notifications */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-muted-foreground" />
              Notifications email
            </Label>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="text-sm font-medium">Transcription terminée</p>
                <p className="text-xs text-muted-foreground">
                  Recevoir un email quand une transcription est prête
                </p>
              </div>
              <button
                role="switch"
                aria-checked={emailNotifs}
                onClick={() => setEmailNotifs(!emailNotifs)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                  emailNotifs ? 'bg-primary' : 'bg-slate-200'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition-transform ${
                    emailNotifs ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Thème */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Palette className="h-4 w-4 text-muted-foreground" />
              Thème
            </Label>
            <Select value="light" disabled>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">Clair</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Le thème sombre sera disponible prochainement
            </p>
          </div>

          <Button onClick={handleSave} disabled={isSaving || !hasChanges}>
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Sauvegarde…
              </>
            ) : (
              'Sauvegarder les préférences'
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
