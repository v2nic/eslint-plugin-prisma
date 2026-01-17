import { ESLintUtils } from '@typescript-eslint/utils';

export const createRule = ESLintUtils.RuleCreator(
  (name) => `https://github.com/v2nic/eslint-plugin-prisma/blob/main/docs/rules/${name}.md`,
);
