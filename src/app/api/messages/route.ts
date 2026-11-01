import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionUser, canModerate } from '@/lib/auth'

function msgPair(a: string, b: string): string {
  return [a, b].sort().join('__')
}

export async function GET(req: NextRequest) {
  const me = await getSessionUser()
  if (!me) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })
  const peerId = req.nextUrl.searchParams.get('peer') || ''
  const since = req.nextUrl.searchParams.get('since') || ''
  if (peerId) {
    const pair = msgPair(me.id, peerId)
    const messages = await db.message.findMany({
      where: { pair, createdAt: since ? { gt: new Date(since) } : undefined },
      orderBy: { createdAt: 'asc' },
      take: 500,
    })
    return NextResponse.json({ messages })
  }
  // conversation list: last message per pair
  const all = await db.message.findMany({
    where: { pair: { contains: me.id } },
    orderBy: { createdAt: 'desc' },
    take: 500,
  })
  const pairs = new Map<string, typeof all[number]>()
  for (const m of all) if (!pairs.has(m.pair)) pairs.set(m.pair, m)
  return NextResponse.json({ conversations: Array.from(pairs.values()) })
}

export async function POST(req: NextRequest) {
  const me = await getSessionUser()
  if (!me) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })
  const body = await req.json().catch(() => ({}))
  const toId = String(body.toId || '')
  const text = String(body.text || '').trim()
  const mediaId = body.mediaId ? String(body.mediaId) : null
  const mediaType = body.mediaType ? String(body.mediaType) : null
  const replyTo = body.replyTo ? String(body.replyTo) : null
  if (!toId) return NextResponse.json({ error: 'Choose a recipient' }, { status: 400 })
  if (!text && !mediaId) return NextResponse.json({ error: 'Type a message or attach media' }, { status: 400 })
  const target = await db.user.findUnique({ where: { id: toId } })
  if (!target) return NextResponse.json({ error: 'Recipient not found' }, { status: 404 })
  const message = await db.message.create({
    data: { pair: msgPair(me.id, toId), fromId: me.id, toId, text: text || null, mediaId, mediaType, replyTo },
  })
  await db.notification.create({
    data: { userId: toId, text: `New message from ${me.fullName || me.username}`, type: 'info' },
  })
  return NextResponse.json({ message })
}

export async function PATCH(req: NextRequest) {
  const me = await getSessionUser()
  if (!me) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })
  const body = await req.json().catch(() => ({}))
  const id = String(body.id || '')
  const message = await db.message.findUnique({ where: { id } })
  if (!message) return NextResponse.json({ error: 'Message not found' }, { status: 404 })
  const isMine = message.fromId === me.id
  const isToMe = message.toId === me.id

  if (body.action === 'react') {
    const emoji = String(body.emoji || 'ok')
    const reactions = JSON.parse(message.reactions || '{}')
    if (isToMe || isMine) {
      if (reactions[me.username] === emoji) delete reactions[me.username]
      else reactions[me.username] = emoji
      await db.message.update({ where: { id }, data: { reactions: JSON.stringify(reactions) } })
    }
    return NextResponse.json({ ok: true })
  }
  if (body.action === 'delete') {
    if (isMine || canModerate(me.role)) {
      await db.message.update({ where: { id }, data: { deleted: true, text: null, mediaId: null } })
    }
    return NextResponse.json({ ok: true })
  }
  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}
