'use client'

import React, { useCallback, useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Calendar, GraduationCap, Heart, Image as ImageIcon, MapPin, MessageCircle, Pencil, Phone, Shield, Star, Target, Trash2, Trophy, User, X } from 'lucide-react'
import { api, useStore, displayName, fmtDate, CAT_PTS, type SafeUser, type Skill, type Post, type Achievement, parseMedia } from './store'
import { Avatar, CatIcon, Confirm, Empty, MediaGrid, Progress, RoleBadge, SectionHead, Lightbox } from './ui-bits'

/* ═══════════ PROFILE (own + others) with SKILLS ═══════════ */
export function Profile({ username, onEditOwn, onOpenChat }: { username: string | null; onEditOwn: () => void; onOpenChat: (userId: string) => void }) {
  const { me, toast } = useStore()
  const [data, setData] = useState<{ profile: SafeUser & { skills: Skill[] }; posts: Post[]; achievements: Achievement[] } | null>(null)
  const [lightbox, setLightbox] = useState<string | null>(null)
  const [delPost, setDelPost] = useState<Post | null>(null)

  const targetUsername = username || me?.username || ''
  const load = useCallback(async () => {
    try {
      const d = await api<{ profile: SafeUser & { skills: Skill[] }; posts: Post[]; achievements: Achievement[] }>(`/api/profile?username=${encodeURIComponent(targetUsername)}`)
      setData(d)
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Failed to load profile', 'error')
    }
  }, [targetUsername, toast])

  useEffect(() => { load() }, [load])

  if (!me) return null
  const own = !username || username === me.username

  const removeSkill = async (skillId: string) => {
    try {
      await api('/api/users', { method: 'PATCH', body: JSON.stringify({ action: 'remove-skill', skillId }) })
      toast('Skill removed', 'success')
      await load()
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Failed', 'error')
    }
  }

  const removePost = async (p: Post) => {
    try {
      await api('/api/posts', { method: 'DELETE', body: JSON.stringify({ id: p.id }) })
      toast('Post deleted', 'success')
      await load()
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Failed', 'error')
    }
  }

  if (!data) {
    return <div className="mx-auto max-w-3xl"><div className="skeleton-card" style={{ height: 320 }} /></div>
  }

  const p = data.profile
  const approved = data.achievements.filter((a) => a.status === 'approved')
  const points = approved.reduce((acc, a) => acc + (CAT_PTS[a.category] || 8), 0)
  const fields = [p.fullName, p.dob, p.klass, p.guardian, p.phone, p.address]
  const completion = Math.round(fields.filter(Boolean).length / fields.length * 60 + Math.min((p.skills || []).length, 3) / 3 * 20 + Math.min(approved.length, 2) / 2 * 20)

  return (
    <div className="mx-auto max-w-3xl">
      {/* header card */}
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="card overflow-hidden p-0">
        <div className="profile-cover h-32" />
        <div className="px-6 pb-6">
          <div className="-mt-12 mb-4 flex flex-wrap items-end justify-between gap-4">
            <motion.div
              initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 260, damping: 18, delay: 0.1 }}
            >
              <div className="rounded-full ring-4 ring-background">
                <Avatar user={p} size="xl" showStatus />
              </div>
            </motion.div>
            <div className="flex gap-2">
              {own ? (
                <>
                  <button className="btn btn-secondary" onClick={onEditOwn}><Pencil size={15} className="inline" /> Edit Profile</button>
                  <button className="btn btn-primary" onClick={() => onEditOwn()}><Target size={15} className="inline" /> Add Skills</button>
                </>
              ) : (
                <>
                  <button className="btn btn-primary" onClick={() => onOpenChat(p.id)}><MessageCircle size={15} className="inline" /> Message</button>
                </>
              )}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-display text-2xl font-bold tracking-tight">{displayName(p)}</h1>
            <RoleBadge role={p.role} />
            {p.disabled && <span className="badge-disabled">Disabled</span>}
          </div>
          <p className="text-sm text-muted-foreground">#{p.username} · joined {fmtDate(p.createdAt)}</p>
          {p.bio && <p className="mt-3 text-[14.5px] leading-relaxed">{p.bio}</p>}

          {/* stats row */}
          <div className="mt-5 grid grid-cols-3 gap-3">
            {[
              { l: 'Points', v: p.role === 'admin' ? '∞' : points, icon: <Star size={17} className="text-amber-500" /> },
              { l: 'Achievements', v: approved.length, icon: <Trophy size={17} className="text-violet-500" /> },
              { l: 'Skills', v: (p.skills || []).length, icon: <Target size={17} className="text-pink-500" /> },
            ].map((s, i) => (
              <motion.div
                key={s.l}
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.08 }}
                className="rounded-2xl bg-muted/60 p-3.5 text-center"
              >
                <p className="flex items-center justify-center text-muted-foreground">{s.icon}</p>
                <p className="font-display text-xl font-bold">{s.v}</p>
                <p className="text-[10.5px] font-bold uppercase tracking-wider text-muted-foreground">{s.l}</p>
              </motion.div>
            ))}
          </div>

          {/* completion */}
          {own && (
            <div className="mt-5">
              <div className="mb-2 flex justify-between text-xs font-semibold">
                <span>Profile completion</span>
                <span className="text-violet-600 dark:text-violet-400">{completion}%</span>
              </div>
              <Progress value={completion} />
            </div>
          )}
        </div>
      </motion.div>

      {/* details + skills */}
      <div className="mt-6 grid gap-5 md:grid-cols-2">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }} className="card">
          <h3 className="mb-4 font-display text-lg font-bold">Details</h3>
          {p.fullName || p.dob || p.klass || p.phone || p.guardian || p.address ? (
            <div className="space-y-2.5 text-sm">
              {p.fullName && <Row icon={<User size={14} />} label="Name" value={p.fullName} />}
              {p.dob && <Row icon={<Calendar size={14} />} label="Date of birth" value={p.dob} />}
              {p.klass && <Row icon={<GraduationCap size={14} />} label="Class" value={p.klass} />}
              {p.guardian && <Row icon={<Shield size={14} />} label="Guardian" value={p.guardian} />}
              {p.phone && <Row icon={<Phone size={14} />} label="Phone" value={p.phone} />}
              {p.address && <Row icon={<MapPin size={14} />} label="Address" value={p.address} />}
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">
              <p>No details added yet.</p>
              {own && <button className="link-btn mt-2" onClick={onEditOwn}>+ Add your details to complete profile</button>}
            </div>
          )}
        </motion.div>

        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="card">
          <h3 className="mb-4 font-display text-lg font-bold">Skills</h3>
          {(p.skills || []).length === 0 ? (
            <div className="text-sm text-muted-foreground">
              <p>No skills added yet.</p>
              {own && <button className="link-btn mt-2" onClick={onEditOwn}>+ Add your first skill</button>}
            </div>
          ) : (
            <div className="space-y-3.5">
              {(p.skills || []).map((sk, i) => (
                <motion.div
                  key={sk.id}
                  initial={{ opacity: 0, x: 14 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25 + i * 0.07 }}
                >
                  <div className="mb-1.5 flex items-center justify-between text-sm">
                    <span className="font-semibold">{sk.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-violet-600 dark:text-violet-400">{sk.level}%</span>
                      {own && <button className="text-muted-foreground hover:text-red-500" onClick={() => removeSkill(sk.id)}><X size={14} /></button>}
                    </div>
                  </div>
                  <Progress value={sk.level} />
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* achievements */}
      <div className="mt-8">
        <h3 className="mb-4 font-display text-lg font-bold">Achievements {approved.length > 0 && <span className="badge-cat">{points} pts earned</span>}</h3>
        {data.achievements.length === 0 ? (
          <Empty icon={<Trophy size={38} />} title="No achievements yet" />
        ) : (
          <div className="flex flex-wrap gap-2.5">
            {data.achievements.map((a, i) => (
              <motion.span
                key={a.id}
                initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }}
                whileHover={{ scale: 1.05, y: -2 }}
                className={`chip ${a.status === 'approved' ? 'chip-on' : a.status === 'rejected' ? 'opacity-50' : ''}`}
                title={a.description || a.title}
              >
                <CatIcon cat={a.category} size={13} /> {a.title}
              </motion.span>
            ))}
          </div>
        )}
      </div>

      {/* posts */}
      <div className="mt-8">
        <h3 className="mb-4 font-display text-lg font-bold">Posts ({data.posts.length})</h3>
        {data.posts.length === 0 ? (
          <Empty icon={<ImageIcon size={38} />} title="No posts yet" />
        ) : (
          <div className="space-y-4">
            {data.posts.map((post) => (
              <motion.div key={post.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="card">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">{fmtDate(post.createdAt)}</p>
                  <div className="flex items-center gap-1.5">
                    <span className="flex items-center gap-2 text-xs text-muted-foreground"><Heart size={12} className="text-pink-500" /> {JSON.parse(post.likes || '[]').length} · <MessageCircle size={12} /> {post.comments.length}</span>
                    <button className="icon-btn sm" onClick={() => setDelPost(post)}><Trash2 size={14} /></button>
                  </div>
                </div>
                {post.content && <p className="mt-2 whitespace-pre-wrap text-sm">{post.content}</p>}
                <MediaGrid items={parseMedia(post.media)} onImageClick={setLightbox} />
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <Lightbox url={lightbox} onClose={() => setLightbox(null)} />
      <Confirm open={!!delPost} onClose={() => setDelPost(null)} onConfirm={() => delPost && removePost(delPost)} message="Delete this post permanently?" />
    </div>
  )
}

function Row({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted/70 text-muted-foreground">{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="text-[10.5px] font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
        <p className="truncate font-semibold">{value}</p>
      </div>
    </div>
  )
}

/* ═══════════ EDIT PROFILE + SKILLS ═══════════ */
export function EditProfile() {
  const { me, refreshUsers, toast } = useStore()
  const [form, setForm] = useState({ fullName: '', dob: '', klass: '', guardian: '', phone: '', address: '', bio: '' })
  const [photoId, setPhotoId] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [skillName, setSkillName] = useState('')
  const [skillLevel, setSkillLevel] = useState(70)
  const [skills, setSkills] = useState<Skill[]>([])

  const load = useCallback(async () => {
    if (!me) return
    try {
      const d = await api<{ profile: SafeUser & { skills: Skill[] } }>(`/api/profile?username=${encodeURIComponent(me.username)}`)
      const p = d.profile
      setForm({
        fullName: p.fullName || '', dob: p.dob || '', klass: p.klass || '', guardian: p.guardian || '',
        phone: p.phone || '', address: p.address || '', bio: p.bio || '',
      })
      setPhotoId(p.photoId)
      setSkills(p.skills || [])
    } catch {}
  }, [me])

  useEffect(() => { load() }, [load])

  if (!me) return null

  const save = async () => {
    setBusy(true)
    try {
      await api('/api/users', { method: 'PATCH', body: JSON.stringify({ action: 'update-profile', ...form, photoId }) })
      toast('Profile saved', 'success')
      await refreshUsers()
      await load()
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Failed', 'error')
    } finally { setBusy(false) }
  }

  const addSkill = async () => {
    if (!skillName.trim()) { toast('Enter a skill name', 'warning'); return }
    try {
      const d = await api<{ skill: Skill }>('/api/users', { method: 'PATCH', body: JSON.stringify({ action: 'add-skill', name: skillName.trim(), level: skillLevel }) })
      setSkills((s) => [...s, d.skill])
      setSkillName(''); setSkillLevel(70)
      toast(`Skill "${d.skill.name}" added`, 'success')
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Failed', 'error')
    }
  }

  const removeSkill = async (skillId: string) => {
    try {
      await api('/api/users', { method: 'PATCH', body: JSON.stringify({ action: 'remove-skill', skillId }) })
      setSkills((s) => s.filter((x) => x.id !== skillId))
      toast('Skill removed', 'success')
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Failed', 'error')
    }
  }

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }))

  return (
    <div className="mx-auto max-w-3xl">
      <SectionHead eyebrow="My Account" title="Edit Profile & Skills" desc="Update your details and show off what you're good at." />

      <div className="grid gap-5 md:grid-cols-2">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card">
          <h3 className="mb-4 font-display text-lg font-bold">Personal details</h3>
          <div className="space-y-3.5">
            <div>
              <label className="label">Full name</label>
              <input className="input" value={form.fullName} onChange={set('fullName')} placeholder="e.g. Muhammed Ahamed" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Date of birth</label>
                <input className="input" type="date" value={form.dob} onChange={set('dob')} />
              </div>
              <div>
                <label className="label">Class / Batch</label>
                <input className="input" value={form.klass} onChange={set('klass')} placeholder="e.g. Year 2 A" />
              </div>
            </div>
            <div>
              <label className="label">Guardian name</label>
              <input className="input" value={form.guardian} onChange={set('guardian')} placeholder="Guardian's name" />
            </div>
            <div>
              <label className="label">Phone</label>
              <input className="input" value={form.phone} onChange={set('phone')} placeholder="+91 …" />
            </div>
            <div>
              <label className="label">Address</label>
              <input className="input" value={form.address} onChange={set('address')} placeholder="Your address" />
            </div>
            <div>
              <label className="label">Bio</label>
              <textarea className="textarea" value={form.bio} onChange={set('bio')} placeholder="Tell about yourself…" />
            </div>
            <div>
              <label className="label">Profile photo</label>
              <div className="flex items-center gap-4">
                <Avatar user={{ username: me.username, fullName: form.fullName, photoId, avatarColor: me.avatarColor, role: me.role }} size="lg" />
                <ProfilePhotoPicker onPicked={(id) => setPhotoId(id)} />
                {photoId && <button className="link-btn" onClick={() => setPhotoId(null)}>Remove</button>}
              </div>
            </div>
            <motion.button whileTap={{ scale: 0.97 }} className="btn btn-primary w-full" onClick={save} disabled={busy}>
              {busy ? <><span className="spinner" /> Saving…</> : 'Save Profile'}
            </motion.button>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card h-fit">
          <h3 className="mb-4 font-display text-lg font-bold">My skills</h3>
          <div className="space-y-3">
            <input
              className="input" placeholder="e.g. Quran recitation, Calligraphy, Football…"
              value={skillName} onChange={(e) => setSkillName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') addSkill() }}
            />
            <div>
              <label className="label">Level: <span className="text-violet-600 dark:text-violet-400">{skillLevel}%</span></label>
              <input type="range" min={10} max={100} step={5} value={skillLevel} onChange={(e) => setSkillLevel(Number(e.target.value))} className="w-full accent-violet-600" />
            </div>
            <motion.button whileTap={{ scale: 0.96 }} className="btn btn-secondary w-full" onClick={addSkill}>Add Skill</motion.button>
          </div>
          <div className="mt-5 space-y-3.5">
            <AnimatePresence>
              {skills.map((sk) => (
                <motion.div
                  key={sk.id}
                  initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -16, height: 0 }}
                >
                  <div className="mb-1.5 flex items-center justify-between text-sm">
                    <span className="font-semibold">{sk.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-violet-600 dark:text-violet-400">{sk.level}%</span>
                      <button className="text-muted-foreground hover:text-red-500" onClick={() => removeSkill(sk.id)}><X size={14} /></button>
                    </div>
                  </div>
                  <Progress value={sk.level} />
                </motion.div>
              ))}
            </AnimatePresence>
            {skills.length === 0 && <p className="text-sm text-muted-foreground">No skills yet — add your first one above!</p>}
          </div>
        </motion.div>
      </div>
    </div>
  )
}

function ProfilePhotoPicker({ onPicked }: { onPicked: (id: string) => void }) {
  const { toast } = useStore()
  const [busy, setBusy] = useState(false)
  return (
    <>
      <input
        type="file" accept="image/*" className="hidden" id="pp-input" disabled={busy}
        onChange={async (e) => {
          const f = e.target.files?.[0]
          if (!f) return
          setBusy(true)
          try {
            const { uploadFile } = await import('./store')
            const it = await uploadFile(f)
            onPicked(it.id)
            toast('Photo uploaded (remember to Save)', 'success')
          } catch (err) {
            toast(err instanceof Error ? err.message : 'Upload failed', 'error')
          } finally { setBusy(false); e.target.value = '' }
        }}
      />
      <button type="button" className="btn btn-secondary" onClick={() => document.getElementById('pp-input')?.click()} disabled={busy}>
        {busy ? <><span className="spinner" /> Uploading…</> : <><ImageIcon size={15} className="inline" /> Choose photo</>}
      </button>
    </>
  )
}
