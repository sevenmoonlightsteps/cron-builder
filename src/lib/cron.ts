// Pure cron logic: assemble expression from state, validate, compute next runs.
// Libs: cronstrue (explanation), cron-parser v5 (next runs).

import cronstrue from 'cronstrue'
import { CronExpressionParser } from 'cron-parser'
import type { CronField, CronState, FieldKey } from './types'
import { ORDERED_FIELDS, ORDERED_FIELDS_WITH_SECONDS } from './types'

// ---- Field -> expression segment ----

export function fieldToSegment(field: CronField): string {
  switch (field.mode) {
    case 'wildcard':
      return '*'
    case 'every':
      return '*'
    case 'every-n':
      return `*/${field.step}`
    case 'specific':
      return field.values.length > 0 ? field.values.join(',') : '*'
    case 'range':
      return `${field.rangeStart}-${field.rangeEnd}`
  }
}

// ---- State -> expression string ----

export function stateToExpression(state: CronState): string {
  const fields = state.useSeconds ? ORDERED_FIELDS_WITH_SECONDS : ORDERED_FIELDS
  const parts = fields.map((key) => fieldToSegment(state[key as FieldKey]))
  return parts.join(' ')
}

// ---- Validate expression ----

export interface ValidationResult {
  valid: boolean
  error?: string
  fieldCount?: number
}

export function validateExpression(expression: string): ValidationResult {
  const trimmed = expression.trim()
  if (!trimmed) return { valid: false, error: 'Expression is empty' }

  const parts = trimmed.split(/\s+/)
  if (parts.length < 5 || parts.length > 6) {
    return {
      valid: false,
      error: `Expected 5 or 6 fields, got ${parts.length}`,
    }
  }

  // Use cron-parser to validate; it will throw on invalid syntax
  // For 6-field expressions, treat the first field as seconds
  let exprToParse = trimmed
  const hasSeconds = parts.length === 6
  if (hasSeconds) {
    // Strip seconds field for cron-parser (which handles standard 5-field)
    exprToParse = parts.slice(1).join(' ')
  }

  try {
    CronExpressionParser.parse(exprToParse)
    return { valid: true, fieldCount: parts.length }
  } catch (err: unknown) {
    return {
      valid: false,
      error: err instanceof Error ? err.message : 'Invalid expression',
    }
  }
}

// ---- Explain expression ----

export function explainExpression(expression: string): string {
  const trimmed = expression.trim()
  if (!trimmed) return ''

  const parts = trimmed.split(/\s+/)
  // cronstrue handles both 5 and 6 field expressions
  try {
    return cronstrue.toString(trimmed, {
      use24HourTimeFormat: false,
      verbose: true,
      // For 6-field, tell cronstrue to include seconds
      ...(parts.length === 6 ? { includeSeconds: true } : {}),
    })
  } catch {
    return 'Unable to explain this expression'
  }
}

// ---- Compute next N run times ----

export interface NextRunOptions {
  count?: number
  timezone?: string
  baseDate?: Date
}

export function getNextRuns(expression: string, options: NextRunOptions = {}): Date[] {
  const { count = 5, timezone = 'UTC', baseDate = new Date() } = options
  const trimmed = expression.trim()
  if (!trimmed) return []

  const parts = trimmed.split(/\s+/)
  // For 6-field (with seconds), strip seconds and parse the remaining 5
  // lazy: seconds field stripped; upgrade when cron-parser v5 exposes a seconds option
  const exprToParse = parts.length === 6 ? parts.slice(1).join(' ') : trimmed

  try {
    const iter = CronExpressionParser.parse(exprToParse, {
      currentDate: baseDate,
      tz: timezone,
    })

    const results: Date[] = []
    for (let i = 0; i < count; i++) {
      const next = iter.next()
      results.push(next.toDate())
    }
    return results
  } catch {
    return []
  }
}

// ---- Parse expression string back to field states ----

function parseSegment(segment: string, _min: number, _max: number): CronField {
  if (segment === '*') {
    return { mode: 'wildcard', values: [], step: 1, rangeStart: _min, rangeEnd: _max }
  }
  const everyNMatch = /^\*\/(\d+)$/.exec(segment)
  if (everyNMatch) {
    return { mode: 'every-n', values: [], step: parseInt(everyNMatch[1], 10), rangeStart: _min, rangeEnd: _max }
  }
  const rangeMatch = /^(\d+)-(\d+)$/.exec(segment)
  if (rangeMatch) {
    return {
      mode: 'range',
      values: [],
      step: 1,
      rangeStart: parseInt(rangeMatch[1], 10),
      rangeEnd: parseInt(rangeMatch[2], 10),
    }
  }
  // Comma-separated specific values
  const values = segment.split(',').map((v) => parseInt(v.trim(), 10)).filter((v) => !isNaN(v))
  if (values.length > 0) {
    return { mode: 'specific', values, step: 1, rangeStart: _min, rangeEnd: _max }
  }
  return { mode: 'wildcard', values: [], step: 1, rangeStart: _min, rangeEnd: _max }
}

export function expressionToState(expression: string, currentState: CronState): CronState {
  const parts = expression.trim().split(/\s+/)
  const hasSeconds = parts.length === 6

  // With seconds: parts[0]=sec, [1]=min, [2]=hr, [3]=dom, [4]=mon, [5]=dow
  // Without:      parts[0]=min, [1]=hr,  [2]=dom, [3]=mon, [4]=dow
  const offset = hasSeconds ? 0 : -1
  const get = (idx: number): string => parts[idx + offset] ?? '*'

  return {
    ...currentState,
    useSeconds: hasSeconds,
    seconds:    parseSegment(get(0), 0, 59),
    minutes:    parseSegment(get(1), 0, 59),
    hours:      parseSegment(get(2), 0, 23),
    dayOfMonth: parseSegment(get(3), 1, 31),
    month:      parseSegment(get(4), 1, 12),
    dayOfWeek:  parseSegment(get(5), 0, 6),
  }
}
