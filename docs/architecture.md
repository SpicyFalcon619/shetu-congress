# Architecture

## Request flow

```
Browser (Next.js client components)
  │  typed calls via openapi-fetch; persona sent as X-Shetu-Persona
  ▼
FastAPI route (routes.py)  ── permission check (R9)
  ▼
Service (services.py)
  ├─ loads ORM objects (SQLAlchemy 2)
  ├─ calls an AI task (ai/tasks.py → ai/gateway.py), output validated by Pydantic
  ├─ turns rows into plain facts and runs the rules (domain/rules.py)
  ├─ saves results and writes an audit event
  ▼
PostgreSQL (SQLite locally and in tests)
```

## AI design

Two roles, coordinated by code rather than an agent framework:

| Role | Tasks | Output schema |
|---|---|---|
| Interviewer | `next_question`, `extract_duties` | `NextQuestion`, `ExtractedDuties` |
| Planner | `propose_cover`, `parse_change`, `explain_return` | `CoverProposal`, `ParsedChange`, `ReturnExplanation` |

- **Grounding.** A duty marked "said" must carry the employee's exact words. R1 checks the quote against the transcript after Unicode normalization; a quote that is not found downgrades the duty to "suggested" and flags it.
- **References, not free text.** The planner refers to duties by short refs (D1, D2) and to people by known ids. Unknown ids are discarded, never trusted.
- **Validation and retry.** Every reply is parsed into a Pydantic model. An invalid reply is retried once; a second failure returns a clear 502 instead of bad data.
- **Providers.** Gemini and Claude use their schema-constrained output features. Replay serves recorded replies so tests and demos run without a network; Record saves live replies for later replay.
- **What the model never does.** It does not compute dates or hours, decide feasibility, approve anything, or see a reason for leave.

## Data model

`people`, `leaves`, `duties`, `transcript_turns`, `availability`, `assignments`, `change_requests`, `return_items`, `audit_events`. There is no column for the reason for leave and no score for any person.

## Rules

| Rule | Checks | Where |
|---|---|---|
| R1 | Quotes exist in the transcript | `check_quotes`, applied during extraction |
| R2 | Suggested duties are confirmed before they count | `check_confirmation`, `duties_in_plan` |
| R3 | Every duty has an owner every day of the leave | `check_coverage` |
| R4 | No one exceeds their stated spare hours in any week | `check_capacity` |
| R5 | Nothing is assigned to the person on leave | `check_no_work_to_absent` |
| R6 | Every assignment ends by return plus the handback window | `check_assignments_end` |
| R7 | Availability older than 30 days is asked again | `check_stale` |
| R8 | Nothing stays with cover for good without the employee's agreement | `check_return` |
| R9 | Only the manager approves; every approval is logged | `routes.py`, `auth.py` |

## Authentication

The demo uses persona selection: the client sends `X-Shetu-Persona`, and every permission is checked on the server. Replacing `auth.current_person` with an OIDC provider changes no route or service.
