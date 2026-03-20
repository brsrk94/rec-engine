'use client'

import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export function AssessmentLoadingState() {
  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto max-w-6xl px-3 py-8 sm:px-4 sm:py-10 md:px-6 md:py-14">
        <div className="mb-7 text-center sm:mb-8">
          <Skeleton className="mx-auto h-8 w-64 rounded-md sm:h-10 sm:w-80" />
          <Skeleton className="mx-auto mt-3 h-4 w-56 rounded-md sm:w-72" />
        </div>

        <div className="space-y-4 md:hidden">
          <Skeleton className="h-12 w-full rounded-xl" />
          <Skeleton className="mx-auto h-4 w-48 rounded-md" />
        </div>

        <div className="hidden grid-cols-2 gap-4 md:grid lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Card key={index} className="border-border/80">
              <CardHeader className="gap-4 pb-3">
                <div className="flex items-start gap-4">
                  <Skeleton className="h-12 w-12 rounded-xl" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-40 rounded-md" />
                    <Skeleton className="h-4 w-4 rounded-full" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full rounded-md" />
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  )
}
