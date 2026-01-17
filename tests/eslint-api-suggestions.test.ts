import { ESLint } from 'eslint';
import type { ESLint as ESLintType } from 'eslint';
import prismaPluginRaw from '../src/index';

describe('eslint api suggestions', () => {
  it('exposes suggestions through the eslint api', async () => {
    const prismaPlugin = prismaPluginRaw as unknown as ESLintType.Plugin;
    const eslint = new ESLint({
      useEslintrc: false,
      baseConfig: {
        parser: '@typescript-eslint/parser',
        parserOptions: {
          ecmaVersion: 2020,
          sourceType: 'module',
        },
        plugins: ['prisma'],
        rules: {
          'prisma/no-snake-case-in-ts': 'error',
        },
      },
      plugins: {
        prisma: prismaPlugin,
      },
    });

    const results = await eslint.lintText('const example_field_id = "123";');
    expect(results).toHaveLength(1);
    const [message] = results[0]?.messages ?? [];
    expect(message?.suggestions?.[0]?.desc).toBe('Rename to "exampleFieldId"');
  });
});
