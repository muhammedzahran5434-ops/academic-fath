'use client'

import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { AlertTriangle, Bell, BookOpen, Camera, CheckCircle2, Film, Hourglass, Megaphone, Medal, MessageCircle, Newspaper, Shield, Sparkles, Target, Trophy, Users, XCircle, Zap } from 'lucide-react'
import { api, useStore, displayName, fmtDate, isOnline, CAT_PTS, type Notif, type Announcement, type SafeUser } from './store'
import { Avatar, RoleBadge, SectionHead, StatTile, StaggerItem, StaggerList } from './ui-bits'
import type { View } from './app-shell'

type Stats = {
  stats: { userCount: number; postCount: number; storyCount: number; fileCount: number; achCount: number; pendingAch: number; disabledCount: number }
  leaderboard: { id: string; username: string; fullName: string | null; role: string; avatarColor: string | null; photoId: string | null; points: number }[]
}

export function Dashboard({ setView, onOpenProfile }: { setView: (v: View) => void; onOpenProfile: (username: string) => void }) {
  const { me, users, notifications, isMod, unread } = useStore()
  const [data, setData] = useState<Stats | null>(null)
  const [anns, setAnns] = useState<Announcement[]>([])

  useEffect(() => {
    api<Stats>('/api/stats').then(setData).catch(() => {})
    api<{ announcements: Announcement[] }>('/api/announcements').then((d) => setAnns(d.announcements.slice(0, 3))).catch(() => {})
  }, [])

  if (!me) return null
  const onlineMembers = users.filter((u) => u.id !== me.id && !u.disabled && isOnline(u))
  const myRank = data?.leaderboard.findIndex((u) => u.id === me.id)
  const hour = new Date().getHours()
  const greeting = hour < 5 ? 'Peaceful night' : hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  const quickActions: { label: string; icon: React.ReactNode; view: View; desc: string }[] = [
    { label: 'Share Post', icon: <Newspaper size={22} />, view: 'feed', desc: 'Text, photo, video' },
    { label: 'Add Status', icon: <Camera size={22} />, view: 'status', desc: '24h story' },
    { label: 'New Award', icon: <Trophy size={22} />, view: 'achievements', desc: 'Earn points' },
    { label: 'Open Chats', icon: <MessageCircle size={22} />, view: 'chat', desc: unread > 0 ? `${unread} unread` : 'Message mates' },
    { label: 'My Skills', icon: <Target size={22} />, view: 'profile', desc: 'Show talents' },
    ...(isMod ? [
      { label: 'Members', icon: <Shield size={22} />, view: 'members' as View, desc: 'Control panel' },
      { label: 'Media Vault', icon: <Film size={22} />, view: 'media' as View, desc: 'All videos & files' },
      { label: 'CCE Marks', icon: <BookOpen size={22} />, view: 'academic' as View, desc: 'Manage marks' },
    ] : []),
  ]

  return (
    <div>
      <SectionHead
        eyebrow={`${greeting}, ${displayName(me).split(' ')[0]}`}
        title={me.role === 'admin' ? 'Administrator Dashboard' : me.role === 'vip' ? 'VIP Dashboard' : 'Dashboard'}
        desc={isMod ? 'Full control at your fingertips — everything happening on campus.' : 'Your campus at a glance.'}
      />

      {/* stat tiles */}
      <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatTile label="Members" value={data?.stats.userCount ?? '—'} icon={<Users size={22} />} delay={0} sub={`${onlineMembers.length} online now`} />
        <StatTile label="Posts" value={data?.stats.postCount ?? '—'} icon={<Newspaper size={22} />} delay={0.06} accent="pink" />
        <StatTile label="Approved Awards" value={data?.stats.achCount ?? '—'} icon={<Trophy size={22} />} delay={0.12} accent="amber" />
        <StatTile
          label={me.role === 'admin' ? 'Pending Approvals' : 'My Rank'}
          value={me.role === 'admin' ? (data?.stats.pendingAch ?? 0) : myRank !== undefined && myRank > -1 ? `#${myRank + 1}` : '—'}
          icon={me.role === 'admin' ? <Hourglass size={22} /> : <Medal size={22} />}
          delay={0.18}
          accent="teal"
          sub={isMod && (data?.stats.pendingAch ?? 0) > 0 ? 'tap Awards to review' : undefined}
        />
      </div>

      {/* quick actions */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mb-8">
        <h3 className="mb-3.5 font-display flex items-center gap-2 text-lg font-bold"><Zap size={18} className="text-amber-500" /> Quick actions</h3>
        <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:grid-cols-4">
          {quickActions.map((q, i) => (
            <motion.button
              key={q.label}
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.25 + i * 0.05 }}
              whileHover={{ y: -4, scale: 1.03 }}
              whileTap={{ scale: 0.96 }}
              className="quick-action group"
              onClick={() => setView(q.view)}
            >
              <span className="quick-icon group-hover:rotate-12 flex items-center justify-center text-violet-600 dark:text-violet-400">{q.icon}</span>
              <span className="mt-2.5 block text-left">
                <span className="block text-sm font-bold">{q.label}</span>
                <span className="block text-[11px] text-muted-foreground">{q.desc}</span>
              </span>
            </motion.button>
          ))}
        </div>
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* announcements */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
          <div className="mb-3.5 flex items-center justify-between">
            <h3 className="font-display flex items-center gap-2 text-lg font-bold"><Megaphone size={18} className="text-pink-500" /> Notice board</h3>
            <button className="link-btn text-xs" onClick={() => setView('announcements')}>View all</button>
          </div>
          <div className="space-y-3">
            {anns.length === 0 && <p className="card text-sm text-muted-foreground">No announcements yet.</p>}
            {anns.map((a, i) => (
              <motion.div
                key={a.id}
                initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 + i * 0.08 }}
                whileHover={{ x: 4 }}
                className={`card cursor-pointer py-4 ${a.important ? 'border-l-4 border-l-amber-500' : ''}`}
                onClick={() => setView('announcements')}
              >
                <p className="text-sm font-bold">{a.title}</p>
                <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{a.content}</p>
                <p className="mt-1.5 text-[10.5px] text-muted-foreground">{fmtDate(a.createdAt)}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* online now + recent notifications */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.35 }}>
          <div className="mb-3.5 flex items-center justify-between">
            <h3 className="font-display flex items-center gap-2 text-lg font-bold"><span className="inline-block h-2.5 w-2.5 rounded-full bg-emerald-500 status-pulse" /> Online now <span className="badge-cat">{onlineMembers.length}</span></h3>
          </div>
          <div className="card mb-5 max-h-52 space-y-2.5 overflow-y-auto">
            {onlineMembers.length === 0 && <p className="py-4 text-center text-sm text-muted-foreground">Nobody else is online right now</p>}
            {onlineMembers.map((u) => (
              <motion.button
                key={u.id}
                initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                whileHover={{ scale: 1.02, x: 3 }}
                className="flex w-full items-center gap-3 rounded-xl p-2 text-left hover:bg-accent/10"
                onClick={() => onOpenProfile(u.username)}
              >
                <Avatar user={u} size="sm" showStatus />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold">{displayName(u)} <RoleBadge role={u.role} /></p>
                  <p className="text-xs text-muted-foreground">#{u.username}</p>
                </div>
              </motion.button>
            ))}
          </div>

          <h3 className="mb-3.5 font-display flex items-center gap-2 text-lg font-bold"><Bell size={18} className="text-violet-500" /> Latest activity</h3>
          <div className="card max-h-52 space-y-2 overflow-y-auto">
            {notifications.slice(0, 6).length === 0 && <p className="py-4 text-center text-sm text-muted-foreground">No activity yet — start exploring!</p>}
            {notifications.slice(0, 6).map((n: Notif, i) => (
              <motion.p
                key={n.id}
                initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}
                className="flex items-start gap-2 rounded-lg px-2 py-1.5 text-xs leading-snug"
              >
                <span className="mt-0.5">
                  {n.type === 'success' ? <CheckCircle2 size={13} className="text-emerald-500" /> : n.type === 'error' ? <XCircle size={13} className="text-red-500" /> : n.type === 'warning' ? <AlertTriangle size={13} className="text-amber-500" /> : <Sparkles size={13} className="text-violet-500" />}
                </span>
                <span className="flex-1">{n.text}</span>
              </motion.p>
            ))}
          </div>
        </motion.div>
      </div>

      {/* leaderboard preview */}
      {data && data.leaderboard.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="mt-8">
          <div className="mb-3.5 flex items-center justify-between">
            <h3 className="font-display text-lg font-bold">Leaderboard top 5</h3>
            <button className="link-btn text-xs" onClick={() => setView('leaderboard')}>Full board</button>
          </div>
          <StaggerList className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {data.leaderboard.slice(0, 5).map((u, i) => (
              <StaggerItem key={u.id}>
                <motion.div
                  whileHover={{ y: -4 }}
                  className={`rounded-2xl border p-4 text-center ${i === 0 ? 'border-amber-400/60 bg-amber-500/5 podium-glow' : 'border-border/60 bg-card'}`}
                >
                  <p className="mb-1.5 flex items-center justify-center font-display text-xl font-bold text-muted-foreground">
                    {i === 0 ? <Trophy size={20} className="text-amber-500 crown-bounce" /> : i === 1 ? <Medal size={18} className="text-slate-400" /> : i === 2 ? <Medal size={18} className="text-orange-400" /> : <span>#{i + 1}</span>}
                  </p>
                  <div className="mx-auto w-fit"><Avatar user={u as SafeUser} size="sm" /></div>
                  <p className="mt-2 truncate text-xs font-bold">{displayName(u)}</p>
                  <p className="text-[11px] font-bold text-violet-600 dark:text-violet-400">{u.points} pts</p>
                </motion.div>
              </StaggerItem>
            ))}
          </StaggerList>
        </motion.div>
      )}
    </div>
  )
}
