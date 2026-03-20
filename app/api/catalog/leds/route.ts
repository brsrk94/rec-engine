import { getLEDCatalogPayload } from '@/lib/server/led-catalog'

export const runtime = 'nodejs'

export async function GET() {
  const payload = await getLEDCatalogPayload()

  return Response.json(payload, {
    headers: {
      'Cache-Control': 'public, max-age=3600',
    },
  })
}
