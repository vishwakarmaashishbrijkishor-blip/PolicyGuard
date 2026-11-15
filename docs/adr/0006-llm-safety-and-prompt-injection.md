# ADR 0006: LLM safety and prompt injection

- Status: accepted

## Context

Everything in a pull request is attacker-controllable: code, comments, file names, commit messages, policy text. A model that reads it can be told to ignore findings or to invent them.

## Decision

1. Instructions live only in the system prompt, which states that fenced content is data and that the model cannot change policies, disable rules, suppress findings, or edit files.
2. Repository content is placed in fenced blocks whose markers include a random per-request nonce; occurrences of the nonce in content are removed, and fence-like runs of `=` and backticks are broken up.
3. Content is sanitized: control and bidi characters removed, long lines truncated, instruction-like lines prefixed with a defanging marker (still visible as data).
4. Minimal context only: relevant hunks, bounded source windows, policy definitions, test and import names. Never `.env`, key files, credentials, or unrelated files. With `redactSecrets` (default), secret-looking lines and private-key blocks are removed.
5. Output must match a strict schema (no unknown keys, so there is no channel for "suppress" or "disable").
6. Every candidate is validated against the real repository and must cite evidence (see ADR 0003).
7. The stage is additive; deterministic findings cannot be altered (see ADR 0002).
8. API keys come from the environment; endpoints must be HTTPS (localhost excepted); provider error bodies are never echoed.

## Consequences

- Injection attempts degrade to ignored noise or rejected candidates rather than changed outcomes.
- Heuristic sanitization is defense in depth, not the primary control: the structural controls (schema, validation, additive-only) hold even if a model is fully compromised.
- Limits: a successful injection can still cause a plausible, evidence-backed false positive; such findings are capped at `warning` and labeled `llm-assisted`.
