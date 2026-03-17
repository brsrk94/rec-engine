"use client"

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Menu, X } from 'lucide-react'
import { FitsolLogo } from '@/components/layout/fitsol-logo'
import { siteConfig } from '@/lib/config/site'
import { cn } from '@/lib/utils'

export function Navigation() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const frameRef = useRef<number | null>(null)
  const lastScrollStateRef = useRef(false)

  useEffect(() => {
    const handleScroll = () => {
      if (frameRef.current !== null) {
        return
      }

      frameRef.current = window.requestAnimationFrame(() => {
        const nextScrolled = window.scrollY > 50

        if (lastScrollStateRef.current !== nextScrolled) {
          lastScrollStateRef.current = nextScrolled
          setIsScrolled(nextScrolled)
        }

        frameRef.current = null
      })
    }

    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current)
      }

      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  return (
    <header
      className="sticky top-0 z-50 px-2.5 pt-[10px] text-white sm:px-4 md:px-6"
    >
      <div
        className={cn(
          "neo-panel mx-auto flex h-[52px] max-w-7xl items-center justify-between rounded-[12px] px-2.5 transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] sm:h-[58px] sm:px-4 md:h-[66px] md:px-6",
          isScrolled ? "bg-[#065F46] shadow-lg" : "bg-[#065F46]"
        )}
      >
        <FitsolLogo />

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-6 lg:gap-8 md:flex">
          {siteConfig.navigationLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-full px-2 py-1 text-sm font-medium text-white/80 transition-[color,background-color,transform] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-0.5 hover:bg-white/8 hover:text-white"
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
        <div className="neo-panel mx-auto mt-2 max-w-7xl rounded-[12px] bg-[#065F46] md:hidden">
          <nav className="flex flex-col gap-3 p-3">
            {siteConfig.navigationLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-xl px-2 py-2 text-sm font-medium text-white/90 transition-colors hover:bg-white/8 hover:text-white"
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
