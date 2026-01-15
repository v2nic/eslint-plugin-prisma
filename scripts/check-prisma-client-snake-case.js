const fs = require('node:fs');
const path = require('node:path');

const targetPath = path.join(__dirname, '..', 'node_modules', '.prisma', 'client', 'index.d.ts');

if (!fs.existsSync(targetPath)) {
  console.log('Prisma client index.d.ts not found, skipping check.');
  process.exit(0);
}

const content = fs.readFileSync(targetPath, { encoding: 'utf-8' });
const snakeCasePattern = /^\s+[a-z][a-z0-9]*(_[a-z0-9]+)+(?=\s*:)/gm;
const matches = [...content.matchAll(snakeCasePattern)].map((match) => match[0].trim());

if (matches.length > 0) {
  console.error(`Found snake_case property keys in Prisma client index.d.ts: ${matches.join(', ')}`);
  process.exit(1);
}

console.log('No snake_case Prisma client fields found.');
