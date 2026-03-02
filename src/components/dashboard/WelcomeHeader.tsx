import Link from 'next/link'
import { Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface WelcomeHeaderProps {
  firstName: string
}

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Bonne matinée'
  if (hour < 18) return 'Bon après-midi'
  return 'Bonne soirée'
}

export function WelcomeHeader({ firstName }: WelcomeHeaderProps) {
  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold text-vs-text">
          Bonjour {firstName} 👋
        </h1>
        <p className="text-sm text-muted-foreground">{getGreeting()}</p>
      </div>
      <Button asChild className="mt-3 sm:mt-0">
        <Link href="/upload">
          <Upload className="h-4 w-4" />
          Nouvel upload
        </Link>
      </Button>
    </div>
  )
}
