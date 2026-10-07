# Specification: Flummox! (page 152)

**Owner**: Steve Robertson (Product Owner)
**Status**: Approved by Steve, 5 Oct 2026. Built 7 Oct 2026 on the `feature/flummox` branch (see PLAN.md, Delivery), to be released to main in one go when Steve is happy.
**Builds on**: the v1 spec in [archive/steevefax-v1/SPEC.md](../archive/steevefax-v1/SPEC.md). Section numbers like "v1 §5" point there.

---

## 1. Summary

Flummox! is a multiple-choice quiz on page 152, in the style of Channel 4's Teletext quiz Bamboozle! (1993 to 2009). The quizmaster is **Felix Flummox**, a mosaic cartoon 8 rows tall, drawn the way Bamber was: one face colour carved up by black lines (round glasses, a big grin), with flat colour for his green quiff, red bow tie and blue jacket. Like Bamber he raises a hand, a thumbs-up (an open hand when flummoxed), which makes him 16 cells wide; portrait screens use him without it (14 cells) so the speech bubble stays readable. Each question has four answers, one per Fastext colour, and you answer by pressing the coloured key. Get one wrong and you're **FLUMMOXED!**, sent back to the last checkpoint. You score a point for every question you get right first time, the site remembers your best score, and at the end you can share your score on the usual social networks.

The questions live in one content file in the repo, so Steve can change them by editing it and merging.

## 2. What Bamboozle! did, and what we keep

Sources are listed in §12.

| Bamboozle! | Flummox! |
|---|---|
| A quiz on Channel 4's Teletext service, hosted by a "virtual quizmaster", Bamber Boozler, drawn in block graphics. | Hosted by Felix Flummox, drawn as pixel art in mosaic cells (v1 §8). |
| Four answers per question, picked with the red, green, yellow and blue Fastext keys. | The same, with the site's fourth Fastext colour, cyan (v1 §5). `B` and `C` both answer cyan. |
| 12 to 25 questions a game over the years (25, then 20, 15 and finally 12). | 12 questions a game (§5). |
| A wrong answer meant you were "Bamboozled!" and sent back to a set point (in the early days, right back to question one), with Bamber turning yellow-faced. | A wrong answer shows FLUMMOXED! with Felix's face turned yellow, and sends you back to the last checkpoint. |
| Bamber's wife Bambette offered a consolation question. | Left out of the first version (open question Q4). |
| No score: you just tried to reach the end. | A score, which Steve asked for: a point for each question right at the first try (§6). |
| The questions were separate Teletext pages, so you could cheat by keying page numbers. | One page, 152, whose screens change with the game, so there's nothing to key (§7). |

## 3. Where it sits on the site

- **Page 152**, in the 1xx "about Steve" block, as Steve asked. Title "Flummox!", label `FLUMMOX`.
- Listed on the index (page 100) as `Flummox!.....152` under the other directory lines, and in the widescreen quick index.
- Its Fastext outside a question follows the site rule (red is Home), see §8.
- Banner: `FLUMMOX!` in block letters, white on a red band, the 1xx section colour (open question Q3).

## 4. Screens

The game is a small set of screens, all on page 152. Each is laid out like any other page (38 columns for widescreen and classic, 32 for portrait, at most 22 or 34 body rows).

| Screen | What it shows | Fastext |
|---|---|---|
| **Intro** | Banner, Felix (normal face) with a welcome beside him, the rules in three short lines, your best score if you have one, and "Press green to play". If a game is under way: "Press green to carry on from question N". | Home, Play, Restart (only when a game is under way, otherwise About), Contact |
| **Question** | Banner, `QUESTION 3 OF 12` and `SCORE 02` on one line, the question (beside a small Felix in wide modes, under him in portrait), then the four answers, each a line starting with a solid block in its key's colour, the answer in that colour. A hint row (screen only): "Press a coloured button to answer." | The four answer keys (§8) |
| **Correct** | Felix (normal) with Felix's line for that question (`quip`, or a stock line), "+1 POINT" when it counted, the score. | Home, Next, Restart, Contact |
| **Flummoxed** | `FLUMMOXED!` in double height, Felix with his yellow face, "Back to question N", the score. The right answer is not shown, as in Bamboozle! (open question Q5). | Home, Try again, Restart, Contact |
| **Checkpoint** | After questions 3, 6 and 9: "CHECKPOINT! You're safe at question 4". | Home, Next, Restart, Contact |
| **Finished** | Felix, "You beat Felix!", the final score out of 12 and a verdict line by score band, "NEW BEST!" when it is. | Home, Play again, Share, Contact |
| **Share** | "SHARE YOUR SCORE", the message that will be shared, then one line per network (§6, Sharing). | Home, Back, Copy, Contact |

Rough shape of a question at 40 × 24 (classic); widescreen is the same with the quick index beside it:

```
P152 STEEVEFAX 152       MON 05 OCT 10:14
 ▐█████ F L U M M O X ! ███████████████▌     ← banner, red band (3 rows)

 QUESTION 3 OF 12                SCORE 02

 ▗▄▄▖      Which channel carried
 ▐ ◕◕▌     Bamboozle!?
 ▐ ▀▀ ▌                                       ← Felix, about 8 × 6 cells
  ▀▀▀▀

 █ BBC One                                    ← red
 █ ITV                                        ← green
 █ Channel 4                                  ← yellow
 █ Channel 5                                  ← cyan

 Press a coloured button to answer.
   ████      ████       ████      ████        ← Fastext row
```

## 5. The game

- A game is the 12 questions in the content file, in file order, so everyone plays the same quiz (as with a Bamboozle! edition).
- **Checkpoints** after questions 3, 6 and 9, as on Bamboozle!. The game starts at question 1; once you pass question 3 you never go back further than question 4, and so on.
- **Right answer**: the Correct screen, then Next moves to the next question (or a checkpoint, or the end).
- **Wrong answer**: the Flummoxed screen, then Try again goes to the last checkpoint's first question. Questions you'd already passed are asked again.
- **No time limit** anywhere (WCAG 2.2.1), and nothing flashes (WCAG 2.3.1). Sub-page cycling and HOLD don't apply to 152.
- **Restart** starts from question 1 with a score of 0. It doesn't clear the best score.
- **Leaving and coming back**: keying another page mid-game is allowed (digits, the index, the remote). The game is kept for the rest of the visit, and the intro offers to carry on.

## 6. Scoring

- **A point for each question answered right at the first try** in this game. A question asked again after a checkpoint scores nothing if you'd already answered it, right or wrong. So 12 is a perfect game, and the score never goes down.
- The score is two digits, `SCORE 07`, in the question line and on every result screen.
- **Best score**: kept in `localStorage` (key `steevefax:flummox`), per edition, so a new set of questions starts a new best. It falls back to "no best" when storage is missing or throws, as the settings do (v1 §9).
- **Verdicts** on the Finished screen, by score band (wording in the content file so Steve can change it): 12 "Felix is utterly FLUMMOXED!", 9 to 11, 5 to 8, 0 to 4.
- The game in progress (question, checkpoint, score, which questions have been asked) is kept in `sessionStorage`, so a reload keeps your place but a new visit starts fresh.

### Sharing your score

Steve asked for a way to share your score on social media at the end of a game.

- **Share** on the Finished screen (yellow Fastext, or `Y`) offers it. On a device with a native share sheet (`navigator.share`, most phones and Safari), that opens with the message and link. Everywhere else, and when the sheet is cancelled or fails, the Share screen opens.
- **The message**: "I scored 9/12 on Flummox!, the Teletext quiz on STEEVEFAX page 152. Can you flummox Felix?", followed by the link to `/152/`. The wording is in `quiz.json` with a `{score}` placeholder so Steve can change it.
- **The Share screen** lists one network per line, drawn like the index's directory lines and clickable in the grid, each opening that network's own share page in a new tab with the message filled in:

  | Network | Share page | Carries the message? |
  |---|---|---|
  | Bluesky | `bsky.app/intent/compose?text=…` | Yes |
  | X | `x.com/intent/post?text=…&url=…` | Yes |
  | Threads | `threads.net/intent/post?text=…` | Yes |
  | Facebook | `facebook.com/sharer/sharer.php?u=…` | Link only |
  | LinkedIn | `linkedin.com/sharing/share-offsite/?url=…` | Link only |
  | WhatsApp | `wa.me/?text=…` | Yes |
  | Email | `mailto:?subject=…&body=…` | Yes |

  **Copy** (yellow Fastext, `Y`) copies the message and link to the clipboard and says "COPIED" on screen and in the live region; if the clipboard isn't available it says so and the message stays on screen to select.
- **The shared link is a score page**, `/152/score/9/`, so every network's preview shows the score, including Facebook and LinkedIn, which take only a link (Q7, agreed 5 Oct). See "Share images and link previews" below.
- **Privacy**: plain links only. No share buttons, scripts or tracking pixels from the networks are loaded, and nothing is sent anywhere until the visitor picks a network.
- **Accessibility**: in the mirror the Share screen is a heading, the message as a paragraph, and a list of real links named "Share on Bluesky (opens in a new tab)"; Copy is a button. The score in the message is the same number the Finished screen shows.
- **Icons**: each network's line starts with its icon from `src/icons` (`{icon:NAME}`); Threads got its own icon for this (7 Oct, Steve kept Threads in the list).
- **Save picture**: a last line on the Share screen downloads the score picture (below), for networks with no share link, such as Instagram. On a phone that can share files (`navigator.canShare({ files })`), a "Share picture" line opens the share sheet with the picture attached as well. The Share key itself sends the message and link only, because some apps drop the link when a picture is attached.

### Share images and link previews

Every network that shows a link preview (Bluesky, X, Threads, Facebook, LinkedIn, WhatsApp, iMessage, Slack, Discord) reads the same Open Graph tags, so one set of images covers them all.

**Images** (all 1200 × 630 PNG, the size every network above uses for a large preview, and under 300 KB each so WhatsApp shows them):

| Image | Used for | What it shows |
|---|---|---|
| `public/share/flummox.png` | `/152/`, when someone shares the page itself | The Flummox! intro: banner, Felix, "Can you flummox Felix?" |
| `public/share/flummox-0.png` to `flummox-12.png` | `/152/score/N/`, the link in every shared score | A score card (below) |
| `public/share.png` | Every other page | Unchanged |

**The score card** is a Teletext screen in widescreen mode (1200 × 630 is wider than 16:10, so it's 56 × 24), drawn by the real grid so it looks like the site:

```
P152 STEEVEFAX 152                         MON 05 OCT
 FLUMMOX!  banner, red band
                                      ┌──────────┐
  I SCORED                            │  Felix   │
   9 / 12      ← block letters        │ 12 × 9   │
                                      └──────────┘
  Felix is impressed. Nearly perfect.  ← the verdict

  Can you flummox Felix? Key 152 on STEEVEFAX
```

- The score is in block letters, the biggest thing on the card. Felix is in the mood that matches: the yellow "flummoxed" face for 9 and over (you beat him), his normal face otherwise.
- Everything that matters sits in the middle 630 × 630, because WhatsApp and some chat apps crop the preview to a square.
- No quick index, remote or CRT effect on the card. The header shows the date but not the time, so the 13 cards don't go stale by the minute.
- The block font needs a `/` glyph for "9/12".

**Score pages** (`/152/score/0/` to `/152/score/12/`): pre-rendered pages that only exist for link previews.

- Each has its own title ("I scored 9/12 on Flummox!"), description (the verdict, then "Can you flummox Felix?"), `og:image` (its card), `og:image:alt` ("A Teletext screen: Flummox! score 9 out of 12, with Felix Flummox looking flummoxed.") and `og:url` set to the score page itself. If `og:url` pointed at `/152/`, Facebook and LinkedIn would fetch that page's tags instead and lose the score.
- `<link rel="canonical">` points at `/152/`, and the pages carry `noindex`, so search engines list only /152/.
- A visitor who opens one is sent on to `/152/` by the app (a `replace`, so Back doesn't loop). There is no meta refresh, because some crawlers would follow it and read /152/'s tags. Without JavaScript the page shows the score and a link to /152/.
- The router treats `/152/score/N/` as page 152; any other path under /152/ goes to 404 as now.

**Per-page alt text**: `og:image:alt` is hard-coded to the index picture today. It becomes per page: the index text for the existing pages, and the texts above for /152/ and the score pages. `twitter:card` stays `summary_large_image` on all of them.

**How the images are made**: a Storybook story renders each card and the intro, and `npm run share-images` captures them with Playwright, as `e2e/shareImage.ts` does for `public/share.png` now. They are committed, and made in CI's Playwright image by an "Update share images" workflow (the baseline workflow's twin) so the font matches. A Vitest check stores a hash of what the cards are made from (the verdicts, Felix's PNGs, the card layout) and fails with "run Update share images" when they change, so a verdict edit can't leave old wording in the previews.

**Checking the previews**: GitHub Pages is the only place crawlers can reach them, so they're checked after the first deploy with Facebook's Sharing Debugger, LinkedIn's Post Inspector and by posting a test link to Bluesky. LinkedIn keeps a preview for about a week, and the Post Inspector is how to refresh it.

## 7. Question content file

`src/content/flummox/quiz.json`, compiled and checked at build time by the same content plugin as the pages (v1 §7), so a bad edit fails the build rather than the live site.

```json
{
  "edition": "Autumn 2026",
  "checkpoints": [3, 6, 9],
  "share": "I scored {score}/12 on Flummox!, the Teletext quiz on STEEVEFAX page 152. Can you flummox Felix?",
  "verdicts": [
    { "min": 12, "text": "Felix is utterly FLUMMOXED! A perfect game." },
    { "min": 9, "text": "Felix is impressed. Nearly perfect." },
    { "min": 5, "text": "Not bad. Felix has seen worse." },
    { "min": 0, "text": "Felix is not flummoxed in the slightest." }
  ],
  "questions": [
    {
      "question": "Which channel carried Bamboozle!?",
      "answers": ["BBC One", "ITV", "Channel 4", "Channel 5"],
      "correct": 2,
      "quip": "Right! Page 152 is the new 458."
    }
  ]
}
```

- `edition` names this set of questions; changing it starts a new best score.
- `answers` is red, green, yellow, cyan, in that order. `correct` is the index (0 to 3) of the right one.
- `share` is the message shared at the end; `{score}` is replaced with the final score.
- `quip` is optional; without it Felix uses a stock line.
- Questions and answers are plain text; colour tags are allowed in questions but not links.

**Validation** (`npm run validate` and every build). The build fails when:

1. there aren't exactly 12 questions, or a checkpoint isn't between 1 and 11;
2. a question doesn't have exactly four answers, two answers are the same, or `correct` isn't 0 to 3;
3. an answer is longer than one line at 32 columns after its colour block (28 characters);
4. any screen made from a question is wider or taller than the grid allows in any mode (the same checks as pages);
5. a verdict band is missing for some score from 0 to 12;
6. an unknown key or tag is used.

**Updating the questions**: edit `quiz.json`, change `edition`, run `npm run validate`, open a PR, merge. Deploy runs as usual. The docs for this go in the README.

## 8. Fastext, keys and the remote

- **On a question**, the Fastext row is the four answer keys: each slot is a solid block in its colour (like the keys on a real remote), not a page label. They are buttons, not links, with accessible names such as "Red: BBC One".
- **Keys** `R`, `G`, `Y` and `B`/`C` answer the question instead of navigating. Off the question screen they work as everywhere else, with "Play", "Next", "Try again" and "Restart" as actions rather than page links.
- **Digits still navigate**, so keying 100 always leaves the game.
- **The remote handset**'s colour buttons follow the same rules: they answer on a question screen.
- **Answer lines in the grid** respond to a click or tap, as grid links do (v1 §5), but never take keyboard focus.
- With shortcuts switched off on 888, letter keys do nothing and the game is played with Tab and the buttons (§9).

## 9. Accessibility

Built on the semantic mirror and Text mode (v1 §9).

- **Mirror on a question**: `<h1>` Flummox!, `<h2>` "Question 3 of 12", a paragraph "Score: 2", the question as a paragraph, then the answers as a group of four `<button>`s named "Red: BBC One" and so on. Felix is an image with alt text ("Felix Flummox, the quizmaster, a cartoon in a bow tie"; his yellow face reads "…looking flummoxed").
- **Focus**: after an answer, focus moves to the result screen's heading ("Correct!" or "Flummoxed!") and the result is announced in the polite live region, e.g. "Correct! Score 3." On Next or Try again, focus moves to the new question's heading.
- **Focus twins**: while an answer button in the hidden mirror has keyboard focus, its answer line in the grid is outlined, as page links are now.
- **Text mode** shows the same mirror, so the game is fully playable there with the buttons.
- **Without JavaScript**, the pre-rendered /152/ page shows the intro and says the quiz needs JavaScript.
- **Colour is never the only cue**: every answer is named by its text as well as its colour, and the result screens say "Correct" or "Flummoxed" in words.
- Contrast: answer text uses the key colours on black, which already meet AA. The banner keeps white on red, as on 101 and 110.

## 10. Out of scope for this version

- A server, accounts or shared leaderboards. The site is static on GitHub Pages; scores stay in the browser.
- Timed questions.
- Shuffling the questions or the answers.
- More than one edition live at once, or picking questions at random from a pool.
- Sound.

## 11. Open questions for Steve

Each has a default the plan uses if you don't say otherwise.

| # | Question | Default |
|---|---|---|
| Q1 | Who writes the first 12 questions? | Claude drafts an edition themed on Teletext, 80s and 90s TV and the web, for you to edit before merge. No facts about you beyond the v1 content brief. |
| Q2 | Felix's look? | A cartoon about 8 × 6 cells (12 × 9 on the intro): round face, tufty hair, glasses and a red bow tie, plus a yellow-faced "flummoxed" version. Drawn as pixel art like the page 101 portrait. |
| Q3 | Banner colour? | White on red, the 1xx colour. |
| Q4 | Add a Bambette-style consolation question? | No, not in this version. |
| Q5 | Show the right answer after a wrong one? | No, as in Bamboozle!: you have to get it right next time round. |
| Q6 | List 152 on the index page and quick index? | Yes. |
| Q7 | Should link previews on Facebook and LinkedIn show the score? | **Agreed 5 Oct: yes**, with score pages and score cards. |
| Q8 | Which networks? | **Agreed 5 Oct**: Bluesky, X, Threads, Facebook, LinkedIn, WhatsApp and email, plus Copy and the phone's own share sheet. |

## 12. Sources

- Wikipedia, [Bamboozle!](https://en.wikipedia.org/wiki/Bamboozle!): Fastext answers from four, virtual host Bamber Boozler, try again after a wrong answer (early versions back to question one), 15 to 20 questions.
- [MobyGames](https://www.mobygames.com/game/98723/bamboozle/), [UKGameshows](https://www.ukgameshows.com/ukgs/Bamboozle!) and [Grokipedia](https://grokipedia.com/page/Bamboozle!) (as summarised by search): Channel 4 Teletext, 1993 to 2009; 25 questions, later 20, 15 and 12; a wrong answer sends you back to a set point with Bamber yellow-faced; Bambette's consolation question.

These came from search summaries; the sandbox couldn't open the pages themselves, so treat the details as approximate.

## 13. Decision log

| ID | Decision |
|---|---|
| FLX-001 | Flummox! lives on page 152 as one page whose screens follow the game, not one page per question. |
| FLX-002 | Questions are a JSON content file in the repo, validated at build time. Updating means editing the file and merging. |
| FLX-003 | Scores and the game in progress stay in the browser only (best score in `localStorage`, current game in `sessionStorage`). |
| FLX-004 | The fourth answer key is cyan, matching the site's Fastext, with `B` and `C` both accepted. |
| FLX-005 | Scoring: a point per question right at the first try; a wrong answer sends you back to the last checkpoint (after questions 3, 6 and 9, as on Bamboozle!; Steve chose this on 7 Oct 2026). |
| FLX-006 | Sharing uses the native share sheet where there is one, otherwise plain share links to each network and Copy. No third-party scripts. |
| FLX-007 | Shared links go to a pre-rendered score page (`/152/score/N/`) with its own 1200 × 630 score card, so every network's preview shows the score. Cards are drawn by the Teletext grid, captured by Playwright, committed, and checked for staleness in Vitest. |
| FLX-008 | 7 Oct: the screens follow the look of Channel 4's 1997 Bamboozle! pages (captures from the Teletext archive): a yellow mosaic logo, Felix on the right with a blue-on-white speech bubble, double-height answers beside colour blocks, "press any colour to continue", and red to start. |
| FLX-009 | 7 Oct: Felix is drawn the way Bamber was, one face colour carved up by black lines, 8 rows tall, with a raised hand (thumbs-up, or an open hand when flummoxed). Portrait screens show him without the hand so the bubble stays readable. |
| FLX-010 | 7 Oct: all Flummox! work goes to the long-lived `feature/flummox` branch and reaches main as one release; Vercel previews stand in for the live site until then. |
