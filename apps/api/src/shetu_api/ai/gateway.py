"""The only module that talks to a language model.

Providers share one method: generate(task, system, prompt, schema) -> validated schema instance.
- GeminiProvider and AnthropicProvider call hosted models with schema-constrained output.
- ReplayProvider serves recorded replies from fixtures/replay, for tests and offline work.
- RecordingProvider wraps a live provider and saves each reply so it can be replayed later.
"""

import hashlib
import json
import re
from functools import lru_cache
from pathlib import Path
from typing import Any, Protocol, TypeVar, cast

import structlog
from pydantic import BaseModel, ValidationError

from shetu_api.config import Settings, get_settings

log = structlog.get_logger()
T = TypeVar("T", bound=BaseModel)
MAX_ATTEMPTS = 2


class AIError(RuntimeError):
    """The model could not produce a valid reply."""


class Provider(Protocol):
    name: str

    def generate(self, *, task: str, system: str, prompt: str, schema: type[T]) -> T: ...


def _key(task: str, system: str, prompt: str) -> str:
    return hashlib.sha256(f"{task}\n{system}\n{prompt}".encode()).hexdigest()[:16]


class GeminiProvider:
    name = "gemini"

    def __init__(self, api_key: str, model: str) -> None:
        from google import genai

        self._client = genai.Client(api_key=api_key)
        self._model = model

    def generate(self, *, task: str, system: str, prompt: str, schema: type[T]) -> T:
        from google.genai import types

        response = self._client.models.generate_content(
            model=self._model,
            contents=prompt,
            config=types.GenerateContentConfig(
                system_instruction=system,
                response_mime_type="application/json",
                response_schema=schema,
                temperature=0.3,
            ),
        )
        if isinstance(response.parsed, schema):
            return response.parsed
        return schema.model_validate_json(response.text or "")


class AnthropicProvider:
    name = "anthropic"

    def __init__(self, api_key: str, model: str) -> None:
        import anthropic

        self._client = anthropic.Anthropic(api_key=api_key)
        self._model = model

    def generate(self, *, task: str, system: str, prompt: str, schema: type[T]) -> T:
        response = self._client.messages.parse(
            model=self._model,
            max_tokens=8000,
            system=system,
            messages=[{"role": "user", "content": prompt}],
            output_format=schema,
        )
        if response.stop_reason == "refusal":
            raise AIError(f"{task}: the model declined the request")
        parsed = response.parsed_output
        if not isinstance(parsed, schema):
            raise AIError(f"{task}: no structured output returned")
        return parsed


_THINK = re.compile(r"<think>.*?</think>", re.DOTALL)
_FENCE = re.compile(r"^```(?:json)?\s*|\s*```$")


def _clean_json(text: str) -> str:
    """Small local models sometimes wrap JSON in reasoning tags or code fences."""
    text = _THINK.sub("", text).strip()
    return _FENCE.sub("", text).strip()


class OpenAICompatibleProvider:
    """Any server speaking the OpenAI chat API: Groq in the cloud, or a local model through
    Ollama, LM Studio, llama.cpp or vLLM. Requests a JSON schema; falls back to JSON mode for
    servers that do not support schemas. The schema is also stated in the system prompt, which
    keeps small models on track."""

    def __init__(self, name: str, base_url: str, api_key: str, model: str) -> None:
        from openai import OpenAI

        self.name = name
        self._client = OpenAI(base_url=base_url, api_key=api_key, timeout=120)
        self._model = model
        self._schema_mode = True

    def generate(self, *, task: str, system: str, prompt: str, schema: type[T]) -> T:
        json_schema = schema.model_json_schema()
        messages = [
            {
                "role": "system",
                "content": f"{system}\n\nReply with one JSON object only, matching this JSON "
                f"schema exactly:\n{json.dumps(json_schema, ensure_ascii=False)}",
            },
            {"role": "user", "content": prompt},
        ]
        content = self._complete(task, messages, json_schema)
        return schema.model_validate_json(_clean_json(content))

    def _complete(
        self, task: str, messages: list[dict[str, str]], json_schema: dict[str, object]
    ) -> str:
        from openai import BadRequestError

        if self._schema_mode:
            try:
                response = self._client.chat.completions.create(
                    model=self._model,
                    messages=cast(Any, messages),
                    temperature=0.3,
                    response_format=cast(
                        Any,
                        {
                            "type": "json_schema",
                            "json_schema": {"name": task, "schema": json_schema},
                        },
                    ),
                )
                return response.choices[0].message.content or ""
            except BadRequestError:
                log.info("ai.schema_unsupported", provider=self.name, task=task)
                self._schema_mode = False
        response = self._client.chat.completions.create(
            model=self._model,
            messages=cast(Any, messages),
            temperature=0.3,
            response_format={"type": "json_object"},
        )
        return response.choices[0].message.content or ""


class ReplayProvider:
    """Serves fixtures/replay/<task>/<key>.json, falling back to <task>/default.json."""

    name = "replay"

    def __init__(self, directory: Path) -> None:
        self._dir = directory

    def generate(self, *, task: str, system: str, prompt: str, schema: type[T]) -> T:
        exact = self._dir / task / f"{_key(task, system, prompt)}.json"
        fallback = self._dir / task / "default.json"
        path = exact if exact.exists() else fallback
        if not path.exists():
            raise AIError(f"{task}: no recorded reply at {exact.name} or default.json")
        return schema.model_validate_json(path.read_text(encoding="utf-8"))


class RecordingProvider:
    def __init__(self, inner: Provider, directory: Path) -> None:
        self._inner = inner
        self._dir = directory
        self.name = f"{inner.name}+record"

    def generate(self, *, task: str, system: str, prompt: str, schema: type[T]) -> T:
        result = self._inner.generate(task=task, system=system, prompt=prompt, schema=schema)
        out = self._dir / task / f"{_key(task, system, prompt)}.json"
        out.parent.mkdir(parents=True, exist_ok=True)
        out.write_text(result.model_dump_json(indent=2), encoding="utf-8")
        return result


class Gateway:
    def __init__(self, provider: Provider) -> None:
        self.provider = provider

    def run(self, *, task: str, system: str, prompt: str, schema: type[T]) -> T:
        last: Exception | None = None
        for attempt in range(1, MAX_ATTEMPTS + 1):
            try:
                result = self.provider.generate(
                    task=task, system=system, prompt=prompt, schema=schema
                )
                log.info("ai.call", task=task, provider=self.provider.name, attempt=attempt)
                return result
            except (ValidationError, json.JSONDecodeError) as exc:
                last = exc
                log.warning("ai.invalid_reply", task=task, attempt=attempt, error=str(exc)[:300])
            except AIError:
                raise
            except Exception as exc:  # provider SDK errors: network, quota, auth
                log.error("ai.provider_error", task=task, error=str(exc)[:300])
                raise AIError(f"{task}: provider error: {exc}") from exc
        raise AIError(f"{task}: no valid reply after {MAX_ATTEMPTS} attempts") from last


def build_provider(settings: Settings) -> Provider:
    provider: Provider
    if settings.ai_provider == "gemini":
        if not settings.gemini_api_key:
            raise AIError("SHETU_GEMINI_API_KEY is not set")
        provider = GeminiProvider(settings.gemini_api_key, settings.gemini_model)
    elif settings.ai_provider == "anthropic":
        if not settings.anthropic_api_key:
            raise AIError("SHETU_ANTHROPIC_API_KEY is not set")
        provider = AnthropicProvider(settings.anthropic_api_key, settings.anthropic_model)
    elif settings.ai_provider == "groq":
        if not settings.groq_api_key:
            raise AIError("SHETU_GROQ_API_KEY is not set")
        provider = OpenAICompatibleProvider(
            "groq", settings.groq_base_url, settings.groq_api_key, settings.groq_model
        )
    elif settings.ai_provider == "local":
        provider = OpenAICompatibleProvider(
            "local", settings.local_base_url, settings.local_api_key, settings.local_model
        )
    else:
        return ReplayProvider(settings.replay_dir)
    if settings.ai_record:
        provider = RecordingProvider(provider, settings.replay_dir)
    return provider


@lru_cache
def get_gateway() -> Gateway:
    return Gateway(build_provider(get_settings()))
