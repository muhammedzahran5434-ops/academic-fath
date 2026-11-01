import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import fs from 'fs'
import path from 'path'

export const runtime = 'nodejs'

const UPLOAD_DIR = path.join(process.cwd(), 'uploads')

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const file = await db.file.findUnique({ where: { id } })
  if (!file) return NextResponse.json({ error: 'File not found' }, { status: 404 })
  const filePath = path.join(UPLOAD_DIR, file.path)
  if (!fs.existsSync(filePath)) return NextResponse.json({ error: 'File missing on disk' }, { status: 404 })
  const stat = fs.statSync(filePath)
  const stream = fs.createReadStream(filePath)
  return new NextResponse(stream as unknown as ReadableStream, {
    headers: {
      'Content-Type': file.mime,
      'Content-Length': String(stat.size),
      'Cache-Control': 'public, max-age=31536000, immutable',
      'Accept-Ranges': 'bytes',
    },
  })
}
