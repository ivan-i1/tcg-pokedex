#!/usr/bin/env node
// Gives a copy of Base App its own identity in one step.
//
//   npm run rename -- "Laberinto de Bolita" [--namespace io.github.ivan_i1]
//
// Rewrites app.json (name, slug, scheme, android.package, ios.bundleIdentifier) and
// resets the version to 0.1.0 / versionCode 1. The AsyncStorage key prefix follows
// the slug at runtime (src/core/storage/keys.ts), so it changes too.
// A new app must ALSO get its own upload keystore — see README "Release signing".

const fs = require('fs');
const path = require('path');

const DEFAULT_NAMESPACE = 'io.github.ivan_i1';

const ascii = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '');
const words = (s) => ascii(s).toLowerCase().match(/[a-z0-9]+/g) ?? [];

/** Store-safe identifiers derived from a display name. */
function identityFor(displayName, namespace = DEFAULT_NAMESPACE) {
  const w = words(displayName);
  if (w.length === 0) throw new Error(`Cannot derive identifiers from "${displayName}"`);
  const startsWithDigit = /^[0-9]/.test(w[0]);
  const slug = w.join('-');
  // Android package segments must start with a letter and use [a-z0-9_].
  const androidSegment = (startsWithDigit ? ['app', ...w] : w).join('_');
  const scheme = (startsWithDigit ? 'app' : '') + w.join('');
  return {
    name: displayName.trim(),
    slug,
    scheme,
    androidPackage: `${namespace}.${androidSegment}`,
    // Bundle ids use hyphens where Android packages use underscores.
    iosBundleId: `${namespace.replace(/_/g, '-')}.${slug}`,
    storagePrefix: `@${slug}`,
  };
}

function main(argv) {
  let namespace = DEFAULT_NAMESPACE;
  const positional = [];
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--namespace') namespace = argv[++i];
    else positional.push(argv[i]);
  }
  const name = positional[0];
  if (!name) {
    console.error('Usage: npm run rename -- "My App Name" [--namespace io.github.you]');
    process.exit(1);
  }
  const id = identityFor(name, namespace);
  const file = path.join(__dirname, '..', 'app.json');
  const config = JSON.parse(fs.readFileSync(file, 'utf8'));
  const e = config.expo;
  e.name = id.name;
  e.slug = id.slug;
  e.scheme = id.scheme;
  e.version = '0.1.0';
  e.ios = { ...e.ios, bundleIdentifier: id.iosBundleId, buildNumber: '1' };
  e.android = { ...e.android, package: id.androidPackage, versionCode: 1 };
  fs.writeFileSync(file, JSON.stringify(config, null, 2) + '\n');
  console.log(JSON.stringify(id, null, 2));
  console.log('\napp.json updated. Next: replace assets/source/icon.png, run `npm run icons`, create a new keystore.');
}

module.exports = { identityFor };
if (require.main === module) main(process.argv.slice(2));
