import parser from '@typescript-eslint/parser';
import { RuleTester } from '@typescript-eslint/rule-tester';
import { noSnakeCaseInTs } from '../../src/rules/no-snake-case-in-ts';

const ruleTester = new RuleTester({
  languageOptions: {
    parser,
    parserOptions: {
      ecmaVersion: 2020,
      sourceType: 'module',
    },
  },
});

ruleTester.run('no-snake-case-in-ts', noSnakeCaseInTs, {
  valid: [
    {
      code: 'const exampleFieldId = "123"; const x = { exampleFieldId };',
      filename: 'src/server/example.ts',
    },
    {
      code: 'const data = { example_field_id: "123" };',
      filename: 'src/server/example.ts',
      options: [{ allowedSnakeCaseKeys: ['example_field_id'] }],
    },
    {
      code: 'const example_field_id = "123";',
      filename: 'src/generated/client.ts',
      options: [{ allowedFileGlobs: ['**/generated/**'] }],
    },
    {
      code: 'const value = process.env.example_field_id;',
      filename: 'src/server/example.ts',
    },
  ],
  invalid: [
    {
      code: 'const example_field_id = "123";',
      filename: 'src/server/example.ts',
      errors: [{ messageId: 'noSnakeCase' }],
    },
    {
      code: 'const x = { example_field_id: "123" };',
      filename: 'src/server/example.ts',
      errors: [{ messageId: 'noSnakeCase' }],
    },
    {
      code: 'const x = { "example_field_id": "123" };',
      filename: 'src/server/example.ts',
      errors: [{ messageId: 'noSnakeCase' }],
    },
  ],
});
