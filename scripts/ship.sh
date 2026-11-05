#!/usr/bin/env bash
# Release this branch: merge in the latest main if it's behind, push, open its pull request (or update the open one),
# wait for CI, merge it, then wait for the deploy and confirm snpetanque.com is serving it.
#   scripts/ship.sh                        title: the spec's title, else the first commit's subject
#   scripts/ship.sh "Score keypad"         pull request title
#   scripts/ship.sh --body-file notes.md   pull request description (default: the spec, the commits and the checks)
# Needs push access (a Code tab session with carreau picked under Repo) and everything committed.
# History is never rewritten (no rebase, no force push): the session permission check blocks force pushes.
# GitHub is reached only through its REST API (gh api), because the GraphQL API behind `gh pr` is blocked in these sessions.
set -uo pipefail
cd "$(dirname "$0")/.." || exit 1
REPO=${SHIP_REPO:-samuelcblakey-ops/carreau} SITE=${SHIP_SITE:-https://snpetanque.com}  # overridable for testing the script
OWNER=${REPO%%/*}
title="" bodyfile=""
while [ $# -gt 0 ]; do
  case "$1" in
    --body-file) bodyfile=$2; shift ;;
    -*) echo "!! unknown option $1" >&2; exit 1 ;;
    *) title=$1 ;;
  esac
  shift
done
say() { echo "== $*"; }
die() { echo "!! $*" >&2; exit 1; }
api() { gh api "repos/$REPO/$1" "${@:2}"; }

branch=$(git rev-parse --abbrev-ref HEAD)
case "$branch" in main|HEAD) die "you're on $branch: make a branch first (git switch -c <short-name>)" ;; esac
[ -z "$(git status --porcelain --untracked-files=no)" ] || die "uncommitted changes: commit them first (git add -A && git commit)"
git push --dry-run -q origin HEAD:refs/heads/zz-push-check 2>/dev/null || die "this session can't push. Start the work in the Code tab (claude.ai/code) with samuelcblakey-ops/carreau picked under Repo; Cowork sessions can't push."

say "bringing $branch up to date with main"
git fetch -q origin main || die "couldn't fetch origin"
if ! git merge-base --is-ancestor origin/main HEAD; then
  if ! git merge -q --no-edit origin/main; then
    git merge --abort
    die "conflicts with main: git merge origin/main, fix the files, git add them, git commit, scripts/check.sh, then ship again"
  fi
fi
[ -n "$(git log --oneline origin/main..HEAD)" ] || die "nothing to ship: $branch has no commits that main doesn't have"

say "pushing"
git push -q -u origin HEAD || die "push failed (if the branch on GitHub has commits you don't, git pull --no-rebase origin $branch, then ship again)"
head=$(git rev-parse HEAD)

spec=$(git diff --name-only --diff-filter=AM origin/main...HEAD -- 'specs/*.md' | grep -v -E 'specs/(README|TEMPLATE)\.md' | head -1)
[ -n "$title" ] || { [ -n "$spec" ] && title=$(grep -m1 '^# ' "$spec" | sed 's/^# *//'); }
[ -n "$title" ] || title=$(git log --reverse --format=%s origin/main..HEAD | head -1)
if [ -z "$bodyfile" ]; then
  bodyfile=$(mktemp)
  {
    [ -n "$spec" ] && echo "Spec: [$spec](https://github.com/$REPO/blob/$branch/$spec)" && echo
    echo "## Commits"; git log --reverse --format='- %s' origin/main..HEAD; echo
    echo "## Checks"; echo "- CI runs the build, the app tests and the web tests (parallel jobs); scripts/ship.sh merges this once they pass."
  } > "$bodyfile"
fi
[ -r "$bodyfile" ] || die "can't read $bodyfile"

num=$(api "pulls?head=$OWNER:$branch&state=open" --jq '.[0].number // empty') || die "couldn't list pull requests"
if [ -z "$num" ]; then
  num=$(api pulls -X POST -f head="$branch" -f base=main -f title="$title" -F body=@"$bodyfile" --jq .number) \
    || die "couldn't open the pull request"
else
  api "pulls/$num" -X PATCH -f title="$title" -F body=@"$bodyfile" --silent || echo "(couldn't update the title and description of #$num; carrying on)"
fi
[ -n "$num" ] || die "couldn't open the pull request"
echo "Pull request #$num: https://github.com/$REPO/pull/$num"

say "waiting for the checks on ${head:0:7} (about 8 minutes)"
# every check run on the pushed commit must finish; `test` is the one main's protection requires, and it comes last
result=""
for _ in $(seq 1 180); do  # 30 minutes
  runs=$(api "commits/$head/check-runs?per_page=100" --jq '.check_runs[] | [.name, .status, (.conclusion // "")] | @tsv' 2>/dev/null) || { sleep 10; continue; }
  if [ -n "$runs" ] && echo "$runs" | cut -f1 | grep -qx test && ! echo "$runs" | cut -f2 | grep -qvx completed; then
    result=$runs; break
  fi
  sleep 10
done
[ -n "$result" ] || die "the checks on #$num didn't finish within 30 minutes: https://github.com/$REPO/pull/$num/checks"
bad=$(echo "$result" | awk -F'\t' '$3 != "success" && $3 != "skipped" && $3 != "neutral" { print "   " $1 ": " $3 }')
if [ -n "$bad" ]; then
  echo "$bad" >&2
  run=$(api "actions/runs?head_sha=$head&per_page=1" --jq '.workflow_runs[0].id // empty' 2>/dev/null)
  die "a check failed: https://github.com/$REPO/actions/runs/$run (the failing job's log is there). Fix, commit, scripts/ship.sh again."
fi
echo "All $(echo "$result" | wc -l) checks passed."

say "merging #$num"
merged=0
for _ in $(seq 1 12); do  # GitHub can take a moment to record the required check as passed
  if out=$(api "pulls/$num/merge" -X PUT -f merge_method=merge -f sha="$head" 2>&1); then merged=1; break; fi
  case "$out" in *"Head branch was modified"*|*"409"*) die "the branch changed while CI ran: scripts/ship.sh again" ;; esac
  sleep 10
done
[ $merged = 1 ] || die "couldn't merge #$num: $out"
sha=""
for _ in $(seq 1 12); do
  sha=$(api "pulls/$num" --jq 'select(.merged) | .merge_commit_sha // empty' 2>/dev/null)
  [ -n "$sha" ] && break
  sleep 5
done
[ -n "$sha" ] || die "#$num says merged but has no merge commit yet: https://github.com/$REPO/pull/$num"
echo "Merged as ${sha:0:7}"

say "waiting for main's tests and the deploy (about 10 minutes)"
run="" status="" conclusion=""
for _ in $(seq 1 30); do
  run=$(api "actions/runs?head_sha=$sha&event=push&branch=main&per_page=1" --jq '.workflow_runs[0].id // empty' 2>/dev/null)
  [ -n "$run" ] && break
  sleep 10
done
[ -n "$run" ] || die "no CI run started for ${sha:0:7} on main: https://github.com/$REPO/actions"
for _ in $(seq 1 120); do  # 60 minutes: it may queue behind an earlier deploy
  read -r status conclusion < <(api "actions/runs/$run" --jq '[.status, (.conclusion // "-")] | join(" ")' 2>/dev/null) || true
  [ "$status" = completed ] && break
  sleep 30
done
[ "$status" = completed ] || die "main's run is still going after an hour: https://github.com/$REPO/actions/runs/$run"
if [ "$conclusion" != success ]; then
  # a newer merge can replace a run that was still waiting; that newer run tests and deploys this change too
  [ "$conclusion" = cancelled ] || die "main's run ended $conclusion, so it wasn't deployed: https://github.com/$REPO/actions/runs/$run"
  echo "(a newer merge took over the deploy; waiting for it to go live)"
fi

say "checking $SITE"
live=""
for _ in $(seq 1 80); do
  live=$(curl -fsS "$SITE/build.txt?t=$(date +%s)" 2>/dev/null | tr -d '[:space:]')
  if [ -n "$live" ]; then
    git fetch -q origin main
    if git merge-base --is-ancestor "$sha" "$live" 2>/dev/null; then echo "Live: $SITE is serving ${live:0:7}, which includes #$num."; exit 0; fi
  fi
  sleep 15
done
die "deployed, but $SITE/build.txt still shows ${live:-nothing} after 20 minutes (the CDN can lag; check again later)"
