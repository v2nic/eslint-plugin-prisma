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

const verify = (schema: string, options?: { style?: string; allowlist?: string[] }) =>
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

  it('suggests a rename for invalid column names', () => {
    const messages = verify(`
model ExampleModel {
  id String @id
  exampleFieldId String
}
`);
    const suggestion = messages[0]?.suggestions?.[0] as { desc?: string } | undefined;
    expect(suggestion?.desc).toBe('Rename to "example_field_id"');
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

  it('reports line and style for invalid column names', () => {
    const schema = `
model ExampleModel {
  id String @id
  exampleFieldId String
}
`;
    const source = `${SCHEMA_HEADER}\n${schema}`;
    const location = findLineColumn(source, 'exampleFieldId');
    const messages = verify(schema);
    expect(messages).toHaveLength(1);
    expect(messages[0].line).toBe(location.line);
    expect(messages[0].column).toBe(location.column);
    expect(messages[0].message).toBe('Database column names must follow the snake_case style.');
  });

  it('reports line for invalid fields after a field named model', () => {
    const schema = `
model ExampleModel {
  id String @id
  model String
  exampleFieldId String
}
`;
    const source = `${SCHEMA_HEADER}\n${schema}`;
    const location = findLineColumn(source, 'exampleFieldId');
    const messages = verify(schema);
    expect(messages).toHaveLength(1);
    expect(messages[0].line).toBe(location.line);
    expect(messages[0].column).toBe(location.column);
    expect(messages[0].message).toBe('Database column names must follow the snake_case style.');
  });

  it('reports line and style for invalid mapped column names', () => {
    const schema = `
model ExampleModel {
  id String @id
  exampleFieldId String @map("ExampleFieldId")
}
`;
    const source = `${SCHEMA_HEADER}\n${schema}`;
    const location = findLineColumn(source, '@map');
    const messages = verify(schema);
    expect(messages).toHaveLength(1);
    expect(messages[0].line).toBe(location.line);
    expect(messages[0].column).toBe(location.column);
    expect(messages[0].message).toBe('Database column names must follow the snake_case style.');
  });

  it('normalizes configured style labels in messages', () => {
    const schema = `
model ExampleModel {
  id String @id
  exampleFieldId String @map("ExampleFieldId")
}
`;
    const source = `${SCHEMA_HEADER}\n${schema}`;
    const location = findLineColumn(source, '@map');
    const messages = verify(schema, { style: 'SnakeCase' });
    expect(messages).toHaveLength(1);
    expect(messages[0].line).toBe(location.line);
    expect(messages[0].column).toBe(location.column);
    expect(messages[0].message).toBe('Database column names must follow the snake_case style.');
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
