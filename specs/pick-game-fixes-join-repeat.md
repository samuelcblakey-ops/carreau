# Pick the Winner fixes: a team can't be saved twice, and Join works first tap

- **Status:** ready to build (urgent: the World Championships game is live and people are joining)
- **Size:** one pull request.
- **Touches:**
  - `pickAction` (`pk-save` and `pk-join`) and the join form and round cards in `renderPickPage`
  - the global `focusout` handler, i.e. the `S.pendingRender` deferred render, in src/carreau.html
- **Depends on:** none

## Why

Sam found two problems on his phone on the live game (snpetanque.com/#tkpo1655):

1. **The same team saved in two rounds.**
   - Pick a team in Round 1's select and the same team in Round 2's select, then press Save pick on each. Both save.
   - The cause: `pk-save` never checks the team against the player's other rounds. The "(picked in …)" disabling only covers teams already *saved* when the card was drawn.
   - Also, `U.sel[r]` keeps a now-disabled team selected after the re-render, so the second Save still sends it.
   - Scoring ignores repeats, but players must never be able to save one.
2. **"Join the game" didn't work when tapped on his phone.**
   - It works in Chromium tests, including with a live update arriving while the name box has focus. But the page defers renders while an input has focus (`drawPage` sets `S.pendingRender`), and the `focusout` handler then renders on `setTimeout(0)`.
   - On a phone, tapping the button blurs the input first. If a render was pending, the page is redrawn between the tap starting and the click event. The button the tap began on is replaced, so the click lands on nothing.
   - That would explain a tap that only works the second time, on iPhone Safari especially. The same thing can swallow taps on any button straight after typing (organiser forms too).

## What changes

### Picks (everyone who has joined)

- **Save pick** refuses a team that this player has already saved in another round. Nothing is saved, and the card shows **You've already picked {x} in {x}.** (team name, round name).
- When a card is drawn and its select's remembered choice (`U.sel`) is a team now used in another round, the select resets to "—".
- A saved pick that repeats a team saved in an *earlier* round can still exist (Sam's test picks, or older picks). Its card shows, in the warning colour: **{x} was already your pick in {x}, so this pick won't count. Pick another team.** It shows only while the round is open.

### Joining

- The name box and the button become a form. Pressing Go / Enter on the phone keyboard joins, the same as tapping **Join the game**.
- **A tap on a button right after typing works first time, anywhere in the app:**
  - When a `pointerdown` lands on a `button`, `[data-act]` or `a[href]` inside #main, remember it (`S.tapAt = Date.now()`).
  - The `focusout` handler doesn't render while a tap is in progress (within about 600 ms of that `pointerdown`). The click handler's own render takes care of it, and a fallback timer renders after the tap if no click came.
  - Keep today's behaviour otherwise: renders are still deferred while typing.

## Not changing

- Rules, data, scoring, the leaderboard.

## Data and rules

None.

## New text

- You've already picked {x} in {x}.
- {x} was already your pick in {x}, so this pick won't count. Pick another team.

## Acceptance checks

App test (extend `tests/app-pick-setup.js`). It prints:
- `same team two selects: second save refused | You've already picked 🇮🇹 Italy (ITA) in Round 1.`
- `remembered choice reset: —`
- `old repeat warning: 🇮🇹 Italy (ITA) was already your pick in Round 1, so this pick won't count. Pick another team.`
- `join with Enter: joined`
- `join tap with pending render: joined first tap`
  - Simulate it: focus #pk-you, type a name, force a render so `S.pendingRender` is true, dispatch `pointerdown` on the Join button, blur the input, let timers run, then click *that same* button element.
  - It must join, and the button element must still be in the document at click time.
- `tap after typing elsewhere: Save round still works first tap` (one organiser form, as a regression check for the global change)
- `errs []`

Run the whole app suite: the `focusout` change is global.

## Notes for the builder

- `pickAction` `pk-save`: build `used` from `st.picks` (other rounds) the same way `renderPickPage` does.
- Look at a phone-size screenshot of a card with the repeat warning.

## Open questions

None.
