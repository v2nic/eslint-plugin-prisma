---
description: Release checklist (diff review, .changes, build/lint, bump version)
---

# Release

1. Inspect local changes:
   - `git diff`
   - `git diff --staged`
2. `cat .CHANGES` file (git-ignored) and confirm it describes what changed and why.
3. Follow the README build and lint instructions to verify the release candidate:
   - `npm run build`
   - `npm run lint`
   - `npm run format`
   - `npm run update:eslint-docs`
4. Choose the version bump based on backward compatibility:
   - Patch: backward-compatible fixes.
   - Minor: backward-compatible features.
5. Bump the version accordingly (for example, `npm version patch` or `npm version minor`).
6. Commit the local changes with a descriptive message for all the changes found in the diff and the rationale from the .CHANGES file.
7. Commit the release changes (for example, `git add -A` then `git commit -m "chore(release): bump version"`).
8. Tag the release (for example, `git tag v1.2.3`).
9. Push the changes and tag (for example, `git push` and `git push --tags`).
10. Publish the release (for example, `npm publish`).
