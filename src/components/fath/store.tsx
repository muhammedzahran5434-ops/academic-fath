'use client'

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { AlertTriangle, Check, Info, X } from 'lucide-react'

/* ───────────────────────── Types ───────────────────────── */
export type Role = 'admin' | 'vip' | 'member'

export type SafeUser = {
  id: string
  username: string
  role: Role
  disabled: boolean
  fullName: string | null
  dob: string | null
  klass: string | null
  guardian: string | null
  phone: string | null
  address: string | null
  bio: string | null
  photoId: string | null
  avatarColor: string | null
  onlineAt: string | null
  vipSince: string | null
  createdAt: string
  skills?: Skill[]
}

export type Skill = { id: string; name: string; level: number }

export type Achievement = {
  id: string
  userId: string
  title: string
  category: string
  description: string | null
  mediaId: string | null
  status: 'pending' | 'approved' | 'rejected'
  points: number
  note: string | null
  createdAt: string
  user?: { id: string; username: string; fullName: string | null; role: string; photoId: string | null; avatarColor: string | null }
}

export type MediaItem = { id: string; name: string; mime: string; kind: string; url?: string }

export type PostComment = {
  id: string
  text: string
  createdAt: string
  user: { username: string; fullName: string | null; avatarColor: string | null; photoId: string | null }
}

export type Post = {
  id: string
  userId: string
  content: string
  media: string
  likes: string
  createdAt: string
  user: { id: string; username: string; fullName: string | null; role: string; photoId: string | null; avatarColor: string | null }
  comments: PostComment[]
}

export type Story = {
  id: string
  userId: string
  type: 'text' | 'image' | 'video'
  content: string | null
  mediaId: string | null
  bg: string | null
  seenBy: string
  replies: string
  expiresAt: string
  createdAt: string
  user: { id: string; username: string; fullName: string | null; role: string; photoId: string | null; avatarColor: string | null }
}

export type Message = {
  id: string
  pair: string
  fromId: string
  toId: string
  text: string | null
  mediaId: string | null
  mediaType: string | null
  replyTo: string | null
  reactions: string
  deleted: boolean
  createdAt: string
}

export type Announcement = {
  id: string
  title: string
  content: string
  important: boolean
  authorId: string
  createdAt: string
  author?: { username: string; fullName: string | null; role: string }
}

export type Notif = {
  id: string
  text: string
  type: string
  read: boolean
  createdAt: string
}

export type Subject = { id: string; name: string; max: number }
export type CceMark = { id: string; userId: string; subjectId: string; marks: number | null; pending: number | null; user?: { username: string; fullName: string | null } }
export type FileRec = { id: string; name: string; mime: string; kind: string; size: number; createdAt: string; uploader?: { username: string; fullName: string | null; role: string } | null }

/* ───────────────────────── API helper ───────────────────────── */
// Session token kept in localStorage so requests authenticate with an
// Authorization header — this works even when the browser blocks cookies
// (e.g. app running inside the preview iframe on mobile).
const TOKEN_KEY = 'fath_token'
export function getToken(): string {
  try { return localStorage.getItem(TOKEN_KEY) || '' } catch { return '' }
}
export function saveToken(t?: string | null) {
  try { if (t) localStorage.setItem(TOKEN_KEY, t) } catch {}
}
export function clearToken() {
  try { localStorage.removeItem(TOKEN_KEY) } catch {}
}

export async function api<T = unknown>(url: string, opts?: RequestInit): Promise<T> {
  const token = getToken()
  const res = await fetch(url, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(opts?.headers || {}),
    },
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error((data as { error?: string }).error || `Request failed (${res.status})`)
  return data as T
}

export async function uploadFile(file: File): Promise<MediaItem> {
  const form = new FormData()
  form.append('file', file)
  const token = getToken()
  const res = await fetch('/api/upload', {
    method: 'POST',
    body: form,
    ...(token ? { headers: { Authorization: `Bearer ${token}` } } : {}),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error((data as { error?: string }).error || 'Upload failed — try a smaller file')
  return (data as { file: MediaItem }).file
}

/* ───────────────────────── Constants ───────────────────────── */
export const CATS = ['Academic', 'Sports', 'Arts', 'Community', 'Religious', 'Other'] as const
export const CAT_PTS: Record<string, number> = { Academic: 15, Sports: 12, Arts: 10, Community: 10, Religious: 10, Other: 8 }
export const STORY_BGS = [
  'linear-gradient(135deg,#7c3aed,#db2777)',
  'linear-gradient(135deg,#0d9488,#059669)',
  'linear-gradient(135deg,#f59e0b,#ef4444)',
  'linear-gradient(135deg,#0891b2,#7c3aed)',
  'linear-gradient(135deg,#ec4899,#f97316)',
  'linear-gradient(135deg,#1e1b3a,#4f46e5)',
]

/* ───────────────────────── Store ───────────────────────── */
type Store = {
  me: SafeUser | null
  loading: boolean
  users: SafeUser[]
  notifications: Notif[]
  unread: number
  theme: 'light' | 'dark'
  toast: (msg: string, type?: 'success' | 'error' | 'info' | 'warning') => void
  setMe: (u: SafeUser | null) => void
  refreshUsers: () => Promise<void>
  refreshNotifications: () => Promise<void>
  toggleTheme: () => void
  isMod: boolean
  isAdmin: boolean
}

const Ctx = createContext<Store | null>(null)
export const useStore = () => {
  const c = useContext(Ctx)
  if (!c) throw new Error('Store missing')
  return c
}

/* ───────────────────────── Toast system ───────────────────────── */
type ToastItem = { id: number; msg: string; type: string }
export function useToastState() {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const toast = useCallback((msg: string, type = 'info') => {
    const id = Date.now() + Math.random()
    setToasts((t) => [...t, { id, msg, type }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3600)
  }, [])
  return { toasts, toast }
}

export function ToastViewport({ toasts }: { toasts: ToastItem[] }) {
  return (
    <div className="fixed top-4 right-4 z-[200] flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="toast-item pointer-events-auto flex items-center gap-3 rounded-xl border border-border bg-background/95 backdrop-blur-lg px-4 py-3 shadow-lg text-sm font-semibold max-w-sm"
          style={{ animation: 'toastIn .35s cubic-bezier(.34,1.56,.64,1)' }}
        >
          <span className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
            t.type === 'success' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/50' :
            t.type === 'error' ? 'bg-red-100 text-red-600 dark:bg-red-900/50' :
            t.type === 'warning' ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/50' :
            'bg-sky-100 text-sky-600 dark:bg-sky-900/50'}`}>
            {t.type === 'success' ? <Check size={14} /> : t.type === 'error' ? <X size={14} /> : t.type === 'warning' ? <AlertTriangle size={14} /> : <Info size={14} />}
          </span>
          {t.msg}
        </div>
      ))}
    </div>
  )
}

/* ───────────────────────── Provider ───────────────────────── */
export function StoreProvider({ children, toastFn }: { children: React.ReactNode; toastFn: (msg: string, type?: 'success' | 'error' | 'info' | 'warning') => void }) {
  const [me, setMe] = useState<SafeUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState<SafeUser[]>([])
  const [notifications, setNotifications] = useState<Notif[]>([])
  const [unread, setUnread] = useState(0)
  const [theme, setTheme] = useState<'light' | 'dark'>('light')

  useEffect(() => {
    api<{ user: SafeUser | null; token?: string | null }>('/api/auth')
      .then((d) => { if (d.token) saveToken(d.token); setMe(d.user) })
      .catch(() => {})
      .finally(() => setLoading(false))
    const t = localStorage.getItem('fath_theme') as 'light' | 'dark' | null
    if (t) { setTheme(t); document.documentElement.classList.toggle('dark', t === 'dark') }
  }, [])

  const refreshUsers = useCallback(async () => {
    try {
      const d = await api<{ users: SafeUser[] }>('/api/users')
      setUsers(d.users)
    } catch {}
  }, [])

  const refreshNotifications = useCallback(async () => {
    try {
      const d = await api<{ notifications: Notif[]; unread: number }>('/api/notifications')
      setNotifications(d.notifications)
      setUnread(d.unread)
    } catch {}
  }, [])

  useEffect(() => {
    if (!me) return
    refreshUsers()
    refreshNotifications()
    const ping = () => fetch('/api/presence', { method: 'POST', ...(getToken() ? { headers: { Authorization: `Bearer ${getToken()}` } } : {}) }).catch(() => {})
    const n = setInterval(refreshNotifications, 15000)
    const p = setInterval(ping, 30000)
    ping()
    return () => { clearInterval(n); clearInterval(p) }
  }, [me, refreshUsers, refreshNotifications])

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next = prev === 'light' ? 'dark' : 'light'
      localStorage.setItem('fath_theme', next)
      document.documentElement.classList.toggle('dark', next === 'dark')
      return next
    })
  }, [])

  const isMod = !!me && (me.role === 'admin' || me.role === 'vip')
  const isAdmin = me?.role === 'admin'

  return (
    <Ctx.Provider value={{ me, loading, users, notifications, unread, theme, toast: toastFn, setMe, refreshUsers, refreshNotifications, toggleTheme, isMod, isAdmin }}>
      {children}
    </Ctx.Provider>
  )
}

/* ───────────────────────── Helpers ───────────────────────── */
export function avatarColor(id: string): string {
  const colors = ['#7c3aed', '#0d9488', '#c026d3', '#e11d48', '#059669', '#d97706', '#dc2626', '#0891b2', '#9333ea', '#4d7c0f']
  let h = 0
  for (let i = 0; i < id.length; i++) h = id.charCodeAt(i) + ((h << 5) - h)
  return colors[Math.abs(h) % colors.length]
}

export function initials(u: { fullName?: string | null; username: string; role?: string }): string {
  if (u.fullName && u.fullName.trim()) {
    const p = u.fullName.trim().split(/\s+/)
    return (p.length >= 2 ? p[0][0] + p[p.length - 1][0] : p[0][0]).toUpperCase()
  }
  return u.role === 'admin' ? 'AD' : u.username.slice(0, 2).toUpperCase()
}

export function displayName(u: { fullName?: string | null; username: string }): string {
  return (u.fullName && u.fullName.trim()) || u.username
}

export function isOnline(u: { onlineAt?: string | null }): boolean {
  return !!u.onlineAt && Date.now() - new Date(u.onlineAt).getTime() < 70000
}

export function fmtTime(ts: string): string {
  const d = new Date(ts)
  let h = d.getHours()
  const m = d.getMinutes()
  const ap = h >= 12 ? 'PM' : 'AM'
  h = h % 12 || 12
  return `${h}:${String(m).padStart(2, '0')} ${ap}`
}

export function fmtAgo(ts: string): string {
  const s = Math.floor((Date.now() - new Date(ts).getTime()) / 1000)
  if (s < 60) return 'just now'
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  return `${Math.floor(s / 86400)}d ago`
}

export function fmtDate(ts: string): string {
  return new Date(ts).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function fmtSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1048576).toFixed(1)} MB`
}

export function parseMedia(json: string): MediaItem[] {
  try {
    return JSON.parse(json || '[]')
  } catch {
    return []
  }
}

export const gradeOf = (pct: number): { g: string; cls: string } => {
  if (pct >= 90) return { g: 'A+', cls: 'text-emerald-500' }
  if (pct >= 80) return { g: 'A', cls: 'text-emerald-500' }
  if (pct >= 70) return { g: 'B+', cls: 'text-violet-500' }
  if (pct >= 60) return { g: 'B', cls: 'text-violet-500' }
  if (pct >= 50) return { g: 'C+', cls: 'text-amber-500' }
  if (pct >= 40) return { g: 'C', cls: 'text-amber-500' }
  if (pct >= 30) return { g: 'D', cls: 'text-orange-500' }
  return { g: 'E', cls: 'text-red-500' }
}
