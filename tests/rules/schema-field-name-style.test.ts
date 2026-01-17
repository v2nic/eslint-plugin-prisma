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

  it('suggests a rename for invalid field names', () => {
    const messages = verify(`
model ExampleModel {
  id String @id @map("id")
  example_field_id String
}
`);
    const suggestion = messages[0]?.suggestions?.[0] as { desc?: string } | undefined;
    expect(suggestion?.desc).toBe('Rename to "exampleFieldId".');
  });

  it('reports line and style for invalid field names', () => {
    const schema = `
model ExampleModel {
  id String @id @map("id")
  example_field_id String
}
`;
    const source = `${SCHEMA_HEADER}\n${schema}`;
    const location = findLineColumn(source, 'example_field_id');
    const messages = verify(schema);
    expect(messages).toHaveLength(1);
    expect(messages[0].line).toBe(location.line);
    expect(messages[0].column).toBe(location.column);
    expect(messages[0].endColumn).toBe(location.column + 'example_field_id'.length);
    expect(messages[0].message).toBe('Schema field names must follow the camelCase style.');
  });

  it('normalizes configured style labels in messages', () => {
    const schema = `
model ExampleModel {
  id String @id @map("id")
  example_field_id String
}
`;
    const source = `${SCHEMA_HEADER}\n${schema}`;
    const location = findLineColumn(source, 'example_field_id');
    const messages = verify(schema, { style: 'CamelCase' });
    expect(messages).toHaveLength(1);
    expect(messages[0].line).toBe(location.line);
    expect(messages[0].column).toBe(location.column);
    expect(messages[0].message).toBe('Schema field names must follow the camelCase style.');
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
