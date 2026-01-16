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

type MessageIds = 'invalidEnumName';

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
            enum: [...STYLE_CHOICES],
            default: DEFAULT_OPTIONS[0].style,
          },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      invalidEnumName: 'Schema enum names must follow the {{style}} style.',
    },
  },
  create(context) {
    const filename = context.getFilename();
    if (!filename.endsWith('.prisma') && !filename.includes('.prisma')) {
      return {};
    }

    const { style = 'pascal_case' } = context.options[0] ?? DEFAULT_OPTIONS[0];

    return {
      Program() {
        const { dmmf, locator, lineOffset } = getPrismaSchemaContext(context.getSourceCode().text);
        const node = context.getSourceCode().ast;

        const reportEnum = (enumName: string) => {
          const location = locator.enumLocations.get(enumName);
          if (!location) {
            context.report({ node, messageId: 'invalidEnumName', data: { style } });
            return;
          }
          const offsetLocation = applyLineOffset(location, lineOffset);
          context.report({
            node,
            loc: toReportLocation(offsetLocation),
            messageId: 'invalidEnumName',
            data: { style },
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
