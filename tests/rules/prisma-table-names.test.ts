import { Linter } from 'eslint';
import { prismaTableNames } from '../../src/rules/prisma-table-names';
import { wrapPrismaSchemaForLint } from '../../src/utils/prisma-schema';

const linter = new Linter();
(linter as unknown as { defineRule: (...args: unknown[]) => void }).defineRule(
  'prisma/prisma-table-names',
  prismaTableNames as unknown,
);

const SCHEMA_HEADER = `
datasource db {
  provider = "postgresql"
}

generator client {
  provider = "prisma-client-js"
}
`;

const preprocess = (code: string) => [wrapPrismaSchemaForLint(code)];
const postprocess = (messages: Array<Array<unknown>>) => messages.flat();

const verify = (schema: string, options?: { ignoreModels?: string[] }) =>
  (linter as unknown as { verify: (...args: unknown[]) => ReturnType<Linter['verify']> }).verify(
    `${SCHEMA_HEADER}\n${schema}`,
    {
      rules: {
        'prisma/prisma-table-names': ['error', options ?? {}],
      },
      parserOptions: {
        ecmaVersion: 2020,
      },
    },
    {
      filename: 'schema.prisma',
      preprocess,
      postprocess,
    },
  );

describe('prisma-table-names', () => {
  it('accepts @@map with snake_case', () => {
    const messages = verify(`
model ChargePlanSlot {
  id String @id
  @@map("charge_plan_slot")
}
`);
    expect(messages).toHaveLength(0);
  });

  it('reports missing @@map', () => {
    const messages = verify(`
model ChargePlanSlot {
  id String @id
}
`);
    expect(messages).toHaveLength(1);
  });

  it('reports non-snake_case @@map', () => {
    const messages = verify(`
model ChargePlanSlot {
  id String @id
  @@map("ChargePlanSlot")
}
`);
    expect(messages).toHaveLength(1);
  });

  it('ignores configured models', () => {
    const messages = verify(
      `
model ChargePlanSlot {
  id String @id
}
`,
      { ignoreModels: ['ChargePlanSlot'] },
    );
    expect(messages).toHaveLength(0);
  });
});
