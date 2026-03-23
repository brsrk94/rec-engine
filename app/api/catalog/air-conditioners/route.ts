import { getAirConditionerCatalogPayload } from '@/lib/server/air-conditioner-catalog'

export const runtime = 'nodejs'

export async function GET() {
  const payload = await getAirConditionerCatalogPayload()

  return Response.json(payload, {
    headers: {
      'Cache-Control': 'public, max-age=3600',
    },
  })
}
