import { createRule } from '../utils/create-rule';
import {
  applyLineOffset,
  getPrismaSchemaContext,
  isPascalCase,
  isScreamingSnakeCase,
  isSnakeCase,
  toReportLocation,
} from '../utils/prisma-schema';

type Options = [{ enumNameStyle?: 'snake_case' | 'pascal_case'; requireEnumMap?: boolean }?];

type MessageIds = 'invalidEnumName' | 'invalidEnumValue';

const DEFAULT_OPTIONS = [{ enumNameStyle: 'snake_case', requireEnumMap: true }] as const;

export const prismaEnumNames = createRule<Options, MessageIds>({
  name: 'prisma-enum-names',
  defaultOptions: DEFAULT_OPTIONS,
  meta: {
    type: 'problem',
    docs: {
      description: 'Enforce Prisma enum naming and mapping conventions',
    },
    schema: [
      {
        type: 'object',
        properties: {
          enumNameStyle: {
            type: 'string',
            enum: ['snake_case', 'pascal_case'],
            default: DEFAULT_OPTIONS[0].enumNameStyle,
          },
          requireEnumMap: {
            type: 'boolean',
            default: DEFAULT_OPTIONS[0].requireEnumMap,
          },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      invalidEnumName:
        'Prisma enum names must follow the configured repo convention and include `@@map("...")` when required.',
      invalidEnumValue: 'Prisma enum values must be SCREAMING_SNAKE_CASE.',
    },
  },
  create(context) {
    const filename = context.getFilename();
    if (!filename.endsWith('.prisma') && !filename.includes('.prisma')) {
      return {};
    }

    const { enumNameStyle = 'snake_case', requireEnumMap = true } = context.options[0] ?? DEFAULT_OPTIONS[0];

    return {
      Program() {
        const { dmmf, locator, lineOffset } = getPrismaSchemaContext(context.getSourceCode().text);
        const node = context.getSourceCode().ast;

        const reportEnum = (enumName: string) => {
          const location = locator.enumLocations.get(enumName) ?? locator.enumMapLocations.get(enumName);
          if (!location) {
            context.report({ node, messageId: 'invalidEnumName' });
            return;
          }
          const offsetLocation = applyLineOffset(location, lineOffset);
          context.report({ node, loc: toReportLocation(offsetLocation), messageId: 'invalidEnumName' });
        };

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
          const nameValid = enumNameStyle === 'snake_case' ? isSnakeCase(enumItem.name) : isPascalCase(enumItem.name);
          const mapValue = locator.enumMapValues.get(enumItem.name);
          const mapValid = mapValue ? isSnakeCase(mapValue) : false;

          if (!nameValid || (requireEnumMap && !mapValid)) {
            reportEnum(enumItem.name);
          }

          enumItem.values.forEach((value) => {
            if (!isScreamingSnakeCase(value.name)) {
              reportEnumValue(enumItem.name, value.name);
            }
          });
        });
      },
    };
  },
});
