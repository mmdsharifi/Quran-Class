# AGENTS.md

## Project Rules

### TDD Best Practices (Required)

1. Follow `Red -> Green -> Refactor` for every behavior change.
2. Start each bug fix by adding a regression test that fails before the fix.
3. Add or update tests in the same PR/commit as the production code change.
4. Keep tests deterministic: no real network calls, random data, or wall-clock dependencies without control.
5. Do not merge with failing tests; run `npm test` locally before finalizing changes.
6. Preserve or improve coverage on touched logic; add branch-focused tests for new conditionals.

### Git Workflow (Required)

1. **Never commit directly** to the current branch. Always create a new short-lived branch for every task.
2. Branch naming: use `fix/`, `feat/`, or `chore/` prefix followed by a short kebab-case description (e.g. `fix/dark-mode-borders`, `feat/drag-to-back`).
3. After all changes are committed and tests pass, **open a Pull Request** targeting the current base branch.
4. Use `gh pr create` (GitHub CLI) to open the PR with a clear title and body summarising what changed and why.
5. **Attach a new semver tag** to the tip of the branch before pushing (e.g. `git tag -a vX.Y.Z -m "..."`) when the change warrants a release.
6. Push both the branch and the tag: `git push origin <branch> && git push origin <tag>`.
