// Runs the site and the admin on your own computer with one command: `npm run local`.
//
//   Website:  http://localhost:4321
//   Admin:    http://localhost:4321/admin   (no login; edits are saved straight to the files here)
//
// Nothing goes live from here. When you're happy, publish everything in one go with
// `git add -A && git commit -m "..." && git push` (one Netlify deploy).
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';

const require = createRequire(import.meta.url);
const pkgBin = (name, bin) => join(dirname(require.resolve(`${name}/package.json`)), bin);

const children = [
  // Lets the admin read and write the project files without GitHub (local_backend in config.yml).
  { name: 'admin', script: pkgBin('decap-server', 'dist/index.js'), args: [] },
  { name: 'site', script: pkgBin('astro', 'astro.js'), args: ['dev', ...process.argv.slice(2)] },
].map(({ name, script, args }) => {
  const child = spawn(process.execPath, [script, ...args], { stdio: ['ignore', 'pipe', 'pipe'] });
  const prefix = name === 'site' ? '' : '[admin] ';
  child.stdout.on('data', (d) => process.stdout.write(prefix + d));
  child.stderr.on('data', (d) => process.stderr.write(prefix + d));
  child.on('exit', (code) => {
    if (!stopping) {
      console.error(`\n${name} stopped (code ${code}). Shutting down.`);
      stop(code || 1);
    }
  });
  return child;
});

console.log('\n  gilbs.arevalo running locally');
console.log('  Website: http://localhost:4321');
console.log('  Admin:   http://localhost:4321/admin');
console.log('  Press Ctrl+C to stop.\n');

let stopping = false;
function stop(code = 0) {
  stopping = true;
  for (const c of children) if (c.exitCode === null) c.kill();
  setTimeout(() => process.exit(code), 300);
}
process.on('SIGINT', () => stop(0));
process.on('SIGTERM', () => stop(0));
