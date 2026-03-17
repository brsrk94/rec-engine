"use client"

import { Suspense } from 'react'
import { AssessmentFlow } from '@/components/assessment/assessment-flow'

export default function AssessmentPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <span className="text-muted-foreground">Loading assessment...</span>
        </div>
      </div>
    }>
      <AssessmentFlow />
    </Suspense>
  )
}
