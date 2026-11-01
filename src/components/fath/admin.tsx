'use client'

import React, { useCallback, useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Ban, ChevronDown, ChevronUp, Download, Film, Newspaper, Play, Plus, Search, Trash2, Users, X } from 'lucide-react'
import { api, useStore, displayName, fmtDate, fmtSize, gradeOf, type SafeUser, type Subject, type CceMark, type FileRec } from './store'
import { Avatar, Confirm, Empty, KindIcon, SectionHead, StaggerItem, StaggerList, RoleBadge, StatTile, UserRow } from './ui-bits'

/* ═══════════ MEMBER CONTROL (admin + VIP) ═══════════ */
export function MembersAdmin() {
  const { me, users, refreshUsers, toast, isAdmin } = useStore()
  const [query, setQuery] = useState('')
  const [sel, setSel] = useState<SafeUser | null>(null)
  const [confirmAction, setConfirmAction] = useState<{ label: string; fn: () => Promise<void> } | null>(null)
  const [resetPass, setResetPass] = useState<SafeUser | null>(null)
  const [newPass, setNewPass] = useState('')
  const [adnoOpen, setAdnoOpen] = useState(false)
  const [newAdno, setNewAdno] = useState('')
  const [stats, setStats] = useState<{ userCount: number; postCount: number; fileCount: number; achCount: number; disabledCount: number; pendingAch: number; msgCount: number; storyCount: number } | null>(null)

  const loadStats = useCallback(async () => {
    try {
      const d = await api<{ stats: typeof stats }>('/api/stats')
      setStats(d.stats)
    } catch {}
  }, [])
  useEffect(() => { loadStats() }, [loadStats])

  if (!me || (me.role !== 'admin' && me.role !== 'vip')) return null

  const act = async (label: string, fn: () => Promise<unknown>) => {
    try {
      await fn()
      toast(label, 'success')
      await refreshUsers()
      setSel((s) => (s ? (users.find((u) => u.id === s.id) as SafeUser) || null : null))
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Action failed', 'error')
    }
  }

  const makeVip = (u: SafeUser) => setConfirmAction({
    label: `Make ${displayName(u)} a VIP?`,
    fn: () => act('Promoted to VIP', () => api('/api/users', { method: 'PATCH', body: JSON.stringify({ action: 'make-vip', userId: u.id }) })),
  })

  const removeVip = (u: SafeUser) => setConfirmAction({
    label: `Remove VIP from ${displayName(u)}?`,
    fn: () => act('VIP removed', () => api('/api/users', { method: 'PATCH', body: JSON.stringify({ action: 'remove-vip', userId: u.id }) })),
  })

  const disable = (u: SafeUser) => setConfirmAction({
    label: `Disable ${displayName(u)}'s account? They will be signed out immediately.`,
    fn: () => act('Account disabled', () => api('/api/users', { method: 'PATCH', body: JSON.stringify({ action: 'disable', userId: u.id }) })),
  })

  const enable = (u: SafeUser) => setConfirmAction({
    label: `Re-enable ${displayName(u)}'s account?`,
    fn: () => act('Account enabled', () => api('/api/users', { method: 'PATCH', body: JSON.stringify({ action: 'enable', userId: u.id }) })),
  })

  const del = (u: SafeUser) => setConfirmAction({
    label: `PERMANENTLY delete ${displayName(u)}? All their posts and data will be removed!`,
    fn: () => act('Member deleted', () => api('/api/users', { method: 'PATCH', body: JSON.stringify({ action: 'delete', userId: u.id }) })),
  })

  const doResetPass = async () => {
    if (!resetPass) return
    if (newPass.length < 6) { toast('Password must be at least 6 characters', 'warning'); return }
    try {
      await api('/api/users', { method: 'PATCH', body: JSON.stringify({ action: 'reset-password', userId: resetPass.id, newPassword: newPass }) })
      toast(`Password reset for ${displayName(resetPass)}`, 'success')
      setResetPass(null); setNewPass('')
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Failed', 'error')
    }
  }

  const addAdno = async () => {
    if (!newAdno.trim()) { toast('Enter an admission number', 'warning'); return }
    try {
      await api('/api/users', { method: 'PATCH', body: JSON.stringify({ action: 'add-admission', adno: newAdno.trim() }) })
      toast(`Member #${newAdno.trim()} added (default pass: ${newAdno.trim()}@fath)`, 'success')
      setAdnoOpen(false); setNewAdno('')
      await refreshUsers()
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Failed', 'error')
    }
  }

  const list = users.filter((u) => {
    if (u.role === 'admin' && me.role !== 'admin') return false
    if (u.id === me.id) return false
    const q = query.trim().toLowerCase()
    if (!q) return true
    return displayName(u).toLowerCase().includes(q) || u.username.includes(q)
  })

  return (
    <div>
      <SectionHead
        eyebrow={me.role === 'admin' ? 'Administrator Console' : 'VIP Console'}
        title="Member Control"
        desc="Manage members — promote to VIP, disable accounts, reset passwords and more."
        action={isAdmin ? <button className="btn btn-primary" onClick={() => setAdnoOpen(true)}><Plus size={16} className="inline" /> Add Admission</button> : undefined}
      />

      {/* stats */}
      {stats && (
        <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
          <StatTile label="Members" value={stats.userCount} icon={<Users size={22} />} delay={0} />
          <StatTile label="Posts" value={stats.postCount} icon={<Newspaper size={22} />} delay={0.05} accent="pink" />
          <StatTile label="Media Files" value={stats.fileCount} icon={<Film size={22} />} delay={0.1} accent="teal" />
          <StatTile label="Disabled" value={stats.disabledCount} icon={<Ban size={22} />} delay={0.15} accent="red" />
        </div>
      )}

      <div className="mb-5">
        <input className="input max-w-sm" placeholder="Search members…" value={query} onChange={(e) => setQuery(e.target.value)} />
      </div>

      <StaggerList className="space-y-2.5">
        {list.map((u) => (
          <StaggerItem key={u.id}>
            <div className="rounded-2xl border border-border/60 bg-card">
              <div className="flex items-center gap-3 p-3.5">
                <Avatar user={u} showStatus />
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-2 text-sm font-bold">
                    {displayName(u)}
                    <RoleBadge role={u.role} />
                    {u.disabled && <span className="badge-disabled">Disabled</span>}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    #{u.username}{u.klass ? ` · ${u.klass}` : ''}{u.fullName ? '' : ' · not activated'}
                  </p>
                </div>
                <motion.button whileTap={{ scale: 0.9 }} className="btn btn-sm btn-secondary" onClick={() => setSel(sel?.id === u.id ? null : u)}>
                  {sel?.id === u.id ? <><ChevronUp size={14} className="inline" /> Hide</> : <><ChevronDown size={14} className="inline" /> Manage</>}
                </motion.button>
              </div>
              <AnimatePresence>
                {sel?.id === u.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden border-t border-border/60"
                  >
                    <div className="flex flex-wrap gap-2 p-4">
                      {u.role !== 'vip' && u.role !== 'admin' && (
                        <button className="btn btn-sm btn-vip" onClick={() => makeVip(u)}>Make VIP</button>
                      )}
                      {u.role === 'vip' && isAdmin && (
                        <button className="btn btn-sm btn-secondary" onClick={() => removeVip(u)}>Remove VIP</button>
                      )}
                      {u.disabled ? (
                        <button className="btn btn-sm bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500 hover:text-white dark:text-emerald-400" onClick={() => enable(u)}>Enable Account</button>
                      ) : (
                        <button className="btn btn-sm bg-amber-500/15 text-amber-600 hover:bg-amber-500 hover:text-white dark:text-amber-400" onClick={() => disable(u)}>Disable Account</button>
                      )}
                      <button className="btn btn-sm btn-secondary" onClick={() => { setResetPass(u); setNewPass('') }}>Reset Password</button>
                      {isAdmin && u.role !== 'admin' && (
                        <button className="btn btn-sm btn-danger" onClick={() => del(u)}>Delete Member</button>
                      )}
                    </div>
                    {(u.fullName || u.dob || u.klass || u.phone || u.guardian || u.address) && (
                      <div className="border-t border-border/60 px-4 py-3 text-xs text-muted-foreground">
                        <p className="mb-1.5 font-bold uppercase tracking-widest">Profile details</p>
                        <div className="grid grid-cols-2 gap-x-6 gap-y-1 md:grid-cols-3">
                          {u.fullName && <span><b>Name:</b> {u.fullName}</span>}
                          {u.dob && <span><b>DOB:</b> {u.dob}</span>}
                          {u.klass && <span><b>Class:</b> {u.klass}</span>}
                          {u.phone && <span><b>Phone:</b> {u.phone}</span>}
                          {u.guardian && <span><b>Guardian:</b> {u.guardian}</span>}
                          {u.address && <span><b>Address:</b> {u.address}</span>}
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </StaggerItem>
        ))}
      </StaggerList>
      {list.length === 0 && <Empty icon={<Search size={38} />} title="No members found" />}

      {/* confirm dialog */}
      <Confirm
        open={!!confirmAction} onClose={() => setConfirmAction(null)}
        onConfirm={() => confirmAction && confirmAction.fn()}
        message={confirmAction?.label || ''}
        title="Please confirm"
      />

      {/* reset password */}
      <AnimatePresence>
        {resetPass && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={() => setResetPass(null)}
          >
            <motion.div
              initial={{ scale: 0.92, y: 24 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.94 }}
              className="w-full max-w-sm rounded-3xl border border-border bg-background p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}
            >
              <h3 className="font-display text-xl font-bold">Reset password</h3>
              <p className="mt-1 text-sm text-muted-foreground">Set a new password for <b>{displayName(resetPass)}</b> (# {resetPass.username}).</p>
              <input className="input mt-4" type="text" placeholder="New password (min 6 chars)" value={newPass} onChange={(e) => setNewPass(e.target.value)} />
              <div className="mt-5 flex gap-3">
                <button className="btn btn-secondary flex-1" onClick={() => setResetPass(null)}>Cancel</button>
                <button className="btn btn-primary flex-1" onClick={doResetPass}>Reset</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* add admission */}
      <AnimatePresence>
        {adnoOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={() => setAdnoOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.92, y: 24 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.94 }}
              className="w-full max-w-sm rounded-3xl border border-border bg-background p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}
            >
              <h3 className="font-display text-xl font-bold">Add member</h3>
              <p className="mt-1 text-sm text-muted-foreground">Add an admission number. Default password will be <b>adno@fath</b>.</p>
              <input className="input mt-4" placeholder="e.g. 850" value={newAdno} onChange={(e) => setNewAdno(e.target.value)} />
              <div className="mt-5 flex gap-3">
                <button className="btn btn-secondary flex-1" onClick={() => setAdnoOpen(false)}>Cancel</button>
                <button className="btn btn-primary flex-1" onClick={addAdno}>Add</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/* ═══════════ MEDIA LIBRARY — admin/VIP can watch every video & file ═══════════ */
export function MediaLibrary() {
  const { toast } = useStore()
  const [files, setFiles] = useState<FileRec[] | null>(null)
  const [kind, setKind] = useState<'all' | 'video' | 'image' | 'audio' | 'file'>('all')
  const [preview, setPreview] = useState<FileRec | null>(null)
  const [delFile, setDelFile] = useState<FileRec | null>(null)

  const load = useCallback(async () => {
    try {
      const d = await api<{ files: FileRec[] }>(`/api/media${kind !== 'all' ? `?kind=${kind}` : ''}`)
      setFiles(d.files)
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Failed to load', 'error')
      setFiles([])
    }
  }, [kind, toast])

  useEffect(() => { load() }, [load])

  const remove = async (f: FileRec) => {
    await api('/api/media', { method: 'DELETE', body: JSON.stringify({ id: f.id }) }).catch(() => {})
    setFiles((fs) => (fs || []).filter((x) => x.id !== f.id))
    toast('File deleted from server', 'success')
  }

  const tabs = [['all', 'All'], ['video', 'Videos'], ['image', 'Images'], ['audio', 'Audio'], ['file', 'Files']] as const

  return (
    <div>
      <SectionHead
        eyebrow="Moderator Tools" title="Media Library"
        desc="Every photo, video, audio and file shared on the website — watch, download or remove."
      />
      <div className="mb-5 flex flex-wrap gap-2">
        {tabs.map(([id, label]) => (
          <button key={id} className={`chip ${kind === id ? 'chip-on' : ''}`} onClick={() => setKind(id)}>{label}</button>
        ))}
      </div>

      {!files ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">{[0, 1, 2, 3].map((i) => <div key={i} className="skeleton-card" style={{ height: 180 }} />)}</div>
      ) : files.length === 0 ? (
        <Empty icon={<Film size={38} />} title="No media found" text="When members share videos, photos or files, they appear here." />
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {files.map((f, i) => (
            <motion.div
              key={f.id}
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: Math.min(i * 0.04, 0.4) }}
              whileHover={{ y: -4, scale: 1.02 }}
              className="group overflow-hidden rounded-2xl border border-border bg-card"
            >
              <div className="relative h-36 cursor-pointer bg-muted/50" onClick={() => setPreview(f)}>
                {f.kind === 'image' && <img src={`/api/files/${f.id}`} alt={f.name} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />}
                {f.kind === 'video' && (
                  <>
                    <video src={`/api/files/${f.id}`} className="h-full w-full object-cover" muted preload="metadata" />
                    <span className="absolute inset-0 flex items-center justify-center">
                      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur transition-transform group-hover:scale-110"><Play size={22} className="fill-current" /></span>
                    </span>
                  </>
                )}
                {!['image', 'video'].includes(f.kind) && (
                  <span className="flex h-full w-full items-center justify-center text-muted-foreground"><KindIcon kind={f.kind} size={38} /></span>
                )}
                <span className="absolute left-2 top-2 rounded-md bg-black/55 px-1.5 py-0.5 text-[9px] font-bold uppercase text-white">{f.kind}</span>
              </div>
              <div className="p-3">
                <p className="truncate text-xs font-bold">{f.name}</p>
                <p className="mt-0.5 text-[10.5px] text-muted-foreground">
                  {f.uploader ? `by ${displayName(f.uploader)}` : 'unknown'} · {fmtSize(f.size)}
                </p>
                <div className="mt-2 flex gap-1.5">
                  <a href={`/api/files/${f.id}`} download={f.name} className="btn btn-xs btn-secondary flex-1 justify-center" onClick={(e) => e.stopPropagation()}><Download size={12} className="inline" /> Save</a>
                  <button className="btn btn-xs btn-danger" onClick={() => setDelFile(f)}><Trash2 size={13} /></button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* video/image preview modal */}
      <AnimatePresence>
        {preview && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[130] flex items-center justify-center bg-black/90 p-6 backdrop-blur" onClick={() => setPreview(null)}
          >
            <motion.div
              initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.92 }}
              transition={{ type: 'spring', stiffness: 240, damping: 24 }}
              className="max-h-[85vh] w-full max-w-3xl overflow-hidden rounded-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {preview.kind === 'video' && <video src={`/api/files/${preview.id}`} controls autoPlay className="max-h-[78vh] w-full" />}
              {preview.kind === 'image' && <img src={`/api/files/${preview.id}`} alt="" className="max-h-[78vh] w-full object-contain" />}
              {preview.kind === 'audio' && <audio src={`/api/files/${preview.id}`} controls autoPlay className="w-full" />}
              {!['video', 'image', 'audio'].includes(preview.kind) && (
                <div className="flex flex-col items-center gap-4 bg-background p-10 text-center">
                  <span className="text-muted-foreground"><KindIcon kind={preview.kind} size={48} /></span>
                  <p className="font-bold">{preview.name}</p>
                  <a href={`/api/files/${preview.id}`} download={preview.name} className="btn btn-primary"><Download size={15} className="inline" /> Download File</a>
                </div>
              )}
            </motion.div>
            <button className="absolute right-5 top-5 flex h-11 w-11 items-center justify-center rounded-full bg-white/15 text-xl text-white backdrop-blur hover:bg-white/25" onClick={() => setPreview(null)}><X size={16} /></button>
          </motion.div>
        )}
      </AnimatePresence>

      <Confirm open={!!delFile} onClose={() => setDelFile(null)} onConfirm={() => delFile && remove(delFile)} message={`Delete "${delFile?.name}" from the server permanently?`} />
    </div>
  )
}

/* ═══════════ ACADEMIC / CCE ═══════════ */
export function Academic() {
  const { me, toast, isMod, users } = useStore()
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [marks, setMarks] = useState<CceMark[]>([])
  const [selUser, setSelUser] = useState<string>('')
  const [editing, setEditing] = useState<Record<string, string>>({})
  const [newSubj, setNewSubj] = useState({ name: '', max: '50' })
  const [myPending, setMyPending] = useState<Record<string, string>>({})

  const load = useCallback(async () => {
    try {
      const d = await api<{ subjects: Subject[]; marks: CceMark[] }>('/api/subjects')
      setSubjects(d.subjects)
      setMarks(d.marks)
    } catch {}
  }, [])
  useEffect(() => { load() }, [load])

  useEffect(() => {
    if (isMod && users.length > 0 && !selUser) {
      const firstMember = users.find((u) => u.role !== 'admin')
      if (firstMember) setSelUser(firstMember.id)
    }
  }, [isMod, users, selUser])

  if (!me) return null

  const markOf = (userId: string, subjectId: string) => marks.find((m) => m.userId === userId && m.subjectId === subjectId)

  const saveMarks = async (userId: string, subjectId: string) => {
    const val = editing[subjectId]
    if (val === undefined) return
    try {
      await api('/api/subjects', { method: 'POST', body: JSON.stringify({ action: 'save-marks', userId, subjectId, marks: val === '' ? null : val }) })
      toast('Marks saved', 'success')
      setEditing({})
      await load()
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Failed', 'error')
    }
  }

  const submitMine = async (subjectId: string) => {
    const val = myPending[subjectId]
    if (val === undefined || val === '') { toast('Enter your marks first', 'warning'); return }
    try {
      await api('/api/subjects', { method: 'POST', body: JSON.stringify({ action: 'submit-marks', subjectId, marks: val }) })
      toast('Marks submitted for approval', 'success')
      setMyPending({})
      await load()
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Failed', 'error')
    }
  }

  const addSubject = async () => {
    if (!newSubj.name.trim()) { toast('Enter subject name', 'warning'); return }
    try {
      await api('/api/subjects', { method: 'POST', body: JSON.stringify({ action: 'add-subject', name: newSubj.name.trim(), max: Number(newSubj.max) || 50 }) })
      toast('Subject added', 'success')
      setNewSubj({ name: '', max: '50' })
      await load()
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Failed', 'error')
    }
  }

  const removeSubject = async (s: Subject) => {
    try {
      await api('/api/subjects', { method: 'POST', body: JSON.stringify({ action: 'remove-subject', subjectId: s.id }) })
      toast('Subject removed', 'success')
      await load()
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Failed', 'error')
    }
  }

  const approvePending = async (markId: string) => {
    try {
      await api('/api/subjects', { method: 'POST', body: JSON.stringify({ action: 'approve-marks', markId }) })
      toast('Marks approved', 'success')
      await load()
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Failed', 'error')
    }
  }

  const rejectPending = async (markId: string) => {
    try {
      await api('/api/subjects', { method: 'POST', body: JSON.stringify({ action: 'reject-marks', markId }) })
      toast('Submission rejected', 'info')
      await load()
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Failed', 'error')
    }
  }

  // ---- my own view (member) ----
  if (!isMod) {
    const mine = subjects.map((s) => ({ s, m: markOf(me.id, s.id) }))
    const valid = mine.filter((x) => typeof x.m?.marks === 'number')
    const total = valid.reduce((acc, x) => acc + (x.m?.marks || 0), 0)
    const maxTotal = valid.reduce((acc, x) => acc + x.s.max, 0)
    const pct = maxTotal > 0 ? Math.round((total / maxTotal) * 100) : 0
    const grade = gradeOf(pct)
    return (
      <div className="mx-auto max-w-3xl">
        <SectionHead eyebrow="Academic" title="My CCE Record" desc="Your continuous evaluation marks. Submit missing marks for moderator approval." />
        {maxTotal > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card mb-6 flex items-center gap-6">
            <div className={`flex h-20 w-20 items-center justify-center rounded-full border-4 ${pct >= 50 ? 'border-emerald-500' : 'border-amber-500'} grade-ring`}>
              <span className={`font-display text-2xl font-bold ${grade.cls}`}>{grade.g}</span>
            </div>
            <div className="flex-1">
              <p className="font-display text-2xl font-bold">{total} <span className="text-lg text-muted-foreground">/ {maxTotal}</span></p>
              <p className="text-sm text-muted-foreground">{pct}% overall across {valid.length} subjects</p>
            </div>
          </motion.div>
        )}
        <StaggerList className="space-y-3">
          {mine.map(({ s, m }) => (
            <StaggerItem key={s.id}>
              <div className="card flex flex-wrap items-center gap-4">
                <div className="min-w-0 flex-1">
                  <p className="text-[15px] font-bold">{s.name}</p>
                  <p className="text-xs text-muted-foreground">Max {s.max} marks</p>
                  {m?.pending !== null && m?.pending !== undefined && (
                    <p className="mt-1 text-xs font-semibold text-amber-500">Submitted {m.pending} — awaiting approval</p>
                  )}
                </div>
                {typeof m?.marks === 'number' ? (
                  <div className="text-right">
                    <p className="font-display text-2xl font-bold">{m.marks}<span className="text-sm text-muted-foreground">/{s.max}</span></p>
                    <p className={`text-xs font-bold ${gradeOf((m.marks / s.max) * 100).cls}`}>{gradeOf((m.marks / s.max) * 100).g}</p>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <input
                      className="input w-24 py-2 text-sm" type="number" min={0} max={s.max} placeholder="Marks"
                      value={myPending[s.id] ?? ''}
                      onChange={(e) => setMyPending((p) => ({ ...p, [s.id]: e.target.value }))}
                    />
                    <button className="btn btn-sm btn-primary" onClick={() => submitMine(s.id)}>Submit</button>
                  </div>
                )}
              </div>
            </StaggerItem>
          ))}
        </StaggerList>
      </div>
    )
  }

  // ---- moderator view ----
  const members = users.filter((u) => u.role !== 'admin' && !u.disabled)
  const target = selUser || members[0]?.id || ''
  const pendingMarks = marks.filter((m) => m.pending !== null && m.pending !== undefined)

  return (
    <div>
      <SectionHead eyebrow="Academic Admin" title="CCE Marks Manager" desc="Enter marks for any member, add subjects and approve member submissions." />

      {pendingMarks.length > 0 && (
        <div className="card mb-7 border-l-4 border-l-amber-500">
          <h3 className="mb-3 font-display text-base font-bold">Member submissions awaiting approval</h3>
          <div className="space-y-2">
            {pendingMarks.map((m) => {
              const u = users.find((x) => x.id === m.userId)
              const s = subjects.find((x) => x.id === m.subjectId)
              return (
                <div key={m.id} className="flex flex-wrap items-center gap-3 rounded-xl bg-muted/50 p-3 text-sm">
                  <span className="font-bold">{u ? displayName(u) : 'Unknown'}</span>
                  <span className="text-muted-foreground">· {s?.name || 'Subject'} · submitted <b>{m.pending}</b>/{s?.max}</span>
                  <div className="ml-auto flex gap-2">
                    <button className="btn btn-sm bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500 hover:text-white dark:text-emerald-400" onClick={() => approvePending(m.id)}>Approve</button>
                    <button className="btn btn-sm bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white" onClick={() => rejectPending(m.id)}>Reject</button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div className="mb-5 flex flex-wrap items-center gap-3">
        <select className="select max-w-xs" value={target} onChange={(e) => setSelUser(e.target.value)}>
          {members.map((u) => <option key={u.id} value={u.id}>{displayName(u)} (#{u.username})</option>)}
        </select>
        {me.role === 'admin' && (
          <div className="flex gap-2">
            <input className="input w-36" placeholder="New subject" value={newSubj.name} onChange={(e) => setNewSubj({ ...newSubj, name: e.target.value })} />
            <input className="input w-20" type="number" placeholder="Max" value={newSubj.max} onChange={(e) => setNewSubj({ ...newSubj, max: e.target.value })} />
            <button className="btn btn-secondary" onClick={addSubject}>＋ Add</button>
          </div>
        )}
      </div>

      <StaggerList className="space-y-3">
        {subjects.map((s) => {
          const m = markOf(target, s.id)
          const val = editing[s.id]
          return (
            <StaggerItem key={s.id}>
              <div className="card flex flex-wrap items-center gap-4">
                <div className="min-w-0 flex-1">
                  <p className="text-[15px] font-bold">{s.name}</p>
                  <p className="text-xs text-muted-foreground">
                    Max {s.max} · {typeof m?.marks === 'number' ? `current: ${m.marks}` : 'no marks'}
                    {m?.pending !== null && m?.pending !== undefined ? ` · pending: ${m.pending}` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    className="input w-24 py-2 text-sm" type="number" min={0} max={s.max}
                    placeholder={typeof m?.marks === 'number' ? String(m.marks) : 'Marks'}
                    value={val ?? (typeof m?.marks === 'number' ? String(m.marks) : '')}
                    onChange={(e) => setEditing((p) => ({ ...p, [s.id]: e.target.value }))}
                  />
                  <motion.button whileTap={{ scale: 0.92 }} className="btn btn-sm btn-primary" onClick={() => saveMarks(target, s.id)}>Save</motion.button>
                  {me.role === 'admin' && (
                    <button className="icon-btn sm" onClick={() => removeSubject(s)} title="Remove subject"><Trash2 size={15} /></button>
                  )}
                </div>
              </div>
            </StaggerItem>
          )
        })}
      </StaggerList>
    </div>
  )
}
