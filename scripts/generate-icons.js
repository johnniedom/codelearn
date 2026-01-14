/**
 * Icon Generator for CodeLearn PWA
 *
 * This script generates PNG icons from SVG template.
 * Run: node scripts/generate-icons.js
 *
 * Note: Requires sharp package. Install with: pnpm add -D sharp
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(__dirname, '..', 'public');

// SVG template for icons
const createIconSVG = (size) => `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 512 512" fill="none">
  <rect width="512" height="512" rx="96" fill="#1E3A8A"/>
  <path d="M192 160L96 256L192 352" stroke="white" stroke-width="40" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M320 160L416 256L320 352" stroke="white" stroke-width="40" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M288 128L224 384" stroke="#60A5FA" stroke-width="32" stroke-linecap="round"/>
</svg>`;

// Apple touch icon (no rounded corners - iOS adds them)
const createAppleIconSVG = () => `<svg xmlns="http://www.w3.org/2000/svg" width="180" height="180" viewBox="0 0 180 180" fill="none">
  <rect width="180" height="180" fill="#1E3A8A"/>
  <path d="M67.5 56.25L33.75 90L67.5 123.75" stroke="white" stroke-width="14" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M112.5 56.25L146.25 90L112.5 123.75" stroke="white" stroke-width="14" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M101.25 45L78.75 135" stroke="#60A5FA" stroke-width="11.25" stroke-linecap="round"/>
</svg>`;

async function generateIcons() {
  try {
    // Try to import sharp
    const sharp = (await import('sharp')).default;

    console.log('Generating PWA icons...');

    // Generate 192x192 icon
    const svg192 = createIconSVG(192);
    await sharp(Buffer.from(svg192))
      .resize(192, 192)
      .png()
      .toFile(path.join(publicDir, 'pwa-192x192.png'));
    console.log('Created pwa-192x192.png');

    // Generate 512x512 icon
    const svg512 = createIconSVG(512);
    await sharp(Buffer.from(svg512))
      .resize(512, 512)
      .png()
      .toFile(path.join(publicDir, 'pwa-512x512.png'));
    console.log('Created pwa-512x512.png');

    // Generate apple-touch-icon (180x180)
    const svgApple = createAppleIconSVG();
    await sharp(Buffer.from(svgApple))
      .resize(180, 180)
      .png()
      .toFile(path.join(publicDir, 'apple-touch-icon.png'));
    console.log('Created apple-touch-icon.png');

    // Generate favicon PNGs
    const svg32 = createIconSVG(32);
    await sharp(Buffer.from(svg32))
      .resize(32, 32)
      .png()
      .toFile(path.join(publicDir, 'favicon-32x32.png'));
    console.log('Created favicon-32x32.png');

    const svg16 = createIconSVG(16);
    await sharp(Buffer.from(svg16))
      .resize(16, 16)
      .png()
      .toFile(path.join(publicDir, 'favicon-16x16.png'));
    console.log('Created favicon-16x16.png');

    console.log('\nAll icons generated successfully!');

  } catch (error) {
    if (error.code === 'ERR_MODULE_NOT_FOUND') {
      console.log('Sharp not installed. Installing...');
      console.log('Run: pnpm add -D sharp');
      console.log('Then run this script again: node scripts/generate-icons.js');

      // Write SVG files as fallback
      console.log('\nWriting SVG source files as fallback...');
      fs.writeFileSync(path.join(publicDir, 'icon-512.svg'), createIconSVG(512));
      fs.writeFileSync(path.join(publicDir, 'icon-apple.svg'), createAppleIconSVG());
      console.log('SVG files created. Use an online converter to create PNGs.');
    } else {
      console.error('Error generating icons:', error);
    }
  }
}

generateIcons();
