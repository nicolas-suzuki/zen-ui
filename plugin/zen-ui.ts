import { LitElement, html } from 'lit'
import { customElement, property, state } from 'lit/decorators.js'
import { processHeatmapData, type PipelineConfig } from './data-pipeline'
import { generateColorScale } from './color-utils'
import { validateConfig, weekStartDayToNumber, type CardConfig } from './config'
import { baseStyles } from './shared/styles'
import { getCardRenderer, getAllCardStyles } from './cards/registry'
import type { Tooltip, CardRenderContext } from './cards/types'

@customElement('zen-ui')
export class ZenUI extends LitElement {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  @property({ attribute: false }) public hass?: any

  @state() private _config?: CardConfig
  @state() private _darkMode = false
  @state() private _tooltip?: Tooltip

  private _darkModeMediaQuery?: MediaQueryList
  private _darkModeObserver?: MutationObserver

  static styles = [baseStyles, ...getAllCardStyles()]

  static getStubConfig() {
    return {
      type: 'custom:zen-ui',
      card: 'heatmap',
      entity: '',
      title: 'Preview',
    }
  }

  public setConfig(config: unknown): void {
    this._config = validateConfig(config)
  }

  public getCardSize(): number {
    if (!this._config) return 3
    const renderer = getCardRenderer(this._config.card)
    return renderer.getCardSize(this._config)
  }

  updated(changedProps: Map<string, unknown>): void {
    if (changedProps.has('hass')) {
      this._updateDarkMode()
    }
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
    // Check for .dark class on body or html (for demo/preview pages)
    if (
      document.body.classList.contains('dark') ||
      document.documentElement.classList.contains('dark')
    ) {
      return true
    }
    // If no HA theme and no .dark class, default to light mode
    // This ensures demo/preview pages start in light mode
    // regardless of system preference
    return false
  }

  private _getRawData(): unknown {
    if (!this._config) return []

    // Try to get real entity data
    if (this.hass) {
      const entityId = this._config.entity
      const stateObj = this.hass.states[entityId]

      if (stateObj) {
        const attr = this._config.attribute || 'data'
        const data = stateObj.attributes[attr]
        if (data && Array.isArray(data) && data.length > 0) {
          return data
        }
      }
    }

    // Generate mock data for preview when no real data available
    return this._generateMockData()
  }

  private _generateMockData(): Array<{ date: string; count: number }> {
    const data: Array<{ date: string; count: number }> = []
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Simple seeded pseudo-random for deterministic results
    const seed = 12345
    let rand = seed
    const random = () => {
      rand = (rand * 1103515245 + 12345) & 0x7fffffff
      return rand / 0x7fffffff
    }

    for (let i = 0; i < 365; i++) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)

      const weekday = date.getDay()
      const weekNum = Math.floor(i / 7)

      // Base activity varies by week (some weeks busier than others)
      const weekActivity = Math.sin(weekNum * 0.3) * 0.3 + 0.5

      // Weekdays more active than weekends
      const dayFactor = weekday >= 1 && weekday <= 5 ? 1.0 : 0.4

      // Random variation
      const noise = random()

      // Combine factors - creates values roughly 0-12
      const value = Math.floor(noise * weekActivity * dayFactor * 15)

      // Skip ~25% of days randomly for realism
      if (random() > 0.25 && value > 0) {
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const day = String(date.getDate()).padStart(2, '0')

        data.push({
          date: `${year}-${month}-${day}`,
          count: value,
        })
      }
    }

    return data
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
    return generateColorScale(config.baseColor, config.levelCount, {
      darkMode: this._darkMode,
    })
  }

  private _onCellMouseEnter = (
    e: MouseEvent,
    date: string,
    count: number,
  ): void => {
    const rect = (e.target as SVGRectElement).getBoundingClientRect()
    this._tooltip = {
      x: rect.left + rect.width / 2,
      y: rect.top,
      date,
      count,
    }
  }

  private _onCellMouseLeave = (): void => {
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

  render() {
    if (!this._config) return html``

    const renderer = getCardRenderer(this._config.card)
    const rawData = this._getRawData()
    const pipelineConfig = this._getPipelineConfig()
    const data = processHeatmapData(pipelineConfig, rawData)
    const colorScale = this._getColorScale()

    if (data.length === 0) return html``

    const context: CardRenderContext = {
      config: this._config,
      data,
      colorScale,
      darkMode: this._darkMode,
      tooltip: this._tooltip,
      onCellMouseEnter: this._onCellMouseEnter,
      onCellMouseLeave: this._onCellMouseLeave,
    }

    const cardStyle = this._config.backgroundColor
      ? `background-color: ${this._config.backgroundColor};`
      : ''

    return html`
      <ha-card style="${cardStyle}">
        ${this._config.title
          ? html`<div class="header">${this._config.title}</div>`
          : ''}
        ${renderer.render(context)}
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
