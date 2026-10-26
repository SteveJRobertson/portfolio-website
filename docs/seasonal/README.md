# Seasonal specials

A special, such as Halloween, is a dated file in `src/content/specials/`. It switches itself on for its dates and off again afterwards, so nothing needs merging or reverting on the day, and it stays in the repo for next year.

## What a special can change

- **Flummox! questions**: its own set of 12, in the same shape as `quiz.json`, with a new `edition` so it keeps its own best score. Without a `quiz`, the regular questions stay.
- **Felix's costume**: a name from `scripts/art/felix.mjs` (`halloween`: a witch's hat and a jack-o'-lantern). Portrait screens have no room for his hand, so they show the hat only.
- **Colours**: a costume can also recolour page 152 (`COSTUME_COLOURS` in `src/content/flummox/quiz.ts`). Halloween's adds orange and purple, which real Teletext never had: an orange logo (`flummox-logo-halloween.png`, from `scripts/art/logo.mjs`), purple lines, purple speech, orange highlights and a green title. The answer colours and the "Press red" bars never change, so they match the remote's keys. Pages can't use `{orange}` or `{purple}`: the validator keeps them to Teletext's eight colours.
- **Copy**: small changes to the pages, each a `find` and a `replace` in any page's text, such as the promo bar on pages 100, 200 and 400.

The rest of the site (About, Career, Projects, Skills, the colours) stays as it is, so the portfolio reads the same to anyone who lands on it.

```json
{
  "from": "2026-10-27",
  "until": "2026-10-31",
  "costume": "halloween",
  "copy": [{ "find": "PLAY FLUMMOX! THE QUIZ p152", "replace": "HALLOWEEN FLUMMOX! QUIZ p152" }],
  "quiz": { "edition": "Halloween 2026", "title": "HALLOWEEN SPECIAL", "greeting": "Happy Halloween! …", "…": "as quiz.json" }
}
```

- `from` and `until` are the first and last days it's on, in UK time. Two specials can't overlap.
- `quiz.title` is a line under the Flummox! logo on the intro; `quiz.greeting` is what Felix says before a first game. Both are optional, and `quiz.json` can use them too.
- **Link previews**: its own pictures in `public/share/NAME/`: `flummox.png` and `flummox-0.png` to `flummox-12.png` for page 152 and the score pages (with its title and Felix's costume), and `share.png`, a picture of page 100 with its copy changes, for every other page. While it's on, the pages' `og:image` tags point there. `npm run validate` fails if they're missing.

### Making a special's link previews

1. `npm run build-storybook && npm run share-images` draws every set of cards, the regular ones and each special's, and records what they were drawn from in each folder's `manifest.json` (a unit test fails when they're out of date). The "Update share images" workflow does the same in CI's Playwright image.
2. For `share.png`: `SEASON_DATE=2026-10-28 npm run build`, `npx vite preview`, then `npx tsx e2e/shareImage.ts http://localhost:4173/ public/share/halloween-2026/share.png`.

## How it switches

The site is static, so the build decides: it takes today's date in the UK and uses the special that's on, if any. `deploy.yml` builds and deploys main every night at 00:05 UTC (just after midnight in winter, just after 1am in summer), so a special goes live on its first day and is gone on the day after its last.

`npm run validate` checks every special, whatever the date: its dates, its questions on every screen, and that each copy change still matches a page.

## Trying one early

- **Any date**: `SEASON_DATE=2026-10-28 npm run build` builds the site as it will be on that day (or `npm run dev` the same way).
- **Previews**: Vercel previews and the dev server carry every special still to come, so `/152/?preview=halloween-2026` plays it (the file name without `.json`). The live site carries only what's on, so nobody can read the questions early.
- **Tests**: Vitest and Playwright build the site as on an ordinary day (`SEASON_DATE=2026-09-01`), so screenshots don't change while a special is on.

## Next year

Copy `halloween-2026.json` to `halloween-2027.json`, change the dates and `edition`, and swap the questions (or keep them). Old files can stay: a special whose dates have passed does nothing.
