## Architecture
Next.js (App Router), React, Tailwind CSS v4, Prisma (PostgreSQL/SQLite database layer), Google Generative AI SDK (@google/generative-ai).

## Module Registry
| Module | Path | Responsibility | Depends on | Depended on by |
|--------|------|----------------|------------|----------------|
| Auth | `src/lib/auth.ts`, `src/lib/jwt.ts` | Session validation and JWT helper routines | `src/lib/db.ts` | Backend API routes, page middleware |
| Database | `src/lib/db.ts` | Prisma Client initialization | Prisma schema | All database-connected modules |
| API AI | `src/app/api/ai/` | Route handlers for AI features (Breakdown, Coach, Estimate, Insights) | `@google/generative-ai`, `src/lib/db.ts` | Dashboard components, Board page |
| Components | `src/components/` | Reusable UI components (Logo, Sidebar, ChatWidget, DashboardShell) | CSS globals, React | Shell and pages |

## Decisions Log
| # | Date | Decision | Context | Alternatives rejected | Reversal cost |
|---|------|----------|---------|-----------------------|---------------|
| 1 | 2026-05-27 | Exclude backend API model migration | User explicitly requested to keep existing `gemini-1.5-flash` model on backend endpoints | `gemini-3.5-flash` (rejected per user request) | Low |
| 2 | 2026-05-27 | Refactor AI UI indicators | Remove cliche sparkle (✨) emojis and icons from board and coach panels to elevate visual maturity | Standard AI sparkle icons (rejected to satisfy user global rule against AI clichés) | Low |

## Task Log
| # | Task | Mode | Status | Files | Goals satisfied (G1–G4) | Notes |
|---|------|------|--------|-------|-------------------------|-------|
| 1 | Redesign Logo and remove AI visual clichés. Render screens in Stitch via MCP | Feature / Fix | Completed | `src/components/Logo.tsx`, `src/app/dashboard/board/page.tsx`, `src/app/globals.css` | G1, G2, G3 | Excluded API changes per user request. Stitch project 1135686711481421475 created. |

## Known Issues & Technical Debt
| Issue | Severity | Location | Impact on G1 / G3 / G4 | Owner | Plan |
|-------|----------|----------|------------------------|-------|------|
| Placeholder API keys | Medium | `.env` | Blocks AI generation if no valid key is provided, falling back to mock logic | Developer | Ensure environment has active GEMINI_API_KEY |

## Build & Test Commands
- dev: `npm run dev`
- build: `npm run build`
- lint: `npm run lint`
