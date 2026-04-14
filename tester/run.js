import { spawn } from 'node:child_process';
import { readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const baseUrl = (process.argv[2] || 'http://localhost:3000').replace(/\/$/, '');

console.log(`\nTarget: ${baseUrl}\n`);

const __dirname = dirname(fileURLToPath(import.meta.url));
const testsDir = join(__dirname, 'tests');

const testFiles = readdirSync(testsDir)
  .filter((f) => f.endsWith('.test.js'))
  .map((f) => join(testsDir, f));

if (testFiles.length === 0) {
  console.error('No *.test.js files found in', testsDir);
  process.exit(1);
}

const child = spawn(
  process.execPath,
  ['--test', ...testFiles],
  {
    stdio: 'inherit',
    env: { ...process.env, BASE_URL: baseUrl },
  },
);

child.on('exit', (code) => process.exit(code ?? 1));
