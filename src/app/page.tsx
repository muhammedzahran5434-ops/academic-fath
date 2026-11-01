'use client'

import React, { useCallback, useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { StoreProvider, ToastViewport, useStore, useToastState, getToken, clearToken, type SafeUser } from '@/components/fath/store'
import { Landing, AuthPage } from '@/components/fath/auth'
import { AppShell, type View } from '@/components/fath/app-shell'
import { Dashboard } from '@/components/fath/dashboard'
import { Feed } from '@/components/fath/feed'
import { StatusPage } from '@/components/fath/status'
import { Chat } from '@/components/fath/chat'
import { Achievements, Leaderboard, Announcements } from '@/components/fath/social'
import { MembersAdmin, MediaLibrary, Academic } from '@/components/fath/admin'
import { Profile, EditProfile } from '@/components/fath/profile'
import { Settings } from '@/components/fath/settings'

type Screen = 'landing' | 'auth' | 'app'

function Root() {
  const { me, loading, toast, setMe } = useStore()
  const [screen, setScreen] = useState<Screen>('landing')
  const [view, setView] = useState<View>('dashboard')
  const [profileOf, setProfileOf] = useState<string | null>(null)
  const [editMode, setEditMode] = useState(false)

  useEffect(() => {
    if (!loading && me) setScreen('app')
  }, [loading, me])

  // profile deep-open events from header search
  useEffect(() => {
    const fn = (e: Event) => {
      const username = (e as CustomEvent).detail as string
      setProfileOf(username)
      setEditMode(false)
      setView('profile')
    }
    window.addEventListener('open-profile', fn)
    return () => window.removeEventListener('open-profile', fn)
  }, [])

  const onSignedIn = useCallback((u: SafeUser) => {
    setMe(u)
    setScreen('app')
    setView('dashboard')
  }, [setMe])

  const onSignOut = useCallback(async () => {
    try {
      const token = getToken()
      await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ action: 'logout' }),
      })
    } catch {}
    clearToken()
    setMe(null)
    setScreen('landing')
    toast('Signed out — see you soon!', 'info')
  }, [setMe, toast])

  const openProfile = useCallback((username: string) => {
    setProfileOf(username)
    setEditMode(false)
    setView('profile')
  }, [])

  const openChatWith = useCallback((userId: string) => {
    setView('chat')
    toast('Opening chats…', 'info')
  }, [toast])

  const goEditOwn = useCallback(() => {
    setEditMode(true)
    setProfileOf(null)
    setView('profile')
  }, [])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <motion.div
          animate={{ scale: [1, 1.12, 1], rotate: [0, 5, -5, 0] }}
          transition={{ repeat: Infinity, duration: 1.4, ease: 'easeInOut' }}
          className="brand-mark text-2xl"
        >FM</motion.div>
      </div>
    )
  }

  if (screen === 'landing' || (!me && screen !== 'auth')) {
    return <Landing onEnter={() => (me ? setScreen('app') : setScreen('auth'))} />
  }

  if (!me) {
    return <AuthPage onBack={() => setScreen('landing')} onSignedIn={onSignedIn} />
  }

  const navigate = (v: View) => { setView(v); if (v !== 'profile') setProfileOf(null); if (v === 'profile') setEditMode(false) }

  return (
    <AppShell onSignOut={onSignOut} view={view} setView={navigate} profileOf={profileOf}>
      <ScreenRouter
        view={view}
        me={me}
        profileOf={profileOf}
        editMode={editMode}
        openProfile={openProfile}
        openChatWith={openChatWith}
        goEditOwn={goEditOwn}
        onSignOut={onSignOut}
        setView={navigate}
      />
    </AppShell>
  )
}

function ScreenRouter({ view, me, profileOf, editMode, openProfile, openChatWith, goEditOwn, onSignOut, setView }: {
  view: View
  me: SafeUser
  profileOf: string | null
  editMode: boolean
  openProfile: (u: string) => void
  openChatWith: (id: string) => void
  goEditOwn: () => void
  onSignOut: () => void
  setView: (v: View) => void
}) {
  const isMod = me.role === 'admin' || me.role === 'vip'
  if (view === 'feed') return <Feed onOpenProfile={openProfile} />
  if (view === 'status') return <StatusPage />
  if (view === 'chat') return <Chat />
  if (view === 'achievements') return <Achievements />
  if (view === 'leaderboard') return <Leaderboard />
  if (view === 'announcements') return <Announcements />
  if (view === 'members') return isMod ? <MembersAdmin /> : <Dashboard setView={setView} onOpenProfile={openProfile} />
  if (view === 'media') return isMod ? <MediaLibrary /> : <Dashboard setView={setView} onOpenProfile={openProfile} />
  if (view === 'academic') return <Academic />
  if (view === 'settings') return <Settings onSignOut={onSignOut} />
  if (view === 'profile') return editMode || (!profileOf && !editMode) ? <EditProfile /> : <Profile username={profileOf} onEditOwn={goEditOwn} onOpenChat={openChatWith} />
  return <Dashboard setView={setView} onOpenProfile={openProfile} />
}

export default function Page() {
  const { toasts, toast } = useToastState()
  return (
    <StoreProvider toastFn={toast}>
      <ToastViewport toasts={toasts} />
      <Root />
    </StoreProvider>
  )
}
