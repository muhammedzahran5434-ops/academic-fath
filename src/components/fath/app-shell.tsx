'use client'

import React, { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, BookOpen, BarChart3, Camera, CheckCircle2, Film, Home, LogOut, Megaphone, MessageCircle, Moon, Newspaper, Search, Settings, Shield, Sun, Trophy, User, XCircle, AlertTriangle, Sparkles } from 'lucide-react'
import { api, useStore, fmtAgo, displayName, type SafeUser } from './store'
import { Avatar, RoleBadge } from './ui-bits'

export type View =
  | 'dashboard' | 'feed' | 'status' | 'chat' | 'achievements' | 'leaderboard'
  | 'announcements' | 'academic' | 'members' | 'media' | 'profile' | 'settings'

type NavItem = { id: View; label: string; icon: React.ComponentType<{ size?: number; className?: string }> }

const MEMBER_NAV: NavItem[] = [
  { id: 'dashboard', label: 'Home', icon: Home },
  { id: 'feed', label: 'Feed', icon: Newspaper },
  { id: 'status', label: 'Status', icon: Camera },
  { id: 'chat', label: 'Chats', icon: MessageCircle },
  { id: 'achievements', label: 'Awards', icon: Trophy },
  { id: 'leaderboard', label: 'Board', icon: BarChart3 },
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'settings', label: 'Settings', icon: Settings },
]

const MOD_NAV: NavItem[] = [
  { id: 'members', label: 'Members', icon: Shield },
  { id: 'media', label: 'Media', icon: Film },
  { id: 'academic', label: 'Academic', icon: BookOpen },
  { id: 'announcements', label: 'Notice', icon: Megaphone },
]

export function AppShell({ onSignOut, children, view, setView, profileOf }: {
  onSignOut: () => void
  children: React.ReactNode
  view: View
  setView: (v: View) => void
  profileOf: string | null
}) {
  const { me, unread, notifications, refreshNotifications, theme, toggleTheme, users } = useStore()
  const [notifOpen, setNotifOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [search, setSearch] = useState('')
  const searchRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault()
        searchRef.current?.focus()
      }
    }
    window.addEventListener('keydown', fn)
    return () => window.removeEventListener('keydown', fn)
  }, [])

  if (!me) return null
  const isMod = me.role === 'admin' || me.role === 'vip'
  const nav = isMod ? [...MEMBER_NAV.slice(0, 8).map(n => n.id === 'settings' ? n : n), ...[]] : MEMBER_NAV

  const primaryNav = [...MEMBER_NAV.filter((n) => !['settings'].includes(n.id)), ...(isMod ? MOD_NAV : []), MEMBER_NAV.find(n => n.id === 'settings')!]
  const mobileNav = [...MEMBER_NAV.slice(0, 5), ...(isMod ? [{ id: 'members' as View, label: 'Admin', icon: Shield }] : []), { id: 'profile' as View, label: 'Me', icon: User }]

  const searchResults = search.trim().length > 0
    ? users.filter((u) =>
        !u.disabled &&
        (displayName(u).toLowerCase().includes(search.toLowerCase()) || u.username.includes(search)))
      .slice(0, 6)
    : []

  const markAllRead = async () => {
    await api('/api/notifications', { method: 'PATCH', body: JSON.stringify({}) }).catch(() => {})
    refreshNotifications()
  }

  return (
    <div className="min-h-screen bg-background">
      {/* ── Header ── */}
      <header className="sticky top-0 z-40 border-b border-border/70 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 md:px-6">
          <div className="flex cursor-pointer items-center gap-2.5" onClick={() => setView('dashboard')}>
            <div className="brand-mark">FM</div>
            <div className="hidden sm:block">
              <p className="font-display text-[15px] font-bold leading-none tracking-tight">FATH MATES</p>
              <p className="mt-0.5 hidden text-[8.5px] font-bold uppercase tracking-[0.16em] text-muted-foreground md:block">Darul Hasanath</p>
            </div>
          </div>

          {/* desktop nav */}
          <nav className="mx-auto hidden max-w-full items-center gap-0.5 overflow-x-auto lg:flex" style={{ scrollbarWidth: 'none' }}>
            {primaryNav.map((n) => (
              <button
                key={n.id}
                className={`nav-item ${view === n.id ? 'nav-item-on' : ''}`}
                onClick={() => { setView(n.id); }}
              >
                <n.icon size={15} /> {n.label}
                {n.id === 'chat' && unread > 0 && <span className="count-pill">{unread}</span>}
              </button>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            {/* search */}
            <div className="relative hidden md:block">
              <input
                ref={searchRef}
                className="w-44 rounded-full border border-border bg-muted/70 py-2 pl-9 pr-3 text-sm outline-none transition-all focus:w-64 focus:border-violet-500 focus:bg-background"
                placeholder="Search mates… ( / )"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"><Search size={15} /></span>
              <AnimatePresence>
                {searchResults.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8, scale: 0.97 }}
                    className="absolute right-0 top-12 w-72 overflow-hidden rounded-2xl border border-border bg-background shadow-xl"
                  >
                    {searchResults.map((u) => (
                      <button
                        key={u.id}
                        className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-accent/10"
                        onClick={() => { setSearch(''); setView('profile'); window.dispatchEvent(new CustomEvent('open-profile', { detail: u.username })) }}
                      >
                        <Avatar user={u} size="sm" showStatus />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-bold">{displayName(u)}</p>
                          <p className="text-xs text-muted-foreground">#{u.username}</p>
                        </div>
                        <RoleBadge role={u.role} />
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <button className="icon-btn" onClick={toggleTheme} title="Theme">{theme === 'light' ? <Moon size={17} /> : <Sun size={17} />}</button>

            {/* notifications */}
            <div className="relative">
              <button className="icon-btn" onClick={() => { setNotifOpen(!notifOpen); if (!notifOpen) markAllRead() }} title="Notifications">
                <Bell size={17} />
                {unread > 0 && <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white notif-bell">{unread}</span>}
              </button>
              <AnimatePresence>
                {notifOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setNotifOpen(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -10, scale: 0.96 }}
                      className="absolute right-0 top-12 z-50 max-h-[420px] w-80 overflow-y-auto rounded-2xl border border-border bg-background shadow-xl"
                    >
                      <div className="flex items-center justify-between border-b border-border px-4 py-3">
                        <p className="font-display text-sm font-bold">Notifications</p>
                        <button className="link-btn text-xs" onClick={markAllRead}>Mark all read</button>
                      </div>
                      {notifications.length === 0 ? (
                        <p className="px-4 py-8 text-center text-sm text-muted-foreground">No notifications yet</p>
                      ) : notifications.map((n, i) => (
                        <motion.div
                          key={n.id}
                          initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                          className={`flex items-start gap-3 border-b border-border/50 px-4 py-3 ${!n.read ? 'bg-violet-500/5' : ''}`}
                        >
                          <span className="mt-0.5 shrink-0">
                            {n.type === 'success' ? <CheckCircle2 size={15} className="text-emerald-500" /> : n.type === 'error' ? <XCircle size={15} className="text-red-500" /> : n.type === 'warning' ? <AlertTriangle size={15} className="text-amber-500" /> : <Sparkles size={15} className="text-violet-500" />}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="text-[13px] leading-snug">{n.text}</p>
                            <p className="mt-0.5 text-[11px] text-muted-foreground">{fmtAgo(n.createdAt)}</p>
                          </div>
                        </motion.div>
                      ))}
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* user chip */}
            <div className="relative">
              <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="user-chip" onClick={() => setMenuOpen(!menuOpen)}>
                <Avatar user={me} size="sm" showStatus />
                <div className="hidden text-left sm:block">
                  <p className="text-[13px] font-bold leading-tight">{displayName(me)}</p>
                  <p className="text-[10px] font-semibold text-muted-foreground">{me.role === 'admin' ? 'Administrator' : me.role === 'vip' ? 'VIP Member' : 'Member'}</p>
                </div>
              </motion.button>
              <AnimatePresence>
                {menuOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -10, scale: 0.96 }}
                      className="absolute right-0 top-12 z-50 w-56 overflow-hidden rounded-2xl border border-border bg-background p-1.5 shadow-xl"
                    >
                      {([
                        { id: 'profile', label: 'My Profile', icon: User },
                        { id: 'settings', label: 'Settings', icon: Settings },
                        ...(isMod ? [{ id: 'members', label: 'Admin Panel', icon: Shield }] : []),
                      ] as const).map((item) => (
                        <button
                          key={item.id}
                          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold hover:bg-accent/10"
                          onClick={() => { setMenuOpen(false); setView(item.id as View) }}
                        >
                          <item.icon size={16} /> {item.label}
                        </button>
                      ))}
                      <div className="my-1 h-px bg-border" />
                      <button
                        className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-red-500 hover:bg-red-500/10"
                        onClick={() => { setMenuOpen(false); onSignOut() }}
                      >
                        <LogOut size={16} /> Sign Out
                      </button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </header>

      {/* ── Page content ── */}
      <main className="mx-auto w-full max-w-7xl px-4 pb-28 pt-6 md:px-6 md:pb-16">
        <AnimatePresence mode="wait">
          <motion.div
            key={view + (profileOf || '')}
            initial={{ opacity: 0, y: 18, filter: 'blur(4px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -14, filter: 'blur(4px)' }}
            transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* ── Mobile tabs ── */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 flex justify-center border-t border-border bg-background/95 px-1 pb-[max(8px,env(safe-area-inset-bottom))] pt-1.5 backdrop-blur-xl lg:hidden">
        {mobileNav.map((n) => (
          <button
            key={n.id}
            className={`mobile-tab ${view === n.id ? 'text-violet-600 dark:text-violet-400' : 'text-muted-foreground'}`}
            onClick={() => setView(n.id)}
          >
            <span className="transition-transform active:scale-125"><n.icon size={20} /></span>
            <span className="text-[10px] font-bold">{n.label}</span>
            {n.id === 'chat' && unread > 0 && <span className="absolute right-3 top-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">{unread}</span>}
          </button>
        ))}
      </nav>
    </div>
  )
}
