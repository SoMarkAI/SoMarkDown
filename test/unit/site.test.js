import { chmod, mkdtemp, mkdir, readFile, readdir, rm, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { packageSite, siteFiles } from '../../scripts/package-site.js';

let root;
beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), 'somarkdown-site-'));
  for (const file of [...siteFiles, '.git/config', '.env', 'src/core/config.js',
    'package.json', 'dist/somarkdown.umd.min.js.map', 'example/browser/.env',
    'example/browser/development.js', 'site/stale-secret']) {
    await mkdir(dirname(join(root, file)), { recursive: true });
    await writeFile(join(root, file), file);
    await chmod(join(root, file), 0o600);
  }
});
afterEach(async () => { await rm(root, { recursive: true, force: true }); });

async function files(directory, prefix = '') {
  const result = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const name = prefix + entry.name;
    if (entry.isDirectory()) result.push(...await files(join(directory, entry.name), name + '/'));
    else result.push(name);
  }
  return result.sort();
}

test('publishes exactly the required browser assets, with no stale or development files', async () => {
  await packageSite(root);
  expect(await files(join(root, 'site'))).toEqual([...siteFiles].sort());
  for (const file of siteFiles) {
    expect(await readFile(join(root, 'site', file), 'utf8')).toBe(file);
    expect((await stat(join(root, 'site', file))).mode & 0o777).toBe(0o644);
  }
  for (const directory of ['', 'dist', 'example', 'example/browser', 'example/browser/markdown-css']) {
    expect((await stat(join(root, 'site', directory))).mode & 0o777).toBe(0o755);
  }
  // Packaging a second release must remove files no longer in the manifest.
  await writeFile(join(root, 'site', 'obsolete.js'), 'old release');
  await packageSite(root);
  expect(await files(join(root, 'site'))).toEqual([...siteFiles].sort());
});

test('missing required browser assets fail the release instead of producing a broken site', async () => {
  await rm(join(root, 'example/browser/index.js'));
  await expect(packageSite(root)).rejects.toThrow();
});
