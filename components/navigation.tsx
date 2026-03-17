"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Menu, X } from 'lucide-react'
import { cn } from '@/lib/utils'

export function Navigation() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <header
      className="sticky top-0 z-50 px-3 pt-[11px] text-white sm:px-4 md:px-6"
    >
      <div
        className={cn(
          "mx-auto flex h-[54px] max-w-7xl items-center justify-between rounded-[12px] border border-white/10 px-3 transition-all duration-300 sm:h-[58px] sm:px-4 md:h-[66px] md:px-6",
          isScrolled ? "bg-[#065F46] shadow-lg" : "bg-[#065F46] shadow-sm"
        )}
      >
        <Link href="/" className="rounded-[8px] bg-white px-3 py-[6px] shadow-sm">
          <Image
            src="/fitsol.svg"
            alt="Fitsol"
            width={84}
            height={32}
            priority
            className="h-auto w-[48px] sm:w-[53px] md:w-[84px]"
          />
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-8 md:flex">
          <Link 
            href="#features" 
            className="text-sm font-medium text-white/80 transition-colors hover:text-white"
          >
            Features
          </Link>
          <Link 
            href="#equipment" 
            className="text-sm font-medium text-white/80 transition-colors hover:text-white"
          >
            Equipment
          </Link>
          <Link 
            href="#how-it-works" 
            className="text-sm font-medium text-white/80 transition-colors hover:text-white"
          >
            How It Works
          </Link>
        </nav>

        <div className="hidden items-center gap-4 md:flex">
          <Link href="/assessment">
            <Button size="lg" className="h-[37px] bg-white font-semibold text-[#065F46] hover:bg-white/90">
              Start Assessment
            </Button>
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <button
          className="flex h-9 w-9 items-center justify-center text-white md:hidden"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Toggle menu"
        >
          {isMobileMenuOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <Menu className="h-6 w-6" />
          )}
        </button>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="mx-auto mt-2 max-w-7xl rounded-[12px] border border-white/10 bg-[#065F46] shadow-lg md:hidden">
          <nav className="flex flex-col gap-4 p-4">
            <Link 
              href="#features" 
              className="text-sm font-medium text-white/90"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Features
            </Link>
            <Link 
              href="#equipment" 
              className="text-sm font-medium text-white/90"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Equipment
            </Link>
            <Link 
              href="#how-it-works" 
              className="text-sm font-medium text-white/90"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              How It Works
            </Link>
            <Link href="/assessment" onClick={() => setIsMobileMenuOpen(false)}>
              <Button className="h-[37px] w-full bg-white font-semibold text-[#065F46] hover:bg-white/90">
                Start Assessment
              </Button>
            </Link>
          </nav>
        </div>
      )}
    </header>
  )
}
