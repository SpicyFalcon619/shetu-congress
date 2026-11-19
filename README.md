<p align="center"><img src="apps/web/public/shetu-logo.svg" alt="Shetu" width="180"></p>

<h1 align="center">Shetu সেতু</h1>

<p align="center"><b>Map her job. Hold her role. Guard her return.</b><br>
Shetu keeps a job safe while its owner is on leave. It finds the work nobody wrote down, gives the manager a cover plan that has been checked, and makes sure the job she comes back to is the job she left.</p>

<p align="center">Team Anomaly · United International University · International AI Builders Congress 2026 (Idea to Unicorn) · InfraSphere, Human+AI</p>

---

## Why

Every long leave is two worries. The employee worries her job will not be hers when she is back. Her manager worries the work will not get done. Handover today is a document and hope: duties nobody wrote down get dropped, cover plans quietly overload colleagues, and temporary cover becomes permanent without anyone asking.

Shetu is built around maternity leave, the longest and highest-stakes planned leave, and works for any planned leave of two weeks or more. It never asks why someone is away.

## What it does

| Stage | What happens | AI's job | Code's job |
|---|---|---|---|
| Before leave | An interview in Bangla, English or Banglish builds a **Role Map** | Ask follow-ups that surface hidden work; extract duties with exact quotes | R1 quote check, R2 her confirmation |
| Cover plan | A cover person for every duty, approved by the manager | Propose who covers what, with a reason | R3 full coverage, R4 capacity, R5 nothing sent to her, R6 every assignment ends, R7 fresh facts |
| During leave | A change reported in one sentence | Parse it into a structured change | Re-check the plan; the manager approves |
| At return | What returns, what changed, what stays | Explain it in Bangla and English | **R8**: nothing moves for good without her agreement, or the leave cannot close |

**AI proposes, rules check, people decide.** Only the manager can approve (R9, enforced on the server). Nothing scores or ranks people, and no field stores the reason for leave.

## Architecture

```
apps/web  Next.js 16 (App Router, React 19, TypeScript, Tailwind CSS 4, TanStack Query)
   │  typed client generated from the API's OpenAPI spec (openapi-typescript + openapi-fetch)
   ▼
apps/api  FastAPI · Pydantic v2 · SQLAlchemy 2 · Alembic · PostgreSQL
   ├─ domain/rules.py   R1–R8, pure functions, unit-tested
   ├─ services.py       use cases: load → AI → rules → save → audit
   └─ ai/gateway.py     the only code that calls a model
          ├─ Gemini (google-genai)   schema-constrained JSON
          ├─ Claude (anthropic)      structured outputs
          └─ Replay / Record         recorded replies for tests and offline demos
```

More in [docs/architecture.md](docs/architecture.md) and the decision record [docs/adr/0001-stack.md](docs/adr/0001-stack.md).

## Run it locally

Requirements: Python 3.12+ with [uv](https://docs.astral.sh/uv/), Node 24 with pnpm.

```bash
make setup
cp apps/api/.env.example apps/api/.env      # SHETU_AI_PROVIDER=replay works with no key
cp apps/web/.env.example apps/web/.env.local
make api     # http://localhost:8000/docs
make web     # http://localhost:3000
```

Pick a persona in the top bar: **Nusrat** (employee), **Rafiq** (her manager), **Karim**, **Sumaiya** or **Tanvir** (cover colleagues), **Farzana** (HR). Arif, Dr. Selina, Mehedi and Ritu run the same engine at a university.

To use a live model, set `SHETU_AI_PROVIDER=gemini` with `SHETU_GEMINI_API_KEY` (free key from Google AI Studio), or `anthropic` with `SHETU_ANTHROPIC_API_KEY`.

## Quality gates

`make check` runs what CI runs: Ruff, strict mypy and pytest for the API; Prettier, ESLint, TypeScript and a production build for the web app; a migration check; and a contract check that fails if the API and the web client's types drift apart.

## Repository guide

| Path | Contents |
|---|---|
| [apps/api](apps/api) | FastAPI service, rules, AI gateway, prompts, migrations, tests |
| [apps/web](apps/web) | Next.js app |
| [docs](docs) | Architecture, decisions, deployment, AI and data disclosure |
| [CONTRIBUTING.md](CONTRIBUTING.md) | Branches, commits, pull requests |

## Data and AI disclosure

All people, organizations and figures are synthetic, and the app says so on every screen. AI use in building and running Shetu is disclosed in [docs/ai-and-data-disclosure.md](docs/ai-and-data-disclosure.md).
