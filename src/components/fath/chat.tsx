'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FileText, MessageCircle, Paperclip, Search, Send, Trash2, X } from 'lucide-react'
import { api, useStore, displayName, fmtTime, isOnline, type Message, type SafeUser, type MediaItem } from './store'
import { Avatar, RoleBadge, KindIcon } from './ui-bits'

export function Chat() {
  const { me, toast, users } = useStore()
  const [peer, setPeer] = useState<SafeUser | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [filter, setFilter] = useState<'all' | 'unread' | 'groups'>('all')
  const [query, setQuery] = useState('')
  const [replyTo, setReplyTo] = useState<Message | null>(null)
  const [attachPicker, setAttachPicker] = useState(false)
  const [pendingMedia, setPendingMedia] = useState<MediaItem | null>(null)
  const [menuMsg, setMenuMsg] = useState<string | null>(null)
  const [mobileChatOpen, setMobileChatOpen] = useState(false)
  const lastTs = useRef<string>('')
  const scrollRef = useRef<HTMLDivElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const contacts = users
    .filter((u) => u.id !== me?.id && !u.disabled)
    .filter((u) => !query.trim() || displayName(u).toLowerCase().includes(query.toLowerCase()) || u.username.includes(query))

  const loadMessages = useCallback(async (peerId: string, silent = false) => {
    try {
      const since = silent && lastTs.current ? `?since=${encodeURIComponent(lastTs.current)}` : ''
      const d = await api<{ messages: Message[] }>(`/api/messages?peer=${peerId}${since}`)
      if (d.messages.length > 0) {
        lastTs.current = d.messages[d.messages.length - 1].createdAt
        setMessages((prev) => {
          if (silent) {
            const known = new Set(prev.map((m) => m.id))
            const fresh = d.messages.filter((m) => !known.has(m.id))
            return fresh.length ? [...prev, ...fresh] : prev
          }
          return d.messages
        })
      } else if (!silent) {
        setMessages([])
      }
    } catch {}
  }, [])

  useEffect(() => {
    if (!peer) return
    lastTs.current = ''
    loadMessages(peer.id)
    const iv = setInterval(() => loadMessages(peer.id, true), 2500)
    return () => clearInterval(iv)
  }, [peer, loadMessages])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages])

  if (!me) return null

  const send = async () => {
    if (!peer) return
    if (!text.trim() && !pendingMedia) return
    setSending(true)
    try {
      await api('/api/messages', {
        method: 'POST',
        body: JSON.stringify({
          toId: peer.id,
          text: text.trim() || null,
          mediaId: pendingMedia?.id || null,
          mediaType: pendingMedia?.kind || null,
          replyTo: replyTo?.id || null,
        }),
      })
      setText(''); setReplyTo(null); setPendingMedia(null)
      await loadMessages(peer.id)
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Failed to send', 'error')
    } finally {
      setSending(false)
    }
  }

  const delMsg = async (m: Message) => {
    await api('/api/messages', { method: 'PATCH', body: JSON.stringify({ action: 'delete', id: m.id }) }).catch(() => {})
    setMenuMsg(null)
    loadMessages(peer!.id)
  }

  const pickFile = async (f: File) => {
    try {
      const { uploadFile } = await import('./store')
      const it = await uploadFile(f)
      setPendingMedia(it)
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Upload failed', 'error')
    }
  }

  const convos = users.filter((u) => u.id !== me?.id)

  return (
    <div className="mx-auto flex h-[calc(100dvh-170px)] max-w-4xl overflow-hidden rounded-3xl border border-border bg-card shadow-lg md:h-[calc(100dvh-120px)]">
      {/* ── sidebar ── */}
      <div className={`w-full flex-col border-r border-border md:flex md:w-80 md:shrink-0 ${mobileChatOpen ? 'hidden' : 'flex'}`}>
        <div className="border-b border-border p-4">
          <h2 className="font-display flex items-center gap-2 text-xl font-bold"><MessageCircle size={19} className="text-violet-500" /> Chats</h2>
          <div className="relative mt-3">
            <input
              className="w-full rounded-full bg-muted/70 py-2 pl-9 pr-3 text-sm outline-none focus:bg-background"
              placeholder="Search mates…"
              value={query} onChange={(e) => setQuery(e.target.value)}
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"><Search size={15} /></span>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {contacts.length === 0 && <p className="p-6 text-center text-sm text-muted-foreground">No contacts found</p>}
          {contacts.map((u, i) => (
            <motion.button
              key={u.id}
              initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: Math.min(i * 0.03, 0.3) }}
              whileHover={{ scale: 1.01 }}
              className={`flex w-full items-center gap-3 rounded-2xl p-3 text-left transition-colors ${peer?.id === u.id ? 'bg-violet-500/10' : 'hover:bg-accent/10'}`}
              onClick={() => { setPeer(u); setMobileChatOpen(true) }}
            >
              <Avatar user={u} showStatus />
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-1.5 truncate text-sm font-bold">{displayName(u)} <RoleBadge role={u.role} /></p>
                <p className="truncate text-xs text-muted-foreground">{isOnline(u) ? <span className="font-semibold text-emerald-500">● online</span> : `#${u.username}`}</p>
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* ── main ── */}
      <div className={`flex min-w-0 flex-1 flex-col bg-chat-pattern ${!mobileChatOpen ? 'hidden md:flex' : 'flex'}`}>
        {!peer ? (
          <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
              className="mb-5 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-violet-500/20 to-pink-500/20 text-violet-500"
            ><MessageCircle size={42} /></motion.div>
            <h3 className="font-display text-xl font-bold">FATH MATES Messenger</h3>
            <p className="mt-2 max-w-xs text-sm text-muted-foreground">Choose a mate from the list and start chatting. Share text, photos, videos and files — all in real time.</p>
          </div>
        ) : (
          <>
            {/* chat head */}
            <div className="flex items-center gap-3 border-b border-border bg-background/80 px-4 py-3 backdrop-blur">
              <button className="icon-btn md:hidden" onClick={() => setMobileChatOpen(false)}>←</button>
              <Avatar user={peer} showStatus />
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-1.5 truncate text-sm font-bold">{displayName(peer)} <RoleBadge role={peer.role} /></p>
                <p className={`text-xs ${isOnline(peer) ? 'font-semibold text-emerald-500' : 'text-muted-foreground'}`}>
                  {isOnline(peer) ? '● online now' : 'last seen recently'}
                </p>
              </div>
            </div>

            {/* messages */}
            <div ref={scrollRef} className="flex-1 space-y-1.5 overflow-y-auto p-4">
              {messages.length === 0 && (
                <div className="flex h-full flex-col items-center justify-center text-center">
                  <p className="flex h-14 w-14 items-center justify-center rounded-full bg-muted/70 text-muted-foreground"><MessageCircle size={26} /></p>
                  <p className="mt-3 max-w-[220px] text-sm text-muted-foreground">Say hello to {displayName(peer).split(' ')[0]}! No messages yet.</p>
                </div>
              )}
              <AnimatePresence initial={false}>
                {messages.map((m, idx) => {
                  const mine = m.fromId === me.id
                  const replyMsg = m.replyTo ? messages.find((x) => x.id === m.replyTo) : null
                  return (
                    <motion.div
                      key={m.id}
                      initial={{ opacity: 0, y: 14, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ type: 'spring', stiffness: 320, damping: 26 }}
                      className={`group flex items-end gap-2 ${mine ? 'justify-end' : 'justify-start'}`}
                      onClick={() => setMenuMsg(menuMsg === m.id ? null : m.id)}
                    >
                      {mine && (
                        <div className="relative">
                          <AnimatePresence>
                            {menuMsg === m.id && (
                              <motion.div
                                initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.85 }}
                                className="absolute bottom-8 right-0 z-30 w-40 rounded-xl border border-border bg-background p-1 shadow-xl"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <button className="block w-full rounded-lg px-3 py-2 text-left text-xs font-semibold hover:bg-accent/10" onClick={() => { setReplyTo(m); setMenuMsg(null) }}>Reply</button>
                                <button className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-semibold text-red-500 hover:bg-red-500/10" onClick={() => delMsg(m)}><Trash2 size={13} /> Delete</button>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      )}
                      <div className={`bubble max-w-[78%] px-3.5 pb-1.5 pt-2.5 text-sm ${mine ? 'bubble-out' : 'bubble-in'}`}>
                        {replyMsg && (
                          <div className="mb-1.5 rounded-lg border-l-[3px] border-current bg-black/10 px-2.5 py-1.5 text-xs opacity-80">
                            <p className="font-bold">{replyMsg.fromId === me.id ? 'You' : displayName(peer)}</p>
                            <p className="truncate">{replyMsg.text || 'Media'}</p>
                          </div>
                        )}
                        {m.deleted ? (
                          <p className="italic opacity-60">This message was deleted</p>
                        ) : (
                          <>
                            {m.mediaId && m.mediaType === 'image' && (
                               
                              <img src={`/api/files/${m.mediaId}`} alt="" className="mb-1.5 max-h-64 rounded-xl object-cover" />
                            )}
                            {m.mediaId && m.mediaType === 'video' && <video src={`/api/files/${m.mediaId}`} controls className="mb-1.5 max-h-64 rounded-xl" />}
                            {m.mediaId && m.mediaType === 'audio' && <audio src={`/api/files/${m.mediaId}`} controls className="mb-1.5 max-w-[220px]" />}
                            {m.mediaId && !['image', 'video', 'audio'].includes(m.mediaType || '') && (
                              <a href={`/api/files/${m.mediaId}`} download target="_blank" rel="noreferrer" className="mb-1.5 flex items-center gap-2 rounded-xl bg-black/10 px-3 py-2 text-xs font-semibold underline">
                                <FileText size={13} /> {m.text || 'Download file'}
                              </a>
                            )}
                            {m.text && <p className="whitespace-pre-wrap break-words leading-snug">{m.text}</p>}
                          </>
                        )}
                        <div className="mt-1 flex items-center justify-end gap-1 text-[10px] opacity-65">
                          {fmtTime(m.createdAt)}
                          {mine && <span className="tick">&#10003;&#10003;</span>}
                        </div>
                      </div>
                      {!mine && (
                        <div className="relative">
                          <AnimatePresence>
                            {menuMsg === m.id && (
                              <motion.div
                                initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.85 }}
                                className="absolute bottom-8 left-0 z-30 w-40 rounded-xl border border-border bg-background p-1 shadow-xl"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <button className="block w-full rounded-lg px-3 py-2 text-left text-xs font-semibold hover:bg-accent/10" onClick={() => { setReplyTo(m); setMenuMsg(null) }}>Reply</button>
                                <button className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-semibold text-red-500 hover:bg-red-500/10" onClick={() => delMsg(m)}><Trash2 size={13} /> Delete</button>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      )}
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            </div>

            {/* reply bar */}
            <AnimatePresence>
              {replyTo && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden border-t border-border bg-muted/50 px-4">
                  <div className="flex items-center gap-3 py-2 text-xs">
                    <span className="border-l-[3px] border-violet-500 pl-2">
                      <b>Replying to</b> · {replyTo.text?.slice(0, 50) || 'Media'}
                    </span>
                    <button className="ml-auto text-muted-foreground hover:text-foreground" onClick={() => setReplyTo(null)}><X size={14} /></button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* pending media chip */}
            {pendingMedia && (
              <div className="flex items-center gap-2 border-t border-border bg-muted/40 px-4 py-2 text-xs">
                <span className="text-muted-foreground"><KindIcon kind={pendingMedia.kind} size={14} /></span>
                <span className="flex-1 truncate font-semibold">{pendingMedia.name}</span>
                <button onClick={() => setPendingMedia(null)}><X size={14} /></button>
              </div>
            )}

            {/* composer */}
            <div className="border-t border-border bg-background/85 p-3 backdrop-blur">
              <div className="flex items-end gap-2">
                <button className="icon-btn" onClick={() => fileRef.current?.click()} title="Attach photo/video/file"><Paperclip size={18} /></button>
                <input
                  ref={fileRef} type="file" className="hidden"
                  accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.ppt,.pptx,.zip,.txt"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) pickFile(f); e.target.value = '' }}
                />
                <textarea
                  className="max-h-28 min-h-[42px] flex-1 resize-none rounded-2xl bg-muted/70 px-4 py-2.5 text-sm outline-none focus:bg-background"
                  placeholder="Type a message…"
                  rows={1}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
                />
                <motion.button
                  whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.9 }}
                  className="send-btn" onClick={send} disabled={sending || (!text.trim() && !pendingMedia)}
                >
                  {sending ? <span className="spinner" /> : <Send size={17} />}
                </motion.button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
