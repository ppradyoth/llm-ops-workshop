# Frontend Design

## Stack

React 19, Vite 6, TailwindCSS 3. Single-page application deployed as a static site on Render.

## Component Tree

```
App
├── Header (sticky, dark bg)
│   ├── Logo           — SVG document mark, black/white
│   ├── Nav links      — How it works, Analyze, GitHub
│   ├── ThemeToggle    — Dark/light mode, saves to localStorage
│   └── HealthBadge    — Backend status + Gemini/Fallback indicator
├── Hero section       — Headline, CTA, tech stack pills, load animations
├── How it works       — 3-step numbered section
├── Analyzer section   — id="analyzer"
│   ├── AnalysisForm
│   │   ├── Tab switcher  — Paste text / Upload PDF·TXT
│   │   ├── Textarea      — Resume text input (min 80 chars)
│   │   ├── File zone     — Drag-area style file picker
│   │   ├── Target role   — Text input
│   │   └── Job desc      — Textarea (optional)
│   └── ResultPanel
│       ├── EmptyState    — Feature preview cards before first submit
│       ├── LoadingSkeleton — Animated pulse while waiting
│       └── Results
│           ├── ScoreRing     — SVG ring, colour based on score band
│           ├── Engine badge  — "Gemini AI" (violet) or "Local fallback" (grey)
│           ├── ListBlock × 3 — Missing skills / Strengths / Recommendations
│           └── Icons         — Per-section inline SVG icons
├── Footer
│   ├── Logo + tagline + copyright
│   └── Links — GitHub, Report issue, Gemini API, Back to top
└── ErrorBoundary      — Catches React render errors, shows reset UI
```

## Key Behaviours

**Dark mode** — Tailwind `class` strategy. `useTheme()` in `App.jsx`:
1. Reads `localStorage.theme` on mount
2. Falls back to `window.matchMedia('(prefers-color-scheme: dark)')`
3. Toggles `dark` class on `<html>`, writes preference back to `localStorage`

**Tab input** — `AnalysisForm` tracks `inputMode` (`"text"` | `"file"`). Switching clears the other input so both are never sent simultaneously (server also rejects this).

**Loading state** — `isLoading` is passed to both `AnalysisForm` (disables submit, shows spinner) and `ResultPanel` (shows skeleton instead of empty state).

**Score ring colour** — Dynamic based on score: green ≥ 80, amber 60–79, red < 60. Track colour uses CSS variable `--ring-track` (slate-200 light / slate-700 dark).

**Page load animations** — CSS keyframe `fadeUp` with staggered `animation-delay` classes (`anim-delay-1` through `anim-delay-4`). Applied to hero content only; no animation on subsequent interactions.

**Engine badge** — Surfaced from `result.engine` in the API response. Shows which service produced the result.

## API Communication

All backend calls are in `frontend/src/lib/api.js`:

- `analyzeResume({ resumeText, resumeFile, targetRole, jobDescription })` — POST `/analyze` as `multipart/form-data`
- `getHealth()` — GET `/health`

Backend URL is set at build time via `VITE_API_BASE_URL` (defaults to `http://localhost:8000`).

## Styling Conventions

- Component classes use Tailwind utilities directly (no CSS modules)
- Dark mode variants via `dark:` prefix on every element
- Component-level CSS utility classes (`.field-label`, `.input-control`, `.textarea-control`, `.nav-link`, `.footer-link`) defined in `src/index.css` via `@layer components`
- CSS variables for SVG colours: `--ring-track` in `:root` / `.dark`
