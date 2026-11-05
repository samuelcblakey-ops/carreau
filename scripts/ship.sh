#!/usr/bin/env bash
# Release this branch: rebase on the latest main, push, open its pull request (or reuse it, e.g. a spec's draft),
# have GitHub merge it as soon as CI passes, then wait for the deploy and confirm snpetanque.com is serving it.
#   scripts/ship.sh                        title: the spec's title, else the first commit's subject
#   scripts/ship.sh "Score keypad"         pull request title
#   scripts/ship.sh --body-file notes.md   pull request description (default: the spec, the commits and the checks)
#   scripts/ship.sh --no-wait              stop once auto-merge is on: GitHub merges and deploys by itself
#   scripts/ship.sh --draft                push and open a draft pull request only (how a planning session files a spec)
# Needs push access (a Code tab session with carreau picked under Repo) and everything committed.
set -uo pipefail
cd "$(dirname "$0")/.." || exit 1
REPO=${SHIP_REPO:-samuelcblakey-ops/carreau} SITE=${SHIP_SITE:-https://snpetanque.com}  # overridable for testing the script
wait=1 draft=0 title="" bodyfile=""
while [ $# -gt 0 ]; do
  case "$1" in
    --no-wait) wait=0 ;;
    --draft) draft=1 ;;
    --body-file) bodyfile=$2; shift ;;
    *) title=$1 ;;
  esac
  shift
done
say() { echo "== $*"; }
die() { echo "!! $*" >&2; exit 1; }

branch=$(git rev-parse --abbrev-ref HEAD)
case "$branch" in main|HEAD) die "you're on $branch: make a branch first (git switch -c <short-name>)" ;; esac
[ -z "$(git status --porcelain --untracked-files=no)" ] || die "uncommitted changes: commit them first (git add -A && git commit)"
git push --dry-run -q origin HEAD:refs/heads/zz-push-check 2>/dev/null || die "this session can't push. Start the work in the Code tab (claude.ai/code) with samuelcblakey-ops/carreau picked under Repo; Cowork sessions can't push."

say "rebasing $branch on the latest main"
git fetch -q origin main || die "couldn't fetch origin"
if ! git rebase -q origin/main; then
  git rebase --abort
  die "conflicts with main: git rebase origin/main, fix the files, git rebase --continue, scripts/check.sh, then ship again"
fi
[ -n "$(git log --oneline origin/main..HEAD)" ] || die "nothing to ship: $branch has no commits that main doesn't have"

say "pushing"
git push -q --force-with-lease -u origin HEAD || die "push failed"

spec=$(git diff --name-only --diff-filter=AM origin/main...HEAD -- 'specs/*.md' | grep -v -E 'specs/(README|TEMPLATE)\.md' | head -1)
[ -n "$title" ] || { [ -n "$spec" ] && title=$(grep -m1 '^# ' "$spec" | sed 's/^# *//'); }
[ -n "$title" ] || title=$(git log --reverse --format=%s origin/main..HEAD | head -1)
if [ -z "$bodyfile" ]; then
  bodyfile=$(mktemp)
  {
    [ -n "$spec" ] && echo "Spec: [$spec](https://github.com/$REPO/blob/$branch/$spec)" && echo
    echo "## Commits"; git log --reverse --format='- %s' origin/main..HEAD; echo
    echo "## Checks"; echo "- CI runs the build, the app tests and the web tests (three parallel jobs); this merges itself once they pass."
  } > "$bodyfile"
fi

num=$(gh pr list --repo $REPO --head "$branch" --state open --json number --jq '.[0].number // empty')
if [ -z "$num" ]; then
  args=(--repo "$REPO" --head "$branch" --base main --title "$title" --body-file "$bodyfile")
  [ $draft = 1 ] && args+=(--draft)
  url=$(gh pr create "${args[@]}") || die "couldn't open the pull request"
  num=${url##*/}
elif [ $draft = 0 ]; then
  [ "$(gh pr view "$num" --repo $REPO --json isDraft --jq .isDraft)" = true ] && { gh pr ready "$num" --repo $REPO >/dev/null || die "couldn't mark #$num ready"; }
  gh pr edit "$num" --repo $REPO --title "$title" --body-file "$bodyfile" >/dev/null || true
fi
echo "Pull request #$num: https://github.com/$REPO/pull/$num"
if [ $draft = 1 ]; then echo "Draft only: a building session picks it up with scripts/ship.sh on this branch."; exit 0; fi

auto=1
gh pr merge "$num" --repo $REPO --auto --merge >/dev/null 2>&1 || auto=0
if [ $auto = 1 ] && [ $wait = 0 ]; then echo "Auto-merge is on: GitHub merges #$num once the checks pass, then deploys it."; exit 0; fi
[ $auto = 0 ] && echo "(auto-merge is off for this repo, so this waits for the checks and merges itself)"

say "waiting for the checks (about 8 minutes)"
for _ in $(seq 1 30); do [ "$(gh pr checks "$num" --repo $REPO --json name --jq length 2>/dev/null || echo 0)" -gt 0 ] && break; sleep 5; done
if ! gh pr checks "$num" --repo $REPO --watch --fail-fast --interval 30 >/dev/null 2>&1; then
  gh pr checks "$num" --repo $REPO
  run=$(gh run list --repo $REPO --branch "$branch" --workflow ci-cd.yml --limit 1 --json databaseId --jq '.[0].databaseId')
  die "a check failed. The failing output: gh run view $run --repo $REPO --log-failed | tail -80. Fix, commit, scripts/ship.sh again."
fi
if [ $auto = 0 ]; then gh pr merge "$num" --repo $REPO --merge >/dev/null || die "couldn't merge #$num"; fi

say "waiting for GitHub to merge"
state=""
for _ in $(seq 1 60); do
  state=$(gh pr view "$num" --repo $REPO --json state,mergeCommit --jq '.state + " " + (.mergeCommit.oid // "")')
  [ "${state%% *}" = MERGED ] && break
  sleep 10
done
[ "${state%% *}" = MERGED ] || die "#$num isn't merged after 10 minutes: gh pr view $num --repo $REPO"
sha=${state#* }
echo "Merged as ${sha:0:7}"

say "waiting for main's tests and the deploy (about 10 minutes)"
run=""
for _ in $(seq 1 30); do
  run=$(gh run list --repo $REPO --branch main --commit "$sha" --workflow ci-cd.yml --json databaseId --jq '.[0].databaseId // empty')
  [ -n "$run" ] && break
  sleep 10
done
[ -n "$run" ] || die "no CI run started for ${sha:0:7} on main: https://github.com/$REPO/actions"
if ! gh run watch "$run" --repo $REPO --exit-status --interval 30 >/dev/null 2>&1; then
  # a newer merge can replace a run that was still waiting; that newer run tests and deploys this change too
  [ "$(gh run view "$run" --repo $REPO --json conclusion --jq .conclusion 2>/dev/null)" = cancelled ] \
    || die "main's run failed, so it wasn't deployed: gh run view $run --repo $REPO --log-failed"
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
