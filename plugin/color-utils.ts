/**
 * Color Utilities for zen-ui
 *
 * HSL-based color scale generation for heatmap levels.
 */

export interface HSL {
  h: number // 0-360
  s: number // 0-100
  l: number // 0-100
}

/**
 * Parses a hex color string to HSL values.
 * Supports #RGB, #RRGGBB formats.
 */
export function hexToHSL(hex: string): HSL {
  // Remove # if present
  hex = hex.replace(/^#/, '')

  // Expand shorthand (#RGB → #RRGGBB)
  if (hex.length === 3) {
    hex = hex
      .split('')
      .map((c) => c + c)
      .join('')
  }

  const r = parseInt(hex.slice(0, 2), 16) / 255
  const g = parseInt(hex.slice(2, 4), 16) / 255
  const b = parseInt(hex.slice(4, 6), 16) / 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const l = (max + min) / 2

  if (max === min) {
    // Achromatic (gray)
    return { h: 0, s: 0, l: l * 100 }
  }

  const d = max - min
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)

  let h: number
  switch (max) {
    case r:
      h = ((g - b) / d + (g < b ? 6 : 0)) / 6
      break
    case g:
      h = ((b - r) / d + 2) / 6
      break
    default:
      h = ((r - g) / d + 4) / 6
      break
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  }
}

/**
 * Converts HSL values to a CSS hsl() string.
 */
export function hslToCSS(hsl: HSL): string {
  return `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`
}

export interface ColorScaleOptions {
  maxLightness?: number // Lightness for lightest active level (default: 80)
  minLightness?: number // Lightness for darkest active level (default: 25)
  emptyLightness?: number // Lightness for level 0 (default: 92 light, 15 dark)
  darkMode?: boolean // If true, invert: brightest = highest level
}

/**
 * Generates a color scale for heatmap levels.
 *
 * Light mode (default):
 * - Level 0: very light tint (low activity background)
 * - Level 1: light shade
 * - Level N-1: dark shade (highest activity)
 *
 * Dark mode:
 * - Level 0: very dark tint
 * - Level 1: dark shade
 * - Level N-1: bright shade (highest activity)
 *
 * @param baseColor - Hex color string (e.g., "#40c463")
 * @param levelCount - Number of levels (2-10)
 * @param options - Optional configuration
 * @returns Array of CSS color strings, indexed by level
 */
export function generateColorScale(
  baseColor: string,
  levelCount: number,
  options: ColorScaleOptions = {},
): string[] {
  const {
    darkMode = false,
    maxLightness = 80,
    minLightness = 25,
    emptyLightness = darkMode ? 15 : 92,
  } = options

  const { h, s } = hexToHSL(baseColor)
  const colors: string[] = []

  // Level 0: very light (light mode) or very dark (dark mode) tint
  // Use lower saturation for the empty state to make it more neutral
  const emptySaturation = Math.max(5, Math.round(s * 0.3))
  colors.push(hslToCSS({ h, s: emptySaturation, l: emptyLightness }))

  const nonZeroLevels = levelCount - 1

  if (nonZeroLevels === 1) {
    // Only one non-zero level (binary mode): use original base color
    colors.push(baseColor)
  } else {
    // Distribute lightness across levels
    for (let i = 0; i < nonZeroLevels; i++) {
      const t = i / (nonZeroLevels - 1) // 0 to 1

      let l: number
      if (darkMode) {
        // Dark mode: level 1 = darkest, level N-1 = brightest
        l = minLightness + t * (maxLightness - minLightness)
      } else {
        // Light mode: level 1 = lightest, level N-1 = darkest
        l = maxLightness - t * (maxLightness - minLightness)
      }

      colors.push(hslToCSS({ h, s, l: Math.round(l) }))
    }
  }

  return colors
}

/**
 * Default GitHub-style green color scale (5 levels).
 */
export const GITHUB_GREEN_SCALE = [
  'transparent', // Level 0: no activity (was #ebedf0, now transparent per user request)
  '#9be9a8', // Level 1: lightest green
  '#40c463', // Level 2: light green
  '#30a14e', // Level 3: medium green
  '#216e39', // Level 4: dark green
]

/**
 * Default base color (GitHub green, middle intensity).
 */
export const DEFAULT_BASE_COLOR = '#40c463'
