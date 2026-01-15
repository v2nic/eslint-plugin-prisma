import { Linter } from 'eslint';
import { dbTableNameStyle } from '../../src/rules/db-table-name-style';
import { wrapPrismaSchemaForLint } from '../../src/utils/prisma-schema';

const linter = new Linter();
(linter as unknown as { defineRule: (...args: unknown[]) => void }).defineRule(
  'prisma/db-table-name-style',
  dbTableNameStyle as unknown,
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
  options?: { style?: 'snake_case' | 'camel_case' | 'pascal_case' | 'screaming_snake_case'; ignoreModels?: string[] },
) =>
  (linter as unknown as { verify: (...args: unknown[]) => ReturnType<Linter['verify']> }).verify(
    `${SCHEMA_HEADER}\n${schema}`,
    {
      rules: {
        'prisma/db-table-name-style': ['error', options ?? {}],
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

describe('db-table-name-style', () => {
  it('accepts snake_case model names without map by default', () => {
    const messages = verify(`
model example_model {
  id String @id
}
`);
    expect(messages).toHaveLength(0);
  });

  it('accepts snake_case map when present', () => {
    const messages = verify(`
model ExampleModel {
  id String @id
  @@map("example_model")
}
`);
    expect(messages).toHaveLength(0);
  });

  it('reports non-matching effective table name', () => {
    const messages = verify(`
model ExampleModel {
  id String @id
}
`);
    expect(messages).toHaveLength(1);
  });

  it('reports non-matching @@map value', () => {
    const messages = verify(`
model ExampleModel {
  id String @id
  @@map("ExampleModel")
}
`);
    expect(messages).toHaveLength(1);
  });

  it('ignores configured models', () => {
    const messages = verify(
      `
model ExampleModel {
  id String @id
}
`,
      { ignoreModels: ['ExampleModel'] },
    );
    expect(messages).toHaveLength(0);
  });
});
