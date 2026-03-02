import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Mic, FileText, Zap, Globe } from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-vs-background">
      <header className="border-b border-border bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-vs-primary">
              <Mic className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-vs-text">VoiceScript</span>
          </div>
          <nav className="hidden items-center gap-6 md:flex">
            <Link href="/pricing" className="text-sm text-muted-foreground hover:text-vs-text">
              Tarifs
            </Link>
            <Link href="/login">
              <Button variant="ghost" size="sm">
                Connexion
              </Button>
            </Link>
            <Link href="/signup">
              <Button size="sm">Commencer gratuitement</Button>
            </Link>
          </nav>
          <Link href="/login" className="md:hidden">
            <Button size="sm">Connexion</Button>
          </Link>
        </div>
      </header>

      <main>
        <section className="mx-auto max-w-7xl px-6 py-24 text-center">
          <div className="mx-auto max-w-3xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-vs-primary/20 bg-vs-primary/5 px-4 py-1.5 text-sm text-vs-primary">
              <Zap className="h-4 w-4" />
              Transcription IA pour les francophones
            </div>
            <h1 className="mb-6 text-4xl font-extrabold tracking-tight text-vs-text sm:text-5xl lg:text-6xl">
              Transformez votre{' '}
              <span className="bg-gradient-to-r from-vs-primary to-vs-accent bg-clip-text text-transparent">
                voix en texte
              </span>{' '}
              en quelques secondes
            </h1>
            <p className="mb-10 text-lg text-muted-foreground sm:text-xl">
              VoiceScript transcrit vos vidéos YouTube, podcasts et formations
              avec une précision inégalée pour le français. Éditez, exportez et
              réutilisez votre contenu facilement.
            </p>
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Link href="/signup">
                <Button size="lg" className="w-full sm:w-auto">
                  Commencer — c&apos;est gratuit
                </Button>
              </Link>
              <Link href="/pricing">
                <Button variant="outline" size="lg" className="w-full sm:w-auto">
                  Voir les tarifs
                </Button>
              </Link>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              30 minutes gratuites par mois — sans carte bancaire
            </p>
          </div>
        </section>

        <section className="border-t border-border bg-white py-20">
          <div className="mx-auto max-w-7xl px-6">
            <h2 className="mb-12 text-center text-3xl font-bold text-vs-text">
              Tout ce dont vous avez besoin
            </h2>
            <div className="grid gap-8 md:grid-cols-3">
              <FeatureCard
                icon={<Mic className="h-6 w-6 text-vs-primary" />}
                title="Transcription précise"
                description="Powered by Whisper, optimisé pour le français, le québécois et les accents africains."
              />
              <FeatureCard
                icon={<FileText className="h-6 w-6 text-vs-accent" />}
                title="Éditeur interactif"
                description="Corrigez le texte en temps réel avec synchronisation audio mot par mot."
              />
              <FeatureCard
                icon={<Globe className="h-6 w-6 text-vs-success" />}
                title="Export multi-format"
                description="Exportez en TXT, SRT, VTT ou DOCX. Parfait pour le sous-titrage et le SEO."
              />
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border py-8">
        <div className="mx-auto max-w-7xl px-6 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} VoiceScript. Tous droits réservés.
        </div>
      </footer>
    </div>
  )
}

interface FeatureCardProps {
  icon: React.ReactNode
  title: string
  description: string
}

function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <div className="rounded-xl border border-border bg-white p-6 transition-shadow hover:shadow-md">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-muted">
        {icon}
      </div>
      <h3 className="mb-2 text-lg font-semibold text-vs-text">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  )
}
