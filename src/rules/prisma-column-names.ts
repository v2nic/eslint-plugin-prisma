import { createRule } from '../utils/create-rule';
import {
  applyLineOffset,
  getPrismaSchemaContext,
  isCamelCase,
  isSnakeCase,
  toReportLocation,
} from '../utils/prisma-schema';

type Options = [{ allowlist?: readonly string[] }?];

type MessageIds = 'invalidFieldName';

const DEFAULT_OPTIONS = [{ allowlist: [] }] as const;

export const prismaColumnNames = createRule<Options, MessageIds>({
  name: 'prisma-column-names',
  defaultOptions: DEFAULT_OPTIONS,
  meta: {
    type: 'problem',
    docs: {
      description: 'Enforce camelCase Prisma fields mapped to snake_case columns',
    },
    schema: [
      {
        type: 'object',
        properties: {
          allowlist: {
            type: 'array',
            items: { type: 'string' },
            default: [...DEFAULT_OPTIONS[0].allowlist],
          },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      invalidFieldName:
        'Prisma model field names must be camelCase. Use `@map("...")` to map to a snake_case DB column.',
    },
  },
  create(context) {
    const filename = context.getFilename();
    if (!filename.endsWith('.prisma') && !filename.includes('.prisma')) {
      return {};
    }

    const { allowlist = [] } = context.options[0] ?? DEFAULT_OPTIONS[0];

    return {
      Program() {
        const { dmmf, locator, lineOffset } = getPrismaSchemaContext(context.getSourceCode().text);
        const node = context.getSourceCode().ast;
        const reportField = (modelName: string, fieldName: string) => {
          const location = locator.modelFieldLocations.get(modelName)?.get(fieldName);
          if (!location) {
            context.report({ node, messageId: 'invalidFieldName' });
            return;
          }
          const offsetLocation = applyLineOffset(location, lineOffset);
          context.report({ node, loc: toReportLocation(offsetLocation), messageId: 'invalidFieldName' });
        };

        dmmf.datamodel.models.forEach((model) => {
          if (model.isGenerated) {
            return;
          }
          model.fields.forEach((field) => {
            if (field.kind !== 'scalar' && field.kind !== 'enum') {
              return;
            }
            if (allowlist.includes(field.name)) {
              return;
            }
            if (!isCamelCase(field.name)) {
              reportField(model.name, field.name);
              return;
            }
            const mapValue = locator.modelFieldMapValues.get(model.name)?.get(field.name);
            if (!mapValue) {
              if (!isSnakeCase(field.name)) {
                reportField(model.name, field.name);
              }
              return;
            }
            if (!isSnakeCase(mapValue)) {
              reportField(model.name, field.name);
            }
          });
        });
      },
    };
  },
});
