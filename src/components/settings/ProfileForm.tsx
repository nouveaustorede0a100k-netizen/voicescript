'use client'

import { useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2, Camera, AlertTriangle } from 'lucide-react'
import type { Profile, AccentType } from '@/types'

interface ProfileFormProps {
  profile: Profile
}

const ACCENT_OPTIONS: { value: AccentType; label: string }[] = [
  { value: 'fr-standard', label: 'Français (Standard)' },
  { value: 'fr-quebec', label: 'Français (Québécois)' },
  { value: 'fr-africa', label: 'Français (Africain)' },
  { value: 'fr-belgium', label: 'Français (Belge)' },
  { value: 'fr-swiss', label: 'Français (Suisse)' },
]

export function ProfileForm({ profile }: ProfileFormProps) {
  const router = useRouter()
  const supabase = createClient()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [fullName, setFullName] = useState(profile.full_name || '')
  const [accent, setAccent] = useState<AccentType>(profile.preferred_accent)
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url || '')
  const [isSaving, setIsSaving] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')

  const initials = (fullName || profile.email || '?')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  const handleAvatarUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return

      if (!file.type.startsWith('image/')) {
        toast.error('Veuillez sélectionner une image')
        return
      }
      if (file.size > 2 * 1024 * 1024) {
        toast.error('Image trop volumineuse (max 2 Mo)')
        return
      }

      setIsUploading(true)
      try {
        const ext = file.name.split('.').pop()
        const path = `avatars/${profile.id}.${ext}`

        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(path, file, { upsert: true })

        if (uploadError) throw uploadError

        const {
          data: { publicUrl },
        } = supabase.storage.from('avatars').getPublicUrl(path)

        const url = `${publicUrl}?t=${Date.now()}`
        setAvatarUrl(url)

        await supabase
          .from('profiles')
          .update({ avatar_url: url })
          .eq('id', profile.id)

        toast.success('Photo de profil mise à jour')
      } catch {
        toast.error("Erreur lors de l'upload de la photo")
      } finally {
        setIsUploading(false)
      }
    },
    [profile.id, supabase]
  )

  const handleSave = useCallback(async () => {
    const trimmed = fullName.trim()
    if (!trimmed) {
      toast.error('Le prénom est requis')
      return
    }
    if (trimmed.length > 100) {
      toast.error('Le nom ne peut pas dépasser 100 caractères')
      return
    }

    setIsSaving(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: trimmed,
          preferred_accent: accent,
        })
        .eq('id', profile.id)

      if (error) throw error

      toast.success('Profil mis à jour')
      router.refresh()
    } catch {
      toast.error('Erreur lors de la sauvegarde')
    } finally {
      setIsSaving(false)
    }
  }, [fullName, accent, profile.id, supabase, router])

  const handleDeleteAccount = useCallback(async () => {
    setIsDeleting(true)
    try {
      const res = await fetch('/api/settings/delete-account', {
        method: 'POST',
      })

      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.error ?? 'Erreur lors de la suppression')
      }

      toast.success('Compte désactivé avec succès')
      await supabase.auth.signOut()
      router.push('/login')
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Erreur lors de la suppression'
      )
    } finally {
      setIsDeleting(false)
    }
  }, [supabase, router])

  const hasChanges =
    fullName.trim() !== (profile.full_name || '') ||
    accent !== profile.preferred_accent

  return (
    <div className="space-y-6 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Informations du profil</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Avatar */}
          <div className="flex items-center gap-4">
            <div className="relative">
              <Avatar className="h-20 w-20">
                <AvatarImage src={avatarUrl} alt={fullName} />
                <AvatarFallback className="text-lg bg-primary/10 text-primary">
                  {initials}
                </AvatarFallback>
              </Avatar>
              {isUploading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full">
                  <Loader2 className="h-5 w-5 animate-spin text-white" />
                </div>
              )}
            </div>
            <div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
              >
                <Camera className="h-4 w-4 mr-2" />
                Changer la photo
              </Button>
              <p className="text-xs text-muted-foreground mt-1">
                JPG, PNG — Max 2 Mo
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleAvatarUpload}
              />
            </div>
          </div>

          {/* Nom */}
          <div className="space-y-2">
            <Label htmlFor="full_name">Nom complet</Label>
            <Input
              id="full_name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Votre nom"
              maxLength={100}
            />
          </div>

          {/* Email (lecture seule) */}
          <div className="space-y-2">
            <Label>Email</Label>
            <Input value={profile.email} disabled className="bg-muted" />
            <p className="text-xs text-muted-foreground">
              L'email ne peut pas être modifié
            </p>
          </div>

          {/* Accent par défaut */}
          <div className="space-y-2">
            <Label>Accent par défaut</Label>
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

          {/* Sauvegarder */}
          <Button
            onClick={handleSave}
            disabled={isSaving || !hasChanges}
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Sauvegarde…
              </>
            ) : (
              'Sauvegarder les modifications'
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Zone danger */}
      <Card className="border-destructive/30">
        <CardHeader>
          <CardTitle className="text-destructive flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Zone danger
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            La suppression de votre compte est irréversible. Toutes vos données,
            transcriptions et projets seront définitivement supprimés.
          </p>
          <Button
            variant="destructive"
            onClick={() => setShowDeleteDialog(true)}
          >
            Supprimer mon compte
          </Button>
        </CardContent>
      </Card>

      {/* Dialog de confirmation de suppression */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer votre compte ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Toutes vos données seront
              définitivement supprimées, y compris vos transcriptions, projets
              et fichiers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2 py-2">
            <Label className="text-sm">
              Tapez <span className="font-semibold">SUPPRIMER</span> pour
              confirmer
            </Label>
            <Input
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="SUPPRIMER"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteConfirmText('')}>
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              disabled={deleteConfirmText !== 'SUPPRIMER' || isDeleting}
              onClick={(e) => {
                e.preventDefault()
                handleDeleteAccount()
              }}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Suppression…
                </>
              ) : (
                'Supprimer définitivement'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
