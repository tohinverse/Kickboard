const B="http://localhost:3000", CK=process.env.CK;
let fail=0;
const ok=(c,m)=>{ if(!c){console.log("FAIL:",m);fail++;} else console.log("  ok:",m); };
const api=async(p,o={})=>{const r=await fetch(B+p,{...o,headers:{"Content-Type":"application/json",cookie:CK,...(o.headers||{})}});return {status:r.status,body:await r.json().catch(()=>({}))};};
const pub=async id=>(await (await fetch(`${B}/api/public/tournaments/${id}`,{cache:"no-store"})).json()).tournament;

// --- standalone KNOCKOUT with a non-power-of-two field (byes) ---
const mk=async(name,stages,teams)=>(await api("/api/tournaments",{method:"POST",body:JSON.stringify({name,stages,teams})})).body.tournament;
const t1=await mk("Bye Cup",[{name:"Knockout",type:"KNOCKOUT",config:{}}],Array.from({length:12},(_,i)=>`K${i+1}`));
const ks=t1.stages[0].id;
const g=await api(`/api/stages/${ks}/generate`,{method:"POST"});
ok(g.body.matches===15,`12 teams -> 16-slot bracket = 15 matches (got ${g.body.matches})`);
let p=await pub(t1.id);
const r1=p.matches.filter(m=>m.round===1);
const byes=r1.filter(m=>!m.homeTeam||!m.awayTeam);
ok(byes.length===4,`12 teams gives 4 byes (got ${byes.length})`);
// top seed K1 should have a bye and already sit in round 2
const r2=p.matches.filter(m=>m.round===2);
const k1InR2=r2.some(m=>m.homeTeam?.name==="K1"||m.awayTeam?.name==="K1");
ok(k1InR2,"top seed with a bye is pre-placed into round 2");

// --- LEAGUE standalone, odd team count ---
const t2=await mk("Odd League",[{name:"League",type:"LEAGUE",config:{}}],Array.from({length:7},(_,i)=>`O${i+1}`));
const ls=t2.stages[0].id;
const g2=await api(`/api/stages/${ls}/generate`,{method:"POST"});
ok(g2.body.matches===21,`7-team league = 21 fixtures (got ${g2.body.matches})`);
let p2=await pub(t2.id);
ok(p2.tables.length===1 && p2.tables[0].rows.length===7,"league table lists all 7 teams");
// every team plays 6
const counts={};
for(const m of p2.matches){counts[m.homeTeam.name]=(counts[m.homeTeam.name]||0)+1;counts[m.awayTeam.name]=(counts[m.awayTeam.name]||0)+1;}
ok(Object.values(counts).every(c=>c===6),`each of 7 teams plays 6 games (${JSON.stringify(counts)})`);

// --- validation edges ---
const bad=await api("/api/tournaments",{method:"POST",body:JSON.stringify({name:"NoStages",stages:[],teams:["a"]})});
ok(bad.status===400,"creating with no stages is rejected");
const badType=await api("/api/tournaments",{method:"POST",body:JSON.stringify({name:"BadType",stages:[{type:"CHESS"}],teams:[]})});
ok(badType.status===400,"unknown stage type is rejected");
const dupes=await api(`/api/tournaments/${t2.id}/teams`,{method:"POST",body:JSON.stringify({teams:["X","X"]})});
ok(dupes.status===400,"duplicate team names are rejected");
const advNoKo=await api(`/api/stages/${ls}/advance`,{method:"POST"});
ok(advNoKo.status===400,"advancing a non-group stage is rejected");

// --- public API needs no cookie ---
const anon=await fetch(`${B}/api/public/tournaments/${t2.id}`);
ok(anon.status===200,"public API works without auth");

console.log(fail===0?"EDGE ALL PASS":`${fail} FAILURES`);
process.exit(fail?1:0);
