/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  globals: {
    'ts-jest': {
      tsconfig: {
        isolatedModules: true,
        module: 'Node16',
        moduleResolution: 'Node16',
      },
    },
  },
};
