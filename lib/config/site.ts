type SiteLink = {
  href: string
  label: string
}

export const siteConfig = {
  name: 'Fitsol',
  brandColor: '#065F46',
  navigationLinks: [] as SiteLink[],
} as const

export const footerEquipmentLinks = [
  { href: '/assessment?type=motor', label: 'Industrial Motors' },
  { href: '/assessment?type=compressor', label: 'Air Compressors' },
  { href: '/assessment?type=air_conditioner', label: 'Air Conditioners' },
  { href: '/assessment?type=led_retrofit', label: 'LED Retrofit' },
  { href: '/assessment?type=dg_set', label: 'DG Sets' },
] as const

export const footerResourceLinks = [
  { href: '#features', label: 'Features' },
  { href: '#how-it-works', label: 'How It Works' },
  { href: '/assessment', label: 'Start Assessment' },
] as const
