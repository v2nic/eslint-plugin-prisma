import { RuleTester } from '@typescript-eslint/rule-tester';
import { noSnakeCaseInTs } from '../../src/rules/no-snake-case-in-ts';

const ruleTester = new RuleTester({
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
  },
});

ruleTester.run('no-snake-case-in-ts', noSnakeCaseInTs, {
  valid: [
    {
      code: 'const wallboxChargerId = "123"; const x = { wallboxChargerId };',
      filename: 'src/server/example.ts',
    },
    {
      code: 'const data = { wallbox_charger_id: "123" };',
      filename: 'src/server/example.ts',
      options: [{ allowedSnakeCaseKeys: ['wallbox_charger_id'] }],
    },
    {
      code: 'const wallbox_charger_id = "123";',
      filename: 'src/generated/client.ts',
      options: [{ allowedFileGlobs: ['**/generated/**'] }],
    },
    {
      code: 'const value = process.env.wallbox_charger_id;',
      filename: 'src/server/example.ts',
    },
  ],
  invalid: [
    {
      code: 'const wallbox_charger_id = "123";',
      filename: 'src/server/example.ts',
      errors: [{ messageId: 'noSnakeCase' }],
    },
    {
      code: 'const x = { wallbox_charger_id: "123" };',
      filename: 'src/server/example.ts',
      errors: [{ messageId: 'noSnakeCase' }],
    },
    {
      code: 'const x = { "wallbox_charger_id": "123" };',
      filename: 'src/server/example.ts',
      errors: [{ messageId: 'noSnakeCase' }],
    },
  ],
});
