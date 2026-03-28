# Project Instructions

## Commands

```bash
# Build
npm run build

# Test
npm test

# Lint & Format
npm run lint
npm run lint:fix

# Dev
npm run dev
```

## Architecture

- `src/` — application source
- `src/App.jsx` — main React component for the accessibility super-app
- `src/main.jsx` — React entry point
- `index.html` — HTML entry point
- `vite.config.js` — Vite build configuration
- `Docs/` — documentation

## Domain Knowledge

- AccessAI: an accessibility super-app with multiple tools for different accessibility challenges (visual, hearing, mobility, cognitive, employment)

## Workflow

- Run typecheck after making a series of code changes
- Prefer fixing the root cause over adding workarounds
- When unsure about approach, use plan mode (`Shift+Tab`) before coding

## Don'ts

- Don't modify generated files (`*.gen.ts`, `*.generated.*`)
