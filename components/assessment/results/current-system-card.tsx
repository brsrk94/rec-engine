'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatIndianNumber } from '@/lib/formatting'

import type { AssessmentCurrentSystemSnapshot } from './types'

interface CurrentSystemCardProps {
  currentSystem: AssessmentCurrentSystemSnapshot
}

const snapshotFields = [
  { key: 'type', label: 'Type' },
  { key: 'rating', label: 'Rating' },
  { key: 'make', label: 'Make' },
  { key: 'model', label: 'Model' },
] as const

export function CurrentSystemCard({ currentSystem }: CurrentSystemCardProps) {
  return (
    <Card className="bg-white/94">
      <CardHeader>
        <CardTitle className="text-primary">Current System</CardTitle>
        <CardDescription>Your existing equipment configuration</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {snapshotFields.map((field) => (
            <div key={field.key} className="rounded-2xl border border-border/70 bg-secondary/35 px-4 py-3">
              <p className="whitespace-nowrap text-sm text-muted-foreground">{field.label}</p>
              <p className="truncate font-medium">{currentSystem[field.key]}</p>
            </div>
          ))}
          <div className="rounded-2xl border border-border/70 bg-secondary/35 px-4 py-3">
            <p className="whitespace-nowrap text-sm text-muted-foreground">Annual Energy</p>
            <p className="whitespace-nowrap font-medium">
              {formatIndianNumber(currentSystem.annualEnergy)} kWh
            </p>
          </div>
          <div className="rounded-2xl border border-border/70 bg-secondary/35 px-4 py-3">
            <p className="whitespace-nowrap text-sm text-muted-foreground">Annual Cost</p>
            <p className="whitespace-nowrap font-medium">
              INR {formatIndianNumber(currentSystem.annualCost)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
