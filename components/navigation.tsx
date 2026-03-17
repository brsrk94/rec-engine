"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Menu, X } from 'lucide-react'
import { FitsolLogo } from '@/components/layout/fitsol-logo'
import { siteConfig } from '@/lib/config/site'
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
      className="sticky top-0 z-50 px-2.5 pt-[10px] text-white sm:px-4 md:px-6"
    >
      <div
        className={cn(
          "mx-auto flex h-[52px] max-w-7xl items-center justify-between rounded-[12px] border border-white/10 px-2.5 transition-all duration-300 sm:h-[58px] sm:px-4 md:h-[66px] md:px-6",
          isScrolled ? "bg-[#065F46] shadow-lg" : "bg-[#065F46] shadow-sm"
        )}
      >
        <FitsolLogo />

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-6 lg:gap-8 md:flex">
          {siteConfig.navigationLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-white/80 transition-colors hover:text-white"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-4 md:flex">
          <Link href="/assessment">
            <Button size="lg" className="h-9 bg-white font-semibold text-[#065F46] hover:bg-white/90">
              Start Assessment
            </Button>
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <button
          className="flex h-8 w-8 items-center justify-center text-white md:hidden"
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
          <nav className="flex flex-col gap-3 p-3">
            {siteConfig.navigationLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-white/90"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <Link href="/assessment" onClick={() => setIsMobileMenuOpen(false)}>
              <Button className="h-9 w-full bg-white font-semibold text-[#065F46] hover:bg-white/90">
                Start Assessment
              </Button>
            </Link>
          </nav>
        </div>
      )}
    </header>
  )
}
