// Moving-dot replay: dots start together, the faster lap leads, and "Sync different lap" holds a shortcut lap back.
const R=synthRace({lapFactors:[1,1.06,1,1,1,0.94]});A.loadRaw(R,'Replay');
const at=t=>A.replay.seek(t),byId=(snap,id)=>snap.find(o=>o.id===id);
const s0=at(0);
check('every lap dot starts at the lap line',s0.every(o=>o.vis&&o.s<40),JSON.stringify(s0.map(o=>Math.round(o.s))));
const mid=at(90);
check('the fastest lap (lap 2) leads mid-lap',byId(mid,'lap1').s>byId(mid,'lap5').s,`${byId(mid,'lap1').s|0} vs ${byId(mid,'lap5').s|0}`);
check('gap table lists every lap',document.querySelectorAll('#replaygaps tr').length>=7);
check('chart cursor follows the leading dot',[...document.querySelectorAll('.rpc')].some(l=>l.style.display!=='none'));
A.replay.play();await sleep(400);A.replay.pause();check('play advances the clock',A.replay.state.t>0);
// shortcut lap 1 with sync on (default): the dot jumps to the rejoin point and waits there
const Rs=synthRace({skip1:{a:300,b:520}});A.loadRaw(Rs,'Sync');const M=A.M,l=M.lapSum[0],p=l.diff[0];
check('"Sync different lap" offered',!!$('rp-sync')&&$('rp-sync').checked);
near('synced replay lasts lap 1\'s estimated time (s)',A.replay.dur,Math.max(l.adj,...M.lapSum.slice(1).map(x=>x.time)),1);
const Ta=M.tgAt(0,p.a)-M.laps[0].tstart,w1=byId(at(Ta+p.act+3),'lap0'),w2=byId(at(Ta+p.est-3),'lap0'),w3=byId(at(Ta+p.est+8),'lap0');
check('synced: dot waits at the rejoin point',w1.vis&&w2.vis&&Math.abs(w1.s-w2.s)<3,`${w1.s} → ${w2.s}`);
check('synced: dot moves on after the wait',w3.s>w2.s+15,`${w2.s} → ${w3.s}`);
$('rp-sync').click();const u=byId(at(Ta+p.act+3),'lap0');
check('unsynced: dot is already past the rejoin point',u.vis&&u.s>=w1.s-2,u.s);
