"use client"

import { useCallback, useEffect, useState } from 'react'

import type { CompressorCatalogPayload } from '@/lib/compressor-catalog'

interface UseCompressorCatalogOptions {
  enabled?: boolean
}

export function useCompressorCatalog(options: UseCompressorCatalogOptions = {}) {
  const { enabled = true } = options
  const [catalog, setCatalog] = useState<CompressorCatalogPayload | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(enabled)
  const [reloadToken, setReloadToken] = useState(0)

  const reload = useCallback(() => {
    setReloadToken((currentValue) => currentValue + 1)
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
      setIsLoading(true)
      setErrorMessage(null)

      try {
        const response = await fetch('/api/catalog/compressors', {
          signal: controller.signal,
        })

        if (!response.ok) {
          throw new Error(`Catalog request failed with status ${response.status}`)
        }

        const payload = (await response.json()) as CompressorCatalogPayload

        if (!controller.signal.aborted) {
          setCatalog(payload)
        }
      } catch (error) {
        if (controller.signal.aborted) {
          return
        }

        console.warn('Fitsol: unable to load compressor catalog.', error)
        setCatalog(null)
        setErrorMessage('Compressor catalog could not be loaded right now. Please try again.')
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false)
        }
      }
    }

    loadCatalog()

    return () => controller.abort()
  }, [enabled, reloadToken])

  return {
    catalog,
    errorMessage,
    isLoading,
    reload,
  }
}
