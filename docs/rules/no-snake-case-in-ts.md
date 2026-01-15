# Disallow snake_case identifiers and keys in TypeScript (`prisma/no-snake-case-in-ts`)

<!-- end auto-generated rule header -->

## Purpose

Prevents snake_case identifiers and object keys in TypeScript application code to keep Prisma usage camelCase. Supports allowlists for external payloads and file globs.

## Examples

### Incorrect

```ts
const wallbox_charger_id = '123';
```

```ts
const payload = { wallbox_charger_id: '123' };
```

### Correct

```ts
const wallboxChargerId = '123';
```

## Options

<!-- begin auto-generated rule options list -->

| Name                   | Type     | Default |
| :--------------------- | :------- | :------ |
| `allowedFileGlobs`     | String[] | `[]`    |
| `allowedSnakeCaseKeys` | String[] | `[]`    |

<!-- end auto-generated rule options list -->
