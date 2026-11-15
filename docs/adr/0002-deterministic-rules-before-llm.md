# ADR 0002: Deterministic rules before LLM analysis

- Status: accepted

## Context

Review standards must be enforced consistently. LLM output is non-deterministic, costs money, can leak code, and can be steered by text inside the code under review.

## Decision

Deterministic rules run first and define what blocks a merge. The LLM stage is optional and additive: it receives deterministic findings read-only, cannot remove or downgrade them, skips files the same rule already flagged, and its findings are capped at `warning`. The engine drops anything the stage returns that is not `llm-assisted` or whose id collides with a deterministic finding.

## Consequences

- CI results are reproducible with AI disabled (the default).
- AI findings are advisory and visibly labeled.
- Gaps that need judgment (indirect data access, unusual authorization patterns) can be explored without weakening the baseline.
