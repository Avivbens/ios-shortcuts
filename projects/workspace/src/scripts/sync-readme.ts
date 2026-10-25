import { execFile } from 'node:child_process';
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { promisify } from 'node:util';
import { SHORTCUTS_MANIFEST_FILE, ShortcutsManifestSchema } from '@ios-shortcuts/builder';
import { logger, workspaceRoot } from '@nx/devkit';
import { replaceReadmeTable, toReadmeTable } from '../release/readme-table';
import { isAssetPublished } from '../release/release-assets';
import { README_FILE } from '../release/release.constants';
import { loadShortcutProjects } from '../release/shortcut-projects';
import { advanceManifest } from '../release/shortcuts-manifest';

const execFileAsync = promisify(execFile);

(async () => {
  const manifestPath = join(workspaceRoot, SHORTCUTS_MANIFEST_FILE);
  const readmePath = join(workspaceRoot, README_FILE);

  const shortcuts = await loadShortcutProjects();
  const current = ShortcutsManifestSchema.parse(JSON.parse(await readFile(manifestPath, 'utf8')));
  const { manifest, unpublished } = await advanceManifest(current, shortcuts, isAssetPublished);

  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  await writeFile(
    readmePath,
    replaceReadmeTable(await readFile(readmePath, 'utf8'), toReadmeTable(shortcuts, manifest)),
  );
  await execFileAsync('pnpm', ['exec', 'prettier', '--write', README_FILE, SHORTCUTS_MANIFEST_FILE], {
    cwd: workspaceRoot,
  });

  unpublished.forEach(({ name, version }) => {
    logger.warn(`${name} ${version} has no signed asset yet, so ${SHORTCUTS_MANIFEST_FILE} keeps its previous entry`);
  });
})();
