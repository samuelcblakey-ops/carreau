# SN Pétanque · Competition desk (repo: carreau)

Pétanque competition tool, live at https://snpetanque.com: draws, pistes, live scores, standings, streams.

| Path | What |
|---|---|
| `src/carreau.html` | The whole app in one file (~1.2 MB). Also runs on its own as the Claude artifact version. |
| `src/web-boot.js` | Website-only layer: Firebase storage, anonymous sign-in, organiser login, admin (`#admin`). |
| `firestore.rules` | Who can read and change what. **Deployed to production on merge.** |
| `scripts/build.py` | Builds `dist/` (minified page, one file per language, `build.txt` = commit). |
| `tests/` | `app-*.js` open `src/carreau.html` from disk; `web-*.js` run the built site on the Firebase emulators. |
| `specs/` | What to build next, one file per pull request. See `specs/README.md`. |

## Start of a session

Code sessions run in Claude Code (the Code tab, claude.ai/code) with `samuelcblakey-ops/carreau` picked under Repo, so the repo is already cloned and the session can push, open and merge pull requests. Cowork sessions can't push; they're for planning and notes.

```bash
scripts/setup.sh      # packages, browser, build; says whether this session can push
```

## The loop

1. **Branch**: `git switch -c <short-name> origin/main`. For a spec, name the branch after it (`specs/score-keypad.md` → `score-keypad`). One small change per branch: if its title needs "and", split it.
2. **Find the code without flooding your context.** Never read `src/carreau.html` whole. Lines 649 to 1184 are the translation tables, with lines up to 68,000 characters long. Search like this: `grep -n "function renderEntries" src/carreau.html | cut -c1-200`. Then read a range with offset and limit.
3. **Test as you go**:
   - `node tests/run.js app <name>`: one test with its real pass/fail checks, in a few seconds.
   - `scripts/check.sh [names]`: build, translation check and app tests (4 at a time, about 1½ minutes).
   - `scripts/check.sh --web <name>`: also the web tests whose names match. Use this for anything that touches Firebase, rules, sign-in or what gets saved.
4. **Look at it.** Tests save screenshots in `test-results/*.png`. Open them and check the screen at phone width (390 px) and on desktop before you ship.
5. **Ship**: commit, then run `scripts/ship.sh`. It rebases on main, pushes, opens the pull request (or updates the open one), waits for CI and merges it once every check passes. Then it waits for the deploy and confirms snpetanque.com is serving it. Shipping is approved when the task says "ship it".

## Rules that have bitten before

- **Firestore can't store an array directly inside an array.** Save lists of objects instead, e.g. `t.clubFix = [{ id, a, b, day }]` (the inter-club draw didn't save until #34). App tests now fail with "Firestore can't save an array inside an array: <path>".
- **Every new visible English text needs all 8 languages**: English, plus French in `FR_TEXT`, plus es, it, de, nl, pt and th in `LANG_TEXT`.
  - Add one `Object.assign(LANG_TEXT.xx, { ... })` line per language, next to the block for the same feature, so that parallel branches don't edit the same lines.
  - Use each country's pétanque terms.
  - In keys, `{n}` stands for a number and `{x}` for any text.
  - Wrap names and codes that must stay as they are in an element with `data-notr`.
  - `node scripts/i18n-check.js` lists anything missing; `check.sh` runs it.
- **Wording**: pistes (not courts), mènes, organiser, Barrage (the group stage), Draw & results.
- **Roles**: organisers run and archive their competitions; only the admin deletes. Players and spectators see the draw and results only.
- **Phones first**: controls at least 44 px, text boxes 16 px (no iPhone zoom), 390 px wide with no sideways scrolling.
- **Rules changes** go live on merge. Cover each one with a web test that tries both what's allowed and what's denied.
- **Tests print what they saw.** Each `tests/<file>.js` prints lines, and `tests/run.js` lists the regexes those lines must match. New behaviour means a new printed line plus a new regex. Keep `errs []` (no page errors).
- **Keep these lines as they are**: "In loving memory of Steve Noel" and the © 2026 Sam Blakey lines.
- **Known flake**: `web-offline.js` on a slow CI runner. The runner retries a failing test once and reports "passed on retry".
- **main is protected**: the `test` check must pass and everything goes through a pull request. Never push to main.
- **Readable build**: `dist/` is minified. `CARREAU_NO_MINIFY=1 npm run build` gives a readable one for debugging.

## Specs and parallel sessions

- Work usually arrives as `specs/<short-name>.md`, already on main (specs are shipped there through a normal pull request). Build it on a branch named `<short-name>`.
- Build what the spec says. If it's unclear or seems wrong, stop and ask rather than guess.
- Other sessions may be building other specs at the same time, each in its own copy. Keep to your spec's area, and expect `scripts/ship.sh` to rebase you onto their work.
- If the rebase stops on a conflict in the translation tables, keep both sides.

## When you finish

Say what changed, link the pull request, list what you checked (tests run, screenshots looked at), and mention anything you noticed but left alone.
