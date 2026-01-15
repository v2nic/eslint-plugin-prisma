import { Linter } from 'eslint';
import { dbEnumNameStyle } from '../../src/rules/db-enum-name-style';
import { wrapPrismaSchemaForLint } from '../../src/utils/prisma-schema';

const linter = new Linter();
(linter as unknown as { defineRule: (...args: unknown[]) => void }).defineRule(
  'prisma/db-enum-name-style',
  dbEnumNameStyle as unknown,
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

const verify = (
  schema: string,
  options?: { style?: 'snake_case' | 'camel_case' | 'pascal_case' | 'screaming_snake_case' },
) =>
  (linter as unknown as { verify: (...args: unknown[]) => ReturnType<Linter['verify']> }).verify(
    `${SCHEMA_HEADER}\n${schema}`,
    {
      rules: {
        'prisma/db-enum-name-style': ['error', options ?? {}],
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

describe('db-enum-name-style', () => {
  it('accepts snake_case enums without map by default', () => {
    const messages = verify(`
enum example_enum {
  VALUE
}
`);
    expect(messages).toHaveLength(0);
  });

  it('accepts snake_case map values when present', () => {
    const messages = verify(`
enum ExampleEnum {
  VALUE
  @@map("example_enum")
}
`);
    expect(messages).toHaveLength(0);
  });

  it('reports non-matching effective enum names', () => {
    const messages = verify(`
enum ExampleEnum {
  VALUE
}
`);
    expect(messages).toHaveLength(1);
  });

  it('reports non-matching map values', () => {
    const messages = verify(`
enum ExampleEnum {
  VALUE
  @@map("ExampleEnum")
}
`);
    expect(messages).toHaveLength(1);
  });
});
