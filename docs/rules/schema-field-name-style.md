# Enforce schema field names to follow the configured TypeScript style (`@v2nic/prisma/schema-field-name-style`)

<!-- end auto-generated rule header -->

## Options

<!-- begin auto-generated rule options list -->

| Name           | Description                                                                                 | Type     | Default      |
| :------------- | :------------------------------------------------------------------------------------------ | :------- | :----------- |
| `allowlist`    | Field names that can keep their schema name even if they do not match the configured style. | String[] | `[]`         |
| `ignoreModels` | Model names to skip when validating schema field names.                                     | String[] | `[]`         |
| `style`        | Case-insensitive. Accepts snake_case, camel_case, pascal_case, or screaming_snake_case.     | String   | `camel_case` |

<!-- end auto-generated rule options list -->
