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

type MessageIds = 'invalidModelName';

const DEFAULT_OPTIONS = [{ style: 'pascal_case', ignoreModels: [] }] as const;

export const schemaModelNameStyle = createRule<Options, MessageIds>({
  name: 'schema-model-name-style',
  defaultOptions: DEFAULT_OPTIONS,
  meta: {
    type: 'problem',
    docs: {
      description: 'Enforce schema model names to follow the configured TypeScript style',
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
      invalidModelName: 'Schema model names must follow the configured style.',
    },
  },
  create(context) {
    const filename = context.getFilename();
    if (!filename.endsWith('.prisma') && !filename.includes('.prisma')) {
      return {};
    }

    const { style = 'pascal_case', ignoreModels = [] } = context.options[0] ?? DEFAULT_OPTIONS[0];

    return {
      Program() {
        const { dmmf, locator, lineOffset } = getPrismaSchemaContext(context.getSourceCode().text);
        const node = context.getSourceCode().ast;

        const reportModel = (modelName: string) => {
          const location = locator.modelLocations.get(modelName);
          if (!location) {
            context.report({ node, messageId: 'invalidModelName' });
            return;
          }
          const offsetLocation = applyLineOffset(location, lineOffset);
          context.report({ node, loc: toReportLocation(offsetLocation), messageId: 'invalidModelName' });
        };

        dmmf.datamodel.models.forEach((model) => {
          if (model.isGenerated || ignoreModels.includes(model.name)) {
            return;
          }
          if (!isNamingStyle(model.name, style)) {
            reportModel(model.name);
          }
        });
      },
    };
  },
});
