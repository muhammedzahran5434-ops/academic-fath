import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionUser, canModerate } from '@/lib/auth'

export async function GET() {
  const me = await getSessionUser()
  if (!me) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })
  const posts = await db.post.findMany({
    include: {
      user: { select: { id: true, username: true, fullName: true, role: true, photoId: true, avatarColor: true } },
      comments: {
        include: { user: { select: { username: true, fullName: true, avatarColor: true, photoId: true } } },
        orderBy: { createdAt: 'asc' },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
  })
  return NextResponse.json({ posts })
}

export async function POST(req: NextRequest) {
  const me = await getSessionUser()
  if (!me) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })
  const body = await req.json().catch(() => ({}))
  const content = String(body.content || '').trim()
  const media = Array.isArray(body.media) ? body.media : []
  if (!content && media.length === 0) {
    return NextResponse.json({ error: 'Write something or attach media' }, { status: 400 })
  }
  const post = await db.post.create({
    data: { userId: me.id, content, media: JSON.stringify(media.slice(0, 10)) },
    include: { user: { select: { id: true, username: true, fullName: true, role: true, photoId: true, avatarColor: true } }, comments: true },
  })
  // notify followers-ish: notify all other users (small college community)
  const others = await db.user.findMany({ where: { id: { not: me.id }, disabled: false }, select: { id: true } })
  for (const o of others.slice(0, 50)) {
    await db.notification.create({
      data: { userId: o.id, text: `${me.fullName || me.username} shared a new post`, type: 'info' },
    })
  }
  return NextResponse.json({ post })
}

export async function PATCH(req: NextRequest) {
  const me = await getSessionUser()
  if (!me) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })
  const body = await req.json().catch(() => ({}))
  const id = String(body.id || '')
  const post = await db.post.findUnique({ where: { id } })
  if (!post) return NextResponse.json({ error: 'Post not found' }, { status: 404 })

  if (body.action === 'like') {
    const likes: string[] = JSON.parse(post.likes || '[]')
    const idx = likes.indexOf(me.username)
    if (idx > -1) likes.splice(idx, 1)
    else likes.push(me.username)
    const updated = await db.post.update({ where: { id }, data: { likes: JSON.stringify(likes) } })
    return NextResponse.json({ likes: JSON.parse(updated.likes) })
  }

  if (body.action === 'comment') {
    const text = String(body.text || '').trim()
    if (!text) return NextResponse.json({ error: 'Write a comment' }, { status: 400 })
    const comment = await db.comment.create({
      data: { postId: id, userId: me.id, text },
      include: { user: { select: { username: true, fullName: true, avatarColor: true, photoId: true } } },
    })
    if (post.userId !== me.id) {
      await db.notification.create({
        data: { userId: post.userId, text: `${me.fullName || me.username} commented on your post`, type: 'info' },
      })
    }
    return NextResponse.json({ comment })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}

export async function DELETE(req: NextRequest) {
  const me = await getSessionUser()
  if (!me) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })
  const body = await req.json().catch(() => ({}))
  const id = String(body.id || '')
  const post = await db.post.findUnique({ where: { id } })
  if (!post) return NextResponse.json({ error: 'Post not found' }, { status: 404 })
  if (post.userId !== me.id && !canModerate(me.role)) {
    return NextResponse.json({ error: 'Not allowed' }, { status: 403 })
  }
  await db.post.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
