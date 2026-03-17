"use client"

import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function AssessmentHeader() {
  return (
    <header className="sticky top-0 z-50 px-4 pt-[11px] text-white md:px-6">
      <div className="mx-auto flex h-[58px] max-w-7xl items-center justify-between rounded-[12px] border border-white/10 bg-[#065F46] px-4 shadow-sm md:h-[66px] md:px-6">
        <Link href="/" className="rounded-[8px] bg-white px-3 py-[6px] shadow-sm">
          <Image
            src="/fitsol.svg"
            alt="Fitsol"
            width={84}
            height={32}
            priority
            className="h-auto w-[53px] md:w-[84px]"
          />
        </Link>

        <Link href="/">
          <Button variant="ghost" size="sm" className="h-8 gap-2 px-2.5 text-white hover:bg-white/10 hover:text-white sm:h-[29px] sm:px-3">
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Back to Home</span>
          </Button>
        </Link>
      </div>
    </header>
  )
}
