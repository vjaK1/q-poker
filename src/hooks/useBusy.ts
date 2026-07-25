import { useState } from 'react'

/**
 * Wraps async actions with a busy flag and error capture, and prevents
 * double-taps: while one action runs, further runs are ignored.
 */
export function useBusy() {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function run(action: () => Promise<void>): Promise<void> {
    if (busy) return
    setBusy(true)
    setError(null)
    try {
      await action()
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setBusy(false)
    }
  }

  return { busy, error, run, clearError: () => setError(null) }
}
