// Inter-Regional Championship 2026, Division 1 (Sand Bay, Kewstoke, 5–6 September 2026), from the published results.
// Regions by index; each round is four fixtures "AB" + 8 games (team n v team n on day 1, crossed on day 2) with
// each score as a letter: a = 0 … n = 13.
module.exports = {
  regions: ['Kent', 'Chiltern', 'Southern', 'Anglia', 'Heart of England', 'Isle of Wight', 'Welsh PA', 'Suffolk Coastal'],
  rounds: '07neannbnalnnjnmfn 16njnifnncnfnginnl 25innkndngmnnbngnb 34ninhlnjnndknnfln|06nfnhnanfngjncnmn 17nendnkngannlninc 24nmknnbnenlnfnenf 35nhnkncannkngnbkn|05nanlnbnfnhngnenj 14hnnfnbnkinngnanb 27mnmnmnmnnhnhning 36nlmnfnnifnhnendn|04lnncnenainnfnmmn 15nbninfnenhnhnenk 26nijnnbenjnjnnden 37nandnenkngniinin|03ngendnnbnffnhnnf 12nfncenneninhdnnc 47ndlnninmneknnicn 56gnnjenneaninfnkn|02nhhnfnndnjlnnjjn 13naennknlnkdnnmnb 46hnnfcnnlnednanbn 57njnflnnfknfnfnmn|01dnknfnndbnmnngcn 23cndnnjndgnnjnknd 45fnbnnidnknnjngcn 67kninfnjnnknininc|17ngnjnananencmnnk 03nldnnfnjgnfnknnb 25nhannjknnhhnnlnj 64innlnfnmncnknhng|13ncgnngnanhndnjni 07fnnenlnaknnenhng 24knmnngngnfjnngnf 65ncinnlninigninng|16ndncnhngnlcnnikn 02ngnmniinnlngjnng 35nginfnnkninbngni 74mncnnklnngdnlnln|12nanfanndknnjingn 06nbfnngnlinanmnhn 34hnmnfnninmhnmnkn 75fnannancngcnknnj|10nbnafnngdnnmnenm 26endnninhnbndknnc 37nfnednjnjnnjngnj 45kngnlndnndjngnng'
    .split('|').map(r => r.split(' ').map(f => ({ a: +f[0], b: +f[1], games: Array.from({ length: 8 }, (_, i) => [f.charCodeAt(2 + 2 * i) - 97, f.charCodeAt(3 + 2 * i) - 97]) }))),
  // published tables: [region, wins, for, against, diff]
  day1: [['Chiltern', 45, 636, 402, 234], ['Kent', 33, 583, 468, 115], ['Southern', 31, 583, 507, 76], ['Welsh PA', 31, 563, 506, 57], ['Anglia', 27, 549, 523, 26], ['Suffolk Coastal', 22, 497, 620, -123], ['Heart of England', 21, 441, 630, -189], ['Isle of Wight', 14, 433, 629, -196]],
  final: [['Chiltern', 75, 1088, 687, 401], ['Kent', 54, 979, 848, 131], ['Welsh PA', 53, 955, 889, 66], ['Southern', 52, 987, 887, 100], ['Anglia', 45, 931, 931, 0], ['Heart of England', 39, 837, 1067, -230], ['Suffolk Coastal', 34, 816, 1065, -249], ['Isle of Wight', 32, 810, 1029, -219]],
};
