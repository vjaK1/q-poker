import type { ReactNode } from 'react'

/** Bottom sheet. Tapping the backdrop dismisses (same as Cancel). */
export function Sheet({ onClose, children }: { onClose: () => void; children: ReactNode }) {
  return (
    <div
      className="sheet-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="sheet" role="dialog" aria-modal="true">
        {children}
      </div>
    </div>
  )
}
