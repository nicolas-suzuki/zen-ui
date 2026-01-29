/**
 * Data Sources
 *
 * Unified interface for fetching data from various sources:
 * - Entity attributes (pre-aggregated data)
 * - Home Assistant history API (limited to purge_keep_days)
 * - Statistics API (long-term, never purged)
 */

export * from './types'
export * from './history'
export * from './attribute'
export * from './statistics'
