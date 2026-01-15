import { Linter } from 'eslint';
import { schemaModelNameStyle } from '../../src/rules/schema-model-name-style';
import { wrapPrismaSchemaForLint } from '../../src/utils/prisma-schema';

const linter = new Linter();
(linter as unknown as { defineRule: (...args: unknown[]) => void }).defineRule(
  'prisma/schema-model-name-style',
  schemaModelNameStyle as unknown,
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
        'prisma/schema-model-name-style': ['error', options ?? {}],
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

describe('schema-model-name-style', () => {
  it('accepts pascal_case model names by default', () => {
    const messages = verify(`
model ExampleModel {
  id String @id
}
`);
    expect(messages).toHaveLength(0);
  });

  it('reports non-matching model names', () => {
    const messages = verify(`
model example_model {
  id String @id
}
`);
    expect(messages).toHaveLength(1);
    expect(messages[0].ruleId).toBe('prisma/schema-model-name-style');
  });

  it('accepts snake_case when configured', () => {
    const messages = verify(
      `
model example_model {
  id String @id
}
`,
      { style: 'snake_case' },
    );
    expect(messages).toHaveLength(0);
  });
});
