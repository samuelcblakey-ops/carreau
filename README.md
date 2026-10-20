# Carreau Competition Desk

Run petanque competitions live: Swiss, snake, pools, knockout, round robin and mêlée, with piste allocation and score entry. Spectators follow along on their phones with no account; organisers sign in with Google.

## Files

| File | What it is |
|---|---|
| `index.html` | The whole app |
| `firebase-config.js` | Your Firebase project's settings (you paste these in) |
| `firestore.rules` | Who can read and change what (you paste these into Firebase) |
| `.nojekyll` | Tells GitHub Pages to serve the files as they are |

## One-time setup (about 15 minutes)

### 1. Create the Firebase project
1. Go to <https://console.firebase.google.com> and click **Create a project**. Name it something like `carreau-petanque`. Google Analytics isn't needed.
2. In the left menu open **Build → Firestore Database → Create database**. Pick a location near you (e.g. `europe-west2` for London), start in **production mode**.
3. Open the **Rules** tab of Firestore, replace everything with the contents of `firestore.rules`, and click **Publish**.
4. Open **Build → Authentication → Get started**, choose **Google** as a sign-in provider, switch it on, pick your support email, and **Save**.

### 2. Connect the app to it
1. Click the gear icon → **Project settings**. Under **Your apps**, click the **</>** (web) icon, give it a nickname, and register it (no hosting needed).
2. Copy the values from the `firebaseConfig` block it shows into `firebase-config.js`, replacing the `PASTE_…` placeholders.

### 3. Put it on GitHub Pages
1. Create a new public repository on GitHub, e.g. `carreau`.
2. Upload all four files to it (**Add file → Upload files**, including `.nojekyll`).
3. In the repo go to **Settings → Pages**, set **Source** to *Deploy from a branch*, branch `main`, folder `/ (root)`, and **Save**.
4. After a minute the site is live at `https://YOUR-USERNAME.github.io/carreau/`.

### 4. Allow sign-in from your site
In Firebase, **Authentication → Settings → Authorized domains → Add domain** and add `YOUR-USERNAME.github.io`.

## Using it
- **Organisers:** sign in with Google, create a competition, and share its link from **Setup → Sharing**.
- **Scorers:** add their Google email addresses under **Setup → Sharing**. They sign in, open the link and can enter scores and move games between pistes. Their addresses are never shown publicly.
- **Spectators:** just open the link. Tick *Show on the public list* if you want the competition to appear on the site's home page.

## Own domain (optional)
Buy a domain, add it under **Settings → Pages → Custom domain** in GitHub, follow GitHub's DNS instructions, then add the domain to Firebase's **Authorized domains** too.

## Costs
Firebase's free Spark plan allows 50,000 reads and 20,000 writes a day, which comfortably covers a busy club competition day. Nothing is charged unless you upgrade the plan yourself.
