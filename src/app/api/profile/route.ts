import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionUser, canModerate } from '@/lib/auth'

// Profile of any user + their posts + achievements (public view)
export async function GET(req: NextRequest) {
  const me = await getSessionUser()
  if (!me) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })
  const username = req.nextUrl.searchParams.get('username') || me.username
  const user = await db.user.findUnique({
    where: { username },
    include: { skills: true },
  })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })
  const [posts, achievements] = await Promise.all([
    db.post.findMany({ where: { userId: user.id }, orderBy: { createdAt: 'desc' }, take: 20 }),
    db.achievement.findMany({ where: { userId: user.id }, orderBy: { createdAt: 'desc' } }),
  ])
  const visibleAch = canModerate(me.role) || user.id === me.id
    ? achievements
    : achievements.filter((a) => a.status === 'approved')
  return NextResponse.json({
    profile: { ...user, password: undefined, sessions: undefined },
    posts,
    achievements: visibleAch,
  })
}
