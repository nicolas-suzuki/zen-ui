import { describe, it, expect } from 'vitest'
import { calculateGridPositions, dayNameToRow } from './grid'
import type { BoundedDay } from '../../data-pipeline'

// Helper to create a BoundedDay
const day = (date: string, count = 0, level = 0): BoundedDay => ({
  date,
  count,
  level,
})

// Helper to generate consecutive days from a start date
const generateDays = (startDate: string, count: number): BoundedDay[] => {
  const days: BoundedDay[] = []
  const current = new Date(startDate)
  for (let i = 0; i < count; i++) {
    days.push(day(current.toISOString().split('T')[0]))
    current.setDate(current.getDate() + 1)
  }
  return days
}

describe('calculateGridPositions', () => {
  describe('row calculation (day of week alignment)', () => {
    it('places days in correct rows with Sunday start', () => {
      // 2024-01-07 is a Sunday
      const days = generateDays('2024-01-07', 7) // Sun-Sat
      const positions = calculateGridPositions(days, 0) // Sunday start

      expect(positions[0].row).toBe(0) // Sunday → row 0
      expect(positions[1].row).toBe(1) // Monday → row 1
      expect(positions[2].row).toBe(2) // Tuesday → row 2
      expect(positions[3].row).toBe(3) // Wednesday → row 3
      expect(positions[4].row).toBe(4) // Thursday → row 4
      expect(positions[5].row).toBe(5) // Friday → row 5
      expect(positions[6].row).toBe(6) // Saturday → row 6
    })

    it('places days in correct rows with Monday start', () => {
      // 2024-01-08 is a Monday
      const days = generateDays('2024-01-08', 7) // Mon-Sun
      const positions = calculateGridPositions(days, 1) // Monday start

      expect(positions[0].row).toBe(0) // Monday → row 0
      expect(positions[1].row).toBe(1) // Tuesday → row 1
      expect(positions[2].row).toBe(2) // Wednesday → row 2
      expect(positions[3].row).toBe(3) // Thursday → row 3
      expect(positions[4].row).toBe(4) // Friday → row 4
      expect(positions[5].row).toBe(5) // Saturday → row 5
      expect(positions[6].row).toBe(6) // Sunday → row 6
    })

    it('handles mid-week start with Sunday weekStart', () => {
      // 2024-01-01 is a Monday
      const days = generateDays('2024-01-01', 7)
      const positions = calculateGridPositions(days, 0) // Sunday start

      // Monday should be row 1 (not row 0)
      expect(positions[0].row).toBe(1) // Monday → row 1
      expect(positions[1].row).toBe(2) // Tuesday → row 2
      expect(positions[6].row).toBe(0) // Sunday → row 0
    })

    it('handles mid-week start with Monday weekStart', () => {
      // 2024-01-03 is a Wednesday
      const days = generateDays('2024-01-03', 7)
      const positions = calculateGridPositions(days, 1) // Monday start

      // Wednesday should be row 2 (not row 0)
      expect(positions[0].row).toBe(2) // Wednesday → row 2
      expect(positions[1].row).toBe(3) // Thursday → row 3
      expect(positions[4].row).toBe(6) // Sunday → row 6
      expect(positions[5].row).toBe(0) // Monday → row 0
    })
  })

  describe('column calculation (calendar week alignment)', () => {
    it('places full weeks in sequential columns', () => {
      // 2024-01-07 is a Sunday, start of a week for Sunday weekStart
      const days = generateDays('2024-01-07', 14) // 2 weeks
      const positions = calculateGridPositions(days, 0)

      // First week: col 0
      for (let i = 0; i < 7; i++) {
        expect(positions[i].col).toBe(0)
      }
      // Second week: col 1
      for (let i = 7; i < 14; i++) {
        expect(positions[i].col).toBe(1)
      }
    })

    it('handles partial first week correctly (Jan 1 on Wednesday, Sunday start)', () => {
      // 2024-01-01 is a Monday
      // With Sunday start, Jan 1 (Mon) is day 1 of week, so offset = 1
      const days = generateDays('2024-01-01', 14)
      const positions = calculateGridPositions(days, 0) // Sunday start

      // Jan 1-6 (Mon-Sat) should be in col 0
      // Jan 7 (Sun) should start col 1
      expect(positions[0].col).toBe(0) // Jan 1 (Mon)
      expect(positions[5].col).toBe(0) // Jan 6 (Sat)
      expect(positions[6].col).toBe(1) // Jan 7 (Sun) - new week
      expect(positions[7].col).toBe(1) // Jan 8 (Mon)
      expect(positions[13].col).toBe(2) // Jan 14 (Sun) - new week
    })

    it('handles partial first week correctly (Jan 1 on Wednesday, Monday start)', () => {
      // 2025-01-01 is a Wednesday
      const days = generateDays('2025-01-01', 14)
      const positions = calculateGridPositions(days, 1) // Monday start

      // Jan 1 (Wed) is day 2 of week with Monday start, offset = 2
      // Jan 1-5 (Wed-Sun) in col 0
      // Jan 6 (Mon) starts col 1
      expect(positions[0].col).toBe(0) // Jan 1 (Wed)
      expect(positions[0].row).toBe(2) // Wednesday = row 2
      expect(positions[4].col).toBe(0) // Jan 5 (Sun)
      expect(positions[4].row).toBe(6) // Sunday = row 6
      expect(positions[5].col).toBe(1) // Jan 6 (Mon) - new week
      expect(positions[5].row).toBe(0) // Monday = row 0
    })
  })

  describe('full year scenarios', () => {
    it('correctly positions year starting on Wednesday (2025)', () => {
      // 2025-01-01 is a Wednesday
      const days = generateDays('2025-01-01', 365)
      const positions = calculateGridPositions(days, 0) // Sunday start

      // Check first day
      const jan1 = positions[0]
      expect(jan1.day.date).toBe('2025-01-01')
      expect(jan1.row).toBe(3) // Wednesday = row 3 (Sunday start)
      expect(jan1.col).toBe(0) // First column

      // Check first Sunday (Jan 5)
      const jan5 = positions[4]
      expect(jan5.day.date).toBe('2025-01-05')
      expect(jan5.row).toBe(0) // Sunday = row 0
      expect(jan5.col).toBe(1) // Second column (new week)

      // Verify row 0-2 in col 0 are empty (no days rendered there)
      const col0Days = positions.filter((p) => p.col === 0)
      expect(col0Days.every((p) => p.row >= 3)).toBe(true)
    })

    it('correctly positions year starting on Monday (2024)', () => {
      // 2024-01-01 is a Monday
      const days = generateDays('2024-01-01', 366) // leap year
      const positions = calculateGridPositions(days, 1) // Monday start

      // Check first day
      const jan1 = positions[0]
      expect(jan1.day.date).toBe('2024-01-01')
      expect(jan1.row).toBe(0) // Monday = row 0 (Monday start)
      expect(jan1.col).toBe(0) // First column

      // Full week, so all rows should be filled in col 0
      const col0Days = positions.filter((p) => p.col === 0)
      expect(col0Days.length).toBe(7)
      expect(col0Days.map((p) => p.row).sort()).toEqual([0, 1, 2, 3, 4, 5, 6])
    })

    it('correctly positions year starting on Saturday (2022)', () => {
      // 2022-01-01 is a Saturday
      const days = generateDays('2022-01-01', 365)
      const positions = calculateGridPositions(days, 0) // Sunday start

      // Check first day
      const jan1 = positions[0]
      expect(jan1.day.date).toBe('2022-01-01')
      expect(jan1.row).toBe(6) // Saturday = row 6 (Sunday start)
      expect(jan1.col).toBe(0)

      // Jan 2 (Sunday) should be col 1, row 0
      const jan2 = positions[1]
      expect(jan2.day.date).toBe('2022-01-02')
      expect(jan2.row).toBe(0) // Sunday = row 0
      expect(jan2.col).toBe(1) // New week
    })
  })

  describe('edge cases', () => {
    it('returns empty array for empty input', () => {
      const positions = calculateGridPositions([], 0)
      expect(positions).toEqual([])
    })

    it('handles single day', () => {
      const days = [day('2024-01-15')] // Monday
      const positions = calculateGridPositions(days, 1)

      expect(positions.length).toBe(1)
      expect(positions[0].row).toBe(0) // Monday = row 0
      expect(positions[0].col).toBe(0)
    })
  })
})

describe('dayNameToRow', () => {
  it('returns correct rows for Sunday start', () => {
    expect(dayNameToRow('Sun', 0)).toBe(0)
    expect(dayNameToRow('Mon', 0)).toBe(1)
    expect(dayNameToRow('Tue', 0)).toBe(2)
    expect(dayNameToRow('Wed', 0)).toBe(3)
    expect(dayNameToRow('Thu', 0)).toBe(4)
    expect(dayNameToRow('Fri', 0)).toBe(5)
    expect(dayNameToRow('Sat', 0)).toBe(6)
  })

  it('returns correct rows for Monday start', () => {
    expect(dayNameToRow('Mon', 1)).toBe(0)
    expect(dayNameToRow('Tue', 1)).toBe(1)
    expect(dayNameToRow('Wed', 1)).toBe(2)
    expect(dayNameToRow('Thu', 1)).toBe(3)
    expect(dayNameToRow('Fri', 1)).toBe(4)
    expect(dayNameToRow('Sat', 1)).toBe(5)
    expect(dayNameToRow('Sun', 1)).toBe(6)
  })
})
