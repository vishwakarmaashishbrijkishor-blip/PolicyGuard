# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses
[Semantic Versioning](https://semver.org/).

## [Unreleased]

## [0.1.0] - 2026-11-15

### Added

- Project foundation: TypeScript/ESM toolchain, strict configuration loader, error model, logger, and CLI.
- Git diff engine: base/head resolution (`--base`, `review.defaultBase`, `origin/main`, `main`, `master`), `base...head` diffs, unified-diff parser (added, modified, deleted, renamed, binary files; multiple hunks; no-trailing-newline), and a pipelined `git cat-file` object reader.
- Policy engine: YAML policies validated with Zod (unknown rules, duplicate ids, invalid severities and globs, unsupported versions), path and language scoping, inline, policy-level, and global suppressions with mandatory reasons and optional expiry.
- ts-morph semantic index: imports, exports with signatures, symbols, Express/Fastify/NestJS routes and middleware, Vitest/Jest/Mocha tests, SQL/Knex/Prisma/TypeORM/Sequelize migrations, manifests, import graph, and a content-hash JSON cache.
- Eight deterministic rules: `new-route-requires-authorization`, `migration-requires-rollback`, `no-direct-db-access-in-ui`, `deleted-test-requires-justification`, `protected-path-requires-review-annotation`, `secret-detected-in-source`, `dependency-without-lockfile-update`, `public-api-breaking-change`.
- Commands: `init`, `review`, `validate`, `policies`, `explain`.
- Reports: terminal, versioned JSON, SARIF 2.1.0, GitHub Actions annotations and step summary.
- GitHub Action (`action.yml`) and CI/release workflows.
- Optional LLM-assisted analysis: provider-agnostic client, mock and OpenAI-compatible implementations, minimal-context prompts, secret redaction, prompt-injection defenses, strict response schema, evidence validation, and advisory-only severity.
- Example repositories (`examples/vulnerable-service`, `examples/compliant-service`), a runnable demo (`pnpm demo`), and an evaluation set (`pnpm evaluate`).
- Documentation: architecture, policy format, rule authoring, configuration, evaluation, roadmap, and six ADRs.

### Known limitations

- TypeScript and JavaScript only; analysis is syntactic, not type-checked.
- Authorization, test, and migration detection are heuristics tuned for common frameworks.
- SARIF output omits code flows, fixes, and baseline state.
