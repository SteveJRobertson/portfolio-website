import path from 'node:path';
import type { Plugin } from 'vite';
import { currentAndUpcoming } from '../../src/content/specials.ts';
import type { CompiledQuiz } from '../../src/content/flummox/types.ts';
import {
  IMAGES_DIR,
  PAGES_DIR,
  QUIZ_FILE,
  SPECIALS_DIR,
  compilePageDir,
  compileQuizFile,
  compileSpecialQuiz,
  readSpecialsDir,
  seasonDate,
  specialForBuild,
} from './pageFiles.ts';

const VIRTUAL_PAGES = 'virtual:pages';
const VIRTUAL_QUIZ = 'virtual:flummox';
const VIRTUAL_CARDS = 'virtual:flummox-cards';
const RESOLVED = new Map([VIRTUAL_PAGES, VIRTUAL_QUIZ, VIRTUAL_CARDS].map((id) => [id, '\0' + id]));

/**
 * Compiles `src/content/pages/*.json` into `virtual:pages` (SPEC §7): validated,
 * and wrapped for 38 and 32 columns, with images from `src/content/images`
 * converted to mosaic cells (SPEC §8), so the app ships finished rows. The
 * Flummox! questions (`src/content/flummox/quiz.json`) become `virtual:flummox`
 * the same way. A dated special (`src/content/specials`) that's on for the
 * build's date changes both (docs/seasonal/README.md). A content error fails
 * the build, and shows the error overlay in dev.
 *
 * Preview builds (Vercel's, and the dev server) also carry every special
 * still to come, so `/152/?preview=NAME` plays one before its dates.
 */
export const contentPlugin = (): Plugin => {
  let serving = false;
  return {
    name: 'teletext-content',
    configResolved(config) {
      serving = config.command === 'serve';
    },
    resolveId: (id) => RESOLVED.get(id),
    load(id) {
      if (id === RESOLVED.get(VIRTUAL_PAGES)) {
        const { special, errors: specialErrors, files: specialFiles } = specialForBuild();
        const { pages, errors, files } = compilePageDir(PAGES_DIR, IMAGES_DIR, special);
        [...files, ...specialFiles].forEach((file) => this.addWatchFile(file));
        const all = [...specialErrors, ...errors];
        if (all.length) this.error(`Teletext content errors:\n${all.map((e) => `  ${e}`).join('\n')}`);
        return `export const pages = ${JSON.stringify(pages)};`;
      }
      if (id === RESOLVED.get(VIRTUAL_QUIZ)) {
        const regular = compileQuizFile();
        const { specials, special, errors: specialErrors, files: specialFiles } = specialForBuild();
        [...regular.files, ...specialFiles].forEach((file) => this.addWatchFile(file));
        const errors = [...regular.errors, ...specialErrors];
        const forSpecial = (s: (typeof specials)[number]) => {
          const compiled = compileSpecialQuiz(s, regular.quiz!);
          errors.push(...compiled.errors);
          return compiled.quiz;
        };
        const quiz = regular.quiz && (special ? forSpecial(special) : regular.quiz);
        const previews: Record<string, CompiledQuiz | undefined> = {};
        if (regular.quiz && (serving || process.env.VERCEL_ENV === 'preview')) {
          for (const s of currentAndUpcoming(specials, seasonDate())) previews[s.name] = s === special ? quiz : forSpecial(s);
        }
        if (errors.length) this.error(`Flummox! content errors:\n${errors.map((e) => `  ${e}`).join('\n')}`);
        return [
          `export const quiz = ${JSON.stringify(quiz)};`,
          `export const previews = ${JSON.stringify(previews)};`,
          `export const special = ${JSON.stringify(special?.name ?? null)};`,
        ].join('\n');
      }
      if (id === RESOLVED.get(VIRTUAL_CARDS)) {
        // Every special's link-preview cards, for the Flummox/Card story that npm run share-images captures
        const regular = compileQuizFile();
        const { specials, errors: specialErrors, files: specialFiles } = readSpecialsDir();
        [...regular.files, ...specialFiles].forEach((file) => this.addWatchFile(file));
        const errors = [...regular.errors, ...specialErrors];
        const bySpecial: Record<string, CompiledQuiz['cards']> = {};
        for (const s of specials) {
          const compiled = compileSpecialQuiz(s, regular.quiz!);
          errors.push(...compiled.errors);
          if (compiled.quiz) bySpecial[s.name] = compiled.quiz.cards;
        }
        if (errors.length) this.error(`Flummox! content errors:\n${errors.map((e) => `  ${e}`).join('\n')}`);
        return `export const cards = ${JSON.stringify(regular.quiz!.cards)};\nexport const specialCards = ${JSON.stringify(bySpecial)};`;
      }
    },
    configureServer(server) {
      server.watcher.add([PAGES_DIR, IMAGES_DIR, QUIZ_FILE, SPECIALS_DIR]);
      const reload = (file: string) => {
        const page = path.dirname(file) === PAGES_DIR && file.endsWith('.json');
        const image = path.dirname(file) === IMAGES_DIR && file.endsWith('.png');
        const special = path.dirname(file) === SPECIALS_DIR && file.endsWith('.json');
        if (!page && !image && !special && file !== QUIZ_FILE) return;
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
  };
};
