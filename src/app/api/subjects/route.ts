import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionUser, canModerate } from '@/lib/auth'

export async function GET() {
  const me = await getSessionUser()
  if (!me) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })
  const subjects = await db.subject.findMany({ orderBy: { name: 'asc' } })
  const marks = await db.cceMark.findMany({
    include: { user: { select: { username: true, fullName: true } } },
  })
  return NextResponse.json({ subjects, marks })
}

export async function POST(req: NextRequest) {
  const me = await getSessionUser()
  if (!me) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })
  const body = await req.json().catch(() => ({}))
  const action = body.action as string

  if (action === 'add-subject') {
    if (!canModerate(me.role)) return NextResponse.json({ error: 'Moderator access required' }, { status: 403 })
    const name = String(body.name || '').trim()
    const max = Number(body.max) || 50
    if (!name) return NextResponse.json({ error: 'Enter subject name' }, { status: 400 })
    const subject = await db.subject.create({ data: { name, max } })
    return NextResponse.json({ subject })
  }
  if (action === 'remove-subject') {
    if (!canModerate(me.role)) return NextResponse.json({ error: 'Moderator access required' }, { status: 403 })
    await db.subject.delete({ where: { id: String(body.subjectId || '') } }).catch(() => {})
    return NextResponse.json({ ok: true })
  }
  if (action === 'save-marks') {
    if (!canModerate(me.role)) return NextResponse.json({ error: 'Moderator access required' }, { status: 403 })
    const userId = String(body.userId || '')
    const subjectId = String(body.subjectId || '')
    const marks = body.marks === '' || body.marks === null ? null : Number(body.marks)
    if (marks !== null && (isNaN(marks) || marks < 0)) {
      return NextResponse.json({ error: 'Invalid marks' }, { status: 400 })
    }
    const existing = await db.cceMark.findUnique({
      where: { userId_subjectId: { userId, subjectId } },
    })
    if (existing) {
      await db.cceMark.update({ where: { id: existing.id }, data: { marks } })
    } else {
      await db.cceMark.create({ data: { userId, subjectId, marks } })
    }
    await db.notification.create({
      data: { userId, text: 'Your academic marks were updated by a moderator.', type: 'info' },
    })
    return NextResponse.json({ ok: true })
  }
  if (action === 'submit-marks') {
    // member submits own marks -> pending approval
    const subjectId = String(body.subjectId || '')
    const pending = Number(body.marks)
    if (isNaN(pending) || pending < 0) return NextResponse.json({ error: 'Invalid marks' }, { status: 400 })
    const existing = await db.cceMark.findUnique({
      where: { userId_subjectId: { userId: me.id, subjectId } },
    })
    if (existing) {
      await db.cceMark.update({ where: { id: existing.id }, data: { pending } })
    } else {
      await db.cceMark.create({ data: { userId: me.id, subjectId, pending } })
    }
    const mods = await db.user.findMany({ where: { role: { in: ['admin', 'vip'] } } })
    for (const m of mods) {
      await db.notification.create({
        data: { userId: m.id, text: `${me.fullName || me.username} submitted marks for approval.`, type: 'info' },
      })
    }
    return NextResponse.json({ ok: true })
  }
  if (action === 'approve-marks') {
    if (!canModerate(me.role)) return NextResponse.json({ error: 'Moderator access required' }, { status: 403 })
    const markId = String(body.markId || '')
    const mark = await db.cceMark.findUnique({ where: { id: markId } })
    if (!mark || mark.pending === null) return NextResponse.json({ error: 'Nothing to approve' }, { status: 400 })
    await db.cceMark.update({ where: { id: markId }, data: { marks: mark.pending, pending: null } })
    await db.notification.create({
      data: { userId: mark.userId, text: 'Your submitted marks were approved.', type: 'success' },
    })
    return NextResponse.json({ ok: true })
  }
  if (action === 'reject-marks') {
    if (!canModerate(me.role)) return NextResponse.json({ error: 'Moderator access required' }, { status: 403 })
    const markId = String(body.markId || '')
    await db.cceMark.update({ where: { id: markId }, data: { pending: null } })
    return NextResponse.json({ ok: true })
  }
  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}
