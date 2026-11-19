# Poster maker: a photo or ChatGPT artwork as the background

- **Status:** ready to build (Sam, 19 Nov 2026: "bring your own ChatGPT": the site writes the prompt, the organiser makes the picture in ChatGPT and brings it back)
- **Size:** one pull request.
- **Touches:** src/carreau.html: the poster functions from specs/poster-maker.md (`renderPosterModal`, `posterDraw`); a small on-device picture store (IndexedDB) next to them
- **Depends on:** specs/poster-maker.md merged first.

## Why
Most organisers make their flyers in ChatGPT today. The pictures look great, but the AI gets dates, phone numbers and names wrong, and it can't make a QR code that scans. If the organiser asks ChatGPT for the artwork only, with no words, the poster maker can lay the exact details and the QR code on top. The same section takes a photo of the club or terrain.

## What changes
In the poster sheet, a **Background picture** section under Layout:
- **Choose a picture** (a file picker for any image) and, once one is chosen, **Remove**.
  - The picture is used as it is chosen. It's shrunk on the device to at most 2480 px on its longer side.
  - It's kept on this device only, in IndexedDB, under the listing's id, and never uploaded. A line under the button says: "Your picture stays on this phone. It isn't uploaded."
  - If the picture can't be read: "That picture couldn't be used. Try a JPEG or PNG."
- **A fourth layout, Photo**: the picture fills the whole poster. A dark shade (see Darken) sits behind the text, and the headline and details are in white over it. Choosing a picture while another layout is picked switches to Photo. Bold also uses the picture, in its top block instead of the plain colour. Band and Classic ignore it.
- **Position:** chips Top / Centre / Bottom (which part of the picture shows when it's cropped to the poster's shape). Default Centre.
- **Darken:** a slider from 0 to 80%, default 40%, for how dark the shade over the picture is.
- **Make artwork with ChatGPT** (a fold, closed at first):
  - Style chips: **Sunny terrain**, **Evening under lights**, **Provençal village**, **Club colours** and **Simple boules pattern**. Default Sunny terrain.
  - **Copy the prompt** copies the prompt below, then shows the toast "Prompt copied. Paste it into ChatGPT."
  - **Open ChatGPT** opens https://chatgpt.com in a new tab.
  - The steps:
    1. "Copy the prompt."
    2. "Paste it into ChatGPT (Gemini or Copilot work too) and send it."
    3. "Save the picture to your phone or computer."
    4. "Tap Choose a picture above."
  - The line: "The prompt asks for a picture with no words on it. The poster adds your details and the QR code, so they're always right."

### The prompt (always in English, which image tools follow best)
> Create a background illustration for a poster advertising a pétanque competition. Shape: {shape}. Style: {style}. Use {main colour name} ({main hex}) and {second colour name} ({second hex}) as the main colours. Keep the {calm part} calm and uncluttered so text can go on top of it. Do not include any words, letters, numbers, logos, watermarks or QR codes. No recognisable real people, brands or famous landmarks.

- {shape}: "square (1:1)" for Facebook post, "tall portrait (9:16)" for Story, "portrait A4 (1:1.41)" for A4 and A5.
- {calm part}: "top half" for Bold and Band, "whole centre" for Photo and Classic.
- {style}:
  - Sunny terrain: "a sunny gravel pétanque terrain under plane trees, steel boules and a small wooden jack in the foreground, warm light, soft focus background"
  - Evening under lights: "a pétanque terrain in the evening under floodlights, long shadows, steel boules catching the light, deep blue sky"
  - Provençal village: "a village square in Provence with a pétanque game, plane trees, stone houses with shutters, summer light, painterly"
  - Club colours: "bold modern abstract shapes suggesting boules and a jack, flat colours, clean graphic poster style"
  - Simple boules pattern: "a simple repeating pattern of steel boules and small jacks on a plain background, subtle and light"
- Colour names: see Notes for the builder.

## Not changing
No AI inside the site, nothing uploaded, and no change to the listing. Pictures aren't shared between devices.

## Data and rules
None. The picture is kept in the browser's IndexedDB (`carreau-poster` store, key = the listing id). Removing it, or the listing's date passing by more than 30 days, deletes it: clean up stale keys when the poster sheet opens.

## New text
"Background picture", "Choose a picture", "Your picture stays on this phone. It isn't uploaded.", "That picture couldn't be used. Try a JPEG or PNG.", "Photo", "Position", "Top", "Centre", "Bottom", "Darken", "Make artwork with ChatGPT", "Sunny terrain", "Evening under lights", "Provençal village", "Club colours", "Simple boules pattern", "Copy the prompt", "Prompt copied. Paste it into ChatGPT.", "Open ChatGPT", "Copy the prompt.", "Paste it into ChatGPT (Gemini or Copilot work too) and send it.", "Save the picture to your phone or computer.", "Tap Choose a picture above.", "The prompt asks for a picture with no words on it. The poster adds your details and the QR code, so they're always right." (The prompt stays in English.)

## Acceptance checks
Extend `tests/app-poster.js`:
- `poster picture: photo layout true | bold uses picture true | band ignores picture true`
- `poster picture stays on device: store writes 0 | after reload true`
- `poster picture removed: layout back to bold true`
- `poster darken: 40 default | 0 and 80 draw true`
- `poster prompt: square (1:1) true | no words rule true | royal blue (#1f5fbf) true | sunny terrain style true`
- `poster prompt story: tall portrait (9:16) true`
- `prompt copied: Prompt copied. Paste it into ChatGPT.`
- `phone 390: poster sheet no sideways scroll true`
- `errs []`

## Notes for the builder
- "store writes 0": check nothing new reaches `S.store` (no Firestore or local-store write) when a picture is chosen.
- Draw the picture "cover"-style (crop to fill) with the Position as the vertical anchor, then the shade as a black rectangle at the Darken alpha. On Photo, a gradient (stronger at the bottom, where the details sit) reads better than a flat shade. Keep the alpha the slider sets as the average.
- `createImageBitmap(file, { imageOrientation: "from-image" })` gets phone photos the right way up.
- Large phone photos: shrink before storing, as a JPEG Blob at about 0.85 quality.
- Colour names in the prompt are plain English that image tools know, in lower case: Green → "deep green", Blue (#1f5fbf) → "royal blue", Navy → "navy", Red → "red", Claret → "claret", Purple → "purple", Orange → "orange", Black → "black", Gold → "gold", White → "white". A custom colour is "your colour".
- Screenshots: Photo with a test picture at square and Story, Bold with a picture, the ChatGPT fold open at 390 px.

## Open questions
None.
