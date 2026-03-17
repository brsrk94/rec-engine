import { readFile } from 'node:fs/promises'
import path from 'node:path'

export const runtime = 'nodejs'

const MODELS_ROOT = path.resolve(process.cwd(), 'threed-models')

const CONTENT_TYPES: Record<string, string> = {
  '.bin': 'application/octet-stream',
  '.gltf': 'model/gltf+json',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.png': 'image/png',
  '.txt': 'text/plain; charset=utf-8',
  '.webp': 'image/webp',
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ path: string[] }> }
) {
  const { path: pathSegments = [] } = await context.params

  if (pathSegments.length === 0) {
    return new Response('Model file not found.', { status: 404 })
  }

  const filePath = path.resolve(MODELS_ROOT, ...pathSegments)

  if (!filePath.startsWith(MODELS_ROOT + path.sep) && filePath !== MODELS_ROOT) {
    return new Response('Invalid model path.', { status: 400 })
  }

  try {
    const file = await readFile(filePath)
    const extension = path.extname(filePath).toLowerCase()

    return new Response(file, {
      headers: {
        'Cache-Control': 'public, max-age=3600',
        'Content-Type': CONTENT_TYPES[extension] ?? 'application/octet-stream',
      },
    })
  } catch {
    return new Response('Model file not found.', { status: 404 })
  }
}
