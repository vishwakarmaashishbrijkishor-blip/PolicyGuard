# ADR 0003: Evidence-linked findings

- Status: accepted

## Context

Findings without proof are noise and erode trust, especially when an LLM may fabricate locations.

## Decision

Every `Finding` carries one or more `Evidence` entries (file, lines, snippet, explanation, source). `createFinding` throws when evidence is empty, and policies cannot set `evidence.required` to `false`. LLM findings are validated against the real repository: cited files must exist, lines must be in range, evidence must relate to the diff or the policy scope, and snippets are rebuilt from the file. Invalid candidates are discarded and reported.

## Consequences

- `policyguard explain` can show exactly why something was flagged.
- Rules must collect evidence as part of detection.
- Some plausible LLM findings are rejected; that is the intended trade-off.
