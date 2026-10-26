/* ---------------- web build: Firebase storage, no-login access with share codes ---------------- */
// Beta access model: every device signs in anonymously (no account, nothing to type).
// The device that creates a competition owns it. Owners hand out two private codes:
//   organiser code -> full control, scorer code -> scores and pistes only.
// Helpers open a link containing the code (or type it in) and their device is remembered as a member.
const ADMIN_EMAILS = ["samuelcblakey@gmail.com"]; // site admins (enforced in firestore.rules too)
const isAdmin = () => !!(AUTH.user && !AUTH.user.isAnonymous && ADMIN_EMAILS.includes((AUTH.user.email || "").toLowerCase()));
const SITE = { openTesting: true, teamScoring: false, teamComps: {}, streaming: false, organiserLogin: false, loaded: false }; // streaming: false | "admin" | true // teamScoring: false | "admin" | true // site settings (config/site); open testing is the beta default
const CONFIGURED = firebaseConfig && firebaseConfig.apiKey && !String(firebaseConfig.apiKey).startsWith("PASTE");
const AUTH = { user: null, ready: false };
// organiser login (site switch, off by default): this device's code and what it unlocks; the admin's list of codes
const ORG = { code: null, info: null, busy: false, err: "" };  // info: { label, expiresAt (ms), revoked }
const ORG_DAYS = 3;
let unsubOrg = null, unsubOrgCode = null, unsubOrgCodes = null; const ORGCODES = { list: null, label: "", made: null };
const orgActive = () => !!(ORG.code && ORG.info && !ORG.info.revoked && ORG.info.expiresAt > Date.now());
const loginMode = () => SITE.organiserLogin === true;
const ROLE = {};   // tid -> "edit" | "score" | "team" | "live" (membership of this device)
const LIVECODE = {}; // tid -> stream code (lets a helper's phone run the live desk; only readable by organisers)
let unsubLiveCode = null;
const SROLE = {}, SCODES = {}; // standalone streams: sid -> role of this device ('live'), sid -> desk code (owner only)
let unsubSRole = null, unsubSCode = null;
const CODES = {};  // tid -> { edit, score } (only readable by organisers)
const TEAM = {};   // tid -> team id this device scores for (team links)
const TEAMCODES = {}; // tid -> { teamId: code } (only readable by organisers)
let unsubTeamCodes = null;
let FB = null, unsubRole = null, unsubCodes = null;
const JOINED_KEY = "carreau-joined";
const joined = () => { try { return JSON.parse(lsGet(JOINED_KEY) || "[]"); } catch { return []; } };
const forget = tid => lsSet(JOINED_KEY, JSON.stringify(joined().filter(x => x !== tid)));
S.forgetComp = forget;
const remember = tid => { const j = joined(); if (!j.includes(tid)) { j.push(tid); lsSet(JOINED_KEY, JSON.stringify(j.slice(-50))); } };
const ALPHA = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const newCode = () => { const a = new Uint32Array(8); crypto.getRandomValues(a); return [...a].map(x => ALPHA[x % ALPHA.length]).join(""); };

// writes: count what's waiting for the server (for the connection light); when offline, don't make the
// screen wait for the server to answer: the change is already in the local cache and syncs when back online
const NET = { pending: 0 };
const netChanged = () => { try { renderNet(); } catch {} };
const track = p => {
  NET.pending++; netChanged();
  const done = () => { NET.pending = Math.max(0, NET.pending - 1); netChanged(); }; p.then(done, done);
  if (navigator.onLine === false) { p.catch(e => { console.error(e); toast("A change made offline couldn't be saved."); }); return Promise.resolve(); }
  return p;
};
S.connState = () => !FB ? null : navigator.onLine === false ? { k: "off", label: NET.pending ? `Offline · ${NET.pending} waiting to sync` : "Offline" } : NET.pending ? { k: "sync", label: "Saving…" } : { k: "live", label: "Live" };
addEventListener("online", netChanged); addEventListener("offline", netChanged);
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
        if (ORG.code) subQ("org", query(tc, where("orgCode", "==", ORG.code), where("archived", "==", false), limit(200)));
      }
      new Set([...joined(), S.tid].filter(Boolean)).forEach(tid => subD("t:" + tid, tid));
      return () => { unsubs.forEach(u => u()); unsubs = []; };
    },
    watchMatches(tid, cb, onErr) { return onSnapshot(collection(db, "tournaments", tid, "matches"), s => cb(s.docs.map(d => d.data())), onErr); },
    async setTournament(t) {
      const isNew = !!t._new; const body = clone(t); delete body._new; body.updated = Date.now();
      await track(setDoc(doc(db, "tournaments", t.id), body));
      if (isNew) { // first save of a new competition: create its private codes
        delete t._new; if (S.tournaments[t.id]) delete S.tournaments[t.id]._new;
        const codes = { edit: newCode(), score: newCode() };
        await track(setDoc(doc(db, "tournaments", t.id, "private", "codes"), codes)); CODES[t.id] = codes; render();
      }
    },
    async deleteTournament(tid) {
      if (!isAdmin()) throw Object.assign(new Error("Only the admin can delete competitions."), { code: "permission-denied" }); // never half-delete
      // games go in batches (up to 450 per request) rather than one request per game
      const refs = (await getDocs(collection(db, "tournaments", tid, "matches"))).docs.map(d => d.ref);
      for (let i = 0; i < refs.length; i += 450) { const b = writeBatch(db); refs.slice(i, i + 450).forEach(r => b.delete(r)); await b.commit(); }
      // the extras may be refused by their own rules (e.g. live scores while streaming is off): best effort, side by side
      const extra = [doc(db, "tournaments", tid, "brand", "logo"), doc(db, "tournaments", tid, "private", "codes"), doc(db, "tournaments", tid, "private", "livecode")];
      try { (await getDocs(collection(db, "tournaments", tid, "live"))).docs.forEach(d => extra.push(d.ref)); } catch {}
      await Promise.allSettled(extra.map(r => deleteDoc(r)));
      await deleteDoc(doc(db, "tournaments", tid)); // last, so a failure part-way never leaves games without their competition
    },
    watchLive(tid, mid, cb, onErr) { return onSnapshot(doc(db, "tournaments", tid, "live", mid), d => cb(d.exists() ? d.data() : null), onErr); },
    // club logo: its own small document so the competition document stays light
    watchBrand(tid, cb, onErr) { return onSnapshot(doc(db, "tournaments", tid, "brand", "logo"), d => cb(d.exists() ? d.data() : null), onErr); },
    setBrand(tid, b) { const ref = doc(db, "tournaments", tid, "brand", "logo"); return track(b ? setDoc(ref, b) : deleteDoc(ref)); },
    // standalone streams: this device's own (admin: all)
    watchStreams(cb, onErr) { const sc = collection(db, "streams"); return onSnapshot(isAdmin() ? query(sc, limit(300)) : query(sc, where("ownerUid", "==", AUTH.user?.uid || "-"), limit(100)), s => cb(s.docs.map(d => d.data())), onErr); },
    watchStream(sid, cb, onErr) { return onSnapshot(doc(db, "streams", sid), d => cb(d.exists() ? d.data() : null), onErr); },
    async setStream(st) { const isNew = !!st._new; const body = clone(st); delete body._new; await track(setDoc(doc(db, "streams", st.id), body));
      if (isNew) { delete st._new; const code = newCode(); await track(setDoc(doc(db, "streams", st.id, "private", "code"), { code })); SCODES[st.id] = code; render(); } },
    async deleteStream(sid) { try { await deleteDoc(doc(db, "streams", sid, "private", "code")); } catch {} await deleteDoc(doc(db, "streams", sid)); },
    setLive(tid, mid, L) { return track(setDoc(doc(db, "tournaments", tid, "live", mid), clone(L))); },
    setMatch(tid, m) { return track(setDoc(doc(db, "tournaments", tid, "matches", m.id), clone(m))); },
    updateMatch(tid, id, patch) { return track(updateDoc(doc(db, "tournaments", tid, "matches", id), clone(patch))); },
    deleteMatch(tid, id) { return track(deleteDoc(doc(db, "tournaments", tid, "matches", id))); }
  };
}

const isOwner = t => !!(AUTH.user && t && t.ownerUid === AUTH.user.uid);
S.permFn = t => {
  if (!AUTH.user || !t) return { edit: false, score: false };
  // open testing lets guests run competitions they open, except the examples (listed), which stay view-only.
  // With organiser login on, only a logged-in organiser (for competitions made with their code), the admin, and organiser-link holders can change things.
  const r = isAdmin() ? "edit" : loginMode() ? (orgActive() && t.orgCode === ORG.code ? "edit" : ROLE[t.id])
    : isOwner(t) || (SITE.openTesting && !t.listed) ? "edit" : ROLE[t.id];
  return { edit: r === "edit", score: r === "edit" || r === "score" };
};
S.canCreate = () => !!AUTH.user && (!loginMode() || isAdmin() || orgActive());
// live desk: a phone that opened the live desk link (stream code) can run the desk for this competition's games, nothing else
S.liveRole = t => !!(t && ROLE[t.id] === "live");
// streaming is a site switch: Off / Admin only / Everyone (config/site.streaming, enforced in firestore.rules)
S.streamingOn = () => SITE.streaming === true || (SITE.streaming === "admin" && isAdmin());
// standalone streams: the device that created one owns it; a phone with the desk link joins as 'live'
S.streamMine = st => isAdmin() || st.ownerUid === AUTH.user?.uid;
S.streamCan = st => !!AUTH.user && (isAdmin() || st.ownerUid === AUTH.user.uid || SROLE[st.id] === "live");
S.decorateStream = st => { st.ownerUid = AUTH.user.uid; st._new = true; };
S.streamDeskLink = st => `${base()}#s.${st.id}.desk${SCODES[st.id] ? "." + SCODES[st.id] : ""}`;
function watchStream(sid) {
  unsubSRole?.(); unsubSRole = null; unsubSCode?.(); unsubSCode = null; if (!FB || !AUTH.user || !sid) return;
  unsubSRole = onSnapshot(doc(FB.db, "streams", sid, "members", AUTH.user.uid), d => { SROLE[sid] = d.exists() ? d.data().role : undefined; render();
    const pj = S.pendingStreamJoin; if (pj && pj.sid === sid) { S.pendingStreamJoin = null; const st = S.streams[sid]; if (!d.exists() && !(st && st.ownerUid === AUTH.user.uid) && !isAdmin()) joinStream(sid, pj.code); } }, () => {});
  unsubSCode = onSnapshot(doc(FB.db, "streams", sid, "private", "code"), d => { if (d.exists()) { SCODES[sid] = d.data().code; render(); } }, () => {});
}
async function joinStream(sid, code) {
  try { await setDoc(doc(FB.db, "streams", sid, "members", AUTH.user.uid), { role: "live", code, joinedAt: Date.now() }); SROLE[sid] = "live"; render(); toast("This phone can now run this live desk."); }
  catch (e) { console.error(e); toast("That live desk link didn't work. Ask for a new one."); }
}
S.deskLink = (t, mid) => `${base()}#${t.id}.desk.${mid}${LIVECODE[t.id] ? "." + LIVECODE[t.id] : ""}`;
function watchLiveCode(tid) {
  if (unsubLiveCode || tid !== S.tid) return; const t = S.tournaments[tid]; if (!t || !S.permFn(t).edit) return;
  unsubLiveCode = onSnapshot(doc(FB.db, "tournaments", tid, "private", "livecode"), d => {
    if (d.exists() && d.data().code) { LIVECODE[tid] = d.data().code; render(); return; }
    // organisers create the stream code the first time they look at Setup (also allowed for a plain visitor in open testing)
    if (!LIVECODE[tid] && S.permFn(S.tournaments[tid] || t).edit) { const code = newCode(); setDoc(doc(FB.db, "tournaments", tid, "private", "livecode"), { code }).catch(e => console.warn("stream code", e)); }
  }, () => {});
}
// team score entry has three site states: off, admin only (the admin picks competitions; registered in config/site), everyone
S.teamScoringSetup = t => SITE.teamScoring === true || (SITE.teamScoring === "admin" && isAdmin());
S.teamScoringOn = t => SITE.teamScoring === true || (SITE.teamScoring === "admin" && (isAdmin() || !!(t && SITE.teamComps[t.id])));
S.onFieldSet = async (t, k, v) => {
  if (k !== "scoreMode" || SITE.teamScoring !== "admin" || !isAdmin()) return;
  try { await setDoc(doc(FB.db, "config", "site"), { teamScoringComps: { [t.id]: v !== "organiser" } }, { merge: true }); }
  catch (e) { console.error(e); toast("Couldn't register this competition for team score entry."); }
};
S.viewAllTabs = t => !!t.listed; // examples show every tab, locked
S.myTeam = t => TEAM[t.id] || null;
S.teamPropose = async (t, m, sa, sb, time) => {
  const me = TEAM[t.id]; if (!me) return false;
  const proposal = { sa, sb, by: me, at: Date.now(), status: "pending" }; if (time) proposal.time = true;
  await track(updateDoc(doc(FB.db, "tournaments", t.id, "matches", m.id), { proposal })); S.matches[m.id].proposal = proposal; return true;
};
S.teamRespond = async (t, m, status) => {
  const me = TEAM[t.id]; const p = m.proposal; if (!me || !p) return false;
  const proposal = { ...p, status, confirmedBy: me, respondedAt: Date.now() };
  await track(updateDoc(doc(FB.db, "tournaments", t.id, "matches", m.id), { proposal })); S.matches[m.id].proposal = proposal; return true;
};
// team links: #<competition>.t-<team id>-<code>
async function makeTeamCodes(tid) {
  const t = S.tournaments[tid]; if (!t) return; const have = TEAMCODES[tid] || {}; const add = {};
  (t.teams || []).filter(e => e.active !== false && !have[e.id]).forEach(e => add[e.id] = newCode());
  if (!Object.keys(add).length) { toast("Every team already has a link."); return; }
  try { await setDoc(doc(FB.db, "tournaments", tid, "private", "teamcodes"), add, { merge: true }); TEAMCODES[tid] = { ...have, ...add }; toast(`${Object.keys(add).length} team links created.`); render(); }
  catch (e) { console.error(e); toast("Couldn't create the team links. Check your connection and try again."); }
}
function watchTeamCodes(tid) {
  if (unsubTeamCodes || tid !== S.tid || !S.teamScoringSetup(S.tournaments[tid])) return;
  const t = S.tournaments[tid]; if (!t || !S.permFn(t).edit) return;
  unsubTeamCodes = onSnapshot(doc(FB.db, "tournaments", tid, "private", "teamcodes"), d => { TEAMCODES[tid] = d.exists() ? d.data() : {}; render(); }, () => {});
}
const teamLink = (t, id) => `${base()}#${t.id}.t-${id}-${TEAMCODES[t.id][id]}`;
// QR codes: the generator (public/qr.js) is loaded the first time one is needed, then works offline
let qrLoad = null;
const loadQr = () => window.qrcode ? Promise.resolve(window.qrcode) : (qrLoad = qrLoad || new Promise((res, rej) => { const el = document.createElement("script"); el.src = "qr.js"; el.onload = () => res(window.qrcode); el.onerror = () => { qrLoad = null; rej(new Error("qr.js")); }; document.head.appendChild(el); }));
const qrSvg = url => { const q = window.qrcode(0, "M"); q.addData(url); q.make(); return q.createSvgTag({ cellSize: 4, margin: 2, scalable: true }); };
S.teamQr = null; // team whose QR code is showing
function teamLinksPanel(t) {
  if (!S.teamScoringSetup(t) || !(t.scoreMode === "teams" || t.scoreMode === "teams-auto") || (t.entry !== "teams")) return "";
  watchTeamCodes(t.id);
  const codes = TEAMCODES[t.id] || {}; const teams = (t.teams || []).filter(e => e.active !== false); const missing = teams.filter(e => !codes[e.id]).length;
  return `<div class="panel stack" id="team-links"><div class="spread"><h3>Team links</h3>${teams.length ? `<span class="small muted">${teams.length - missing}/${teams.length} teams have a link</span>` : ""}</div>
    <p class="small muted">Give each team its own link or QR code (for example at check-in). It sets up their phone to enter scores for their games only, and to confirm their opponents' scores.</p>
    ${missing ? `<div><button class="btn primary sm" data-act="team-links-make">${missing === teams.length ? "Create team links" : `Create ${missing} more`}</button></div>` : ""}
    ${teams.filter(e => codes[e.id]).map(e => { const name = e.name || (e.players || []).join(", "); const open = S.teamQr === e.id; return `<div class="erow"><div class="who"><b>${esc(name)}</b></div><input id="tl-${e.id}" value="${esc(teamLink(t, e.id))}" readonly style="flex:1;min-width:160px" class="small"><button class="btn sm" data-act="copy" data-target="tl-${e.id}">Copy</button><button class="btn sm ${open ? "primary" : ""}" data-act="team-qr" data-id="${e.id}" aria-expanded="${open}">${open ? "Hide QR" : "QR code"}</button></div>
      ${open ? `<div class="qr-card" data-notr><div class="qr-name">${esc(name)}</div><div class="qr-box">${window.qrcode ? qrSvg(teamLink(t, e.id)) : `<p class="muted small">Loading…</p>`}</div><p class="small muted">Scan with the phone that will enter this team's scores. It opens SN Pétanque already set up for ${esc(name)}.</p></div>` : ""}`; }).join("")}
  </div>`;
}
// organisers archive; only the admin can delete a competition (also enforced in firestore.rules)
S.canDelete = () => isAdmin();
S.canSeeArchived = () => isAdmin();
S.decorateNew = nt => { nt.ownerUid = AUTH.user.uid; nt.device = deviceLabel(); nt.listed = false; nt._new = true; if (loginMode() && orgActive() && !isAdmin()) nt.orgCode = ORG.code; remember(nt.id); };
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
  if (CONFIGURED && loginMode() && !isAdmin() && !S.liveRoute) {
    const who = orgActive() ? `<button class="btn sm ghost" data-act="org-page" title="${esc(ORG.info.label || "")}"><span class="pill done">Organiser</span></button>` : `<button class="btn sm ghost" data-act="org-page">Organiser login</button>`;
    const t = T(); if (!t) return who;
    const p = S.permFn(t);
    if (orgActive() && p.edit) return who;
    if (t.listed) return `<span class="pill" title="Example competition, view only">Example</span>` + who;
    if (TEAM[t.id]) return `<span class="pill done">Team</span>`;
    if (p.edit) return `<span class="pill done">Organiser</span>`;
    if (p.score) return `<span class="pill done">Scorer</span>`;
    return who;
  }
  const t = T(); if (!CONFIGURED || !t) return "";
  const p = S.permFn(t);
  if (isAdmin()) return `<span class="pill done">Admin</span>`;
  if (SITE.openTesting && t.listed) return `<span class="pill" title="Example competition, view only">Example</span>`;
  if (SITE.openTesting) return `<span class="pill playing" title="Open testing">Test mode</span>`;
  if (isOwner(t)) return `<span class="pill done">Organiser</span>`;
  if (TEAM[t.id]) return `<span class="pill done">Team</span>`;
  if (p.edit) return `<span class="pill done">Organiser</span>`;
  if (p.score) return `<span class="pill done">Scorer</span>`;
  return `<button class="btn sm ghost" data-act="enter-code">Organiser code</button>`;
};
S.welcomeExtra = () => `<p class="muted">Following a competition? Open the link the organiser sent you.</p>${loginMode() ? `<p class="muted">Running one? <button class="btn sm" data-act="org-page">Organiser login</button></p>` : ""}`;
const copyRow = (id, label, value, note) => `<div class="stack" style="gap:6px"><div class="eyebrow">${label}</div>
  <div class="row" style="flex-wrap:nowrap"><input type="text" id="${id}" readonly value="${esc(value)}" aria-label="${label}"><button class="btn" data-act="copy" data-target="${id}">Copy</button></div>
  <p class="small muted">${note}</p></div>`;
S.setupExtra = t => { if (S.permFn(t).edit && S.streamingOn()) watchLiveCode(t.id); return S.permFn(t).edit ? teamLinksPanel(t) + sharingPanel(t) : ""; }; // view-only examples: no sharing box
const sharingPanel = t => {
  if (!CONFIGURED) return "";
  const l = links(t);
  if (SITE.openTesting && !loginMode()) return `<div class="panel stack">
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
  if (act === "install-app") { await installApp(); return; }
  if (act === "install-dismiss") { try { localStorage.setItem("carreau-install-dismissed", "1"); } catch {} render(); toast("You can add it later from the competition menu."); return; }
  if (act === "install-close") { INSTALL.help = false; try { localStorage.setItem("carreau-install-dismissed", "1"); } catch {} render(); return; }
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
    try { await setDoc(doc(FB.db, "config", "site"), { openTesting: on, updated: Date.now() }, { merge: true }); toast(on ? "Open testing is on." : "Open testing is off."); }
    catch (e) { console.error(e); toast("That setting didn't save."); }
    return;
  }
  if (act === "team-scoring") {
    const mode = a.dataset.mode; const on = mode === "all" ? true : mode === "admin" ? "admin" : false;
    try { await setDoc(doc(FB.db, "config", "site"), { teamScoring: on, updated: Date.now() }, { merge: true }); toast(on === true ? "Team score entry is available to every organiser." : on === "admin" ? "Team score entry is available to you only." : "Team score entry is switched off."); }
    catch (e) { console.error(e); toast("That setting didn't save."); }
    return;
  }
  if (act === "streaming-mode") {
    const mode = a.dataset.mode; const on = mode === "all" ? true : mode === "admin" ? "admin" : false;
    try { await setDoc(doc(FB.db, "config", "site"), { streaming: on, updated: Date.now() }, { merge: true }); toast(on === true ? "Competition game overlays are on for everyone." : on === "admin" ? "Competition game overlays are on for you only." : "Competition game overlays are switched off."); }
    catch (e) { console.error(e); toast("That setting didn't save."); }
    return;
  }
  if (act === "org-login") { await orgLogin(document.getElementById("org-code")?.value); return; }
  if (act === "org-logout") { await orgLogout(); return; }
  if (act === "org-page") { location.hash = "#login"; return; }
  if (act === "org-new") { S.overlayView = null; history.replaceState(null, "", location.pathname); render(); document.querySelector('#tsel [data-act="new-t"], [data-act="new-t"]')?.click(); return; }
  if (act === "org-back") { history.replaceState(null, "", S.tid ? "#" + S.tid : location.pathname); S.overlayView = null; render(); return; }
  if (act === "organiser-login") {
    const on = a.dataset.on === "1";
    try { await setDoc(doc(FB.db, "config", "site"), { organiserLogin: on, updated: Date.now() }, { merge: true }); toast(on ? "Organiser login is live. Only organisers with a code can create competitions." : "Organiser login is off."); }
    catch (e) { console.error(e); toast("That setting didn't save."); }
    return;
  }
  if (act === "org-make") { await makeOrgCode(); return; }
  if (act === "org-revoke" || act === "org-extend" || act === "org-restore") {
    const ref = doc(FB.db, "orgcodes", a.dataset.code);
    const patch = act === "org-revoke" ? { revoked: true } : act === "org-restore" ? { revoked: false } : { expiresAt: new Date(Math.max(Date.now(), +a.dataset.exp || 0) + ORG_DAYS * 864e5) };
    try { await updateDoc(ref, patch); toast(act === "org-revoke" ? "Code revoked. It stops working straight away." : act === "org-restore" ? "Code restored." : `Code extended by ${ORG_DAYS} days.`); }
    catch (e) { console.error(e); toast("That change didn't save."); }
    return;
  }
  if (act === "team-links-make") { await makeTeamCodes(S.tid); return; }
  if (act === "team-qr") {
    const id = a.dataset.id; if (S.teamQr === id) { S.teamQr = null; render(); return; }
    try { await loadQr(); } catch { toast("Couldn't load the QR code generator. The link next to the team still works."); return; }
    S.teamQr = id; render(); setTimeout(() => document.querySelector(".qr-card")?.scrollIntoView({ block: "nearest", behavior: "smooth" }), 0); return;
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

async function joinTeam(tid, teamId, code) {
  const ref = doc(FB.db, "tournaments", tid, "members", AUTH.user.uid);
  try { await setDoc(ref, { role: "team", teamId, code, joinedAt: Date.now() }); TEAM[tid] = teamId; remember(tid); restart(); S.tab = "draw"; render();
    const t = S.tournaments[tid]; const nm = t?.teams?.find(e => e.id === teamId)?.name; toast(`This phone now enters scores for ${nm || "your team"}.`); return true; }
  catch (e) { console.error(e); toast("That team link didn't work. Ask the organiser for a new one."); return false; }
}
async function joinWithCode(tid, raw) {
  const tm = /^t-([A-Za-z0-9]+)-([A-Z0-9]+)$/.exec(String(raw || "")); if (tm && tid && AUTH.user) return joinTeam(tid, tm[1], tm[2]);
  const code = String(raw || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (!code || !tid || !AUTH.user) return false;
  const ref = doc(FB.db, "tournaments", tid, "members", AUTH.user.uid);
  for (const role of ["edit", "score", "live"]) {
    try {
      await setDoc(ref, { role, code, joinedAt: Date.now() });
      ROLE[tid] = role; remember(tid); restart(); render();
      toast(role === "edit" ? "You're now an organiser for this competition." : role === "score" ? "You can now enter scores for this competition." : "This phone can now run the live desk for this competition.");
      return true;
    } catch (e) { /* not this role: try the next */ }
  }
  toast("That code didn't work. Check it with the organiser.");
  return false;
}

/* ---------- organiser login ---------- */
// The admin creates codes (orgcodes/{code}: label, expiresAt, revoked). An organiser types one in on #login; the device
// records it in organisers/{uid} (the rules only accept a valid, unexpired code) and can then create competitions, which
// carry the code, so any device logged in with the same code can run them. Codes stop working when they expire.
const msOf = v => v == null ? 0 : typeof v === "number" ? v : v.toMillis ? v.toMillis() : +new Date(v);
function watchOrg() {
  unsubOrg?.(); unsubOrg = null; if (!FB || !AUTH.user) return;
  unsubOrg = onSnapshot(doc(FB.db, "organisers", AUTH.user.uid), d => {
    const code = d.exists() ? d.data().code : null;
    if (code !== ORG.code) { ORG.code = code; ORG.info = null; unsubOrgCode?.(); unsubOrgCode = null;
      if (code) unsubOrgCode = onSnapshot(doc(FB.db, "orgcodes", code), c => { ORG.info = c.exists() ? { label: c.data().label || "", expiresAt: msOf(c.data().expiresAt), revoked: !!c.data().revoked } : { label: "", expiresAt: 0, revoked: true }; startWatching(); render(); }, () => { ORG.info = null; render(); });
      startWatching(); }
    render();
  }, () => {});
}
async function orgLogin(raw) {
  const code = String(raw || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (!code) { ORG.err = "Type the code you were given."; render(); return; }
  ORG.busy = true; ORG.err = ""; render();
  try { await setDoc(doc(FB.db, "organisers", AUTH.user.uid), { code, at: Date.now() }); ORG.busy = false; toast("You're logged in as an organiser."); history.replaceState(null, "", "#login"); render(); }
  catch (e) { console.error(e); ORG.busy = false; ORG.err = "That code isn't valid or has expired. Check it with the SN Pétanque admin."; render(); }
}
async function orgLogout() {
  try { await deleteDoc(doc(FB.db, "organisers", AUTH.user.uid)); } catch (e) { console.error(e); }
  ORG.code = null; ORG.info = null; unsubOrgCode?.(); unsubOrgCode = null; startWatching(); toast("Logged out. Your competitions are kept; log in again with the same code to run them."); render();
}
const until = ms => { const h = Math.max(0, Math.round((ms - Date.now()) / 36e5)); return h >= 48 ? `${Math.round(h / 24)} days` : h >= 1 ? `${h} hour${h === 1 ? "" : "s"}` : "less than an hour"; };
const dayTime = ms => new Date(ms).toLocaleString(undefined, { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
function loginView() {
  const back = `<button class="btn sm" data-act="org-back">Back to competitions</button>`;
  if (!loginMode() && !isAdmin()) return `<div class="stack" style="max-width:560px"><div class="spread"><h2>Organiser login</h2>${back}</div>
    <div class="panel stack"><p>Organiser login isn't switched on yet. For now, anyone can create a competition from the competition menu.</p></div></div>`;
  const mine = Object.values(S.tournaments).filter(t => ORG.code && t.orgCode === ORG.code && !t.archived).sort((a, b) => (b.created || 0) - (a.created || 0));
  if (ORG.code && ORG.info) {
    const ok = orgActive();
    return `<div class="stack" style="max-width:640px"><div class="spread"><h2>Organiser</h2>${back}</div>
      <div class="panel stack ${ok ? "" : "rp-live"}">
        ${ORG.info.label ? `<div class="eyebrow" data-notr>${esc(ORG.info.label)}</div>` : ""}
        <p>${ok ? `You're logged in with code <b data-notr>${esc(ORG.code)}</b>. It works until <b>${esc(dayTime(ORG.info.expiresAt))}</b> (${until(ORG.info.expiresAt)} left).` : ORG.info.revoked ? `Code <b data-notr>${esc(ORG.code)}</b> has been switched off by the admin.` : `Code <b data-notr>${esc(ORG.code)}</b> expired on ${esc(dayTime(ORG.info.expiresAt))}.`}</p>
        <p class="small muted">${ok ? "You can create competitions and run them. Log in with the same code on another phone or laptop and you'll see the same competitions there." : "Your competitions are kept and everyone can still follow them, but they can't be changed any more. Ask the admin for a new code if you need more time."}</p>
        <div class="row">${ok ? `<button class="btn primary" data-act="org-new">Create a competition</button>` : ""}<button class="btn" data-act="org-logout">Log out</button></div>
      </div>
      ${mine.length ? `<div class="panel stack" style="gap:6px"><h3>Your competitions</h3>${mine.map(t => `<div class="erow"><div class="who"><b data-notr>${esc(t.name)}</b><span class="small muted">${esc(statusOf(t))}</span></div><a class="btn sm" href="#${t.id}">Open</a></div>`).join("")}</div>` : ""}
    </div>`;
  }
  return `<div class="stack" style="max-width:560px"><div class="spread"><h2>Organiser login</h2>${back}</div>
    <div class="panel stack">
      ${!loginMode() ? `<div class="notice">Organiser login is switched off, so this page isn't live yet. You're seeing it because you're the admin.</div>` : ""}
      <p>Enter the organiser code you were given. Codes last ${ORG_DAYS} days.</p>
      <input type="text" id="org-code" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="e.g. K7RM2QXP" value="${esc(ORG.prefill || "")}" style="font-size:22px;letter-spacing:.12em;text-transform:uppercase">
      ${ORG.err ? `<div class="notice">${esc(ORG.err)}</div>` : ""}
      <div><button class="btn primary" data-act="org-login" ${ORG.busy ? "disabled" : ""}>${ORG.busy ? "Checking…" : "Log in"}</button></div>
      <p class="small muted">Just following a competition? You don't need a code: open the link the organiser sent you.</p>
    </div></div>`;
}
document.addEventListener("keydown", e => { if (e.key === "Enter" && e.target.id === "org-code") { e.preventDefault(); document.querySelector('[data-act="org-login"]')?.click(); } });
// admin: organiser codes
function watchOrgCodes() {
  if (unsubOrgCodes || !isAdmin() || !FB) return;
  unsubOrgCodes = onSnapshot(query(collection(FB.db, "orgcodes"), limit(300)), s => { ORGCODES.list = s.docs.map(d => ({ code: d.id, ...d.data(), expiresAt: msOf(d.data().expiresAt), createdAt: msOf(d.data().createdAt) })); if (S.overlayView) render(); }, e => { console.error(e); ORGCODES.list = []; });
}
async function makeOrgCode() {
  const label = (document.getElementById("org-label")?.value || "").trim().slice(0, 60);
  const code = newCode(); const now = Date.now();
  try { await setDoc(doc(FB.db, "orgcodes", code), { label, createdAt: new Date(now), expiresAt: new Date(now + ORG_DAYS * 864e5), revoked: false, by: AUTH.user.email || "" });
    ORGCODES.made = code; ORGCODES.label = ""; toast(`Code ${code} created, valid for ${ORG_DAYS} days.`); render(); }
  catch (e) { console.error(e); toast("Couldn't create the code."); }
}
function orgAdminPanel() {
  watchOrgCodes();
  const list = (ORGCODES.list || []).slice().sort((a, b) => b.createdAt - a.createdAt); const now = Date.now();
  const state = c => c.revoked ? ["Revoked", ""] : c.expiresAt > now ? [`${until(c.expiresAt)} left`, "playing"] : ["Expired", ""];
  return `<div class="panel stack" id="adm-org">
      <div class="spread"><h3>Organiser login</h3><span class="pill ${loginMode() ? "playing" : ""}">${loginMode() ? "Live" : "Off"}</span></div>
      <p class="muted">${loginMode() ? "Live: only organisers who log in with a code you give them can create competitions. Everyone else can follow competitions and view the examples. Open testing doesn't apply while this is on." : `Off: nothing changes for visitors (${SITE.openTesting ? "open testing applies" : "open testing is off"}). You can make codes now and test the login page at <a href="#login">#login</a> before going live.`}</p>
      <div><button class="btn ${loginMode() ? "" : "primary"}" data-act="organiser-login" data-on="${loginMode() ? "0" : "1"}">${loginMode() ? "Turn organiser login off" : "Make organiser login live"}</button></div>
      <h3 style="margin-top:8px">Organiser codes</h3>
      <p class="small muted">Each code works for ${ORG_DAYS} days from when you create it. Competitions are saved against the code, so the organiser sees them on any device they log in on. Give the organiser the code or the login link.</p>
      <div class="row" style="flex-wrap:wrap;gap:6px"><input id="org-label" placeholder="Who it's for, e.g. Bristol PC · Spring Triples" value="${esc(ORGCODES.label)}" style="max-width:320px"><button class="btn primary" data-act="org-make">Create a code</button></div>
      ${ORGCODES.made ? `<div class="notice stack" style="gap:6px"><b>New code: <span data-notr style="letter-spacing:.12em">${esc(ORGCODES.made)}</span></b>${copyRow("org-link", "Login link", `${base()}#login.${ORGCODES.made}`, "Opens the organiser login with the code filled in.")}</div>` : ""}
      ${ORGCODES.list === null ? `<p class="small muted">Loading codes…</p>` : !list.length ? `<p class="small muted">No codes yet.</p>` : list.map(c => { const [st, cls] = state(c); return `<div class="erow">
        <div class="who"><b data-notr style="letter-spacing:.08em">${esc(c.code)}</b><span class="small muted"><span data-notr>${esc(c.label || "No label")}</span> · created ${when(c.createdAt)} · ${c.expiresAt > now ? "expires" : "expired"} ${when(c.expiresAt)} · ${Object.values(S.tournaments).filter(t => t.orgCode === c.code).length} competitions</span></div>
        <span class="pill ${cls}">${st}</span>
        ${c.revoked ? `<button class="btn sm" data-act="org-restore" data-code="${esc(c.code)}">Restore</button>` : `<button class="btn sm" data-act="org-extend" data-code="${esc(c.code)}" data-exp="${c.expiresAt}">+${ORG_DAYS} days</button><button class="btn sm danger" data-act="org-revoke" data-code="${esc(c.code)}">Revoke</button>`}</div>`; }).join("")}
    </div>`;
}

function watchRole() {
  unsubRole?.(); unsubRole = null; unsubCodes?.(); unsubCodes = null; unsubTeamCodes?.(); unsubTeamCodes = null; unsubLiveCode?.(); unsubLiveCode = null;
  if (!FB || !AUTH.user || !S.tid) return;
  const tid = S.tid;
  unsubRole = onSnapshot(doc(FB.db, "tournaments", tid, "members", AUTH.user.uid),
    d => { ROLE[tid] = d.exists() ? d.data().role : undefined; TEAM[tid] = d.exists() && d.data().role === "team" ? d.data().teamId : undefined; if (d.exists()) remember(tid); render(); watchCodes(tid);
      // a live desk link carries the stream code: phones with no role yet join as live desk helpers; organisers and teams keep what they have
      const pj = S.pendingLiveJoin; if (pj && pj.tid === tid) { S.pendingLiveJoin = null; if (!d.exists() && !isOwner(S.tournaments[tid]) && !isAdmin()) joinWithCode(tid, pj.code); } },
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
    ${orgAdminPanel()}
    <div class="panel stack">
      <div class="spread"><h3>Team score entry <span class="small muted">beta</span></h3><span class="pill ${SITE.teamScoring ? "playing" : ""}">${SITE.teamScoring === true ? "Everyone" : SITE.teamScoring === "admin" ? "Admin only" : "Off"}</span></div>
      <p class="muted">${SITE.teamScoring === true ? "Every organiser can choose, in a competition's Setup, to let teams enter scores on their phones with the other team confirming." : SITE.teamScoring === "admin" ? "Only you see the Score entry choice in Setup (on any competition you open while signed in here). Teams can only submit scores on competitions you switched on; other organisers can't turn it on." : "Hidden from everyone. Each team gets a link; the other team confirms the score; disputes come to the organiser."}</p>
      <div class="seg" role="group" aria-label="Team score entry">${[["off", "Off"], ["admin", "Admin only"], ["all", "Everyone"]].map(([m, l]) => `<button type="button" data-act="team-scoring" data-mode="${m}" aria-pressed="${(SITE.teamScoring === true ? "all" : SITE.teamScoring === "admin" ? "admin" : "off") === m}">${l}</button>`).join("")}</div>
    </div>
    <div class="panel stack">
      <div class="spread"><h3>Competition game overlays <span class="small muted">beta</span></h3><span class="pill ${SITE.streaming ? "playing" : ""}">${SITE.streaming === true ? "Everyone" : SITE.streaming === "admin" ? "Admin only" : "Off"}</span></div>
      <p class="muted">The Stream tab (stand-alone streams: type two team names, get the overlay and live desk) is open to everyone. This switch adds the competition's own games to that tab, with overlays and live desks fed by the competition's scores. ${SITE.streaming === true ? "Currently on for every organiser." : SITE.streaming === "admin" ? "Currently only you see it." : "Currently hidden, and the rules refuse live-score writes on competition games."}</p>
      <div class="seg" role="group" aria-label="Streaming">${[["off", "Off"], ["admin", "Admin only"], ["all", "Everyone"]].map(([m, l]) => `<button type="button" data-act="streaming-mode" data-mode="${m}" aria-pressed="${(SITE.streaming === true ? "all" : SITE.streaming === "admin" ? "admin" : "off") === m}">${l}</button>`).join("")}</div>
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
    const one = async id => {
      try { if (del) { await S.store.deleteTournament(id); delete S.tournaments[id]; if (S.tid === id) S.tid = null; } else await updateDoc(doc(FB.db, "tournaments", id), { archived: true }); ok++; ADM.sel.delete(id); }
      catch (e) { console.error(e); failed++; }
      ADM.busy = `${del ? "Deleting" : "Archiving"}… ${ok + failed} of ${ids.length} done`; render();
    };
    ADM.busy = `${del ? "Deleting" : "Archiving"}… 0 of ${ids.length} done`; render();
    // four at a time: much quicker than one by one, without flooding the connection
    const queue = ids.slice(); await Promise.all(Array.from({ length: Math.min(4, ids.length) }, async () => { while (queue.length) await one(queue.shift()); }));
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
    const was = SITE.openTesting, wasLogin = SITE.organiserLogin;
    SITE.organiserLogin = d.exists() ? d.data().organiserLogin === true : false;
    SITE.openTesting = d.exists() ? d.data().openTesting !== false : true; SITE.teamScoring = d.exists() ? (d.data().teamScoring === true ? true : d.data().teamScoring === "admin" ? "admin" : false) : false; SITE.teamComps = d.exists() ? (d.data().teamScoringComps || {}) : {}; SITE.streaming = d.exists() ? (d.data().streaming === true ? true : d.data().streaming === "admin" ? "admin" : false) : false; SITE.loaded = true;
    if (was !== SITE.openTesting || wasLogin !== SITE.organiserLogin) startWatching();
    render();
  }, () => { SITE.loaded = true; });
}
S.onSelect = () => { history.replaceState(null, "", S.tid ? "#" + S.tid : location.pathname); restart(); };
S.onTournaments = () => { if (S.tid) watchCodes(S.tid); backfillArchived(); };

// links look like #<competition id> or #<competition id>.<code>; stream overlays and live desks: #<competition id>.stream.<game> / .desk.<game>[.<stream code>]
function readHash() { const [tid, code] = location.hash.slice(1).split("?")[0].split("."); return { tid: tid || null, code: code || null }; }
async function handleHash() {
  const lr = parseLiveHash(); S.liveRoute = lr; S.overlayView = null; S.picker = false;
  if (lr) {
    if (lr.sid) { if (lr.code) { history.replaceState(null, "", location.hash.replace("." + lr.code, "")); S.pendingStreamJoin = { sid: lr.sid, code: lr.code }; } watchStream(lr.sid); liveWatch(); render(); return; }
    if (lr.view === "streams") { liveWatch(); render(); return; }
    if (lr.code) { history.replaceState(null, "", location.hash.replace("." + lr.code, "")); S.pendingLiveJoin = { tid: lr.tid, code: lr.code }; }
    if (lr.tid !== S.tid) { S.tid = lr.tid; S.matches = {}; restart(); } else if (S.pendingLiveJoin) watchRole();
    liveWatch(); render(); return;
  }
  const { tid, code } = readHash();
  if (tid === "admin") { S.overlayView = adminView; render(); return; }
  if (tid === "login") { if (code) { ORG.prefill = code; history.replaceState(null, "", "#login"); if (AUTH.user && loginMode() && !orgActive()) await orgLogin(code); } S.overlayView = loginView; render(); return; }
  if (!tid) { render(); return; }
  if (tid !== S.tid) { S.tid = tid; S.matches = {}; restart(); }
  liveWatch(); render();
  if (code && AUTH.user) { history.replaceState(null, "", "#" + tid); await joinWithCode(tid, code); }
}
window.addEventListener("hashchange", handleHash);

S.downloads = { async save({ filename, data }) { const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([data], { type: "text/csv" })); a.download = filename; document.body.appendChild(a); a.click(); a.remove(); } };

// ---------- install to home screen ----------
const INSTALL = { prompt: null, help: false };
const isStandalone = () => matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;
const isIOS = () => /iPhone|iPad|iPod/.test(navigator.userAgent) || (/Macintosh/.test(navigator.userAgent) && navigator.maxTouchPoints > 1);
const canInstall = () => !isStandalone() && (!!INSTALL.prompt || isIOS());
const installDismissed = () => { try { return localStorage.getItem("carreau-install-dismissed") === "1"; } catch { return false; } };
window.addEventListener("beforeinstallprompt", e => { e.preventDefault(); INSTALL.prompt = e; render(); });
window.addEventListener("appinstalled", () => { INSTALL.prompt = null; render(); toast("SN Pétanque is on your home screen."); });
function installHelp() {
  return `<div class="stack" style="gap:6px"><b>Add SN Pétanque to your home screen</b>
    <ol class="small" style="margin:0;padding-left:20px"><li>In Safari, tap the <b>Share</b> button (the square with an arrow, at the bottom or top of the screen).</li>
    <li>Scroll down and tap <b>Add to Home Screen</b>.</li><li>Tap <b>Add</b>. SN Pétanque then opens full screen like an app.</li></ol>
    <span class="small muted">Using Chrome on iPhone? Tap the Share button in the address bar, then Add to Home Screen.</span></div>`;
}
S.topBanner = () => {
  if (!canInstall() || (installDismissed() && !INSTALL.help)) return "";
  if (INSTALL.help) return `<div class="notice stack install-banner" style="margin-bottom:16px;gap:10px">${installHelp()}<div><button class="btn sm" data-act="install-close">Done</button></div></div>`;
  if (!matchMedia("(max-width: 900px), (pointer: coarse)").matches) return "";
  return `<div class="notice spread install-banner" style="margin-bottom:16px"><span><b>Get the app.</b> Add SN Pétanque to your home screen for one-tap access, full screen.</span>
    <span class="row"><button class="btn primary sm" data-act="install-app">Add to home screen</button><button class="btn sm ghost" data-act="install-dismiss">Not now</button></span></div>`;
};
S.pickerFooter = () => canInstall() ? `<button type="button" class="pick-row" data-act="install-app"><span class="pr-main"><b>Add SN Pétanque to your home screen</b><span class="small muted">Opens full screen, one tap away</span></span></button>` : "";
async function installApp() {
  if (INSTALL.prompt) { const p = INSTALL.prompt; INSTALL.prompt = null; try { await p.prompt(); const c = await p.userChoice; if (c?.outcome !== "accepted") INSTALL.prompt = null; } catch (e) { console.error(e); } render(); return; }
  INSTALL.help = true; S.picker = false; render(); scrollTo({ top: 0, behavior: "smooth" });
}
if ("serviceWorker" in navigator && (location.protocol === "https:" || window.__CARREAU_TEST_SW)) {
  addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(e => console.warn("Service worker not registered", e)));
}

function boot() {
  const h = readHash(); if (h.tid && h.tid !== "admin" && h.tid !== "login") S.tid = h.tid; if (h.tid === "admin") S.overlayView = adminView; if (h.tid === "login") S.overlayView = loginView;
  const lr = parseLiveHash(); if (lr) { if (lr.tid) S.tid = lr.tid; S.liveRoute = lr; }
  if (!CONFIGURED) { startWatching(); setTimeout(() => toast("Firebase isn't set up yet, so this is saving on this device only."), 600); return; }
  const app = initializeApp(firebaseConfig);
  // keep a copy of what this device has seen (IndexedDB): competitions open instantly next time and keep working offline
  let db; try { db = initializeFirestore(app, { localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }) }); } catch (e) { console.warn("Offline cache unavailable", e); db = getFirestore(app); }
  FB = { db, auth: getAuth(app) };
  if (window.__CARREAU_EMULATOR) { // local testing only
    connectFirestoreEmulator(FB.db, "127.0.0.1", 8080); connectAuthEmulator(FB.auth, "http://127.0.0.1:9099", { disableWarnings: true });
    window.__testGoogle = (email) => signInWithCredential(FB.auth, GoogleAuthProvider.credential(JSON.stringify({ sub: email, email, email_verified: true })));
    window.__testSetSite = data => setDoc(doc(FB.db, "config", "site"), data, { merge: true });
    window.__testDoc = (path, data) => setDoc(doc(FB.db, ...path.split("/")), data, { merge: true });
    window.__testOrg = () => ({ code: ORG.code, active: orgActive(), canCreate: S.canCreate() });
    window.__testUid = () => AUTH.user?.uid;
  }
  S.store = fbStore();
  onAuthStateChanged(FB.auth, async u => {
    if (!u) { try { await signInAnonymously(FB.auth); } catch (e) { console.error(e); toast("Couldn't connect. Check your internet connection and reload."); } return; }
    AUTH.user = u; AUTH.ready = true; watchSite(); watchOrg(); restart(); render();
    await handleHash();
  });
}
render();
boot();
