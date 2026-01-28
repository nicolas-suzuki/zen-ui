import { describe, it, expect } from 'vitest'
import {
  hexToHSL,
  hslToCSS,
  generateColorScale,
  DEFAULT_BASE_COLOR,
} from './color-utils'

describe('hexToHSL', () => {
  const testCases = [
    // Pure colors
    { name: 'red #FF0000', hex: '#FF0000', expected: { h: 0, s: 100, l: 50 } },
    {
      name: 'green #00FF00',
      hex: '#00FF00',
      expected: { h: 120, s: 100, l: 50 },
    },
    {
      name: 'blue #0000FF',
      hex: '#0000FF',
      expected: { h: 240, s: 100, l: 50 },
    },

    // Grayscale
    { name: 'white #FFFFFF', hex: '#FFFFFF', expected: { h: 0, s: 0, l: 100 } },
    { name: 'black #000000', hex: '#000000', expected: { h: 0, s: 0, l: 0 } },
    { name: 'gray #808080', hex: '#808080', expected: { h: 0, s: 0, l: 50 } },

    // Shorthand
    { name: 'shorthand #F00', hex: '#F00', expected: { h: 0, s: 100, l: 50 } },
    {
      name: 'shorthand #0F0',
      hex: '#0F0',
      expected: { h: 120, s: 100, l: 50 },
    },

    // Without hash
    {
      name: 'no hash FF0000',
      hex: 'FF0000',
      expected: { h: 0, s: 100, l: 50 },
    },

    // GitHub green (approximate values due to rounding)
    {
      name: 'GitHub green #40c463',
      hex: '#40c463',
      expected: { h: 136, s: 53, l: 51 },
    },
  ]

  it.each(testCases)('$name', ({ hex, expected }) => {
    const result = hexToHSL(hex)
    expect(result.h).toBeCloseTo(expected.h, 0)
    expect(result.s).toBeCloseTo(expected.s, 0)
    expect(result.l).toBeCloseTo(expected.l, 0)
  })
})

describe('hslToCSS', () => {
  it('formats HSL as CSS string', () => {
    expect(hslToCSS({ h: 120, s: 50, l: 75 })).toBe('hsl(120, 50%, 75%)')
  })

  it('handles zero values', () => {
    expect(hslToCSS({ h: 0, s: 0, l: 0 })).toBe('hsl(0, 0%, 0%)')
  })

  it('handles max values', () => {
    expect(hslToCSS({ h: 360, s: 100, l: 100 })).toBe('hsl(360, 100%, 100%)')
  })
})

describe('generateColorScale', () => {
  // Helper to extract lightness from HSL string
  const getLightness = (hsl: string): number => {
    const match = hsl.match(/hsl\(\d+, \d+%, (\d+)%\)/)
    return match ? parseInt(match[1]) : -1
  }

  it('generates correct number of colors', () => {
    expect(generateColorScale('#40c463', 2)).toHaveLength(2)
    expect(generateColorScale('#40c463', 5)).toHaveLength(5)
    expect(generateColorScale('#40c463', 10)).toHaveLength(10)
  })

  it('level 0 is a very light tint (not transparent)', () => {
    const colors = generateColorScale('#40c463', 5)
    // Level 0 should be a valid HSL color with high lightness
    expect(colors[0]).toMatch(/^hsl\(\d+, \d+%, \d+%\)$/)
    expect(getLightness(colors[0])).toBe(92) // Default empty lightness
  })

  it('level 0 has reduced saturation for neutral appearance', () => {
    const colors = generateColorScale('#40c463', 5) // s=53
    // Empty state should have ~16% saturation (53 * 0.3)
    expect(colors[0]).toMatch(/^hsl\(136, 16%, 92%\)$/)
  })

  it('preserves hue and saturation from base color for active levels', () => {
    const colors = generateColorScale('#40c463', 5) // GitHub green, h≈136, s≈53

    // Active levels (1+) should have same hue and saturation
    for (let i = 1; i < colors.length; i++) {
      expect(colors[i]).toMatch(/^hsl\(136, 53%/)
    }
  })

  describe('light mode (default)', () => {
    it('lightness decreases from level 1 to max level (light to dark)', () => {
      const colors = generateColorScale('#40c463', 5, {
        maxLightness: 80,
        minLightness: 20,
      })

      const lightnessValues = colors.slice(1).map(getLightness)

      // Level 1 should be lightest
      expect(lightnessValues[0]).toBe(80)
      // Level 4 should be darkest
      expect(lightnessValues[3]).toBe(20)
      // Should be in descending order
      for (let i = 1; i < lightnessValues.length; i++) {
        expect(lightnessValues[i]).toBeLessThan(lightnessValues[i - 1])
      }
    })
  })

  describe('dark mode', () => {
    it('lightness increases from level 1 to max level (dark to bright)', () => {
      const colors = generateColorScale('#40c463', 5, {
        darkMode: true,
        maxLightness: 80,
        minLightness: 20,
      })

      const lightnessValues = colors.slice(1).map(getLightness)

      // Level 1 should be darkest
      expect(lightnessValues[0]).toBe(20)
      // Level 4 should be brightest
      expect(lightnessValues[3]).toBe(80)
      // Should be in ascending order
      for (let i = 1; i < lightnessValues.length; i++) {
        expect(lightnessValues[i]).toBeGreaterThan(lightnessValues[i - 1])
      }
    })

    it('level 0 is very dark in dark mode', () => {
      const colors = generateColorScale('#40c463', 5, { darkMode: true })
      expect(getLightness(colors[0])).toBe(15) // Default dark mode empty lightness
    })

    it('custom empty lightness in dark mode', () => {
      const colors = generateColorScale('#40c463', 5, {
        darkMode: true,
        emptyLightness: 10,
      })
      expect(getLightness(colors[0])).toBe(10)
    })
  })

  it('works with levelCount=2 (binary)', () => {
    const colors = generateColorScale('#40c463', 2, {
      maxLightness: 80,
      minLightness: 20,
    })

    expect(colors).toHaveLength(2)
    expect(colors[0]).toMatch(/^hsl\(\d+, \d+%, \d+%\)$/) // Light tint, not transparent
    // Single non-zero level should be middle lightness
    expect(colors[1]).toMatch(/hsl\(136, 53%, 50%\)/)
  })

  it('uses custom lightness range', () => {
    const colors = generateColorScale('#FF0000', 3, {
      maxLightness: 90,
      minLightness: 10,
    })

    expect(colors[0]).toMatch(/^hsl\(0, 30%, 92%\)$/) // Light tint with reduced saturation
    expect(colors[1]).toBe('hsl(0, 100%, 90%)') // Lightest active
    expect(colors[2]).toBe('hsl(0, 100%, 10%)') // Darkest active
  })

  it('works with default base color', () => {
    const colors = generateColorScale(DEFAULT_BASE_COLOR, 5)

    expect(colors).toHaveLength(5)
    // All colors should be valid HSL
    for (const color of colors) {
      expect(color).toMatch(/^hsl\(\d+, \d+%, \d+%\)$/)
    }
  })

  describe('levelCount variations', () => {
    const levelCounts = [2, 3, 4, 5, 6, 7, 8, 9, 10]

    it.each(levelCounts)('generates %i levels correctly', (levelCount) => {
      const colors = generateColorScale('#40c463', levelCount)

      expect(colors).toHaveLength(levelCount)

      // All levels should be valid HSL (allowing decimal percentages)
      for (const color of colors) {
        expect(color).toMatch(/^hsl\(\d+, \d+%, [\d.]+%\)$/)
      }
    })
  })
})
