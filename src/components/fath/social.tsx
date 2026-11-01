'use client'

import React, { useCallback, useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, Crown, Medal, Megaphone, Trash2, Trophy, X } from 'lucide-react'
import { api, useStore, displayName, fmtDate, CATS, CAT_PTS, type Achievement, type SafeUser } from './store'
import { Avatar, CatIcon, Confirm, Empty, MediaPicker, SectionHead, StaggerItem, StaggerList, RoleBadge, StatTile } from './ui-bits'

/* ═══════════ ACHIEVEMENTS ═══════════ */
export function Achievements() {
  const { me, toast, isMod, users } = useStore()
  const [items, setItems] = useState<Achievement[]>([])
  const [loading, setLoading] = useState(true)
  const [addOpen, setAddOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState<string>('Academic')
  const [description, setDescription] = useState('')
  const [mediaId, setMediaId] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [tab, setTab] = useState<'all' | 'pending' | 'approved'>('all')
  const [delItem, setDelItem] = useState<Achievement | null>(null)
  const [rejectItem, setRejectItem] = useState<Achievement | null>(null)
  const [rejectNote, setRejectNote] = useState('')

  const load = useCallback(async () => {
    try {
      const d = await api<{ achievements: Achievement[] }>('/api/achievements')
      setItems(d.achievements)
    } catch {} finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  if (!me) return null

  const submit = async () => {
    if (!title.trim()) { toast('Enter the achievement title', 'warning'); return }
    setBusy(true)
    try {
      await api('/api/achievements', {
        method: 'POST',
        body: JSON.stringify({ title: title.trim(), category, description: description.trim(), mediaId }),
      })
      toast(isMod ? 'Achievement added & auto-approved' : 'Achievement submitted for approval', 'success')
      setAddOpen(false); setTitle(''); setDescription(''); setMediaId(null)
      await load()
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Failed', 'error')
    } finally { setBusy(false) }
  }

  const decide = async (a: Achievement, status: 'approved' | 'rejected', note?: string) => {
    try {
      await api('/api/achievements', { method: 'PATCH', body: JSON.stringify({ id: a.id, status, note }) })
      toast(status === 'approved' ? 'Achievement approved' : 'Achievement rejected', status === 'approved' ? 'success' : 'info')
      await load()
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Failed', 'error')
    }
  }

  const remove = async (a: Achievement) => {
    try {
      await api('/api/achievements', { method: 'DELETE', body: JSON.stringify({ id: a.id }) })
      setItems((xs) => xs.filter((x) => x.id !== a.id))
      toast('Achievement deleted', 'success')
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Failed', 'error')
    }
  }

  const visible = items.filter((a) => (tab === 'all' ? true : a.status === tab))
  const pendingCount = items.filter((a) => a.status === 'pending').length

  return (
    <div>
      <SectionHead
        eyebrow="Recognition" title="Achievements"
        desc={isMod ? 'Review member submissions and add your own. Approved achievements earn points.' : 'Submit your achievements — moderators will approve them to earn you leaderboard points.'}
        action={<button className="btn btn-primary" onClick={() => setAddOpen(true)}><span className="inline">+</span> Add Achievement</button>}
      />

      <div className="mb-6 flex flex-wrap gap-2">
        {([['all', `All (${items.length})`], ['pending', `Pending (${pendingCount})`], ['approved', `Approved`]] as const).map(([id, label]) => (
          <button key={id} className={`chip ${tab === id ? 'chip-on' : ''}`} onClick={() => setTab(id)}>{label}</button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">{[0, 1, 2].map((i) => <div key={i} className="skeleton-card" style={{ height: 90 }} />)}</div>
      ) : visible.length === 0 ? (
        <Empty icon={<Trophy size={38} />} title="No achievements here" text="Add your first achievement to start earning points!" />
      ) : (
        <StaggerList className="space-y-3">
          {visible.map((a) => {
            const u = users.find((x) => x.id === a.userId) as SafeUser | undefined
            const owner = a.user || (u ? { id: u.id, username: u.username, fullName: u.fullName, role: u.role, photoId: u.photoId, avatarColor: u.avatarColor } : null)
            return (
              <StaggerItem key={a.id}>
                <div className="card flex flex-wrap items-center gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500/15 to-pink-500/15 text-violet-600 dark:text-violet-400">
                    <CatIcon cat={a.category} size={22} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-center gap-2 text-[15px] font-bold">
                      {a.title}
                      <span className="badge-cat">{a.category} +{CAT_PTS[a.category] || 8} pts</span>
                      <StatusPill status={a.status} />
                    </p>
                    {a.description && <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{a.description}</p>}
                    <p className="mt-1.5 text-xs text-muted-foreground">
                      {owner ? `by ${displayName(owner)}` : ''} · {fmtDate(a.createdAt)}
                      {a.note ? ` · note: ${a.note}` : ''}
                    </p>
                  </div>
                  {isMod && a.status === 'pending' && (
                    <div className="flex gap-2">
                      <motion.button whileTap={{ scale: 0.92 }} className="btn btn-sm bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500 hover:text-white dark:text-emerald-400" onClick={() => decide(a, 'approved')}>Approve</motion.button>
                      <button className="btn btn-sm bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white" onClick={() => { setRejectItem(a); setRejectNote('') }}>Reject</button>
                    </div>
                  )}
                  {(a.userId === me.id || isMod) && (
                    <button className="icon-btn sm" onClick={() => setDelItem(a)}><Trash2 size={15} /></button>
                  )}
                </div>
              </StaggerItem>
            )
          })}
        </StaggerList>
      )}

      {/* add modal */}
      <AnimatePresence>
        {addOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={() => setAddOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.92, y: 24 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.94, y: 16 }}
              transition={{ type: 'spring', stiffness: 300, damping: 26 }}
              className="w-full max-w-md rounded-3xl border border-border bg-background p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-5 flex items-center justify-between">
                <h3 className="font-display text-xl font-bold">Add Achievement</h3>
                <button className="icon-btn" onClick={() => setAddOpen(false)}><X size={16} /></button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="label">Title *</label>
                  <input className="input" placeholder="e.g. Won 1st prize in Quran recitation" value={title} onChange={(e) => setTitle(e.target.value)} />
                </div>
                <div>
                  <label className="label">Category</label>
                  <div className="flex flex-wrap gap-2">
                    {CATS.map((c) => (
                      <motion.button
                        key={c} whileTap={{ scale: 0.94 }}
                        className={`chip ${category === c ? 'chip-on' : ''}`}
                        onClick={() => setCategory(c)}
                      ><CatIcon cat={c} size={13} /> {c} · {CAT_PTS[c]}pts</motion.button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="label">Description</label>
                  <textarea className="textarea" placeholder="Tell more about it…" value={description} onChange={(e) => setDescription(e.target.value)} />
                </div>
                <div>
                  <label className="label">Proof (optional photo/certificate)</label>
                  <MediaPicker onPicked={(items) => { if (items[0]) setMediaId(items[0].id) }} accept="image/*,.pdf" multiple={false} label="Attach proof" />
                  {mediaId && <p className="mt-2 flex items-center gap-1 text-xs font-semibold text-emerald-500"><Check size={13} /> Proof attached</p>}
                </div>
                <motion.button whileTap={{ scale: 0.97 }} className="btn btn-primary w-full" onClick={submit} disabled={busy}>
                  {busy ? <><span className="spinner" /> Saving…</> : isMod ? 'Add (auto-approved)' : 'Submit for approval'}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* reject modal */}
      <AnimatePresence>
        {rejectItem && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={() => setRejectItem(null)}
          >
            <motion.div
              initial={{ scale: 0.92, y: 24 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.94 }}
              className="w-full max-w-sm rounded-3xl border border-border bg-background p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}
            >
              <h3 className="font-display text-xl font-bold">Reject achievement</h3>
              <p className="mt-1 text-sm text-muted-foreground">Optionally add a note for the member.</p>
              <textarea className="textarea mt-4" placeholder="e.g. Please attach a valid certificate" value={rejectNote} onChange={(e) => setRejectNote(e.target.value)} />
              <div className="mt-5 flex gap-3">
                <button className="btn btn-secondary flex-1" onClick={() => setRejectItem(null)}>Cancel</button>
                <button className="btn btn-danger flex-1" onClick={() => { decide(rejectItem, 'rejected', rejectNote); setRejectItem(null) }}>Reject</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <Confirm open={!!delItem} onClose={() => setDelItem(null)} onConfirm={() => delItem && remove(delItem)} message={`Delete "${delItem?.title}" permanently?`} />
    </div>
  )
}

export function StatusPill({ status }: { status: string }) {
  if (status === 'approved') return <span className="badge-status-approved">Approved</span>
  if (status === 'rejected') return <span className="badge-status-rejected">Rejected</span>
  return <span className="badge-status-pending">Pending</span>
}

/* ═══════════ LEADERBOARD ═══════════ */
export function Leaderboard() {
  const { toast } = useStore()
  const [data, setData] = useState<{ leaderboard: { id: string; username: string; fullName: string | null; role: string; avatarColor: string | null; photoId: string | null; points: number; disabled: boolean }[]; categories: Record<string, number> } | null>(null)

  useEffect(() => {
    api<{ leaderboard: never[]; categories: Record<string, number> }>('/api/stats')
      .then((d) => setData(d as never))
      .catch(() => toast('Failed to load leaderboard', 'error'))
  }, [toast])

  return (
    <div className="mx-auto max-w-3xl">
      <SectionHead eyebrow="Competition" title="Leaderboard" desc="Points earned from approved achievements across all categories." />
      {!data ? (
        <div className="space-y-3">{[0, 1, 2, 3, 4].map((i) => <div key={i} className="skeleton-card" style={{ height: 72 }} />)}</div>
      ) : data.leaderboard.length === 0 ? (
        <Empty icon={<Medal size={38} />} title="No points yet" text="Approve achievements to build the leaderboard." />
      ) : (
        <>
          {/* podium */}
          <div className="mb-8 flex items-end justify-center gap-4">
            {data.leaderboard.slice(0, 3).map((u, i) => (
              <motion.div
                key={u.id}
                initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.15, type: 'spring', stiffness: 200, damping: 18 }}
                className={`flex flex-col items-center ${i === 0 ? 'order-2 z-10' : i === 1 ? 'order-1' : 'order-3'}`}
              >
                <span className={`mb-1 ${i === 0 ? 'crown-bounce text-amber-500' : ''}`}>
                  {i === 0 ? <Crown size={30} className="text-amber-500" /> : i === 1 ? <Medal size={26} className="text-slate-400" /> : <Medal size={26} className="text-orange-400" />}
                </span>
                <Avatar user={u} size={i === 0 ? 'lg' : 'md'} />
                <p className="mt-2 max-w-[100px] truncate text-center text-sm font-bold">{displayName(u)}</p>
                <p className="font-display text-xl font-bold text-violet-600 dark:text-violet-400">{u.points} pts</p>
                <div
                  className={`mt-2 w-full rounded-t-2xl ${i === 0 ? 'podium-1 h-20' : i === 1 ? 'podium-2 h-14' : 'podium-3 h-10'}`}
                />
              </motion.div>
            ))}
          </div>
          {/* list */}
          <StaggerList className="space-y-2.5">
            {data.leaderboard.map((u, i) => (
              <StaggerItem key={u.id}>
                <div className={`flex items-center gap-3.5 rounded-2xl border p-3.5 transition-colors ${i < 3 ? 'border-violet-400/40 bg-violet-500/5' : 'border-border/60 bg-card'}`}>
                  <span className="w-8 text-center font-display text-lg font-bold text-muted-foreground">{i < 3 ? ['1', '2', '3'][i] : i + 1}</span>
                  <Avatar user={u} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold">{displayName(u)} <RoleBadge role={u.role} /> {u.disabled && <span className="badge-disabled">Disabled</span>}</p>
                    <p className="text-xs text-muted-foreground">#{u.username}</p>
                  </div>
                  <motion.span
                    initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.3 + i * 0.04, type: 'spring', stiffness: 300 }}
                    className="rounded-full bg-gradient-to-r from-violet-600 to-pink-500 px-3.5 py-1 font-display text-sm font-bold text-white points-chip"
                  >
                    {u.points} pts
                  </motion.span>
                </div>
              </StaggerItem>
            ))}
          </StaggerList>
        </>
      )}
    </div>
  )
}

/* ═══════════ ANNOUNCEMENTS ═══════════ */
export function Announcements() {
  const { me, toast, isMod } = useStore()
  const [items, setItems] = useState<Announcement[] | null>(null)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [important, setImportant] = useState(false)
  const [busy, setBusy] = useState(false)
  const [delItem, setDelItem] = useState<Announcement | null>(null)

  const load = useCallback(async () => {
    try {
      const d = await api<{ announcements: Announcement[] }>('/api/announcements')
      setItems(d.announcements)
    } catch {} }
  , [])
  useEffect(() => { load() }, [load])

  if (!me) return null

  const post = async () => {
    if (!title.trim() || !content.trim()) { toast('Title and content are required', 'warning'); return }
    setBusy(true)
    try {
      await api('/api/announcements', { method: 'POST', body: JSON.stringify({ title: title.trim(), content: content.trim(), important }) })
      toast('Announcement published', 'success')
      setTitle(''); setContent(''); setImportant(false)
      await load()
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Failed', 'error')
    } finally { setBusy(false) }
  }

  const remove = async (a: Announcement) => {
    await api('/api/announcements', { method: 'DELETE', body: JSON.stringify({ id: a.id }) }).catch(() => {})
    setItems((xs) => (xs || []).filter((x) => x.id !== a.id))
    toast('Announcement deleted', 'success')
  }

  return (
    <div className="mx-auto max-w-3xl">
      <SectionHead eyebrow="Notice Board" title="Announcements" desc="Important updates from moderators and the office." />

      {isMod && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card mb-7">
          <h3 className="mb-4 font-display flex items-center gap-2 text-lg font-bold"><Megaphone size={18} className="text-pink-500" /> Post an announcement</h3>
          <div className="space-y-3">
            <input className="input" placeholder="Title…" value={title} onChange={(e) => setTitle(e.target.value)} />
            <textarea className="textarea" placeholder="Write the announcement…" value={content} onChange={(e) => setContent(e.target.value)} />
            <label className="check cursor-pointer">
              <input type="checkbox" checked={important} onChange={(e) => setImportant(e.target.checked)} />
              <span>Mark as important (notifies everyone urgently)</span>
            </label>
            <motion.button whileTap={{ scale: 0.97 }} className="btn btn-primary" onClick={post} disabled={busy}>
              {busy ? <><span className="spinner" /> Publishing…</> : 'Publish'}
            </motion.button>
          </div>
        </motion.div>
      )}

      {!items ? (
        <div className="space-y-3">{[0, 1].map((i) => <div key={i} className="skeleton-card" style={{ height: 110 }} />)}</div>
      ) : items.length === 0 ? (
        <Empty icon={<Megaphone size={38} />} title="No announcements" text="Moderators can publish notices here." />
      ) : (
        <StaggerList className="space-y-4">
          {items.map((a) => (
            <StaggerItem key={a.id}>
              <motion.div
                whileHover={{ y: -2 }}
                className={`card relative overflow-hidden ${a.important ? 'border-l-4 border-l-amber-500 important-glow' : ''}`}
              >
                {a.important && <span className="absolute right-4 top-4 rounded-full bg-amber-500/15 px-2.5 py-1 text-[10px] font-bold text-amber-600 dark:text-amber-400">IMPORTANT</span>}
                <h3 className="pr-24 font-display text-lg font-bold">{a.title}</h3>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">{a.content}</p>
                <p className="mt-3 text-xs text-muted-foreground">
                  {a.author ? `— ${displayName(a.author)}` : ''} · {fmtDate(a.createdAt)}
                </p>
                {isMod && (
                  <button className="icon-btn sm absolute bottom-3 right-3" onClick={() => setDelItem(a)}><Trash2 size={15} /></button>
                )}
              </motion.div>
            </StaggerItem>
          ))}
        </StaggerList>
      )}

      <Confirm open={!!delItem} onClose={() => setDelItem(null)} onConfirm={() => delItem && remove(delItem)} message={`Delete announcement "${delItem?.title}"?`} />
    </div>
  )
}
