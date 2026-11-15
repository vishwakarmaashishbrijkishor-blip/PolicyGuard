# ADR 0004: Policy format

- Status: accepted

## Context

Policies must be human-readable, reviewable in pull requests, versioned with the code, and strictly validated.

## Decision

Policies are YAML (`version: 1`) in `.policyguard/policies/`, validated with Zod using strict objects. Each policy binds one built-in rule to a severity, scope (languages, path globs), options, and remediation. Suppressions and exceptions are explicit objects with a mandatory reason, optional author and expiry, and can be inline, per policy, or global. Any policy error stops the review (exit code 2).

Decisions made where the specification was open:

- `paths.include` empty means "the rule's default scope from configuration `paths`", so one configuration change retargets several policies.
- `languages: [any]` matches every file type; `typescript` also covers JavaScript.
- Policy severity is the single source of truth for finding severity.
- A new route is "protected" by recognized middleware, guards, inline checks, or a test asserting 401/403; the test clause reflects the specification's wording.

## Consequences

- Policy changes are auditable in Git history.
- Because a PR can edit policies, protect `.policyguard/**` with CODEOWNERS or the `protected` path list.
