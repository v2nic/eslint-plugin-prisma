import { wasm } from '@prisma/internals';
import type * as DMMF from '@prisma/dmmf';

const SCHEMA_WRAPPER_REGEX = /__PRISMA_SCHEMA__\s*=\s*String\.raw`([\s\S]*?)`\s*;?/;

export type SourceLocation = {
  line: number;
  column: number;
};

export type ReportLocation = {
  start: SourceLocation;
  end: SourceLocation;
};

export type SchemaLocator = {
  modelLocations: Map<string, SourceLocation>;
  modelFieldLocations: Map<string, Map<string, SourceLocation>>;
  modelMapLocations: Map<string, SourceLocation>;
  modelMapValues: Map<string, string>;
  modelFieldMapValues: Map<string, Map<string, string>>;
  modelFieldMapLocations: Map<string, Map<string, SourceLocation>>;
  enumLocations: Map<string, SourceLocation>;
  enumValueLocations: Map<string, Map<string, SourceLocation>>;
  enumValueMapValues: Map<string, Map<string, string>>;
  enumValueMapLocations: Map<string, Map<string, SourceLocation>>;
  enumMapLocations: Map<string, SourceLocation>;
  enumMapValues: Map<string, string>;
};

export type PrismaSchemaContext = {
  schema: string;
  dmmf: DMMF.Document;
  locator: SchemaLocator;
  lineOffset: number;
};

export type NamingStyle = 'snake_case' | 'camel_case' | 'pascal_case' | 'screaming_snake_case';

const NAMING_STYLE_ALIASES: Record<string, NamingStyle> = {
  snakecase: 'snake_case',
  camelcase: 'camel_case',
  pascalcase: 'pascal_case',
  screamingsnakecase: 'screaming_snake_case',
};

const NAMING_STYLE_LABELS: Record<NamingStyle, string> = {
  snake_case: 'snake_case',
  camel_case: 'camelCase',
  pascal_case: 'PascalCase',
  screaming_snake_case: 'SCREAMING_SNAKE_CASE',
};

const splitWords = (value: string): string[] => {
  const normalized = value
    .replace(/[_\s]+/g, ' ')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/([A-Z]+)([A-Z][a-z0-9]+)/g, '$1 $2');
  return normalized
    .trim()
    .split(/\s+/)
    .filter((word) => word.length > 0);
};

const normalizeNamingStyleKey = (style: string): string => style.replace(/_/g, '').toLowerCase();

export const resolveNamingStyle = (
  styleInput: string | undefined,
  defaultStyle: NamingStyle,
): { style: NamingStyle; styleLabel: string } => {
  if (!styleInput) {
    return { style: defaultStyle, styleLabel: NAMING_STYLE_LABELS[defaultStyle] };
  }

  const normalizedKey = normalizeNamingStyleKey(styleInput);
  const style = NAMING_STYLE_ALIASES[normalizedKey];

  if (!style) {
    throw new Error(
      `Invalid style "${styleInput}". Expected snake_case, camel_case, pascal_case, or screaming_snake_case.`,
    );
  }

  return { style, styleLabel: NAMING_STYLE_LABELS[style] };
};

export const toNamingStyle = (value: string, style: NamingStyle): string => {
  const words = splitWords(value);
  switch (style) {
    case 'snake_case':
      return words.map((word) => word.toLowerCase()).join('_');
    case 'camel_case':
      return words
        .map((word, index) => {
          if (index === 0) {
            return word.toLowerCase();
          }
          return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
        })
        .join('');
    case 'pascal_case':
      return words.map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join('');
    case 'screaming_snake_case':
      return words.map((word) => word.toUpperCase()).join('_');
  }
};

export const toReportLocation = (location: SourceLocation): ReportLocation => ({
  start: location,
  end: { line: location.line, column: location.column + 1 },
});

export const applyLineOffset = (location: SourceLocation, lineOffset: number): SourceLocation => ({
  line: location.line + lineOffset,
  column: location.column,
});

const getLineStartIndices = (sourceText: string): number[] => {
  const indices = [0];
  for (let index = 0; index < sourceText.length; index += 1) {
    if (sourceText[index] === '\n') {
      indices.push(index + 1);
    }
  }
  return indices;
};

export const getLineInfo = (sourceText: string, line: number): { lineStart: number; lineText: string } => {
  const lineStarts = getLineStartIndices(sourceText);
  const lineStart = lineStarts[line - 1] ?? sourceText.length;
  const lineEnd = lineStarts[line] ? lineStarts[line] - 1 : sourceText.length;
  const lineText = sourceText.slice(lineStart, lineEnd);
  return { lineStart, lineText };
};

export const getSourceRange = (sourceText: string, location: SourceLocation, length: number): [number, number] => {
  const { lineStart } = getLineInfo(sourceText, location.line);
  const start = lineStart + location.column;
  return [start, start + length];
};

export const getMapValueRange = (sourceText: string, line: number): [number, number] | null => {
  const { lineStart, lineText } = getLineInfo(sourceText, line);
  const match = lineText.match(/@{1,2}map\("([^"]*)"\)/);
  if (!match || match.index === undefined) {
    return null;
  }
  const quoteStart = match.index + match[0].indexOf('"') + 1;
  const start = lineStart + quoteStart;
  return [start, start + match[1].length];
};

export const wrapPrismaSchemaForLint = (schema: string): string => {
  const escaped = schema.replace(/`/g, '\\`').replace(/\$\{/g, '\\${');
  return `const __PRISMA_SCHEMA__ = String.raw\`\n${escaped}\n\`\n;\nvoid __PRISMA_SCHEMA__;\n`;
};

export const extractPrismaSchemaFromSource = (sourceText: string): { schema: string; lineOffset: number } => {
  const match = sourceText.match(SCHEMA_WRAPPER_REGEX);
  if (!match) {
    return { schema: sourceText, lineOffset: 0 };
  }

  const matchText = match[0];
  const schemaIndex = matchText.indexOf(match[1]);
  const prefix = schemaIndex === -1 ? '' : matchText.slice(0, schemaIndex);
  const lineOffset = Math.max(0, prefix.split(/\r?\n/).length - 1);

  let schemaText = match[1];
  if (schemaText.startsWith('\n')) {
    schemaText = schemaText.slice(1);
  }
  if (schemaText.endsWith('\n')) {
    schemaText = schemaText.slice(0, -1);
  }

  return {
    schema: schemaText.replace(/\\`/g, '`').replace(/\\\$\{/g, '${'),
    lineOffset,
  };
};

export const getDmmfFromSchema = (schema: string): DMMF.Document => {
  const params = JSON.stringify({ prismaSchema: schema, noColor: true });
  const response = wasm.prismaSchemaWasm.get_dmmf(params);
  return JSON.parse(response) as DMMF.Document;
};

export const getPrismaSchemaContext = (sourceText: string): PrismaSchemaContext | null => {
  const { schema, lineOffset } = extractPrismaSchemaFromSource(sourceText);
  try {
    return {
      schema,
      dmmf: getDmmfFromSchema(schema),
      locator: buildSchemaLocator(schema),
      lineOffset,
    };
  } catch {
    return null;
  }
};

export const buildSchemaLocator = (schema: string): SchemaLocator => {
  const modelLocations = new Map<string, SourceLocation>();
  const modelFieldLocations = new Map<string, Map<string, SourceLocation>>();
  const modelMapLocations = new Map<string, SourceLocation>();
  const modelMapValues = new Map<string, string>();
  const modelFieldMapValues = new Map<string, Map<string, string>>();
  const modelFieldMapLocations = new Map<string, Map<string, SourceLocation>>();
  const enumLocations = new Map<string, SourceLocation>();
  const enumValueLocations = new Map<string, Map<string, SourceLocation>>();
  const enumValueMapValues = new Map<string, Map<string, string>>();
  const enumValueMapLocations = new Map<string, Map<string, SourceLocation>>();
  const enumMapLocations = new Map<string, SourceLocation>();
  const enumMapValues = new Map<string, string>();

  const lines = schema.split(/\r?\n/);
  let currentModel: string | null = null;
  let currentEnum: string | null = null;

  const ensureModelFields = (modelName: string) => {
    if (!modelFieldLocations.has(modelName)) {
      modelFieldLocations.set(modelName, new Map());
    }
    return modelFieldLocations.get(modelName) as Map<string, SourceLocation>;
  };

  const ensureModelFieldMaps = (modelName: string) => {
    if (!modelFieldMapValues.has(modelName)) {
      modelFieldMapValues.set(modelName, new Map());
    }
    return modelFieldMapValues.get(modelName) as Map<string, string>;
  };

  const ensureModelFieldMapLocations = (modelName: string) => {
    if (!modelFieldMapLocations.has(modelName)) {
      modelFieldMapLocations.set(modelName, new Map());
    }
    return modelFieldMapLocations.get(modelName) as Map<string, SourceLocation>;
  };

  const ensureEnumValues = (enumName: string) => {
    if (!enumValueLocations.has(enumName)) {
      enumValueLocations.set(enumName, new Map());
    }
    return enumValueLocations.get(enumName) as Map<string, SourceLocation>;
  };

  const ensureEnumValueMaps = (enumName: string) => {
    if (!enumValueMapValues.has(enumName)) {
      enumValueMapValues.set(enumName, new Map());
    }
    return enumValueMapValues.get(enumName) as Map<string, string>;
  };

  const ensureEnumValueMapLocations = (enumName: string) => {
    if (!enumValueMapLocations.has(enumName)) {
      enumValueMapLocations.set(enumName, new Map());
    }
    return enumValueMapLocations.get(enumName) as Map<string, SourceLocation>;
  };

  lines.forEach((line, index) => {
    const lineNumber = index + 1;
    const trimmed = line.trim();
    if (trimmed.startsWith('//')) {
      return;
    }

    const modelMatch = line.match(/^\s*model\s+(\w+)\s*\{/);
    if (modelMatch) {
      currentModel = modelMatch[1];
      currentEnum = null;
      modelLocations.set(currentModel, { line: lineNumber, column: Math.max(0, line.indexOf(currentModel)) });
      return;
    }

    const enumMatch = line.match(/^\s*enum\s+(\w+)/);
    if (enumMatch) {
      currentEnum = enumMatch[1];
      currentModel = null;
      enumLocations.set(currentEnum, { line: lineNumber, column: Math.max(0, line.indexOf(currentEnum)) });
      return;
    }

    if (trimmed.startsWith('}')) {
      currentModel = null;
      currentEnum = null;
      return;
    }

    if (currentModel) {
      if (trimmed.startsWith('@@map')) {
        modelMapLocations.set(currentModel, { line: lineNumber, column: Math.max(0, line.indexOf('@@map')) });
        const mapMatch = trimmed.match(/@@map\("([^"]+)"\)/);
        if (mapMatch) {
          modelMapValues.set(currentModel, mapMatch[1]);
        }
        return;
      }

      if (trimmed.startsWith('@@') || trimmed.startsWith('@')) {
        return;
      }

      const fieldMatch = line.match(/^\s*(\w+)\s+\S+/);
      if (fieldMatch) {
        ensureModelFields(currentModel).set(fieldMatch[1], {
          line: lineNumber,
          column: Math.max(0, line.indexOf(fieldMatch[1])),
        });
        const mapMatch = trimmed.match(/@map\("([^"]+)"\)/);
        if (mapMatch) {
          ensureModelFieldMaps(currentModel).set(fieldMatch[1], mapMatch[1]);
          ensureModelFieldMapLocations(currentModel).set(fieldMatch[1], {
            line: lineNumber,
            column: Math.max(0, line.indexOf('@map')),
          });
        }
      }
      return;
    }

    if (currentEnum) {
      if (trimmed.startsWith('@@map')) {
        enumMapLocations.set(currentEnum, { line: lineNumber, column: Math.max(0, line.indexOf('@@map')) });
        const mapMatch = trimmed.match(/@@map\("([^"]+)"\)/);
        if (mapMatch) {
          enumMapValues.set(currentEnum, mapMatch[1]);
        }
        return;
      }

      if (trimmed.startsWith('@@') || trimmed.startsWith('@') || trimmed.length === 0) {
        return;
      }

      const valueMatch = line.match(/^\s*(\w+)/);
      if (valueMatch) {
        ensureEnumValues(currentEnum).set(valueMatch[1], {
          line: lineNumber,
          column: Math.max(0, line.indexOf(valueMatch[1])),
        });
        const mapMatch = trimmed.match(/@map\("([^"]+)"\)/);
        if (mapMatch) {
          ensureEnumValueMaps(currentEnum).set(valueMatch[1], mapMatch[1]);
          ensureEnumValueMapLocations(currentEnum).set(valueMatch[1], {
            line: lineNumber,
            column: Math.max(0, line.indexOf('@map')),
          });
        }
      }
    }
  });

  return {
    modelLocations,
    modelFieldLocations,
    modelMapLocations,
    modelMapValues,
    modelFieldMapValues,
    modelFieldMapLocations,
    enumLocations,
    enumValueLocations,
    enumValueMapValues,
    enumValueMapLocations,
    enumMapLocations,
    enumMapValues,
  };
};

export const isSnakeCase = (value: string): boolean => /^[a-z][a-z0-9]*(_[a-z0-9]+)*$/.test(value);

export const isCamelCase = (value: string): boolean => /^[a-z][a-zA-Z0-9]*$/.test(value) && !value.includes('_');

export const isPascalCase = (value: string): boolean => /^[A-Z][a-zA-Z0-9]*$/.test(value) && !value.includes('_');

export const isScreamingSnakeCase = (value: string): boolean => /^[A-Z][A-Z0-9]*(_[A-Z0-9]+)*$/.test(value);

export const isNamingStyle = (value: string, style: NamingStyle): boolean => {
  switch (style) {
    case 'snake_case':
      return isSnakeCase(value);
    case 'camel_case':
      return isCamelCase(value);
    case 'pascal_case':
      return isPascalCase(value);
    case 'screaming_snake_case':
      return isScreamingSnakeCase(value);
  }
};
