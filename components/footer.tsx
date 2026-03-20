import Link from 'next/link'
import { FitsolLogo } from '@/components/layout/fitsol-logo'
import { footerEquipmentLinks, footerResourceLinks } from '@/lib/config/site'

export function Footer() {
  return (
    <footer className="border-t border-border/70 bg-white/90 backdrop-blur-sm">
      <div className="mx-auto max-w-7xl px-3 py-10 sm:px-4 md:px-6 md:py-12">
        <div className="bg-white px-5 py-8 text-foreground sm:px-6 sm:py-9 md:px-8 md:py-10">
          <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-4">
            <div className="md:col-span-2">
              <div className="flex justify-start">
                <FitsolLogo className="px-3 py-[6px]" logoClassName="w-[72px] sm:w-[84px]" />
              </div>
              <p className="mt-4 max-w-sm text-sm leading-6 text-muted-foreground sm:text-base">
                Smart energy efficiency assessments for industrial equipment.
                Reduce costs, save energy, and lower emissions.
              </p>
            </div>

            <div className="text-left">
              <h3 className="mb-4 font-semibold">Equipment</h3>
              <ul className="space-y-2 text-muted-foreground">
                {footerEquipmentLinks.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="transition-colors hover:text-primary">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="text-left">
              <h3 className="mb-4 font-semibold">Resources</h3>
              <ul className="space-y-2 text-muted-foreground">
                {footerResourceLinks.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="transition-colors hover:text-primary">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-10 border-t border-border/70 pt-6 text-left text-sm text-muted-foreground md:mt-12 md:pt-8">
            <p>
              &copy; {new Date().getFullYear()} Fitsol. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
