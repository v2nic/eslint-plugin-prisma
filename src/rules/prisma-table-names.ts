import { createRule } from '../utils/create-rule';
import { applyLineOffset, getPrismaSchemaContext, isSnakeCase, toReportLocation } from '../utils/prisma-schema';

type Options = [{ ignoreModels?: readonly string[] }?];

type MessageIds = 'invalidTableName';

const DEFAULT_OPTIONS = [{ ignoreModels: [] }] as const;

export const prismaTableNames = createRule<Options, MessageIds>({
  name: 'prisma-table-names',
  defaultOptions: DEFAULT_OPTIONS,
  meta: {
    type: 'problem',
    docs: {
      description: 'Require models to map to snake_case table names via @@map',
    },
    schema: [
      {
        type: 'object',
        properties: {
          ignoreModels: {
            type: 'array',
            items: { type: 'string' },
            default: [...DEFAULT_OPTIONS[0].ignoreModels],
          },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      invalidTableName: 'Prisma models must map to snake_case DB tables via `@@map("...")`.',
    },
  },
  create(context) {
    const filename = context.getFilename();
    if (!filename.endsWith('.prisma') && !filename.includes('.prisma')) {
      return {};
    }

    const { ignoreModels = [] } = context.options[0] ?? DEFAULT_OPTIONS[0];

    return {
      Program() {
        const { dmmf, locator, lineOffset } = getPrismaSchemaContext(context.getSourceCode().text);
        const node = context.getSourceCode().ast;

        dmmf.datamodel.models.forEach((model) => {
          if (model.isGenerated || ignoreModels.includes(model.name)) {
            return;
          }

          const mapValue = locator.modelMapValues.get(model.name);
          if (!mapValue || !isSnakeCase(mapValue)) {
            const mapLocation = locator.modelMapLocations.get(model.name) ?? locator.modelLocations.get(model.name);
            if (!mapLocation) {
              context.report({ node, messageId: 'invalidTableName' });
              return;
            }
            const offsetLocation = applyLineOffset(mapLocation, lineOffset);
            context.report({ node, loc: toReportLocation(offsetLocation), messageId: 'invalidTableName' });
          }
        });
      },
    };
  },
});
