# Contributing

## Workflow

1. Open or pick an issue. One task, one branch, one pull request.
2. Branch from `main`: `feat/<short-name>`, `fix/<short-name>`, `docs/<short-name>` or `chore/<short-name>`.
3. Commit with [Conventional Commits](https://www.conventionalcommits.org/): `feat(api): add change parsing`, `fix(web): keep persona after reload`.
4. Run `make check` before pushing.
5. Open a pull request using the template. One teammate reviews; CI must be green. Merge with a merge commit.

Use your own GitHub account and your own git identity for every commit.

## Rules for code

- Every model call goes through `apps/api/src/shetu_api/ai/gateway.py`. Nothing else imports a provider SDK.
- Model output is always validated against a Pydantic schema in `ai/schemas.py`.
- Dates, hours, capacity and every check live in `domain/rules.py` as pure functions with tests. The model never decides them.
- Permissions are checked in the API, never only in the UI.
- When an endpoint changes, run `make api-types` and commit both `apps/web/openapi.json` and `apps/web/src/lib/api/schema.d.ts`.
- Prompts are files in `ai/prompts/`. Changing one is a reviewed change like any other code.
- No secrets in the repo. Keys go in `.env` locally and in the host's environment settings.

## Product rules (do not break)

- No field, prompt or screen asks for the reason for leave, health, pregnancy or family.
- Nothing scores, ranks or rates people, or estimates how replaceable they are.
- Suggested duties are questions until the employee confirms them.
- Temporary assignments always end, and nothing becomes permanent without the employee's agreement.
- Every screen says the data is synthetic.
