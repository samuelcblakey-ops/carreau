# Carreau Competition Desk

Petanque competition tool: Swiss, snake, barrage, leagues, knockout, round robin, mêlée and precision shooting, with piste allocation, live scores and standings. Live at <https://samuelcblakey-ops.github.io/carreau/>.

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

1. **Make one small, self-contained change per branch.** For example "score keypad" or "archive button", not both. Small changes are easy to review and test, and easy to undo.
2. Commit on a branch, push, and open a pull request (GitHub Desktop: *Branch → New branch*, then *Create Pull Request*).
3. **CI runs automatically** on the pull request: it builds the site and runs every test. A red ✗ means don't merge.
4. **Merge to `main` = release.** Once the tests pass on `main`, GitHub Actions deploys the website to GitHub Pages and the security rules to Firebase. Nothing is uploaded by hand.
5. To roll back, revert the commit (GitHub Desktop: *History → right-click → Revert*). That ships the previous version through the same pipeline.

## Run it locally

```bash
npm ci
npx playwright install chromium
npm test            # build + app tests + web tests (needs Java for the emulators)
npm run test:app    # quick: app tests only, no Java needed
```

## One-time settings (already done unless noted)

- **Settings → Pages → Source: GitHub Actions**, so Pages serves what the pipeline builds.
- **Settings → Secrets and variables → Actions → `FIREBASE_SERVICE_ACCOUNT`**: the JSON key of a Firebase service account with the *Firebase Rules Admin* role. Without it, the pipeline skips the rules deploy and warns.
- **Settings → Branches → protect `main`**: require the `test` check to pass before merging.
