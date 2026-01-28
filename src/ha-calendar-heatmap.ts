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

@customElement('ha-calendar-heatmap')
export class HACalendarHeatmap extends LitElement {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  @property({ attribute: false }) public hass?: any
  @state() private _config?: HeatmapConfig
  @state() private _darkMode = false

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
    // Explicit config override
    if (this._config?.darkMode !== undefined) {
      return this._config.darkMode
    }
    // Check media query
    if (window.matchMedia?.('(prefers-color-scheme: dark)').matches) {
      return true
    }
    // Check for .dark class on body or html
    if (
      document.body.classList.contains('dark') ||
      document.documentElement.classList.contains('dark')
    ) {
      return true
    }
    // Check for [dark] attribute
    if (document.body.hasAttribute('dark') || this.closest('[dark]')) {
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
      padding: 16px;
      display: flex;
      flex-direction: column;
      align-items: center;
      background: var(--ha-card-background);
      color: var(--primary-text-color);
    }
    .header {
      width: 100%;
      font-size: 16px;
      margin-bottom: 16px;
      color: var(--primary-text-color);
      text-align: left;
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
      gap: 4px;
      font-size: 10px;
      color: var(--secondary-text-color);
      margin-top: 8px;
    }
    .legend-item {
      width: 10px;
      height: 10px;
      border-radius: 2px;
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

  private _getColorScale(): string[] {
    const config = this._config!

    // Use legacy colors array if provided
    if (config.colors && config.colors.length >= config.levelCount) {
      return config.colors.slice(0, config.levelCount)
    }

    // Generate colors from base color (uses reactive _darkMode state)
    return generateColorScale(config.baseColor, config.levelCount, {
      darkMode: this._darkMode,
    })
  }

  render() {
    if (!this._config || !this.hass) return html``

    const rawData = this._getRawData()
    const pipelineConfig = this._getPipelineConfig()
    const colorScale = this._getColorScale()
    const isYearMode = this._config.range === 'year'

    // Process data through pipeline (returns array, we take first for single view)
    const heatmapDataArray = processHeatmapData(pipelineConfig, rawData)
    const heatmapData: HeatmapData | undefined = heatmapDataArray[0]

    if (!heatmapData) return html``

    // Grid config
    const RECT_SIZE = 10
    const GAP = 3
    const STEP = RECT_SIZE + GAP
    const X_START = 30
    const Y_START = 20

    // Build month labels from the processed weeks
    const monthStartColumns = new Map<number, number>()
    const weekStart = pipelineConfig.weekStartDay ?? 1

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

    const width = heatmapData.weeks.length * STEP
    const height = 7 * STEP

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

    // Render legend items dynamically based on levelCount
    const legendItems = colorScale.map((color) => {
      // Skip transparent for legend display, show a light border instead
      const style =
        color === 'transparent'
          ? 'background-color: transparent; border: 1px solid var(--secondary-text-color);'
          : `background-color: ${color};`
      return html`<div class="legend-item" style="${style}"></div>`
    })

    return html`
      <ha-card>
        ${this._config.title
          ? html`<div class="header">${this._config.title}</div>`
          : ''}
        <div class="graph-container">
          <svg viewBox="0 0 ${width + 50} ${height + 50}">
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
                                >
                                  <title>${day.count} on ${day.date}</title>
                                </rect>
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
          <div class="legend">
            <span>Less</span>
            ${legendItems}
            <span>More</span>
          </div>
        </div>
      </ha-card>
    `
  }
}
