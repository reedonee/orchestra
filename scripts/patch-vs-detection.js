/**
 * Patch @react-native-windows/cli to detect incomplete VS installations.
 * VS 2026 can be functional while vswhere marks it incomplete (isComplete: false).
 */
const fs = require('fs');
const path = require('path');

const vsInstallsPath = path.join(
  __dirname,
  '..',
  'node_modules',
  '@react-native-windows',
  'cli',
  'lib-commonjs',
  'utils',
  'vsInstalls.js',
);

const marker = "args.push('-all');";
const anchor = "    if (opts.requires) {";
const patch = `    // Include incomplete VS installs (e.g. VS 2026 canceled mid-setup but usable)\n    ${marker}\n    if (opts.requires) {`;

if (!fs.existsSync(vsInstallsPath)) {
  console.warn('vsInstalls.js not found; skipping VS detection patch.');
  process.exit(0);
}

const contents = fs.readFileSync(vsInstallsPath, 'utf8');
if (contents.includes(marker)) {
  process.exit(0);
}

if (!contents.includes(anchor)) {
  console.error('Could not find patch anchor in vsInstalls.js');
  process.exit(1);
}

fs.writeFileSync(vsInstallsPath, contents.replace(anchor, patch));
console.log('Patched VS detection for incomplete Visual Studio installations.');
