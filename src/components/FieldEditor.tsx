import type { CronField, FieldMode } from '../lib/types'

interface Props {
  label: string
  field: CronField
  min: number
  max: number
  names?: readonly string[]
  onChange: (field: CronField) => void
}

const MODES: { value: FieldMode; label: string }[] = [
  { value: 'wildcard',  label: 'Any (*)' },
  { value: 'every-n',  label: 'Every N' },
  { value: 'specific', label: 'Specific' },
  { value: 'range',    label: 'Range' },
]

function valueLabel(v: number, names?: readonly string[]): string {
  return names ? `${names[v - (names.length === 12 ? 1 : 0)] ?? v} (${v})` : String(v)
}

export function FieldEditor({ label, field, min, max, names, onChange }: Props) {
  const nums = Array.from({ length: max - min + 1 }, (_, i) => min + i)

  const update = (patch: Partial<CronField>) => onChange({ ...field, ...patch })

  return (
    <div className="bg-gray-900 rounded-xl p-4 border border-gray-800 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-violet-300 uppercase tracking-wide">{label}</span>
        <span className="font-mono text-xs bg-gray-800 px-2 py-0.5 rounded text-gray-300">
          {fieldPreview(field)}
        </span>
      </div>

      {/* Mode selector */}
      <div className="flex flex-wrap gap-1.5">
        {MODES.map((m) => (
          <button
            key={m.value}
            onClick={() => update({ mode: m.value })}
            className={[
              'px-2.5 py-1 rounded-lg text-xs font-medium transition-colors',
              field.mode === m.value
                ? 'bg-violet-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-200',
            ].join(' ')}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* Mode-specific controls */}
      {field.mode === 'every-n' && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">Every</span>
          <input
            type="number"
            min={1}
            max={max}
            value={field.step}
            onChange={(e) => update({ step: Math.max(1, parseInt(e.target.value) || 1) })}
            className="w-16 bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm text-gray-200 focus:outline-none focus:border-violet-500"
          />
          <span className="text-xs text-gray-400">units</span>
        </div>
      )}

      {field.mode === 'range' && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-gray-400">From</span>
          <select
            value={field.rangeStart}
            onChange={(e) => update({ rangeStart: parseInt(e.target.value) })}
            className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm text-gray-200 focus:outline-none focus:border-violet-500"
          >
            {nums.map((v) => (
              <option key={v} value={v}>{valueLabel(v, names)}</option>
            ))}
          </select>
          <span className="text-xs text-gray-400">to</span>
          <select
            value={field.rangeEnd}
            onChange={(e) => update({ rangeEnd: parseInt(e.target.value) })}
            className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm text-gray-200 focus:outline-none focus:border-violet-500"
          >
            {nums.map((v) => (
              <option key={v} value={v}>{valueLabel(v, names)}</option>
            ))}
          </select>
        </div>
      )}

      {field.mode === 'specific' && (
        <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto pr-1">
          {nums.map((v) => {
            const selected = field.values.includes(v)
            return (
              <button
                key={v}
                onClick={() => {
                  const next = selected
                    ? field.values.filter((x) => x !== v)
                    : [...field.values, v].sort((a, b) => a - b)
                  update({ values: next })
                }}
                className={[
                  'px-2 py-0.5 rounded text-xs font-mono transition-colors',
                  selected
                    ? 'bg-violet-600 text-white'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700',
                ].join(' ')}
              >
                {names ? names[v - (names.length === 12 ? 1 : 0)] ?? v : v}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

function fieldPreview(field: CronField): string {
  switch (field.mode) {
    case 'wildcard': return '*'
    case 'every':   return '*'
    case 'every-n': return `*/${field.step}`
    case 'specific': return field.values.length ? field.values.join(',') : '*'
    case 'range':   return `${field.rangeStart}-${field.rangeEnd}`
  }
}
