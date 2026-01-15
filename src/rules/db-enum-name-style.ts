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
            enum: [...STYLE_CHOICES],
            default: DEFAULT_OPTIONS[0].style,
          },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      invalidEnumName: 'Database enum names must follow the configured style.',
    },
  },
  create(context) {
    const filename = context.getFilename();
    if (!filename.endsWith('.prisma') && !filename.includes('.prisma')) {
      return {};
    }

    const { style = 'snake_case' } = context.options[0] ?? DEFAULT_OPTIONS[0];

    return {
      Program() {
        const { dmmf, locator, lineOffset } = getPrismaSchemaContext(context.getSourceCode().text);
        const node = context.getSourceCode().ast;

        const reportEnum = (enumName: string, preferMap: boolean) => {
          const mapLocation = locator.enumMapLocations.get(enumName);
          const nameLocation = locator.enumLocations.get(enumName);
          const location = preferMap ? mapLocation ?? nameLocation : nameLocation ?? mapLocation;
          if (!location) {
            context.report({ node, messageId: 'invalidEnumName' });
            return;
          }
          const offsetLocation = applyLineOffset(location, lineOffset);
          context.report({ node, loc: toReportLocation(offsetLocation), messageId: 'invalidEnumName' });
        };

        dmmf.datamodel.enums.forEach((enumItem) => {
          const mapValue = locator.enumMapValues.get(enumItem.name);
          const effectiveName = mapValue ?? enumItem.name;
          if (!isNamingStyle(effectiveName, style)) {
            reportEnum(enumItem.name, Boolean(mapValue));
          }
        });
      },
    };
  },
});
