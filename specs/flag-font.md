# Flags show on every device, Windows included

- **Status:** ready to build
- **Size:** one pull request.
- **Touches:** the `@font-face` block and the `font-family` stacks at the top of src/carreau.html, a new font file in src/fonts (and wherever the build copies fonts), public/sw.js (only if fonts are listed there), and a credit line on public/privacy.html.
- **Depends on:** none

## Why

For the 2026 World Championships mirror, Sam wants each nation's flag shown. Teams will be named with the flag emoji first, e.g. "🇮🇹 Italy (ITA)", so the flag appears everywhere a name does: Draw & results, standings, brackets, the big screen, the stream overlay and Pick the Winner.

iPhone, Android and Mac show these flags. **Windows doesn't**: it shows the two letters "IT" instead, so spectators and organisers on Windows PCs see letters, not flags.

## What changes

- Bundle the "Twemoji Country Flags" web font: the woff2 from the npm package `country-flag-emoji-polyfill`. Copy the file into src/fonts. Don't add a runtime dependency or a CDN.
- Add an `@font-face` for it with a `unicode-range` that covers only flag characters:
  - regional indicators U+1F1E6–1F1FF
  - the black flag U+1F3F4
  - tag characters U+E0062–E007F, for England, if the font has it
- Put it **first** in every `font-family` stack (body, condensed headings, the stream overlay), so it applies to flags only and every other character falls through to Barlow as now.
- Because of the `unicode-range`, browsers fetch the font only on pages that show a flag.
- On public/privacy.html, add a line in the credits / third-party section: **Flag pictures: Twemoji, licensed under CC-BY 4.0.** Copy the exact attribution from the package's licence file if it asks for different wording.

## Not changing

- Team names, matching, or anything saved.

## Data and rules

None.

## New text

- Flag pictures: Twemoji, licensed under CC-BY 4.0.

## Acceptance checks

Extend an existing app test, or add `tests/app-flags.js`. It prints:
- `flag font face: Twemoji Country Flags`
- `flag font used for 🇮🇹: true` (`document.fonts.check('16px "Twemoji Country Flags"', '🇮🇹')` after `document.fonts.load`)
- `latin text still Barlow: true`
- `errs []`

## Notes for the builder

- Check whether the font includes England (🏴 plus tag characters). If it doesn't, say so in the pull request; that flag will show natively on phones and Macs only.
- Check `scripts/build.py` copies the new font into `dist/`, and that the minifier leaves the `unicode-range` alone.
- Look at a screenshot of a draw with "🇮🇹 Italy (ITA)" v "🇨🇦 Canada (CAN)" at 390 px. Flags should sit on the text line and not change the row height noticeably.

## Open questions

None.
