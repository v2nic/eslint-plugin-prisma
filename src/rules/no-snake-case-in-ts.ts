import { AST_NODE_TYPES } from '@typescript-eslint/utils';
import minimatch from 'minimatch';
import { createRule } from '../utils/create-rule';

type Options = [{ allowedSnakeCaseKeys?: readonly string[]; allowedFileGlobs?: readonly string[] }?];

type MessageIds = 'noSnakeCase';

const DEFAULT_OPTIONS = [{ allowedSnakeCaseKeys: [], allowedFileGlobs: [] }] as const;

const isSnakeCase = (value: string): boolean => /^[a-z][a-z0-9]*(_[a-z0-9]+)+$/.test(value);

const isAllowedFile = (filename: string, allowedFileGlobs: readonly string[]): boolean =>
  allowedFileGlobs.some((glob) => minimatch(filename, glob));

const isProcessEnvProperty = (node: { parent?: unknown }): boolean => {
  if (!node.parent || typeof node.parent !== 'object') {
    return false;
  }

  const parent = node.parent as { type?: string; object?: unknown; property?: unknown };
  if (parent.type !== AST_NODE_TYPES.MemberExpression || parent.property !== node) {
    return false;
  }

  const object = parent.object as { type?: string; object?: unknown; property?: unknown };
  if (object?.type !== AST_NODE_TYPES.MemberExpression) {
    return false;
  }

  const root = object.object as { type?: string; name?: string };
  const property = object.property as { type?: string; name?: string };
  return root?.type === AST_NODE_TYPES.Identifier && root.name === 'process' && property?.name === 'env';
};

export const noSnakeCaseInTs = createRule<Options, MessageIds>({
  name: 'no-snake-case-in-ts',
  defaultOptions: DEFAULT_OPTIONS,
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow snake_case identifiers and keys in TypeScript',
    },
    schema: [
      {
        type: 'object',
        properties: {
          allowedSnakeCaseKeys: {
            type: 'array',
            items: { type: 'string' },
            default: [...DEFAULT_OPTIONS[0].allowedSnakeCaseKeys],
          },
          allowedFileGlobs: {
            type: 'array',
            items: { type: 'string' },
            default: [...DEFAULT_OPTIONS[0].allowedFileGlobs],
          },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      noSnakeCase: 'Do not introduce snake_case in TypeScript. Use camelCase in application code.',
    },
  },
  create(context) {
    const filename = context.getFilename();
    const { allowedSnakeCaseKeys = [], allowedFileGlobs = [] } = context.options[0] ?? DEFAULT_OPTIONS[0];

    if (isAllowedFile(filename, allowedFileGlobs)) {
      return {};
    }

    const isAllowedKey = (value: string): boolean => allowedSnakeCaseKeys.includes(value);

    return {
      Identifier(node) {
        if (!isSnakeCase(node.name)) {
          return;
        }

        if (isAllowedKey(node.name)) {
          return;
        }

        if (node.parent?.type === AST_NODE_TYPES.MemberExpression && node.parent.property === node) {
          return;
        }

        if (node.parent?.type === AST_NODE_TYPES.Property && node.parent.key === node) {
          return;
        }

        if (isProcessEnvProperty(node)) {
          return;
        }

        context.report({ node, messageId: 'noSnakeCase' });
      },
      Property(node) {
        if (node.computed) {
          return;
        }

        if (node.key.type === AST_NODE_TYPES.Identifier) {
          if (!isSnakeCase(node.key.name) || isAllowedKey(node.key.name)) {
            return;
          }
          context.report({ node: node.key, messageId: 'noSnakeCase' });
          return;
        }

        if (node.key.type === AST_NODE_TYPES.Literal && typeof node.key.value === 'string') {
          if (!isSnakeCase(node.key.value) || isAllowedKey(node.key.value)) {
            return;
          }
          context.report({ node: node.key, messageId: 'noSnakeCase' });
        }
      },
    };
  },
});
