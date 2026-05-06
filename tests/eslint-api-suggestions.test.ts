import { ESLint } from 'eslint';
import tsParser from '@typescript-eslint/parser';
import prismaPluginRaw from '../src/index';

describe('eslint api suggestions', () => {
  it('exposes suggestions through the eslint api', async () => {
    const prismaPlugin = prismaPluginRaw as unknown as ESLint.Plugin;
    const eslint = new ESLint({
      overrideConfigFile: true,
      overrideConfig: [
        {
          files: ["**/*.ts"],
          languageOptions: {
            parser: tsParser,
            parserOptions: {
              ecmaVersion: 2020,
              sourceType: 'module',
            },
          },
          plugins: {
            prisma: prismaPlugin,
          },
          rules: {
            'prisma/no-snake-case-in-ts': 'error',
          },
        },
      ],
    });

    const results = await eslint.lintText('const example_field_id = "123";', { filePath: 'test.ts' });
    expect(results).toHaveLength(1);
    const [message] = results[0]?.messages ?? [];
    expect(message?.suggestions?.[0]?.desc).toBe('Rename to "exampleFieldId"');
  });
});
