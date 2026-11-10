import { chmod, copyFile, mkdir, rm } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// Browser runtime assets only. Never publish a checkout or recursively copy dist.
export const siteFiles = [
  'dist/somarkdown.umd.js',
  'dist/somarkdown.umd.min.js',
  'dist/somarkdown.css',
  'example/example_data.js',
  'example/browser/index.html',
  'example/browser/index.js',
  'example/browser/index.css',
  'example/browser/markdown-css/markdownhere.css',
];

export async function packageSite(root) {
  const output = resolve(root, 'site');
  await rm(output, { recursive: true, force: true });
  await mkdir(output);
  await chmod(output, 0o755);
  for (const file of siteFiles) {
    const destination = resolve(output, file);
    let directory = output;
    for (const part of file.split('/').slice(0, -1)) {
      directory = resolve(directory, part);
      await mkdir(directory, { recursive: true });
      await chmod(directory, 0o755);
    }
    await copyFile(resolve(root, file), destination);
    await chmod(destination, 0o644);
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await packageSite(fileURLToPath(new URL('../', import.meta.url)));
}
