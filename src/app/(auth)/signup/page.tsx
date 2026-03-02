import Link from 'next/link'
import { Mic, Check } from 'lucide-react'
import { Separator } from '@/components/ui/separator'
import { OAuthButton } from '@/components/auth/OAuthButton'
import { SignUpForm } from '@/components/auth/SignUpForm'

const BENEFITS = [
  '30 minutes de transcription gratuites',
  'Précision IA supérieure à 95%',
  'Export SRT, VTT, TXT, DOCX',
]

export default function SignupPage() {
  return (
    <div className="flex min-h-screen">
      {/* Colonne gauche — masquée sur mobile */}
      <div className="hidden flex-1 flex-col justify-between bg-gradient-to-br from-indigo-600 to-indigo-800 p-10 text-white lg:flex">
        <div>
          {/* Logo */}
          <Link href="/" className="inline-flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/20 backdrop-blur-sm">
              <Mic className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold">VoiceScript</span>
          </Link>
        </div>

        <div className="max-w-md space-y-8">
          <h1 className="text-3xl font-bold leading-tight tracking-tight">
            Transcrivez vos contenus audio en texte parfait
          </h1>

          <ul className="space-y-4">
            {BENEFITS.map((benefit) => (
              <li key={benefit} className="flex items-center gap-3">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/20">
                  <Check className="h-4 w-4" />
                </div>
                <span className="text-white/90">{benefit}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Témoignage */}
        <div className="max-w-md rounded-xl bg-white/10 p-6 backdrop-blur-sm">
          <p className="text-sm italic leading-relaxed text-white/90">
            &laquo; VoiceScript m&apos;a fait gagner 10h par semaine sur le
            sous-titrage de mes vidéos. La précision sur le français est
            bluffante. &raquo;
          </p>
          <div className="mt-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-sm font-bold">
              LM
            </div>
            <div>
              <p className="text-sm font-semibold">Lucas Martin</p>
              <p className="text-xs text-white/60">YouTuber — 150K abonnés</p>
            </div>
          </div>
        </div>
      </div>

      {/* Colonne droite — formulaire */}
      <div className="flex flex-1 items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm space-y-6">
          {/* Logo mobile */}
          <div className="flex items-center justify-center gap-2 lg:hidden">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-vs-primary">
              <Mic className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-vs-text">VoiceScript</span>
          </div>

          <div className="space-y-2 text-center">
            <h2 className="text-2xl font-bold text-vs-text">Créer un compte</h2>
            <p className="text-sm text-muted-foreground">
              Commencez à transcrire en 30 secondes
            </p>
          </div>

          {/* OAuth Google */}
          <OAuthButton />

          {/* Séparateur */}
          <div className="relative">
            <Separator />
            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-3 text-xs text-muted-foreground">
              ou
            </span>
          </div>

          {/* Formulaire */}
          <SignUpForm />

          {/* Lien connexion */}
          <p className="text-center text-sm text-muted-foreground">
            Déjà un compte ?{' '}
            <Link
              href="/login"
              className="font-medium text-primary hover:underline"
            >
              Se connecter
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
