#!/usr/bin/env node
// Every icon / splash / favicon the app and stores need, from one or two source images.
//
//   assets/source/icon.png        REQUIRED  square artwork, ≥1024 px, full bleed (no transparency
//                                           needed). Used for the iOS/legacy icon and the favicon.
//   assets/source/foreground.png  optional  the glyph on transparency, for Android adaptive icons
//                                           and the splash. Falls back to icon.png.
//
// Writes assets/images/* (referenced by app.json) and assets/store/play-icon-512.png.
// Background colours come from app.json. Requires ImageMagick 7 (`brew install imagemagick`).
// Then rebuild native projects: `npm run prebuild` (icons are baked in at prebuild time).
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = (f) => join(root, 'assets/source', f);
const out = (f) => join(root, 'assets', f);
const icon = src('icon.png');
const fg = existsSync(src('foreground.png')) ? src('foreground.png') : icon;
if (!existsSync(icon)) {
  console.error('Missing assets/source/icon.png (square, ≥1024 px).');
  process.exit(1);
}

const expo = JSON.parse(readFileSync(join(root, 'app.json'), 'utf8')).expo;
const adaptiveBg = expo.android?.adaptiveIcon?.backgroundColor ?? '#FFFFFF';

const magick = (...args) => execFileSync('magick', args, { stdio: 'inherit' });
mkdirSync(out('images'), { recursive: true });
mkdirSync(out('store'), { recursive: true });

// iOS / legacy Android icon: opaque, full bleed (iOS rejects alpha in the app icon).
magick(icon, '-resize', '1024x1024^', '-gravity', 'center', '-extent', '1024x1024', '-background', adaptiveBg, '-alpha', 'remove', '-alpha', 'off', out('images/icon.png'));
// Play listing icon.
magick(out('images/icon.png'), '-resize', '512x512', out('store/play-icon-512.png'));
// Android adaptive foreground: launchers mask to the centre ~66%, so shrink into the safe zone.
magick('-size', '1024x1024', 'xc:none', '(', fg, '-resize', '660x660', ')', '-gravity', 'center', '-composite', out('images/android-icon-foreground.png'));
magick('-size', '1024x1024', `xc:${adaptiveBg}`, out('images/android-icon-background.png'));
// Themed (monochrome) icon for Android 13+: the foreground's silhouette in white.
magick(out('images/android-icon-foreground.png'), '-alpha', 'extract', '-background', 'white', '-alpha', 'shape', out('images/android-icon-monochrome.png'));
// Splash image (shown centred on the splash background colour from app.json).
magick(fg, '-resize', '1024x1024', '-background', 'none', '-gravity', 'center', '-extent', '1024x1024', out('images/splash-icon.png'));
// Web favicon.
magick(out('images/icon.png'), '-resize', '48x48', out('images/favicon.png'));

console.log('Icons written to assets/images and assets/store. Run `npm run prebuild` before the next native build.');
