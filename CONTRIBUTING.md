# Contributing to PolicyGuard

Thanks for helping. PolicyGuard is a TypeScript/Node.js (>= 20) project managed with pnpm.

## Setup

```bash
pnpm install
pnpm build
pnpm lint
pnpm test
```

## Ground rules

- TypeScript strict mode, no `any`.
- Every finding a rule produces must carry evidence. Rules never print; they return findings.
- Deterministic rules must stay independent of the LLM layer. The LLM can add findings; it can never remove or downgrade deterministic ones.
- Add tests with every change. Do not delete or weaken a test to make it pass.
- Run `pnpm format` before committing; CI runs `pnpm lint` and `pnpm format:check`.
- Use meaningful commit messages (`feat:`, `fix:`, `docs:`, `test:`, `chore:`).

## Adding a rule

See [docs/rule-authoring.md](docs/rule-authoring.md).

## Reporting security issues

Do not open a public issue for vulnerabilities in PolicyGuard itself. Contact the maintainers privately.
