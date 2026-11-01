'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, BarChart3, Camera, Eye, EyeOff, Gem, Image as ImageIcon, MessageCircle, Moon, Sparkles, Sun, Trophy } from 'lucide-react'
import { api, saveToken, useStore, type SafeUser } from './store'

/* ═══════════════ LANDING ═══════════════ */
export function Landing({ onEnter }: { onEnter: () => void }) {
  const { theme, toggleTheme } = useStore()
  const feats = [
    { icon: MessageCircle, title: 'Real-time Chat', desc: 'Message any member instantly with replies and media sharing.' },
    { icon: Camera, title: 'Status & Stories', desc: 'Share 24-hour moments with text, photos and videos — just like WhatsApp.' },
    { icon: ImageIcon, title: 'Media Sharing', desc: 'Share images, videos, audio and files up to 100MB with everyone.' },
    { icon: Trophy, title: 'Achievements', desc: 'Earn points for academic, sports, arts and religious achievements.' },
    { icon: BarChart3, title: 'Leaderboard', desc: 'Climb the college leaderboard as your achievements get approved.' },
    { icon: Gem, title: 'VIP Powers', desc: 'Administrators can promote members to VIP with full moderator powers.' },
  ]
  const stats = [
    { n: '32+', l: 'Members' },
    { n: '100+', l: 'Features' },
    { n: '60+', l: 'Animations' },
    { n: '24h', l: 'Status Stories' },
  ]
  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-0 landing-glow" />
      {/* header */}
      <motion.header
        initial={{ y: -70, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 120, damping: 18 }}
        className="sticky top-0 z-40 border-b border-border/60 bg-background/75 backdrop-blur-xl"
      >
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
          <div className="flex items-center gap-3">
            <div className="brand-mark">FM</div>
            <div>
              <p className="font-display text-base font-bold leading-none tracking-tight">FATH MATES</p>
              <p className="mt-1 text-[9.5px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Darul Hasanath Islamic College</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="icon-btn" onClick={toggleTheme} title="Toggle theme">{theme === 'light' ? <Moon size={17} /> : <Sun size={17} />}</button>
            <button className="btn btn-primary" onClick={onEnter}>Sign In</button>
          </div>
        </div>
      </motion.header>

      {/* hero */}
      <section className="relative mx-auto max-w-6xl px-5 pb-20 pt-16 md:pt-24">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <motion.div initial={{ opacity: 0, x: -40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}>
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.15, type: 'spring', stiffness: 200 }}
              className="mb-6 inline-flex items-center gap-2 rounded-full border border-pink-300/40 bg-pink-500/10 px-4 py-1.5 text-xs font-bold text-pink-600 dark:text-pink-400"
            >
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-pink-500 to-violet-600 text-white"><Sparkles size={11} /></span>
              The official campus network
            </motion.div>
            <h1 className="font-display text-5xl font-bold leading-[1.04] tracking-tight md:text-7xl">
              Where our campus <em className="hero-em shine-text">connects</em>
            </h1>
            <p className="mt-6 max-w-lg text-base leading-relaxed text-muted-foreground md:text-lg">
              FATH MATES is the private social network of Darul Hasanath Islamic College — chat, share moments, celebrate achievements and grow together as one family.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }} className="btn btn-primary btn-lg glow-pulse" onClick={onEnter}>
                Sign In to your account
              </motion.button>
            </div>
            <div className="mt-12 grid max-w-md grid-cols-2 gap-6 border-t border-border pt-8 sm:grid-cols-4">
              {stats.map((s, i) => (
                <motion.div key={s.l} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 + i * 0.1 }}>
                  <p className="font-display text-3xl font-bold text-violet-600 dark:text-violet-400">{s.n}</p>
                  <p className="mt-1 text-xs font-semibold text-muted-foreground">{s.l}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 50, rotate: 2 }} animate={{ opacity: 1, y: 0, rotate: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="relative hidden lg:block"
          >
            <div className="hero-card float-anim">
              <div className="flex items-center gap-3 border-b border-border/60 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-pink-500 font-bold text-white">79</div>
                <div className="flex-1">
                  <p className="text-sm font-bold">Campus Feed</p>
                  <p className="text-xs text-muted-foreground">Everything happening now</p>
                </div>
                <span className="badge-live">● LIVE</span>
              </div>
              <div className="space-y-3 p-4">
                {[
                  { t: 'Ahamed won first prize in Quran recitation!', l: '+15 pts · Academic' },
                  { t: 'New photos from the annual day celebration', l: '12 reactions' },
                  { t: 'Study group for Arabic exam — join us!', l: '8 replies' },
                ].map((r, i) => (
                  <motion.div key={i} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.6 + i * 0.25 }} className="rounded-xl bg-muted/60 p-3 text-sm">
                    <p className="font-semibold">{r.t}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{r.l}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* features */}
      <section className="mx-auto max-w-6xl px-5 py-16">
        <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mx-auto mb-12 max-w-xl text-center">
          <p className="eyebrow justify-center">Features</p>
          <h2 className="font-display text-4xl font-bold tracking-tight">Everything in one place</h2>
          <p className="mt-3 text-muted-foreground">A complete campus social platform built for our college family.</p>
        </motion.div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {feats.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              transition={{ delay: i * 0.08, type: 'spring', stiffness: 180, damping: 20 }}
              whileHover={{ y: -6, scale: 1.02 }}
              className="feat-card"
            >
              <div className="feat-icon flex items-center justify-center text-violet-600 dark:text-violet-400"><f.icon size={26} /></div>
              <h3 className="font-display text-lg font-bold">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="final-cta-section">
        <div className="mx-auto max-w-2xl px-5 py-24 text-center">
          <motion.h2 initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} className="font-display text-4xl font-bold tracking-tight md:text-5xl">
            Ready to join your mates?
          </motion.h2>
          <motion.p initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.15 }} className="mt-4 text-muted-foreground">
            Sign in with your admission number, or use the staff portal if you are the administrator.
          </motion.p>
          <motion.button
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.25 }}
            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}
            className="btn btn-primary btn-lg mt-8 glow-pulse" onClick={onEnter}
          >
            Get Started — It&apos;s Free
          </motion.button>
        </div>
      </section>

      {/* footer */}
      <footer className="border-t border-border bg-muted/30 py-10 pb-24 text-center text-sm text-muted-foreground md:pb-10">
        <p className="font-display font-bold text-foreground">FATH MATES</p>
        <p className="mt-1">Darul Hasanath Islamic College · Built for our campus family</p>
      </footer>
    </div>
  )
}

/* ═══════════════ AUTH ═══════════════ */
export function AuthPage({ onBack, onSignedIn }: { onBack: () => void; onSignedIn: (u: SafeUser) => void }) {
  const { toast, theme, toggleTheme } = useStore()
  const [tab, setTab] = useState<'member' | 'staff'>('member')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const submit = async (e?: React.FormEvent) => {
    e?.preventDefault()
    setError('')
    if (!username.trim()) { setError('Enter your username'); return }
    if (!password.trim()) { setError('Enter your password'); return }
    setBusy(true)
    try {
      const d = await api<{ user: SafeUser; token?: string | null }>('/api/auth', {
        method: 'POST',
        body: JSON.stringify({ action: 'login', username: username.trim(), password }),
      })
      saveToken(d.token)
      toast(`Welcome back, ${d.user.fullName || d.user.username}!`, 'success')
      onSignedIn(d.user)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign in failed')
    } finally {
      setBusy(false)
    }
  }

  const switchTab = (t: 'member' | 'staff') => {
    setTab(t)
    setError('')
    setUsername('')
    setPassword('')
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* left aside */}
      <div className="relative hidden flex-col overflow-hidden bg-gradient-to-br from-violet-700 via-purple-700 to-pink-600 p-12 text-white lg:flex">
        <div className="pointer-events-none absolute -right-40 -top-40 h-[560px] w-[560px] rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-52 -left-32 h-[480px] w-[480px] rounded-full bg-pink-400/20 blur-3xl" />
        <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }} className="relative z-10 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/20 font-display text-lg font-bold backdrop-blur">FM</div>
          <div>
            <p className="font-display text-lg font-bold leading-none">FATH MATES</p>
            <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.2em] text-white/70">Darul Hasanath</p>
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.7 }} className="relative z-10 mt-auto max-w-md">
          <h2 className="font-display text-5xl font-bold leading-[1.08] tracking-tight">
            Your campus, <em className="text-amber-300">united</em> in one place.
          </h2>
          <p className="mt-6 text-base leading-relaxed text-white/85">
            Chat with mates, share your achievements, post statuses and celebrate every win together — securely, privately, only for our college family.
          </p>
          <div className="mt-12 grid grid-cols-2 gap-8 border-t border-white/15 pt-8">
            <div>
              <p className="font-display text-3xl font-bold text-amber-300">32+</p>
              <p className="mt-1 text-[11px] font-bold uppercase tracking-widest text-white/60">Members</p>
            </div>
            <div>
              <p className="font-display text-3xl font-bold text-amber-300">100+</p>
              <p className="mt-1 text-[11px] font-bold uppercase tracking-widest text-white/60">Features</p>
            </div>
          </div>
        </motion.div>
        <p className="relative z-10 mt-12 text-xs text-white/50">© 2026 Darul Hasanath Islamic College</p>
      </div>

      {/* right form */}
      <div className="flex items-center justify-center bg-background p-6 pb-24 md:p-12 md:pb-12">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }} className="w-full max-w-md">
          <div className="mb-8 flex items-center justify-between">
            <button className="link-btn inline-flex items-center gap-1.5" onClick={onBack}>← Back to home</button>
            <button className="icon-btn" onClick={toggleTheme}>{theme === 'light' ? <Moon size={17} /> : <Sun size={17} />}</button>
          </div>
          <p className="eyebrow">Welcome</p>
          <h1 className="font-display text-3xl font-bold tracking-tight">
            {tab === 'staff' ? 'Staff Portal' : 'Sign In'}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {tab === 'staff' ? 'Administrator sign in' : 'Use your admission number to sign in'}
          </p>

          <div className="mt-7 flex gap-1 rounded-xl border border-border bg-muted p-1">
            {([['member', 'Member'], ['staff', 'Staff']] as const).map(([id, label]) => (
              <button
                key={id}
                className={`relative flex-1 rounded-lg px-3 py-2.5 text-[13px] font-bold transition-colors ${tab === id ? 'text-violet-600 dark:text-violet-400' : 'text-muted-foreground hover:text-foreground'}`}
                onClick={() => switchTab(id)}
              >
                {tab === id && <motion.span layoutId="authTabPill" className="absolute inset-0 rounded-lg bg-background shadow-sm" transition={{ type: 'spring', stiffness: 380, damping: 32 }} />}
                <span className="relative z-10">{label}</span>
              </button>
            ))}
          </div>

          <form onSubmit={submit} className="mt-7 space-y-4">
            <div>
              <label className="label">{tab === 'staff' ? 'Username' : 'Admission number'}</label>
              <input
                className="input" placeholder={tab === 'staff' ? 'ADMINISTRATOR' : 'e.g. 791'}
                value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username"
              />
            </div>
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input
                  className="input pr-12" type={showPass ? 'text' : 'password'}
                  placeholder="Your password"
                  value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password"
                />
                <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" onClick={() => setShowPass(!showPass)}>
                  {showPass ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            <AnimatePresence>
              {error && (
                <motion.div initial={{ opacity: 0, y: -8, height: 0 }} animate={{ opacity: 1, y: 0, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                  <div className="flex items-center gap-2 rounded-xl border border-red-300/50 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-600 dark:text-red-400">
                    <AlertTriangle size={16} className="shrink-0" /> {error}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <motion.button
              whileHover={{ scale: busy ? 1 : 1.01 }} whileTap={{ scale: busy ? 1 : 0.98 }}
              type="submit" disabled={busy} className="btn btn-primary btn-lg w-full"
            >
              {busy ? <><span className="spinner" /> Signing in…</> : 'Sign In'}
            </motion.button>
          </form>

          <div className="mt-8 rounded-xl border border-sky-300/40 bg-sky-500/5 p-4 text-xs leading-relaxed text-muted-foreground">
            <p className="mb-1.5 font-bold text-foreground">Login help</p>
            {tab === 'staff' ? (
              <p>Administrator signs in with username <b>ADMINISTRATOR</b> and the office password.</p>
            ) : (
              <p>Your username is your admission number. Default password is <b>youradno@fath</b> (e.g. <b>791@fath</b>). You can change your password anytime from Settings.</p>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  )
}
