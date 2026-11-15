# PolicyGuard 0.1.0 release notes

First public release of PolicyGuard: an evidence-linked, policy-as-code review engine for AI-assisted TypeScript development.

## Highlights

- Review a pull-request diff with `policyguard review --base origin/main` and get findings that each cite evidence.
- Eight built-in rules cover authorization on new routes, migrations, direct database access in UI code, deleted or skipped tests, protected paths, committed secrets, dependency changes without a lockfile update, and public API breaking changes.
- Standards are YAML policies under `.policyguard/policies/`, validated strictly. Exceptions need a written reason and can expire.
- Terminal, JSON, and SARIF output; GitHub annotations; a GitHub Action.
- Optional AI analysis is off by default, can only add validated findings, and can never suppress or override deterministic ones.

## Upgrade and install

```bash
npm install --global policyguard
policyguard init
policyguard review --base origin/main
```

Requires Node.js 20 or newer.

## Things to know

- Exit codes: `0` pass, `1` blocking findings, `2` the review could not run.
- Policy errors stop the review rather than skipping policies.
- `.policyguard/cache/` is written during `review` and ignores itself.
- See `docs/evaluation.md` for measured precision, recall, and runtime on the bundled evaluation set.

## Known limitations

See the README and CHANGELOG. Planned work is in `docs/roadmap.md`.
