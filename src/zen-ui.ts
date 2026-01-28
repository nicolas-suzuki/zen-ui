import { LitElement, html, css, svg } from 'lit'
import { customElement, property, state } from 'lit/decorators.js'
import {
  processHeatmapData,
  type PipelineConfig,
  type HeatmapData,
} from './data-pipeline'
import { generateColorScale } from './color-utils'
import {
  validateConfig,
  weekStartDayToNumber,
  type HeatmapConfig,
} from './config'

@customElement('zen-ui')
export class ZenUI extends LitElement {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  @property({ attribute: false }) public hass?: any

  updated(changedProps: Map<string, unknown>): void {
    if (changedProps.has('hass')) {
      this._updateDarkMode()
    }
  }
  @state() private _config?: HeatmapConfig
  @state() private _darkMode = false
  @state() private _tooltip?: { x: number; y: number; date: string; count: number }

  private _darkModeMediaQuery?: MediaQueryList
  private _darkModeObserver?: MutationObserver

  public setConfig(config: unknown): void {
    this._config = validateConfig(config)
  }

  public getCardSize(): number {
    return 3
  }

  connectedCallback(): void {
    super.connectedCallback()
    this._setupDarkModeDetection()
  }

  disconnectedCallback(): void {
    super.disconnectedCallback()
    this._cleanupDarkModeDetection()
  }

  private _setupDarkModeDetection(): void {
    // Listen for media query changes
    this._darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    this._darkModeMediaQuery.addEventListener('change', this._onDarkModeChange)

    // Observe body/html for class changes (for HA and demo toggle)
    this._darkModeObserver = new MutationObserver(this._onDarkModeChange)
    this._darkModeObserver.observe(document.body, {
      attributes: true,
      attributeFilter: ['class'],
    })
    this._darkModeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    })

    // Initial detection
    this._updateDarkMode()
  }

  private _cleanupDarkModeDetection(): void {
    this._darkModeMediaQuery?.removeEventListener(
      'change',
      this._onDarkModeChange,
    )
    this._darkModeObserver?.disconnect()
  }

  private _onDarkModeChange = (): void => {
    this._updateDarkMode()
  }

  private _updateDarkMode(): void {
    this._darkMode = this._detectDarkMode()
  }

  private _detectDarkMode(): boolean {
    // Check Home Assistant theme (preferred method)
    if (this.hass?.themes?.darkMode !== undefined) {
      return this.hass.themes.darkMode
    }
    // Fallback: Check media query
    if (window.matchMedia?.('(prefers-color-scheme: dark)').matches) {
      return true
    }
    // Fallback: Check for .dark class on body or html (for demo page)
    if (
      document.body.classList.contains('dark') ||
      document.documentElement.classList.contains('dark')
    ) {
      return true
    }
    return false
  }

  static styles = css`
    :host {
      display: block;
      --ha-card-background: var(--card-background-color, #fff);
      --primary-text-color: var(--primary-text-color, #24292f);
      --secondary-text-color: var(--secondary-text-color, #57606a);

      /* Default GitHub Light Theme Colors */
      --gh-c-0: #ebedf0;
      --gh-c-1: #9be9a8;
      --gh-c-2: #40c463;
      --gh-c-3: #30a14e;
      --gh-c-4: #216e39;
    }

    @media (prefers-color-scheme: dark) {
      :host {
        --primary-text-color: #c9d1d9;
        --secondary-text-color: #8b949e;
        --gh-c-0: #161b22;
        --gh-c-1: #0e4429;
        --gh-c-2: #006d32;
        --gh-c-3: #26a641;
        --gh-c-4: #39d353;
      }
    }

    /* Support class-based or attribute-based dark mode (e.g. from HA or Demo) */
    :host-context(.dark),
    :host-context([dark]) {
      --primary-text-color: #c9d1d9;
      --secondary-text-color: #8b949e;
      --gh-c-0: #161b22;
      --gh-c-1: #0e4429;
      --gh-c-2: #006d32;
      --gh-c-3: #26a641;
      --gh-c-4: #39d353;
    }

    ha-card {
      padding: 20px 24px;
      display: flex;
      flex-direction: column;
      align-items: center;
      background: var(--ha-card-background);
      color: var(--primary-text-color);
    }
    .header {
      width: 100%;
      font-size: 18px;
      font-weight: 600;
      letter-spacing: -0.02em;
      margin-bottom: 20px;
      color: var(--primary-text-color);
      text-align: left;
      font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', Roboto, sans-serif;
    }
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
      font-family:
        -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial,
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
      font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', Roboto, sans-serif;
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
      font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', Roboto, sans-serif;
      letter-spacing: -0.01em;
    }
    .tooltip {
      position: fixed;
      padding: 8px 12px;
      background: var(--primary-text-color);
      color: var(--ha-card-background);
      border-radius: 8px;
      font-size: 12px;
      font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', Roboto, sans-serif;
      pointer-events: none;
      z-index: 1000;
      white-space: nowrap;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      transform: translate(-50%, -100%) translateY(-8px);
    }
    .tooltip::after {
      content: '';
      position: absolute;
      top: 100%;
      left: 50%;
      transform: translateX(-50%);
      border: 6px solid transparent;
      border-top-color: var(--primary-text-color);
    }
    .tooltip-date {
      font-weight: 600;
      margin-bottom: 2px;
    }
    .tooltip-count {
      opacity: 0.8;
      font-weight: 500;
    }
  `

  private _getRawData(): unknown {
    if (!this._config || !this.hass) return []

    const entityId = this._config.entity
    const stateObj = this.hass.states[entityId]

    if (!stateObj) return []

    const attr = this._config.attribute || 'data'
    return stateObj.attributes[attr]
  }

  private _getPipelineConfig(): PipelineConfig {
    const config = this._config!
    const today = config.end_date ? new Date(config.end_date) : new Date()

    return {
      mode: config.range === 'year' ? 'fixed' : 'rolling',
      years: config.years,
      targetYear: today.getFullYear(),
      weekStartDay: weekStartDayToNumber(config.weekStartDay),
      levelCount: config.levelCount,
      levelThresholds: config.levelThresholds,
    }
  }

  private _onCellMouseEnter(e: MouseEvent, date: string, count: number): void {
    const rect = (e.target as SVGRectElement).getBoundingClientRect()
    this._tooltip = {
      x: rect.left + rect.width / 2,
      y: rect.top,
      date,
      count,
    }
  }

  private _onCellMouseLeave(): void {
    this._tooltip = undefined
  }

  private _formatTooltipDate(dateStr: string): string {
    const date = new Date(dateStr)
    return date.toLocaleDateString('default', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  private _getColorScale(): string[] {
    const config = this._config!
    return generateColorScale(config.baseColor, config.levelCount, {
      darkMode: this._darkMode,
    })
  }

  private _renderYearGraph(
    heatmapData: HeatmapData,
    colorScale: string[],
    weekStart: 0 | 1,
    isYearMode: boolean,
    showYearLabel: boolean,
  ) {
    const RECT_SIZE = 10
    const GAP = 3
    const STEP = RECT_SIZE + GAP
    const X_START = 30
    const Y_START = 20

    // Build month labels from the processed weeks
    const monthStartColumns = new Map<number, number>()

    heatmapData.weeks.forEach((week, colIndex) => {
      for (const day of week) {
        const date = new Date(day.date)
        if (date.getDate() === 1) {
          const month = date.getMonth()
          if (!monthStartColumns.has(month)) {
            monthStartColumns.set(month, colIndex)
          }
        }
      }
    })

    // Generate month labels
    const labels = []
    const sortedMonths = Array.from(monthStartColumns.entries()).sort(
      (a, b) => a[1] - b[1],
    )

    // For year mode, ensure Jan is labeled at column 0 if not found
    if (isYearMode && !monthStartColumns.has(0)) {
      sortedMonths.unshift([0, 0])
    }

    let lastLabelPos = -999
    for (const [month, col] of sortedMonths) {
      if (col - lastLabelPos > 2) {
        const name = new Date(2000, month, 1).toLocaleString('default', {
          month: 'short',
        })
        labels.push(svg`<text x="${col * STEP}" y="-7">${name}</text>`)
        lastLabelPos = col
      }
    }

    const width = heatmapData.weeks.length * STEP - GAP
    const height = 7 * STEP - GAP

    // Day labels based on week start day
    const dayLabels =
      weekStart === 0
        ? [
            { row: 1, label: 'Mon' },
            { row: 3, label: 'Wed' },
            { row: 5, label: 'Fri' },
          ]
        : [
            { row: 1, label: 'Tue' },
            { row: 3, label: 'Thu' },
            { row: 5, label: 'Sat' },
          ]

    const yearLabel = heatmapData.range.label || ''

    return html`
      <div class="year-graph">
        ${showYearLabel ? html`<div class="year-label">${yearLabel}</div>` : ''}
        <svg viewBox="0 0 ${X_START + width + 5} ${Y_START + height + 2}">
          <g transform="translate(${X_START}, ${Y_START})">
            ${labels}
            ${heatmapData.weeks.map(
              (week, wIndex) => svg`
                  <g transform="translate(${wIndex * STEP}, 0)">
                      ${week.map((day, dIndex) => {
                        const color =
                          colorScale[day.level] ??
                          colorScale[colorScale.length - 1]
                        return svg`
                              <rect
                                  width="${RECT_SIZE}"
                                  height="${RECT_SIZE}"
                                  x="0"
                                  y="${dIndex * STEP}"
                                  fill="${color}"
                                  style="cursor: pointer;"
                                  @mouseenter=${(e: MouseEvent) => this._onCellMouseEnter(e, day.date, day.count)}
                                  @mouseleave=${this._onCellMouseLeave}
                              />
                          `
                      })}
                  </g>
              `,
            )}
            ${dayLabels.map(
              ({ row, label }) => svg`
                  <text x="-5" y="${row * STEP + 9}" text-anchor="end" style="font-size: 9px;">${label}</text>
              `,
            )}
          </g>
        </svg>
      </div>
    `
  }

  render() {
    if (!this._config || !this.hass) return html``

    const rawData = this._getRawData()
    const pipelineConfig = this._getPipelineConfig()
    const colorScale = this._getColorScale()
    const isYearMode = this._config.range === 'year'
    const weekStart = pipelineConfig.weekStartDay ?? 1

    // Process data through pipeline (returns array of years)
    const heatmapDataArray = processHeatmapData(pipelineConfig, rawData)

    if (heatmapDataArray.length === 0) return html``

    const showYearLabels = heatmapDataArray.length > 1

    // Render legend items dynamically based on levelCount
    const legendItems = colorScale.map((color) => {
      const style =
        color === 'transparent'
          ? 'background-color: transparent; border: 1px solid var(--secondary-text-color);'
          : `background-color: ${color};`
      return html`<div class="legend-item" style="${style}"></div>`
    })

    const cardStyle = this._config.backgroundColor
      ? `background-color: ${this._config.backgroundColor};`
      : ''

    return html`
      <ha-card style="${cardStyle}">
        ${this._config.title
          ? html`<div class="header">${this._config.title}</div>`
          : ''}
        <div class="graph-container">
          ${heatmapDataArray.map((heatmapData) =>
            this._renderYearGraph(
              heatmapData,
              colorScale,
              weekStart as 0 | 1,
              isYearMode,
              showYearLabels,
            ),
          )}
          <div class="legend">
            <span>Less</span>
            ${legendItems}
            <span>More</span>
          </div>
        </div>
      </ha-card>
      ${this._tooltip
        ? html`
            <div
              class="tooltip"
              style="left: ${this._tooltip.x}px; top: ${this._tooltip.y}px;"
            >
              <div class="tooltip-date">
                ${this._formatTooltipDate(this._tooltip.date)}
              </div>
              <div class="tooltip-count">${this._tooltip.count}</div>
            </div>
          `
        : ''}
    `
  }
}
