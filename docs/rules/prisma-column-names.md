# Enforce camelCase Prisma fields mapped to snake_case columns (`prisma/prisma-column-names`)

<!-- end auto-generated rule header -->

## Purpose

Ensures Prisma model field names are camelCase and that the corresponding database column names are snake_case via `@map`. This prevents snake_case field names from leaking into generated TypeScript types.

## Examples

### Incorrect

```prisma
model WallboxSchedule {
  wallbox_charger_id String
}
```

### Correct

```prisma
model WallboxSchedule {
  wallboxChargerId String @map("wallbox_charger_id")
}
```

## Options

<!-- begin auto-generated rule options list -->

| Name        | Type     | Default |
| :---------- | :------- | :------ |
| `allowlist` | String[] | `[]`    |

<!-- end auto-generated rule options list -->
