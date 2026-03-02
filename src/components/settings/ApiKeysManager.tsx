'use client'

import { useState, useCallback, useEffect } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
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
  Plus,
  Copy,
  Trash2,
  Key,
  Check,
  Loader2,
  Eye,
  EyeOff,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'

interface ApiKey {
  id: string
  key_prefix: string
  created_at: string
  last_used_at: string | null
}

export function ApiKeysManager() {
  const [keys, setKeys] = useState<ApiKey[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [newKeyFull, setNewKeyFull] = useState<string | null>(null)
  const [showFullKey, setShowFullKey] = useState(false)
  const [revokeId, setRevokeId] = useState<string | null>(null)
  const [isRevoking, setIsRevoking] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const fetchKeys = useCallback(async () => {
    try {
      const res = await fetch('/api/settings/api-keys')
      if (!res.ok) throw new Error()
      const data = await res.json()
      setKeys(data.keys ?? [])
    } catch {
      toast.error('Erreur lors du chargement des clés')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchKeys()
  }, [fetchKeys])

  const handleCreate = useCallback(async () => {
    setIsCreating(true)
    try {
      const res = await fetch('/api/settings/api-keys', {
        method: 'POST',
      })

      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.error ?? 'Erreur lors de la création')
      }

      const data = await res.json()
      setNewKeyFull(data.key)
      setShowFullKey(true)
      await fetchKeys()
      toast.success('Clé API créée')
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Erreur lors de la création'
      )
    } finally {
      setIsCreating(false)
    }
  }, [fetchKeys])

  const handleRevoke = useCallback(async () => {
    if (!revokeId) return

    setIsRevoking(true)
    try {
      const res = await fetch(`/api/settings/api-keys?id=${revokeId}`, {
        method: 'DELETE',
      })

      if (!res.ok) throw new Error()

      setKeys((prev) => prev.filter((k) => k.id !== revokeId))
      toast.success('Clé révoquée')
    } catch {
      toast.error('Erreur lors de la révocation')
    } finally {
      setRevokeId(null)
      setIsRevoking(false)
    }
  }, [revokeId])

  const handleCopy = useCallback(async (text: string, id: string) => {
    await navigator.clipboard.writeText(text)
    setCopiedId(id)
    toast.success('Copié dans le presse-papier')
    setTimeout(() => setCopiedId(null), 2000)
  }, [])

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Nouvelle clé visible une seule fois */}
      {newKeyFull && (
        <Card className="border-emerald-200 bg-emerald-50/50">
          <CardContent className="pt-4 space-y-3">
            <div className="flex items-start gap-2">
              <Key className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-emerald-800">
                  Votre nouvelle clé API
                </p>
                <p className="text-xs text-emerald-700">
                  Copiez-la maintenant — elle ne sera plus affichée.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <code className="flex-1 bg-white rounded border border-emerald-200 px-3 py-2 text-sm font-mono break-all">
                {showFullKey ? newKeyFull : '•'.repeat(40)}
              </code>
              <Button
                variant="outline"
                size="icon"
                className="shrink-0 h-9 w-9"
                onClick={() => setShowFullKey(!showFullKey)}
              >
                {showFullKey ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="shrink-0 h-9 w-9"
                onClick={() => handleCopy(newKeyFull, 'new')}
              >
                {copiedId === 'new' ? (
                  <Check className="h-4 w-4 text-emerald-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs"
              onClick={() => setNewKeyFull(null)}
            >
              Fermer
            </Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle>Vos clés API</CardTitle>
          <Button size="sm" onClick={handleCreate} disabled={isCreating}>
            {isCreating ? (
              <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
            ) : (
              <Plus className="h-4 w-4 mr-1.5" />
            )}
            Nouvelle clé
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
              Chargement…
            </div>
          ) : keys.length === 0 ? (
            <div className="text-center py-8">
              <Key className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
              <p className="text-sm text-muted-foreground">
                Aucune clé API créée
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Créez une clé pour utiliser l'API VoiceScript
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {keys.map((apiKey) => (
                <div
                  key={apiKey.id}
                  className="flex items-center gap-3 rounded-lg border p-3"
                >
                  <Key className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <code className="text-sm font-mono">
                      {apiKey.key_prefix}
                    </code>
                    <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                      <span>
                        Créée{' '}
                        {formatDistanceToNow(new Date(apiKey.created_at), {
                          addSuffix: true,
                          locale: fr,
                        })}
                      </span>
                      {apiKey.last_used_at && (
                        <>
                          <span>·</span>
                          <span>
                            Utilisée{' '}
                            {formatDistanceToNow(
                              new Date(apiKey.last_used_at),
                              { addSuffix: true, locale: fr }
                            )}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground"
                    onClick={() => handleCopy(apiKey.key_prefix, apiKey.id)}
                  >
                    {copiedId === apiKey.id ? (
                      <Check className="h-3.5 w-3.5 text-emerald-500" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive"
                    onClick={() => setRevokeId(apiKey.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Exemple d'utilisation */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Utilisation</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="bg-slate-900 text-slate-50 rounded-lg p-4 text-xs font-mono overflow-x-auto">
            <code>{`curl -X POST https://api.voicescript.ai/v1/transcribe \\
  -H "Authorization: Bearer sk-vs-..." \\
  -H "Content-Type: multipart/form-data" \\
  -F "file=@audio.mp3" \\
  -F "language=fr"`}</code>
          </pre>
        </CardContent>
      </Card>

      {/* Dialog de révocation */}
      <AlertDialog
        open={!!revokeId}
        onOpenChange={(v) => {
          if (!v) setRevokeId(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Révoquer cette clé API ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Toutes les requêtes utilisant cette
              clé échoueront immédiatement.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              disabled={isRevoking}
              onClick={(e) => {
                e.preventDefault()
                handleRevoke()
              }}
            >
              {isRevoking ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Révocation…
                </>
              ) : (
                'Révoquer'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
