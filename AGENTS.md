# AGENTS.md

## Project Rules

### TDD Best Practices (Required)

1. Follow `Red -> Green -> Refactor` for every behavior change.
2. Start each bug fix by adding a regression test that fails before the fix.
3. Add or update tests in the same PR/commit as the production code change.
4. Keep tests deterministic: no real network calls, random data, or wall-clock dependencies without control.
5. Do not merge with failing tests; run `npm test` locally before finalizing changes.
6. Preserve or improve coverage on touched logic; add branch-focused tests for new conditionals.
