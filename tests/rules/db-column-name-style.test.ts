import { Linter } from 'eslint';
import { dbColumnNameStyle } from '../../src/rules/db-column-name-style';
import { wrapPrismaSchemaForLint } from '../../src/utils/prisma-schema';

const linter = new Linter();
(linter as unknown as { defineRule: (...args: unknown[]) => void }).defineRule(
  'prisma/db-column-name-style',
  dbColumnNameStyle as unknown,
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
        'prisma/db-column-name-style': ['error', options ?? {}],
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

describe('db-column-name-style', () => {
  it('accepts snake_case fields without map by default', () => {
    const messages = verify(`
model ExampleModel {
  id String @id
  example_field_id String
}
`);
    expect(messages).toHaveLength(0);
  });

  it('accepts snake_case map values when present', () => {
    const messages = verify(`
model ExampleModel {
  id String @id
  exampleFieldId String @map("example_field_id")
}
`);
    expect(messages).toHaveLength(0);
  });

  it('reports non-matching effective column names', () => {
    const messages = verify(`
model ExampleModel {
  id String @id
  exampleFieldId String
}
`);
    expect(messages).toHaveLength(1);
  });

  it('reports non-matching map values', () => {
    const messages = verify(`
model ExampleModel {
  id String @id
  exampleFieldId String @map("ExampleFieldId")
}
`);
    expect(messages).toHaveLength(1);
  });

  it('allows allowlisted fields', () => {
    const messages = verify(
      `
model ExampleModel {
  id String @id
  exampleFieldId String
}
`,
      { allowlist: ['exampleFieldId'] },
    );
    expect(messages).toHaveLength(0);
  });
});
