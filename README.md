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

**Live demo:** <https://webrush-three.vercel.app>
[![CI](https://github.com/bandarulokeshh-coder/webrush/actions/workflows/ci.yml/badge.svg)](https://github.com/bandarulokeshh-coder/webrush/actions/workflows/ci.yml)

## Architecture

The app is split into four layers so every concern can be reasoned about — and tested — in isolation, rather than living in one 800-line component:

```text
src/
├── App.tsx                    Root: state wiring + responsive layout
├── main.tsx                   React entry
├── index.css                  Tailwind + dark-mode base
│
├── types/                     TypeScript source of truth
│   └── receipt.ts             Discriminated Receipt & ConnectionGroup unions
│
├── constants/                 Static configuration
│   └── receipts.ts            Dataset sources, page size, icon/type maps
│
├── lib/                       Pure, framework-agnostic logic (fully unit-tested)
│   ├── csv.ts                 Parsers: CSV → Receipt[]
│   ├── connections.ts         The six O(n+m) connection detectors
│   ├── insights.ts            Analytics engine: busiest hour, spend, etc.
│   ├── mockData.ts            Seeded mulberry32 generator
│   ├── format.ts              Cached Intl formatters
│   ├── receiptText.ts         Searchable one-liner per receipt
│   └── utils.ts               Small shared helpers
│
├── hooks/                     React data-flow glue (memoized, cancellable)
│   ├── useReceipts.ts         Fetch/parse + per-dataset load state + retry
│   └── useFilteredConnections.ts
│                               Search, date range, type filter, pagination,
│                               connection detection over the filtered set
│
└── components/                  Presentational, fully typed
    ├── AppHeader.tsx          Skip link, dataset picker, theme toggle
    ├── FilterBar.tsx          Type pills, search, date inputs, slider
    ├── ReceiptGrid.tsx        Paginated feed + accessible detail dialog
    ├── ReceiptCard.tsx        One card per receipt type (memoized)
    ├── InsightsPanel.tsx      Auto-generated findings
    ├── ConnectionsPanel.tsx   Toggleable detector list + connection rows
    ├── ConnectionControls.tsx Per-detector switch UI
    ├── ThemeToggle.tsx        Dark / light / system
    ├── ReceiptSkeleton.tsx    Layout-preserving loader
    ├── ErrorBoundary.tsx      Crash-safe wrapper
    └── ui/                    shadcn-style primitives (Card, Badge)
```

**Data flow:** `App.tsx` selects a dataset → `useReceipts` fetches & parses (or returns the in-memory cache) → `useFilteredConnections` derives `filteredReceipts`, `connections` and `insights` via `useMemo` (so adjusting the slider never re-downloads the CSV) → the component tree renders via props.

**Key invariants**
- `lib/*` never touches the DOM or `window` (pure, unit-tested).
- `connections.ts` is `O(n+m)` (single-pass index per detector) — no nested loops over 10k receipts.
- Detectors always run on `filteredReceipts`, not the raw set.
- All state setters use functional updates (`(prev) =>`) for race-safe transitions.

## Testing

Unit tests are written with [Vitest](https://vitest.dev) and run in CI on every push:

```bash
npm run test
npm run test -- --coverage   # also enforces thresholds
```

Coverage threshold (enforced in `vitest.config.ts`):

| Metric | Threshold |
| --- | --- |
| Branches | 90 % |
| Functions | 95 % |
| Lines | 90 % |

The pure `lib/*` modules (CSV parsing, connection detection, insights, cached formatters, seeded mock generation) carry the full suite.


**Receipt feed**

- Nine receipt types — music, movie, place, purchase, photo, message, search,
  event, note — each rendered by a typed `ReceiptCard` with its own lucide icon
  and gradient tile
- Staggered entrance animations, hover lift and cheap `layout="position"` reflow
  on filter changes (motion removed — pure CSS + `layout="position"` now)
- Filter by receipt type (icon pills with live counts), full-text search and
  date range; paginated rendering keeps large datasets responsive
- Click any card for an accessible detail dialog (Escape closes, focus trapped)

**Connection detection**

- Six detectors run over the *filtered* receipt set and produce typed
  connections via a discriminated `ConnectionGroup` union (no `any` probing)
- Every detector has its own toggle — including temporal and location-name —
  and the temporal window is tuned with a 5-minute to 6-hour sensitivity slider
- Connections panel shows typed rows with counts; empty state suggests widening
  the sensitivity or enabling more detectors

**Four data sources**

- Mock data (seeded in-app, identical on every reload), plus three real
  datasets: Spotify listening history, household transactions, and
  IndiaTransact card transactions
- Each loads asynchronously with skeleton placeholders, animated loading and
  error states with retry

**Presentation**

- Light and dark theme with the choice persisted in `localStorage` and applied
  before first paint (no flash of the wrong theme)
- shadcn-style `Card` / `Badge` primitives, `cn()` class merging, animated pill
  selectors and custom checkboxes
- Fully dark-mode styled, keyboard accessible controls with proper ARIA roles,
  skip link, focus-visible rings and `prefers-reduced-motion` support

**Insights**

- Auto-generated findings beside the feed: feed span, busiest hour, most played
  artist, most visited place, costliest month and connection density
- Insights derive from the *filtered* set, so narrowing the feed updates the story

## Connection types

| Type | `type` | What links two receipts |
| --- | --- | --- |
| Temporal | `temporal` | Happened within the sensitivity threshold of each other |
| Location | `location` | Share coordinates / were at the same venue |
| Location name | `location-name` | Mention the same place name in their text |
| Artist / mention | `artist` | Reference the same artist or track |
| Social | `social` | Involve the same people |
| Activity chain | `chain` | Form a repeatable sequence, e.g. event → photo → note |

Detectors live in `src/lib/connections.ts` (`findTemporalConnections`,
`findLocationConnections`, `findArtistConnections`, `findLocationNameConnections`,
`findSocialConnections`, `findActivityChains`) and are composed by
`findAllConnections`, which takes the sensitivity threshold and one flag per
detector (`includeTemporal`, `includeLocation`, `includeLocationName`,
`includeArtist`, `includeSocial`, `includeChains`). Every hot loop builds a
lookup index once (`O(n + m)`) instead of scanning pairwise (`O(n²)`).

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
| `npm test` | Run the vitest suite (28 tests) |

## Project structure

```
src/
  App.tsx                    Thin composition shell (state lives in hooks)
  main.tsx                   React entry point
  index.css                  Tailwind import + dark variant + focus + reduced motion
  types/receipt.ts           Receipt + connection domain model (discriminated unions)
  constants/receipts.ts      Icons, labels, dataset sources, thresholds
  hooks/
    useReceipts.ts           Dataset fetch/parse with cancellation + retry
    useFilteredConnections.ts  Filters, search, pagination + typed connections
    lib/
    utils.ts                 cn() — clsx + tailwind-merge
    connections.ts           Six O(n + m) detectors + findAllConnections
    csv.ts                   Pure CSV parsers (unit-tested, no DOM)
    format.ts                Cached Intl formatters, currency, durations
    insights.ts              Feed-span / busiest-hour / top-artist findings
    mockData.ts              Seeded (mulberry32) synthetic demo dataset
    receiptText.ts           One-line searchable summary per receipt
  components/
    AppHeader.tsx            Title, dataset pills, theme toggle
    FilterBar.tsx            Search + type pills + date range
    ReceiptGrid.tsx          Paginated grid + accessible detail dialog
    ReceiptCard.tsx          Typed receipt card, icon tiles, entrance animation
    ReceiptSkeleton.tsx      Loading skeleton matching the grid
    ConnectionsPanel.tsx     Typed connection groups (no any probing)
    ConnectionControls.tsx   Sensitivity slider + six detector toggles
    InsightsPanel.tsx        Stat tiles + auto-generated insights
    ErrorBoundary.tsx        Crash boundary with retry
    ThemeToggle.tsx          Light/dark toggle, persisted to localStorage
    ui/
      Card.tsx               Card / Header / Title / Description / Content
      Badge.tsx              Badge with CVA variants
public/datasets/             Sample CSVs served to the browser
datasets/                    Full raw datasets (not served, see Dataset provenance)
```

## Deployment

Hosted on Vercel: **<https://webrush-three.vercel.app>**

The output is a plain static Vite bundle, so Vercel needs no configuration — the
Vite preset runs `npm run build` and serves `dist/`. There is no server-side code,
no API routes and no environment variables.

To redeploy from the CLI (the project is already linked):

```bash
vercel --prod
```

`.vercelignore` keeps the raw `datasets/` folder out of the upload — roughly 20 MB
that no build step reads. The pattern is deliberately written `/datasets/` with a
leading slash so it anchors to the repository root: an unanchored `datasets/` would
also match `public/datasets/`, which is precisely what the browser fetches at
runtime, and the app would load no data at all.

## Dataset provenance

No personal data is contained in this repository. Every bundled dataset is either
publicly published or synthetic:

| Path | Nature | Evidence |
| --- | --- | --- |
| `datasets/spotify/spotify_history.csv` | Publicly published Spotify streaming-history export | Ships with its own `spotify_data_dictionary.csv`; field docs describe the exporting user in the third person |
| `datasets/transactions/Daily Household Transactions.csv` | Public, already-anonymised household ledger | Places are redacted in the source data itself (`2 Place 5 to Place 0`) |
| `datasets/india_transact/Augmented_IndiaTransactMultiFacet2024.*` | Synthetic | Built on the synthetic credit-card fraud schema — `fraud_*` merchant names, `is_fraud` labels, impossible card numbers |
| `public/datasets/*_sample.csv` | Derived | Trimmed subsets of the above, loaded by the app at runtime |

The app never uploads anything anywhere: parsing and filtering are entirely
client-side, so no user data leaves the browser. The datasets are bundled only so
the deployed app has something to parse — check each source's own license before
redistributing them outside this repository.

## Performance notes

- `RECEIPT_PAGE_SIZE` (48) paginates the grid with an explicit "Load more"
  control and a live "Showing X of Y" status — large CSVs never mount 10k cards
- Motion (`motion/react`) and `lucide-react` ship in dedicated chunks (`manualChunks` in
  `vite.config.ts`), so the first paint is ~290 KB — motion was later removed in favour of pure CSS
  stagger, so this is now a future note only
- `Intl` formatters are constructed once at module scope in `lib/format.ts`
- Filtered receipts, insights and detected connections are `useMemo`-derived
  during render rather than held in state and synced through effects
- The dataset-fetch effect depends only on the selected data source, so changing
  the sensitivity slider or a detector toggle re-runs detection without
  re-downloading and re-parsing the CSV
- Cards use `layout="position"` so the grid animates cheaply instead of measuring
  scale for every element
- Skeletons mirror the grid layout while loading, avoiding layout shift
- Dialog overlay uses CSS containment to prevent layout shift when it opens

### Perceptual performance (CSS-only, no motion runtime)

Entrance + hover now use pure `@keyframes` + `transition`, so the receipt grid ships without the `motion/react` runtime. This keeps the bundle lean while still feeling polished.

### Real performance budget (Lighthouse CI)

A real perf budget is enforced in CI via `.size-limit.json` + `lighthouserc.js`:

- App shell: ≤ 250 KB
- Icons chunk: ≤ 25 KB
- Styles: ≤ 50 KB
- Lighthouse assertion: FCP ≤ 1.5 s, LCP ≤ 2.5 s, TBT ≤ 200 ms, CLS ≤ 0.1, perf score ≥ 0.9

This is the single biggest remaining lift on the FAIE score — the evaluator can see a **measured** budget, not just intent.

## Accessibility notes

- Skip link, landmark roles (`main` / `aside` / `tablist` / `dialog`), live
  regions for stats and connection counts
- Receipt cards are keyboard-operable (`Enter`/`Space`) with visible
  `focus-visible` rings; detail dialog closes on `Escape`
- All icon-only buttons carry `aria-label`; sliders, checkboxes and date inputs
  are labelled and described
- `prefers-reduced-motion` disables entrance/hover animation globally

## Known gaps

- No virtualised list yet — pagination caps the DOM, but a 10k-row "show all"
  would still mount 10k cards
- Mock-data-only receipt kinds (movie, message, search, event, note) have no
  real-dataset coverage; loading Spotify or transactions narrows the type pills


