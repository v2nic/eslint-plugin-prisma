# Disallow snake_case identifiers and keys in TypeScript (`@v2nic/prisma/no-snake-case-in-ts`)

<!-- end auto-generated rule header -->

## Purpose

Prevents snake_case identifiers and object keys in TypeScript application code to keep Prisma usage camelCase. Supports allowlists for external payloads and file globs.

## Examples

### Incorrect

```ts
const example_field_id = '123';
```

```ts
const payload = { example_field_id: '123' };
```

### Correct

```ts
const exampleFieldId = '123';
```

## Options

<!-- begin auto-generated rule options list -->

| Name                   | Type     | Default |
| :--------------------- | :------- | :------ |
| `allowedFileGlobs`     | String[] | `[]`    |
| `allowedSnakeCaseKeys` | String[] | `[]`    |

<!-- end auto-generated rule options list -->
