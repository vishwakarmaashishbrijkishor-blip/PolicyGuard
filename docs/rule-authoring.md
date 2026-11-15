# Rule authoring

A rule is a deterministic function from the review context to findings. Built-in rules live in `src/rules/built-in/` and are registered in `src/rules/rule-registry.ts`.

## Interface

```ts
export interface PolicyRuleImplementation {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly category: string;
  readonly defaultSeverity: Severity;
  readonly supportedLanguages: readonly string[];
  run(context: RuleContext): Promise<RuleResult> | RuleResult;
}
```

`RuleResult` holds `findings`, `errors`, and optionally `skipped`/`skipReason`. Rules return data; they never print, never write files, and never call the network.

## Rule context

`RuleContext` provides:

- `changedFiles`: parsed diff (`ChangedFile` with hunks and line numbers).
- `indexedRepository`: head-commit index (`getFileIndex`, `routes()`, `tests()`, `migrations`, `manifests`, `graph`, `symbols`, `mountedMiddleware()`).
- `policies`, `config`, `options`.
- `headReader` / `baseReader`: file contents at the head and at the merge base.
- `indexer`: parse base-side content ad hoc (`context.indexer.indexContent(path, text)`).
- `commitMessages`: messages of the commits in the range (untrusted).

A rule runs once per review and loops over `policiesForRule(context.policies, id)`, because several policies may use the same rule with different scopes, options, and severities.

## Skeleton

```ts
export const myRule: PolicyRuleImplementation = {
  id: "my-rule",
  title: "...",
  description: "...",
  category: "security",
  defaultSeverity: "error",
  supportedLanguages: ["typescript"],

  async run(context) {
    const findings: Finding[] = [];
    for (const policy of policiesForRule(context.policies, "my-rule")) {
      const options = parseOptions(policy, optionsSchema); // zod, strict
      const files = filesInScope(context, policy, context.config.paths.api, {
        statuses: ["added", "modified"],
      });
      for (const file of files) {
        // inspect added lines, the index, or base vs head
        findings.push(
          createFinding({
            ruleId: "my-rule",
            policy,
            title: "...",
            message: "...",
            file: file.path,
            startLine: 12,
            evidence: [{ file: file.path, startLine: 12, explanation: "...", source: "diff" }],
            confidence: "high",
          }),
        );
      }
    }
    return { findings, errors: [] };
  },
};
```

Add the id to `BUILT_IN_RULE_IDS` in `src/rules/rule-ids.ts` (a test keeps it in sync with the registry) and register the rule in `createDefaultRegistry()`.

## Using the AST

Prefer the index over regular expressions for TypeScript semantics. The index already extracts imports (including `require` and dynamic imports), exports with signatures, routes with middleware, test cases with modifiers, and migration facts. If you need more, extend the extractors in `src/indexing/` and bump `INDEXER_VERSION` so caches are invalidated. Use regular expressions only for formats where parsing is impractical (raw SQL, simple config files), and strip comments first.

## Evidence requirements

- Every finding needs at least one `Evidence` entry; `createFinding` throws otherwise.
- Cite real locations: diff lines for what changed, repository facts for what was searched and not found, tests, or configuration.
- Report on code the diff touches. Do not report pre-existing problems in untouched lines.
- Never put secret values in evidence; redact them.
- `severity` comes from the policy. Use `severityCap` only to lower it when the result is uncertain.

## Testing requirements

Each rule needs tests for: a violation with evidence and location, each compliant path, each documented annotation (with and without a reason), policy scope and severity override, and at least two false-positive guards. Use `reviewChange()` from `tests/helpers/review-harness.ts`; it builds a real two-commit repository and runs the full engine. Never weaken a test to make it pass.

## Avoiding false positives

- Scope to the diff (new routes, added imports, added lines), not the whole repository.
- Require positive evidence of a problem; treat unknown as "no finding" or lower confidence plus a severity cap.
- Recognize equivalent safe patterns (router-level middleware, mounting-time middleware, global guards, inline checks).
- Ignore obvious placeholders and test fixtures where the rule says so.
- Let users configure scope and vocabulary through `options` rather than hard-coding project conventions.
- Add the case to `docs/evaluation.md` datasets when you fix a false positive.
