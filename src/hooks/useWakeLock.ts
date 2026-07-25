import { useEffect } from 'react'

/**
 * Keeps the screen awake while the host screen is mounted (§4.3). Re-acquires
 * after the tab returns to the foreground (the OS releases locks on hide).
 * Degrades silently where unsupported.
 */
export function useWakeLock(): void {
  useEffect(() => {
    if (!('wakeLock' in navigator)) return
    let lock: WakeLockSentinel | null = null
    let unmounted = false

    const request = async () => {
      try {
        lock = await navigator.wakeLock.request('screen')
      } catch {
        // unsupported, low battery, or hidden tab: fine either way
      }
    }
    void request()

    const onVisibility = () => {
      if (document.visibilityState === 'visible' && !unmounted) void request()
    }
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      unmounted = true
      document.removeEventListener('visibilitychange', onVisibility)
      void lock?.release().catch(() => {})
    }
  }, [])
}
