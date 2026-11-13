// Lap 1 on a different route: a shortcut start, an extra loop, and a race that starts partway round.
// The estimated regular-course time for lap 1 should be close to lap 1's time on the regular course (the same race without the change).
const base=synthRace(),truth1=base.truth.lapTimes[0];
function run(name,o){const R=synthRace(o);A.loadRaw(R,name);return {M:A.M,R};}
{const {M,R}=run('shortcut',{skip1:{a:300,b:520}}),l=M.lapSum[0];
  check('shortcut: lap 1 flagged as a different route',l.adj!=null,JSON.stringify(l.diff));
  check('shortcut: found as a skipped stretch',l.diff&&l.diff.some(p=>p.kind==='skip'||p.kind==='detour'));
  near('shortcut: estimated lap 1 ≈ regular lap 1 (s)',l.adj,truth1,5);
  check('shortcut: real lap 1 is shorter than the estimate',l.time<l.adj-10,`${l.time.toFixed(1)} vs ${l.adj.toFixed(1)}`);
  check('shortcut: sections on the cut show "—" for lap 1',A.S.some(s=>!s.laps[0]));
  check('shortcut: shared sections keep lap 1 times',A.S.filter(s=>s.laps[0]).length>=3);
  near('shortcut: race time unchanged (s)',M.fin-M.rs,R.truth.lapTimes.reduce((a,b)=>a+b,0),3);
  check('shortcut: banner explains the estimate',/Lap 1 differs from the other laps/.test(txt('notes')));
  check('shortcut: other laps untouched',M.lapSum.slice(1).every(x=>x.adj==null));}
{const {M}=run('loop',{loop1:{at:820,r:22}}),l=M.lapSum[0];
  check('extra loop: lap 1 flagged',l.adj!=null,JSON.stringify(l.diff));
  near('extra loop: estimated lap 1 ≈ regular lap 1 (s)',l.adj,truth1,5);
  check('extra loop: real lap 1 is longer than the estimate',l.time>l.adj+10,`${l.time.toFixed(1)} vs ${l.adj&&l.adj.toFixed(1)}`);}
{// the race starts 260 m past the lap line; without a lap line set the app (rightly) treats the grid as the line, so set it like a user would in Settings
  const R=synthRace({startAt:260}),c=SYNTH_COURSE.P[0],kx=Math.PI/180*6371000*Math.cos(40*Math.PI/180),ky=Math.PI/180*6371000;
  A.loadRaw(R,'late start');check('start past the line: without a lap line, the grid is the line',A.M.lapSum[0].adj==null);
  A.COURSE.lapLine={lat:40+c.y/ky,lon:-75+c.x/kx};A.COURSE.lapHeading=null;A.run();
  const M=A.M,l=M.lapSum[0];
  check('start past the line: lap 1 flagged',l.adj!=null,JSON.stringify(l.diff));
  check('start past the line: kind is "start"',l.diff&&l.diff[0].kind==='start');
  near('start past the line: estimated lap 1 ≈ regular lap 1 (s)',l.adj,truth1,6);}
{A.loadRaw(base,'clean');check('clean race: no lap 1 estimate',A.M.lapSum[0].adj==null);}
