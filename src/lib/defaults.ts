import type { CronField, CronState } from './types'

export function wildcardField(min: number, max: number): CronField {
  return { mode: 'wildcard', values: [], step: 1, rangeStart: min, rangeEnd: max }
}

export const DEFAULT_STATE: CronState = {
  useSeconds: false,
  seconds:    wildcardField(0, 59),
  minutes:    wildcardField(0, 59),
  hours:      wildcardField(0, 23),
  dayOfMonth: wildcardField(1, 31),
  month:      wildcardField(1, 12),
  dayOfWeek:  wildcardField(0, 6),
}
