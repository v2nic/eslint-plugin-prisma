import { Linter } from 'eslint';
import { dbEnumValueStyle } from '../../src/rules/db-enum-value-style';
import { wrapPrismaSchemaForLint } from '../../src/utils/prisma-schema';

const linter = new Linter();
(linter as unknown as { defineRule: (...args: unknown[]) => void }).defineRule(
  'prisma/db-enum-value-style',
  dbEnumValueStyle as unknown,
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

const verify = (schema: string, options?: { style?: string }) =>
  (linter as unknown as { verify: (...args: unknown[]) => ReturnType<Linter['verify']> }).verify(
    `${SCHEMA_HEADER}\n${schema}`,
    {
      rules: {
        'prisma/db-enum-value-style': ['error', options ?? {}],
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

describe('db-enum-value-style', () => {
  it('accepts snake_case values without map by default', () => {
    const messages = verify(`
enum ExampleEnum {
  example_value
}
`);
    expect(messages).toHaveLength(0);
  });

  it('accepts snake_case map values when present', () => {
    const messages = verify(`
enum ExampleEnum {
  ExampleValue @map("example_value")
}
`);
    expect(messages).toHaveLength(0);
  });

  it('reports non-matching effective values', () => {
    const messages = verify(`
enum ExampleEnum {
  ExampleValue
}
`);
    expect(messages).toHaveLength(1);
  });

  it('reports non-matching map values', () => {
    const messages = verify(`
enum ExampleEnum {
  ExampleValue @map("ExampleValue")
}
`);
    expect(messages).toHaveLength(1);
  });

  it('normalizes configured style labels in messages', () => {
    const messages = verify(
      `
enum ExampleEnum {
  ExampleValue
}
`,
      { style: 'SnakeCase' },
    );
    expect(messages).toHaveLength(1);
    expect(messages[0].message).toBe('Database enum values must follow the snake_case style.');
  });

  it('accepts screaming_snake_case when configured', () => {
    const messages = verify(
      `
enum ExampleEnum {
  EXAMPLE_VALUE
}
`,
      { style: 'screaming_snake_case' },
    );
    expect(messages).toHaveLength(0);
  });
});
