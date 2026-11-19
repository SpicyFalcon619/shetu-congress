# AI and data disclosure

## Data

- Every person, organization, job description and figure in this repository and the demo is synthetic. The app shows "Synthetic demo data" on every screen.
- No real employee data was collected or used. No field stores the reason for leave, health, pregnancy or family information.

## AI inside the product

- Live demo: Google Gemini through the `google-genai` SDK (model set by `SHETU_GEMINI_MODEL`). Anthropic Claude is supported by the same gateway.
- Five tasks in two roles (interviewer and planner). The prompts are in `apps/api/src/shetu_api/ai/prompts/`.
- **Replay mode.** Tests and offline runs use recorded model replies in `apps/api/fixtures/replay/`. Any demo run in replay mode is labelled as such. Recorded replies came from real model calls or, for the default fixtures, were written by the team to exercise the rules.

## AI used to build the product

The team used AI coding assistants (Claude Code) to help write code, tests and documentation. Every change is reviewed by a team member, and the team is responsible for all of it.

## Evaluation

Any evaluation figures shown in the pitch come from runs on synthetic personas and say so.
