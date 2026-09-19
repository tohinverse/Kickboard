import { roundRobinPairings } from "../src/lib/formats/league.ts";
import { buildBracket, seedOrder, nextPowerOfTwo } from "../src/lib/formats/knockout.ts";
import { computeStandings } from "../src/lib/formats/standings.ts";

let fail = 0;
const ok = (c, m) => { if (!c) { console.log("FAIL:", m); fail++; } };

// --- round robin ---
for (const n of [2,3,4,5,8,9,16,32]) {
  const ids = Array.from({length:n},(_,i)=>`t${i}`);
  const ps = roundRobinPairings(ids);
  const expected = n*(n-1)/2;
  ok(ps.length===expected, `n=${n} fixture count ${ps.length} != ${expected}`);
  const seen = new Set();
  for (const p of ps) {
    const key = [p.homeId,p.awayId].sort().join("|");
    ok(!seen.has(key), `n=${n} duplicate pairing ${key}`);
    seen.add(key);
    ok(p.homeId!==p.awayId, `n=${n} self pairing`);
  }
  ok(seen.size===expected, `n=${n} unique pairings ${seen.size} != ${expected}`);
  // no team twice in the same round
  const byRound = {};
  for (const p of ps) { (byRound[p.round] ||= []).push(p.homeId,p.awayId); }
  const rounds = Object.keys(byRound).length;
  ok(rounds === (n%2===0?n-1:n), `n=${n} round count ${rounds}`);
  for (const [r,teams] of Object.entries(byRound)) {
    ok(new Set(teams).size===teams.length, `n=${n} round ${r} team appears twice`);
  }
  // home/away balance sanity: nobody plays all games at home when n>2
  if (n>3) {
    const homeCount = {};
    for (const p of ps) homeCount[p.homeId]=(homeCount[p.homeId]||0)+1;
    const maxHome = Math.max(...Object.values(homeCount));
    ok(maxHome <= n-2, `n=${n} a team has ${maxHome} home games of ${n-1}`);
  }
}
console.log("round-robin checked");

// --- seeding / bracket ---
ok(JSON.stringify(seedOrder(4))===JSON.stringify([1,4,3,2]), "seedOrder(4) "+seedOrder(4));
ok(JSON.stringify(seedOrder(8))===JSON.stringify([1,8,5,4,3,6,7,2]), "seedOrder(8) "+seedOrder(8));
ok(nextPowerOfTwo(32)===32 && nextPowerOfTwo(33)===64 && nextPowerOfTwo(5)===8, "nextPowerOfTwo");

for (const n of [2,3,4,5,8,12,16,32]) {
  const ids = Array.from({length:n},(_,i)=>`s${i+1}`);
  const b = buildBracket(ids);
  const size = nextPowerOfTwo(n);
  ok(b.length===size-1, `bracket n=${n} matches ${b.length} != ${size-1}`);
  const finals = b.filter(m=>m.nextIndex===null);
  ok(finals.length===1, `bracket n=${n} should have exactly 1 final, got ${finals.length}`);
  // every team appears exactly once in round 1 seats
  const r1 = b.filter(m=>m.round===1);
  const seats = r1.flatMap(m=>[m.homeSeatId,m.awaySeatId]).filter(Boolean);
  ok(new Set(seats).size===n, `bracket n=${n} round1 seats ${new Set(seats).size} != ${n}`);
  // top seed should get a bye when padding exists
  if (size>n) {
    const m1 = r1.find(m=>m.homeSeatId==="s1"||m.awaySeatId==="s1");
    const opp = m1.homeSeatId==="s1"?m1.awaySeatId:m1.homeSeatId;
    ok(opp===null, `bracket n=${n} top seed should have a bye, faced ${opp}`);
  }
  // next-slot links are unique: each next match receives exactly 2 feeders
  const feeders = {};
  for (const m of b) if (m.nextIndex!==null) {
    const k = `${m.nextIndex}:${m.nextSlot}`;
    ok(!feeders[k], `bracket n=${n} duplicate feeder ${k}`);
    feeders[k]=true;
  }
}
// 32 teams: 1 v 32 style first round, 5 rounds
{
  const ids = Array.from({length:32},(_,i)=>`s${i+1}`);
  const b = buildBracket(ids);
  ok(Math.max(...b.map(m=>m.round))===5, "32-team bracket should have 5 rounds");
  const first = b.find(m=>m.round===1&&m.slot===0);
  ok(first.homeSeatId==="s1"&&first.awaySeatId==="s32", `32-team opener ${first.homeSeatId} v ${first.awaySeatId}`);
}
console.log("bracket checked");

// --- standings ---
{
  const teams=[{id:"a",name:"A"},{id:"b",name:"B"},{id:"c",name:"C"}];
  const m=(h,a,hs,as)=>({homeTeamId:h,awayTeamId:a,homeScore:hs,awayScore:as,status:"finished"});
  const rows=computeStandings(teams,[m("a","b",1,0),m("b","c",1,0),m("a","c",0,0)]);
  const a=rows.find(r=>r.teamId==="a"), b=rows.find(r=>r.teamId==="b");
  ok(a.points===4&&a.played===2&&a.drawn===1, `A pts ${a.points} played ${a.played}`);
  ok(b.points===3, `B pts ${b.points}`);
  ok(rows[0].teamId==="a", "A should top the table");
  // unfinished matches ignored
  const rows2=computeStandings(teams,[{homeTeamId:"a",awayTeamId:"b",homeScore:5,awayScore:0,status:"live"}]);
  ok(rows2.every(r=>r.played===0), "live match must not count");
  // head-to-head tiebreak: a perfect three-way tie on pts/GD/GF
  const t3=[{id:"a",name:"Alpha"},{id:"b",name:"Beta"},{id:"x",name:"X"}];
  const rows3=computeStandings(t3,[m("a","b",1,0),m("x","a",1,0),m("b","x",1,0)]);
  const A=rows3.find(r=>r.teamId==="a"), B=rows3.find(r=>r.teamId==="b");
  ok(A.points===B.points&&A.goalDifference===B.goalDifference&&A.goalsFor===B.goalsFor,
     "three-way tie should be level on pts/GD/GF");
  ok(A.position<B.position, "Alpha beat Beta head-to-head so must rank above");
}
console.log("standings checked");
console.log(fail===0?"ALL PASS":`${fail} FAILURES`);

if (fail>0) process.exit(1);
