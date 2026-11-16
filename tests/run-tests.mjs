import esbuild from 'esbuild';
import { run } from 'node:test';
import { spec } from 'node:test/reporters';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// 1. Bundle tests with obsidian mocked to tests/obsidian-mock.ts
const outfile = path.join(__dirname, '.test-bundle.mjs');

await esbuild.build({
	entryPoints: [path.join(__dirname, 'linter.test.ts')],
	bundle: true,
	platform: 'node',
	format: 'esm',
	target: 'node20',
	alias: {
		obsidian: path.join(__dirname, 'obsidian-mock.ts'),
	},
	external: ['node:test', 'node:assert', 'node:assert/strict'],
	outfile: outfile,
});

// 2. Run the bundled test with Node test runner
const testStream = run({
	files: [outfile],
});

testStream.compose(new spec()).pipe(process.stdout);

testStream.on('test:fail', () => {
	process.exitCode = 1;
});
