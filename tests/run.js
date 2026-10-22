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
    'app-shoot-live.js': [
      /next up shown: true/, /live opens by default: true first prompt: Shooter \d Shot 1 of 20 A1 · Lone boule 6 m/,
      /after undo, still shot 20: true/, /progress saved per shot: true/, /grid has no drop-downs: true/, /grid edit: true/, /first done: true total 96/,
      /advanced to next: true msg: Saved Shooter \d: 96 pts\. Next up: Shooter \d\./, /modal closed after last: true/,
      /duel alternates: true/, /duel done: true \d+-\d+/, /winner: true/, /template copy: true shooters 3 draws 0 matches 0 name My run-through · Live shoot template false/, /errs \[\]/,
    ],
    'app-picker.js': [/no select: true/, /open: true groups: Your competitions 6 \/ Examples 2/, /meta: .*Triples · Swiss · 0 teams · Not started/, /search focused: true/,
      /search filters: Bristol Open 7\n/, /picked: Bristol Open 7 closed: true button shows: Bristol Open 7/, /outside click closes: true/, /escape closes: true/, /errs \[\]/],
    'app-mobile.js': [/phone: \{"overflow":false,"navFixed":true,"navBottom":true,"icons":true,"header":\d{2,3},"langOneRow":true,"inputFont":"16px"\}/, /desktop: \{"overflow":false,"navFixed":false,"navBottom":false,"icons":false/, /errs \[\]/],
    'app-melee.js': [/setup shows style: true/, /draw teams button: true/, /teams drawn: teams 5 sizes 23333 players kept 14/, /registration notice: true/, /redraw: true/,
      /back to players: melee 0/, /swiss with drawn teams: 3 games, bye true notice gone true/, /advance: draws 3 games 12 rounds 1,2,3/, /repeat partners: 0/,
      /only round 1 on pistes: true r1 courts 4/, /All 3 rounds drawn · round 1 in play/, /print true next-round hidden true/, /round 2 gets pistes after round 1: 4/, /undo all: draws 0 games 0/, /errs \[\]/],
    'app-swiss-ranking.js': [/order: F/, /A above C: true/, /note: Ranking order: Wins → Points difference → Buchholz → Fine Buchholz → Points for → Drawn lot/,
      /panel: Wins,Points difference,Buchholz,Fine Buchholz,Points for,Fewest points against,Drawn lot/, /buchholz first: \["buch","fbuch","diff","pf"\]/,
      /C above A now: true \| note Ranking order: Wins → Buchholz → Fine Buchholz → Points difference → Points for → Drawn lot/, /custom: \["pf","fbuch","diff"\] \| off rows 2/,
      /add against: \["pf","fbuch","diff","pa"\]/, /french: Ordre de classement \| Buchholz d'abord/, /errs \[\]/],
    'app-score-keypad.js': [/pad buttons 14/, /after sa pick, pad on sb: true/, /pad closed true values 13-8/, /reopen sb pad true/, /saved true 13-8/, /errs \[\]/],
    'app-quick-score.js': [/quick by default: true \| no score boxes: true/, /loser pad buttons: 13/, /saved: true 6-13 modal closed true \| undo shown true/, /undone: done false piste back true/,
      /level refused: Level when time ran out/, /time result: true 11-9 time true \| card says Ended on time/, /below target refused: true/, /time badge: late Time \| on time Playing/,
      /french: Vainqueur à 13 \/ Arrêtée au temps \| Qui a gagné/, /errs \[\]/],
    'app-find-game.js': [/own draw, no alert: true/, /find panel: true/, /result: Charlie Pat Charlie v \w+ Round 1 · Piste \d This is me/, /box kept focus: true/, /my game card: true/,
      /alert: true \| Round 2 is out · you're on Piste \d v \w+ View/, /alert closed: true/, /my row: Charlie/, /phone columns: #,Team,W,Buch,\+\/-/, /sticky header: sticky/,
      /all columns: #,Team,Pld,W,L,Buch,Fine,For,Agst,\+\/-/, /cleared: true/, /errs \[\]/],
    'app-wizard.js': [/wizard shown: true \| step: Quick setup · step 1 of 4/, /name required: Give the competition a name first\./, /step 2: Who's playing options 5/, /swiss rounds hidden for pools: true/,
      /back keeps choice: true/, /saved: Spring Doubles \| Riverside \| teams doubles pools \| pistes 5 \| time 45 \| wizard false/, /wizard gone: true \| toast: All set\. Now add your teams\. \| on registration: true/,
      /setup offers quick setup: true/, /skip goes to setup: true wizard false/, /touch sizes: btn true small true seg true/, /playing pill text: rgb\(138, 90, 0\)/, /errs \[\]/],
    'app-languages.js': [/menu closed: true/, /menu open: true options 8/, /outside click closes: true/, /fr: FR \| À la mémoire de Steve Noel/, /es: ES \| En memoria de Steve Noel/,
      /it: IT \| In ricordo di Steve Noel/, /de: DE \| In liebevoller Erinnerung an Steve Noel/, /nl: NL \| Ter liefdevolle nagedachtenis aan Steve Noel/, /pt: PT \| Em memória de Steve Noel/,
      /th: TH \| ด้วยรักและระลึกถึง Steve Noel/, /remembered: th/, /back to english: In loving memory of Steve Noel/, /errs \[\]/],
    'app-live.js': [/setup panel: true \| desk link: true/, /overlay links: \S+\.stream\.\S+ \S+\?parts=bar \S+\?parts=line \S+\?parts=card \S+\.desk\.\S+/, /desk: true header hidden: true \| Piste \d · Round 1 \| nums 0-0/,
      /boules: Boule thrown · 6 left \/ Boule thrown · 6 left/, /after boules: thrown 2-1 holding a \| dots on 4/, /question: Who won the end\? \| pts hidden: true/, /after winner: How many points\? \| pts: 6/,
      /end saved: 2-0 ends 1 thrown 0-0 holding null \| shown 2-0 end 2 \| match live score 2-0/, /players: Marc Dupont, Sophie Martin, Pierre Lefèvre, Aline Rossi/, /events 3 card Carreau Marc Dupont \| a0 line: shoot 1\/2 · 1 carreau/,
      /card on overlay: true CarreauMarc Dupont/, /undo: events 1 last carreau score 2-0/, /layout saved: \{"l":\{"bar":\[50,20\]\}\}/, /overlay: true transparent rgba\(0, 0, 0, 0\) class ov ov-p boxes 2/,
      /bar: Les Carreaux v Boule d'Or 2-0 end 2 dots on 6\/6 \| bar top 72\.7%/, /line: End 2 · Round 1 · Piste \d \| card false/, /portrait bar only: ov ov-p boxes 1 end in line hidden true/, /portrait line: End 2 · Round 1 · Piste \d$/m,
      /finish enabled at 8: false/, /points capped at 13: 5/, /finish button: Finish game · 13–1 enabled true/, /result: done true 13-1 piste freed true \| desk over: true \| live done true/, /french: Final \| Final · Partie 1/, /errs \[\]/],
    'app-round-status.js': [/round 1 drawn: live red true \| 2 games still to finish \| Draw round 2\|disabled/, /one score in: live red true \| 1 game still to finish \| Draw round 2\|disabled/,
      /french: 1 partie à terminer \| Tirer la partie 2\|disabled/, /all scores in: ready green true \| Round finished \| Draw round 2\|enabled/,
      /round 2 drawn: live \| 2 games still to finish \| Draw round 3\|disabled/, /last planned round finished: ready \| Morning complete \| Draw round 3\|enabled/, /errs \[\]/],
  },
  web: {
    'web-isolation.js': [
      /B list \(should be B comp only\): B comp\n/, /admin list: A comp, B comp, Example comp/,
      /B list after example: B comp, Example comp/, /B edit example: denied permission-denied/,
      /B direct link to A comp opens: true/, /example tabs: entries,setup,draw,courts,standings,display/, /example setup locked: true/, /example entries locked: true/, /toast Competition deleted\./, /errs \[\]/,
    ],
    'web-archive.js': [
      /owner sees Delete button: false \| owner sees Archive button: true/, /owner delete via rules: blocked/, /matches kept after blocked delete: true/,
      /B sees before archive: true/, /A sees archived: false/, /B sees archived comp: false \| B can read its matches: 0/,
      /admin list shows archived: true \| sees comp: true/, /B sees after restore: true/, /errs \[\]/,
    ],
    'web-admin.js': [
      /creators panel has visitors: true \| device recorded: true/, /admin menu hides visitor comps: true/,
      /row shows creator, teams, status: true/, /empty filter: true/, /search: true/, /nickname shown: true/,
      /visitor cannot read nicknames: true/, /show theirs: true/, /confirm shown: true/,
      /bulk delete toast: 2 competitions deleted\./, /A comps gone, B kept: true/, /A list after delete: 0/, /errs \[\]/,
    ],
    'web-shooting.js': [/final sides true done true/, /third sides true done true/, /errs \[\]/],
    'web-pwa.js': [/manifest: \[true,"standalone",3,true,200,"image\/png",true\]/, /service worker: true/, /no banner before prompt event: true/, /banner after prompt event: true/,
      /install prompt shown: true \| banner gone: true/, /dismissed stays hidden: true/, /picker offers install: true/, /ios banner: true/, /ios steps: true/, /errs \[\]/],
    'web-team-scoring.js': [/flag off, no score entry choice: true/, /admin switch shows off: true/, /admin mode, organiser sees no choice: true/, /admin mode, admin sees choice: true/,
      /competition registered: true \| organiser still no choice: true/, /team links: 4/, /qr shown alone: true \| decodes to team link: true/, /qr hidden again: true/, /unregistered comp, team propose: permission-denied/, /re-registered, team propose: WROTE/, /everyone mode, organiser sees choice: true/,
      /team panel: true \| team has no organiser tools: true/, /proposal pending: \{"sa":13,"sb":7,"status":"pending"\}/,
      /team security: result permission-denied \| self-confirm permission-denied \| other game permission-denied/, /opponent asked to confirm: true/,
      /organiser screen published: true 13-7 applied/, /team sees result: true/, /organiser sees dispute: true \| not published: true/, /organiser settled: true 13-2/,
      /switched off hides it: true \| team panel gone: true/, /errs \[\]/],
    'web-live.js': [/streaming panel: true \| desk link has code: true \| overlay link: true/, /overlay: true rgba\(0, 0, 0, 0\) [A-Za-z' ]+ v [A-Za-z' ]+ 0-0/, /viewer write: permission-denied/,
      /helper joined: #\S+\.desk\.\S+ true canScore false/, /helper end: 2-0 ends 1 \| no finish button: true/, /helper match write: permission-denied/, /overlay follows: 2-0 end 2 dots 6/,
      /organiser desk: true 2-0/, /organiser finish: Finish game · 13–0/, /result: true 13-0 \| overlay final: Final 13-0/, /errs \[\]/],
    'web-offline.js': [/online light: live Live/, /offline light: off Offline/, /offline save closes at once: true \| score shown: true 13-5/, /waiting light: off Offline · \d+ waiting to sync/,
      /offline reopen: New competition \| score kept: true 13-5/, /back online light: live Live/, /other device sees it: true 13-5/, /errs \[\]/],
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
