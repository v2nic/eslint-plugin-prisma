import { Linter } from 'eslint';
import { schemaEnumValueStyle } from '../../src/rules/schema-enum-value-style';
import { wrapPrismaSchemaForLint } from '../../src/utils/prisma-schema';

const linter = new Linter();
(linter as unknown as { defineRule: (...args: unknown[]) => void }).defineRule(
  'prisma/schema-enum-value-style',
  schemaEnumValueStyle as unknown,
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
        'prisma/schema-enum-value-style': ['error', options ?? {}],
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

describe('schema-enum-value-style', () => {
  it('accepts screaming_snake_case values by default', () => {
    const messages = verify(`
enum ExampleEnum {
  EXAMPLE_VALUE
}
`);
    expect(messages).toHaveLength(0);
  });

  it('reports non-matching enum values', () => {
    const messages = verify(`
enum ExampleEnum {
  example_value
}
`);
    expect(messages).toHaveLength(1);
    expect(messages[0].ruleId).toBe('prisma/schema-enum-value-style');
  });

  it('accepts snake_case when configured', () => {
    const messages = verify(
      `
enum ExampleEnum {
  example_value
}
`,
      { style: 'snake_case' },
    );
    expect(messages).toHaveLength(0);
  });
});
