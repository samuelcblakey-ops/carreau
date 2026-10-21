// Test runner. `node tests/run.js app` runs the in-browser app tests (no Firebase needed);
// `node tests/run.js web` runs the website tests against the Firebase emulators
// (start them with `npm test`, which wraps this in `firebase emulators:exec`).
// Each test prints what it saw; the expectations below decide pass or fail.
const { execFile } = require('child_process'), path = require('path'), fs = require('fs');
const OUT = path.join(__dirname, '..', 'test-results'); fs.mkdirSync(OUT, { recursive: true });
const SUITES = {
  app: {
    'app-features.js': [
      /override moved winner through: true later game reset: true final side cleared: true/,
      /overrideAllowed QF after final: false/,              // only current and previous round
      /pool modal blocked: true/, /pool g2w a before \S+ after \S+ done false/,
      /swiss R1 edit: corrected=true modal closed=true/,
      /KO entrants 8 duels 8/, /tie prompt shown/, /shoot final done true winner \["p\d+"\]/,
      /final standings: Standings Final WINNER/,
      /archived visible locally: true/, /restored: true/, /^errs \[\]$/m,
    ],
    'app-score-keypad.js': [/pad buttons 14/, /after sa pick, pad on sb: true/, /pad closed true values 13-8/, /reopen sb pad true/, /saved true 13-8/, /errs \[\]/],
  },
  web: {
    'web-isolation.js': [
      /B list \(should be B comp only\): B comp\n/, /admin list: A comp, B comp, Example comp/,
      /B list after example: B comp, Example comp/, /B edit example: denied permission-denied/,
      /B direct link to A comp opens: true/, /toast Competition deleted\./, /errs \[\]/,
    ],
    'web-archive.js': [
      /B sees before archive: true/, /A sees archived: false/, /B sees archived comp: false \| B can read its matches: 0/,
      /admin list shows archived: true \| sees comp: true/, /B sees after restore: true/, /errs \[\]/,
    ],
    'web-admin.js': [
      /creators panel has visitors: true \| device recorded: true/, /admin menu hides visitor comps: true/,
      /row shows creator, teams, status: true/, /empty filter: true/, /search: true/, /nickname shown: true/,
      /visitor cannot read nicknames: true/, /show theirs: true/, /confirm shown: true/,
      /bulk delete toast: 2 competitions deleted\./, /A comps gone, B kept: true/, /A list after delete: 0/, /errs \[\]/,
    ],
    'web-open-testing.js': [
      /B sees A comp in menu: false/, /B tabs \(open testing\): Registration\|Setup/, /B rename: ok/, /B delete: blocked/,
      /admin page \(signed in\):.*Open testingOn/, /B tabs \(testing off\): Draw & results\|Standings\|Big screen/,
      /B rename \(off\): blocked/, /errs \[\]/,
    ],
  },
};
(async () => {
  const suite = process.argv[2] || 'app'; const env = { ...process.env, OUT };
  let srv;
  if (suite === 'app') env.APP_URL = 'file://' + path.join(__dirname, '..', 'src', 'carreau.html');
  else { srv = await require('./serve')(5055); env.WEB_URL = 'http://127.0.0.1:5055/'; }
  let failed = 0;
  for (const [file, expects] of Object.entries(SUITES[suite])) {
    let out = '';
    out = await new Promise(res => execFile('node', [path.join(__dirname, file)], { env, encoding: 'utf8', timeout: 240000, maxBuffer: 1 << 24 },
      (err, stdout, stderr) => res(stdout + (err ? '\n' + (stderr || err.message) : ''))));
    fs.writeFileSync(path.join(OUT, file.replace('.js', '.log')), out);
    const miss = expects.filter(re => !re.test(out));
    if (miss.length) { failed++; console.log(`✗ ${file}\n  missing: ${miss.join('\n           ')}\n--- output ---\n${out}\n`); }
    else console.log(`✓ ${file}`);
  }
  srv?.close();
  console.log(failed ? `${failed} test file(s) failed` : 'all tests passed'); process.exit(failed ? 1 : 0);
})();
