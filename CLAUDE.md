# PRD Builder — AI Codebase Guide

PRD Builder is a local developer tool that takes a Product Requirements Document,
spawns Claude Code as a CLI subprocess, and fully autonomously builds, tests, containerizes,
and deploys a production Next.js application to Google Cloud Run — then hands back a
GitHub repo URL and a live deploy URL. The user uploads a PRD, clicks Launch, and waits.

## Workflow Rules

- **Never change the mandatory stack**: The generated app always uses Next.js + React +
  TypeScript + Tailwind + shadcn/ui + Firebase + Cloud Run. This is enforced in
  `server/src/prompt.ts`. Do not add stack selection to the UI.
- **Prompt file is the product**: `server/src/prompt.ts` is the most business-critical file.
  Changes there affect every app ever generated. Review carefully.
- **Preflight gates everything**: The Launch button must remain disabled until all five CLI
  tools pass their preflight check. Never weaken this gate.
- **`--dangerously-skip-permissions` is intentional**: Every Claude Code subprocess is
  spawned with this flag. This is a deliberate architectural decision — the app runs fully
  autonomously with no human in the loop. Do not remove this flag. Do not add permission
  prompts. This tool is internal-only and used exclusively by developers who understand
  they are granting Claude Code full system access.
- **In-memory only**: Jobs are stored in a `Map` in `server/src/index.ts`. No database,
  no persistence between server restarts. This is intentional for v1.

## Tech Stack — Wrapper App

| Layer    | Technology                                     |
| -------- | ---------------------------------------------- |
| Frontend | Vite + React 18 + TypeScript                   |
| Styling  | Tailwind CSS + shadcn/ui                       |
| Backend  | Express + TypeScript                           |
| Realtime | WebSockets (`ws` package + native browser API) |
| Process  | Node.js `child_process.spawn`                  |
| Icons    | lucide-react                                   |
| Monorepo | npm workspaces (`client/` + `server/`)         |

## Tech Stack — Every Generated App (Fixed)

| Layer    | Technology                        |
| -------- | --------------------------------- |
| Frontend | Next.js (App Router) + React + TS |
| Styling  | Tailwind CSS + shadcn/ui          |
| Database | Firebase Firestore                |
| Auth     | Firebase Auth (if needed)         |
| Hosting  | Google Cloud Run                  |
| Repo     | GitHub (public, via `gh` CLI)     |
| Tests    | Playwright                        |

## Project Structure

```
prd-builder/
├── package.json              # root workspace + concurrently
├── prompts/                  # sequential Claude Code quality prompts
│   ├── 00-docs-setup.md      # run first — creates CLAUDE.md + memory
│   ├── 01-build.md           # main build prompt (the generated app)
│   ├── 02-test-hardening.md  # post-build: strengthen tests
│   ├── 03-security-audit.md  # post-build: security review
│   ├── 04-smoke-test.md      # post-build: verify deploy is live
│   └── 05-final-review.md    # post-build: code quality + README
├── client/
│   ├── vite.config.ts        # proxies /api + ws to :3001
│   └── src/
│       ├── App.tsx            # useState-based screen router
│       ├── screens/           # Home | Stream | Done
│       ├── components/        # PreflightPanel | PRDUploader | TerminalStream | PhaseTracker | ResultCard
│       └── types/index.ts     # shared Job + PreflightCheck types
└── server/
    └── src/
        ├── index.ts           # Express routes + WebSocket server (~80 lines)
        └── prompt.ts          # THE master prompt — hardcoded stack, sequential deliverables
```

## Build & Run Commands

```bash
# Install all workspaces
npm install

# Run both client and server in dev mode
npm run dev
# client → http://localhost:3000
# server → http://localhost:3001

# Build for production
npm run build
```

## Key Architectural Rules

### The Prompt Pipeline

Prompts in `prompts/` are run sequentially by the server against the SAME working directory.
Each is a separate Claude Code subprocess invocation. Order matters — do not reorder.
The pipeline is: 00 (docs) → 01 (build) → 02 (tests) → 03 (security) → 04 (smoke) → 05 (review).

### Job Lifecycle

1. POST `/api/jobs` → create job, write PRD.md to `/tmp/prd-builder/{jobId}/`, return jobId
2. `setImmediate(() => runJob(job))` — runs prompt pipeline sequentially
3. Each prompt in the pipeline is a separate `spawn('claude', ...)` call on the same `workDir`
4. WebSocket broadcasts every stdout line to the connected client
5. Sentinel lines `GITHUB_REPO:` and `DEPLOY_URL:` parsed from final prompt's output

### Preflight

All five tools must be green before launch is allowed:
Claude Code · GitHub CLI (`gh`) · Google Cloud CLI (`gcloud`) · Firebase CLI
Each checked via `execSync` server-side at `GET /api/preflight`.

### WebSocket Reconnection

Buffer last 500 output lines per job. Replay buffer to any client that connects after job starts.
Auto-retry connection every 3 seconds on disconnect.

## Phase Detection (keyword → phase mapping)

| Keyword in stdout       | Phase advanced to |
| ----------------------- | ----------------- |
| scaffold, structure     | Scaffold          |
| writing, creating       | Code Generation   |
| playwright, test        | Testing           |
| deploying, cloud run    | Deploy            |
| pushing, github         | GitHub            |
| GITHUB_REPO: (sentinel) | Done              |

## Design System

- **Background**: `#0a0a0a` (page), `#111111` (surface), `#222222` (border)
- **Accent**: `#6366f1` (indigo)
- **Success**: `#22c55e` · **Error**: `#ef4444` · **Assumption lines**: `#f59e0b`
- **Terminal bg**: `#0d0d0d` · Terminal text: green monospace (Geist Mono)
- **UI font**: Geist Sans
- **Icons**: lucide-react only — never images or external assets
- **Feel**: Linear / Vercel — clean, dark, premium developer tool

## Sentinel Output Format (MUST be exact)

Claude Code's final prompt must output these as its last two lines:

```
GITHUB_REPO: https://github.com/USERNAME/REPO-NAME
DEPLOY_URL: https://SERVICE-HASH-REGION.run.app
```

These are parsed by `parseSentinels()` in `server/src/index.ts`. Format is rigid.

## What's Not In v1

- No stack selection (stack is fixed — intentional)
- No job persistence across server restarts
- No user accounts or auth
- No re-run / retry UI (restart server to clear jobs)
- No parallel jobs (one at a time per server instance)

## Documentation Hierarchy

| Layer                     | Loaded             | What goes here                                 |
| ------------------------- | ------------------ | ---------------------------------------------- |
| **CLAUDE.md** (this file) | Every conversation | Rules that prevent mistakes on ANY task        |
| **MEMORY.md**             | Every conversation | Cross-cutting patterns learned across sessions |
| **.claude/memory/**       | On demand          | Feature-specific deep dives                    |
| **Inline comments**       | When code is read  | Non-obvious "why" explanations                 |

### Sub-Memory Files

| File                  | When to load                                |
| --------------------- | ------------------------------------------- |
| prompt-engineering.md | Editing or debugging `server/src/prompt.ts` |
| preflight.md          | Changing preflight check logic              |
| websocket.md          | Debugging streaming or reconnection         |
| phase-detection.md    | Modifying phase advancement keyword logic   |
