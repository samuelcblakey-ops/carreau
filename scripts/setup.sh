#!/usr/bin/env bash
# Get this copy ready to build, test and ship. Run it once at the start of a session (safe to run again).
#   git clone https://github.com/samuelcblakey-ops/carreau.git && cd carreau && scripts/setup.sh
set -uo pipefail
cd "$(dirname "$0")/.." || exit 1
ok=1
echo "== packages"
npm ci --no-audit --no-fund --loglevel=error || ok=0

echo "== browser for the tests"
if node -e "require('fs').accessSync(require('playwright').chromium.executablePath())" 2>/dev/null; then echo "Chromium is there"
else npx playwright install chromium || ok=0; fi

echo "== Java (the web tests run the Firebase emulators, which need it)"
if command -v java >/dev/null; then java -version 2>&1 | grep -m1 -i version
else echo "!! no Java here: the app tests work, the web tests won't (install a JDK 21)"; fi

echo "== build"
npm run build --silent | tail -1 || ok=0

echo "== GitHub"
git fetch -q origin main 2>/dev/null || true
if git push --dry-run -q origin HEAD:refs/heads/zz-push-check 2>/dev/null; then
  echo "can push and open pull requests as $(gh api user --jq .login 2>/dev/null)"
else
  echo "!! This session can't push to GitHub. Code sessions can: start one in the Code tab (claude.ai/code)"
  echo "   with samuelcblakey-ops/carreau picked under Repo. Cowork sessions can't attach the repo."
  echo "   You can still build and test; scripts/ship.sh needs push access."
fi

echo
if [ $ok = 1 ]; then echo "Ready. Read CLAUDE.md, then: scripts/check.sh to test, scripts/ship.sh to release."
else echo "!! Something above failed; fix it before testing."; exit 1; fi
