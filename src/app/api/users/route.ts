import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import {
  getSessionUser, toSafeUser, hashPassword, canModerate, avatarColorFor,
} from '@/lib/auth'

// GET: list all users (with skills). Moderators see everything; members see public info.
export async function GET() {
  const me = await getSessionUser()
  if (!me) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })
  const users = await db.user.findMany({
    include: { skills: true },
    orderBy: { username: 'asc' },
  })
  return NextResponse.json({
    users: users.map((u) => ({
      ...toSafeUser(u),
      skills: u.skills.map((s) => ({ id: s.id, name: s.name, level: s.level })),
    })),
    me,
  })
}

export async function PATCH(req: NextRequest) {
  const me = await getSessionUser()
  if (!me) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })
  const body = await req.json().catch(() => ({}))
  const action = body.action as string

  // ---- Own profile update ----
  if (action === 'update-profile') {
    const data: Record<string, string> = {}
    for (const k of ['fullName', 'dob', 'klass', 'guardian', 'phone', 'address', 'bio', 'photoId']) {
      if (typeof body[k] === 'string') data[k] = body[k]
    }
    const updated = await db.user.update({ where: { id: me.id }, data })
    return NextResponse.json({ user: toSafeUser(updated) })
  }

  // ---- Skill management (self) ----
  if (action === 'add-skill') {
    const name = String(body.name || '').trim()
    const level = Math.max(1, Math.min(100, Number(body.level) || 60))
    if (!name) return NextResponse.json({ error: 'Enter a skill name' }, { status: 400 })
    const skill = await db.skill.create({ data: { userId: me.id, name, level } })
    return NextResponse.json({ skill })
  }
  if (action === 'remove-skill') {
    const skill = await db.skill.findUnique({ where: { id: String(body.skillId || '') } })
    if (!skill) return NextResponse.json({ error: 'Skill not found' }, { status: 404 })
    if (skill.userId !== me.id && !canModerate(me.role)) {
      return NextResponse.json({ error: 'Not allowed' }, { status: 403 })
    }
    await db.skill.delete({ where: { id: skill.id } })
    return NextResponse.json({ ok: true })
  }

  // ---- Moderator (admin/VIP) actions on members ----
  if (!canModerate(me.role)) {
    return NextResponse.json({ error: 'Moderator access required' }, { status: 403 })
  }
  const targetId = String(body.userId || '')
  const target = await db.user.findUnique({ where: { id: targetId } })
  if (!target) return NextResponse.json({ error: 'Member not found' }, { status: 404 })

  // Only true admin can modify admins; VIP cannot touch admin accounts
  if (target.role === 'admin' && me.role !== 'admin') {
    return NextResponse.json({ error: 'VIP cannot modify administrator accounts' }, { status: 403 })
  }

  if (action === 'disable') {
    if (target.id === me.id) return NextResponse.json({ error: 'You cannot disable yourself' }, { status: 400 })
    await db.user.update({ where: { id: target.id }, data: { disabled: true } })
    await db.session.deleteMany({ where: { userId: target.id } }) // kick out
    await db.notification.create({ data: { userId: target.id, text: 'Your account was disabled by a moderator.', type: 'error' } })
    return NextResponse.json({ ok: true })
  }
  if (action === 'enable') {
    await db.user.update({ where: { id: target.id }, data: { disabled: false } })
    await db.notification.create({ data: { userId: target.id, text: 'Your account has been re-enabled. Welcome back!', type: 'success' } })
    return NextResponse.json({ ok: true })
  }
  if (action === 'make-vip') {
    if (target.role === 'admin') return NextResponse.json({ error: 'Administrator is already above VIP' }, { status: 400 })
    const updated = await db.user.update({ where: { id: target.id }, data: { role: 'vip', vipSince: new Date() } })
    await db.notification.create({ data: { userId: target.id, text: 'You are now a VIP member! All moderator features unlocked.', type: 'success' } })
    return NextResponse.json({ user: toSafeUser(updated) })
  }
  if (action === 'remove-vip') {
    if (me.role !== 'admin') return NextResponse.json({ error: 'Only the administrator can remove VIP' }, { status: 403 })
    const updated = await db.user.update({ where: { id: target.id }, data: { role: 'member', vipSince: null } })
    await db.notification.create({ data: { userId: target.id, text: 'Your VIP status was removed by the administrator.', type: 'warning' } })
    return NextResponse.json({ user: toSafeUser(updated) })
  }
  if (action === 'reset-password') {
    const newPass = String(body.newPassword || '').trim()
    if (newPass.length < 6) return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 })
    await db.user.update({ where: { id: target.id }, data: { password: hashPassword(newPass) } })
    await db.notification.create({ data: { userId: target.id, text: 'Your password was reset by a moderator.', type: 'warning' } })
    return NextResponse.json({ ok: true })
  }
  if (action === 'delete') {
    if (me.role !== 'admin') return NextResponse.json({ error: 'Only the administrator can delete members' }, { status: 403 })
    if (target.role === 'admin') return NextResponse.json({ error: 'Cannot delete administrator' }, { status: 400 })
    await db.user.delete({ where: { id: target.id } })
    return NextResponse.json({ ok: true })
  }
  if (action === 'add-admission') {
    if (me.role !== 'admin') return NextResponse.json({ error: 'Only the administrator can add admission numbers' }, { status: 403 })
    const adno = String(body.adno || '').trim()
    if (!adno) return NextResponse.json({ error: 'Enter an admission number' }, { status: 400 })
    const exists = await db.user.findUnique({ where: { username: adno } })
    if (exists) return NextResponse.json({ error: 'Admission number already exists' }, { status: 400 })
    await db.user.create({
      data: { username: adno, password: hashPassword(`${adno}@fath`), role: 'member', avatarColor: avatarColorFor(adno) },
    })
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}
