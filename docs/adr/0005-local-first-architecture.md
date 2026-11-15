# ADR 0005: Local-first architecture

- Status: accepted

## Context

Teams are reluctant to send source code to third parties, and review tooling should work offline and in any CI.

## Decision

PolicyGuard runs entirely locally: it reads Git objects, builds an in-process index, and writes only a self-ignoring cache under `.policyguard/cache/`. Git is accessed through `simple-git` with a direct Git CLI fallback, and file contents are read with one pipelined `git cat-file --batch` process. The cache is a JSON file keyed by content hash. SQLite was considered and rejected as unnecessary.

## Consequences

- No service to operate; works on laptops and in CI.
- File access is independent of the working tree, so `--head` can be any ref.
- The only network egress is the optional LLM provider the user configures.
