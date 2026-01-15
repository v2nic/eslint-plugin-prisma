// eslint-disable-next-line @typescript-eslint/no-var-requires
const { name, version } = require('../package.json') as {
  name: string;
  version: string;
};

import { Linter } from '@typescript-eslint/utils/ts-eslint';
import { requireSelect } from './rules/require-select';
import { noUnsafe } from './rules/no-unsafe';
import { dbColumnNameStyle } from './rules/db-column-name-style';
import { dbEnumNameStyle } from './rules/db-enum-name-style';
import { dbEnumValueStyle } from './rules/db-enum-value-style';
import { dbTableNameStyle } from './rules/db-table-name-style';
import { noSnakeCaseInTs } from './rules/no-snake-case-in-ts';
import { prismaSchemaProcessor } from './utils/prisma-processor';
import { schemaEnumNameStyle } from './rules/schema-enum-name-style';
import { schemaEnumValueStyle } from './rules/schema-enum-value-style';
import { schemaFieldNameStyle } from './rules/schema-field-name-style';
import { schemaModelNameStyle } from './rules/schema-model-name-style';

const prismaPlugin = {
  meta: {
    name,
    version,
  },
  rules: {
    'no-unsafe': noUnsafe,
    'require-select': requireSelect,
    'schema-model-name-style': schemaModelNameStyle,
    'schema-field-name-style': schemaFieldNameStyle,
    'schema-enum-name-style': schemaEnumNameStyle,
    'schema-enum-value-style': schemaEnumValueStyle,
    'db-table-name-style': dbTableNameStyle,
    'db-column-name-style': dbColumnNameStyle,
    'db-enum-name-style': dbEnumNameStyle,
    'db-enum-value-style': dbEnumValueStyle,
    'no-snake-case-in-ts': noSnakeCaseInTs,
  },
  processors: {
    '.prisma': prismaSchemaProcessor,
  },
} satisfies Linter.Plugin;

const configs = {
  recommended: {
    plugins: ['@v2nic/prisma'],
    rules: {
      'prisma/no-unsafe': 'error',
      'prisma/require-select': 'error',
    } satisfies Record<string, Linter.RuleLevel>,
  },
  'prisma-schema': {
    plugins: ['@v2nic/prisma'],
    overrides: [
      {
        files: ['*.prisma'],
        processor: '@v2nic/prisma/.prisma',
        parserOptions: {
          ecmaVersion: 2020,
        },
      },
      {
        files: ['*.prisma.js'],
        parserOptions: {
          ecmaVersion: 2020,
        },
      },
    ],
  },
  'prisma-schema-flat': [
    {
      files: ['**/*.prisma'],
      plugins: { prisma: prismaPlugin },
      processor: prismaPlugin.processors?.['.prisma'],
      languageOptions: {
        ecmaVersion: 2020,
      },
    },
    {
      files: ['**/*.prisma.js'],
      languageOptions: {
        ecmaVersion: 2020,
      },
    },
  ],
} as const;

export = {
  ...prismaPlugin,
  configs: configs as unknown as Linter.Plugin['configs'],
} satisfies Linter.Plugin;
