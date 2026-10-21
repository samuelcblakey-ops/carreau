/* ---------------- web build: Firebase storage, no-login access with share codes ---------------- */
// Beta access model: every device signs in anonymously (no account, nothing to type).
// The device that creates a competition owns it. Owners hand out two private codes:
//   organiser code -> full control, scorer code -> scores and pistes only.
// Helpers open a link containing the code (or type it in) and their device is remembered as a member.
const ADMIN_EMAILS = ["samuelcblakey@gmail.com"]; // site admins (enforced in firestore.rules too)
const isAdmin = () => !!(AUTH.user && !AUTH.user.isAnonymous && ADMIN_EMAILS.includes((AUTH.user.email || "").toLowerCase()));
const SITE = { openTesting: true, loaded: false }; // site settings (config/site); open testing is the beta default
const CONFIGURED = firebaseConfig && firebaseConfig.apiKey && !String(firebaseConfig.apiKey).startsWith("PASTE");
const AUTH = { user: null, ready: false };
const ROLE = {};   // tid -> "edit" | "score" (membership of this device)
const CODES = {};  // tid -> { edit, score } (only readable by organisers)
let FB = null, unsubRole = null, unsubCodes = null;
const JOINED_KEY = "carreau-joined";
const joined = () => { try { return JSON.parse(lsGet(JOINED_KEY) || "[]"); } catch { return []; } };
const remember = tid => { const j = joined(); if (!j.includes(tid)) { j.push(tid); lsSet(JOINED_KEY, JSON.stringify(j.slice(-50))); } };
const ALPHA = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const newCode = () => { const a = new Uint32Array(8); crypto.getRandomValues(a); return [...a].map(x => ALPHA[x % ALPHA.length]).join(""); };

function fbStore() {
  const { db } = FB;
  let unsubs = [];
  return {
    mode: "firebase",
    watchTournaments(cb, onErr) {
      unsubs.forEach(u => u()); unsubs = [];
      const parts = {}; const expected = new Set();
      const emit = () => {
        if ([...expected].some(k => !(k in parts))) return; // wait until every source has answered once
        const m = {}; Object.values(parts).forEach(list => list.forEach(t => m[t.id] = t)); cb(Object.values(m));
      };
      const subQ = (key, q) => { expected.add(key); unsubs.push(onSnapshot(q, s => { parts[key] = s.docs.map(d => d.data()); emit(); }, e => { console.error(e); parts[key] = []; emit(); onErr?.(e); })); };
      const subD = (key, tid) => { expected.add(key); unsubs.push(onSnapshot(doc(db, "tournaments", tid), d => { parts[key] = d.exists() ? [d.data()] : []; emit(); }, () => { parts[key] = []; emit(); })); };
      const tc = collection(db, "tournaments");
      // archived competitions are only visible to the admin (enforced in firestore.rules)
      if (isAdmin()) subQ("all", query(tc, limit(300)));
      else {
        subQ("listed", query(tc, where("listed", "==", true), where("archived", "==", false), limit(100)));
        if (AUTH.user) subQ("mine", query(tc, where("ownerUid", "==", AUTH.user.uid), where("archived", "==", false), limit(200)));
      }
      new Set([...joined(), S.tid].filter(Boolean)).forEach(tid => subD("t:" + tid, tid));
      return () => { unsubs.forEach(u => u()); unsubs = []; };
    },
    watchMatches(tid, cb, onErr) { return onSnapshot(collection(db, "tournaments", tid, "matches"), s => cb(s.docs.map(d => d.data())), onErr); },
    async setTournament(t) {
      const isNew = !!t._new; const body = clone(t); delete body._new; body.updated = Date.now();
      await setDoc(doc(db, "tournaments", t.id), body);
      if (isNew) { // first save of a new competition: create its private codes
        delete t._new; if (S.tournaments[t.id]) delete S.tournaments[t.id]._new;
        const codes = { edit: newCode(), score: newCode() };
        await setDoc(doc(db, "tournaments", t.id, "private", "codes"), codes); CODES[t.id] = codes; render();
      }
    },
    async deleteTournament(tid) {
      const s = await getDocs(collection(db, "tournaments", tid, "matches"));
      for (const d of s.docs) await deleteDoc(d.ref);
      try { await deleteDoc(doc(db, "tournaments", tid, "private", "codes")); } catch {}
      await deleteDoc(doc(db, "tournaments", tid));
    },
    setMatch(tid, m) { return setDoc(doc(db, "tournaments", tid, "matches", m.id), clone(m)); },
    updateMatch(tid, id, patch) { return updateDoc(doc(db, "tournaments", tid, "matches", id), clone(patch)); },
    deleteMatch(tid, id) { return deleteDoc(doc(db, "tournaments", tid, "matches", id)); }
  };
}

const isOwner = t => !!(AUTH.user && t && t.ownerUid === AUTH.user.uid);
S.permFn = t => {
  if (!AUTH.user || !t) return { edit: false, score: false };
  // open testing lets guests run competitions they open, except the examples (listed), which stay view-only
  const r = isOwner(t) || isAdmin() || (SITE.openTesting && !t.listed) ? "edit" : ROLE[t.id];
  return { edit: r === "edit", score: r === "edit" || r === "score" };
};
S.canCreate = () => !!AUTH.user;
S.canDelete = t => isOwner(t) || isAdmin();
S.canSeeArchived = () => isAdmin();
S.decorateNew = nt => { nt.ownerUid = AUTH.user.uid; nt.device = deviceLabel(); nt.listed = false; nt._new = true; remember(nt.id); };
// a rough "what kind of device" label so the admin can tell creators apart (no personal data)
function deviceLabel() {
  const u = navigator.userAgent || "";
  const dev = /iPad/.test(u) ? "iPad" : /iPhone/.test(u) ? "iPhone" : /Android/.test(u) ? (/Mobile/.test(u) ? "Android phone" : "Android tablet") : /Macintosh/.test(u) ? (navigator.maxTouchPoints > 1 ? "iPad" : "Mac") : /Windows/.test(u) ? "Windows PC" : /CrOS/.test(u) ? "Chromebook" : /Linux/.test(u) ? "Linux PC" : "Device";
  const br = /Edg\//.test(u) ? "Edge" : /OPR\//.test(u) ? "Opera" : /Firefox\//.test(u) ? "Firefox" : /CriOS|Chrome\//.test(u) ? "Chrome" : /Safari\//.test(u) ? "Safari" : "";
  return br ? `${dev} · ${br}` : dev;
}
// the admin's own competition menu only shows their competitions and the examples; everything else lives in #admin
S.menuFilter = t => !isAdmin() || t.listed || isOwner(t);

const base = () => `${location.origin}${location.pathname}`;
const links = t => ({ watch: `${base()}#${t.id}`, edit: CODES[t.id] ? `${base()}#${t.id}.${CODES[t.id].edit}` : "", score: CODES[t.id] ? `${base()}#${t.id}.${CODES[t.id].score}` : "" });
S.headerExtra = () => {
  const t = T(); if (!CONFIGURED || !t) return "";
  const p = S.permFn(t);
  if (isAdmin()) return `<span class="pill done">Admin</span>`;
  if (SITE.openTesting && t.listed) return `<span class="pill" title="Example competition, view only">Example</span>`;
  if (SITE.openTesting) return `<span class="pill playing" title="Open testing">Test mode</span>`;
  if (isOwner(t)) return `<span class="pill done">Organiser</span>`;
  if (p.edit) return `<span class="pill done">Organiser</span>`;
  if (p.score) return `<span class="pill done">Scorer</span>`;
  return `<button class="btn sm ghost" data-act="enter-code">Organiser code</button>`;
};
S.welcomeExtra = () => `<p class="muted">Following a competition? Open the link the organiser sent you.</p>`;
const copyRow = (id, label, value, note) => `<div class="stack" style="gap:6px"><div class="eyebrow">${label}</div>
  <div class="row" style="flex-wrap:nowrap"><input type="text" id="${id}" readonly value="${esc(value)}" aria-label="${label}"><button class="btn" data-act="copy" data-target="${id}">Copy</button></div>
  <p class="small muted">${note}</p></div>`;
S.setupExtra = t => {
  if (!CONFIGURED) return "";
  const l = links(t);
  if (SITE.openTesting) return `<div class="panel stack">
    <h3>Sharing</h3>
    <div class="notice">Open testing is on: everyone who opens a competition can run it, including registration, setup, draws and scores. Spectator and organiser links are switched off while it's on.</div>
    ${copyRow("share-watch", "Link to this competition", l.watch, "Anyone with this link can run this competition while open testing is on.")}
  </div>`;
  return `<div class="panel stack">
    <h3>Sharing</h3>
    ${copyRow("share-watch", "Link for players and spectators", l.watch, "Anyone with this link can follow the draw, results, standings and big screen live. They can't change anything.")}
    ${l.edit ? `${copyRow("share-edit", "Organiser link", l.edit, `Gives full control, including registration, setup, draws and scores. Keep it to your organising team, and keep a copy for yourself in case you change device. Organiser code: <b>${esc(CODES[t.id].edit)}</b>`)}` : `<p class="small muted">Loading the private codes…</p>`}
    <label class="chk"><input type="checkbox" data-check="listed" ${t.listed ? "checked" : ""}> Show this competition on the site's front page</label>
  </div>`;
};
S.extraAction = async (act, a) => {
  if (act.startsWith("adm-") && await adminAction(act, a)) return;
  if (act === "copy") { const el = document.getElementById(a.dataset.target); try { await navigator.clipboard.writeText(el.value); toast("Copied."); } catch { el.select(); } }
  if (act === "enter-code") openCodeBox();
  if (act === "admin-exit") { history.replaceState(null, "", S.tid ? "#" + S.tid : location.pathname); S.overlayView = null; render(); return; }
  if (act === "admin-example") { const t = S.tournaments[a.dataset.id]; try { await updateDoc(doc(FB.db, "tournaments", a.dataset.id), { listed: !t?.listed }); } catch (e) { console.error(e); toast("That change didn't save. Check your connection and try again."); } return; }
  if (act === "admin-del") { S.adminConfirm = a.dataset.id; render(); return; }
  if (act === "admin-del-yes") { const id = a.dataset.id; S.adminConfirm = null; try { await S.store.deleteTournament(id); delete S.tournaments[id]; if (S.tid === id) S.tid = null; toast("Competition deleted."); } catch (e) { console.error(e); toast("That change didn't save. Check your connection and try again."); } render(); return; }
  if (act === "admin-restore") {
    try { await updateDoc(doc(FB.db, "tournaments", a.dataset.id), { archived: false, archivedAt: null }); toast("Competition restored."); } catch (e) { console.error(e); toast("That change didn't save. Check your connection and try again."); }
    return;
  }
  if (act === "open-testing") {
    const on = a.dataset.on === "1";
    try { await setDoc(doc(FB.db, "config", "site"), { openTesting: on, updated: Date.now() }); toast(on ? "Open testing is on." : "Open testing is off."); }
    catch (e) { console.error(e); toast("That setting didn't save."); }
    return;
  }
  if (act === "admin-in") { try { await signInWithPopup(FB.auth, new GoogleAuthProvider()); } catch (e) { if (e?.code !== "auth/popup-closed-by-user" && e?.code !== "auth/cancelled-popup-request") toast("Sign-in didn't complete. Allow pop-ups for this site and try again."); return; }
    if (!isAdmin()) { toast("That Google account isn't an admin for this site."); await signOut(FB.auth); } else { toast("Signed in as admin."); render(); } }
  if (act === "admin-out") { await signOut(FB.auth); toast("Signed out."); }
  if (act === "code-close") closeCodeBox();
  if (act === "code-submit") { const v = document.getElementById("code-input").value; if (await joinWithCode(S.tid, v)) closeCodeBox(); }
};
function openCodeBox() {
  document.getElementById("modal").innerHTML = `<div class="scrim"><div class="modal" role="dialog" aria-modal="true" aria-label="Enter a code">
    <div class="spread"><h3>Enter a code</h3><button type="button" class="btn ghost" data-act="code-close" aria-label="Close">✕</button></div>
    <p class="muted">Organisers get a code from the person running the competition.</p>
    <input type="text" id="code-input" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="e.g. K7RM2QXP" style="font-size:22px;letter-spacing:.12em;text-transform:uppercase">
    <div><button class="btn primary" type="button" data-act="code-submit">Join</button></div>
  </div></div>`;
  localize(document.getElementById("modal"));
  document.getElementById("code-input").focus();
}
function closeCodeBox() { document.getElementById("modal").innerHTML = ""; }
document.addEventListener("keydown", e => { if (e.key === "Enter" && e.target.id === "code-input") { e.preventDefault(); document.querySelector('[data-act="code-submit"]')?.click(); } });

async function joinWithCode(tid, raw) {
  const code = String(raw || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (!code || !tid || !AUTH.user) return false;
  const ref = doc(FB.db, "tournaments", tid, "members", AUTH.user.uid);
  for (const role of ["edit", "score"]) {
    try {
      await setDoc(ref, { role, code, joinedAt: Date.now() });
      ROLE[tid] = role; remember(tid); restart(); render();
      toast(role === "edit" ? "You're now an organiser for this competition." : "You can now enter scores for this competition.");
      return true;
    } catch (e) { /* not this role: try the next */ }
  }
  toast("That code didn't work. Check it with the organiser.");
  return false;
}

function watchRole() {
  unsubRole?.(); unsubRole = null; unsubCodes?.(); unsubCodes = null;
  if (!FB || !AUTH.user || !S.tid) return;
  const tid = S.tid;
  unsubRole = onSnapshot(doc(FB.db, "tournaments", tid, "members", AUTH.user.uid),
    d => { ROLE[tid] = d.exists() ? d.data().role : undefined; if (d.exists()) remember(tid); render(); watchCodes(tid); },
    () => { ROLE[tid] = undefined; render(); watchCodes(tid); });
}
function watchCodes(tid) {
  if (unsubCodes || tid !== S.tid) return;
  const t = S.tournaments[tid];
  if (!(isOwner(t) || isAdmin() || ROLE[tid] === "edit")) return;
  unsubCodes = onSnapshot(doc(FB.db, "tournaments", tid, "private", "codes"), d => { if (d.exists()) { CODES[tid] = d.data(); render(); } }, () => {});
}
function restart() { if (!FB) return; startWatching(); watchRole(); renderFooter(); }
function renderFooter() { /* admin lives at #admin (the back end); nothing shown to guests */ }
const ADM = { filter: "all", q: "", creator: null, sel: new Set(), confirm: null, busy: "", names: {}, naming: null };
let unsubNames = null;
function watchNames() {
  if (unsubNames || !isAdmin()) return;
  unsubNames = onSnapshot(doc(FB.db, "config", "creators"), d => { ADM.names = d.exists() ? d.data() : {}; if (S.overlayView) render(); }, () => {});
}
const entriesOf = t => (t.entry === "melee" || t.entry === "shooting" ? (t.players || []) : (t.teams || [])).length;
function statusOf(t) {
  if (t.archived) return "Archived";
  if ((t.brackets || []).length) return "Knockout";
  if ((t.pools || []).length) return "Pools";
  if ((t.draws || []).length) return `Round ${(t.draws || []).length}`;
  return entriesOf(t) ? "Registration" : "Empty";
}
const when = ms => { if (!ms) return "–"; const d = new Date(ms); return d.toLocaleDateString(undefined, { day: "numeric", month: "short" }) + " " + d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" }); };
function creators(all) {
  const by = {};
  all.forEach(t => { const k = t.ownerUid || "unknown"; (by[k] = by[k] || { uid: k, list: [], first: Infinity, last: 0, device: "" }).list.push(t);
    const c = by[k]; c.first = Math.min(c.first, t.created || 0); c.last = Math.max(c.last, t.created || 0); if (t.device) c.device = t.device; });
  const list = Object.values(by).sort((x, y) => x.first - y.first);
  let n = 0; list.forEach(c => { c.label = ADM.names[c.uid] || (c.uid === AUTH.user?.uid ? "You (admin)" : c.uid === "unknown" ? "Unknown" : `Visitor ${++n}`); });
  return list;
}
function adminView() {
  if (isAdmin()) watchNames();
  const all = Object.values(S.tournaments);
  const cs = creators(all); const cOf = Object.fromEntries(cs.map(c => [c.uid, c]));
  const counts = { all: all.length, examples: all.filter(t => t.listed).length, visitors: all.filter(t => !t.listed).length, empty: all.filter(t => !t.listed && !entriesOf(t)).length, archived: all.filter(t => t.archived).length };
  const q = ADM.q.trim().toLowerCase();
  const shown = all.filter(t => (ADM.filter === "all" || (ADM.filter === "examples" && t.listed) || (ADM.filter === "visitors" && !t.listed) || (ADM.filter === "empty" && !t.listed && !entriesOf(t)) || (ADM.filter === "archived" && t.archived))
    && (!ADM.creator || (t.ownerUid || "unknown") === ADM.creator) && (!q || (t.name || "").toLowerCase().includes(q)))
    .sort((x, y) => (!!y.listed - !!x.listed) || (y.created || 0) - (x.created || 0));
  [...ADM.sel].forEach(id => { if (!S.tournaments[id]) ADM.sel.delete(id); });
  const nSel = ADM.sel.size; const allShownSel = shown.length && shown.every(t => ADM.sel.has(t.id));
  const chip = (k, label) => `<button type="button" class="btn sm ${ADM.filter === k ? "primary" : ""}" data-act="adm-filter" data-k="${k}">${label} <span class="small">${counts[k]}</span></button>`;
  return `<div class="stack" style="max-width:900px">
    <div class="spread"><h2>Admin back end</h2><button class="btn sm" data-act="admin-exit">Back to competitions</button></div>
    ${!isAdmin() ? `<div class="panel stack"><p>Sign in with the admin Google account to change site settings.</p><div><button class="btn primary" data-act="admin-in">Sign in with Google</button></div></div>` : `
    <div class="panel spread"><span class="muted">Signed in as ${esc(AUTH.user.email)}</span><button class="btn sm ghost" data-act="admin-out">Sign out</button></div>
    <div class="panel stack">
      <div class="spread"><h3>Open testing</h3><span class="pill ${SITE.openTesting ? "playing" : ""}">${SITE.openTesting ? "On" : "Off"}</span></div>
      <p class="muted">${SITE.openTesting ? "Everyone can run every competition (beta testing). Spectator and organiser links are switched off." : "Off: spectators see the draw, results, standings and big screen; organisers use their organiser link or code."}</p>
      <div><button class="btn ${SITE.openTesting ? "" : "primary"}" data-act="open-testing" data-on="${SITE.openTesting ? "0" : "1"}">${SITE.openTesting ? "Turn open testing off" : "Turn open testing on"}</button></div>
    </div>
    <div class="panel stack" style="gap:6px" id="adm-creators">
      <h3>Who's creating <span class="muted small">${cs.length}</span></h3>
      <p class="small muted">Visitors don't sign in, so each device is one creator. Give them a nickname once you know who they are. Nicknames are only visible to you.</p>
      ${cs.map(c => `<div class="erow"><div class="who"><b>${esc(c.label)}</b><span class="small muted">${esc(c.device || "Device not recorded")} · ${c.list.length} competition${c.list.length === 1 ? "" : "s"} · last ${when(c.last)}</span></div>
        ${ADM.naming === c.uid ? `<input id="adm-name" data-uid="${esc(c.uid)}" value="${esc(ADM.names[c.uid] || "")}" placeholder="Nickname" style="max-width:180px"><button class="btn sm primary" data-act="adm-name-save" data-uid="${esc(c.uid)}">Save</button>`
          : c.uid !== "unknown" ? `<button class="btn sm ghost" data-act="adm-name" data-uid="${esc(c.uid)}">${ADM.names[c.uid] ? "Rename" : "Nickname"}</button>` : ""}
        <button class="btn sm ${ADM.creator === c.uid ? "primary" : ""}" data-act="adm-creator" data-uid="${esc(c.uid)}">${ADM.creator === c.uid ? "Showing ✓" : "Show theirs"}</button></div>`).join("")}
    </div>
    <div class="panel stack" style="gap:8px" id="adm-comps">
      <h3>Competitions</h3>
      <p class="small muted">Visitors only see the competitions they created on their own device, plus the examples (view-only). Your own competition menu shows just yours and the examples; everything else is managed here.</p>
      <div class="row" style="flex-wrap:wrap;gap:6px">${chip("all", "All")}${chip("visitors", "Visitors'")}${chip("empty", "Empty")}${chip("examples", "Examples")}${chip("archived", "Archived")}</div>
      <div class="row" style="flex-wrap:wrap;gap:6px;align-items:center">
        <input id="adm-q" type="search" placeholder="Search by name" value="${esc(ADM.q)}" style="max-width:220px">
        ${ADM.creator ? `<span class="pill">Creator: ${esc(cOf[ADM.creator]?.label || "?")} <button class="btn sm ghost" data-act="adm-creator" data-uid="${esc(ADM.creator)}" aria-label="Clear creator filter">✕</button></span>` : ""}
        <span class="muted small" id="adm-count">${shown.length} shown</span>
      </div>
      <div class="row" style="flex-wrap:wrap;gap:6px;align-items:center">
        <label class="chk"><input type="checkbox" data-act="adm-sel-all" ${allShownSel ? "checked" : ""}> Select all shown</label>
        ${nSel ? `<span class="small"><b>${nSel}</b> selected</span>
          ${ADM.confirm === "bulk-del" ? `<span class="err">Delete ${nSel} competition${nSel === 1 ? "" : "s"} and all their results for good?</span><button class="btn sm danger" data-act="adm-bulk-del-yes">Yes, delete</button><button class="btn sm" data-act="adm-bulk-cancel">Cancel</button>`
            : `<button class="btn sm danger" data-act="adm-bulk-del">Delete selected</button><button class="btn sm" data-act="adm-bulk-arch">Archive selected</button><button class="btn sm ghost" data-act="adm-sel-none">Clear</button>`}` : ""}
        ${ADM.busy ? `<span class="small muted">${esc(ADM.busy)}</span>` : ""}
      </div>
      <div>${shown.map(t => { const c = cOf[t.ownerUid || "unknown"]; return `<div class="erow" data-name="${esc((t.name || "").toLowerCase())}">
        <input type="checkbox" data-act="adm-sel" data-id="${t.id}" ${ADM.sel.has(t.id) ? "checked" : ""} aria-label="Select ${esc(t.name)}">
        <div class="who"><b>${esc(t.name)}</b><span class="small muted">${esc(c?.label || "Unknown")} · created ${when(t.created)}${t.updated ? ` · changed ${when(t.updated)}` : ""} · ${entriesOf(t)} ${t.entry === "melee" || t.entry === "shooting" ? "players" : "teams"}</span></div>
        <span class="pill ${statusOf(t) === "Empty" ? "" : "playing"}">${statusOf(t)}</span>
        ${t.listed ? `<span class="pill">Example</span>` : ""}
        ${t.archived ? `<button class="btn sm" data-act="admin-restore" data-id="${t.id}">Restore</button>` : ""}
        <button class="btn sm ${t.listed ? "primary" : ""}" data-act="admin-example" data-id="${t.id}" title="Examples are shown to every visitor, view only">${t.listed ? "Example ✓" : "Make example"}</button>
        <a class="btn sm" href="#${t.id}" data-act="admin-exit">Open</a>
        ${S.adminConfirm === t.id ? `<button class="btn sm danger" data-act="admin-del-yes" data-id="${t.id}">Confirm delete</button>` : `<button class="btn sm danger" data-act="admin-del" data-id="${t.id}">Delete</button>`}</div>`; }).join("") || `<p class="muted">Nothing matches.</p>`}</div>
    </div>`}
  </div>`;
}
async function adminAction(act, a) {
  if (act === "adm-filter") { ADM.filter = a.dataset.k; ADM.sel.clear(); ADM.confirm = null; render(); return true; }
  if (act === "adm-creator") { ADM.creator = ADM.creator === a.dataset.uid ? null : a.dataset.uid; ADM.sel.clear(); ADM.confirm = null; render(); return true; }
  if (act === "adm-sel") { a.checked ? ADM.sel.add(a.dataset.id) : ADM.sel.delete(a.dataset.id); ADM.confirm = null; render(); return true; }
  if (act === "adm-sel-all") { const ids = [...document.querySelectorAll('#adm-comps .erow:not([hidden]) [data-act="adm-sel"]')].map(x => x.dataset.id); a.checked ? ids.forEach(i => ADM.sel.add(i)) : ids.forEach(i => ADM.sel.delete(i)); ADM.confirm = null; render(); return true; }
  if (act === "adm-sel-none") { ADM.sel.clear(); ADM.confirm = null; render(); return true; }
  if (act === "adm-bulk-del") { ADM.confirm = "bulk-del"; render(); return true; }
  if (act === "adm-bulk-cancel") { ADM.confirm = null; render(); return true; }
  if (act === "adm-bulk-del-yes" || act === "adm-bulk-arch") {
    const ids = [...ADM.sel]; ADM.confirm = null; let ok = 0, failed = 0; const del = act === "adm-bulk-del-yes";
    for (const id of ids) {
      ADM.busy = `${del ? "Deleting" : "Archiving"} ${ok + failed + 1} of ${ids.length}…`; render();
      try { if (del) { await S.store.deleteTournament(id); delete S.tournaments[id]; if (S.tid === id) S.tid = null; } else await updateDoc(doc(FB.db, "tournaments", id), { archived: true }); ok++; ADM.sel.delete(id); }
      catch (e) { console.error(e); failed++; }
    }
    ADM.busy = ""; render(); toast(failed ? `${ok} done, ${failed} didn't save. Check your connection and try again.` : `${ok} competition${ok === 1 ? "" : "s"} ${del ? "deleted" : "archived"}.`); return true;
  }
  if (act === "adm-name") { ADM.naming = a.dataset.uid; render(); setTimeout(() => document.getElementById("adm-name")?.focus(), 0); return true; }
  if (act === "adm-name-save") {
    const uid = a.dataset.uid, v = (document.getElementById("adm-name")?.value || "").trim().slice(0, 40); ADM.naming = null;
    try { await setDoc(doc(FB.db, "config", "creators"), { [uid]: v || deleteField() }, { merge: true }); ADM.names = { ...ADM.names }; if (v) ADM.names[uid] = v; else delete ADM.names[uid]; } catch (e) { console.error(e); toast("That change didn't save. Check your connection and try again."); }
    render(); return true;
  }
  return false;
}
S.overlayInput = el => {
  if (el.id !== "adm-q") return false;
  ADM.q = el.value; const q = ADM.q.trim().toLowerCase(); let n = 0;
  document.querySelectorAll("#adm-comps [data-name]").forEach(r => { r.hidden = !!q && !r.dataset.name.includes(q); if (!r.hidden) n++; });
  const c = document.getElementById("adm-count"); if (c) c.textContent = `${n} shown`;
  return true;
};
S.overlayChange = async el => el.id === "adm-name" || el.id === "adm-q";
let unsubSite = null;
async function backfillArchived() {
  if (!isAdmin() || S.backfilled) return; S.backfilled = true;
  for (const t of Object.values(S.tournaments)) if (t.archived === undefined) { try { await updateDoc(doc(FB.db, "tournaments", t.id), { archived: false }); } catch (e) { console.error(e); } }
}
function watchSite() {
  if (unsubSite || !FB) return;
  unsubSite = onSnapshot(doc(FB.db, "config", "site"), d => {
    const was = SITE.openTesting;
    SITE.openTesting = d.exists() ? d.data().openTesting !== false : true; SITE.loaded = true;
    if (was !== SITE.openTesting) startWatching();
    render();
  }, () => { SITE.loaded = true; });
}
S.onSelect = () => { history.replaceState(null, "", S.tid ? "#" + S.tid : location.pathname); restart(); };
S.onTournaments = () => { if (S.tid) watchCodes(S.tid); backfillArchived(); };

// links look like #<competition id> or #<competition id>.<code>
function readHash() { const [tid, code] = location.hash.slice(1).split("."); return { tid: tid || null, code: code || null }; }
async function handleHash() {
  const { tid, code } = readHash();
  if (tid === "admin") { S.overlayView = adminView; render(); return; }
  S.overlayView = null;
  if (!tid) return;
  if (tid !== S.tid) { S.tid = tid; S.matches = {}; restart(); }
  if (code && AUTH.user) { history.replaceState(null, "", "#" + tid); await joinWithCode(tid, code); }
}
window.addEventListener("hashchange", handleHash);

S.downloads = { async save({ filename, data }) { const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([data], { type: "text/csv" })); a.download = filename; document.body.appendChild(a); a.click(); a.remove(); } };

function boot() {
  const h = readHash(); if (h.tid && h.tid !== "admin") S.tid = h.tid; if (h.tid === "admin") S.overlayView = adminView;
  if (!CONFIGURED) { startWatching(); setTimeout(() => toast("Firebase isn't set up yet, so this is saving on this device only."), 600); return; }
  const app = initializeApp(firebaseConfig);
  FB = { db: getFirestore(app), auth: getAuth(app) };
  if (window.__CARREAU_EMULATOR) { // local testing only
    connectFirestoreEmulator(FB.db, "127.0.0.1", 8080); connectAuthEmulator(FB.auth, "http://127.0.0.1:9099", { disableWarnings: true });
    window.__testGoogle = (email) => signInWithCredential(FB.auth, GoogleAuthProvider.credential(JSON.stringify({ sub: email, email, email_verified: true })));
  }
  S.store = fbStore();
  onAuthStateChanged(FB.auth, async u => {
    if (!u) { try { await signInAnonymously(FB.auth); } catch (e) { console.error(e); toast("Couldn't connect. Check your internet connection and reload."); } return; }
    AUTH.user = u; AUTH.ready = true; watchSite(); restart(); render();
    await handleHash();
  });
}
render();
boot();
