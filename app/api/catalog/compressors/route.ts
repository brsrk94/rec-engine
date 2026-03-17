import { getCompressorCatalogPayload } from '@/lib/server/compressor-catalog'

export const runtime = 'nodejs'

export async function GET() {
  const payload = await getCompressorCatalogPayload()

  return Response.json(payload, {
    headers: {
      'Cache-Control': 'public, max-age=3600',
    },
  })
}
