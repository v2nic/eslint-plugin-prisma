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

const findLineColumn = (source: string, marker: string): { line: number; column: number } => {
  const lines = source.split(/\r?\n/);
  for (let index = 0; index < lines.length; index += 1) {
    const columnIndex = lines[index].indexOf(marker);
    if (columnIndex !== -1) {
      return { line: index + 1, column: columnIndex + 1 };
    }
  }
  throw new Error(`Marker not found: ${marker}`);
};

const verify = (schema: string, options?: { style?: string; ignoreModels?: string[] }) =>
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

  it('suggests a rename for invalid table names', () => {
    const messages = verify(`
model ExampleModel {
  id String @id
}
`);
    const suggestion = messages[0]?.suggestions?.[0] as { desc?: string } | undefined;
    expect(suggestion?.desc).toBe('Rename to "example_model".');
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

  it('reports line and style for invalid mapped table names', () => {
    const schema = `
model ExampleModel {
  id String @id
  @@map("ExampleModel")
}
`;
    const source = `${SCHEMA_HEADER}\n${schema}`;
    const location = findLineColumn(source, '@@map');
    const messages = verify(schema);
    expect(messages).toHaveLength(1);
    expect(messages[0].line).toBe(location.line);
    expect(messages[0].column).toBe(location.column);
    expect(messages[0].message).toBe('Database table names must follow the snake_case style.');
  });

  it('normalizes configured style labels in messages', () => {
    const schema = `
model ExampleModel {
  id String @id
  @@map("ExampleModel")
}
`;
    const source = `${SCHEMA_HEADER}\n${schema}`;
    const location = findLineColumn(source, '@@map');
    const messages = verify(schema, { style: 'SnakeCase' });
    expect(messages).toHaveLength(1);
    expect(messages[0].line).toBe(location.line);
    expect(messages[0].column).toBe(location.column);
    expect(messages[0].message).toBe('Database table names must follow the snake_case style.');
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
