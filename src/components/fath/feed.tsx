'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Film, Heart, Image as ImageIcon, Inbox, Link2, MessageCircle, Music, FileText, Trash2, X } from 'lucide-react'
import { api, useStore, displayName, fmtAgo, parseMedia, type MediaItem, type Post } from './store'
import { Avatar, Confirm, MediaGrid, MediaPicker, Empty, SectionHead, Lightbox, RoleBadge } from './ui-bits'

export function Feed({ onOpenProfile }: { onOpenProfile: (username: string) => void }) {
  const { me, toast, isMod } = useStore()
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [text, setText] = useState('')
  const [media, setMedia] = useState<MediaItem[]>([])
  const [publishing, setPublishing] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [commentBoxes, setCommentBoxes] = useState<Record<string, boolean>>({})
  const [commentText, setCommentText] = useState('')
  const [deletePost, setDeletePost] = useState<Post | null>(null)
  const [filter, setFilter] = useState<'all' | 'mine' | 'media'>('all')
  const taRef = useRef<HTMLTextAreaElement>(null)

  const load = useCallback(async () => {
    try {
      const d = await api<{ posts: Post[] }>('/api/posts')
      setPosts(d.posts)
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Failed to load feed', 'error')
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => { load() }, [load])

  if (!me) return null

  const publish = async () => {
    if (!text.trim() && media.length === 0) { toast('Write something or attach a photo/video/file', 'warning'); return }
    setPublishing(true)
    try {
      await api('/api/posts', { method: 'POST', body: JSON.stringify({ content: text.trim(), media }) })
      setText(''); setMedia([])
      toast('Posted to the feed!', 'success')
      await load()
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Failed to post', 'error')
    } finally {
      setPublishing(false)
    }
  }

  const like = async (post: Post) => {
    try {
      const d = await api<{ likes: string[] }>('/api/posts', { method: 'PATCH', body: JSON.stringify({ action: 'like', id: post.id }) })
      setPosts((ps) => ps.map((p) => (p.id === post.id ? { ...p, likes: JSON.stringify(d.likes) } : p)))
    } catch {}
  }

  const addComment = async (postId: string) => {
    if (!commentText.trim()) return
    try {
      const d = await api<{ comment: Post['comments'][0] }>('/api/posts', { method: 'PATCH', body: JSON.stringify({ action: 'comment', id: postId, text: commentText.trim() }) })
      setPosts((ps) => ps.map((p) => (p.id === postId ? { ...p, comments: [...p.comments, d.comment] } : p)))
      setCommentText('')
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Failed to comment', 'error')
    }
  }

  const removePost = async (post: Post) => {
    try {
      await api('/api/posts', { method: 'DELETE', body: JSON.stringify({ id: post.id }) })
      setPosts((ps) => ps.filter((p) => p.id !== post.id))
      toast('Post deleted', 'success')
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Failed to delete', 'error')
    }
  }

  const visible = posts.filter((p) => {
    if (filter === 'mine') return p.userId === me.id
    if (filter === 'media') return parseMedia(p.media).length > 0
    return true
  })

  return (
    <div className="mx-auto max-w-2xl">
      <SectionHead eyebrow="Campus Feed" title="What's happening" desc="Share moments, achievements, photos, videos and files with your mates." />

      {/* composer */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="card mb-6 overflow-hidden p-0"
      >
        <div className="flex gap-3 p-4">
          <Avatar user={me} />
          <textarea
            ref={taRef}
            className="min-h-[70px] flex-1 resize-none bg-transparent text-[15px] outline-none placeholder:text-muted-foreground"
            placeholder={`What's on your mind, ${displayName(me).split(' ')[0]}? Share text, photos, videos or files…`}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) publish() }}
          />
        </div>
        <AnimatePresence>
          {media.length > 0 && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="px-4">
              <div className="flex flex-wrap gap-2 rounded-xl bg-muted/60 p-3">
                {media.map((m) => (
                  <motion.div key={m.id} initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex items-center gap-2 rounded-lg bg-background px-3 py-1.5 text-xs font-semibold shadow-sm">
                    <span className="text-muted-foreground">{m.kind === 'image' ? <ImageIcon size={13} /> : m.kind === 'video' ? <Film size={13} /> : m.kind === 'audio' ? <Music size={13} /> : <FileText size={13} />}</span>
                    <span className="max-w-[140px] truncate">{m.name}</span>
                    <button className="text-muted-foreground hover:text-red-500" onClick={() => setMedia((md) => md.filter((x) => x.id !== m.id))}><X size={14} /></button>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div className="flex items-center justify-between border-t border-border/70 px-4 py-3">
          <div className="flex items-center gap-1.5">
            <MediaPicker compact onPicked={(items) => setMedia((md) => [...md, ...items].slice(0, 10))} label="Photo/Video" accept="image/*,video/*" />
            <MediaPicker compact onPicked={(items) => setMedia((md) => [...md, ...items].slice(0, 10))} label="File" accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.zip,.txt,.mp3,.wav,audio/*" />
          </div>
          <motion.button
            whileHover={{ scale: publishing ? 1 : 1.03 }} whileTap={{ scale: publishing ? 1 : 0.96 }}
            className="btn btn-primary" onClick={publish} disabled={publishing}
          >
            {publishing ? <><span className="spinner" /> Posting…</> : 'Post'}
          </motion.button>
        </div>
      </motion.div>

      {/* filters */}
      <div className="mb-5 flex gap-2">
        {([['all', 'All posts'], ['mine', 'My posts'], ['media', 'With media']] as const).map(([id, label]) => (
          <button key={id} className={`chip ${filter === id ? 'chip-on' : ''}`} onClick={() => setFilter(id)}>{label}</button>
        ))}
      </div>

      {/* posts */}
      {loading ? (
        <div className="space-y-4">{[0, 1, 2].map((i) => <div key={i} className="skeleton-card" style={{ height: 140 }} />)}</div>
      ) : visible.length === 0 ? (
        <Empty icon={<Inbox size={38} />} title="No posts yet" text="Be the first to share something with your mates!" />
      ) : (
        <AnimatePresence mode="popLayout">
          {visible.map((post, idx) => {
            const likes: string[] = JSON.parse(post.likes || '[]')
            const liked = likes.includes(me.username)
            const items = parseMedia(post.media)
            const canDelete = post.userId === me.id || isMod
            return (
              <motion.article
                key={post.id}
                layout
                initial={{ opacity: 0, y: 28 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.94, transition: { duration: 0.2 } }}
                transition={{ delay: Math.min(idx * 0.05, 0.3), type: 'spring', stiffness: 220, damping: 24 }}
                className="card mb-5 p-0"
              >
                <div className="flex items-center gap-3 p-4 pb-3">
                  <Avatar user={post.user} onClick={() => onOpenProfile(post.user.username)} />
                  <div className="min-w-0 flex-1">
                    <button className="flex items-center gap-1.5 text-sm font-bold hover:underline" onClick={() => onOpenProfile(post.user.username)}>
                      {displayName(post.user)} <RoleBadge role={post.user.role} />
                    </button>
                    <p className="text-xs text-muted-foreground">#{post.user.username} · {fmtAgo(post.createdAt)}</p>
                  </div>
                  {canDelete && (
                    <button className="icon-btn sm" onClick={() => setDeletePost(post)} title="Delete post"><Trash2 size={15} /></button>
                  )}
                </div>
                {post.content && (
                  <p className="whitespace-pre-wrap break-words px-4 pb-3 text-[14.5px] leading-relaxed">{post.content}</p>
                )}
                <MediaGrid items={items} onImageClick={setPreviewUrl} />
                <div className="flex items-center gap-1 border-t border-border/60 px-2 py-1.5">
                  <motion.button whileTap={{ scale: 0.85 }} className={`post-action ${liked ? 'text-pink-500' : ''}`} onClick={() => like(post)}>
                    <Heart size={17} className={liked ? 'heart-beat fill-current' : ''} />
                    <span>{likes.length > 0 ? likes.length : ''} Like</span>
                  </motion.button>
                  <button
                    className="post-action"
                    onClick={() => {
                      setCommentBoxes((cb) => ({ ...cb, [post.id]: !cb[post.id] }))
                      setCommentText('')
                    }}
                  >
                    <MessageCircle size={17} />
                    <span>{post.comments.length > 0 ? post.comments.length : ''} Comment</span>
                  </button>
                  <button
                    className="post-action"
                    onClick={() => {
                      navigator.clipboard?.writeText(`${location.origin}/?post=${post.id}`).catch(() => {})
                      toast('Post link copied', 'success')
                    }}
                  >
                    <Link2 size={17} /> Share
                  </button>
                </div>
                <AnimatePresence>
                  {commentBoxes[post.id] && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden border-t border-border/60"
                    >
                      <div className="space-y-3 p-4">
                        {post.comments.map((c) => (
                          <motion.div key={c.id} initial={{ opacity: 0, x: -14 }} animate={{ opacity: 1, x: 0 }} className="flex gap-2.5">
                            <Avatar user={{ username: c.user.username, fullName: c.user.fullName, avatarColor: c.user.avatarColor, photoId: c.user.photoId }} size="xs" />
                            <div className="min-w-0 flex-1 rounded-2xl bg-muted/60 px-3.5 py-2">
                              <p className="text-xs font-bold">{displayName(c.user)}</p>
                              <p className="mt-0.5 whitespace-pre-wrap break-words text-[13px]">{c.text}</p>
                            </div>
                          </motion.div>
                        ))}
                        <div className="flex items-center gap-2 pt-1">
                          <Avatar user={me} size="xs" />
                          <input
                            className="input rounded-full py-2 text-[13px]"
                            placeholder="Write a comment…"
                            value={commentText}
                            onChange={(e) => setCommentText(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') addComment(post.id) }}
                            autoFocus
                          />
                          <motion.button whileTap={{ scale: 0.85 }} className="btn btn-primary btn-sm rounded-full" onClick={() => addComment(post.id)}>Send</motion.button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.article>
            )
          })}
        </AnimatePresence>
      )}

      <Lightbox url={previewUrl} onClose={() => setPreviewUrl(null)} />
      <Confirm
        open={!!deletePost} onClose={() => setDeletePost(null)}
        onConfirm={() => deletePost && removePost(deletePost)}
        message={`This post will be permanently deleted. This action cannot be undone.`}
      />
    </div>
  )
}
