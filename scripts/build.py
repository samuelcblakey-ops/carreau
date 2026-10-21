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
import {{ getFirestore, connectFirestoreEmulator, doc, collection, onSnapshot, setDoc, updateDoc, deleteDoc, getDocs, query, where, limit }} from "https://www.gstatic.com/firebasejs/{V}/firebase-firestore.js";
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
{reset}
{head_part.replace('<meta name="claude:viewport-fit-sides" content="cover">', '')}
</head>
<body>
{body_part}
</body>
</html>
"""
out = os.path.join(root, "dist")
os.makedirs(out, exist_ok=True)
open(os.path.join(out, "index.html"), "w").write(html)
import shutil
for f in os.listdir(os.path.join(root, "public")):
    shutil.copy(os.path.join(root, "public", f), out)
open(os.path.join(out, ".nojekyll"), "w").write("")
print("built dist/index.html", len(html))
