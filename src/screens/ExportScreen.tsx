import { useEffect, useState } from 'react'
import { getSessionDetail, type SessionDetail } from '../lib/ledger'
import {
  buildSessionsCsv,
  buildTextExport,
  buildTransactionsCsv,
  type TextExportOptions,
} from '../lib/export'
import { logicalDayISO, sessionDisplayName } from '../lib/time'

function download(filename: string, content: string) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

/** Export screen (§5): live text preview with toggles, copy/share, CSV files. */
export function ExportScreen({
  sessionId,
  backLabel,
  onBack,
}: {
  sessionId: string
  backLabel: string
  onBack: () => void
}) {
  const [detail, setDetail] = useState<SessionDetail | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [opts, setOpts] = useState<TextExportOptions>({
    header: true,
    footer: true,
    sortByNet: false,
  })
  const [copied, setCopied] = useState(false)
  const [copyError, setCopyError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    getSessionDetail(sessionId)
      .then((d) => {
        if (!cancelled) setDetail(d)
      })
      .catch((err: unknown) => {
        if (!cancelled) setLoadError(err instanceof Error ? err.message : String(err))
      })
    return () => {
      cancelled = true
    }
  }, [sessionId])

  useEffect(() => {
    if (!copied) return
    const id = setTimeout(() => setCopied(false), 2000)
    return () => clearTimeout(id)
  }, [copied])

  if (loadError !== null) {
    return (
      <div className="screen">
        <p className="notice notice--error">{loadError}</p>
        <button className="btn" onClick={onBack}>
          Back
        </button>
      </div>
    )
  }

  if (detail === null) {
    return (
      <div className="screen screen--center">
        <p className="muted">Loading…</p>
      </div>
    )
  }

  const text = buildTextExport(detail.summary, opts)
  const day = logicalDayISO(detail.session.startedAt)
  const canShare = typeof navigator.share === 'function'

  const toggle = (key: keyof TextExportOptions, label: string) => (
    <label className="row" style={{ cursor: 'pointer' }}>
      <span className="row-main row-title" style={{ fontWeight: 500 }}>
        {label}
      </span>
      <input
        type="checkbox"
        checked={opts[key]}
        onChange={(e) => setOpts((o) => ({ ...o, [key]: e.target.checked }))}
      />
    </label>
  )

  return (
    <div className="screen">
      <header className="app-header">
        <button className="btn btn--inline" onClick={onBack}>
          ‹ {backLabel}
        </button>
        <span className="screen-title">Export · {sessionDisplayName(detail.session.startedAt)}</span>
        <span style={{ width: '4.5rem' }} />
      </header>

      <pre className="export-pre">{text}</pre>

      <div className="list">
        {toggle('header', 'Date header')}
        {toggle('footer', 'Totals footer')}
        {toggle('sortByNet', 'Sort by net (off = seat order)')}
      </div>

      <button
        className="btn btn--primary"
        onClick={() => {
          setCopyError(null)
          navigator.clipboard
            .writeText(text)
            .then(() => setCopied(true))
            .catch((err: unknown) =>
              setCopyError(err instanceof Error ? err.message : String(err)),
            )
        }}
      >
        {copied ? 'Copied ✓' : 'Copy to clipboard'}
      </button>
      {copyError !== null && <p className="notice notice--error">{copyError}</p>}

      {canShare && (
        <button
          className="btn"
          onClick={() => {
            navigator.share({ text }).catch(() => {
              /* user dismissed the share sheet */
            })
          }}
        >
          Share
        </button>
      )}

      <div className="btn-row">
        <button
          className="btn"
          onClick={() => download(`qpoker-transactions-${day}.csv`, buildTransactionsCsv(detail))}
        >
          transactions.csv
        </button>
        <button
          className="btn"
          onClick={() => download(`qpoker-sessions-${day}.csv`, buildSessionsCsv(detail))}
        >
          sessions.csv
        </button>
      </div>
    </div>
  )
}
