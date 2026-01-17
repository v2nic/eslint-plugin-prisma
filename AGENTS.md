# Welcome, Agents

## Commit Message Format

- **Format:** `<type>(<scope>): <summary>`  
  Example: `fix(rules): correct quick-fix ranges for schema/db naming`
- **Types observed:** `feat`, `fix`, `docs`, `chore`
- **Scope:** optional, lower-kebab-case (e.g., `rules`, `release`, `vscode-highlighting`)
- **Summary:** present-tense, sentence case, no trailing period
- **Allowed exceptions:** version-only release commits (e.g., `1.2.5`), though prefer `chore(release): bump version to x.y.z` for consistency

### Scope

- **rules-core**: shared rule helpers or base behavior (e.g., `src/utils/create-rule.ts`).
- **rules-schema**: Prisma schema naming rules (`schema-*`).
- **rules-db**: database naming rules (`db-*`).
- **rules-ts**: TypeScript-only rules (`no-snake-case-in-ts`, `no-unsafe`, `require-select`).
- **processor**: Prisma schema processor and wrapping logic (`src/utils/prisma-processor.ts`, `src/utils/prisma-schema.ts`).
- **configs**: plugin config exports and presets `src/index.ts`.
- **docs**: README and `docs/rules/*`.
- **tests**: `tests/**`.
- **scripts**: `scripts/**` (e.g., `check-prisma-client-snake-case.js`).
- **release**: version bumps, changelog, package metadata.
