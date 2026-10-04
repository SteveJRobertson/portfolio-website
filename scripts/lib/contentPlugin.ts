import path from 'node:path';
import type { Plugin } from 'vite';
import { PAGES_DIR, compilePageDir } from './pageFiles.ts';

const VIRTUAL_ID = 'virtual:pages';
const RESOLVED_ID = '\0' + VIRTUAL_ID;

/**
 * Compiles `src/content/pages/*.json` into `virtual:pages` (SPEC §7): validated,
 * and wrapped for 38 and 20 columns, so the app ships finished rows. A content
 * error fails the build, and shows the error overlay in dev.
 */
export const contentPlugin = (): Plugin => ({
  name: 'teletext-content',
  resolveId: (id) => (id === VIRTUAL_ID ? RESOLVED_ID : undefined),
  load(id) {
    if (id !== RESOLVED_ID) return;
    const { pages, errors, files } = compilePageDir();
    files.forEach((file) => this.addWatchFile(file));
    if (errors.length) this.error(`Teletext content errors:\n${errors.map((e) => `  ${e}`).join('\n')}`);
    return `export const pages = ${JSON.stringify(pages)};`;
  },
  configureServer(server) {
    server.watcher.add(PAGES_DIR);
    const reload = (file: string) => {
      if (path.dirname(file) !== PAGES_DIR || !file.endsWith('.json')) return;
      const mod = server.moduleGraph.getModuleById(RESOLVED_ID);
      if (mod) server.moduleGraph.invalidateModule(mod);
      server.ws.send({ type: 'full-reload' });
    };
    server.watcher.on('add', reload);
    server.watcher.on('change', reload);
    server.watcher.on('unlink', reload);
  },
});
