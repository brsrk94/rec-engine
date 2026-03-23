'use client'

import { memo, startTransition, useDeferredValue, useEffect, useMemo, useState } from 'react'
import { Check, ChevronsUpDown } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'

export interface SearchableSelectOption {
  value: string
  label: string
  description?: string
  keywords?: string[]
}

interface SearchableSelectProps {
  value: string
  onValueChange: (value: string) => void
  options: SearchableSelectOption[]
  placeholder: string
  searchPlaceholder: string
  emptyText: string
  allowCustomValue?: boolean
  disabled?: boolean
  className?: string
}

function SearchableSelectComponent({
  value,
  onValueChange,
  options,
  placeholder,
  searchPlaceholder,
  emptyText,
  allowCustomValue = false,
  disabled = false,
  className,
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const deferredQuery = useDeferredValue(searchQuery)
  const selectedOption = useMemo(
    () => options.find((option) => option.value === value),
    [options, value]
  )
  const indexedOptions = useMemo(
    () =>
      options.map((option) => ({
        ...option,
        searchBlob: [
          option.label,
          option.description ?? '',
          ...(option.keywords ?? []),
        ]
          .join(' ')
          .toLowerCase(),
      })),
    [options]
  )
  const filteredOptions = useMemo(() => {
    const normalizedQuery = deferredQuery.trim().toLowerCase()

    if (!normalizedQuery) {
      return indexedOptions
    }

    return indexedOptions.filter((option) => option.searchBlob.includes(normalizedQuery))
  }, [deferredQuery, indexedOptions])
  const trimmedQuery = deferredQuery.trim()
  const normalizedTrimmedQuery = trimmedQuery.toLowerCase()
  const canAddCustomValue = useMemo(() => {
    if (!allowCustomValue || !trimmedQuery) {
      return false
    }

    return !options.some((option) => {
      const normalizedValue = option.value.trim().toLowerCase()
      const normalizedLabel = option.label.trim().toLowerCase()

      return (
        normalizedValue === normalizedTrimmedQuery || normalizedLabel === normalizedTrimmedQuery
      )
    })
  }, [allowCustomValue, normalizedTrimmedQuery, options, trimmedQuery])
  const triggerLabel = selectedOption?.label ?? value.trim() ?? ''

  useEffect(() => {
    if (!open && searchQuery) {
      setSearchQuery('')
    }
  }, [open, searchQuery])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          disabled={disabled}
          className={cn(
            'h-10 w-full justify-between rounded-2xl border border-border/70 bg-white px-3 text-left font-normal text-foreground shadow-none transition-[border-color,background-color,color,box-shadow] duration-200 hover:bg-white active:scale-100 sm:h-9',
            className
          )}
        >
          <span className="truncate text-left">{triggerLabel || placeholder}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] rounded-2xl border border-border/80 bg-white p-0 shadow-[0_24px_48px_-28px_rgba(15,23,42,0.28)]" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            value={searchQuery}
            onValueChange={(nextValue) => {
              startTransition(() => {
                setSearchQuery(nextValue)
              })
            }}
            placeholder={searchPlaceholder}
          />
          <CommandList>
            {filteredOptions.length === 0 && !canAddCustomValue ? (
              <CommandEmpty>{emptyText}</CommandEmpty>
            ) : null}
            {canAddCustomValue ? (
              <CommandItem
                value={`__custom__:${trimmedQuery}`}
                onSelect={() => {
                  onValueChange(trimmedQuery)
                  setOpen(false)
                }}
              >
                <Check
                  className={cn(
                    'h-4 w-4',
                    trimmedQuery.toLowerCase() === value.trim().toLowerCase()
                      ? 'opacity-100'
                      : 'opacity-0'
                  )}
                />
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate">Add "{trimmedQuery}"</span>
                  <span className="truncate text-xs text-muted-foreground">
                    Use this value even if it is not in the list
                  </span>
                </div>
              </CommandItem>
            ) : null}
            {filteredOptions.map((option) => (
              <CommandItem
                key={option.value}
                value={option.value}
                onSelect={() => {
                  onValueChange(option.value)
                  setOpen(false)
                }}
              >
                <Check
                  className={cn(
                    'h-4 w-4',
                    option.value === value ? 'opacity-100' : 'opacity-0'
                  )}
                />
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate">{option.label}</span>
                  {option.description ? (
                    <span className="text-muted-foreground truncate text-xs">
                      {option.description}
                    </span>
                  ) : null}
                </div>
              </CommandItem>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

export const SearchableSelect = memo(SearchableSelectComponent)
