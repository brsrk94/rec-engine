import { FitsolLogo } from '@/components/layout/fitsol-logo'

export function Navigation() {
  return (
    <header className="sticky top-0 z-50 border-b border-border/70 bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex h-[60px] max-w-7xl items-center justify-between px-3 sm:h-[68px] sm:px-4 md:px-6">
        <FitsolLogo className="border-0 bg-transparent px-0 py-0" logoClassName="w-[84px] sm:w-[96px]" />
        <div className="flex items-center gap-3">
          <span className="hidden text-sm font-medium text-muted-foreground sm:inline">
            Smarter energy upgrade assessments
          </span>
        </div>
      </div>
    </header>
  )
}
