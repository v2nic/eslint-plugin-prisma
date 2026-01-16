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

type MessageIds = 'invalidColumnName';

const DEFAULT_OPTIONS = [{ style: 'snake_case', allowlist: [], ignoreModels: [] }] as const;

export const dbColumnNameStyle = createRule<Options, MessageIds>({
  name: 'db-column-name-style',
  defaultOptions: DEFAULT_OPTIONS,
  meta: {
    type: 'problem',
    docs: {
      description: 'Enforce database column names to follow the configured style',
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
      invalidColumnName: 'Database column names must follow the {{style}} style.',
    },
  },
  create(context) {
    const filename = context.getFilename();
    if (!filename.endsWith('.prisma') && !filename.includes('.prisma')) {
      return {};
    }

    const { style = 'snake_case', allowlist = [], ignoreModels = [] } = context.options[0] ?? DEFAULT_OPTIONS[0];

    return {
      Program() {
        const { dmmf, locator, lineOffset } = getPrismaSchemaContext(context.getSourceCode().text);
        const node = context.getSourceCode().ast;

        const reportField = (modelName: string, fieldName: string, preferMap: boolean) => {
          const mapLocation = locator.modelFieldMapLocations.get(modelName)?.get(fieldName);
          const nameLocation = locator.modelFieldLocations.get(modelName)?.get(fieldName);
          const location = preferMap ? mapLocation ?? nameLocation : nameLocation ?? mapLocation;
          if (!location) {
            context.report({ node, messageId: 'invalidColumnName', data: { style } });
            return;
          }
          const offsetLocation = applyLineOffset(location, lineOffset);
          context.report({
            node,
            loc: toReportLocation(offsetLocation),
            messageId: 'invalidColumnName',
            data: { style },
          });
        };

        dmmf.datamodel.models.forEach((model) => {
          if (model.isGenerated || ignoreModels.includes(model.name)) {
            return;
          }
          model.fields.forEach((field) => {
            if (field.kind !== 'scalar' && field.kind !== 'enum') {
              return;
            }
            if (allowlist.includes(field.name)) {
              return;
            }
            const mapValue = locator.modelFieldMapValues.get(model.name)?.get(field.name);
            const effectiveName = mapValue ?? field.name;
            if (!isNamingStyle(effectiveName, style)) {
              reportField(model.name, field.name, Boolean(mapValue));
            }
          });
        });
      },
    };
  },
});
