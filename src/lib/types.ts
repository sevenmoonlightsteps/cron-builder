// Field value types for the visual cron builder

export type FieldMode = 'every' | 'every-n' | 'specific' | 'range' | 'wildcard'

export interface CronField {
  mode: FieldMode
  // specific: list of values
  values: number[]
  // every-n: step value
  step: number
  // range: start and end
  rangeStart: number
  rangeEnd: number
}

export interface CronState {
  useSeconds: boolean
  seconds: CronField
  minutes: CronField
  hours: CronField
  dayOfMonth: CronField
  month: CronField
  dayOfWeek: CronField
}

export interface ParsedExpression {
  expression: string
  valid: boolean
  error?: string
  explanation?: string
}

export const FIELD_META = {
  seconds:    { label: 'Seconds',       min: 0,  max: 59,  names: undefined },
  minutes:    { label: 'Minutes',       min: 0,  max: 59,  names: undefined },
  hours:      { label: 'Hours',         min: 0,  max: 23,  names: undefined },
  dayOfMonth: { label: 'Day of Month',  min: 1,  max: 31,  names: undefined },
  month:      { label: 'Month',         min: 1,  max: 12,
    names: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'] },
  dayOfWeek:  { label: 'Day of Week',   min: 0,  max: 6,
    names: ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'] },
} as const

export type FieldKey = keyof typeof FIELD_META

export const ORDERED_FIELDS: FieldKey[] = [
  'minutes','hours','dayOfMonth','month','dayOfWeek'
]

export const ORDERED_FIELDS_WITH_SECONDS: FieldKey[] = [
  'seconds','minutes','hours','dayOfMonth','month','dayOfWeek'
]

export const COMMON_PRESETS: { label: string; expression: string; description: string }[] = [
  { label: 'Every minute',    expression: '* * * * *',      description: 'Runs once every minute' },
  { label: 'Every 5 min',     expression: '*/5 * * * *',    description: 'Every 5 minutes' },
  { label: 'Every 15 min',    expression: '*/15 * * * *',   description: 'Every 15 minutes' },
  { label: 'Every 30 min',    expression: '*/30 * * * *',   description: 'Every 30 minutes' },
  { label: 'Hourly',          expression: '0 * * * *',      description: 'Top of every hour' },
  { label: 'Daily midnight',  expression: '0 0 * * *',      description: 'Once a day at midnight' },
  { label: 'Daily 9 AM',      expression: '0 9 * * *',      description: 'Every day at 9:00 AM' },
  { label: 'Weekdays 9 AM',   expression: '0 9 * * 1-5',   description: 'Weekdays at 9:00 AM' },
  { label: 'Weekly Sunday',   expression: '0 0 * * 0',      description: 'Every Sunday at midnight' },
  { label: 'Monthly 1st',     expression: '0 0 1 * *',      description: 'First day of each month at midnight' },
  { label: 'Yearly Jan 1',    expression: '0 0 1 1 *',      description: 'January 1st at midnight' },
]

export const TIMEZONES = Intl.supportedValuesOf
  ? Intl.supportedValuesOf('timeZone')
  : ['UTC', 'America/New_York', 'America/Los_Angeles', 'Europe/London', 'Europe/Paris', 'Asia/Tokyo']
