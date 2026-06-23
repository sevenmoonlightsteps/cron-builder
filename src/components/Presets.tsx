import { COMMON_PRESETS } from '../lib/types'

interface Props {
  onSelect: (expression: string) => void
  currentExpression: string
}

export function Presets({ onSelect, currentExpression }: Props) {
  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900 p-5 flex flex-col gap-3">
      <span className="text-sm font-semibold text-gray-300">Common presets</span>
      <div className="flex flex-wrap gap-2">
        {COMMON_PRESETS.map((p) => (
          <button
            key={p.expression}
            onClick={() => onSelect(p.expression)}
            title={p.description}
            className={[
              'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
              currentExpression === p.expression
                ? 'bg-violet-600 text-white'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white',
            ].join(' ')}
          >
            {p.label}
          </button>
        ))}
      </div>
    </div>
  )
}
