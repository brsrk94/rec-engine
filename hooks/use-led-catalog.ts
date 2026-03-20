"use client"

import { useCallback, useEffect, useState } from 'react'

import type { LEDCatalogPayload } from '@/lib/led-catalog'

interface UseLEDCatalogOptions {
  enabled?: boolean
}

interface LEDCatalogState {
  catalog: LEDCatalogPayload | null
  errorMessage: string | null
  isLoading: boolean
  reload: () => void
}

export function useLEDCatalog({
  enabled = true,
}: UseLEDCatalogOptions = {}): LEDCatalogState {
  const [catalog, setCatalog] = useState<LEDCatalogPayload | null>(null)
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

        const response = await fetch('/api/catalog/leds', {
          signal: controller.signal,
        })

        if (!response.ok) {
          throw new Error('Unable to load the LED catalog right now.')
        }

        const nextCatalog = (await response.json()) as LEDCatalogPayload
        setCatalog(nextCatalog)
      } catch (error) {
        if (controller.signal.aborted) {
          return
        }

        setErrorMessage(
          error instanceof Error ? error.message : 'Unable to load the LED catalog right now.'
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
