#!/usr/bin/env bash
# The quick check while building something. Runs every step and reports all failures at the end.
#   scripts/check.sh                  build + translation check + all app tests (about 1½ minutes)
#   scripts/check.sh melee shoot      ... only the app tests whose file names contain "melee" or "shoot"
#   scripts/check.sh --web hall       ... plus the web tests whose names contain "hall" (Firebase emulators, needs Java)
#   scripts/check.sh --web            ... plus every web test (about 15 minutes here; CI splits it into three jobs)
# Test output: test-results/<test>.log, plus any screenshots a test takes (test-results/*.png, open them to look).
set -uo pipefail
cd "$(dirname "$0")/.." || exit 1
app=(); web=(); webAll=0; mode=app
for a in "$@"; do
  case "$a" in
    --web) mode=web; webAll=1 ;;
    *) if [ $mode = web ]; then web+=("$a"); webAll=0; else app+=("$a"); fi ;;
  esac
done
failed=()
step() { local name=$1; shift; echo; echo "== $name"; "$@" || failed+=("$name"); }

step build bash -c 'npm run build --silent | tail -1; exit ${PIPESTATUS[0]}'
step translations node scripts/i18n-check.js
step "app tests" node tests/run.js app ${app[@]+"${app[@]}"}
if [ $webAll = 1 ] || [ ${#web[@]} -gt 0 ]; then
  step "web tests" npx firebase emulators:exec --only firestore,auth --project demo-carreau "node tests/run.js web ${web[*]+${web[*]}}"
fi

echo
if [ ${#failed[@]} -gt 0 ]; then echo "!! Failed: ${failed[*]}"; exit 1; fi
echo "All checks passed."
