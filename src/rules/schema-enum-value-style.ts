import { createRule } from '../utils/create-rule';
import {
  applyLineOffset,
  getPrismaSchemaContext,
  isNamingStyle,
  type NamingStyle,
  toReportLocation,
} from '../utils/prisma-schema';

const STYLE_CHOICES = ['snake_case', 'camel_case', 'pascal_case', 'screaming_snake_case'] as const;

type Options = [{ style?: NamingStyle }?];

type MessageIds = 'invalidEnumValue';

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
            enum: [...STYLE_CHOICES],
            default: DEFAULT_OPTIONS[0].style,
          },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      invalidEnumValue: 'Schema enum values must follow the configured style.',
    },
  },
  create(context) {
    const filename = context.getFilename();
    if (!filename.endsWith('.prisma') && !filename.includes('.prisma')) {
      return {};
    }

    const { style = 'screaming_snake_case' } = context.options[0] ?? DEFAULT_OPTIONS[0];

    return {
      Program() {
        const { dmmf, locator, lineOffset } = getPrismaSchemaContext(context.getSourceCode().text);
        const node = context.getSourceCode().ast;

        const reportEnumValue = (enumName: string, valueName: string) => {
          const location = locator.enumValueLocations.get(enumName)?.get(valueName);
          if (!location) {
            context.report({ node, messageId: 'invalidEnumValue' });
            return;
          }
          const offsetLocation = applyLineOffset(location, lineOffset);
          context.report({ node, loc: toReportLocation(offsetLocation), messageId: 'invalidEnumValue' });
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
