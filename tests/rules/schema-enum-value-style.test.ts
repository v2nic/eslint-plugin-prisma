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

const applySuggestionFix = (
  source: string,
  suggestion: { fix?: { range: [number, number]; text: string } } | undefined,
): string => {
  if (!suggestion?.fix) {
    throw new Error('Suggestion fix is missing.');
  }
  const [start, end] = suggestion.fix.range;
  return `${source.slice(0, start)}${suggestion.fix.text}${source.slice(end)}`;
};

const preprocess = (code: string) => [wrapPrismaSchemaForLint(code)];
const postprocess = (messages: Array<Array<unknown>>) => messages.flat();

const verify = (schema: string, options?: { style?: string }) =>
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

  it('suggests a rename for invalid enum values', () => {
    const messages = verify(`
enum ExampleEnum {
  example_value
}
`);
    const suggestion = messages[0]?.suggestions?.[0] as { desc?: string } | undefined;
    expect(suggestion?.desc).toBe('Rename to "EXAMPLE_VALUE"');
  });

  it('applies suggestion fixes to the original schema source', () => {
    const schema = `
enum ExampleEnum {
  example_value
}
`;
    const source = `${SCHEMA_HEADER}\n${schema}`;
    const messages = verify(schema);
    const suggestion = messages[0]?.suggestions?.[0] as { fix?: { range: [number, number]; text: string } } | undefined;
    const fixed = applySuggestionFix(source, suggestion);
    expect(fixed).toContain('EXAMPLE_VALUE');
    expect(fixed).not.toContain('example_value');
  });

  it('normalizes configured style labels in messages', () => {
    const messages = verify(
      `
enum ExampleEnum {
  ExampleValue
}
`,
      { style: 'SnakeCase' },
    );
    expect(messages).toHaveLength(1);
    expect(messages[0].message).toBe('Schema enum values must follow the snake_case style.');
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
