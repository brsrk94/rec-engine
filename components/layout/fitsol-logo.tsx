'use client'

import Image from 'next/image'
import Link from 'next/link'

import { cn } from '@/lib/utils'

interface FitsolLogoProps {
  className?: string
  logoClassName?: string
}

export function FitsolLogo({ className, logoClassName }: FitsolLogoProps) {
  return (
    <Link
      href="/"
      aria-label="Fitsol home"
      className={cn(
        'shrink-0 rounded-[8px] bg-white px-2.5 py-[5px] shadow-sm sm:px-3 sm:py-[6px]',
        className
      )}
    >
      <Image
        src="/fitsol.svg"
        alt="Fitsol"
        width={84}
        height={32}
        priority
        className={cn('h-auto w-[46px] sm:w-[53px] md:w-[84px]', logoClassName)}
      />
    </Link>
  )
}
