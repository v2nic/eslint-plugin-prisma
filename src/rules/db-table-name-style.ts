import { createRule } from '../utils/create-rule';
import {
  applyLineOffset,
  getPrismaSchemaContext,
  getMapValueRange,
  getSourceRange,
  isNamingStyle,
  resolveNamingStyle,
  toNamingStyle,
  toReportLocation,
} from '../utils/prisma-schema';

type Options = [{ style?: string; ignoreModels?: readonly string[] }?];

type MessageIds = 'invalidTableName' | 'renameToStyle';

const DEFAULT_OPTIONS = [{ style: 'snake_case', ignoreModels: [] }] as const;

export const dbTableNameStyle = createRule<Options, MessageIds>({
  name: 'db-table-name-style',
  defaultOptions: DEFAULT_OPTIONS,
  meta: {
    type: 'problem',
    docs: {
      description: 'Enforce database table names to follow the configured style',
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
            description: 'Model names to skip when validating database table names.',
            items: { type: 'string' },
            default: [...DEFAULT_OPTIONS[0].ignoreModels],
          },
        },
        additionalProperties: false,
      },
    ],
    hasSuggestions: true,
    messages: {
      invalidTableName: 'Database table names must follow the {{style}} style.',
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
        const { dmmf, locator, lineOffset, schema } = getPrismaSchemaContext(context.getSourceCode().text);
        const node = context.getSourceCode().ast;

        const reportModel = (modelName: string, mapValue: string | undefined) => {
          const mapLocation = locator.modelMapLocations.get(modelName);
          const nameLocation = locator.modelLocations.get(modelName);
          const preferMap = Boolean(mapValue);
          const location = preferMap ? mapLocation ?? nameLocation : nameLocation ?? mapLocation;
          if (!location) {
            context.report({ node, messageId: 'invalidTableName', data: { style: styleLabel } });
            return;
          }
          const offsetLocation = applyLineOffset(location, lineOffset);
          const suggestedName = toNamingStyle(mapValue ?? modelName, style);
          let suggestionRange: [number, number] | null = null;
          if (mapValue && mapLocation) {
            suggestionRange = getMapValueRange(schema, mapLocation.line);
          } else if (!mapValue && nameLocation) {
            suggestionRange = getSourceRange(schema, nameLocation, modelName.length);
          }
          context.report({
            node,
            loc: toReportLocation(offsetLocation),
            messageId: 'invalidTableName',
            data: { style: styleLabel },
            suggest: suggestionRange
              ? [
                  {
                    messageId: 'renameToStyle',
                    data: { suggestion: suggestedName },
                    fix: (fixer) => fixer.replaceTextRange(suggestionRange, suggestedName),
                  },
                ]
              : undefined,
          });
        };

        dmmf.datamodel.models.forEach((model) => {
          if (model.isGenerated || ignoreModels.includes(model.name)) {
            return;
          }

          const mapValue = locator.modelMapValues.get(model.name);
          const effectiveName = mapValue ?? model.name;
          if (!isNamingStyle(effectiveName, style)) {
            reportModel(model.name, mapValue);
          }
        });
      },
    };
  },
});
