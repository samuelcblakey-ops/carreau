# Visitors don't see organiser wording on Draw & results (empty draw, round progress box, pistes switched off)

- **Status:** ready to build
- **Size:** one pull request.
- **Touches:**
  - in src/carreau.html: the empty-draw panel at the top of `renderDrawPage` (the "{n} teams entered · {system} · {n} pistes" line and "Add at least {n} … on Registration before drawing.")
  - the round progress panels with `rp-live` / `rp-ready` (Swiss/round-robin and the mêlée-in-advance one)
  - the game card's `label` ("Waiting for piste")
  - `renderEvent`
  - src/events/worlds2026.json (one new optional field)
- **Depends on:** specs/event-page.md and specs/event-page-share.md (merged, #194 and #198).

## Why

Sam looked at snpetanque.com/worlds2026 as a visitor (20 Nov, 20:45). Three things read as organiser wording, or as an error, before play has started:

- **Nations Cup tab** (no teams yet): it shows "0 teams entered · Swiss rounds · 0 pistes" and "Add at least 2 teams on Registration before drawing." Visitors can't add anything.
- **Triples tab:** the round box is red, with "24 games still to finish", before round 1 has begun. To a visitor, red means something's wrong.
- **Every game:** shows "Waiting for piste". The FIPJP doesn't publish pistes, so the competitions have every piste switched off, and no game will ever get one.

The same happens for any spectator on the main site (e.g. snpetanque.com/#tefa7z63), not only on the event page.

## What changes

All on the Draw & results tab, phone and desktop.

### 1. Empty draw, for anyone who can't edit (`!canEdit()`: spectators, players, the event page)

When the draw panel would show the "not enough entries yet" state, a viewer who can't edit sees one line instead:
- **The draw isn't out yet.**

On the event page, if the current tab in the event file has an `empty` text, show that text instead (as plain text, `data-notr`, like the event's `note`).

Organisers see exactly what they see today.

### 2. Round progress panel, for anyone who can't edit

The panel keeps its text but loses the alarm:
- No `rp-live` / `rp-ready` colour classes: it's a plain panel.
- No coloured state part (" · 24 games still to finish" / " · round finished" etc.).
- It reads, for example: **Swiss rounds** / **Round 1 of 5 planned** · 0/24 games finished.
- The same rule applies to the mêlée-in-advance panel.
- Organisers see exactly what they see today, colours and buttons included.

### 3. Pistes all switched off (for everyone)

When a competition has **no piste in use** (`t.courts.every(c => c.active === false)`, or no pistes at all):
- A game that is ready but not playing shows **no label** where "Waiting for piste" was (an empty span, like a game that isn't ready). The Ready pill stays.
- In the organiser's empty-draw line, the " · 0 pistes" part is left out.

With at least one piste in use, nothing changes.

### Event file

Add an optional `"empty"` to an event tab. For worlds2026, on the Nations Cup tab:
- **"empty": "The Nations Cup starts after Sunday's five Triples rounds. Its teams and draw appear here then."**

## Not changing

- Organiser screens: the Registration hint, buttons, colours and piste assignment.
- Standings, brackets, the big screen and stream overlays.
- The shooting tab's "Next up on the piste" line.
- Saved data.

## Data and rules

None. The event file gets one optional field per tab (`empty`), read only by `renderEvent` / the draw page on the event page.

## New text

- The draw isn't out yet.

The event file's `empty` text is event content, not translated (like `note`).

## Acceptance checks

Extend `tests/web-event-page.js`, and an app test for the main-site spectator view (`tests/app-spectator-*.js` or a new `tests/app-visitor-draw.js`). Print:
- `event nations tab: The Nations Cup starts after Sunday's five Triples rounds. Its teams and draw appear here then.`
- `event nations tab no "Registration": true`
- `spectator empty draw: The draw isn't out yet.`
- `organiser empty draw unchanged: Add at least 2 teams on Registration before drawing.`
- `spectator round panel: plain, no rp-live: true | no "still to finish": true`
- `organiser round panel: rp-live` (unchanged)
- `pistes all off, ready game label: ""`
- `one piste on, ready game label: Waiting for piste`
- `organiser empty line with no pistes: 0 teams entered · Swiss rounds` (no "0 pistes")
- `390 px: no sideways scroll`
- `errs []`

## Notes for the builder

- `canEdit()` is already false on the event page (`evRO()`), so one `!canEdit()` check covers both the event page and main-site spectators.
- Look at worlds2026 at 390 px before and after: the Triples, Nations Cup and Shooting tabs.

## Open questions

None.
