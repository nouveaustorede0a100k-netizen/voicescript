'use client'

import { useSearchParams } from 'next/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { User, CreditCard, Settings, Key } from 'lucide-react'
import { ProfileForm } from '@/components/settings/ProfileForm'
import { BillingSection } from '@/components/settings/BillingSection'
import { PreferencesForm } from '@/components/settings/PreferencesForm'
import { ApiKeysManager } from '@/components/settings/ApiKeysManager'
import type { Profile } from '@/types'

interface SettingsContentProps {
  profile: Profile
}

export function SettingsContent({ profile }: SettingsContentProps) {
  const searchParams = useSearchParams()
  const defaultTab = searchParams.get('tab') ?? 'profile'
  const showApiKeys = profile.plan === 'pro' || profile.plan === 'studio'

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Paramètres</h1>
        <p className="text-muted-foreground">Gérez votre compte et vos préférences</p>
      </div>

      <Tabs defaultValue={defaultTab} className="space-y-6">
        <TabsList className="grid w-full max-w-[500px] grid-cols-3 lg:grid-cols-4">
          <TabsTrigger value="profile" className="gap-1.5 text-xs sm:text-sm">
            <User className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Profil</span>
          </TabsTrigger>
          <TabsTrigger value="billing" className="gap-1.5 text-xs sm:text-sm">
            <CreditCard className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Facturation</span>
          </TabsTrigger>
          <TabsTrigger value="preferences" className="gap-1.5 text-xs sm:text-sm">
            <Settings className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Préférences</span>
          </TabsTrigger>
          {showApiKeys && (
            <TabsTrigger value="api-keys" className="gap-1.5 text-xs sm:text-sm">
              <Key className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Clés API</span>
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="profile">
          <ProfileForm profile={profile} />
        </TabsContent>

        <TabsContent value="billing">
          <BillingSection profile={profile} />
        </TabsContent>

        <TabsContent value="preferences">
          <PreferencesForm profile={profile} />
        </TabsContent>

        {showApiKeys && (
          <TabsContent value="api-keys">
            <ApiKeysManager />
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}
