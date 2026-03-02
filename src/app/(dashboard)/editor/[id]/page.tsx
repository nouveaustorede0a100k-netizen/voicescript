import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getPresignedUrl, extractKeyFromUrl } from '@/lib/storage/r2'
import { TranscriptionEditor } from '@/components/editor/TranscriptionEditor'
import { EditorProcessing } from '@/components/editor/EditorProcessing'

interface EditorPageProps {
  params: Promise<{ id: string }>
}

export default async function EditorPage({ params }: EditorPageProps) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: transcription } = await supabase
    .from('transcriptions')
    .select('*')
    .eq('id', id)
    .single()

  if (!transcription) {
    redirect('/dashboard')
  }

  // En cours de traitement → afficher l'état d'attente avec polling
  if (transcription.status === 'pending' || transcription.status === 'processing') {
    return <EditorProcessing transcriptionId={id} title={transcription.title} />
  }

  // Erreur → afficher le message
  if (transcription.status === 'error') {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-rose-100 flex items-center justify-center">
          <span className="text-2xl">❌</span>
        </div>
        <h2 className="text-xl font-semibold">Erreur de transcription</h2>
        <p className="text-muted-foreground max-w-md">
          {transcription.error_message ?? 'Une erreur est survenue lors de la transcription.'}
        </p>
        <a
          href="/upload"
          className="text-primary hover:underline text-sm"
        >
          Réessayer avec un nouveau fichier
        </a>
      </div>
    )
  }

  // Terminée → générer l'URL signée et afficher l'éditeur
  const fileKey = extractKeyFromUrl(transcription.file_url)
  const audioUrl = await getPresignedUrl(fileKey, 7200) // 2h

  return (
    <TranscriptionEditor
      transcriptionId={id}
      audioUrl={audioUrl}
    />
  )
}
