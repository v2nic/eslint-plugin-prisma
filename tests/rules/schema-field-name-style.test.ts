import { Linter } from 'eslint';
import { schemaFieldNameStyle } from '../../src/rules/schema-field-name-style';
import { wrapPrismaSchemaForLint } from '../../src/utils/prisma-schema';

const linter = new Linter();
(linter as unknown as { defineRule: (...args: unknown[]) => void }).defineRule(
  'prisma/schema-field-name-style',
  schemaFieldNameStyle as unknown,
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
  options?: { style?: 'snake_case' | 'camel_case' | 'pascal_case' | 'screaming_snake_case'; allowlist?: string[] },
) =>
  (linter as unknown as { verify: (...args: unknown[]) => ReturnType<Linter['verify']> }).verify(
    `${SCHEMA_HEADER}\n${schema}`,
    {
      rules: {
        'prisma/schema-field-name-style': ['error', options ?? {}],
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

describe('schema-field-name-style', () => {
  it('accepts camel_case fields by default', () => {
    const messages = verify(`
model ExampleModel {
  id String @id @map("id")
  exampleFieldId String
}
`);
    expect(messages).toHaveLength(0);
  });

  it('reports non-matching field styles', () => {
    const messages = verify(`
model ExampleModel {
  id String @id @map("id")
  example_field_id String
}
`);
    expect(messages).toHaveLength(1);
    expect(messages[0].ruleId).toBe('prisma/schema-field-name-style');
  });

  it('accepts pascal_case when configured', () => {
    const messages = verify(
      `
model ExampleModel {
  id String @id @map("id")
  ExampleFieldId String
}
`,
      { style: 'pascal_case', allowlist: ['id'] },
    );
    expect(messages).toHaveLength(0);
  });

  it('allows allowlisted fields', () => {
    const messages = verify(
      `
model ExampleModel {
  id String @id @map("id")
  example_field_id String
}
`,
      { allowlist: ['example_field_id'] },
    );
    expect(messages).toHaveLength(0);
  });
});
