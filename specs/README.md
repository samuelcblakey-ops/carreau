# Specs: plan in one session, build in others

Planning and building are done in separate sessions.

- **Planning** means reading widely: notes, code, options and Sam's answers.
- **Building** goes best with a clean start: just `CLAUDE.md` and one spec.

Keeping them apart keeps each session focused. It also lets several builds run at once, each in its own copy of the code.

## 1. Plan (one session)

Start a session in the Code tab (claude.ai/code, with carreau picked under Repo) with a prompt like this:

> Plan *the feature*. Write the spec(s) with specs/TEMPLATE.md and file them.

The planning session:

1. Reads the code and notes, and asks Sam any open questions. A spec with open questions isn't ready.
2. Splits big features into several specs. Each spec is one pull request, smallest and safest first. Each spec lists what it touches and what it depends on.
3. Ships the specs to main through a normal pull request (specs only, no code), so every builder starts from them:

   ```bash
   git switch -c spec-<short-name> origin/main
   # write specs/<short-name>.md (and any others in the same plan)
   git add specs/ && git commit -m "Spec: <title>"
   scripts/ship.sh "Spec: <title>"
   ```

The specs in `specs/` that have no code merged for them yet are the queue of work that's ready to build.

## 2. Build (one session per spec, several at once)

Start one Code tab session per spec (carreau picked under Repo), with a prompt like this:

> Build specs/*short-name*.md and ship it.

The building session:

1. Runs `scripts/setup.sh` and makes a branch named after the spec: `git switch -c <short-name> origin/main`. Then it reads `CLAUDE.md` and the spec.
2. Builds the change, along with the test lines from the spec's acceptance checks.
3. Runs `scripts/check.sh` and looks at the screenshots.
4. Commits, then runs `scripts/ship.sh`. That opens the pull request, merges it when CI passes and confirms it's live.

Run specs side by side only when their **Touches** lines don't overlap. Two sessions changing the same function will collide when the second one merges in main.

## 3. After it ships

The spec stays in `specs/` next to the code that built it, so `specs/` keeps a record of why each change was made. Leave merged specs where they are.

## Writing a good spec

- Start from `TEMPLATE.md`.
- Write acceptance checks as lines a test can print, e.g. `shooting subtitle: Precision shooting`. The builder turns each one into a printed line and a regex in `tests/run.js`, so "done" means the same thing to everyone.
- Give exact English wording for new text. The builder adds the other 7 languages.
- Point to the code by function name, not line number, because line numbers move.
