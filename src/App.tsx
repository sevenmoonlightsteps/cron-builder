import { useState, useEffect, useMemo } from 'react'
import './index.css'
import { VisualBuilder } from './components/VisualBuilder'
import { ExpressionDisplay } from './components/ExpressionDisplay'
import { NextRuns } from './components/NextRuns'
import { Presets } from './components/Presets'
import { stateToExpression, validateExpression, explainExpression, expressionToState } from './lib/cron'
import { DEFAULT_STATE } from './lib/defaults'
import type { CronState } from './lib/types'

export default function App() {
  const [state, setState] = useState<CronState>(DEFAULT_STATE)
  const [manualExpression, setManualExpression] = useState<string | null>(null)
  const [timezone, setTimezone] = useState(() => {
    try { return Intl.DateTimeFormat().resolvedOptions().timeZone } catch { return 'UTC' }
  })
  const [runCount, setRunCount] = useState(5)

  // The active expression is either the user-typed one or built from state
  const builtExpression = useMemo(() => stateToExpression(state), [state])
  const expression = manualExpression ?? builtExpression

  const validation = useMemo(() => validateExpression(expression), [expression])
  const explanation = useMemo(
    () => (validation.valid ? explainExpression(expression) : ''),
    [expression, validation.valid],
  )

  // When state changes from the builder, clear manual override
  function handleStateChange(next: CronState) {
    setState(next)
    setManualExpression(null)
  }

  // When user pastes / types a raw expression, parse it back into state
  function handleExpressionChange(expr: string) {
    setManualExpression(expr.trim() || null)
    const next = expressionToState(expr, state)
    setState(next)
  }

  // When a preset is selected, apply it
  function handlePreset(expr: string) {
    const next = expressionToState(expr, state)
    setState(next)
    setManualExpression(null)
  }

  // Sync window title
  useEffect(() => {
    document.title = `${expression} - Cron Builder`
  }, [expression])

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-4 sm:p-6">
      <div className="max-w-5xl mx-auto flex flex-col gap-6">
        {/* Header */}
        <header className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold text-white tracking-tight">Cron Builder</h1>
          <p className="text-gray-400 text-sm">
            Build, explain, and preview cron expressions. Entirely client-side.
          </p>
        </header>

        {/* Expression display + explanation */}
        <ExpressionDisplay
          expression={expression}
          explanation={explanation}
          valid={validation.valid}
          error={validation.error}
          onExpressionChange={handleExpressionChange}
        />

        {/* Presets */}
        <Presets onSelect={handlePreset} currentExpression={expression} />

        {/* Visual builder */}
        <section className="flex flex-col gap-3">
          <VisualBuilder state={state} onChange={handleStateChange} />
        </section>

        {/* Next runs */}
        <NextRuns
          expression={expression}
          valid={validation.valid}
          timezone={timezone}
          count={runCount}
          onTimezoneChange={setTimezone}
          onCountChange={setRunCount}
        />

        {/* Footer */}
        <footer className="text-center text-xs text-gray-700 pb-4">
          Built with{' '}
          <a href="https://github.com/bradymholt/cronstrue" className="text-gray-600 hover:text-gray-500" target="_blank" rel="noopener noreferrer">cronstrue</a>
          {' '}+{' '}
          <a href="https://github.com/harrisiirak/cron-parser" className="text-gray-600 hover:text-gray-500" target="_blank" rel="noopener noreferrer">cron-parser</a>
          {' '}+{' '}
          <a href="https://vite.dev" className="text-gray-600 hover:text-gray-500" target="_blank" rel="noopener noreferrer">Vite</a>
          {' + '}
          <a href="https://react.dev" className="text-gray-600 hover:text-gray-500" target="_blank" rel="noopener noreferrer">React</a>
        </footer>
      </div>
    </div>
  )
}
