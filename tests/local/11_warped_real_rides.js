// fixtures: westhill
// The synthetic runs used while building the app: copies of the West Hill ride, time-warped, shifted to other days, with detours,
// shortcuts and changed first laps. Expected values come from the West Hill lap times (463.4 s for lap 1).
A.handleBuffer(FIX.westhill,'West Hill');const M0=A.M,R0=A.RIDERS[0].RAW;
const add=(name,o)=>{A.RIDERS.length=1;A.addRaw(mkWarp(R0,Object.assign({M:M0,rate:RATES.C,t0shift:-7*86400,jit:1},o)),name);return A.RIDERS[1];};
const spread=a=>Math.max(...a)-Math.min(...a);
// another day, course changes on every lap
{const r=add('longer by 25%',{detours:[{a:900,len:150,bulge:90,extra:585}]}),M=r.M;
  check('detour 150 m: accepted, 6 laps',M&&M.nl===6,r.err);
  check('detour 150 m: course difference ≈ 900–1050 m',M&&M.laps[2].offs.length===1&&Math.abs(M.laps[2].offs[0][0]-912)<20&&Math.abs(M.laps[2].offs[0][1]-1046)<30,M&&JSON.stringify(M.laps[2].offs));}
{const r=add('800 m shortcut',{detours:[{a:200,len:800,chord:true}]}),M=r.M;
  check('800 m chord: accepted, 6 laps',M&&M.nl===6,r.err);
  check('800 m chord: laps 2–6 consistent (no mis-timed laps)',M&&spread(M.lapSum.slice(1).map(l=>l.time))<30,M&&lapTimes(M).join());
  check('800 m chord: lap 1 and last lap not cut short',M&&M.lapSum[0].time>300&&M.lapSum[5].time>300,M&&lapTimes(M).join());}
{const r=add('900 m shortcut',{detours:[{a:1300,len:900,chord:true}]}),M=r.M;
  check('900 m chord: laps consistent',M&&spread(M.lapSum.map(l=>l.time))<40,M&&lapTimes(M).join());}
// a different first lap on the same day (rate 1: lap 1 on the regular route would be 463.4 s)
const lap1=(name,o)=>{A.handleBuffer(FIX.westhill,'West Hill');A.RIDERS.length=0;A.addRaw(mkWarp(R0,Object.assign({M:M0,rate:()=>1,only:[0]},o)),name);return A.M.lapSum[0];};
{const l=lap1('extra loop',{detours:[{a:900,len:60,bulge:70,extra:250}]});check('extra loop: flagged as a detour',l.diff&&l.diff[0].kind==='detour');near('extra loop: estimated lap 1 (s)',l.adj,463.4,3);}
{const l=lap1('lap 1 shortcut',{detours:[{a:1300,len:500,chord:true}]});near('lap 1 shortcut: estimated lap 1 (s)',l.adj,463.4,3);check('lap 1 shortcut: overlapping stretches merged into one',l.diff&&l.diff.length===1,JSON.stringify(l.diff&&l.diff.map(p=>p.kind)));}
{const l=lap1('different start line',{detours:[{a:5,len:250,bulge:60,extra:120}]});near('different start route: estimated lap 1 (s)',l.adj,463.4,5);}
// start partway round, with the lap line set
{A.handleBuffer(FIX.westhill,'West Hill');const ll=A.M.lapLineLL,hd=A.M.lapHeading;A.COURSE.lapLine=ll;A.COURSE.lapHeading=hd;A.RIDERS[0].opt.startSec=115;A.run();
  const l=A.M.lapSum[0];check('start 40 s late: kind "start"',l.diff&&l.diff[0].kind==='start');near('start 40 s late: estimated lap 1 (s)',l.adj,463.4,6);
  check('start 40 s late: later laps unchanged',lapTimes(A.M).slice(1).join()==='455.1,466.3,466.9,464.3,460.8',lapTimes(A.M).join());}
// teammates on the same day
{A.handleBuffer(FIX.westhill,'West Hill');['B','C','D'].forEach(k=>A.addRaw(mkWarp(R0,{M:M0,rate:RATES[k],jit:1}),'Rider '+k));
  check('three warped teammates analysed',A.RIDERS.every(r=>r.M),A.RIDERS.map(r=>r.err).join());
  view('Leaderboard');check('leaderboard leader is Rider C',/1\s+Rider C/.test(txt('lbfind')),txt('lbfind').slice(0,200));}
