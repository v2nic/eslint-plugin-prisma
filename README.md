# eslint-plugin-prisma

ESLint plugin ensuring best practices and code quality for Prisma with TypeScript

[![npm version](https://img.shields.io/npm/v/@v2nic/eslint-plugin-prisma.svg)](https://www.npmjs.com/package/@v2nic/eslint-plugin-prisma)

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

## Using the plugin from source

If you want to use a local checkout instead of the registry, build the package and install it via a file path.

```sh
npm install
npm run build
```

From the consuming project:

```sh
npm install /absolute/path/to/eslint-plugin-prisma --save-dev
```

If you update the plugin source, re-run `npm run build` in the plugin repo and reinstall. For local development, you can use `npm link` to create a global symlink to the package and then link it into your consuming project:

```sh
# in the plugin repo
npm link

# in the consuming repo
npm link @v2nic/eslint-plugin-prisma
```

This makes Node resolve the plugin to your local checkout. The global link lives under your npm prefix (from `npm prefix -g`) at `lib/node_modules/@v2nic/eslint-plugin-prisma` (macOS/Linux) or `node_modules\@v2nic\eslint-plugin-prisma` (Windows). You still need to rebuild after changes (`npm run build`) because consumers load the compiled output. To stop using the linked package, run `npm unlink --no-save @v2nic/eslint-plugin-prisma` in the consuming repo and `npm unlink` in the plugin repo.

## Usage

Example failure for schema field naming:

```prisma
model InvoiceItem {
  id Int @id
  customer_id String
}
```

```text
schema.prisma
  3:3  error  Schema field names must follow the camelCase style  prisma/schema-field-name-style
```

### ESLint flat config

Use the processor object and plugin map. This complete example shows both overrides:

```js
import prisma from '@v2nic/eslint-plugin-prisma';

export default [
  {
    files: ['**/*.prisma'],
    plugins: { prisma },
    processor: prisma.processors['.prisma'],
  },
  {
    files: ['**/*.prisma.js'],
    plugins: { prisma },
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

The processor rewrites `schema.prisma` into `schema.prisma.js`, so rule overrides must target `**/*.prisma.js` for flat config. An override is the file-matching block in your config array that applies rules to a specific glob. The `**/*.prisma` override only enables the processor. If you prefer, `prisma.configs['prisma-schema-flat']` provides the processor-only override.

#### Rule selection

You must specify the rules you want to enable. If you want the naming rules with defaults, use the bundled preset:

```js
import prisma from '@v2nic/eslint-plugin-prisma';

export default [...prisma.configs['prisma-schema-flat-recommended']];
```

### Classic config (.eslintrc)

To lint Prisma schema files, enable the processor configuration and set rules in an override:

```json
{
  "extends": ["plugin:@v2nic/prisma/prisma-schema"],
  "overrides": [
    {
      "files": ["*.prisma.js"],
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

For classic config, you can also use the bundled `prisma-schema-recommended` config for default naming rules on the processed `*.prisma.js` file.

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

Load the `recommended` configuration:

```json
{
  "extends": ["plugin:@v2nic/prisma/recommended"]
}
```

Rule names are always under the `prisma/*` namespace even when the plugin is scoped.

## Configurations

The table below is generated from the exported configs. The ✅ marker indicates the `recommended` preset, which enables `no-unsafe` and `require-select` only.

<!-- begin auto-generated configs list -->

|     | Name                             |
| :-- | :------------------------------- |
|     | `prisma-schema`                  |
|     | `prisma-schema-flat`             |
|     | `prisma-schema-flat-recommended` |
|     | `prisma-schema-recommended`      |
| ✅  | `recommended`                    |

<!-- end auto-generated configs list -->

## Rules

The rules table is generated from each rule definition. The 💡 marker means the rule provides ESLint suggestions via `meta.hasSuggestions`.

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
