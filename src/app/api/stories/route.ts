import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionUser, canModerate } from '@/lib/auth'

export async function GET() {
  const me = await getSessionUser()
  if (!me) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })
  const stories = await db.story.findMany({
    where: { expiresAt: { gt: new Date() } },
    include: { user: { select: { id: true, username: true, fullName: true, role: true, photoId: true, avatarColor: true } } },
    orderBy: { createdAt: 'asc' },
  })
  return NextResponse.json({ stories })
}

export async function POST(req: NextRequest) {
  const me = await getSessionUser()
  if (!me) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })
  const body = await req.json().catch(() => ({}))
  const type = ['text', 'image', 'video'].includes(body.type) ? body.type : 'text'
  const content = String(body.content || '').trim()
  const mediaId = body.mediaId ? String(body.mediaId) : null
  const bg = String(body.bg || '')
  if (type === 'text' && !content) return NextResponse.json({ error: 'Write your status text' }, { status: 400 })
  if (type !== 'text' && !mediaId) return NextResponse.json({ error: 'Attach media' }, { status: 400 })
  const story = await db.story.create({
    data: {
      userId: me.id, type, content, mediaId, bg,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
    include: { user: { select: { id: true, username: true, fullName: true, role: true, photoId: true, avatarColor: true } } },
  })
  return NextResponse.json({ story })
}

export async function PATCH(req: NextRequest) {
  const me = await getSessionUser()
  if (!me) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })
  const body = await req.json().catch(() => ({}))
  const id = String(body.id || '')
  const story = await db.story.findUnique({ where: { id } })
  if (!story) return NextResponse.json({ error: 'Story not found' }, { status: 404 })

  if (body.action === 'seen') {
    const seenBy: string[] = JSON.parse(story.seenBy || '[]')
    if (!seenBy.includes(me.username)) seenBy.push(me.username)
    await db.story.update({ where: { id }, data: { seenBy: JSON.stringify(seenBy) } })
    return NextResponse.json({ ok: true })
  }
  if (body.action === 'reply') {
    const text = String(body.text || '').trim()
    if (!text) return NextResponse.json({ error: 'Write a reply' }, { status: 400 })
    const replies = JSON.parse(story.replies || '[]')
    replies.push({ from: me.fullName || me.username, fromId: me.id, text, ts: Date.now() })
    await db.story.update({ where: { id }, data: { replies: JSON.stringify(replies) } })
    if (story.userId !== me.id) {
      await db.notification.create({
        data: { userId: story.userId, text: `${me.fullName || me.username} replied to your status: "${text.slice(0, 40)}"`, type: 'info' },
      })
    }
    return NextResponse.json({ ok: true })
  }
  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}

export async function DELETE(req: NextRequest) {
  const me = await getSessionUser()
  if (!me) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })
  const body = await req.json().catch(() => ({}))
  const id = String(body.id || '')
  const story = await db.story.findUnique({ where: { id } })
  if (!story) return NextResponse.json({ error: 'Story not found' }, { status: 404 })
  if (story.userId !== me.id && !canModerate(me.role)) {
    return NextResponse.json({ error: 'Not allowed' }, { status: 403 })
  }
  await db.story.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
