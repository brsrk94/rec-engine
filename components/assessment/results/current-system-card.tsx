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
    <Card>
      <CardHeader>
        <CardTitle>Current System</CardTitle>
        <CardDescription>Your existing equipment configuration</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {snapshotFields.map((field) => (
            <div key={field.key}>
              <p className="text-sm text-muted-foreground">{field.label}</p>
              <p className="font-medium">{currentSystem[field.key]}</p>
            </div>
          ))}
          <div>
            <p className="text-sm text-muted-foreground">Annual Energy</p>
            <p className="font-medium">{formatIndianNumber(currentSystem.annualEnergy)} kWh</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Annual Cost</p>
            <p className="font-medium">INR {formatIndianNumber(currentSystem.annualCost)}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
