import { createRule } from '../utils/create-rule';
import {
  applyLineOffset,
  getPrismaSchemaContext,
  isNamingStyle,
  type NamingStyle,
  toReportLocation,
} from '../utils/prisma-schema';

const STYLE_CHOICES = ['snake_case', 'camel_case', 'pascal_case', 'screaming_snake_case'] as const;

type Options = [{ style?: NamingStyle; allowlist?: readonly string[]; ignoreModels?: readonly string[] }?];

type MessageIds = 'invalidFieldName';

const DEFAULT_OPTIONS = [{ style: 'camel_case', allowlist: [], ignoreModels: [] }] as const;

export const schemaFieldNameStyle = createRule<Options, MessageIds>({
  name: 'schema-field-name-style',
  defaultOptions: DEFAULT_OPTIONS,
  meta: {
    type: 'problem',
    docs: {
      description: 'Enforce schema field names to follow the configured TypeScript style',
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
          allowlist: {
            type: 'array',
            items: { type: 'string' },
            default: [...DEFAULT_OPTIONS[0].allowlist],
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
      invalidFieldName: 'Schema field names must follow the configured style.',
    },
  },
  create(context) {
    const filename = context.getFilename();
    if (!filename.endsWith('.prisma') && !filename.includes('.prisma')) {
      return {};
    }

    const { style = 'camel_case', allowlist = [], ignoreModels = [] } = context.options[0] ?? DEFAULT_OPTIONS[0];

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
          if (model.isGenerated || ignoreModels.includes(model.name)) {
            return;
          }
          model.fields.forEach((field) => {
            if (field.kind === 'unsupported') {
              return;
            }
            if (allowlist.includes(field.name)) {
              return;
            }
            if (!isNamingStyle(field.name, style)) {
              reportField(model.name, field.name);
            }
          });
        });
      },
    };
  },
});
