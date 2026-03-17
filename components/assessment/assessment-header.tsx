"use client"

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

import { StickyShellHeader } from '@/components/layout/sticky-shell-header'
import { Button } from '@/components/ui/button'

export function AssessmentHeader() {
  return (
    <StickyShellHeader>
      <div className="flex items-center gap-2">
        <Link href="/">
          <Button variant="ghost" size="sm" className="h-8 gap-2 px-2 text-white hover:bg-white/10 hover:text-white sm:h-[29px] sm:px-3">
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Back to Home</span>
          </Button>
        </Link>
      </div>
    </StickyShellHeader>
  )
}
