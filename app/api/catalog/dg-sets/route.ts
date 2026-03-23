import { getDGSetCatalogPayload } from '@/lib/server/dg-set-catalog'

export const runtime = 'nodejs'

export async function GET() {
  const payload = await getDGSetCatalogPayload()

  return Response.json(payload, {
    headers: {
      'Cache-Control': 'public, max-age=3600',
    },
  })
}
