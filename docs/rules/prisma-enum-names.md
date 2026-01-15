# Enforce Prisma enum naming and mapping conventions (`@v2nic/prisma/prisma-enum-names`)

<!-- end auto-generated rule header -->

## Purpose

Ensures Prisma enums follow the repository naming convention. Enum names can be configured for snake_case or PascalCase, and enum values must be SCREAMING_SNAKE_CASE. Optionally enforces `@@map` to map enum names to snake_case in the database.

## Examples

### Incorrect

```prisma
enum dr_event_type {
  discharge
}
```

### Correct (snake_case)

```prisma
enum dr_event_type {
  DISCHARGE
}
```

### Correct (PascalCase + @@map)

```prisma
enum DrEventType {
  DISCHARGE
  @@map("dr_event_type")
}
```

## Options

<!-- begin auto-generated rule options list -->

| Name             | Type    | Choices                     | Default      |
| :--------------- | :------ | :-------------------------- | :----------- |
| `enumNameStyle`  | String  | `snake_case`, `pascal_case` | `snake_case` |
| `requireEnumMap` | Boolean |                             | `true`       |

<!-- end auto-generated rule options list -->
