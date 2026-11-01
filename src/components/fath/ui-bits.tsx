'use client'

import React, { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, Film, Image as ImageIcon, Music, FileText, Paperclip, BookOpen, Trophy, Palette, Handshake, Moon as MoonIcon, Star, X } from 'lucide-react'
import { avatarColor, initials, isOnline, displayName, uploadFile, fmtSize, useStore, type MediaItem, type SafeUser } from './store'

/* ───────────── Avatar ───────────── */
export function Avatar({ user, size = 'md', showStatus = false, onClick }: {
  user: { username: string; fullName?: string | null; photoId?: string | null; avatarColor?: string | null; role?: string; onlineAt?: string | null }
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  showStatus?: boolean
  onClick?: () => void
}) {
  const sizes = { xs: 'w-7 h-7 text-[10px]', sm: 'w-9 h-9 text-xs', md: 'w-11 h-11 text-sm', lg: 'w-16 h-16 text-xl', xl: 'w-24 h-24 text-3xl' }
  const color = user.avatarColor || avatarColor(user.username)
  return (
    <div className={`relative shrink-0 ${onClick ? 'cursor-pointer' : ''}`} onClick={onClick}>
      <div
        className={`${sizes[size]} rounded-full flex items-center justify-center font-bold text-white overflow-hidden shadow-sm ring-2 ring-white/20 dark:ring-white/10 avatar-float`}
        style={{ background: `linear-gradient(135deg, ${color}, ${color}cc)` }}
      >
        {user.photoId ? (
           
          <img src={`/api/files/${user.photoId}`} alt={displayName(user)} className="w-full h-full object-cover" />
        ) : (
          initials({ username: user.username, fullName: user.fullName, role: user.role })
        )}
      </div>
      {showStatus && isOnline(user) && (
        <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-background status-pulse" />
      )}
    </div>
  )
}

/* ───────────── Role badges ───────────── */
export function RoleBadge({ role }: { role: string }) {
  if (role === 'admin') return <span className="badge-admin">Admin</span>
  if (role === 'vip') return <span className="badge-vip">VIP</span>
  return null
}

/* ───────────── Stat tile ───────────── */
export function StatTile({ label, value, icon, accent = 'violet', delay = 0, sub }: {
  label: string; value: string | number; icon?: React.ReactNode; accent?: string; delay?: number; sub?: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay, type: 'spring', stiffness: 260, damping: 20 }}
      whileHover={{ y: -5, scale: 1.02 }}
      className="stat-tile group"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">{label}</p>
          <p className={`mt-2 font-display text-3xl font-bold tracking-tight stat-value-${accent} count-up`}>{value}</p>
          {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
        </div>
        {icon && <span className="stat-icon group-hover:rotate-12 group-hover:scale-125 flex items-center justify-center text-2xl">{icon}</span>}
      </div>
    </motion.div>
  )
}

/* ───────────── Empty state ───────────── */
export function Empty({ icon, title, text }: { icon?: React.ReactNode; title: string; text?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 200, damping: 18 }}
      className="flex flex-col items-center justify-center py-16 text-center"
    >
      {icon && <div className="empty-icon mb-4 float-anim flex items-center justify-center text-4xl text-muted-foreground/70">{icon}</div>}
      <h3 className="font-display text-lg font-bold">{title}</h3>
      {text && <p className="mt-2 max-w-sm text-sm text-muted-foreground">{text}</p>}
    </motion.div>
  )
}

/* ───────────── Modal ───────────── */
export function Modal({ open, onClose, children, wide }: { open: boolean; onClose: () => void; children: React.ReactNode; wide?: boolean }) {
  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    if (open) window.addEventListener('keydown', fn)
    return () => window.removeEventListener('keydown', fn)
  }, [open, onClose])
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 modal-backdrop"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            transition={{ type: 'spring', stiffness: 300, damping: 26 }}
            className={`modal-panel ${wide ? 'max-w-2xl' : 'max-w-md'}`}
            onClick={(e) => e.stopPropagation()}
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/* ───────────── Confirm ───────────── */
export function Confirm({ open, onClose, onConfirm, title, message, danger = true }: {
  open: boolean; onClose: () => void; onConfirm: () => void; title?: string; message: string; danger?: boolean
}) {
  return (
    <Modal open={open} onClose={onClose}>
      <div className="text-center">
        <div className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl ${danger ? 'bg-red-100 text-red-600 dark:bg-red-900/40' : 'bg-violet-100 text-violet-600 dark:bg-violet-900/40'} wiggle`}>
          <AlertTriangle size={26} />
        </div>
        <h3 className="font-display text-xl font-bold">{title || 'Are you sure?'}</h3>
        <p className="mt-2 text-sm text-muted-foreground">{message}</p>
        <div className="mt-6 flex gap-3">
          <button className="btn btn-secondary flex-1" onClick={onClose}>Cancel</button>
          <button className={`btn flex-1 ${danger ? 'btn-danger' : 'btn-primary'}`} onClick={() => { onConfirm(); onClose() }}>Confirm</button>
        </div>
      </div>
    </Modal>
  )
}

/* ───────────── Media upload button (multi) ───────────── */
export function MediaPicker({ onPicked, accept = 'image/*,video/*,audio/*,.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.zip,.txt', multiple = true, label = 'Attach', compact }: {
  onPicked: (items: MediaItem[]) => void
  accept?: string
  multiple?: boolean
  label?: string
  compact?: boolean
}) {
  const ref = useRef<HTMLInputElement>(null)
  const { toast } = useStore()
  const [busy, setBusy] = useState(false)
  return (
    <>
      <input
        ref={ref} type="file" accept={accept} multiple={multiple} className="hidden"
        onChange={async (e) => {
          const files = e.target.files
          if (!files?.length) return
          setBusy(true)
          try {
            const items: MediaItem[] = []
            for (const f of Array.from(files)) {
              if (f.size > 100 * 1024 * 1024) { toast(`"${f.name}" is over 100MB`, 'error'); continue }
              const it = await uploadFile(f)
              items.push(it)
            }
            onPicked(items)
          } catch (err) {
            toast(err instanceof Error ? err.message : 'Upload failed', 'error')
          } finally {
            setBusy(false)
            if (ref.current) ref.current.value = ''
          }
        }}
      />
      <button
        type="button" disabled={busy}
        className={compact ? 'icon-btn' : 'btn btn-secondary'}
        onClick={() => ref.current?.click()}
        title={label}
      >
        {busy ? <span className="spinner inline-block" /> : <Paperclip size={18} />}
        {!compact && <span>{busy ? 'Uploading…' : label}</span>}
      </button>
    </>
  )
}

/* ───────────── Media grid renderer ───────────── */
export function MediaGrid({ items, onImageClick }: { items: MediaItem[]; onImageClick?: (url: string) => void }) {
  if (!items.length) return null
  return (
    <div className={`mt-3 grid gap-1 rounded-2xl overflow-hidden ${items.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
      {items.map((m, i) => {
        const url = m.url || `/api/files/${m.id}`
        if (m.kind === 'image') {
          return (
            <motion.div key={m.id + i} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.06 }} className="media-cell">
              { }
              <img src={url} alt={m.name} className="max-h-[480px] w-full cursor-zoom-in object-cover hover:scale-[1.02] transition-transform duration-300" onClick={() => onImageClick?.(url)} />
            </motion.div>
          )
        }
        if (m.kind === 'video') {
          return (
            <motion.div key={m.id + i} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.06 }} className="media-cell">
              <video src={url} controls className="max-h-[480px] w-full" />
            </motion.div>
          )
        }
        if (m.kind === 'audio') {
          return (
            <div key={m.id + i} className="media-cell flex items-center gap-3 p-4">
              <span className="music-bars text-violet-500"><Music size={26} /></span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{m.name}</p>
                <audio src={url} controls className="mt-2 w-full" />
              </div>
            </div>
          )
        }
        return (
          <a key={m.id + i} href={url} download={m.name} target="_blank" rel="noreferrer" className="media-cell flex items-center gap-3 p-4 hover:bg-accent/10 transition-colors">
            <span className="text-muted-foreground"><FileText size={26} /></span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{m.name}</p>
              <p className="text-xs text-muted-foreground">Click to download</p>
            </div>
            <span className="btn-sm-chip">Download</span>
          </a>
        )
      })}
    </div>
  )
}

/* ───────────── Lightbox ───────────── */
export function Lightbox({ url, onClose }: { url: string | null; onClose: () => void }) {
  return (
    <AnimatePresence>
      {url && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[150] flex items-center justify-center bg-black/90 backdrop-blur-sm p-6" onClick={onClose}
        >
          <motion.img
            initial={{ scale: 0.85, rotate: -1 }} animate={{ scale: 1, rotate: 0 }} exit={{ scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 220, damping: 22 }}
            src={url} alt="Preview" className="max-h-[88vh] max-w-full rounded-2xl shadow-2xl" onClick={(e) => e.stopPropagation()}
          />
          <button className="absolute top-5 right-5 flex h-11 w-11 items-center justify-center rounded-full bg-white/15 text-white text-xl backdrop-blur hover:bg-white/25 transition-colors" onClick={onClose}><X size={22} /></button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/* ───────────── Section header ───────────── */
export function SectionHead({ eyebrow, title, desc, action }: { eyebrow?: string; title: string; desc?: string; action?: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      className="mb-7 flex flex-wrap items-end justify-between gap-4"
    >
      <div>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1 className="font-display text-3xl font-bold tracking-tight md:text-4xl page-title-shine">{title}</h1>
        {desc && <p className="mt-1.5 max-w-xl text-sm text-muted-foreground">{desc}</p>}
      </div>
      {action}
    </motion.div>
  )
}

/* ───────────── Stagger container/item ───────────── */
export const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
}
export const riseIn = {
  hidden: { opacity: 0, y: 22 },
  show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 240, damping: 22 } },
}

export function StaggerList({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className={className}>
      {children}
    </motion.div>
  )
}
export function StaggerItem({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div variants={riseIn} className={className}>
      {children}
    </motion.div>
  )
}

/* ───────────── Progress bar ───────────── */
export function Progress({ value, className }: { value: number; className?: string }) {
  return (
    <div className={`h-2 w-full overflow-hidden rounded-full bg-muted ${className}`}>
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="h-full rounded-full bg-gradient-to-r from-violet-600 to-pink-500"
      />
    </div>
  )
}

/* ───────────── User row (for lists) ───────────── */
export function UserRow({ user, right, onClick }: { user: SafeUser; right?: React.ReactNode; onClick?: () => void }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -18 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 18 }}
      whileHover={{ scale: 1.01 }}
      className="flex items-center gap-3 rounded-2xl border border-border/60 bg-card p-3.5 transition-colors hover:border-violet-400/50 hover:bg-accent/5"
      onClick={onClick}
      style={onClick ? { cursor: 'pointer' } : undefined}
    >
      <Avatar user={user} showStatus />
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-2 truncate text-sm font-bold">
          {displayName(user)}
          <RoleBadge role={user.role} />
          {user.disabled && <span className="badge-disabled">Disabled</span>}
        </p>
        <p className="text-xs text-muted-foreground">#{user.username}{user.klass ? ` · ${user.klass}` : ''}</p>
      </div>
      {right}
    </motion.div>
  )
}

/* ───────────── Category icon ───────────── */
export function CatIcon({ cat, size = 16, className }: { cat: string; size?: number; className?: string }) {
  const map: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
    Academic: BookOpen,
    Sports: Trophy,
    Arts: Palette,
    Community: Handshake,
    Religious: MoonIcon,
    Other: Star,
  }
  const Ico = map[cat] || Star
  return <Ico size={size} className={className} />
}

/* ───────────── File kind icon ───────────── */
export function KindIcon({ kind, size = 24, className }: { kind: string; size?: number; className?: string }) {
  if (kind === 'image') return <ImageIcon size={size} className={className} />
  if (kind === 'video') return <Film size={size} className={className} />
  if (kind === 'audio') return <Music size={size} className={className} />
  return <FileText size={size} className={className} />
}

export function FileSizeText({ bytes }: { bytes: number }) {
  return <span className="text-xs text-muted-foreground">{fmtSize(bytes)}</span>
}
