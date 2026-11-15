# ADR 0001: Use TypeScript and Node.js

- Status: accepted

## Context

The first target users build TypeScript/Node.js backends and use AI coding assistants. The tool must parse TypeScript semantically, ship as an npm package, and run in GitHub Actions.

## Decision

Implement PolicyGuard in TypeScript (strict mode, ESM) on Node.js 20+, managed with pnpm. Use ts-morph for AST analysis, Commander for the CLI, Zod for validation, `yaml` for policies, Vitest for tests, tsup for bundling.

## Consequences

- The analyzer and its subjects share a language and ecosystem; ts-morph gives a syntactic AST without running a full type checker.
- Distribution is a single npm package with a `bin` entry.
- TypeScript is pinned to 5.9 for tooling compatibility (tsup declaration bundling needs the TypeScript compiler API, which TypeScript 7 does not ship).
- Other languages require new indexers (roadmap v0.5).
