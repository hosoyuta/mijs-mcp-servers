// Script to create MCPB bundle manually (ZIP format with .mcpb extension)
import archiver from 'archiver';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const output = fs.createWriteStream(path.join(__dirname, 'j-quants.mcpb'));
const archive = archiver('zip', {
  zlib: { level: 9 } // Maximum compression
});

output.on('close', function() {
  console.log('MCPB bundle created successfully!');
  console.log(`Total bytes: ${archive.pointer()}`);
  console.log(`Output file: j-quants.mcpb`);
});

archive.on('error', function(err) {
  throw err;
});

archive.pipe(output);

// Add files to the archive
archive.file(path.join(__dirname, 'manifest.json'), { name: 'manifest.json' });
archive.file(path.join(__dirname, 'package.json'), { name: 'package.json' });
archive.file(path.join(__dirname, 'package-lock.json'), { name: 'package-lock.json' });
archive.file(path.join(__dirname, 'README.md'), { name: 'README.md' });

// Add directories
archive.directory(path.join(__dirname, 'dist'), 'dist');
archive.directory(path.join(__dirname, 'node_modules'), 'node_modules');
archive.directory(path.join(__dirname, 'docs'), 'docs');

archive.finalize();
