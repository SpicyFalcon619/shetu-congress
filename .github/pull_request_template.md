## What and why

<!-- One or two sentences. Link the issue: Closes #123 -->

## How it was checked

- [ ] `make check` passes (lint, types, tests, build)
- [ ] Tried it in the browser as the relevant persona
- [ ] If the API changed: ran `make api-types` and committed `openapi.json` and `schema.d.ts`
- [ ] If a prompt changed: noted it below and re-recorded replay fixtures if tests depend on them

## Product rules still hold

- [ ] No field or prompt asks for the reason for leave, health, pregnancy or family
- [ ] Nothing scores, ranks or rates people
- [ ] Dates, hours and capacity are still decided by code, not by the model
