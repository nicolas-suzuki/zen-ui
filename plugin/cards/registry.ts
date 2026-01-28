/**
 * Card Registry
 *
 * Maps card types to their renderers.
 */

import type { CSSResult } from 'lit'
import type { CardType } from '../config'
import type { CardRenderer } from './types'
import { heatmapCard } from './heatmap'

const cardRegistry: Record<CardType, CardRenderer> = {
  heatmap: heatmapCard,
}

export function getCardRenderer(cardType: CardType): CardRenderer {
  const renderer = cardRegistry[cardType]
  if (!renderer) {
    throw new Error(`Unknown card type: ${cardType}`)
  }
  return renderer
}

export function getAllCardStyles(): CSSResult[] {
  return Object.values(cardRegistry).map((r) => r.styles)
}
