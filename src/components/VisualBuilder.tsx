import type { CronState, FieldKey } from '../lib/types'
import { FIELD_META } from '../lib/types'
import { FieldEditor } from './FieldEditor'

interface Props {
  state: CronState
  onChange: (state: CronState) => void
}

const FIVE_FIELD_ORDER: FieldKey[] = ['minutes', 'hours', 'dayOfMonth', 'month', 'dayOfWeek']
const SIX_FIELD_ORDER: FieldKey[] = ['seconds', 'minutes', 'hours', 'dayOfMonth', 'month', 'dayOfWeek']

export function VisualBuilder({ state, onChange }: Props) {
  const fields = state.useSeconds ? SIX_FIELD_ORDER : FIVE_FIELD_ORDER

  function updateField(key: FieldKey) {
    return (field: CronState[FieldKey]) => onChange({ ...state, [key]: field })
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-gray-300">Visual builder</span>
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <span className="text-xs text-gray-400">Include seconds</span>
          <button
            role="switch"
            aria-checked={state.useSeconds}
            onClick={() => onChange({ ...state, useSeconds: !state.useSeconds })}
            className={[
              'relative w-9 h-5 rounded-full transition-colors focus:outline-none',
              state.useSeconds ? 'bg-violet-600' : 'bg-gray-700',
            ].join(' ')}
          >
            <span
              className={[
                'absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform',
                state.useSeconds ? 'translate-x-4' : 'translate-x-0',
              ].join(' ')}
            />
          </button>
        </label>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
        {fields.map((key) => {
          const meta = FIELD_META[key]
          return (
            <FieldEditor
              key={key}
              label={meta.label}
              field={state[key]}
              min={meta.min}
              max={meta.max}
              names={meta.names}
              onChange={updateField(key)}
            />
          )
        })}
      </div>
    </div>
  )
}
