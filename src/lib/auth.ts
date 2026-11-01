import { db } from '@/lib/db'
import { cookies, headers } from 'next/headers'
import crypto from 'crypto'

export const SESSION_COOKIE = 'fath_session'

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex')
  const hash = crypto.scryptSync(password, salt, 64).toString('hex')
  return `${salt}:${hash}`
}

export function verifyPassword(password: string, stored: string): boolean {
  try {
    const [salt, hash] = stored.split(':')
    if (!salt || !hash) return false
    const test = crypto.scryptSync(password, salt, 64).toString('hex')
    return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(test, 'hex'))
  } catch {
    return false
  }
}

export async function createSession(userId: string): Promise<string> {
  const token = crypto.randomBytes(32).toString('hex')
  await db.session.create({ data: { token, userId } })
  // Cookie works when the site is a top-level page. Inside embedded preview
  // iframes browsers may block it, so the client also keeps a Bearer token.
  // When served over https through a proxy, allow cross-site cookie too.
  try {
    const h = await headers()
    const isHttps = (h.get('x-forwarded-proto') || '').includes('https')
    const jar = await cookies()
    jar.set(SESSION_COOKIE, token, {
      httpOnly: true,
      sameSite: isHttps ? 'none' : 'lax',
      secure: isHttps,
      path: '/',
      maxAge: 60 * 60 * 24 * 30,
    })
  } catch {}
  return token
}

export async function destroySession() {
  // Works for both cookie sessions and Bearer-token sessions.
  const token = await readSessionToken()
  if (token) await db.session.deleteMany({ where: { token } }).catch(() => {})
  try {
    const jar = await cookies()
    jar.delete(SESSION_COOKIE)
  } catch {}
}

export type SafeUser = {
  id: string
  username: string
  role: string
  disabled: boolean
  fullName: string | null
  dob: string | null
  klass: string | null
  guardian: string | null
  phone: string | null
  address: string | null
  bio: string | null
  photoId: string | null
  avatarColor: string | null
  onlineAt: string | null
  vipSince: string | null
  createdAt: string
}

export function toSafeUser(u: {
  id: string; username: string; role: string; disabled: boolean
  fullName: string | null; dob: string | null; klass: string | null
  guardian: string | null; phone: string | null; address: string | null
  bio: string | null; photoId: string | null; avatarColor: string | null
  onlineAt: Date | null; vipSince: Date | null; createdAt: Date
}): SafeUser {
  return {
    id: u.id, username: u.username, role: u.role, disabled: u.disabled,
    fullName: u.fullName, dob: u.dob, klass: u.klass, guardian: u.guardian,
    phone: u.phone, address: u.address, bio: u.bio, photoId: u.photoId,
    avatarColor: u.avatarColor,
    onlineAt: u.onlineAt ? u.onlineAt.toISOString() : null,
    vipSince: u.vipSince ? u.vipSince.toISOString() : null,
    createdAt: u.createdAt.toISOString(),
  }
}

export async function readSessionToken(): Promise<string | null> {
  // 1) Authorization: Bearer <token>  (works everywhere, incl. iframes that
  //    block cookies)   2) session cookie (top-level browsing)
  try {
    const h = await headers()
    const auth = h.get('authorization') || ''
    if (auth.toLowerCase().startsWith('bearer ')) {
      const t = auth.slice(7).trim()
      if (t) return t
    }
  } catch {}
  try {
    const jar = await cookies()
    return jar.get(SESSION_COOKIE)?.value || null
  } catch {}
  return null
}

export async function getSessionUser(): Promise<SafeUser | null> {
  const token = await readSessionToken()
  if (!token) return null
  const session = await db.session.findUnique({
    where: { token },
    include: { user: true },
  })
  if (!session || session.user.disabled) return null
  return toSafeUser(session.user)
}

export function canModerate(role: string): boolean {
  return role === 'admin' || role === 'vip'
}

export function avatarColorFor(id: string): string {
  const colors = ['#7c3aed', '#0d9488', '#c026d3', '#e11d48', '#059669', '#d97706', '#dc2626', '#0891b2', '#9333ea', '#4d7c0f']
  let h = 0
  for (let i = 0; i < id.length; i++) h = id.charCodeAt(i) + ((h << 5) - h)
  return colors[Math.abs(h) % colors.length]
}

export async function ensureSeed() {
  const count = await db.user.count()
  if (count > 0) return
  // Seed admin
  await db.user.create({
    data: {
      username: 'ADMINISTRATOR',
      password: hashPassword('Anshif@29'),
      role: 'admin',
      fullName: 'Administrator',
      avatarColor: '#7c3aed',
    },
  })
  // Seed members with default admission numbers
  const adnos = ['791','806','807','0808','089','810','811','812','813','814','815','816','817','818','820','821','822','823','824','825','826','827','828','829','830','831','832','833','834','835','836','849']
  for (const adno of adnos) {
    await db.user.create({
      data: {
        username: adno,
        password: hashPassword(`${adno}@fath`),
        role: 'member',
        avatarColor: avatarColorFor(adno),
      },
    })
  }
  await db.announcement.create({
    data: {
      title: 'Welcome to FATH MATES',
      content: 'Complete your profile to get started. Add your skills and achievements to climb the leaderboard!',
      important: true,
      authorId: (await db.user.findUnique({ where: { username: 'ADMINISTRATOR' } }))!.id,
    },
  })
  const subjects = [
    { name: 'Quran', max: 50 }, { name: 'Arabic', max: 50 }, { name: 'Islamic Studies', max: 50 },
    { name: 'Malayalam', max: 50 }, { name: 'English', max: 50 }, { name: 'Mathematics', max: 50 },
  ]
  for (const s of subjects) await db.subject.create({ data: s })
}
