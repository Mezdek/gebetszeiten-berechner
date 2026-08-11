# Gebetszeiten-Berechner

Browser-based tool that computes Islamic prayer times for one Gregorian year at a
fixed location and exports them as JSON. Internal administration tool for a
mosque — no server, no backend, no API calls, no telemetry. The solar position
calculation is implemented from scratch (see `src/core/solar.ts` for the
formulas and their sources); no prayer-time or astronomy library is used.

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
  and the per-day/per-year prayer time orchestration.
- `src/constants.ts` — every astronomical constant and build-time default
  (rounding direction per prayer, default elevation, default Asr method).
- `src/storage/` — `localStorage`-backed configuration, with corruption
  recovery, plus JSON export/import.
- `src/output/` — document assembly, optional schema validation, filename
  deduplication, and the browser download.
- `src/i18n/` — German (default) and Arabic translations.
- `tests/` — Vitest suite covering the calculation (solstices/equinoxes, DST
  transitions, leap years, rounding order, Isha after midnight).
