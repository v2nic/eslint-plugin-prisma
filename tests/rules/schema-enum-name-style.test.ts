import { Linter } from 'eslint';
import { schemaEnumNameStyle } from '../../src/rules/schema-enum-name-style';
import { wrapPrismaSchemaForLint } from '../../src/utils/prisma-schema';

const linter = new Linter();
(linter as unknown as { defineRule: (...args: unknown[]) => void }).defineRule(
  'prisma/schema-enum-name-style',
  schemaEnumNameStyle as unknown,
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
        'prisma/schema-enum-name-style': ['error', options ?? {}],
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

describe('schema-enum-name-style', () => {
  it('accepts pascal_case enums by default', () => {
    const messages = verify(`
enum ExampleEnum {
  VALUE
}
`);
    expect(messages).toHaveLength(0);
  });

  it('reports non-matching enum names', () => {
    const messages = verify(`
enum example_enum {
  VALUE
}
`);
    expect(messages).toHaveLength(1);
    expect(messages[0].ruleId).toBe('prisma/schema-enum-name-style');
  });

  it('accepts snake_case when configured', () => {
    const messages = verify(
      `
enum example_enum {
  VALUE
}
`,
      { style: 'snake_case' },
    );
    expect(messages).toHaveLength(0);
  });
});
