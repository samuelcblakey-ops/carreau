# Carreau Competition Desk

Petanque competition tool: Swiss, snake, barrage, leagues, inter-club, knockout, round robin, mêlée and precision shooting, with piste allocation, live scores and standings. Live at <https://snpetanque.com>.

## Layout

| Path | What it is |
|---|---|
| `src/carreau.html` | The app. Also runs on its own as the Claude artifact version. |
| `src/web-boot.js` | Website-only layer: Firebase storage, anonymous sign-in, admin back end (`#admin`). |
| `public/` | Static files copied into the site as-is (`firebase-config.js`, safe to publish). |
| `firestore.rules` | Who can read and change what. Deployed automatically. |
| `scripts/build.py` | Builds `dist/` (the website) from `src/` + `public/`. |
| `tests/` | Browser tests. `app-*` need nothing; `web-*` run against the Firebase emulators. |
| `tools/seedtests.js` | Builds the 48-team example competitions (paste into the browser console on the site). |

## How changes ship

1. **Make one small, self-contained change per branch.** For example "score keypad" or "archive button", not both. Small changes are easy to review and test, and easy to undo. Bigger work is planned as specs first (`specs/README.md`), one per pull request.
2. Commit on a branch, then run `scripts/ship.sh`. It pushes the branch, opens a pull request and asks GitHub to merge it when the tests pass.
3. **CI runs automatically** on the pull request in parallel jobs: the build and app tests, plus three jobs of web tests. A red ✗ means it won't merge.
4. **Merge to `main` = release.** Once the tests pass on `main`, GitHub Actions deploys the website to GitHub Pages and the security rules to Firebase. `scripts/ship.sh` waits for this and checks <https://snpetanque.com/build.txt> to confirm it's live. Nothing is uploaded by hand.
5. To roll back, revert the commit (`git revert <commit>` on a branch, then `scripts/ship.sh`). That ships the previous version through the same pipeline.

## Run it locally

```bash
scripts/setup.sh                 # packages, browser, build; says whether this copy can push to GitHub
node tests/run.js app melee      # one app test (by part of its name), with its pass/fail checks
scripts/check.sh                 # build + translation check + all app tests, 4 at a time (about 1½ minutes)
scripts/check.sh --web hall      # ... plus matching web tests on the Firebase emulators (needs Java)
npm test                         # everything, one test at a time (the full web suite takes about 15 minutes)
```

See `CLAUDE.md` for conventions (translations, Firestore shapes, tests) and the working loop.

## One-time settings (already done unless noted)

- **Settings → Pages → Source: GitHub Actions**, so Pages serves what the pipeline builds.
- **Settings → Secrets and variables → Actions → `FIREBASE_SERVICE_ACCOUNT`**: the JSON key of a Firebase service account with the *Firebase Rules Admin* role. Without it, the pipeline skips the rules deploy and warns.
- **Settings → Branches → protect `main`**: require the `test` check to pass before merging. (`test` is the job that waits for all the parallel test jobs.)
- **Settings → General → Pull Requests → Allow auto-merge** (optional): lets `scripts/ship.sh` hand a pull request to GitHub to merge by itself once the tests pass.

## Licence

© 2026 Sam Blakey · SN Pétanque Competition Desk. All rights reserved. See [LICENSE](LICENSE): the code may not be copied, modified or reused without written permission. Third-party parts (QR generator, fonts, Firebase SDK) keep their own licences.

The live site is built with the app code minified (`scripts/minify.js`); set `CARREAU_NO_MINIFY=1` when running `npm run build` to get a readable build for debugging.
