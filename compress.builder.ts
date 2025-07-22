import { brotliCompress, constants } from 'node:zlib';
import { promisify } from 'node:util';
import path from 'node:path';
import { Glob } from 'bun';

// --- CONFIGURATION ---
const srcDir = 'src';
const distDir = path.join(srcDir, 'dist');
const MIN_COMPRESSION_SIZE_BYTES = 2 * 1024; // 2 KB

const buildEntrypoints = {
  'js/modern/main.ts': 'js/modern/main.js',
  'js/legacy/main.ts': 'js/legacy/main.js',
  'css/styles.css': 'css/styles.css',
};

const staticFilesGlob = new Glob('{*.html,*.svg}');

// --- STYLING & HELPERS ---
const colors = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",

  title: Bun.color('#86EFAC', 'ansi'),      // Light Green
  header: Bun.color('#A5B4FC', 'ansi'),     // Light Indigo
  action: Bun.color('#FBBF24', 'ansi'),     // Amber (for skipping)
  filePath: Bun.color('#93C5FD', 'ansi'),   // Light Blue
  success: Bun.color('#34D399', 'ansi'),    // Green
  error: Bun.color('#F87171', 'ansi'),      // Red
  info: Bun.color('#E5E7EB', 'ansi'),       // Gray
};

function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

// --- BUILDER LOGIC ---

const brotliCompressAsync = promisify(brotliCompress);

/**
 * If the file is ≥ MIN_COMPRESSION_SIZE_BYTES, compresses it and writes <dest>.br.
 * Otherwise, the file is skipped entirely (nothing is written).
 * @param {string} relativeDestPath - The relative path of the file inside the 'dist' directory.
 * @param {ArrayBuffer} contentBuffer - The file content to process.
 */
async function processAndWriteFile(relativeDestPath, contentBuffer) {
  const finalDestPath = path.join(distDir, relativeDestPath);
  const originalSize = contentBuffer.byteLength;

  try {
    // Skip files under the compression threshold
    if (originalSize < MIN_COMPRESSION_SIZE_BYTES) {
      const sizeInfo = `(${formatBytes(originalSize)})`;
      console.log(
        `${colors.action}Skipped (below threshold):${colors.reset} ${colors.filePath}${relativeDestPath.padEnd(20)}${colors.reset} ${colors.info}${sizeInfo}${colors.reset}`
      );
      return;
    }

    // Compress files ≥ threshold
    const compressed = await brotliCompressAsync(contentBuffer, {
      params: {
        [constants.BROTLI_PARAM_QUALITY]: 11,
        [constants.BROTLI_PARAM_SIZE_HINT]: originalSize,
      },
    });

    const compressedSize = compressed.byteLength;
    const reduction = ((originalSize - compressedSize) / originalSize) * 100;

    await Bun.write(`${finalDestPath}.br`, compressed);

    const sizeInfo = `(${formatBytes(originalSize)} → ${formatBytes(compressedSize)}, ${reduction.toFixed(1)} % reduction)`;
    console.log(
      `${colors.success}Compressed:${colors.reset}            ${colors.filePath}${relativeDestPath.padEnd(20)}${colors.reset} ${colors.info}${sizeInfo}${colors.reset}`
    );
  } catch (error) {
    console.log(
      `${colors.error}Failed to process:${colors.reset}        ${colors.filePath}${relativeDestPath}${colors.reset}`
    );
    console.error(error);
  }
}

// --- EXECUTION ---

console.log(`\n${colors.title}${colors.bold}Starting Compression Builder (compressed files only)${colors.reset}`);
console.log(`  ${colors.header}Target directory:${colors.reset} ${colors.filePath}${distDir}${colors.reset}`);
console.log(`  ${colors.header}Min compression size:${colors.reset} ${colors.info}${formatBytes(MIN_COMPRESSION_SIZE_BYTES)}${colors.reset}`);

// 1. Process entrypoints with Bun.build
console.log(`\n${colors.header}${colors.bold}Phase 1: Bundling and minifying assets (JS/CSS)${colors.reset}`);
for (const [entry, output] of Object.entries(buildEntrypoints)) {
  const sourcePath = path.join(srcDir, entry);

  process.stdout.write(
    `${colors.action}Bundling:${colors.reset}             ${colors.filePath}${sourcePath}${colors.reset}… `
  );

  const buildResult = await Bun.build({
    entrypoints: [sourcePath],
    minify: true,
  });

  if (!buildResult.success || buildResult.outputs.length === 0) {
    console.log(`${colors.error}${colors.bold}Failed.${colors.reset}`);
    console.error(buildResult.logs.join('\n'));
    continue;
  }

  console.log(`${colors.success}${colors.bold}Done.${colors.reset}`);

  const artifact = buildResult.outputs[0];
  const content = await artifact.arrayBuffer();
  await processAndWriteFile(output, content);
}

// 2. Process other static files (HTML, SVG, etc.)
console.log(`\n${colors.header}${colors.bold}Phase 2: Processing static assets${colors.reset}`);
for await (const relativePath of staticFilesGlob.scan({ cwd: srcDir })) {
  const sourcePath = path.join(srcDir, relativePath);

  const file = Bun.file(sourcePath);
  const content = await file.arrayBuffer();
  await processAndWriteFile(relativePath, content);
}

console.log(`\n${colors.title}${colors.bold}Compression build process completed successfully.${colors.reset}\n`);
