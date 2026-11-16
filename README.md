# PolicyGuard

Evidence-linked, policy-as-code review engine for AI-assisted software development.

PolicyGuard turns your team's engineering standards into versioned policies, checks Git pull-request diffs with deterministic static analysis, and can optionally use an LLM for context-dependent findings. Every finding shows its evidence. The LLM can never suppress or override a deterministic finding.

## Problem

AI coding assistants write code faster than people can review it. High-impact mistakes slip through: a new route without authorization, an irreversible migration, a database client imported into UI code, a deleted test, a committed secret. Review standards that live in people's heads are applied inconsistently. PolicyGuard encodes them as policies and checks them on every change, without replacing your SAST, secret, or dependency scanners.

## Key features

- Policies as YAML in `.policyguard/policies/`, validated with clear errors, reviewable in pull requests.
- Eight built-in rules: authorization on new routes, migration rollback and destructive operations, no direct DB access in UI code, deleted or skipped tests, protected paths, secrets, dependency changes without a lockfile update, public API breaking changes.
- Real diff analysis: added, modified, deleted, renamed, and binary files, hunks, and line numbers; a ts-morph semantic index (Express, Fastify, NestJS, Vitest/Jest/Mocha, Knex/Prisma/TypeORM/Sequelize/SQL) with a content-hash cache.
- Evidence on every finding; findings can be explained, suppressed with an auditable reason, or given an expiry.
- Terminal, JSON, and SARIF 2.1.0 reports; GitHub Actions annotations and step summary; stable exit codes.
- Optional, isolated LLM stage with schema validation, evidence validation, prompt-injection defenses, secret redaction, and advisory-only severity.
- Local first: no network access unless you enable AI.

## Installation

Requires Node.js 20 or newer.

```bash
npm install --global policyguard      # or: pnpm add -g policyguard
policyguard --version
```

From source:

```bash
git clone <your fork or this repository>
cd policyguard
pnpm install
pnpm build
node dist/cli/index.js --help
```

## Quickstart

```bash
cd your-typescript-service
policyguard init                 # creates .policyguard/ with starter policies and config
policyguard validate             # checks policies and configuration
policyguard review --base origin/main
policyguard explain <finding-id> # details, rule docs, policy, remediation, suppression options
```

Try the bundled demo (builds a throwaway repository from `fixtures/` and `examples/`):

```bash
pnpm build
pnpm demo                         # vulnerable change: findings from all eight rules
pnpm demo compliant-service       # compliant change: no findings
```

## Example output

Excerpt from `pnpm demo` (the finding id and counts vary with the change):

```text
ERROR     New route lacks authorization
          src/routes/admin-users.ts:11
          Rule: new-route-requires-authorization
          Finding: pg-1a2b3c4d5e (deterministic, high confidence)
          POST /admin/users was added without a recognizable authorization strategy.
          Evidence:
            - Added POST /admin/users route
                > adminUsersRouter.post("/admin/users", async (req, res) => {
            - No authorization middleware, guard, or explicit check found in the route chain
            - No test found that asserts unauthorized (401/403) access to /admin/users

          Remediation:
            Add authorization middleware, call an authorization service, or
            annotate the route as public with a justification: ...

Summary:
  Critical: 1
  Error: 5
  Warning: 2
  Info: 0

FAILED: 6 blocking finding(s) at or above "error".
```

## Policy example

```yaml
version: 1
policies:
  - id: auth-required-on-new-route
    title: New HTTP routes must declare an authorization strategy
    category: security
    severity: error
    languages: [typescript]
    paths:
      include: ["src/routes/**/*.ts", "src/api/**/*.ts"]
      exclude: ["**/*.test.ts"]
    rule: new-route-requires-authorization
    remediation: >
      Add authorization middleware, call an authorization service, or
      annotate the route as public with a justification.
    evidence:
      required: true
```

Justify an exception explicitly, in code:

```ts
// policyguard: public-route reason="health check"
router.get("/health", handler);
```

See [docs/policy-format.md](docs/policy-format.md).

## Configuration

`.policyguard/policyguard.config.json` (optional):

```json
{
  "version": 1,
  "review": { "defaultBase": "origin/main", "ai": { "enabled": false } },
  "paths": { "ui": ["src/components/**"], "api": ["src/routes/**"], "protected": ["infra/**"] },
  "reporting": { "format": "terminal", "failOn": "error" }
}
```

API keys are never stored in configuration; set `POLICYGUARD_LLM_API_KEY` (or the variable named by `review.ai.apiKeyEnvVar`). Every option is documented in [docs/configuration.md](docs/configuration.md).

Exit codes: `0` no blocking findings, `1` blocking findings, `2` the review could not run.

## GitHub Action

```yaml
name: PolicyGuard
on: pull_request
jobs:
  policyguard:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      security-events: write # only for upload-sarif
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - uses: policyguard/policyguard-action@v1 # replace with this repository once published
        with:
          base: origin/main
          ai: false
          fail-on: error
          upload-sarif: false
```

The action installs PolicyGuard, runs `policyguard review`, prints GitHub annotations and a step summary, optionally uploads SARIF, and fails the job according to `fail-on`.

## Architecture overview

```text
git diff base...head ──> parse ──┐
policies (YAML + Zod) ───────────┼──> deterministic rules ──> [optional LLM, additive only]
ts-morph index (cached) ─────────┘            │
                                              └──> suppressions ──> terminal | JSON | SARIF | GitHub
```

Details: [docs/architecture.md](docs/architecture.md), [rule authoring](docs/rule-authoring.md), [evaluation](docs/evaluation.md), and the [ADRs](docs/adr/).

## Limitations

- TypeScript and JavaScript only; analysis is syntactic (no type checker), so cross-file type compatibility is approximate and API-breaking detections that cannot be decided are reported as low-confidence warnings.
- Authorization detection recognizes common middleware, guard, and decorator vocabulary; extend it with `additionalAuthPatterns`.
- `deleted-test-requires-justification` and `new-route-requires-authorization` are heuristics; tune with options and suppressions.
- PolicyGuard complements SAST, secret scanning, SCA, and human review.

## Roadmap

See [docs/roadmap.md](docs/roadmap.md).

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) and the [Code of Conduct](CODE_OF_CONDUCT.md).

## License

MIT
