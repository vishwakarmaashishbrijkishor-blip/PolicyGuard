# Evaluation

PolicyGuard ships an evaluation set of realistic changes with known ground truth. It exists to catch regressions in precision and recall when rules change, and to make noise visible.

## Methodology

- Each case in [`tests/evaluation/cases.ts`](../tests/evaluation/cases.ts) is a two-commit repository: a base and a head, plus the set of rule ids that must be reported (`expected`). Compliant changes expect no findings.
- `pnpm evaluate` builds each repository, runs the full review engine with the bundled default policies (no AI), and compares the rules that produced an active (unsuppressed) finding with `expected`.
- A _decision_ is one (case, rule) pair. A rule that fires on a case where it is expected is a true positive (TP); firing where it is not expected is a false positive (FP); not firing where expected is a false negative (FN); everything else is a true negative (TN).
- The run fails if any mistake occurs, precision or recall drops below 0.95, or the false-positive rate exceeds 0.02.

## Metrics

| Metric              | Definition                                                             |
| ------------------- | ---------------------------------------------------------------------- |
| Precision           | TP / (TP + FP). How many reported violations were real.                |
| Recall              | TP / (TP + FN). How many real violations were reported.                |
| False-positive rate | FP / (FP + TN). How often a rule fires on a case that should be clean. |
| Runtime             | `durationMs` of each full review (Git, index, rules, suppressions).    |

## Results (0.1.0)

Measured on a Windows laptop with real-time antivirus scanning, 4 reviews in parallel, AI disabled:

| Cases                                                        | Decisions | TP  | FP  | FN  | TN  | Precision | Recall | FP rate | Runtime (mean / p95) |
| ------------------------------------------------------------ | --------- | --- | --- | --- | --- | --------- | ------ | ------- | -------------------- |
| 36 (19 violations incl. one multi-rule change, 17 compliant) | 288       | 21  | 0   | 0   | 267 | 1.000     | 1.000  | 0.000   | 4.5 s / 5.6 s        |

Runtime is dominated by process start-up (Git, one `git cat-file` process, parsing); on Linux CI the same set is several times faster. Most of the 36 cases deliberately target known false-positive risks: HTTP client calls that look like routes, type-only database imports, renamed tests, placeholder and fixture credentials, additive API changes, lockfile updates, and justified exceptions.

### Caveats

- The set was written by the rule authors, so a perfect score shows the rules are consistent with their own specification, not that they are free of false positives on arbitrary codebases. Treat it as a regression net.
- Cases are small. Real repositories add noise (unusual middleware names, generated code, monorepos).
- AI-assisted findings are not scored here; they are advisory and capped at `warning`. Their safety properties are covered by the tests in `tests/unit/ai/`.

## Noise reduction applied while building the set

- HTTP client calls (`axios.get("/x", opts)`) and key/value getters (`cache.get("/k", 1)`) are not routes: receivers are filtered and handler arguments must be function-like or references.
- Placeholder, example, environment-variable, and low-entropy values are ignored by the secret rule; test, fixture, and documentation paths are skipped unless configured.
- Renamed tests with unchanged bodies are not "removed tests"; brand-new `todo` placeholders are not flagged.
- A re-export of a missing local module counts as a removal, and optional-parameter detection excludes rest parameters.
- Findings are only reported for code the diff touches (new routes, added imports, added lines).

## Adding an evaluation case

1. Append an entry to `EVALUATION_CASES` in `tests/evaluation/cases.ts`:

   ```ts
   {
     name: "route behind custom auth middleware",
     change: {
       base: { "README.md": "# service\n" },
       head: { "src/routes/a.ts": 'router.get("/a", gatekeeper, handler);\n' },
       // optional: policies, config, commitMessage
     },
     expected: [], // rule ids that must fire; [] for a compliant change
   },
   ```

2. Build fake secrets at runtime (`"AKIA" + "..."`) so the repository never contains literal credential-like strings.
3. Run `pnpm evaluate`. To keep the metrics, set `POLICYGUARD_EVAL_REPORT=path/to/report.txt` before running.
4. If the case exposes a real false positive or false negative, fix the rule and add a focused unit test next to the rule's tests as well.
