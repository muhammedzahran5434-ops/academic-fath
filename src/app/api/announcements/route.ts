import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionUser, canModerate } from '@/lib/auth'

export async function GET() {
  const me = await getSessionUser()
  if (!me) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })
  const announcements = await db.announcement.findMany({
    include: { author: { select: { username: true, fullName: true, role: true } } },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json({ announcements })
}

export async function POST(req: NextRequest) {
  const me = await getSessionUser()
  if (!me) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })
  if (!canModerate(me.role)) return NextResponse.json({ error: 'Moderator access required' }, { status: 403 })
  const body = await req.json().catch(() => ({}))
  const title = String(body.title || '').trim()
  const content = String(body.content || '').trim()
  const important = !!body.important
  if (!title || !content) return NextResponse.json({ error: 'Title and content are required' }, { status: 400 })
  const announcement = await db.announcement.create({
    data: { title, content, important, authorId: me.id },
    include: { author: { select: { username: true, fullName: true, role: true } } },
  })
  const users = await db.user.findMany({ where: { id: { not: me.id }, disabled: false }, select: { id: true } })
  for (const u of users) {
    await db.notification.create({
      data: { userId: u.id, text: `New announcement: ${title}`, type: important ? 'warning' : 'info' },
    })
  }
  return NextResponse.json({ announcement })
}

export async function DELETE(req: NextRequest) {
  const me = await getSessionUser()
  if (!me) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })
  if (!canModerate(me.role)) return NextResponse.json({ error: 'Moderator access required' }, { status: 403 })
  const body = await req.json().catch(() => ({}))
  await db.announcement.delete({ where: { id: String(body.id || '') } }).catch(() => {})
  return NextResponse.json({ ok: true })
}
