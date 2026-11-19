"""The five AI tasks. Each builds a prompt from plain data and returns a validated object.

Two roles: the interviewer (next_question, extract_duties) and the planner (propose_cover,
parse_change, explain_return).
"""

import json
from datetime import date
from functools import cache
from importlib import resources
from typing import Any

from shetu_api.ai.gateway import Gateway
from shetu_api.ai.schemas import (
    CoverProposal,
    ExtractedDuties,
    NextQuestion,
    ParsedChange,
    ReturnExplanation,
)


@cache
def prompt(name: str) -> str:
    return (resources.files("shetu_api.ai") / "prompts" / f"{name}.md").read_text(encoding="utf-8")


def _transcript(turns: list[tuple[str, str]]) -> str:
    return "\n".join(f"{speaker.upper()}: {text}" for speaker, text in turns) or "(no turns yet)"


def next_question(
    gw: Gateway, *, job_description: str, turns: list[tuple[str, str]], duty_titles: list[str]
) -> NextQuestion:
    body = (
        f"JOB DESCRIPTION:\n{job_description}\n\n"
        f"DUTIES FOUND SO FAR:\n{json.dumps(duty_titles, ensure_ascii=False)}\n\n"
        f"TRANSCRIPT:\n{_transcript(turns)}\n\n"
        f"Questions asked so far: {sum(1 for s, _ in turns if s == 'shetu')}. Ask the next one."
    )
    return gw.run(
        task="next_question", system=prompt("interviewer"), prompt=body, schema=NextQuestion
    )


def extract_duties(
    gw: Gateway, *, job_description: str, turns: list[tuple[str, str]]
) -> ExtractedDuties:
    body = (
        f"JOB DESCRIPTION:\n{job_description}\n\n"
        f"TRANSCRIPT (employee lines are the source for quotes):\n{_transcript(turns)}"
    )
    return gw.run(
        task="extract_duties", system=prompt("extractor"), prompt=body, schema=ExtractedDuties
    )


def propose_cover(
    gw: Gateway,
    *,
    employee: dict[str, Any],
    duties: list[dict[str, Any]],
    candidates: list[dict[str, Any]],
) -> CoverProposal:
    body = (
        f"EMPLOYEE ON LEAVE (never assign to): {json.dumps(employee, ensure_ascii=False)}\n\n"
        f"DUTIES TO COVER:\n{json.dumps(duties, ensure_ascii=False, indent=1)}\n\n"
        f"CANDIDATES:\n{json.dumps(candidates, ensure_ascii=False, indent=1)}"
    )
    return gw.run(task="propose_cover", system=prompt("planner"), prompt=body, schema=CoverProposal)


def parse_change(
    gw: Gateway,
    *,
    text: str,
    today: date,
    duties: list[dict[str, Any]],
    people: list[dict[str, Any]],
) -> ParsedChange:
    body = (
        f"TODAY: {today.isoformat()}\n"
        f"DUTIES: {json.dumps(duties, ensure_ascii=False)}\n"
        f"PEOPLE: {json.dumps(people, ensure_ascii=False)}\n\n"
        f"SENTENCE: {text}"
    )
    return gw.run(
        task="parse_change", system=prompt("change_parser"), prompt=body, schema=ParsedChange
    )


def explain_return(
    gw: Gateway, *, employee_name: str, comparison: list[dict[str, Any]]
) -> ReturnExplanation:
    body = (
        f"EMPLOYEE: {employee_name}\n"
        f"COMPARISON (computed by code):\n{json.dumps(comparison, ensure_ascii=False, indent=1)}"
    )
    return gw.run(
        task="explain_return",
        system=prompt("return_explainer"),
        prompt=body,
        schema=ReturnExplanation,
    )
