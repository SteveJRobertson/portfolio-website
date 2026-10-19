import path from 'node:path';
import type { Plugin } from 'vite';
import { IMAGES_DIR, PAGES_DIR, QUIZ_FILE, compilePageDir, compileQuizFile } from './pageFiles.ts';

const VIRTUAL_PAGES = 'virtual:pages';
const VIRTUAL_QUIZ = 'virtual:flummox';
const RESOLVED = new Map([VIRTUAL_PAGES, VIRTUAL_QUIZ].map((id) => [id, '\0' + id]));

/**
 * Compiles `src/content/pages/*.json` into `virtual:pages` (SPEC §7): validated,
 * and wrapped for 38 and 32 columns, with images from `src/content/images`
 * converted to mosaic cells (SPEC §8), so the app ships finished rows. The
 * Flummox! questions (`src/content/flummox/quiz.json`) become `virtual:flummox`
 * the same way. A content error fails the build, and shows the error overlay in dev.
 */
export const contentPlugin = (): Plugin => ({
  name: 'teletext-content',
  resolveId: (id) => RESOLVED.get(id),
  load(id) {
    if (id === RESOLVED.get(VIRTUAL_PAGES)) {
      const { pages, errors, files } = compilePageDir();
      files.forEach((file) => this.addWatchFile(file));
      if (errors.length) this.error(`Teletext content errors:\n${errors.map((e) => `  ${e}`).join('\n')}`);
      return `export const pages = ${JSON.stringify(pages)};`;
    }
    if (id === RESOLVED.get(VIRTUAL_QUIZ)) {
      const { quiz, errors, files } = compileQuizFile();
      files.forEach((file) => this.addWatchFile(file));
      if (errors.length) this.error(`Flummox! content errors:\n${errors.map((e) => `  ${e}`).join('\n')}`);
      return `export const quiz = ${JSON.stringify(quiz)};`;
    }
  },
  configureServer(server) {
    server.watcher.add([PAGES_DIR, IMAGES_DIR, QUIZ_FILE]);
    const reload = (file: string) => {
      const page = path.dirname(file) === PAGES_DIR && file.endsWith('.json');
      const image = path.dirname(file) === IMAGES_DIR && file.endsWith('.png');
      if (!page && !image && file !== QUIZ_FILE) return;
      for (const id of RESOLVED.values()) {
        const mod = server.moduleGraph.getModuleById(id);
        if (mod) server.moduleGraph.invalidateModule(mod);
      }
      server.ws.send({ type: 'full-reload' });
    };
    server.watcher.on('add', reload);
    server.watcher.on('change', reload);
    server.watcher.on('unlink', reload);
  },
});
