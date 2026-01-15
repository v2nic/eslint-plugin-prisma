import { Linter } from 'eslint';
import { prismaEnumNames } from '../../src/rules/prisma-enum-names';
import { wrapPrismaSchemaForLint } from '../../src/utils/prisma-schema';

const linter = new Linter();
(linter as unknown as { defineRule: (...args: unknown[]) => void }).defineRule(
  'prisma/prisma-enum-names',
  prismaEnumNames as unknown,
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

const verify = (schema: string, options?: { enumNameStyle?: 'snake_case' | 'pascal_case'; requireEnumMap?: boolean }) =>
  (linter as unknown as { verify: (...args: unknown[]) => ReturnType<Linter['verify']> }).verify(
    `${SCHEMA_HEADER}\n${schema}`,
    {
      rules: {
        'prisma/prisma-enum-names': ['error', options ?? {}],
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

describe('prisma-enum-names', () => {
  it('accepts snake_case enums without map when requireEnumMap is false', () => {
    const messages = verify(
      `
enum dr_event_type {
  DISCHARGE
}
`,
      { enumNameStyle: 'snake_case', requireEnumMap: false },
    );
    expect(messages).toHaveLength(0);
  });

  it('reports missing @@map when required', () => {
    const messages = verify(
      `
enum dr_event_type {
  DISCHARGE
}
`,
      { enumNameStyle: 'snake_case', requireEnumMap: true },
    );
    expect(messages).toHaveLength(1);
  });

  it('accepts pascal case enums with snake_case map', () => {
    const messages = verify(
      `
enum DrEventType {
  DISCHARGE
  @@map("dr_event_type")
}
`,
      { enumNameStyle: 'pascal_case', requireEnumMap: true },
    );
    expect(messages).toHaveLength(0);
  });

  it('reports non screaming snake enum values', () => {
    const messages = verify(
      `
enum DrEventType {
  discharge
  @@map("dr_event_type")
}
`,
      { enumNameStyle: 'pascal_case', requireEnumMap: true },
    );
    expect(messages.some((message) => message.message.includes('SCREAMING_SNAKE_CASE'))).toBe(true);
  });
});
