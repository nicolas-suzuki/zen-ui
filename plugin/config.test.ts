import { describe, it, expect } from 'vitest'
import { validateConfig, CONFIG_DEFAULTS } from './config'

describe('validateConfig', () => {
  describe('required fields', () => {
    it('throws if config is not an object', () => {
      expect(() => validateConfig(null)).toThrow('Configuration must be an object')
      expect(() => validateConfig(undefined)).toThrow('Configuration must be an object')
      expect(() => validateConfig('string')).toThrow('Configuration must be an object')
    })

    it('throws if entity is missing', () => {
      expect(() => validateConfig({})).toThrow('Invalid key')
    })

    it('throws if entity is empty string', () => {
      expect(() => validateConfig({ entity: '' })).toThrow('You need to define an entity')
      expect(() => validateConfig({ entity: '   ' })).toThrow('You need to define an entity')
    })

    it('accepts valid entity', () => {
      const config = validateConfig({ entity: 'sensor.test' })
      expect(config.entity).toBe('sensor.test')
    })
  })

  describe('defaults', () => {
    it('applies all defaults for minimal config', () => {
      const config = validateConfig({ entity: 'sensor.test' })

      expect(config.card).toBe(CONFIG_DEFAULTS.card)
      expect(config.range).toBe(CONFIG_DEFAULTS.range)
      expect(config.years).toBe(CONFIG_DEFAULTS.years)
      expect(config.weekStartDay).toBe(CONFIG_DEFAULTS.weekStartDay)
      expect(config.levelCount).toBe(CONFIG_DEFAULTS.levelCount)
      expect(config.baseColor).toBe(CONFIG_DEFAULTS.baseColor)
      expect(config.show_legend).toBe(CONFIG_DEFAULTS.show_legend)
      expect(config.attribute).toBe(CONFIG_DEFAULTS.attribute)
    })
  })

  describe('card type validation', () => {
    it('defaults to heatmap when not specified', () => {
      const config = validateConfig({ entity: 'e' })
      expect(config.card).toBe('heatmap')
    })

    it('accepts valid card type', () => {
      expect(validateConfig({ entity: 'e', card: 'heatmap' }).card).toBe('heatmap')
    })

    it('falls back to default for invalid card type', () => {
      expect(validateConfig({ entity: 'e', card: 'invalid' }).card).toBe('heatmap')
      expect(validateConfig({ entity: 'e', card: 123 }).card).toBe('heatmap')
    })
  })

  describe('range validation', () => {
    it('accepts valid range values', () => {
      expect(validateConfig({ entity: 'e', range: 'rolling' }).range).toBe('rolling')
      expect(validateConfig({ entity: 'e', range: 'year' }).range).toBe('year')
    })

    it('falls back to default for invalid range', () => {
      expect(validateConfig({ entity: 'e', range: 'invalid' }).range).toBe('rolling')
      expect(validateConfig({ entity: 'e', range: 123 }).range).toBe('rolling')
    })
  })

  describe('years validation', () => {
    it('accepts valid years', () => {
      expect(validateConfig({ entity: 'e', years: 1 }).years).toBe(1)
      expect(validateConfig({ entity: 'e', years: 3 }).years).toBe(3)
      expect(validateConfig({ entity: 'e', years: 10 }).years).toBe(10)
    })

    it('falls back to default for invalid years', () => {
      expect(validateConfig({ entity: 'e', years: 0 }).years).toBe(1)
      expect(validateConfig({ entity: 'e', years: -1 }).years).toBe(1)
      expect(validateConfig({ entity: 'e', years: 1.5 }).years).toBe(1)
      expect(validateConfig({ entity: 'e', years: 'two' }).years).toBe(1)
    })
  })

  describe('weekStartDay validation', () => {
    it('accepts string values (case-insensitive)', () => {
      expect(validateConfig({ entity: 'e', weekStartDay: 'sunday' }).weekStartDay).toBe('sunday')
      expect(validateConfig({ entity: 'e', weekStartDay: 'Sunday' }).weekStartDay).toBe('sunday')
      expect(validateConfig({ entity: 'e', weekStartDay: 'SUNDAY' }).weekStartDay).toBe('sunday')
      expect(validateConfig({ entity: 'e', weekStartDay: 'monday' }).weekStartDay).toBe('monday')
      expect(validateConfig({ entity: 'e', weekStartDay: 'Monday' }).weekStartDay).toBe('monday')
      expect(validateConfig({ entity: 'e', weekStartDay: 'MONDAY' }).weekStartDay).toBe('monday')
    })

    it('accepts short forms', () => {
      expect(validateConfig({ entity: 'e', weekStartDay: 'sun' }).weekStartDay).toBe('sunday')
      expect(validateConfig({ entity: 'e', weekStartDay: 'Sun' }).weekStartDay).toBe('sunday')
      expect(validateConfig({ entity: 'e', weekStartDay: 'mon' }).weekStartDay).toBe('monday')
      expect(validateConfig({ entity: 'e', weekStartDay: 'Mon' }).weekStartDay).toBe('monday')
    })

    it('accepts legacy number values', () => {
      expect(validateConfig({ entity: 'e', weekStartDay: 0 }).weekStartDay).toBe('sunday')
      expect(validateConfig({ entity: 'e', weekStartDay: 1 }).weekStartDay).toBe('monday')
    })

    it('falls back to default for invalid weekStartDay', () => {
      expect(validateConfig({ entity: 'e', weekStartDay: 2 }).weekStartDay).toBe('monday')
      expect(validateConfig({ entity: 'e', weekStartDay: -1 }).weekStartDay).toBe('monday')
      expect(validateConfig({ entity: 'e', weekStartDay: 'tuesday' }).weekStartDay).toBe('monday')
      expect(validateConfig({ entity: 'e', weekStartDay: 'invalid' }).weekStartDay).toBe('monday')
    })
  })

  describe('levelCount validation', () => {
    it('accepts valid levelCount (2-10)', () => {
      expect(validateConfig({ entity: 'e', levelCount: 2 }).levelCount).toBe(2)
      expect(validateConfig({ entity: 'e', levelCount: 5 }).levelCount).toBe(5)
      expect(validateConfig({ entity: 'e', levelCount: 10 }).levelCount).toBe(10)
    })

    it('falls back to default for invalid levelCount', () => {
      expect(validateConfig({ entity: 'e', levelCount: 1 }).levelCount).toBe(5)
      expect(validateConfig({ entity: 'e', levelCount: 11 }).levelCount).toBe(5)
      expect(validateConfig({ entity: 'e', levelCount: 0 }).levelCount).toBe(5)
      expect(validateConfig({ entity: 'e', levelCount: 'five' }).levelCount).toBe(5)
    })
  })

  describe('baseColor validation', () => {
    it('accepts valid hex colors', () => {
      expect(validateConfig({ entity: 'e', baseColor: '#fff' }).baseColor).toBe('#fff')
      expect(validateConfig({ entity: 'e', baseColor: '#FFF' }).baseColor).toBe('#FFF')
      expect(validateConfig({ entity: 'e', baseColor: '#40c463' }).baseColor).toBe('#40c463')
      expect(validateConfig({ entity: 'e', baseColor: '#AABBCC' }).baseColor).toBe('#AABBCC')
    })

    it('falls back to default for invalid colors', () => {
      expect(validateConfig({ entity: 'e', baseColor: 'red' }).baseColor).toBe('#40c463')
      expect(validateConfig({ entity: 'e', baseColor: '#gg0000' }).baseColor).toBe('#40c463')
      expect(validateConfig({ entity: 'e', baseColor: 'ffffff' }).baseColor).toBe('#40c463')
      expect(validateConfig({ entity: 'e', baseColor: '#12345' }).baseColor).toBe('#40c463')
    })
  })

  describe('levelThresholds validation', () => {
    it('accepts thresholds matching levelCount', () => {
      // levelCount=5 needs 4 thresholds
      const config = validateConfig({
        entity: 'e',
        levelCount: 5,
        levelThresholds: [25, 50, 75, 90],
      })
      expect(config.levelThresholds).toEqual([25, 50, 75, 90])
    })

    it('ignores thresholds with wrong length', () => {
      // levelCount=5 needs 4 thresholds, but we provide 3
      const config = validateConfig({
        entity: 'e',
        levelCount: 5,
        levelThresholds: [25, 50, 75],
      })
      expect(config.levelThresholds).toBeUndefined()
    })

    it('validates against default levelCount when not specified', () => {
      // Default levelCount=5 needs 4 thresholds
      const config = validateConfig({
        entity: 'e',
        levelThresholds: [25, 50, 75, 90],
      })
      expect(config.levelThresholds).toEqual([25, 50, 75, 90])
    })
  })

  describe('optional fields passthrough', () => {
    it('passes through title', () => {
      expect(validateConfig({ entity: 'e', title: 'My Graph' }).title).toBe('My Graph')
      expect(validateConfig({ entity: 'e' }).title).toBeUndefined()
    })

    it('passes through end_date', () => {
      expect(validateConfig({ entity: 'e', end_date: '2024-12-31' }).end_date).toBe('2024-12-31')
    })


  })
})
