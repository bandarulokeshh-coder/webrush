# WebRush — Your Life, In Receipts

A frontend-only hackathon project that turns your personal data — music history,
bank transactions, location records — into a browsable feed of **receipts**, then
surfaces the **connections** hiding between them.

Every event in your life becomes an itemised receipt. Receipts that happened close
together in time, at the same place, with the same people, or in a repeatable
sequence become linked. The result is a timeline of your life you can filter,
inspect and read like a paper trail.

Everything runs in the browser: no backend, no server-side parsing, no data
leaves the machine. Datasets are `fetch`ed as static CSV files out of `public/`
and parsed in TypeScript.

## Features

**Receipt feed**

- Nine receipt types — music, movie, place, purchase, photo, message, search,
  event, note — each rendered by a typed `ReceiptCard` with its own lucide icon
  and gradient tile
- Staggered entrance animations, hover lift and cheap `layout="position"` reflow
  on filter changes (motion)
- Filter by receipt type and date range; up to 250 cards rendered at once to keep
  large datasets responsive

**Connection detection**

- Six detectors run over the visible receipt set and produce typed connections
  with an explanation and a confidence score
- Toggle which detectors are active; tune how close in time two events must be
  with a 5–120 minute sensitivity slider

**Four data sources**

- Mock data (generated in-app), plus three real datasets: Spotify listening
  history, household transactions, and IndiaTransact card transactions
- Each loads asynchronously with animated loading and error states

**Presentation**

- Light and dark theme with the choice persisted in `localStorage` and applied
  before first paint (no flash of the wrong theme)
- shadcn-style `Card` / `Badge` primitives, `cn()` class merging, animated pill
  selectors and custom checkboxes
- Fully dark-mode styled, keyboard accessible controls with proper ARIA roles

## Connection types

| Type | `type` | What links two receipts |
| --- | --- | --- |
| Temporal | `temporal` | Happened within the sensitivity threshold of each other |
| Location | `location` | Share coordinates / were at the same venue |
| Location name | `location-name` | Mention the same place name in their text |
| Artist / mention | `artist` | Reference the same artist or track |
| Social | `social` | Involve the same people |
| Activity chain | `chain` | Form a repeatable sequence, e.g. event → photo → note |

Detectors live in `src/utils/data.ts` (`findTemporalConnections`,
`findLocationConnections`, `findArtistConnections`, `findLocationNameConnections`,
`findSocialConnections`, `findActivityChains`) and are composed by
`findAllConnections`, which takes the sensitivity threshold and the enabled
detector flags and returns a sorted list of connections.

## Tech stack

| Layer | Choice |
| --- | --- |
| Build | Vite 8 |
| UI | React 19 + TypeScript 6 |
| Styling | Tailwind CSS v4 (CSS-first config, `@tailwindcss/postcss`) |
| Animation | motion 13 |
| Icons | lucide-react |
| Variants / class merging | class-variance-authority, clsx, tailwind-merge |
| Linting | oxlint |

Dark mode uses Tailwind v4's `@custom-variant` — there is no `darkMode: 'class'`
option and no `tailwind.config.js` in v4, so the variant is declared in
`src/index.css`:

```css
@import "tailwindcss";

@custom-variant dark (&:where(.dark, .dark *));
```

`index.html` carries a small inline script that reads the saved theme (or the OS
preference) and sets `.dark` on `<html>` before the first paint.

## Getting started

Requires Node `^20.19.0 || >=22.12.0` (Vite 8's engine range).

```bash
npm install
npm run dev      # Vite dev server on http://localhost:5173
```

| Script | Purpose |
| --- | --- |
| `npm run dev` | Start the dev server with HMR |
| `npm run build` | Type-check (`tsc -b`) then produce a production bundle in `dist/` |
| `npm run preview` | Serve the built bundle locally |
| `npm run lint` | Run oxlint |

## Project structure

```
src/
  App.tsx                    Data source, filters, stats, connection panel
  main.tsx                   React entry point
  index.css                  Tailwind import + dark variant + color-scheme
  components/
    ReceiptCard.tsx          Typed receipt card, icon tiles, entrance animation
    ThemeToggle.tsx          Light/dark toggle, persisted to localStorage
    ui/
      Card.tsx               Card / Header / Title / Description / Content
      Badge.tsx              Badge with CVA variants
  lib/
    utils.ts                 cn() — clsx + tailwind-merge
  utils/
    data.ts                  Receipt + connection types and the detectors
    dataLoader.ts            CSV parsing for each dataset
public/datasets/             Sample CSVs served to the browser
datasets/                    Full raw datasets (not served, see Privacy)
```

## Privacy

This repository is **private** and deliberately so: the files under `datasets/`
are real personal data — a full Spotify listening history and a household
transaction ledger — and the samples in `public/datasets/` are derived from them.

Nothing is uploaded anywhere by the app itself, but the repo contents are still
personal. If you ever want to make it public, strip `datasets/` from the history
first (`git filter-repo`), not just from the working tree — the files are already
in the commit history.

## Performance notes

- `MAX_VISIBLE_RECEIPTS` (250) caps how many cards render at once; the UI states
  how many are hidden rather than silently truncating
- Filtered receipts and detected connections are `useMemo`-derived during render
  rather than held in state and synced through effects
- The dataset-fetch effect depends only on the selected data source, so changing
  the sensitivity slider or a detector toggle re-runs detection without
  re-downloading and re-parsing the CSV
- Cards use `layout="position"` so the grid animates cheaply instead of measuring
  scale for every element

## Known gaps

- The receipt-type filter is still a native `<select>` (emoji labels) rather than
  the animated pill control used for data sources — native `<option>` elements
  cannot render lucide icons
- `location-name` connections are detected and displayed but are not yet exposed
  as a toggle in the connection-type checklist
- Only the first 250 matching receipts are shown at a time; there is no
  pagination or virtualised list yet

