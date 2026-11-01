import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionUser, canModerate } from '@/lib/auth'
import fs from 'fs'
import path from 'path'

const UPLOAD_DIR = path.join(process.cwd(), 'uploads')

// Media library — moderators can see all shared videos/images/files on the website
export async function GET(req: NextRequest) {
  const me = await getSessionUser()
  if (!me) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })
  if (!canModerate(me.role)) return NextResponse.json({ error: 'Moderator access required' }, { status: 403 })
  const kind = req.nextUrl.searchParams.get('kind') || ''
  const files = await db.file.findMany({
    where: kind ? { kind } : undefined,
    include: { uploader: { select: { username: true, fullName: true, role: true } } },
    orderBy: { createdAt: 'desc' },
    take: 500,
  })
  return NextResponse.json({ files })
}

export async function DELETE(req: NextRequest) {
  const me = await getSessionUser()
  if (!me) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })
  if (!canModerate(me.role)) return NextResponse.json({ error: 'Moderator access required' }, { status: 403 })
  const body = await req.json().catch(() => ({}))
  const id = String(body.id || '')
  const file = await db.file.findUnique({ where: { id } })
  if (file) {
    const p = path.join(UPLOAD_DIR, file.path)
    if (fs.existsSync(p)) fs.unlinkSync(p)
    await db.file.delete({ where: { id } })
  }
  return NextResponse.json({ ok: true })
}
