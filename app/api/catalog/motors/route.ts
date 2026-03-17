import { getMotorCatalogPayload } from '@/lib/server/motor-catalog'

export const runtime = 'nodejs'

export async function GET() {
  const payload = await getMotorCatalogPayload()

  return Response.json(payload, {
    headers: {
      'Cache-Control': 'public, max-age=3600',
    },
  })
}
