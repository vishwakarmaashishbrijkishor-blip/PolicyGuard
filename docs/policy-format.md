# Policy format

Policies are YAML files under `.policyguard/policies/` (any depth, `*.yaml` or `*.yml`). Every file is validated; one invalid file stops the review so enforcement never degrades silently.

```yaml
version: 1

policies:
  - id: auth-required-on-new-route
    title: New HTTP routes must declare an authorization strategy
    description: >
      Every new HTTP route must either apply authorization middleware,
      perform an explicit authorization check, or be explicitly marked
      as public with a documented reason.
    category: security
    severity: error
    languages: [typescript]
    paths:
      include: ["src/routes/**/*.ts", "src/api/**/*.ts"]
      exclude: ["**/*.test.ts"]
    rule: new-route-requires-authorization
    options:
      requireUnauthorizedTest: true
    remediation: >
      Add authorization middleware, call an authorization service, or
      annotate the route as public with a justification.
    evidence:
      required: true
```

## Fields

| Field                             | Required | Description                                                                                           |
| --------------------------------- | -------- | ----------------------------------------------------------------------------------------------------- |
| `version`                         | yes      | Must be `1`.                                                                                          |
| `policies`                        | yes      | At least one policy.                                                                                  |
| `id`                              | yes      | Unique across all files; lowercase letters, digits, hyphens.                                          |
| `title`                           | yes      | Short statement of the standard.                                                                      |
| `description`                     | no       | Longer explanation (also given to the LLM when AI is enabled).                                        |
| `category`                        | yes      | Lowercase label, e.g. `security`, `architecture`, `testing`, `migrations`.                            |
| `severity`                        | yes      | `info`, `warning`, `error`, or `critical`. This is the severity of every finding the policy produces. |
| `enabled`                         | no       | Default `true`. Disabled policies are listed but do not run.                                          |
| `languages`                       | no       | Default `[typescript]`. `typescript` also covers JavaScript sources. `any` matches every file type.   |
| `paths.include` / `paths.exclude` | no       | Repository-relative POSIX globs. Empty `include` means "use the rule's default scope" (see below).    |
| `rule`                            | yes      | One of the built-in rule ids. Unknown ids fail validation and list the valid ones.                    |
| `options`                         | no       | Rule-specific options (validated by the rule).                                                        |
| `remediation`                     | no       | Guidance shown with each finding.                                                                     |
| `evidence.required`               | no       | Must be `true`; evidence cannot be disabled.                                                          |
| `ai.allowed`                      | no       | Default `false`. Allows AI-assisted analysis for this policy.                                         |
| `suppressions`                    | no       | Policy-scoped exceptions (see below).                                                                 |
| `documentationUrl`                | no       | Link included in findings.                                                                            |

Unknown fields are rejected, which catches typos.

## Severity levels

| Severity   | Meaning                          | Blocks by default        |
| ---------- | -------------------------------- | ------------------------ |
| `info`     | Informational                    | no                       |
| `warning`  | Should be fixed; may be accepted | no (yes with `--strict`) |
| `error`    | Violates a standard              | yes                      |
| `critical` | Dangerous, e.g. a leaked secret  | yes                      |

`review.failOn` / `--fail-on` sets the lowest blocking severity. Policy severity is the override: two policies can use the same rule with different severities and scopes.

## Path filters

`include` and `exclude` are globs (picomatch syntax, dotfiles included). Validation rejects empty patterns, absolute paths, backslashes, `..` segments, and unbalanced brackets.

When `include` is empty, the rule's default scope applies, taken from configuration `paths`:

| Rule                                        | Default scope      |
| ------------------------------------------- | ------------------ |
| `new-route-requires-authorization`          | `paths.api`        |
| `migration-requires-rollback`               | `paths.migrations` |
| `no-direct-db-access-in-ui`                 | `paths.ui`         |
| `protected-path-requires-review-annotation` | `paths.protected`  |
| `deleted-test-requires-justification`       | `paths.tests`      |
| other rules                                 | all changed files  |

## Rule options

| Rule                                        | Option                                                              | Default                                            |
| ------------------------------------------- | ------------------------------------------------------------------- | -------------------------------------------------- |
| `new-route-requires-authorization`          | `additionalAuthPatterns` (regex strings), `requireUnauthorizedTest` | `[]`, `true`                                       |
| `no-direct-db-access-in-ui`                 | `forbiddenModules`, `allowedModules`, `allowedImportPaths`          | common DB clients, `[]`, `["src/services/**"]`     |
| `protected-path-requires-review-annotation` | `acceptCodeowners`                                                  | `true`                                             |
| `secret-detected-in-source`                 | `allowlistPatterns` (regex strings), `reportTestFixtures`           | `[]`, `false`                                      |
| `dependency-without-lockfile-update`        | `lockfiles`                                                         | `pnpm-lock.yaml`, `package-lock.json`, `yarn.lock` |
| `public-api-breaking-change`                | `entryPoints`                                                       | `["src/index.ts"]`                                 |

## Annotations

| Annotation                                                                                                | Used by                                     |
| --------------------------------------------------------------------------------------------------------- | ------------------------------------------- |
| `policyguard: public-route reason="..."` (within 3 lines above the route)                                 | `new-route-requires-authorization`          |
| `policyguard: migration-justified reason="..."` (file or commit message)                                  | `migration-requires-rollback`               |
| `policyguard: test-change-justified reason="..."` (next to the test, in the file, or in a commit message) | `deleted-test-requires-justification`       |
| `policyguard: reviewed-by <name>` (file or commit message)                                                | `protected-path-requires-review-annotation` |

Annotations that need a `reason` are ignored when the reason is empty.

## Suppressions and exceptions

A suppression keeps the finding in every report (marked `suppressed`, with its reason) but it never blocks. A reason is mandatory. Three scopes exist:

1. Inline, on or directly above the line: `// policyguard-ignore <rule-id> reason="..."`.
2. Policy exception: `suppressions:` under a policy, with `paths`, `reason`, optional `author` and `expiresAt`.
3. Global: `suppressions:` in `policyguard.config.json`, additionally with `ruleId`.

`expiresAt` (ISO date) makes a suppression lapse automatically; the finding becomes active again and the report says the suppression expired.

```yaml
suppressions:
  - paths: ["src/legacy/**"]
    reason: "Legacy admin API, tracked in SEC-123"
    author: "alice"
    expiresAt: "2027-03-01"
```
