# Gebetszeiten-Berechner

Browser-based tool that computes Islamic prayer times for one Gregorian year at a
fixed location and exports them as JSON. It's an internal administration tool
for a mosque, run occasionally by one operator — not a public website and not
a consumer prayer app. No server, no backend, no API calls, no telemetry.

The solar position calculation is implemented from scratch (see
`src/core/solar.ts` for the formulas and their sources, drawn from Jean Meeus'
*Astronomical Algorithms*); no prayer-time or astronomy library is used.

## Features

- **Calculation from scratch** — Julian day, low-precision solar coordinates,
  and the sunrise/sunset/twilight hour-angle equations are implemented and
  documented in `src/core/`, not pulled from a prayer-time package.
- **Fixed rounding per prayer**, a build-time constant
  (`src/constants.ts`), not an operator setting:

  | Prayer          | Rounding |
  | --------------- | -------- |
  | Fajr            | down     |
  | Shuruq          | down     |
  | Dhuhr           | up       |
  | Asr             | up       |
  | Maghrib         | up       |
  | Isha            | up       |

  The rounding direction is shown next to each prayer's minute-offset field
  in the UI, in plain language.
- **Coordinates entered as degrees/minutes/seconds** (base-60) with an N/S or
  E/W direction, not decimal degrees — matching how coordinates are usually
  published (e.g. Wikipedia infoboxes, survey data). Converted to decimal
  internally; the generated JSON still records plain decimal degrees.
- **Hijri dates** via `@umalqura/core` (Umm al-Qurā calendar), with a global
  day offset the operator can apply before writing.
- **Config persistence** in `localStorage`, with numbered-backup recovery
  (`.bak`, `.bak1`, …) if the stored entry is ever corrupted, plus JSON
  export/import so settings survive a cleared browser.
- **Optional output validation** — off by default; when enabled, a malformed
  generated document is never written, and the error is reported as a defect
  in the app, not an operator mistake.
- **German (default) and Arabic (RTL)**, switchable from a dropdown in the
  header; the choice is remembered across visits. Arabic uses logical CSS
  properties throughout, so the layout flips rather than mirrors.
- **Responsive, mobile-first UI** — the operator's primary device is expected
  to be a phone. Single column and full-width tap targets on narrow
  viewports; multi-column layout kicks in on wider screens. Checked in both
  languages at both sizes.
- **About dialog** (native `<dialog>`, no extra dependency) with the app's
  version, a short description, maintainer contact, license, and a link to
  this repository.
- **Ships as one file** — `npm run build` produces a single self-contained
  `dist/index.html` (JS and CSS inlined), so it also works opened directly
  from disk, offline.

## Known limitation: no high-latitude adjustment rule

At latitudes where the sun doesn't reach the configured Fajr/Isha depression
angle on a given date (common above roughly 48–50° in local summer), this
tool does **not** fall back to a compensating method such as the Angle-Based
Method, the Nearest-Latitude method, or the one-seventh-of-night rule. Per the
project's "no invented values" rule, it reports a clear error for that date
instead of guessing a time. An operator generating a full year for a
high-latitude mosque may need to adjust the configured angles, or accept that
some summer dates in the output will fail to generate.

## Development

```sh
npm install
npm run dev      # start the dev server
npm run test     # run the Vitest suite
npm run build    # type-check and produce dist/index.html (single self-contained file)
```

The production build is a single `dist/index.html` with all JS/CSS inlined, so
it also works opened directly from disk, offline.

## Layout

- `src/core/` — Julian day, solar position, timezone/DST offset resolution,
  degrees/minutes/seconds coordinate conversion, and the per-day/per-year
  prayer time orchestration.
- `src/constants.ts` — every astronomical constant and build-time default
  (rounding direction per prayer, default elevation, default Asr method).
- `src/storage/` — `localStorage`-backed configuration, with corruption
  recovery, JSON export/import, and the separately persisted UI language
  preference.
- `src/output/` — document assembly, optional schema validation, filename
  deduplication, and the browser download.
- `src/i18n/` — German (default) and Arabic translations.
- `src/main.ts`, `index.html`, `src/style.css` — the single-screen form, the
  language dropdown, and the About dialog.
- `tests/` — Vitest suite covering the calculation (solstices/equinoxes, DST
  transitions, leap years, rounding order, Isha after midnight), coordinate
  conversion, and validation message coverage.

## Output format

Generation produces `prayer_times_<year>.json` (numbered `(1)`, `(2)`, … if a
file of that name was already produced this session), structured as:

```json
{
  "meta": {
    "year": 2027,
    "generatedAt": "2026-08-11T09:00:00Z",
    "generator": "…",
    "calculation": { "…": "the settings used" }
  },
  "days": {
    "2027-07-02": {
      "fajr": "02:14",
      "shuruq": "04:48",
      "dhuhr": "13:12",
      "asr": "17:42",
      "maghrib": "21:22",
      "isha": "23:12",
      "hijri": { "day": 17, "month": 1, "year": 1449 }
    }
  }
}
```

## License

[MIT](./LICENSE)

## Maintainer

Mezdek Osman — [mezdek.net](https://mezdek.net) — [hello@mezdek.net](mailto:hello@mezdek.net)

Repository: [github.com/Mezdek/gebetszeiten-berechner](https://github.com/Mezdek/gebetszeiten-berechner)
