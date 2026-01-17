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

type MessageIds = 'invalidEnumName' | 'renameToStyle';

const DEFAULT_OPTIONS = [{ style: 'pascal_case' }] as const;

export const schemaEnumNameStyle = createRule<Options, MessageIds>({
  name: 'schema-enum-name-style',
  defaultOptions: DEFAULT_OPTIONS,
  meta: {
    type: 'problem',
    docs: {
      description: 'Enforce schema enum names to follow the configured TypeScript style',
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
      invalidEnumName: 'Schema enum names must follow the {{style}} style.',
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
    const sourceText = context.getSourceCode().text;

    return {
      Program() {
        const { dmmf, locator, lineOffset } = getPrismaSchemaContext(context.getSourceCode().text);
        const node = context.getSourceCode().ast;

        const reportEnum = (enumName: string) => {
          const location = locator.enumLocations.get(enumName);
          if (!location) {
            context.report({ node, messageId: 'invalidEnumName', data: { style: styleLabel } });
            return;
          }
          const offsetLocation = applyLineOffset(location, lineOffset);
          const suggestedName = toNamingStyle(enumName, style);
          const suggestionRange = getSourceRange(sourceText, offsetLocation, enumName.length);
          context.report({
            node,
            loc: toReportLocation(offsetLocation),
            messageId: 'invalidEnumName',
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
          if (!isNamingStyle(enumItem.name, style)) {
            reportEnum(enumItem.name);
          }
        });
      },
    };
  },
});
