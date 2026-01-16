import { createRule } from '../utils/create-rule';
import {
  applyLineOffset,
  getPrismaSchemaContext,
  isNamingStyle,
  resolveNamingStyle,
  toReportLocation,
} from '../utils/prisma-schema';

type Options = [{ style?: string }?];

type MessageIds = 'invalidEnumValue';

const DEFAULT_OPTIONS = [{ style: 'snake_case' }] as const;

export const dbEnumValueStyle = createRule<Options, MessageIds>({
  name: 'db-enum-value-style',
  defaultOptions: DEFAULT_OPTIONS,
  meta: {
    type: 'problem',
    docs: {
      description: 'Enforce database enum values to follow the configured style',
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
    messages: {
      invalidEnumValue: 'Database enum values must follow the {{style}} style.',
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
        const { dmmf, locator, lineOffset } = getPrismaSchemaContext(context.getSourceCode().text);
        const node = context.getSourceCode().ast;

        const reportEnumValue = (enumName: string, valueName: string, preferMap: boolean) => {
          const mapLocation = locator.enumValueMapLocations.get(enumName)?.get(valueName);
          const nameLocation = locator.enumValueLocations.get(enumName)?.get(valueName);
          const location = preferMap ? mapLocation ?? nameLocation : nameLocation ?? mapLocation;
          if (!location) {
            context.report({ node, messageId: 'invalidEnumValue', data: { style: styleLabel } });
            return;
          }
          const offsetLocation = applyLineOffset(location, lineOffset);
          context.report({
            node,
            loc: toReportLocation(offsetLocation),
            messageId: 'invalidEnumValue',
            data: { style: styleLabel },
          });
        };

        dmmf.datamodel.enums.forEach((enumItem) => {
          enumItem.values.forEach((value) => {
            const mapValue = locator.enumValueMapValues.get(enumItem.name)?.get(value.name);
            const effectiveName = mapValue ?? value.name;
            if (!isNamingStyle(effectiveName, style)) {
              reportEnumValue(enumItem.name, value.name, Boolean(mapValue));
            }
          });
        });
      },
    };
  },
});
