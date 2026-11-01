import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import {
  ensureSeed, verifyPassword, hashPassword, createSession, destroySession,
  getSessionUser, readSessionToken, toSafeUser, avatarColorFor,
} from '@/lib/auth'

export async function GET() {
  await ensureSeed()
  const user = await getSessionUser()
  // Hand the client its session token so it can use Bearer auth (cookie may
  // be blocked inside embedded preview iframes).
  const token = user ? await readSessionToken() : null
  return NextResponse.json({ user, token })
}

export async function POST(req: NextRequest) {
  await ensureSeed()
  const body = await req.json().catch(() => ({}))
  const action = body.action as string

  if (action === 'login') {
    const username = String(body.username || '').trim()
    const password = String(body.password || '').trim()
    if (!username || !password) {
      return NextResponse.json({ error: 'Enter username and password' }, { status: 400 })
    }
    const user = await db.user.findUnique({ where: { username } })
    if (!user) {
      return NextResponse.json({ error: 'Invalid credentials — user not found' }, { status: 401 })
    }
    if (!verifyPassword(password, user.password)) {
      return NextResponse.json({ error: 'Incorrect password' }, { status: 401 })
    }
    if (user.disabled) {
      return NextResponse.json({ error: 'Your account has been disabled by the administrator' }, { status: 403 })
    }
    await createSession(user.id)
    const token = await readSessionToken()
    await db.user.update({ where: { id: user.id }, data: { onlineAt: new Date() } })
    await db.notification.create({
      data: { userId: user.id, text: 'Welcome back! You signed in successfully.', type: 'success' },
    })
    return NextResponse.json({ user: toSafeUser(user), token })
  }

  if (action === 'logout') {
    await destroySession()
    return NextResponse.json({ ok: true })
  }

  if (action === 'change-password') {
    const me = await getSessionUser()
    if (!me) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })
    const current = String(body.currentPassword || '')
    const next = String(body.newPassword || '')
    if (next.length < 6) {
      return NextResponse.json({ error: 'New password must be at least 6 characters' }, { status: 400 })
    }
    const full = await db.user.findUnique({ where: { id: me.id } })
    if (!full || !verifyPassword(current, full.password)) {
      return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 })
    }
    await db.user.update({ where: { id: me.id }, data: { password: hashPassword(next) } })
    return NextResponse.json({ ok: true })
  }

  if (action === 'register') {
    // Self-registration: activate an existing admission number with a new password
    const username = String(body.username || '').trim()
    const password = String(body.password || '').trim()
    const fullName = String(body.fullName || '').trim()
    const user = await db.user.findUnique({ where: { username } })
    if (!user) {
      return NextResponse.json({ error: 'Your admission number is not registered. Ask the office.' }, { status: 404 })
    }
    if (user.role === 'admin') {
      return NextResponse.json({ error: 'Use the staff portal for administrator login' }, { status: 400 })
    }
    if (user.fullName && user.fullName.trim()) {
      return NextResponse.json({ error: 'Account already activated. Please sign in instead.' }, { status: 400 })
    }
    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 })
    }
    const updated = await db.user.update({
      where: { id: user.id },
      data: { password: hashPassword(password), fullName: fullName || user.fullName, avatarColor: user.avatarColor || avatarColorFor(user.username) },
    })
    await createSession(user.id)
    const token = await readSessionToken()
    return NextResponse.json({ user: toSafeUser(updated), token })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}
