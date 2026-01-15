import type { Processor } from '@typescript-eslint/utils/ts-eslint';
import { wrapPrismaSchemaForLint } from './prisma-schema';

export const prismaSchemaProcessor: Processor.ProcessorModule = {
  meta: {
    name: 'prisma-schema-processor',
    version: '1.0.0',
  },
  preprocess(text: string, filename: string) {
    return [{ text: wrapPrismaSchemaForLint(text), filename }];
  },
  postprocess(messages) {
    return messages.flat();
  },
  supportsAutofix: false,
};
