import { useEffect, useState } from 'react'
import { applyTheme } from '../lib/theme'

/** Navigation start: both the hold and the pulse phase are measured from here. */
const BOOT_AT = performance.timeOrigin
/** Hold the launch screen at least this long: a full breath, never a flash (1.5s, Victor's call). */
const MIN_MS = 1500
/** Must match the `breathe` animation duration in index.css. */
const PERIOD_MS = 2400

/**
 * True once the launch screen has been up for MIN_MS since the page loaded.
 * Both boot phases (auth check, then live-state load) consult it, so a fast
 * load still shows one calm breath instead of a flicker.
 */
export function useLaunchHold(): boolean {
  const [done, setDone] = useState(() => Date.now() - BOOT_AT >= MIN_MS)
  useEffect(() => {
    if (done) return
    const id = setTimeout(() => setDone(true), Math.max(0, MIN_MS - (Date.now() - BOOT_AT)))
    return () => clearTimeout(id)
  }, [done])
  return done
}

/**
 * The Q.Poker mark breathing on the splash ground (§6). index.html paints the
 * same markup before React loads, and the pulse phase is measured from page
 * load, so the boot phases hand over without a restart or a flash.
 */
export function LaunchScreen() {
  useEffect(() => {
    // Keep the browser chrome on the splash ground while we're up, then hand
    // the theme colour back to the active theme.
    const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')
    const ground = getComputedStyle(document.documentElement)
      .getPropertyValue('--splash-bg')
      .trim()
    if (meta && ground) meta.content = ground
    return () => applyTheme()
  }, [])

  const phase = (Date.now() - BOOT_AT) % PERIOD_MS
  return (
    <div className="launch" role="status" aria-label="Loading Q.Poker">
      <img
        className="launch-mark"
        src="/icon-512.png"
        width={96}
        height={96}
        alt=""
        style={{ animationDelay: `-${phase}ms` }}
      />
    </div>
  )
}
