'use client'

import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export function ResultsLoadingState() {
  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-10 px-2.5 pt-[10px] sm:px-4 md:px-6">
        <div className="mx-auto flex h-[52px] max-w-7xl items-center justify-between rounded-[12px] border border-border/70 bg-card px-2.5 shadow-sm sm:h-[58px] sm:px-4 md:h-[66px] md:px-6">
          <Skeleton className="h-9 w-[74px] rounded-[8px] sm:h-10 sm:w-[94px]" />
          <Skeleton className="h-8 w-24 rounded-md sm:w-32" />
        </div>
      </div>

      <main className="mx-auto max-w-6xl px-3 py-6 sm:px-4 sm:py-8 md:px-6 md:py-12">
        <div className="mb-6 flex items-start gap-3 sm:mb-8 sm:items-center">
          <Skeleton className="h-10 w-10 rounded-xl sm:h-14 sm:w-14" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-7 w-48 rounded-md sm:h-8 sm:w-64" />
            <Skeleton className="h-4 w-36 rounded-md sm:w-48" />
          </div>
        </div>

        <div className="mb-8 grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Card key={index} className="border-border/80">
              <CardContent className="flex items-center gap-3 p-3.5 sm:gap-4 sm:p-4">
                <Skeleton className="h-10 w-10 rounded-full sm:h-12 sm:w-12" />
                <div className="min-w-0 flex-1 space-y-2">
                  <Skeleton className="h-4 w-24 rounded-md" />
                  <Skeleton className="h-6 w-28 rounded-md" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          {Array.from({ length: 2 }).map((_, index) => (
            <Card key={index} className="border-border/80">
              <CardHeader className="space-y-2">
                <Skeleton className="h-6 w-56 rounded-md" />
                <Skeleton className="h-4 w-72 max-w-full rounded-md" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-[300px] w-full rounded-xl sm:h-[360px]" />
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  )
}
