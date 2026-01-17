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

const verify = (schema: string, options?: { style?: string }) =>
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

  it('suggests a rename for invalid enum names', () => {
    const messages = verify(`
enum example_enum {
  VALUE
}
`);
    const suggestion = messages[0]?.suggestions?.[0] as { desc?: string } | undefined;
    expect(suggestion?.desc).toBe('Rename to "ExampleEnum".');
  });

  it('reports line and style for invalid enum names', () => {
    const schema = `
enum example_enum {
  VALUE
}
`;
    const source = `${SCHEMA_HEADER}\n${schema}`;
    const location = findLineColumn(source, 'example_enum');
    const messages = verify(schema);
    expect(messages).toHaveLength(1);
    expect(messages[0].line).toBe(location.line);
    expect(messages[0].column).toBe(location.column);
    expect(messages[0].message).toBe('Schema enum names must follow the PascalCase style.');
  });

  it('normalizes configured style labels in messages', () => {
    const schema = `
enum ExampleEnum {
  VALUE
}
`;
    const source = `${SCHEMA_HEADER}\n${schema}`;
    const location = findLineColumn(source, 'ExampleEnum');
    const messages = verify(schema, { style: 'SnakeCase' });
    expect(messages).toHaveLength(1);
    expect(messages[0].line).toBe(location.line);
    expect(messages[0].column).toBe(location.column);
    expect(messages[0].message).toBe('Schema enum names must follow the snake_case style.');
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
