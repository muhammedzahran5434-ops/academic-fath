'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Camera, Eye, Plus, Trash2, X } from 'lucide-react'
import { api, useStore, displayName, fmtAgo, STORY_BGS, type Story, type SafeUser } from './store'
import { Avatar, Confirm, Empty, SectionHead, MediaPicker, RoleBadge } from './ui-bits'

export function StatusPage() {
  const { me, toast, isMod } = useStore()
  const [stories, setStories] = useState<Story[]>([])
  const [loading, setLoading] = useState(true)
  const [composer, setComposer] = useState(false)
  const [tab, setTab] = useState<'text' | 'image' | 'video'>('text')
  const [text, setText] = useState('')
  const [bg, setBg] = useState(STORY_BGS[0])
  const [mediaItem, setMediaItem] = useState<{ id: string; kind: string } | null>(null)
  const [publishing, setPublishing] = useState(false)
  const [viewer, setViewer] = useState<{ list: Story[]; index: number } | null>(null)
  const [delStory, setDelStory] = useState<Story | null>(null)
  const [progress, setProgress] = useState(0)
  const viewTimer = useRef<ReturnType<typeof setInterval> | null>(null)
  const replyText = useRef('')

  const load = useCallback(async () => {
    try {
      const d = await api<{ stories: Story[] }>('/api/stories')
      setStories(d.stories)
    } catch {} finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    if (!viewer) { setProgress(0); if (viewTimer.current) clearInterval(viewTimer.current); return }
    const dur = viewer.list[viewer.index]?.type === 'video' ? 30000 : 8000
    setProgress(0)
    const start = Date.now()
    viewTimer.current = setInterval(() => {
      const pct = Math.min(100, ((Date.now() - start) / dur) * 100)
      setProgress(pct)
      if (pct >= 100) next()
    }, 80)
    // mark seen
    const cur = viewer.list[viewer.index]
    if (cur && me && cur.userId !== me.id) {
      api('/api/stories', { method: 'PATCH', body: JSON.stringify({ action: 'seen', id: cur.id }) }).catch(() => {})
    }
    return () => { if (viewTimer.current) clearInterval(viewTimer.current) }
     
  }, [viewer?.index, viewer])

  if (!me) return null

  const publish = async () => {
    if (tab === 'text' && !text.trim()) { toast('Write your status text', 'warning'); return }
    if (tab !== 'text' && !mediaItem) { toast(`Attach a ${tab} first`, 'warning'); return }
    setPublishing(true)
    try {
      await api('/api/stories', {
        method: 'POST',
        body: JSON.stringify(tab === 'text' ? { type: 'text', content: text.trim(), bg } : { type: tab, mediaId: mediaItem!.id }),
      })
      toast('Status published! Visible for 24 hours', 'success')
      setComposer(false); setText(''); setMediaItem(null); setTab('text')
      await load()
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Failed to publish', 'error')
    } finally {
      setPublishing(false)
    }
  }

  const next = () => {
    setViewer((v) => {
      if (!v) return v
      if (v.index + 1 < v.list.length) return { ...v, index: v.index + 1 }
      return null
    })
  }
  const prev = () => setViewer((v) => (v && v.index > 0 ? { ...v, index: v.index - 1 } : v))

  const removeStory = async (s: Story) => {
    try {
      await api('/api/stories', { method: 'DELETE', body: JSON.stringify({ id: s.id }) })
      setStories((st) => st.filter((x) => x.id !== s.id))
      toast('Status deleted', 'success')
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Failed', 'error')
    }
  }

  const sendReply = async (s: Story) => {
    const t = replyText.current.trim()
    if (!t) return
    try {
      await api('/api/stories', { method: 'PATCH', body: JSON.stringify({ action: 'reply', id: s.id, text: t }) })
      toast('Reply sent!', 'success')
      replyText.current = ''
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Failed', 'error')
    }
  }

  // group by user
  const groups = new Map<string, Story[]>()
  for (const s of stories) {
    const arr = groups.get(s.userId) || []
    arr.push(s)
    groups.set(s.userId, arr)
  }
  const myStories = me ? groups.get(me.id) || [] : []
  const otherGroups = Array.from(groups.entries()).filter(([uid]) => uid !== me?.id)

  const openViewer = (list: Story[], index: number) => setViewer({ list, index })

  return (
    <div className="mx-auto max-w-3xl">
      <SectionHead
        eyebrow="Campus Status" title="Status & Stories"
        desc="Share moments that disappear after 24 hours — text, photos or videos."
        action={<button className="btn btn-primary" onClick={() => setComposer(true)}><Plus size={16} className="inline" /> Add Status</button>}
      />

      {/* status strip */}
      <div className="status-strip">
        {/* my status / add */}
        <motion.button whileHover={{ y: -3 }} whileTap={{ scale: 0.95 }} className="status-bubble" onClick={() => setComposer(true)}>
          <span className="status-ring add"><Plus size={18} /></span>
          <span className="status-name">Add Status</span>
        </motion.button>
        {myStories.length > 0 && (
          <motion.button whileHover={{ y: -3 }} whileTap={{ scale: 0.95 }} className="status-bubble" onClick={() => openViewer(myStories, 0)}>
            <span className="status-ring"><span className="status-ring-inner"><Avatar user={me} /></span></span>
            <span className="status-name">My status</span>
          </motion.button>
        )}
        {otherGroups.map(([uid, list]) => {
          const u = list[0].user as SafeUser
          const allSeen = list.every((s) => JSON.parse(s.seenBy || '[]').includes(me.username))
          return (
            <motion.button
              key={uid} whileHover={{ y: -3 }} whileTap={{ scale: 0.95 }}
              className="status-bubble" onClick={() => openViewer(list, 0)}
            >
              <span className={`status-ring ${allSeen ? 'seen' : ''}`}><span className="status-ring-inner"><Avatar user={u} /></span></span>
              <span className="status-name">{displayName(u).split(' ')[0]}</span>
            </motion.button>
          )
        })}
        {otherGroups.length === 0 && myStories.length === 0 && !loading && (
          <div className="flex flex-1 items-center justify-center py-2 text-sm text-muted-foreground">No active statuses — be the first!</div>
        )}
      </div>

      {/* recent grid */}
      {loading ? (
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">{[0, 1, 2].map((i) => <div key={i} className="skeleton-card" style={{ height: 200 }} />)}</div>
      ) : stories.length === 0 ? (
        <div className="mt-6"><Empty icon={<Camera size={38} />} title="No active statuses" text="Share a status and it will appear here for 24 hours." /></div>
      ) : (
        <div className="mt-7">
          <h3 className="mb-3 font-display text-lg font-bold">Recent updates</h3>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {stories.map((s, i) => (
              <motion.div
                key={s.id}
                initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.06 }}
                whileHover={{ y: -4, scale: 1.02 }}
                className="story-card group relative h-52 cursor-pointer overflow-hidden rounded-2xl"
                style={{ background: s.type === 'text' ? (s.bg || STORY_BGS[0]) : undefined }}
                onClick={() => {
                  const ownerList = groups.get(s.userId) || [s]
                  openViewer(ownerList, ownerList.findIndex((x) => x.id === s.id))
                }}
              >
                {s.type === 'image' && <img src={`/api/files/${s.mediaId}`} alt="" className="absolute inset-0 h-full w-full object-cover" />}
                {s.type === 'video' && <video src={`/api/files/${s.mediaId}`} className="absolute inset-0 h-full w-full object-cover" muted />}
                {(s.type === 'image' || s.type === 'video') && <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20" />}
                {s.type === 'text' && <p className="flex h-full items-center justify-center p-4 text-center font-display text-[15px] font-bold leading-snug text-white">{s.content}</p>}
                <div className="absolute inset-x-0 top-0 flex items-center gap-2 p-3">
                  <Avatar user={s.user} size="xs" />
                  <div className="min-w-0">
                    <p className="truncate text-[11px] font-bold text-white drop-shadow">{displayName(s.user).split(' ')[0]}</p>
                    <p className="text-[9.5px] text-white/75">{fmtAgo(s.createdAt)}</p>
                  </div>
                </div>
                {(s.userId === me.id || isMod) && (
                  <button
                    className="absolute right-2 top-10 hidden h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white group-hover:flex hover:bg-red-500"
                    onClick={(e) => { e.stopPropagation(); setDelStory(s) }}
                  ><Trash2 size={14} /></button>
                )}
                <div className="absolute inset-x-0 bottom-0 flex items-center justify-between p-3">
                  <span className="text-[10px] font-bold text-white/85">{s.type === 'text' ? 'Text' : s.type === 'image' ? 'Photo' : 'Video'}</span>
                  <span className="flex items-center gap-1 text-[10px] text-white/75"><Eye size={11} /> {JSON.parse(s.seenBy || '[]').length}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* ── Composer modal ── */}
      <AnimatePresence>
        {composer && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={() => setComposer(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 30 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.92, y: 20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className="w-full max-w-md rounded-3xl border border-border bg-background p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-5 flex items-center justify-between">
                <h3 className="font-display text-xl font-bold">New Status</h3>
                <button className="icon-btn" onClick={() => setComposer(false)}><X size={14} /></button>
              </div>
              <div className="mb-4 flex gap-2">
                {([['text', 'Text'], ['image', 'Photo'], ['video', 'Video']] as const).map(([id, label]) => (
                  <button key={id} className={`chip ${tab === id ? 'chip-on' : ''}`} onClick={() => { setTab(id); setMediaItem(null) }}>{label}</button>
                ))}
              </div>
              {tab === 'text' ? (
                <>
                  <textarea
                    className="textarea min-h-[110px] font-display text-lg font-semibold"
                    placeholder="What's happening on campus?"
                    value={text} onChange={(e) => setText(e.target.value)} maxLength={280}
                    style={{ background: bg, color: '#fff' }}
                  />
                  <div className="mt-3 flex gap-2">
                    {STORY_BGS.map((b, i) => (
                      <motion.button
                        key={i} whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }}
                        className={`h-8 w-8 rounded-full ring-offset-2 transition-all ${bg === b ? 'ring-2 ring-violet-500' : ''}`}
                        style={{ background: b }} onClick={() => setBg(b)}
                      />
                    ))}
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center gap-4">
                  {mediaItem && (mediaItem.kind === 'image'
                    ? <img src={`/api/files/${mediaItem.id}`} alt="" className="max-h-64 rounded-2xl object-cover" />
                    : <video src={`/api/files/${mediaItem.id}`} controls className="max-h-64 rounded-2xl" />)}
                  <MediaPicker onPicked={(items) => { if (items[0]) setMediaItem({ id: items[0].id, kind: items[0].kind }) }} accept={tab === 'image' ? 'image/*' : 'video/*'} multiple={false} label={`Choose ${tab}`} />
                </div>
              )}
              <motion.button
                whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.97 }}
                className="btn btn-primary mt-6 w-full" onClick={publish} disabled={publishing}
              >
                {publishing ? <><span className="spinner" /> Publishing…</> : 'Publish Status'}
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Story viewer ── */}
      <AnimatePresence>
        {viewer && viewer.list[viewer.index] && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[120] flex flex-col bg-black"
          >
            {/* progress bars */}
            <div className="absolute inset-x-4 top-3 z-20 flex gap-1">
              {viewer.list.map((_, i) => (
                <div key={i} className="h-[3px] flex-1 overflow-hidden rounded-full bg-white/25">
                  <div
                    className="h-full rounded-full bg-white transition-none"
                    style={{ width: i < viewer.index ? '100%' : i === viewer.index ? `${progress}%` : '0%' }}
                  />
                </div>
              ))}
            </div>
            {/* header */}
            <div className="absolute inset-x-4 top-8 z-20 flex items-center gap-3 pt-2 text-white">
              <Avatar user={viewer.list[viewer.index].user} size="sm" />
              <div className="flex-1">
                <p className="flex items-center gap-1.5 text-sm font-bold">{displayName(viewer.list[viewer.index].user)} <RoleBadge role={viewer.list[viewer.index].user.role} /></p>
                <p className="text-xs text-white/70">{fmtAgo(viewer.list[viewer.index].createdAt)}</p>
              </div>
              {(viewer.list[viewer.index].userId === me.id || isMod) && (
                <button className="icon-btn text-white" onClick={() => { const s = viewer.list[viewer.index]; setViewer(null); setDelStory(s) }}><Trash2 size={16} /></button>
              )}
              <button className="icon-btn text-white" onClick={() => setViewer(null)}><X size={14} /></button>
            </div>
            {/* body */}
            <div className="flex flex-1 items-center justify-center">
              {viewer.list[viewer.index].type === 'text' && (
                <motion.p
                  key={viewer.list[viewer.index].id}
                  initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                  className="max-w-xl px-10 text-center font-display text-2xl font-bold leading-snug text-white md:text-3xl"
                  style={{ background: 'none' }}
                >
                  <span className="inline-block rounded-3xl p-8" style={{ background: viewer.list[viewer.index].bg || STORY_BGS[0] }}>
                    {viewer.list[viewer.index].content}
                  </span>
                </motion.p>
              )}
              {viewer.list[viewer.index].type === 'image' && (
                <motion.img
                  key={viewer.list[viewer.index].id}
                  initial={{ scale: 0.94, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                  src={`/api/files/${viewer.list[viewer.index].mediaId}`} alt="" className="max-h-full max-w-full object-contain"
                />
              )}
              {viewer.list[viewer.index].type === 'video' && (
                <motion.video
                  key={viewer.list[viewer.index].id}
                  initial={{ scale: 0.94, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                  src={`/api/files/${viewer.list[viewer.index].mediaId}`} className="max-h-full max-w-full" autoPlay controls={false} muted={false}
                />
              )}
            </div>
            {/* nav zones */}
            <button className="absolute bottom-0 left-0 top-16 w-1/3" onClick={prev} aria-label="Previous" />
            <button className="absolute bottom-0 right-0 top-16 w-1/3" onClick={next} aria-label="Next" />
            {/* reply */}
            {viewer.list[viewer.index].userId !== me.id && (
              <div className="absolute inset-x-4 bottom-6 z-20 flex gap-2">
                <input
                  className="flex-1 rounded-full border border-white/25 bg-white/15 px-5 py-3 text-sm text-white outline-none backdrop-blur-xl placeholder:text-white/60 focus:border-white/50"
                  placeholder="Reply to this status…"
                  onChange={(e) => { replyText.current = e.target.value }}
                  onKeyDown={(e) => { if (e.key === 'Enter') sendReply(viewer.list[viewer.index]) }}
                />
                <button className="btn btn-primary rounded-full" onClick={() => sendReply(viewer.list[viewer.index])}>Send</button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <Confirm
        open={!!delStory} onClose={() => setDelStory(null)}
        onConfirm={() => delStory && removeStory(delStory)}
        message="This status will be deleted immediately."
      />
    </div>
  )
}
