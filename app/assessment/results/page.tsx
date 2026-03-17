"use client"

import { Suspense } from 'react'
import { ResultsView } from '@/components/assessment/results-view'

export default function ResultsPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <span className="text-muted-foreground">Generating recommendations...</span>
        </div>
      </div>
    }>
      <ResultsView />
    </Suspense>
  )
}
