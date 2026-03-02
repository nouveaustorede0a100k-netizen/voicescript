import Anthropic from '@anthropic-ai/sdk'
import { createServerSupabaseClient } from '@/lib/supabase/server'

type RepurposeType = 'article' | 'thread' | 'newsletter' | 'summary' | 'faq'
type ToneOption = 'formel' | 'décontracté' | 'professionnel'
type LengthOption = 'court' | 'moyen' | 'long'

interface RepurposeBody {
  transcription_id: string
  type: RepurposeType
  options?: {
    tone?: ToneOption
    length?: LengthOption
  }
}

function getSystemPrompt(type: RepurposeType, tone: ToneOption, length: LengthOption): string {
  const lengthGuide = {
    court: '~500 mots',
    moyen: '~1000 mots',
    long: '~2000 mots',
  }

  const prompts: Record<RepurposeType, string> = {
    article: `Tu es un rédacteur web expert en SEO francophone.
Transforme cette transcription en un article de blog structuré en Markdown.
- Titre accrocheur (H1 avec #)
- Introduction captivante (3-4 phrases)
- 3-5 sections avec sous-titres (H2 avec ##)
- Points clés en **gras**
- Conclusion avec call-to-action
- Ton : ${tone}
- Longueur : ${lengthGuide[length]}
- Optimisé SEO : mots-clés naturels
- À la fin, suggère une meta description (1-2 phrases).`,

    thread: `Tu es un expert en personal branding sur Twitter/X.
Transforme cette transcription en un thread viral en français.
- 10-15 tweets maximum
- Premier tweet = hook puissant (question ou stat choc)
- Chaque tweet fait 1-2 phrases max (280 caractères)
- Utilise des emojis avec parcimonie
- Dernier tweet = CTA (follow, like, partage)
- Numérotation 🧵 1/X
- Formate chaque tweet comme un paragraphe séparé.`,

    newsletter: `Tu es un copywriter spécialisé en newsletters (style Substack).
Transforme cette transcription en newsletter engageante en français.
- Commence par un objet d'email accrocheur (ligne "**Objet :** ...")
- Intro personnelle et relatable
- Corps structuré avec storytelling
- Encadrés pour les points clés (utilise > pour les citations)
- CTA final
- Ton conversationnel et chaleureux
- Longueur : ${lengthGuide[length]}`,

    summary: `Résume cette transcription en français en 5 points clés.
Pour chaque point :
- **Titre court et percutant** en gras
- Explication en 2-3 phrases
- Une citation directe pertinente de la transcription (en italique avec >)
Termine par un paragraphe "**L'insight principal**" à retenir.`,

    faq: `Génère une FAQ en français à partir de cette transcription.
- 8-12 questions-réponses
- Formate chaque question en **gras** (## Q: ...)
- Réponses concises (2-4 phrases)
- Basées uniquement sur le contenu de la transcription
- Questions formulées comme le ferait un utilisateur francophone`,
  }

  return prompts[type]
}

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return new Response(JSON.stringify({ error: 'Non authentifié' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const body = (await request.json()) as RepurposeBody
    const { transcription_id, type, options } = body

    if (!transcription_id || !type) {
      return new Response(JSON.stringify({ error: 'Paramètres manquants' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const validTypes: RepurposeType[] = ['article', 'thread', 'newsletter', 'summary', 'faq']
    if (!validTypes.includes(type)) {
      return new Response(JSON.stringify({ error: 'Type non supporté' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Récupérer les segments de la transcription
    const { data: segments, error: segError } = await supabase
      .from('transcription_segments')
      .select('text, speaker')
      .eq('transcription_id', transcription_id)
      .order('position', { ascending: true })

    if (segError || !segments || segments.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Transcription introuvable ou vide' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const fullText = segments
      .map((s) => (s.speaker ? `[${s.speaker}] ${s.text}` : s.text))
      .join('\n')

    const tone = options?.tone ?? 'décontracté'
    const length = options?.length ?? 'moyen'
    const systemPrompt = getSystemPrompt(type, tone, length)

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

    const stream = anthropic.messages.stream({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: `Voici la transcription à transformer :\n\n${fullText}`,
        },
      ],
    })

    // Convertir le stream Anthropic en ReadableStream de texte brut
    const encoder = new TextEncoder()
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of stream) {
            if (
              event.type === 'content_block_delta' &&
              event.delta.type === 'text_delta'
            ) {
              controller.enqueue(encoder.encode(event.delta.text))
            }
          }
          controller.close()
        } catch (err) {
          console.error('[Repurpose] Erreur streaming:', err)
          controller.error(err)
        }
      },
    })

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
        'Cache-Control': 'no-cache',
      },
    })
  } catch (err) {
    console.error('[Repurpose] Erreur:', err)
    return new Response(
      JSON.stringify({ error: 'La génération a échoué. Réessayez.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
