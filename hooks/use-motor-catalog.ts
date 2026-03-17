'use client'

import { useCallback, useEffect, useState } from 'react'

import type { MotorCatalogPayload } from '@/lib/motor-catalog'

interface UseMotorCatalogOptions {
  enabled?: boolean
}

interface MotorCatalogState {
  catalog: MotorCatalogPayload | null
  errorMessage: string | null
  isLoading: boolean
  reload: () => void
}

export function useMotorCatalog({ enabled = true }: UseMotorCatalogOptions = {}): MotorCatalogState {
  const [catalog, setCatalog] = useState<MotorCatalogPayload | null>(null)
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

    async function loadMotorCatalog() {
      try {
        setIsLoading(true)
        setErrorMessage(null)

        const response = await fetch('/api/catalog/motors', {
          signal: controller.signal,
        })

        if (!response.ok) {
          throw new Error('Unable to load the motor catalog for recommendations.')
        }

        const nextCatalog = (await response.json()) as MotorCatalogPayload
        setCatalog(nextCatalog)
      } catch (error) {
        if (controller.signal.aborted) {
          return
        }

        setErrorMessage(
          error instanceof Error
            ? error.message
            : 'Unable to load the motor catalog for recommendations.'
        )
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false)
        }
      }
    }

    loadMotorCatalog()

    return () => controller.abort()
  }, [enabled, requestKey])

  return {
    catalog,
    errorMessage,
    isLoading,
    reload,
  }
}
