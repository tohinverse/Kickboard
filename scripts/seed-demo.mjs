// Loads three demo tournaments so a fresh install has something to look at.
// Inside Docker the app is reachable on localhost:3000 from its own container.
// Override with BASE_URL / ADMIN_PASSWORD when running from the host.
const B = process.env.BASE_URL ?? "http://localhost:3000";
const PW = process.env.ADMIN_PASSWORD ?? "local-dev-password";

// sign in
const login = await fetch(`${B}/api/auth/login`, {
  method: "POST", headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ password: PW }),
});
const CK = login.headers.getSetCookie().map(c => c.split(";")[0]).join("; ");
const api = (p, o = {}) => fetch(B + p, { ...o, headers: { "Content-Type": "application/json", cookie: CK, ...(o.headers || {}) } });

const TEAMS = ["Arsenal","Man City","Liverpool","Chelsea","Spurs","Man Utd","Newcastle","Aston Villa",
"Real Madrid","Barcelona","Atletico","Sevilla","Bayern","Dortmund","Leipzig","Leverkusen",
"PSG","Marseille","Lyon","Monaco","Juventus","Inter","Milan","Napoli",
"Ajax","PSV","Feyenoord","Porto","Benfica","Sporting","Celtic","Rangers"];

// 1. Groups -> Knockout, mid-tournament (groups done, knockout part-played)
const t1 = await (await api("/api/tournaments", { method: "POST", body: JSON.stringify({
  name: "Kickboard Champions Cup",
  teams: TEAMS,
  stages: [
    { name: "Group Stage", type: "GROUPS", config: { groupSize: 4, advancePerGroup: 2 } },
    { name: "Knockout", type: "KNOCKOUT", config: {} },
  ],
})})).json().then(r => r.tournament);

const gs = t1.stages.find(s => s.type === "GROUPS").id;
await api(`/api/stages/${gs}/generate`, { method: "POST" });

const pub = async id => (await (await fetch(`${B}/api/public/tournaments/${id}`, { cache: "no-store" })).json()).tournament;

// play every group match with varied, plausible scorelines
let p = await pub(t1.id);
const gms = p.matches.filter(m => m.stageId === gs);
const scores = [[2,1],[0,0],[3,1],[1,1],[2,0],[1,2],[4,2],[0,1],[3,3],[2,2],[1,0],[0,3]];
for (let i = 0; i < gms.length; i++) {
  const [h, a] = scores[i % scores.length];
  await api(`/api/matches/${gms[i].id}`, { method: "PATCH", body: JSON.stringify({ homeScore: h, awayScore: a, status: "finished" }) });
}
await api(`/api/stages/${gs}/advance`, { method: "POST" });

// play the round of 16, leave the quarter-finals live/scheduled
p = await pub(t1.id);
const ks = t1.stages.find(s => s.type === "KNOCKOUT").id;
const r16 = p.matches.filter(m => m.stageId === ks && m.round === 1).sort((a,b) => a.slot - b.slot);
const koScores = [[2,1],[3,0],[1,0],[2,3],[4,1],[0,2],[1,2],[3,2]];
for (let i = 0; i < r16.length; i++) {
  const [h, a] = koScores[i % koScores.length];
  await api(`/api/matches/${r16[i].id}`, { method: "PATCH", body: JSON.stringify({ homeScore: h, awayScore: a, status: "finished" }) });
}
// make one quarter-final live so the pulsing "Live" state is visible
p = await pub(t1.id);
const qf = p.matches.filter(m => m.stageId === ks && m.round === 2).sort((a,b) => a.slot - b.slot);
await api(`/api/matches/${qf[0].id}`, { method: "PATCH", body: JSON.stringify({ homeScore: 1, awayScore: 1, status: "live" }) });
await api(`/api/tournaments/${t1.id}`, { method: "PATCH", body: JSON.stringify({ status: "active" }) });

// 2. A plain league, part-played
const t2 = await (await api("/api/tournaments", { method: "POST", body: JSON.stringify({
  name: "Sunday League", teams: TEAMS.slice(0, 8),
  stages: [{ name: "League", type: "LEAGUE", config: {} }],
})})).json().then(r => r.tournament);
const ls = t2.stages[0].id;
await api(`/api/stages/${ls}/generate`, { method: "POST" });
let p2 = await pub(t2.id);
const lms = p2.matches.filter(m => m.stageId === ls);
for (let i = 0; i < Math.floor(lms.length * 0.6); i++) {
  const [h, a] = scores[i % scores.length];
  await api(`/api/matches/${lms[i].id}`, { method: "PATCH", body: JSON.stringify({ homeScore: h, awayScore: a, status: "finished" }) });
}
await api(`/api/tournaments/${t2.id}`, { method: "PATCH", body: JSON.stringify({ status: "active" }) });

// 3. A knockout with byes, untouched
const t3 = await (await api("/api/tournaments", { method: "POST", body: JSON.stringify({
  name: "Boxing Day Shield", teams: TEAMS.slice(0, 12),
  stages: [{ name: "Knockout", type: "KNOCKOUT", config: {} }],
})})).json().then(r => r.tournament);
await api(`/api/stages/${t3.stages[0].id}/generate`, { method: "POST" });
await api(`/api/tournaments/${t3.id}`, { method: "PATCH", body: JSON.stringify({ status: "active" }) });

console.log("Champions Cup (groups -> knockout, QF live): " + B + "/" + t1.id);
console.log("Sunday League (part-played):                 " + B + "/" + t2.id);
console.log("Boxing Day Shield (12 teams, byes):          " + B + "/" + t3.id);
