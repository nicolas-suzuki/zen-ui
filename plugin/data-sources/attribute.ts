/**
 * Data Sources - Entity Attribute
 *
 * Gets data from an entity's attribute (for sensors that store historical data).
 */

import type { Hass, DataPoint } from './types'

export interface GetAttributeDataOptions {
  entityId: string
  attribute: string
}

/**
 * Gets data from an entity's attribute
 * Expects the attribute to contain an array of { date, count } objects
 */
export function getAttributeData(
  hass: Hass,
  options: GetAttributeDataOptions,
): DataPoint[] {
  const { entityId, attribute } = options

  const stateObj = hass.states[entityId]
  if (!stateObj) return []

  const data = stateObj.attributes[attribute]
  if (!data || !Array.isArray(data) || data.length === 0) {
    return []
  }

  // Validate and normalize the data
  return data
    .filter(
      (item): item is { date: string; count: number } =>
        typeof item === 'object' &&
        item !== null &&
        'date' in item &&
        'count' in item &&
        typeof item.date === 'string' &&
        typeof item.count === 'number',
    )
    .map((item) => ({ date: item.date, count: item.count }))
}
