# MRCET Placements Hub

A fully self-contained placements website for Malla Reddy College of Engineering & Technology (MRCET) — built with Next.js App Router, TypeScript, and Tailwind CSS v4.

It brings together a campus placements home page, a filterable placements dashboard with analytics, a searchable company directory with per-company detail pages, a community interview-experience feed, and a company-wise + category-wise practice/sample-paper bank. All data is realistic, internally consistent mock data (no backend, no external APIs).

## Tech stack

- Next.js 16 (App Router, TypeScript, `src/` directory)
- React 19
- Tailwind CSS v4 (CSS-based `@theme` tokens, class-based dark mode)
- Hand-built shadcn/ui-style primitives on top of Radix UI, `class-variance-authority`, `clsx`, and `tailwind-merge`
- Framer Motion for entrance/timeline animations
- Recharts for the dashboard's bar/pie/area charts
- lucide-react for icons

## Getting started

```bash
npm install
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000).

## Other scripts

```bash
npm run build   # production build
npm run start   # serve the production build
npm run lint    # ESLint
```

## Structure

- `src/app/` — routes: home (`/`), `/dashboard`, `/companies`, `/companies/[slug]`, `/experiences`, `/practice`
- `src/components/ui/` — hand-built shadcn-style primitives (button, card, dialog, tabs, select, table, sheet, etc.)
- `src/components/{home,dashboard,companies,experiences,practice,shared}/` — feature components
- `src/lib/data/` — typed mock data (companies, experiences, placements, announcements, leadership)
- `src/lib/chart-colors.ts` — validated navy/gold-derived categorical and single-hue chart palettes
