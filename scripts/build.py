"""Builds the GitHub Pages version from carreau.html (the Claude artifact source)."""
import os, re, json, hashlib, subprocess, shutil
here = os.path.dirname(os.path.abspath(__file__)); root = os.path.dirname(here)
src = open(os.path.join(root, "src", "carreau.html")).read()
boot = open(os.path.join(root, "src", "web-boot.js")).read()

start, end = "/* @@BOOT-START */", "/* @@BOOT-END */"
a, b = src.index(start), src.index(end) + len(end)
body = src[:a] + boot + src[b:]

# translations: each language becomes its own file (dist/lang/<code>-<hash>.json) that the page fetches only when that
# language is chosen, so English visitors download none of them and everyone else just one. Node runs the block
# between the @@I18N-DATA markers to get the final tables; the page keeps empty ones and the list of files.
i18n_a, i18n_b = body.index("/* @@I18N-DATA-START"), body.index("/* @@I18N-DATA-END */")
region = body[body.index("*/", i18n_a) + 2:i18n_b]
dump = "const out = (() => {\n" + region + "\nreturn { fr: FR_TEXT, ...LANG_TEXT };\n})();\nprocess.stdout.write(JSON.stringify(out));"
langs = json.loads(subprocess.run(["node", "-"], input=dump, capture_output=True, text=True, check=True).stdout)
assert len(langs) >= 7 and all(len(d) > 500 for d in langs.values()), "every language should have its translations"
lang_files = {}
for code, table in langs.items():
    blob = json.dumps(table, ensure_ascii=False, separators=(",", ":"))
    lang_files[code] = (f"{code}-{hashlib.md5(blob.encode()).hexdigest()[:8]}.json", blob)
stub = "\nconst FR_TEXT = {};\nconst LANG_TEXT = " + json.dumps({c: {} for c in langs if c != "fr"}) + ";\n"
body = body[:i18n_a] + stub + body[i18n_b + len("/* @@I18N-DATA-END */"):]
assert body.count("/* @@I18N-FILES */ null") == 1
body = body.replace("/* @@I18N-FILES */ null", json.dumps({c: f for c, (f, _) in lang_files.items()}), 1)

V = "10.12.2"
imports = f'''import {{ initializeApp }} from "https://www.gstatic.com/firebasejs/{V}/firebase-app.js";
import {{ getFirestore, initializeFirestore, persistentLocalCache, persistentMultipleTabManager, connectFirestoreEmulator, doc, collection, onSnapshot, setDoc, updateDoc, deleteDoc, deleteField, serverTimestamp, getDocs, getDocFromServer, writeBatch, runTransaction, query, where, limit, getCountFromServer, waitForPendingWrites }} from "https://www.gstatic.com/firebasejs/{V}/firebase-firestore.js";
import {{ getAuth, connectAuthEmulator, onAuthStateChanged, signInAnonymously, GoogleAuthProvider, signInWithPopup, reauthenticateWithPopup, signInWithCredential, signOut }} from "https://www.gstatic.com/firebasejs/{V}/firebase-auth.js";
import {{ firebaseConfig }} from "./firebase-config.js";
'''
body = body.replace("<script>\n(() => {", '<script type="module">\n' + imports + "(() => {", 1)
assert '<script type="module">' in body

# move <title>/<meta>/<link>/<style> into <head>; the rest into <body>
head_end = body.index("</style>") + len("</style>")
head_part, body_part = body[:head_end], body[head_end:]
reset = """<style>
:root{color-scheme:light;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}
body{margin:0}img{max-width:100%}[hidden]{display:none!important}
</style>"""
html = f"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="description" content="Run petanque competitions live: draws, pistes and scores for everyone.">
<meta name="theme-color" content="#1d6a54">
<link rel="manifest" href="manifest.webmanifest">
<link rel="preconnect" href="https://www.gstatic.com" crossorigin>
<link rel="preconnect" href="https://identitytoolkit.googleapis.com" crossorigin>
<link rel="preconnect" href="https://firestore.googleapis.com" crossorigin>
<link rel="modulepreload" href="https://www.gstatic.com/firebasejs/{V}/firebase-app.js">
<link rel="modulepreload" href="https://www.gstatic.com/firebasejs/{V}/firebase-firestore.js">
<link rel="modulepreload" href="https://www.gstatic.com/firebasejs/{V}/firebase-auth.js">
<link rel="modulepreload" href="firebase-config.js">
<link rel="icon" type="image/png" sizes="32x32" href="favicon-32.png">
<link rel="apple-touch-icon" href="apple-touch-icon.png">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="SN Pétanque">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
{reset}
{head_part.replace('<meta name="claude:viewport-fit-sides" content="cover">', '').replace('<meta charset="utf-8">', '', 1)}
</head>
<body>
{body_part}
</body>
</html>
"""
# the page may only declare its character set once (a W3C validation error otherwise)
assert html.lower().count("<meta charset") == 1, "dist/index.html must have exactly one <meta charset>"
out = os.path.join(root, "dist")
os.makedirs(out, exist_ok=True)
open(os.path.join(out, "index.html"), "w").write(html)
langdir = os.path.join(out, "lang"); shutil.rmtree(langdir, ignore_errors=True); os.makedirs(langdir)
for name, blob in lang_files.values(): open(os.path.join(langdir, name), "w", encoding="utf-8").write(blob)
# minify the live page (smaller, much harder to read or copy); CARREAU_NO_MINIFY=1 keeps it readable for debugging
if os.environ.get("CARREAU_NO_MINIFY") != "1":
    subprocess.run(["node", os.path.join(here, "minify.js"), os.path.join(out, "index.html")], check=True)
    html = open(os.path.join(out, "index.html")).read()
# event pages (event-page): each src/events/<slug>.json becomes dist/<slug>/index.html, the same page with the event's own
# link-preview tags (Facebook and WhatsApp read the HTML at that address, so no redirect), <base href="/"> so every relative
# path (fonts, icons, manifest, sw.js, firebase-config.js, lang/) still resolves from the site's root, and the event's slug.
# Every page also gets the list of events (SN_EVENTS), so a Pick the Winner private link can point at its event page.
SITE_URL = os.environ.get("CARREAU_SITE_URL", "https://snpetanque.com")
events = []
evdir = os.path.join(root, "src", "events")
for f in sorted(os.listdir(evdir)) if os.path.isdir(evdir) else []:
    if not f.endswith(".json"): continue
    ev = json.load(open(os.path.join(evdir, f), encoding="utf-8"))
    assert re.fullmatch(r"[a-z0-9][a-z0-9-]*", ev.get("slug", "")) and ev["slug"] + ".json" == f, f"{f}: slug must be the file's name (a-z, 0-9, -)"
    assert ev["slug"] not in ("lang", "fonts", "videos"), f"{f}: slug clashes with a folder of the site"
    assert ev.get("title") and ev.get("tabs") and all(t.get("key") and t.get("label") and re.fullmatch(r"[A-Za-z0-9]+", t.get("tid", "")) and t.get("view") in ("pick", "results") for t in ev["tabs"]), f"{f}: needs a title and tabs (key, label, tid, view pick|results)"
    events.append(ev)
def esc_attr(s): return (str(s).replace("&", "&amp;").replace('"', "&quot;").replace("<", "&lt;").replace(">", "&gt;"))
ev_script = "<script>window.SN_EVENTS=" + json.dumps(events, ensure_ascii=False, separators=(",", ":")).replace("</", "<\\/") + ";</script>"
assert 0 < html.index("</head>") < html.index("<body"), "the page's own </head> comes first"
html = html.replace("</head>", ev_script + "\n</head>", 1)
open(os.path.join(out, "index.html"), "w").write(html)
pages = [html]
for ev in events:
    sh = ev.get("share") or {}; url = f"{SITE_URL}/{ev['slug']}"
    title, desc = sh.get("title") or ev["title"], sh.get("description") or ev.get("subtitle") or ""
    tags = [f'<meta property="og:type" content="website">', f'<meta property="og:site_name" content="SN Pétanque">',
            f'<meta property="og:title" content="{esc_attr(title)}">', f'<meta property="og:description" content="{esc_attr(desc)}">',
            f'<meta property="og:url" content="{esc_attr(url)}">']
    if sh.get("image"): tags += [f'<meta property="og:image" content="{esc_attr(SITE_URL + "/" + sh["image"])}">', '<meta property="og:image:width" content="1200">', '<meta property="og:image:height" content="630">']
    tags += [f'<meta name="twitter:card" content="{"summary_large_image" if sh.get("image") else "summary"}">', f'<meta name="twitter:title" content="{esc_attr(title)}">', f'<meta name="twitter:description" content="{esc_attr(desc)}">']
    if sh.get("image"): tags.append(f'<meta name="twitter:image" content="{esc_attr(SITE_URL + "/" + sh["image"])}">')
    page = html.replace('<meta charset="utf-8">', '<meta charset="utf-8">\n<base href="/">', 1)
    page = re.sub(r'<meta name="description" content="[^"]*">', lambda m: f'<meta name="description" content="{esc_attr(desc)}">', page, count=1)
    page = re.sub(r"<title>[^<]*</title>", lambda m: f"<title>{esc_attr(title)}</title>", page, count=1)
    page = page.replace(ev_script, ev_script + f'\n<link rel="canonical" href="{esc_attr(url)}">\n' + "\n".join(tags) + f"\n<script>window.SN_EVENT={json.dumps(ev['slug'])};</script>", 1)
    assert "<base href=\"/\">" in page and "window.SN_EVENT=" in page and 'og:title' in page
    d = os.path.join(out, ev["slug"]); os.makedirs(d, exist_ok=True)
    open(os.path.join(d, "index.html"), "w").write(page); pages.append(page)
    print(f"built dist/{ev['slug']}/index.html (event page)")
for f in os.listdir(os.path.join(root, "public")):
    src = os.path.join(root, "public", f)
    if os.path.isfile(src): shutil.copy(src, out)
    elif os.path.isdir(src): shutil.copytree(src, os.path.join(out, f), dirs_exist_ok=True)
open(os.path.join(out, ".nojekyll"), "w").write("")
# which commit this is (scripts/ship.sh reads snpetanque.com/build.txt to confirm a release is live)
try: sha = os.environ.get("GITHUB_SHA") or subprocess.run(["git", "rev-parse", "HEAD"], cwd=root, capture_output=True, text=True, check=True).stdout.strip()
except Exception: sha = "unknown"
open(os.path.join(out, "build.txt"), "w").write(sha + "\n")
# stamp the service worker with this build (so phones pick up new versions) and its language files
sw = os.path.join(out, "sw.js"); ver = hashlib.md5("".join(pages).encode()).hexdigest()[:10]
txt = open(sw).read(); open(sw, "w").write(txt.replace("__VERSION__", ver).replace("__FBV__", V).replace("__LANGS__", json.dumps({c: f for c, (f, _) in lang_files.items()})))
print("built dist/index.html", len(html), "+ lang/", " ".join(f"{c}:{len(b.encode()) // 1024}KB" for c, (_, b) in lang_files.items()))
