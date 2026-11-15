# Configuration

Configuration lives in `.policyguard/policyguard.config.json` (or the file given with `--config`). It is optional: without it the defaults below apply. Unknown keys are rejected, so typos and inline secrets fail loudly.

```json
{
  "version": 1,
  "project": { "languages": ["typescript"], "packageManager": "pnpm" },
  "review": {
    "defaultBase": "origin/main",
    "ai": {
      "enabled": false,
      "provider": "openai-compatible",
      "model": "gpt-4.1-mini",
      "maxFilesPerRequest": 10,
      "redactSecrets": true
    }
  },
  "paths": {
    "ui": ["src/app/**", "src/components/**", "src/pages/**"],
    "api": ["src/routes/**", "src/api/**"],
    "migrations": ["migrations/**", "database/migrations/**"],
    "protected": [".github/workflows/**", "infra/**", "src/auth/**", "src/crypto/**"]
  },
  "reporting": { "format": "terminal", "failOn": "error" },
  "suppressions": []
}
```

## Options

| Key                            | Type                            | Default                                                                | Description                                                                                                                           |
| ------------------------------ | ------------------------------- | ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `version`                      | number                          | required                                                               | Must be `1`.                                                                                                                          |
| `project.languages`            | string[]                        | `["typescript"]`                                                       | Informational for v1.                                                                                                                 |
| `project.packageManager`       | `pnpm` \| `npm` \| `yarn`       | unset                                                                  | Informational; set by `init`.                                                                                                         |
| `review.defaultBase`           | string                          | unset                                                                  | Base ref used when `--base` is absent. If it cannot be resolved, PolicyGuard warns and falls back to `origin/main`, `main`, `master`. |
| `review.ai.enabled`            | boolean                         | `false`                                                                | Enable AI-assisted analysis. `--ai` / `--no-ai` override it.                                                                          |
| `review.ai.provider`           | `openai-compatible`             | `openai-compatible`                                                    | Provider implementation.                                                                                                              |
| `review.ai.model`              | string                          | `gpt-4.1-mini`                                                         | Model name sent to the provider.                                                                                                      |
| `review.ai.baseUrl`            | URL                             | OpenAI API                                                             | OpenAI-compatible endpoint including version (HTTPS required except localhost).                                                       |
| `review.ai.apiKeyEnvVar`       | string                          | `POLICYGUARD_LLM_API_KEY`                                              | Name of the environment variable holding the API key. The key itself is never stored in configuration.                                |
| `review.ai.maxFilesPerRequest` | integer 1-100                   | `10`                                                                   | Files per LLM request; at most 5 requests per review.                                                                                 |
| `review.ai.maxContextChars`    | integer                         | `24000`                                                                | Prompt budget per request; files that do not fit are skipped and reported.                                                            |
| `review.ai.redactSecrets`      | boolean                         | `true`                                                                 | Remove secret-looking lines and private-key blocks before sending.                                                                    |
| `paths.ui`                     | glob[]                          | `src/app/**`, `src/components/**`, `src/pages/**`, `src/ui/**`         | UI code (default scope of `no-direct-db-access-in-ui`).                                                                               |
| `paths.api`                    | glob[]                          | `src/routes/**`, `src/api/**`                                          | HTTP route code (default scope of `new-route-requires-authorization`).                                                                |
| `paths.migrations`             | glob[]                          | `migrations/**`, `database/migrations/**`, `src/migrations/**`         | Migrations (default scope of `migration-requires-rollback`).                                                                          |
| `paths.protected`              | glob[]                          | `.github/workflows/**`, `infra/**`, `src/auth/**`, `src/crypto/**`     | Protected paths.                                                                                                                      |
| `paths.tests`                  | glob[]                          | `**/*.test.*`, `**/*.spec.*`, `tests/**`, `test/**`, `**/__tests__/**` | Test files.                                                                                                                           |
| `reporting.format`             | `terminal` \| `json` \| `sarif` | `terminal`                                                             | Default report format.                                                                                                                |
| `reporting.failOn`             | severity                        | `error`                                                                | Lowest severity that makes `review` exit non-zero.                                                                                    |
| `suppressions[]`               | object[]                        | `[]`                                                                   | Global suppressions: `ruleId?`, `paths` (default `["**"]`), `reason` (required), `author?`, `expiresAt?` (ISO date).                  |

## CLI

| Command                            | Purpose                                                                                                                                                                                                                                                      |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `policyguard init [--force]`       | Create `.policyguard/` with starter policies and a configuration tailored to the detected package manager and framework. Existing files are kept unless `--force`.                                                                                           |
| `policyguard review`               | Review `base...head`. Flags: `--base <ref>`, `--head <ref>`, `--format terminal\|json\|sarif`, `--strict`, `--ai`, `--no-ai`, `--config <path>`, `--output <path>`, `--fail-on <severity>`, `--github-annotations`, `--no-color`, `--no-cache`, `--verbose`. |
| `policyguard validate`             | Validate configuration and policies.                                                                                                                                                                                                                         |
| `policyguard policies`             | List policies with severity, category, enabled state, rule, and target paths.                                                                                                                                                                                |
| `policyguard explain <finding-id>` | Explain a finding from the last review (an id prefix is enough).                                                                                                                                                                                             |

### Exit codes

| Code | Meaning                                                                                                                                                                           |
| ---- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `0`  | No blocking findings.                                                                                                                                                             |
| `1`  | At least one active finding at or above the blocking severity.                                                                                                                    |
| `2`  | The review could not run (not a repository, unknown ref, invalid configuration or policies), or `--ai` was requested but unavailable, or `--strict` and analysis errors occurred. |

`--strict` makes warnings blocking and treats analysis errors as failures.

### Environment

| Variable                                      | Purpose                                   |
| --------------------------------------------- | ----------------------------------------- |
| `POLICYGUARD_LLM_API_KEY` (name configurable) | API key for the AI stage.                 |
| `GITHUB_ACTIONS=true`                         | Enables GitHub annotations automatically. |
| `GITHUB_STEP_SUMMARY`                         | When set, a Markdown summary is appended. |

## Defaults for base resolution

`--base` > `review.defaultBase` > `origin/main` > `main` > `master`. An explicit `--base` that does not exist is an error with a suggested fix. In CI use `actions/checkout` with `fetch-depth: 0`.
