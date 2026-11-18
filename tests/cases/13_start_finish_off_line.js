// Start and finish away from the lap line. A finish a turn or two before the line leaves the last lap short: it keeps its real time to the finish and
// gets an estimated full-lap time (+ the typical time from the finish to the line). A finish past the line needs nothing. A start a turn or two before
// the line makes lap 1 a full lap plus the run-in: it keeps its real time and its estimate takes the run-in off.
const base=synthRace(),bt=base.truth.lapTimes,full6=bt[5];
const lapsNear=(label,M,want,from,tol)=>check(label,want.slice(from).every((t,k)=>Math.abs(M.lapSum[from+k].time-t)<=tol),M.lapSum.map(l=>l.time.toFixed(1)).join(' / ')+' vs '+want.map(t=>t.toFixed(1)).join(' / '));

{// finish 80 m before the line
  const R=synthRace({finishAt:-80});A.loadRaw(R,'finish before');const M=A.M,l=M.lapSum[5];
  check('finish before the line: last lap is short',M.partialEnd&&l.partialEnd);
  // (the finish found from power is a few seconds early on this synthetic ride; the estimate is measured from the same point, so it isn't affected)
  near('finish before the line: real time to the finish (s)',l.time,R.truth.lapTimes[5],4.5);
  near('finish before the line: estimated full last lap ≈ the real full lap (s)',l.adj,full6,3);
  check('finish before the line: how it was estimated',l.diff&&l.diff[0].kind==='finish'&&l.diff[0].est>5&&l.diff[0].est<20,JSON.stringify(l.diff));
  lapsNear('finish before the line: other laps unchanged',M,bt.slice(0,5),0,1.5);
  check('finish before the line: not the fastest lap',A.RIDERS[0].bestLap!==5);
  check('finish before the line: banner explains the estimate',/before the lap line, so lap 6 is short of a full lap.*counts as/.test(txt('notes')),txt('notes').slice(0,200));
  check('finish before the line: tile says "est. full lap"',/est\. full lap/.test(txt('tiles'))&&/to the finish \+/.test(txt('tiles')),txt('tiles').slice(-300));
  // the CSV notes it
  const got=captureDownloads(),ep=$('exportpanel');ep.hidden=false;A.renderAll();ep.querySelectorAll('button[data-ex]').forEach(b=>b.click());const files=await got();
  check('finish before the line: lap CSV notes the estimate',files.some(f=>/finish before the lap line: time to the finish; estimated full lap in the last column/.test(f)),files.length);}
{// a quarter of a lap short: still estimated; well over that (a rider pulled mid-lap): no lap time, as before
  const R=synthRace({finishAt:-400});A.loadRaw(R,'quarter short');
  near('400 m short: estimated full last lap (s)',A.M.lapSum[5].adj,full6,4);
  const R2=synthRace({finishAt:-650});A.loadRaw(R2,'pulled');const l2=A.M.lapSum[A.M.nl-1];
  check('650 m short: no estimate, no lap time',l2.partialEnd&&l2.adj==null&&!isFinite(l2.time),`${l2.adj} ${l2.time}`);}
{// finish past the line: the last lap is timed at the line and nothing is estimated
  for(const fa of [60,150]){const R=synthRace({finishAt:fa});A.loadRaw(R,'finish past '+fa);const M=A.M;
    check(`finish ${fa} m past the line: six full laps, no estimate`,M.nl===6&&!M.partialEnd&&M.lapSum.every(l=>l.adj==null),`nl=${M.nl} pe=${M.partialEnd}`);
    lapsNear(`finish ${fa} m past the line: lap times`,M,bt,0,1.5);}}
{// grid 100 m before the lap line (lap line picked on the map)
  const R=synthRace({startAt:-100}),c=SYNTH_COURSE.P[0],kx=Math.PI/180*6371000*Math.cos(40*Math.PI/180),ky=Math.PI/180*6371000;
  A.loadRaw(R,'start before');
  check('start before the line, no lap line set: the grid is the line',A.M.lapSum[0].adj==null&&A.M.nl===6);
  A.COURSE.lapLine={lat:40+c.y/ky,lon:-75+c.x/kx};A.COURSE.lapHeading=null;A.run();
  const M=A.M,l=M.lapSum[0];
  check('start before the line: six laps',M.nl===6,M.nl);
  near('start before the line: lap 1 keeps its real time, run-in included (s)',l.time,R.truth.lapTimes[0],2.5);
  check('start before the line: lap 1 is not partial',!l.partial);
  check('start before the line: run-in found',l.diff&&l.diff.length===1&&l.diff[0].kind==='lead'&&l.diff[0].act>8&&l.diff[0].act<18,JSON.stringify(l.diff));
  near('start before the line: estimated lap 1 ≈ a regular lap 1 (s)',l.adj,bt[0],3);
  lapsNear('start before the line: laps 2-6',M,R.truth.lapTimes,1,2);
  check('start before the line: banner explains it',/started .* before the lap line, so lap 1 is a full lap plus that run-in/.test(txt('notes')),txt('notes').slice(0,200));
  check('start before the line: lap 1 has times on every section',A.S.every(s=>s.laps[0]));
  // replay with "Sync different lap": lap 1's dot leaves the line with the others
  const s30=A.replay.seek(30),p0=s30.find(o=>o.id==='lap0'),p2=s30.find(o=>o.id==='lap2');
  check('replay: lap 1 dot keeps level with the other laps',p0&&p2&&p0.vis&&Math.abs(p0.s-p2.s)<40,p0&&`${p0.s|0} vs ${p2.s|0}`);
  A.COURSE.lapLine=null;}
