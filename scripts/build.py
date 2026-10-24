"""Builds the GitHub Pages version from carreau.html (the Claude artifact source)."""
import os, re
here = os.path.dirname(os.path.abspath(__file__)); root = os.path.dirname(here)
src = open(os.path.join(root, "src", "carreau.html")).read()
boot = open(os.path.join(root, "src", "web-boot.js")).read()

start, end = "/* @@BOOT-START */", "/* @@BOOT-END */"
a, b = src.index(start), src.index(end) + len(end)
body = src[:a] + boot + src[b:]

V = "10.12.2"
imports = f'''import {{ initializeApp }} from "https://www.gstatic.com/firebasejs/{V}/firebase-app.js";
import {{ getFirestore, initializeFirestore, persistentLocalCache, persistentMultipleTabManager, connectFirestoreEmulator, doc, collection, onSnapshot, setDoc, updateDoc, deleteDoc, deleteField, getDocs, query, where, limit }} from "https://www.gstatic.com/firebasejs/{V}/firebase-firestore.js";
import {{ getAuth, connectAuthEmulator, onAuthStateChanged, signInAnonymously, GoogleAuthProvider, signInWithPopup, signInWithCredential, signOut }} from "https://www.gstatic.com/firebasejs/{V}/firebase-auth.js";
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
<meta name="description" content="Run petanque competitions live: draws, courts and scores for everyone.">
<meta name="theme-color" content="#1d6a54">
<link rel="manifest" href="manifest.webmanifest">
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
# minify the live page (smaller, much harder to read or copy); CARREAU_NO_MINIFY=1 keeps it readable for debugging
import subprocess
if os.environ.get("CARREAU_NO_MINIFY") != "1":
    subprocess.run(["node", os.path.join(here, "minify.js"), os.path.join(out, "index.html")], check=True)
    html = open(os.path.join(out, "index.html")).read()
import shutil
for f in os.listdir(os.path.join(root, "public")):
    src = os.path.join(root, "public", f)
    if os.path.isfile(src): shutil.copy(src, out)
    elif os.path.isdir(src): shutil.copytree(src, os.path.join(out, f), dirs_exist_ok=True)
open(os.path.join(out, ".nojekyll"), "w").write("")
# stamp the service worker with this build so phones pick up new versions
import hashlib
sw = os.path.join(out, "sw.js"); ver = hashlib.md5(html.encode()).hexdigest()[:10]
txt = open(sw).read(); open(sw, "w").write(txt.replace("__VERSION__", ver).replace("__FBV__", V))
print("built dist/index.html", len(html))
