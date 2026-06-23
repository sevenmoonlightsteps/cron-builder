import { describe, it, expect } from 'vitest'
import {
  fieldToSegment,
  stateToExpression,
  validateExpression,
  explainExpression,
  getNextRuns,
  expressionToState,
} from '../lib/cron'
import { DEFAULT_STATE } from '../lib/defaults'
import type { CronField, CronState } from '../lib/types'

// ---- fieldToSegment ----

describe('fieldToSegment', () => {
  it('wildcard mode returns *', () => {
    const f: CronField = { mode: 'wildcard', values: [], step: 1, rangeStart: 0, rangeEnd: 59 }
    expect(fieldToSegment(f)).toBe('*')
  })

  it('every mode returns *', () => {
    const f: CronField = { mode: 'every', values: [], step: 1, rangeStart: 0, rangeEnd: 59 }
    expect(fieldToSegment(f)).toBe('*')
  })

  it('every-n mode with step 5 returns */5', () => {
    const f: CronField = { mode: 'every-n', values: [], step: 5, rangeStart: 0, rangeEnd: 59 }
    expect(fieldToSegment(f)).toBe('*/5')
  })

  it('specific mode with values returns comma-joined string', () => {
    const f: CronField = { mode: 'specific', values: [1, 3, 5], step: 1, rangeStart: 0, rangeEnd: 6 }
    expect(fieldToSegment(f)).toBe('1,3,5')
  })

  it('specific mode with no values returns *', () => {
    const f: CronField = { mode: 'specific', values: [], step: 1, rangeStart: 0, rangeEnd: 59 }
    expect(fieldToSegment(f)).toBe('*')
  })

  it('range mode returns start-end', () => {
    const f: CronField = { mode: 'range', values: [], step: 1, rangeStart: 9, rangeEnd: 17 }
    expect(fieldToSegment(f)).toBe('9-17')
  })
})

// ---- stateToExpression ----

describe('stateToExpression', () => {
  it('default state produces * * * * *', () => {
    expect(stateToExpression(DEFAULT_STATE)).toBe('* * * * *')
  })

  it('every-n on minutes produces */5 * * * *', () => {
    const s: CronState = {
      ...DEFAULT_STATE,
      minutes: { mode: 'every-n', values: [], step: 5, rangeStart: 0, rangeEnd: 59 },
    }
    expect(stateToExpression(s)).toBe('*/5 * * * *')
  })

  it('specific hour 9, minute 0, produces 0 9 * * *', () => {
    const s: CronState = {
      ...DEFAULT_STATE,
      minutes: { mode: 'specific', values: [0], step: 1, rangeStart: 0, rangeEnd: 59 },
      hours:   { mode: 'specific', values: [9], step: 1, rangeStart: 0, rangeEnd: 23 },
    }
    expect(stateToExpression(s)).toBe('0 9 * * *')
  })

  it('weekdays range produces 0 9 * * 1-5 when hours and minutes set', () => {
    const s: CronState = {
      ...DEFAULT_STATE,
      minutes:   { mode: 'specific', values: [0],  step: 1, rangeStart: 0, rangeEnd: 59 },
      hours:     { mode: 'specific', values: [9],  step: 1, rangeStart: 0, rangeEnd: 23 },
      dayOfWeek: { mode: 'range', values: [], step: 1, rangeStart: 1, rangeEnd: 5 },
    }
    expect(stateToExpression(s)).toBe('0 9 * * 1-5')
  })

  it('useSeconds=true produces 6-field expression', () => {
    const s: CronState = {
      ...DEFAULT_STATE,
      useSeconds: true,
    }
    expect(stateToExpression(s)).toBe('* * * * * *')
  })
})

// ---- validateExpression ----

describe('validateExpression', () => {
  it('valid 5-field expression returns valid=true', () => {
    expect(validateExpression('0 9 * * 1-5').valid).toBe(true)
  })

  it('valid 6-field expression returns valid=true', () => {
    expect(validateExpression('0 0 9 * * 1-5').valid).toBe(true)
  })

  it('empty string is invalid', () => {
    const r = validateExpression('')
    expect(r.valid).toBe(false)
    expect(r.error).toContain('empty')
  })

  it('4-field expression is invalid (wrong count)', () => {
    const r = validateExpression('0 9 * *')
    expect(r.valid).toBe(false)
    expect(r.error).toMatch(/4/)
  })

  it('7-field expression is invalid (wrong count)', () => {
    const r = validateExpression('0 0 9 * * 1 extra')
    expect(r.valid).toBe(false)
    expect(r.error).toMatch(/7/)
  })

  it('invalid range returns valid=false with an error', () => {
    const r = validateExpression('0 99 * * *')
    expect(r.valid).toBe(false)
    expect(r.error).toBeTruthy()
  })

  it('* * * * * is valid', () => {
    expect(validateExpression('* * * * *').valid).toBe(true)
  })

  it('*/5 * * * * is valid', () => {
    expect(validateExpression('*/5 * * * *').valid).toBe(true)
  })
})

// ---- explainExpression ----

describe('explainExpression', () => {
  it('explains every minute', () => {
    const r = explainExpression('* * * * *')
    expect(r.toLowerCase()).toContain('minute')
  })

  it('explains daily at 9 AM', () => {
    const r = explainExpression('0 9 * * *')
    expect(r).toContain('9:00 AM')
  })

  it('explains weekdays', () => {
    const r = explainExpression('0 9 * * 1-5')
    expect(r.toLowerCase()).toMatch(/monday|weekday/)
  })

  it('returns fallback string for unparseable expression', () => {
    const r = explainExpression('not a cron')
    expect(typeof r).toBe('string')
    expect(r.length).toBeGreaterThan(0)
  })
})

// ---- getNextRuns ----

describe('getNextRuns', () => {
  // Pin a base date for determinism: 2026-01-01 00:00:00 UTC (Thursday)
  const base = new Date('2026-01-01T00:00:00.000Z')

  it('returns requested count of results', () => {
    const runs = getNextRuns('* * * * *', { count: 5, timezone: 'UTC', baseDate: base })
    expect(runs).toHaveLength(5)
  })

  it('returns empty array for invalid expression', () => {
    const runs = getNextRuns('99 99 99 99 99', { count: 5, timezone: 'UTC', baseDate: base })
    expect(runs).toHaveLength(0)
  })

  it('returns empty array for empty expression', () => {
    expect(getNextRuns('', { count: 3, timezone: 'UTC', baseDate: base })).toHaveLength(0)
  })

  it('every minute: first run is 1 minute after base', () => {
    const runs = getNextRuns('* * * * *', { count: 1, timezone: 'UTC', baseDate: base })
    expect(runs[0].toISOString()).toBe('2026-01-01T00:01:00.000Z')
  })

  it('daily at 09:00 UTC: next run from midnight Jan 1 is Jan 1 09:00', () => {
    const runs = getNextRuns('0 9 * * *', { count: 1, timezone: 'UTC', baseDate: base })
    expect(runs[0].toISOString()).toBe('2026-01-01T09:00:00.000Z')
  })

  it('daily at 09:00 UTC: second run is Jan 2 09:00', () => {
    const runs = getNextRuns('0 9 * * *', { count: 2, timezone: 'UTC', baseDate: base })
    expect(runs[1].toISOString()).toBe('2026-01-02T09:00:00.000Z')
  })

  it('weekdays 09:00 UTC: Jan 1 2026 is Thu; first run is Jan 1 09:00', () => {
    // Jan 1 2026 is Thursday (weekday), so first run same day
    const runs = getNextRuns('0 9 * * 1-5', { count: 1, timezone: 'UTC', baseDate: base })
    expect(runs[0].toISOString()).toBe('2026-01-01T09:00:00.000Z')
  })

  it('weekdays 09:00 UTC: 5 consecutive runs all fall Mon-Fri', () => {
    const runs = getNextRuns('0 9 * * 1-5', { count: 5, timezone: 'UTC', baseDate: base })
    expect(runs).toHaveLength(5)
    runs.forEach((d) => {
      const day = d.getUTCDay()
      expect(day).toBeGreaterThanOrEqual(1)
      expect(day).toBeLessThanOrEqual(5)
    })
  })

  it('every 5 min: 3 runs are spaced 5 minutes apart', () => {
    const runs = getNextRuns('*/5 * * * *', { count: 3, timezone: 'UTC', baseDate: base })
    expect(runs).toHaveLength(3)
    expect(runs[1].getTime() - runs[0].getTime()).toBe(5 * 60 * 1000)
    expect(runs[2].getTime() - runs[1].getTime()).toBe(5 * 60 * 1000)
  })

  it('monthly on 1st: next run from Jan 1 is Feb 1', () => {
    // Base is Jan 1 00:00 UTC; monthly at midnight: first hit is Feb 1
    const runs = getNextRuns('0 0 1 * *', { count: 1, timezone: 'UTC', baseDate: base })
    expect(runs[0].toISOString()).toBe('2026-02-01T00:00:00.000Z')
  })
})

// ---- expressionToState ----

describe('expressionToState', () => {
  it('parses wildcard expression to all-wildcard state', () => {
    const s = expressionToState('* * * * *', DEFAULT_STATE)
    expect(s.minutes.mode).toBe('wildcard')
    expect(s.hours.mode).toBe('wildcard')
    expect(s.useSeconds).toBe(false)
  })

  it('parses every-n for minutes', () => {
    const s = expressionToState('*/5 * * * *', DEFAULT_STATE)
    expect(s.minutes.mode).toBe('every-n')
    expect(s.minutes.step).toBe(5)
  })

  it('parses specific values for minutes and hours', () => {
    const s = expressionToState('0 9 * * *', DEFAULT_STATE)
    expect(s.minutes.mode).toBe('specific')
    expect(s.minutes.values).toEqual([0])
    expect(s.hours.mode).toBe('specific')
    expect(s.hours.values).toEqual([9])
  })

  it('parses range for dayOfWeek', () => {
    const s = expressionToState('0 9 * * 1-5', DEFAULT_STATE)
    expect(s.dayOfWeek.mode).toBe('range')
    expect(s.dayOfWeek.rangeStart).toBe(1)
    expect(s.dayOfWeek.rangeEnd).toBe(5)
  })

  it('detects 6-field expression and sets useSeconds=true', () => {
    const s = expressionToState('0 0 9 * * 1-5', DEFAULT_STATE)
    expect(s.useSeconds).toBe(true)
  })
})
