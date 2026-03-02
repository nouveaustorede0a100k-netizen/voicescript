import { Suspense } from 'react'
import Link from 'next/link'
import { Mic } from 'lucide-react'
import { Separator } from '@/components/ui/separator'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { OAuthButton } from '@/components/auth/OAuthButton'
import { SignInForm } from '@/components/auth/SignInForm'

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="items-center space-y-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-vs-primary">
              <Mic className="h-5 w-5 text-white" />
            </div>
            <span className="text-2xl font-bold text-vs-text">VoiceScript</span>
          </Link>

          <div className="space-y-1 text-center">
            <h1 className="text-xl font-bold text-vs-text">Connexion</h1>
            <p className="text-sm text-muted-foreground">
              Accédez à votre espace de transcription
            </p>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* OAuth Google */}
          <OAuthButton />

          {/* Séparateur */}
          <div className="relative">
            <Separator />
            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-3 text-xs text-muted-foreground">
              ou
            </span>
          </div>

          {/* Formulaire (Suspense requis pour useSearchParams) */}
          <Suspense>
            <SignInForm />
          </Suspense>

          {/* Lien inscription */}
          <p className="text-center text-sm text-muted-foreground">
            Pas encore de compte ?{' '}
            <Link
              href="/signup"
              className="font-medium text-primary hover:underline"
            >
              S&apos;inscrire
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
