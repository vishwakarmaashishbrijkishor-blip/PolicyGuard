# Roadmap

## v0.1: CLI, diff parsing, policy engine, deterministic rules (implemented)

- Git diff engine with ref resolution, renames, binaries, and merge-base semantics.
- YAML policies with Zod validation, suppressions, and exceptions.
- ts-morph semantic index with a content-hash cache.
- Eight deterministic rules, terminal/JSON/SARIF output, GitHub Action, `explain`.
- Optional LLM stage with evidence validation and prompt-injection defenses (early preview of v0.3 goals).

## v0.2: GitHub Action, JSON/SARIF reporting, improved TypeScript indexing

- Check-run output via the GitHub API (richer than workflow annotations).
- Path alias (`tsconfig` paths) and monorepo-aware module resolution.
- Class inheritance and decorators across files for NestJS authorization detection.
- Incremental index that only re-reads changed blobs.

## v0.3: LLM-assisted contextual review with evidence validation

- More providers behind `LlmClient` (Anthropic, local models).
- Retrieval of relevant imported symbols and tests for richer, still minimal, context.
- Calibration of confidence scoring against the evaluation set.
- Cost and token reporting.

## v0.4: Policy packs, custom rule SDK, evaluation dashboard

- Shareable policy packs (npm packages) with versioning.
- Public rule SDK and loader for third-party rules.
- Evaluation dashboard fed by `docs/evaluation.md` datasets.

## v0.5: Additional language support

- Python and Go indexers behind the same `FileIndex` abstraction.
- Language-specific route, test, and migration detectors.
