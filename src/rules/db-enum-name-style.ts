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

type Options = [{ style?: string }?];

type MessageIds = 'invalidEnumName' | 'renameToStyle';

const DEFAULT_OPTIONS = [{ style: 'snake_case' }] as const;

export const dbEnumNameStyle = createRule<Options, MessageIds>({
  name: 'db-enum-name-style',
  defaultOptions: DEFAULT_OPTIONS,
  meta: {
    type: 'problem',
    docs: {
      description: 'Enforce database enum names to follow the configured style',
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
      invalidEnumName: 'Database enum names must follow the {{style}} style.',
      renameToStyle: 'Rename to "{{suggestion}}".',
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

        const reportEnum = (enumName: string, mapValue: string | undefined) => {
          const mapLocation = locator.enumMapLocations.get(enumName);
          const nameLocation = locator.enumLocations.get(enumName);
          const preferMap = Boolean(mapValue);
          const location = preferMap ? mapLocation ?? nameLocation : nameLocation ?? mapLocation;
          if (!location) {
            context.report({ node, messageId: 'invalidEnumName', data: { style: styleLabel } });
            return;
          }
          const offsetLocation = applyLineOffset(location, lineOffset);
          const suggestedName = toNamingStyle(mapValue ?? enumName, style);
          let suggestionRange: [number, number] | null = null;
          if (mapValue && mapLocation) {
            const offsetMapLocation = applyLineOffset(mapLocation, lineOffset);
            suggestionRange = getMapValueRange(sourceText, offsetMapLocation.line);
          } else if (!mapValue && nameLocation) {
            const offsetNameLocation = applyLineOffset(nameLocation, lineOffset);
            suggestionRange = getSourceRange(sourceText, offsetNameLocation, enumName.length);
          }
          context.report({
            node,
            loc: toReportLocation(offsetLocation),
            messageId: 'invalidEnumName',
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

        dmmf.datamodel.enums.forEach((enumItem) => {
          const mapValue = locator.enumMapValues.get(enumItem.name);
          const effectiveName = mapValue ?? enumItem.name;
          if (!isNamingStyle(effectiveName, style)) {
            reportEnum(enumItem.name, mapValue);
          }
        });
      },
    };
  },
});
