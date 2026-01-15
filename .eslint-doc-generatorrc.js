const fs = require('node:fs');
const path = require('node:path');
const prettier = require('prettier');

const prettierConfig = JSON.parse(fs.readFileSync(path.join(__dirname, '.prettierrc'), { encoding: 'utf-8' }));

/** @type {import('eslint-doc-generator').GenerateOptions} */
module.exports = {
  postprocess: (content) => prettier.format(content, { ...prettierConfig, parser: 'markdown' }),
};
