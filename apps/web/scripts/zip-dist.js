#!/usr/bin/env node

import { zip } from 'zip-a-folder';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const distFolder = join(__dirname, '..', 'dist');
const zipFilePath = join(__dirname, '..', 'dist.zip');

console.log('Zipping distribution folder...');
console.log(`Source: ${distFolder}`);
console.log(`Target: ${zipFilePath}`);

try {
  await zip(distFolder, zipFilePath);
  console.log('✓ Successfully created dist.zip');
} catch (error) {
  console.error('✗ Failed to create zip:', error.message);
  process.exit(1);
}
