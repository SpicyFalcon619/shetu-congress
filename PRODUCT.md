# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Primary: line managers and HR (people operations)** in organizations such as NGOs, banks, telecoms and universities. They plan cover when an employee takes a planned leave of two weeks or more, approve cover plans and changes, and close the leave at return. They work on laptops, among other HR tools.
- **The employee taking leave** (maternity first). Describes their job in an interview, confirms their Role Map, and decides at return whether anything stays with a colleague. May use a phone.
- **Covering colleagues.** See the duties they hold and report changes.
- **Evaluators:** competition judges who watch a 3-minute video and open the live demo.

## Product Purpose

Shetu keeps a job safe while its owner is on leave. It finds the work nobody wrote down, gives the manager a cover plan that has been checked, and makes sure the job they come back to is the job they left. Success: no duty dropped, no colleague overloaded, nothing reassigned for good without the employee's agreement.

## Positioning

AI proposes, rules check, people decide. Duties carry evidence (an exact quote, a document, or a suggestion awaiting confirmation). Code, not the model, decides dates, capacity and coverage. The return guard (R8) blocks closing a leave while a duty moved for good without the employee's agreement. Built for maternity leave, works for any planned leave, and never asks why.

## Operating Context

The leave lifecycle: before leave (interview and Role Map), cover plan (proposal, availability questions, rule checks, approval), during leave (one-sentence change reports), at return (return check and close). Every approval is audit-logged. Interviews happen in Bangla, English or Banglish.

## Capabilities and Constraints

- Next.js 16 web app over a FastAPI API with a generated, typed client.
- Demo sign-in by persona; real authentication is undecided.
- Rules R1 to R9 as defined in docs/architecture.md.
- No field for the reason for leave, health, pregnancy or family. No scoring or ranking of people.

## Brand Commitments

- Name: Shetu (সেতু, "bridge"). Logo: a crimson arch over an ink deck with rose hangers and a crimson pier (apps/web/public/shetu-logo.svg).
- Colours from the team's prototype and deck: crimson #BF092F, deep crimson #8C0622, pale pink #FBE6EA, rose #F2B8C3, gold #D99A1E, paper #F8F4EC, ink #222023, green #2E9E5B.
- Fonts: Plus Jakarta Sans; Bangla in a matching Bengali face.
- Light theme only.
- No decorative emoji anywhere.
- Lines: "Map the job. Hold the role. Guard the return." and "A bridge from leave back to work." (Gender-neutral since 19 Nov: maternity is the design focus, not the only user.)

## Evidence on Hand

- Synthetic personas only: Nusrat Jahan (NGO, maternity) and Arif Hasan (university, study leave), with their teams. Every screen must say the data is synthetic.
- No real customers, pilots, testimonials or metrics exist; none may be shown or implied.

## Product Principles

1. Protect the person on leave: they confirm their map, and nothing moves for good without them.
2. The manager's job is made easier, not watched: no scores, rankings or surveillance.
3. Every AI statement traces to evidence; rules decide, and their verdicts are visible.
4. One engine for every planned leave; never ask why.

## Accessibility & Inclusion

Bangla and English text must render well. WCAG AA contrast. Usable on mobile for employees.
