'use client'

import type { ReactNode } from 'react'

import { FitsolLogo } from '@/components/layout/fitsol-logo'
import { siteConfig } from '@/lib/config/site'
import { cn } from '@/lib/utils'

interface StickyShellHeaderProps {
  children?: ReactNode
  className?: string
  contentClassName?: string
}

export function StickyShellHeader({
  children,
  className,
  contentClassName,
}: StickyShellHeaderProps) {
  return (
    <header className={cn('sticky top-0 z-50 px-2.5 pt-[10px] text-white sm:px-4 md:px-6', className)}>
      <div
        className={cn(
          'mx-auto flex h-[52px] max-w-7xl items-center justify-between rounded-[12px] border border-white/10 px-2.5 shadow-sm sm:h-[58px] sm:px-4 md:h-[66px] md:px-6',
          contentClassName
        )}
        style={{ backgroundColor: siteConfig.brandColor }}
      >
        <FitsolLogo />
        {children}
      </div>
    </header>
  )
}
