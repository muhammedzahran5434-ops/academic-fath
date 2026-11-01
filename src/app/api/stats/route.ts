import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionUser, canModerate } from '@/lib/auth'

const CAT_PTS: Record<string, number> = { Academic: 15, Sports: 12, Arts: 10, Community: 10, Religious: 10, Other: 8 }

export async function GET() {
  const me = await getSessionUser()
  if (!me) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })
  const [userCount, postCount, storyCount, fileCount, achCount, annCount, msgCount, disabledCount, pendingAch] = await Promise.all([
    db.user.count(),
    db.post.count(),
    db.story.count({ where: { expiresAt: { gt: new Date() } } }),
    db.file.count(),
    db.achievement.count({ where: { status: 'approved' } }),
    db.announcement.count(),
    db.message.count(),
    db.user.count({ where: { disabled: true } }),
    db.achievement.count({ where: { status: 'pending' } }),
  ])
  const users = await db.user.findMany({ select: { id: true, username: true, fullName: true, role: true, avatarColor: true, photoId: true, disabled: true } })
  const achievements = await db.achievement.findMany({ where: { status: 'approved' }, select: { userId: true, points: true, category: true } })
  const pointsMap: Record<string, number> = {}
  const catMap: Record<string, number> = {}
  for (const a of achievements) {
    pointsMap[a.userId] = (pointsMap[a.userId] || 0) + (CAT_PTS[a.category] || 8)
  }
  for (const a of achievements) {
    catMap[a.category] = (catMap[a.category] || 0) + 1
  }
  return NextResponse.json({
    stats: { userCount, postCount, storyCount, fileCount, achCount, annCount, msgCount, disabledCount, pendingAch },
    leaderboard: users
      .filter((u) => u.role !== 'admin')
      .map((u) => ({ ...u, points: pointsMap[u.id] || 0 }))
      .sort((a, b) => b.points - a.points),
    categories: catMap,
  })
}
