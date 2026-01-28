# Zen UI

> **Note:** This project is being built with LLM agents, though tested by humans. It is an experiment — please expect issues and [raise them](../../issues).

A collection of beautiful visualization cards for Home Assistant. Track habits, activities, workouts, or any daily metrics with clean, customizable visualizations.

**Available Cards:**

- **Heatmap** — GitHub-style contribution calendar (default)

[![CI](https://github.com/shashanktomar/zen-ui/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/shashanktomar/zen-ui/actions/workflows/ci.yml) [![Stars](https://img.shields.io/github/stars/shashanktomar/zen-ui)](#) [![Last commit](https://img.shields.io/github/last-commit/shashanktomar/zen-ui)](#) ![Light Mode](https://img.shields.io/badge/Light%20Mode-supported-brightgreen) ![Dark Mode](https://img.shields.io/badge/Dark%20Mode-supported-blueviolet)

<br>

## Table of Contents

**[`Features`](#features)** **[`Installation`](#installation)** **[`Configuration`](#configuration)** **[`Examples`](#examples)** **[`Data Format`](#data-format)** **[`Development`](#development)**

<br>

## Features

- **GitHub-style visualization** — Clean, familiar heatmap layout with customizable colors
- **Multi-year support** — Display multiple years of data stacked vertically
- **Rolling or calendar year modes** — Show last 365 days or full calendar years
- **Customizable colors** — Set a base color and the card generates a beautiful gradient
- **Dark mode support** — Automatically adapts to your Home Assistant theme
- **Configurable intensity levels** — 2 to 10 color levels to match your data distribution
- **Interactive tooltips** — Hover over any day to see the date and value
- **Week start customization** — Start weeks on Sunday or Monday

<br>

## Installation

<details>

<summary>HACS (Recommended)</summary>

<br>

1. Open HACS in Home Assistant
2. Click the three dots menu (top right) and select "Custom repositories"
3. Add this repository URL and select "Dashboard" as the category
4. Click "Add"
5. Search for "Zen UI" and download it
6. Refresh your browser

</details>

<details>

<summary>Manual Installation</summary>

<br>

1. Download `zen-ui.js` from the [latest release](../../releases)
2. Copy it to your `config/www` folder
3. Add the resource in Home Assistant:
   - Go to **Settings** → **Dashboards** → **Resources**
   - Add `/local/zen-ui.js` as a JavaScript module

</details>

<br>

## Configuration

Add the card to your dashboard using the UI or YAML:

```yaml
type: custom:zen-ui
card: heatmap
entity: sensor.your_sensor
```

<details>

<summary><b>All Configuration Options</b></summary>

<br>

| Option            | Type     | Default      | Description                                                      |
| ----------------- | -------- | ------------ | ---------------------------------------------------------------- |
| `entity`          | string   | **Required** | Entity ID that contains your data                                |
| `card`            | string   | **Required** | Card type: `heatmap`                                             |
| `title`           | string   | —            | Card title displayed at the top                                  |
| `attribute`       | string   | `data`       | Entity attribute containing the data array                       |
| `range`           | string   | `rolling`    | `rolling` (last 365 days) or `year` (calendar years)             |
| `years`           | number   | `1`          | Number of years to display (only for `range: year`)              |
| `baseColor`       | string   | `#40c463`    | Base color for the heatmap (hex format)                          |
| `backgroundColor` | string   | —            | Custom card background color                                     |
| `levelCount`      | number   | `5`          | Number of intensity levels (2-10)                                |
| `levelThresholds` | number[] | —            | Custom percentile thresholds (must have `levelCount - 1` values) |
| `weekStartDay`    | string   | `monday`     | First day of week: `monday`, `mon`, `sunday`, or `sun`           |
| `show_legend`     | boolean  | `true`       | Show the Less/More legend                                        |

</details>

<br>

## Examples

<details>

<summary><b>Basic Usage</b></summary>

<br>

```yaml
type: custom:zen-ui
card: heatmap
entity: sensor.daily_steps
title: Daily Steps
```

</details>

<details>

<summary><b>Multi-Year Calendar View</b></summary>

<br>

Display multiple calendar years stacked vertically:

```yaml
type: custom:zen-ui
card: heatmap
entity: sensor.workout_tracker
title: Workout History
range: year
years: 2
```

</details>

<details>

<summary><b>Binary/Streak Tracking</b></summary>

<br>

For simple yes/no tracking (did I do it today?), use `levelCount: 2`:

```yaml
type: custom:zen-ui
card: heatmap
entity: sensor.meditation
title: Meditation Streak
levelCount: 2
baseColor: '#c6a0f6'
```

</details>

<details>

<summary><b>Custom Color Theme</b></summary>

<br>

```yaml
type: custom:zen-ui
card: heatmap
entity: sensor.meditation_minutes
title: Meditation
baseColor: '#e91e8c'
```

</details>

<details>

<summary><b>Custom Background</b></summary>

<br>

```yaml
type: custom:zen-ui
card: heatmap
entity: sensor.sleep
title: Sleep Tracker
baseColor: '#e91e8c'
backgroundColor: '#1a1a2e'
```

</details>

<details>

<summary><b>More Granular Levels</b></summary>

<br>

Increase intensity levels for more nuanced visualization:

```yaml
type: custom:zen-ui
card: heatmap
entity: sensor.commits
title: Code Commits
levelCount: 8
```

</details>

<details>

<summary><b>Custom Thresholds</b></summary>

<br>

Define your own percentile thresholds for level boundaries:

```yaml
type: custom:zen-ui
card: heatmap
entity: sensor.activity
title: Activity Score
levelCount: 5
levelThresholds: [10, 30, 60, 90]
```

</details>

<details>

<summary><b>Week Starting on Sunday</b></summary>

<br>

```yaml
type: custom:zen-ui
card: heatmap
entity: sensor.habits
title: Habit Tracker
weekStartDay: sunday
```

</details>

<br>

## Data Format

Your sensor's attribute (default: `data`) should contain an array of objects:

```json
[
  { "date": "2024-01-15", "count": 5 },
  { "date": "2024-01-16", "count": 12 },
  { "date": "2024-01-17", "count": 3 }
]
```

<details>

<summary><b>Field Details</b></summary>

<br>

| Field   | Type   | Description                  |
| ------- | ------ | ---------------------------- |
| `date`  | string | ISO date string (YYYY-MM-DD) |
| `count` | number | Numeric value for that day   |

Days without entries are treated as zero.

</details>

<br>

## Development

<details>

<summary><b>Setup</b></summary>

<br>

```bash
# Install dependencies
pnpm install

# Start dev server
pnpm dev

# Run tests
pnpm test

# Build for production
pnpm build
```

</details>

<details>

<summary><b>Project Structure</b></summary>

<br>

```
plugin/                      # Home Assistant plugin source
├── zen-ui.ts                # Main component coordinator
├── config.ts                # Configuration validation
├── data-pipeline.ts         # Data processing logic
├── color-utils.ts           # HSL color generation
├── cards/                   # Card type implementations
│   ├── types.ts             # CardRenderer interface
│   ├── registry.ts          # Card type registry
│   └── heatmap/             # Heatmap card
│       ├── index.ts
│       ├── render.ts
│       └── styles.ts
└── shared/
    └── styles.ts            # Shared card styles

web/                         # Demo & development
├── index.html
└── demo.html
```

</details>

<details>

<summary><b>Testing</b></summary>

<br>

```bash
# Run tests once
pnpm test:run

# Watch mode
pnpm test
```

</details>

<br>

## License

MIT License — see [LICENSE](LICENSE) for details.

## Contributing

Contributions are welcome! Please open an issue first to discuss what you'd like to change.
