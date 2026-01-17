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

  it('reports full range for invalid model names', () => {
    const schema = `
model example_model {
  id String @id
}
`;
    const source = `${SCHEMA_HEADER}\n${schema}`;
    const location = findLineColumn(source, 'example_model');
    const messages = verify(schema);
    expect(messages).toHaveLength(1);
    expect(messages[0].line).toBe(location.line);
    expect(messages[0].column).toBe(location.column);
    expect(messages[0].endColumn).toBe(location.column + 'example_model'.length);
  });

  it('suggests a rename for invalid model names', () => {
    const messages = verify(`
model example_model {
  id String @id
}
`);
    const suggestion = messages[0]?.suggestions?.[0] as { desc?: string } | undefined;
    expect(suggestion?.desc).toBe('Rename to "ExampleModel"');
  });

  it('applies suggestion fixes to the original schema source', () => {
    const schema = `
model example_model {
  id String @id
}
`;
    const source = `${SCHEMA_HEADER}\n${schema}`;
    const messages = verify(schema);
    const suggestion = messages[0]?.suggestions?.[0] as { fix?: { range: [number, number]; text: string } } | undefined;
    const fixed = applySuggestionFix(source, suggestion);
    expect(fixed).toContain('model ExampleModel');
    expect(fixed).not.toContain('model example_model');
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

  it('skips validation when schema parsing fails', () => {
    const messages = verify(`
model BrokenModel {
  id String @id
`);
    expect(messages).toHaveLength(0);
  });
});
