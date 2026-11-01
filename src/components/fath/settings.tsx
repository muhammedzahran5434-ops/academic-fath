'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Eye, EyeOff, KeyRound, LogOut, Moon, Palette, Sun, User } from 'lucide-react'
import { api, useStore } from './store'
import { SectionHead } from './ui-bits'

export function Settings({ onSignOut }: { onSignOut: () => void }) {
  const { me, toast, theme, toggleTheme, isAdmin, isMod } = useStore()
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [busy, setBusy] = useState(false)
  const [show, setShow] = useState(false)

  if (!me) return null

  const changePassword = async () => {
    if (!current.trim()) { toast('Enter your current password', 'warning'); return }
    if (next.length < 6) { toast('New password must be at least 6 characters', 'warning'); return }
    if (next !== confirm) { toast('New passwords do not match', 'warning'); return }
    setBusy(true)
    try {
      await api('/api/auth', { method: 'POST', body: JSON.stringify({ action: 'change-password', currentPassword: current, newPassword: next }) })
      toast('Password changed successfully!', 'success')
      setCurrent(''); setNext(''); setConfirm('')
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Failed to change password', 'error')
    } finally { setBusy(false) }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <SectionHead eyebrow="Preferences" title="Settings" desc="Manage your account security, appearance and preferences." />

      {/* password change */}
      <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card mb-5">
        <div className="mb-4 flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-500/15 text-violet-600 dark:text-violet-400"><KeyRound size={20} /></span>
          <div>
            <h3 className="font-display text-lg font-bold">Change Password</h3>
            <p className="text-xs text-muted-foreground">Update your password anytime — strongly recommended after first login.</p>
          </div>
        </div>
        <div className="space-y-3.5">
          <div>
            <label className="label">Current password</label>
            <div className="relative">
              <input className="input pr-12" type={show ? 'text' : 'password'} value={current} onChange={(e) => setCurrent(e.target.value)} placeholder="Your current password" autoComplete="current-password" />
              <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" onClick={() => setShow(!show)}>{show ? <EyeOff size={17} /> : <Eye size={17} />}</button>
            </div>
          </div>
          <div className="grid gap-3.5 sm:grid-cols-2">
            <div>
              <label className="label">New password</label>
              <input className="input" type={show ? 'text' : 'password'} value={next} onChange={(e) => setNext(e.target.value)} placeholder="Min 6 characters" autoComplete="new-password" />
            </div>
            <div>
              <label className="label">Confirm new password</label>
              <input className="input" type={show ? 'text' : 'password'} value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Repeat new password" autoComplete="new-password" />
            </div>
          </div>
          {/* strength meter */}
          {next && (
            <div className="flex items-center gap-2">
              {(() => {
                let score = 0
                if (next.length >= 6) score++
                if (next.length >= 10) score++
                if (/[A-Z]/.test(next) && /[a-z]/.test(next)) score++
                if (/\d/.test(next)) score++
                if (/[^A-Za-z0-9]/.test(next)) score++
                const labels = ['Very weak', 'Weak', 'Okay', 'Good', 'Strong', 'Excellent']
                const colors = ['bg-red-500', 'bg-orange-500', 'bg-amber-500', 'bg-lime-500', 'bg-emerald-500', 'bg-emerald-600']
                return (
                  <>
                    <div className="flex flex-1 gap-1">
                      {[0, 1, 2, 3, 4].map((i) => (
                        <div key={i} className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${i < score ? colors[score] : 'bg-muted'}`} />
                      ))}
                    </div>
                    <span className="text-xs font-bold text-muted-foreground">{labels[score]}</span>
                  </>
                )
              })()}
            </div>
          )}
          <motion.button
            whileTap={{ scale: 0.97 }}
            className="btn btn-primary w-full" onClick={changePassword} disabled={busy}
          >
            {busy ? <><span className="spinner" /> Updating…</> : 'Update Password'}
          </motion.button>
        </div>
      </motion.section>

      {/* appearance */}
      <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className="card mb-5">
        <div className="mb-4 flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-pink-500/15 text-pink-600 dark:text-pink-400"><Palette size={20} /></span>
          <div>
            <h3 className="font-display text-lg font-bold">Appearance</h3>
            <p className="text-xs text-muted-foreground">Switch between light and dark mode.</p>
          </div>
        </div>
        <button className="btn btn-secondary w-full justify-between" onClick={toggleTheme}>
          <span className="flex items-center gap-2">{theme === 'light' ? <Sun size={15} /> : <Moon size={15} />}{theme === 'light' ? 'Light mode active' : 'Dark mode active'}</span>
          <span className="text-sm text-muted-foreground">Tap to switch →</span>
        </button>
      </motion.section>

      {/* account info */}
      <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }} className="card mb-5">
        <div className="mb-4 flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-500/15 text-sky-600 dark:text-sky-400"><User size={20} /></span>
          <div>
            <h3 className="font-display text-lg font-bold">Account</h3>
            <p className="text-xs text-muted-foreground">Your account information.</p>
          </div>
        </div>
        <div className="space-y-2 text-sm">
          <InfoRow label="Username" value={`#${me.username}`} />
          <InfoRow label="Name" value={me.fullName || 'Not set'} />
          <InfoRow label="Role" value={me.role === 'admin' ? 'Administrator' : me.role === 'vip' ? 'VIP Member' : 'Member'} />
          <InfoRow label="Status" value={me.disabled ? 'Disabled' : 'Active'} />
        </div>
        {isMod && (
          <div className="mt-4 rounded-xl border border-violet-400/40 bg-violet-500/5 p-3.5 text-xs leading-relaxed text-muted-foreground">
            {isAdmin
              ? 'You are the Administrator — you have full control over every member, media and setting on this website.'
              : 'You are a VIP member — you can approve achievements, post announcements, manage members and view all shared media, just like the administrator.'}
          </div>
        )}
      </motion.section>

      {/* danger zone */}
      <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.24 }} className="card border-red-400/40">
        <div className="mb-4 flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-red-500/15 text-red-600 dark:text-red-400"><LogOut size={20} /></span>
          <div>
            <h3 className="font-display text-lg font-bold">Session</h3>
            <p className="text-xs text-muted-foreground">Sign out of this device.</p>
          </div>
        </div>
        <button className="btn btn-danger w-full" onClick={onSignOut}>Sign Out</button>
      </motion.section>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-xl bg-muted/50 px-3.5 py-2.5">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-bold">{value}</span>
    </div>
  )
}
