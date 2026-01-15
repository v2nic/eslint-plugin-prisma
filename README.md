# eslint-plugin-prisma

ESLint plugin ensuring best practices and code quality for Prisma with TypeScript

## Overview

This ESLint plugin is designed to help developers maintain best practices and enforce code quality when using Prisma in TypeScript projects. It includes a set of custom rules tailored to the specific requirements and idioms of Prisma, aiming to prevent common pitfalls and encourage efficient, clean, and secure database interactions.

## Installation

You'll first need to install [ESLint](https://eslint.org/):

```sh
npm install eslint --save-dev
```

Next, install `@v2nic/eslint-plugin-prisma`:

```sh
npm install @v2nic/eslint-plugin-prisma --save-dev
```

## Usage

Load the `recommended` configuration:

```json
{
  "extends": ["plugin:@v2nic/prisma/recommended"]
}
```

For ESLint flat config, use the processor object and plugin map:

```js
import prisma from '@v2nic/eslint-plugin-prisma';

export default [
  ...prisma.configs['prisma-schema-flat'],
  {
    files: ['**/*.prisma'],
    rules: {
      'prisma/schema-field-name-style': 'error',
      'prisma/schema-model-name-style': 'error',
      'prisma/schema-enum-name-style': 'error',
      'prisma/schema-enum-value-style': 'error',
      'prisma/db-table-name-style': 'error',
      'prisma/db-column-name-style': 'error',
      'prisma/db-enum-name-style': 'error',
      'prisma/db-enum-value-style': 'error',
    },
  },
];
```

To lint Prisma schema files, enable the processor configuration and set rules in an override:

```json
{
  "extends": ["plugin:@v2nic/prisma/prisma-schema"],
  "overrides": [
    {
      "files": ["*.prisma"],
      "rules": {
        "prisma/schema-field-name-style": "error",
        "prisma/schema-model-name-style": "error",
        "prisma/schema-enum-name-style": "error",
        "prisma/schema-enum-value-style": "error",
        "prisma/db-table-name-style": "error",
        "prisma/db-column-name-style": "error",
        "prisma/db-enum-name-style": "error",
        "prisma/db-enum-value-style": "error"
      }
    }
  ]
}
```

Add `@v2nic/prisma` to the plugins section of your `.eslintrc` configuration file. You can omit the `eslint-plugin-` prefix.
Then configure the rules you want to use under the rules section:

```json
{
  "plugins": ["@v2nic/prisma"],
  "rules": {
    "prisma/no-unsafe": "error",
    "prisma/require-select": "error"
  }
}
```

Rule names are always under the `prisma/*` namespace even when the plugin is scoped.

## Configurations

<!-- begin auto-generated configs list -->

|     | Name                 |
| :-- | :------------------- |
|     | `prisma-schema`      |
|     | `prisma-schema-flat` |
| ✅  | `recommended`        |

<!-- end auto-generated configs list -->

## Rules

<!-- begin auto-generated rules list -->

💡 Manually fixable by [editor suggestions](https://eslint.org/docs/latest/use/core-concepts#rule-suggestions).

| Name                                                             | Description                                                          | 💡  |
| :--------------------------------------------------------------- | :------------------------------------------------------------------- | :-- |
| [db-column-name-style](docs/rules/db-column-name-style.md)       | Enforce database column names to follow the configured style         |     |
| [db-enum-name-style](docs/rules/db-enum-name-style.md)           | Enforce database enum names to follow the configured style           |     |
| [db-enum-value-style](docs/rules/db-enum-value-style.md)         | Enforce database enum values to follow the configured style          |     |
| [db-table-name-style](docs/rules/db-table-name-style.md)         | Enforce database table names to follow the configured style          |     |
| [no-snake-case-in-ts](docs/rules/no-snake-case-in-ts.md)         | Disallow snake_case identifiers and keys in TypeScript               |     |
| [no-unsafe](docs/rules/no-unsafe.md)                             | Disallow the use of potentially unsafe Prisma methods                |     |
| [require-select](docs/rules/require-select.md)                   | Forces explicit selection of all fields in Prisma queries            | 💡  |
| [schema-enum-name-style](docs/rules/schema-enum-name-style.md)   | Enforce schema enum names to follow the configured TypeScript style  |     |
| [schema-enum-value-style](docs/rules/schema-enum-value-style.md) | Enforce schema enum values to follow the configured TypeScript style |     |
| [schema-field-name-style](docs/rules/schema-field-name-style.md) | Enforce schema field names to follow the configured TypeScript style |     |
| [schema-model-name-style](docs/rules/schema-model-name-style.md) | Enforce schema model names to follow the configured TypeScript style |     |

<!-- end auto-generated rules list -->
