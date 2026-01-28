/**
 * Heatmap Card Styles
 *
 * Styles specific to the heatmap card type.
 */

import { css } from 'lit'

export const heatmapStyles = css`
  .graph-container {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    width: 100%;
    overflow-x: auto;
  }

  svg {
    width: 100%;
    max-width: 800px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial,
      sans-serif;
  }

  text {
    font-size: 10px;
    fill: var(--secondary-text-color);
  }

  rect {
    shape-rendering: geometricPrecision;
    rx: 2;
    ry: 2;
  }

  .legend {
    display: flex;
    align-items: center;
    gap: 3px;
    font-size: 11px;
    font-weight: 500;
    color: var(--secondary-text-color);
    margin-top: 4px;
    font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI',
      Roboto, sans-serif;
  }

  .legend span {
    margin: 0 4px;
  }

  .legend-item {
    width: 10px;
    height: 10px;
    border-radius: 2px;
  }

  .year-graph {
    width: 100%;
    margin-bottom: 16px;
  }

  .year-graph:last-child {
    margin-bottom: 8px;
  }

  .year-label {
    font-size: 13px;
    font-weight: 600;
    color: var(--secondary-text-color);
    margin-bottom: 6px;
    margin-left: 30px;
    font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI',
      Roboto, sans-serif;
    letter-spacing: -0.01em;
  }
`
