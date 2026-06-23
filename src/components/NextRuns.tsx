import { useMemo } from 'react'
import { getNextRuns } from '../lib/cron'
import { TIMEZONES } from '../lib/types'

interface Props {
  expression: string
  valid: boolean
  timezone: string
  count: number
  onTimezoneChange: (tz: string) => void
  onCountChange: (n: number) => void
}

export function NextRuns({ expression, valid, timezone, count, onTimezoneChange, onCountChange }: Props) {
  const runs = useMemo(
    () => (valid ? getNextRuns(expression, { count, timezone }) : []),
    [expression, valid, count, timezone],
  )

  function formatDate(d: Date): string {
    try {
      return new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      }).format(d)
    } catch {
      return d.toISOString()
    }
  }

  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900 p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <span className="text-sm font-semibold text-gray-300">Next run times</span>
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={count}
            onChange={(e) => onCountChange(parseInt(e.target.value))}
            className="bg-gray-800 border border-gray-700 rounded-lg px-2 py-1.5 text-sm text-gray-300 focus:outline-none focus:border-violet-500"
          >
            {[3, 5, 10, 20].map((n) => (
              <option key={n} value={n}>Next {n}</option>
            ))}
          </select>
          <select
            value={timezone}
            onChange={(e) => onTimezoneChange(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-lg px-2 py-1.5 text-sm text-gray-300 focus:outline-none focus:border-violet-500 max-w-[220px]"
          >
            {TIMEZONES.map((tz) => (
              <option key={tz} value={tz}>{tz}</option>
            ))}
          </select>
        </div>
      </div>

      {!valid ? (
        <p className="text-gray-600 text-sm py-4 text-center">Fix the expression to see next runs</p>
      ) : runs.length === 0 ? (
        <p className="text-gray-600 text-sm py-4 text-center">Could not compute runs for this expression</p>
      ) : (
        <ol className="flex flex-col gap-1.5">
          {runs.map((d, i) => (
            <li key={i} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-gray-800/60">
              <span className="text-xs text-gray-600 font-mono w-4 text-right">{i + 1}</span>
              <span className="font-mono text-sm text-gray-200">{formatDate(d)}</span>
              {i === 0 && (
                <span className="ml-auto text-xs text-violet-400 bg-violet-900/30 px-2 py-0.5 rounded-full shrink-0">
                  next
                </span>
              )}
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}
