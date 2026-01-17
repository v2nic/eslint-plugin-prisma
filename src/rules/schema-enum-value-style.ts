import { createRule } from '../utils/create-rule';
import {
  applyLineOffset,
  getPrismaSchemaContext,
  getSourceRange,
  isNamingStyle,
  resolveNamingStyle,
  toNamingStyle,
  toReportLocation,
} from '../utils/prisma-schema';

type Options = [{ style?: string }?];

type MessageIds = 'invalidEnumValue' | 'renameToStyle';

const DEFAULT_OPTIONS = [{ style: 'screaming_snake_case' }] as const;

export const schemaEnumValueStyle = createRule<Options, MessageIds>({
  name: 'schema-enum-value-style',
  defaultOptions: DEFAULT_OPTIONS,
  meta: {
    type: 'problem',
    docs: {
      description: 'Enforce schema enum values to follow the configured TypeScript style',
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
        },
        additionalProperties: false,
      },
    ],
    hasSuggestions: true,
    messages: {
      invalidEnumValue: 'Schema enum values must follow the {{style}} style.',
      renameToStyle: 'Rename to "{{suggestion}}"',
    },
  },
  create(context) {
    const filename = context.getFilename();
    if (!filename.endsWith('.prisma') && !filename.includes('.prisma')) {
      return {};
    }

    const { style: styleInput } = context.options[0] ?? DEFAULT_OPTIONS[0];
    const { style, styleLabel } = resolveNamingStyle(styleInput, DEFAULT_OPTIONS[0].style);

    return {
      Program() {
        const { dmmf, locator, lineOffset, schema } = getPrismaSchemaContext(context.getSourceCode().text);
        const node = context.getSourceCode().ast;

        const reportEnumValue = (enumName: string, valueName: string) => {
          const location = locator.enumValueLocations.get(enumName)?.get(valueName);
          if (!location) {
            context.report({ node, messageId: 'invalidEnumValue', data: { style: styleLabel } });
            return;
          }
          const offsetLocation = applyLineOffset(location, lineOffset);
          const suggestedName = toNamingStyle(valueName, style);
          const suggestionRange = getSourceRange(schema, location, valueName.length);
          context.report({
            node,
            loc: toReportLocation(offsetLocation),
            messageId: 'invalidEnumValue',
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

        dmmf.datamodel.enums.forEach((enumItem) => {
          enumItem.values.forEach((value) => {
            if (!isNamingStyle(value.name, style)) {
              reportEnumValue(enumItem.name, value.name);
            }
          });
        });
      },
    };
  },
});
