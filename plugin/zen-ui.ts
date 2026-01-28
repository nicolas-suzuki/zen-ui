import { LitElement, html } from 'lit'
import { customElement, property, state } from 'lit/decorators.js'
import { processHeatmapData, type PipelineConfig } from './data-pipeline'
import { generateColorScale } from './color-utils'
import {
  validateConfig,
  weekStartDayToNumber,
  type CardConfig,
} from './config'
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
    if (!this._config || !this.hass) return html``

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
