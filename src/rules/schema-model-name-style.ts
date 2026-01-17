import { createRule } from '../utils/create-rule';
import {
  applyLineOffset,
  getPrismaSchemaContext,
  getSourceRange,
  isNamingStyle,
  resolveNamingStyle,
  toNamingStyle,
} from '../utils/prisma-schema';

type Options = [{ style?: string; ignoreModels?: readonly string[] }?];

type MessageIds = 'invalidModelName' | 'renameToStyle';

const DEFAULT_OPTIONS = [{ style: 'pascal_case', ignoreModels: [] }] as const;

export const schemaModelNameStyle = createRule<Options, MessageIds>({
  name: 'schema-model-name-style',
  defaultOptions: DEFAULT_OPTIONS,
  meta: {
    type: 'problem',
    docs: {
      description: 'Enforce schema model names to follow the configured TypeScript style',
    },
    schema: [
      {
        type: 'object',
        properties: {
          style: {
            type: 'string',
            description: 'Case-insensitive. Accepts snake_case, camel_case, pascal_case, or screaming_snake_case.',
            default: DEFAULT_OPTIONS[0].style,
          },
          ignoreModels: {
            type: 'array',
            description: 'Model names to skip when validating schema model names.',
            items: { type: 'string' },
            default: [...DEFAULT_OPTIONS[0].ignoreModels],
          },
        },
        additionalProperties: false,
      },
    ],
    hasSuggestions: true,
    messages: {
      invalidModelName: 'Schema model names must follow the {{style}} style.',
      renameToStyle: 'Rename to "{{suggestion}}"',
    },
  },
  create(context) {
    const filename = context.getFilename();
    if (!filename.endsWith('.prisma') && !filename.includes('.prisma')) {
      return {};
    }

    const { style: styleInput, ignoreModels = [] } = context.options[0] ?? DEFAULT_OPTIONS[0];
    const { style, styleLabel } = resolveNamingStyle(styleInput, DEFAULT_OPTIONS[0].style);

    return {
      Program() {
        const schemaContext = getPrismaSchemaContext(context.getSourceCode().text);
        if (!schemaContext) {
          return;
        }
        const { dmmf, locator, lineOffset, schema } = schemaContext;
        const node = context.getSourceCode().ast;

        const reportModel = (modelName: string) => {
          const location = locator.modelLocations.get(modelName);
          if (!location) {
            context.report({ node, messageId: 'invalidModelName', data: { style: styleLabel } });
            return;
          }
          const offsetLocation = applyLineOffset(location, lineOffset);
          const suggestedName = toNamingStyle(modelName, style);
          const suggestionRange = getSourceRange(schema, location, modelName.length);
          context.report({
            node,
            loc: {
              start: offsetLocation,
              end: {
                line: offsetLocation.line,
                column: offsetLocation.column + modelName.length,
              },
            },
            messageId: 'invalidModelName',
            data: { style: styleLabel },
            suggest: [
              {
                messageId: 'renameToStyle',
                data: { suggestion: suggestedName },
                fix: (fixer) => fixer.replaceTextRange(suggestionRange, suggestedName),
              },
            ],
          });
        };

        dmmf.datamodel.models.forEach((model) => {
          if (model.isGenerated || ignoreModels.includes(model.name)) {
            return;
          }
          if (!isNamingStyle(model.name, style)) {
            reportModel(model.name);
          }
        });
      },
    };
  },
});
