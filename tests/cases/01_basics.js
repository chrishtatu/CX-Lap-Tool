// A clean synthetic race: start / finish from power, laps, run-up, sections, and the same race without a power meter.
const R=synthRace(),tr=R.truth;
check('analysis succeeds',A.loadRaw(R,'Synthetic'),$('err').textContent);
const M=A.M;
near('race start found from power (s)',M.rs,tr.start,2);
check('six laps found',M.nl===6,M.nl);
M.lapSum.forEach((l,k)=>near(`lap ${k+1} time matches the truth (s)`,l.time,tr.lapTimes[k],1.5));
near('race time = sum of laps (s)',M.fin-M.rs,tr.lapTimes.reduce((a,b)=>a+b,0),3);
// the reference line is a smoothed lap, slightly shorter than the 1 m course; positions scale with it
const sc=M.Lref/tr.lapLen,zone=M.zones[0];
check('one off-bike zone (the run-up)',M.zones.length===1,JSON.stringify(M.zones.map(z=>[z.c0|0,z.c1|0])));
if(zone){near('run-up starts where it was built (m)',zone.c0,tr.runup[0]*sc,15);near('run-up ends where it was built (m)',zone.c1,tr.runup[1]*sc,15);}
check('corners detected',M.corners.length>=5,M.corners.length);
check('an automatic section is named as the run-up',A.S.some(s=>/run-up/i.test(s.name)),A.S.map(s=>s.name).join(' / '));
check('no lap flagged as a different route',M.lapSum.every(l=>l.adj==null&&!l.shortcut));
check('off-the-bike card shows the run-up',!$('offcard').hidden&&/Time on foot/.test(txt('offcard')));
// without power: start = first movement
const R2=synthRace({noPower:true});A.loadRaw(R2,'No power');
near('no power meter: start from first movement (s)',A.M.rs,tr.start,3);
check('no power meter: same six laps',A.M.nl===6,A.M.nl);
near('no power meter: lap 2 time (s)',A.M.lapSum[1].time,tr.lapTimes[1],1.5);
