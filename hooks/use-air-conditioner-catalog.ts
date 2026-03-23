"use client"

import { useCallback, useEffect, useState } from 'react'

import type { AirConditionerCatalogPayload } from '@/lib/air-conditioner-catalog'

interface UseAirConditionerCatalogOptions {
  enabled?: boolean
}

interface AirConditionerCatalogState {
  catalog: AirConditionerCatalogPayload | null
  errorMessage: string | null
  isLoading: boolean
  reload: () => void
}

export function useAirConditionerCatalog({
  enabled = true,
}: UseAirConditionerCatalogOptions = {}): AirConditionerCatalogState {
  const [catalog, setCatalog] = useState<AirConditionerCatalogPayload | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [requestKey, setRequestKey] = useState(0)

  const reload = useCallback(() => {
    setRequestKey((currentKey) => currentKey + 1)
  }, [])

  useEffect(() => {
    if (!enabled) {
      setCatalog(null)
      setErrorMessage(null)
      setIsLoading(false)
      return
    }

    const controller = new AbortController()

    async function loadCatalog() {
      try {
        setIsLoading(true)
        setErrorMessage(null)

        const response = await fetch('/api/catalog/air-conditioners', {
          signal: controller.signal,
        })

        if (!response.ok) {
          throw new Error('Unable to load the air conditioner catalog right now.')
        }

        const nextCatalog = (await response.json()) as AirConditionerCatalogPayload
        setCatalog(nextCatalog)
      } catch (error) {
        if (controller.signal.aborted) {
          return
        }

        setErrorMessage(
          error instanceof Error
            ? error.message
            : 'Unable to load the air conditioner catalog right now.'
        )
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false)
        }
      }
    }

    loadCatalog()

    return () => controller.abort()
  }, [enabled, requestKey])

  return {
    catalog,
    errorMessage,
    isLoading,
    reload,
  }
}
