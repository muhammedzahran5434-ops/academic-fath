import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionUser, canModerate } from '@/lib/auth'

const CAT_PTS: Record<string, number> = { Academic: 15, Sports: 12, Arts: 10, Community: 10, Religious: 10, Other: 8 }

export async function GET() {
  const me = await getSessionUser()
  if (!me) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })
  const achievements = await db.achievement.findMany({
    include: { user: { select: { id: true, username: true, fullName: true, role: true, photoId: true, avatarColor: true } } },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json({ achievements })
}

export async function POST(req: NextRequest) {
  const me = await getSessionUser()
  if (!me) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })
  const body = await req.json().catch(() => ({}))
  const title = String(body.title || '').trim()
  const category = String(body.category || 'Other')
  const description = String(body.description || '').trim()
  const mediaId = body.mediaId ? String(body.mediaId) : null
  if (!title) return NextResponse.json({ error: 'Enter achievement title' }, { status: 400 })
  const ach = await db.achievement.create({
    data: {
      userId: me.id, title, category, description, mediaId,
      points: CAT_PTS[category] || 8,
      status: canModerate(me.role) ? 'approved' : 'pending',
      decidedAt: canModerate(me.role) ? new Date() : null,
    },
  })
  // notify moderators
  const mods = await db.user.findMany({ where: { role: { in: ['admin', 'vip'] } } })
  for (const m of mods) {
    if (m.id !== me.id) {
      await db.notification.create({
        data: { userId: m.id, text: `${me.fullName || me.username} submitted achievement "${title}" for approval.`, type: 'info' },
      })
    }
  }
  return NextResponse.json({ achievement: ach })
}

export async function PATCH(req: NextRequest) {
  const me = await getSessionUser()
  if (!me) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })
  if (!canModerate(me.role)) return NextResponse.json({ error: 'Moderator access required' }, { status: 403 })
  const body = await req.json().catch(() => ({}))
  const id = String(body.id || '')
  const status = body.status as string
  if (!['approved', 'rejected', 'pending'].includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
  }
  const note = String(body.note || '').trim() || null
  const ach = await db.achievement.update({
    where: { id },
    data: { status, note, decidedAt: new Date() },
    include: { user: true },
  })
  await db.notification.create({
    data: {
      userId: ach.userId,
      text: status === 'approved'
        ? `Your achievement "${ach.title}" was approved (+${ach.points} points)`
        : `Your achievement "${ach.title}" was ${status}${note ? ` — ${note}` : ''}`,
      type: status === 'approved' ? 'success' : 'warning',
    },
  })
  return NextResponse.json({ achievement: ach })
}

export async function DELETE(req: NextRequest) {
  const me = await getSessionUser()
  if (!me) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })
  const body = await req.json().catch(() => ({}))
  const id = String(body.id || '')
  const ach = await db.achievement.findUnique({ where: { id } })
  if (!ach) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (ach.userId !== me.id && !canModerate(me.role)) {
    return NextResponse.json({ error: 'Not allowed' }, { status: 403 })
  }
  await db.achievement.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
