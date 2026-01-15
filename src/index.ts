// eslint-disable-next-line @typescript-eslint/no-var-requires
const { name, version } = require('../package.json') as {
  name: string;
  version: string;
};

import { Linter } from '@typescript-eslint/utils/ts-eslint';
import { requireSelect } from './rules/require-select';
import { noUnsafe } from './rules/no-unsafe';
import { prismaColumnNames } from './rules/prisma-column-names';
import { prismaTableNames } from './rules/prisma-table-names';
import { prismaEnumNames } from './rules/prisma-enum-names';
import { noSnakeCaseInTs } from './rules/no-snake-case-in-ts';
import { prismaSchemaProcessor } from './utils/prisma-processor';

export = {
  configs: {
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
  },
  meta: {
    name,
    version,
  },
  rules: {
    'no-unsafe': noUnsafe,
    'require-select': requireSelect,
    'prisma-column-names': prismaColumnNames,
    'prisma-table-names': prismaTableNames,
    'prisma-enum-names': prismaEnumNames,
    'no-snake-case-in-ts': noSnakeCaseInTs,
  },
  processors: {
    '.prisma': prismaSchemaProcessor,
  },
} satisfies Linter.Plugin;
