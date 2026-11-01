import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionUser } from '@/lib/auth'

export async function GET() {
  const me = await getSessionUser()
  if (!me) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })
  const notifications = await db.notification.findMany({
    where: { userId: me.id },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })
  return NextResponse.json({ notifications, unread: notifications.filter((n) => !n.read).length })
}

export async function PATCH(req: NextRequest) {
  const me = await getSessionUser()
  if (!me) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })
  const body = await req.json().catch(() => ({}))
  if (body.id) {
    await db.notification.updateMany({ where: { id: String(body.id), userId: me.id }, data: { read: true } })
  } else {
    await db.notification.updateMany({ where: { userId: me.id }, data: { read: true } })
  }
  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest) {
  const me = await getSessionUser()
  if (!me) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })
  await db.notification.deleteMany({ where: { userId: me.id } })
  return NextResponse.json({ ok: true })
}
