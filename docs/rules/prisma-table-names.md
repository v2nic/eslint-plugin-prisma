# Require models to map to snake_case table names via @@map (`prisma/prisma-table-names`)

<!-- end auto-generated rule header -->

## Purpose

Ensures Prisma models always map to snake_case database table names using `@@map`. This keeps database naming conventions consistent and avoids Prisma model names leaking into the schema.

## Examples

### Incorrect (missing @@map)

```prisma
model ChargePlanSlot {
  id String @id
}
```

### Incorrect (non-snake_case @@map)

```prisma
model ChargePlanSlot {
  id String @id
  @@map("ChargePlanSlot")
}
```

### Correct

```prisma
model ChargePlanSlot {
  id String @id
  @@map("charge_plan_slot")
}
```

## Options

<!-- begin auto-generated rule options list -->

| Name           | Type     | Default |
| :------------- | :------- | :------ |
| `ignoreModels` | String[] | `[]`    |

<!-- end auto-generated rule options list -->
