'use client'

import { RefreshCcw } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface ResultsErrorStateProps {
  title: string
  description: string
  primaryActionLabel: string
  onPrimaryAction: () => void
  onRetry?: () => void
}

export function ResultsErrorState({
  title,
  description,
  primaryActionLabel,
  onPrimaryAction,
  onRetry,
}: ResultsErrorStateProps) {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-lg border-border/80 shadow-sm">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row">
          {onRetry ? (
            <Button variant="outline" onClick={onRetry} className="gap-2 sm:w-auto">
              <RefreshCcw className="h-4 w-4" />
              Retry
            </Button>
          ) : null}
          <Button onClick={onPrimaryAction} className="sm:w-auto">
            {primaryActionLabel}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
