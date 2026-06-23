import { useState } from 'react'

interface Props {
  expression: string
  explanation: string
  valid: boolean
  error?: string
  onExpressionChange: (expr: string) => void
}

export function ExpressionDisplay({ expression, explanation, valid, error, onExpressionChange }: Props) {
  const [copied, setCopied] = useState(false)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')

  function startEdit() {
    setDraft(expression)
    setEditing(true)
  }

  function commitEdit() {
    onExpressionChange(draft)
    setEditing(false)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') commitEdit()
    if (e.key === 'Escape') setEditing(false)
  }

  function copy() {
    navigator.clipboard.writeText(expression).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }

  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900 p-5 flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Expression</span>
        {valid
          ? <span className="text-xs text-emerald-400 bg-emerald-900/30 px-2 py-0.5 rounded-full">valid</span>
          : <span className="text-xs text-red-400 bg-red-900/30 px-2 py-0.5 rounded-full">invalid</span>
        }
      </div>

      {/* Expression input / display */}
      <div className="flex items-center gap-2">
        {editing ? (
          <input
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commitEdit}
            onKeyDown={handleKeyDown}
            className="flex-1 font-mono text-2xl bg-gray-800 border border-violet-500 rounded-lg px-4 py-2 text-violet-100 focus:outline-none"
          />
        ) : (
          <button
            onClick={startEdit}
            title="Click to edit expression"
            className="flex-1 font-mono text-2xl bg-gray-800 hover:bg-gray-700 rounded-lg px-4 py-2 text-violet-100 text-left transition-colors cursor-text"
          >
            {expression}
          </button>
        )}
        <button
          onClick={copy}
          title="Copy to clipboard"
          className="shrink-0 px-3 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm transition-colors"
        >
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>

      {/* Explanation */}
      {valid && explanation && (
        <p className="text-gray-300 text-sm leading-relaxed bg-gray-800/50 rounded-lg px-4 py-3">
          {explanation}
        </p>
      )}

      {/* Error */}
      {!valid && error && (
        <p className="text-red-400 text-sm bg-red-900/20 rounded-lg px-4 py-3 border border-red-800/50">
          {error}
        </p>
      )}

      {/* Paste hint */}
      {!editing && (
        <p className="text-xs text-gray-600">Click the expression to edit or paste your own</p>
      )}
    </div>
  )
}
