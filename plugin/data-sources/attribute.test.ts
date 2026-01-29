import { describe, it, expect } from 'vitest'
import { getAttributeData } from './attribute'
import type { Hass } from './types'

// Helper to create mock hass object
function createMockHass(
  states: Record<string, { attributes: Record<string, unknown> }>,
): Hass {
  return {
    states: Object.fromEntries(
      Object.entries(states).map(([entityId, { attributes }]) => [
        entityId,
        {
          state: 'on',
          attributes,
          last_changed: '2025-01-27T00:00:00Z',
          last_updated: '2025-01-27T00:00:00Z',
        },
      ]),
    ),
    callApi: async () => ({}),
    callWS: async () => ({}),
  }
}

describe('getAttributeData', () => {
  it('returns empty array when entity does not exist', () => {
    const hass = createMockHass({})

    const result = getAttributeData(hass, {
      entityId: 'sensor.nonexistent',
      attribute: 'data',
    })

    expect(result).toEqual([])
  })

  it('returns empty array when attribute does not exist', () => {
    const hass = createMockHass({
      'sensor.test': { attributes: { other: 'value' } },
    })

    const result = getAttributeData(hass, {
      entityId: 'sensor.test',
      attribute: 'data',
    })

    expect(result).toEqual([])
  })

  it('returns empty array when attribute is not an array', () => {
    const hass = createMockHass({
      'sensor.test': { attributes: { data: 'not an array' } },
    })

    const result = getAttributeData(hass, {
      entityId: 'sensor.test',
      attribute: 'data',
    })

    expect(result).toEqual([])
  })

  it('returns empty array when attribute is empty array', () => {
    const hass = createMockHass({
      'sensor.test': { attributes: { data: [] } },
    })

    const result = getAttributeData(hass, {
      entityId: 'sensor.test',
      attribute: 'data',
    })

    expect(result).toEqual([])
  })

  it('returns data from attribute array', () => {
    const hass = createMockHass({
      'sensor.test': {
        attributes: {
          data: [
            { date: '2025-01-27', count: 10 },
            { date: '2025-01-28', count: 20 },
          ],
        },
      },
    })

    const result = getAttributeData(hass, {
      entityId: 'sensor.test',
      attribute: 'data',
    })

    expect(result).toEqual([
      { date: '2025-01-27', count: 10 },
      { date: '2025-01-28', count: 20 },
    ])
  })

  it('filters out invalid entries', () => {
    const hass = createMockHass({
      'sensor.test': {
        attributes: {
          data: [
            { date: '2025-01-27', count: 10 },
            { date: '2025-01-28' }, // missing count
            { count: 30 }, // missing date
            { date: 123, count: 40 }, // wrong date type
            { date: '2025-01-29', count: '50' }, // wrong count type
            null,
            'invalid',
            { date: '2025-01-30', count: 60 },
          ],
        },
      },
    })

    const result = getAttributeData(hass, {
      entityId: 'sensor.test',
      attribute: 'data',
    })

    expect(result).toEqual([
      { date: '2025-01-27', count: 10 },
      { date: '2025-01-30', count: 60 },
    ])
  })

  it('uses custom attribute name', () => {
    const hass = createMockHass({
      'sensor.test': {
        attributes: {
          history: [{ date: '2025-01-27', count: 100 }],
        },
      },
    })

    const result = getAttributeData(hass, {
      entityId: 'sensor.test',
      attribute: 'history',
    })

    expect(result).toEqual([{ date: '2025-01-27', count: 100 }])
  })
})
