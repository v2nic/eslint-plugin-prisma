import { createRule } from '../utils/create-rule';
import {
  applyLineOffset,
  getPrismaSchemaContext,
  isNamingStyle,
  type NamingStyle,
  toReportLocation,
} from '../utils/prisma-schema';

const STYLE_CHOICES = ['snake_case', 'camel_case', 'pascal_case', 'screaming_snake_case'] as const;

type Options = [{ style?: NamingStyle; ignoreModels?: readonly string[] }?];

type MessageIds = 'invalidTableName';

const DEFAULT_OPTIONS = [{ style: 'snake_case', ignoreModels: [] }] as const;

export const dbTableNameStyle = createRule<Options, MessageIds>({
  name: 'db-table-name-style',
  defaultOptions: DEFAULT_OPTIONS,
  meta: {
    type: 'problem',
    docs: {
      description: 'Enforce database table names to follow the configured style',
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
      invalidTableName: 'Database table names must follow the configured style.',
    },
  },
  create(context) {
    const filename = context.getFilename();
    if (!filename.endsWith('.prisma') && !filename.includes('.prisma')) {
      return {};
    }

    const { style = 'snake_case', ignoreModels = [] } = context.options[0] ?? DEFAULT_OPTIONS[0];

    return {
      Program() {
        const { dmmf, locator, lineOffset } = getPrismaSchemaContext(context.getSourceCode().text);
        const node = context.getSourceCode().ast;

        const reportModel = (modelName: string, preferMap: boolean) => {
          const mapLocation = locator.modelMapLocations.get(modelName);
          const nameLocation = locator.modelLocations.get(modelName);
          const location = preferMap ? mapLocation ?? nameLocation : nameLocation ?? mapLocation;
          if (!location) {
            context.report({ node, messageId: 'invalidTableName' });
            return;
          }
          const offsetLocation = applyLineOffset(location, lineOffset);
          context.report({ node, loc: toReportLocation(offsetLocation), messageId: 'invalidTableName' });
        };

        dmmf.datamodel.models.forEach((model) => {
          if (model.isGenerated || ignoreModels.includes(model.name)) {
            return;
          }

          const mapValue = locator.modelMapValues.get(model.name);
          const effectiveName = mapValue ?? model.name;
          if (!isNamingStyle(effectiveName, style)) {
            reportModel(model.name, Boolean(mapValue));
          }
        });
      },
    };
  },
});
