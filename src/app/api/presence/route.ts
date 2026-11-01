import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionUser } from '@/lib/auth'

export async function POST() {
  const me = await getSessionUser()
  if (!me) return NextResponse.json({ ok: false })
  await db.user.update({ where: { id: me.id }, data: { onlineAt: new Date() } }).catch(() => {})
  return NextResponse.json({ ok: true })
}
