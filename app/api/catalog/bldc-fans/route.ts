import { getBLDCFanCatalogPayload } from '@/lib/server/bldc-fan-catalog'

export const runtime = 'nodejs'

export async function GET() {
  const payload = await getBLDCFanCatalogPayload()

  return Response.json(payload, {
    headers: {
      'Cache-Control': 'public, max-age=3600',
    },
  })
}
