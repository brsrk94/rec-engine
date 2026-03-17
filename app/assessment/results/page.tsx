"use client"

import { Suspense } from 'react'
import { ResultsView } from '@/components/assessment/results-view'
import { ResultsLoadingState } from '@/components/assessment/results/results-loading-state'

export default function ResultsPage() {
  return (
    <Suspense fallback={<ResultsLoadingState />}>
      <ResultsView />
    </Suspense>
  )
}
