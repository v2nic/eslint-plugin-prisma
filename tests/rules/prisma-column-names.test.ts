import { Linter } from 'eslint';
import { prismaColumnNames } from '../../src/rules/prisma-column-names';
import { wrapPrismaSchemaForLint } from '../../src/utils/prisma-schema';

const linter = new Linter();
(linter as unknown as { defineRule: (...args: unknown[]) => void }).defineRule(
  'prisma/prisma-column-names',
  prismaColumnNames as unknown,
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

const verify = (schema: string, options?: { allowlist?: string[] }) =>
  (linter as unknown as { verify: (...args: unknown[]) => ReturnType<Linter['verify']> }).verify(
    `${SCHEMA_HEADER}\n${schema}`,
    {
      rules: {
        'prisma/prisma-column-names': ['error', options ?? {}],
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

describe('prisma-column-names', () => {
  it('accepts camelCase fields mapped to snake_case columns', () => {
    const messages = verify(`
model WallboxSchedule {
  id String @id @map("id")
  wallboxChargerId String @map("wallbox_charger_id")
}
`);
    expect(messages).toHaveLength(0);
  });

  it('reports snake_case field names', () => {
    const messages = verify(`
model WallboxSchedule {
  id String @id @map("id")
  wallbox_charger_id String
}
`);
    expect(messages).toHaveLength(1);
    expect(messages[0].ruleId).toBe('prisma/prisma-column-names');
  });

  it('reports missing @map for camelCase fields', () => {
    const messages = verify(`
model WallboxSchedule {
  id String @id @map("id")
  wallboxChargerId String
}
`);
    expect(messages).toHaveLength(1);
  });

  it('allows allowlisted snake_case fields', () => {
    const messages = verify(
      `
model WallboxSchedule {
  id String @id @map("id")
  wallbox_charger_id String
}
`,
      { allowlist: ['wallbox_charger_id'] },
    );
    expect(messages).toHaveLength(0);
  });
});
