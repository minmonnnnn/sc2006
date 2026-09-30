import { useEffect, useRef, useState } from 'react'
import type { FavouriteLocation } from '@smart-parking/shared-types'

interface PendingDeletion {
  favourite: FavouriteLocation
  deleting: boolean
}

export function useFavouriteDeletion(remove: (id: number) => Promise<void>) {
  const removeRef = useRef(remove)
  const pendingRef = useRef<PendingDeletion | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const mountedRef = useRef(true)
  const [pending, setPending] = useState<PendingDeletion | null>(null)
  const [deletedIds, setDeletedIds] = useState<Set<number>>(() => new Set())
  const [error, setError] = useState('')

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      if (timerRef.current !== null) clearTimeout(timerRef.current)
      timerRef.current = null
      pendingRef.current = null
    }
  }, [])

  useEffect(() => { removeRef.current = remove }, [remove])

  function scheduleDelete(favourite: FavouriteLocation): boolean {
    if (pendingRef.current) return false
    const next = { favourite, deleting: false }
    pendingRef.current = next
    setPending(next)
    setError('')
    timerRef.current = setTimeout(async () => {
      timerRef.current = null
      if (!pendingRef.current) return
      const deleting = { favourite, deleting: true }
      pendingRef.current = deleting
      setPending(deleting)
      try {
        await removeRef.current(favourite.id)
        if (mountedRef.current) setDeletedIds((ids) => new Set(ids).add(favourite.id))
      } catch (cause) {
        if (mountedRef.current) setError(`Could not delete ${favourite.locationName}. ${cause instanceof Error ? cause.message : 'Try again.'}`)
      } finally {
        pendingRef.current = null
        if (mountedRef.current) setPending(null)
      }
    }, 5000)
    return true
  }

  function undoDelete(): void {
    if (!pendingRef.current || pendingRef.current.deleting) return
    if (timerRef.current !== null) clearTimeout(timerRef.current)
    timerRef.current = null
    pendingRef.current = null
    setPending(null)
  }

  return {
    scheduleDelete,
    undoDelete,
    pendingFavourite: pending && !pending.deleting ? pending.favourite : null,
    isHidden: (id: number) => pending?.favourite.id === id || deletedIds.has(id),
    deletionBusy: pending !== null,
    error,
  }
}
