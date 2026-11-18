// Lap splitting "Set by hand": device lap markers in the wrong places are overridden; lap ends are typed, removed, added, dragged
// and clicked on the timeline. A lap end snaps to the nearest pass of the lap line. The choice and the lap ends are kept in a saved report.
localStorage.clear();
const R=synthRace(),tr=R.truth;
const ends=[];tr.lapTimes.reduce((t,x)=>{ends.push(Math.round(t+x));return t+x;},tr.start); // true lap ends, seconds into the file
const ms=t=>Math.floor(t/60)+':'+String(Math.round(t)%60).padStart(2,'0');
// the problem from a real file: lap markers that don't sit on the lap line (e.g. auto-lap by distance)
R.devLaps=[200,500,800,1100,1400].map(s=>({t:tr.start+s,trig:2}));
A.loadRaw(R,'Hand laps');
$('settingsbtn').click();
const sel=$('lapsplit'),pick=v=>{sel.value=v;sel.dispatchEvent(new Event('change'));};
const inputs=()=>[...document.querySelectorAll('#manlaps input[data-le]')];
const type=(k,v)=>{const inp=inputs()[k];inp.value=v;inp.dispatchEvent(new Event('change'));};
const lapsOk=(label,want)=>check(label,A.M.nl===want.length&&A.M.lapSum.every((l,k)=>Math.abs(l.time-want[k])<=1.5),A.M.lapSum.map(l=>l.time.toFixed(1)).join(' / '));
const svg=()=>document.querySelector('#trimsingle svg'),handle=j=>document.querySelector(`#trimsingle .laph[data-j="${j}"]`);
// screen x of a time on the timeline (its left and right margins are 44 and 14 viewBox units)
const xOf=t=>{const sr=svg().getBoundingClientRect(),N=A.RIDERS[0].RAW.n,vbW=+svg().getAttribute('viewBox').split(' ')[2];return sr.left+(44+t/(N-1)*(vbW-58))*sr.width/vbW;};

check('Set by hand is offered',[...sel.options].some(o=>o.value==='manual'));
pick('device');
check('device markers in the wrong places give wrong laps',A.M.dev.used&&Math.abs(A.M.lapSum[1].time-tr.lapTimes[1])>20,A.M.lapSum.map(l=>l.time.toFixed(0)).join(' / '));

pick('manual');
check('Set by hand starts from the automatic laps (nothing changes until you edit)',A.COURSE.lapSplit==='manual'&&!A.M.man.used&&A.M.nl===6,`${A.COURSE.lapSplit} used=${A.M.man.used} nl=${A.M.nl}`);
lapsOk('automatic laps match the truth',tr.lapTimes);
check('one box per lap end',inputs().length===6,inputs().length);
check('timeline shows a handle per lap end',document.querySelectorAll('#trimsingle .laph').length===6);

// copying the wrong device markers gives wrong laps, and the panel says which ones to check
const nDev=A.M.dev.marks.length; // the markers inside the race window
document.querySelector('#manlaps button[data-lv="0"]').click();
check('copied device markers are used as lap ends',A.M.man.used&&nDev>=3&&inputs().length===nDev,`${inputs().length} boxes, ${nDev} markers`);
check('wrong lap ends are flagged',A.M.man.long.length+A.M.man.short.length+A.M.man.pairs.filter(p=>!p.near).length>0,JSON.stringify({l:A.M.man.long,s:A.M.man.short}));
check('a "Check these laps" banner appears',/Check these laps/.test(txt('notes')),txt('notes').slice(0,160));

// type the real lap ends, roughly (each 4-9 s off): they snap to the passes of the lap line
document.querySelector('#manlaps button[data-lr="0"]').click();
check('Go back to the automatic laps',!A.RIDERS[0].opt.laps&&!A.M.man.used);
const rough=ends.map((t,k)=>t+(k%2?-1:1)*(4+k));
type(0,ms(rough[0]));
for(let k=1;k<6;k++)type(k,ms(rough[k]));
check('typed lap ends are used',A.M.man.used&&JSON.stringify(A.RIDERS[0].opt.laps)===JSON.stringify(rough),JSON.stringify(A.RIDERS[0].opt.laps));
lapsOk('rough lap ends snap to the lap line: true lap times',tr.lapTimes);
check('the panel shows where a lap end snapped to',/snapped to/.test(txt('manlaps')));
check('no warnings for good lap ends',!A.M.man.long.length&&!A.M.man.short.length&&A.M.man.pairs.every(p=>p.near),JSON.stringify(A.M.man));

// remove the end of lap 2: laps 2 and 3 become one long lap, which is flagged
document.querySelector('#manlaps button[data-ld="0:1"]').click();
check('removing a lap end leaves 5 laps',A.M.nl===5,A.M.nl);
check('the merged lap is flagged as about two laps long',A.M.man.long.some(o=>o.k===1&&o.n===2),JSON.stringify(A.M.man.long));
check('the panel suggests adding a lap end',/about 2 laps long: add a lap end/.test(txt('manlaps')));
// Add a lap end: it goes in the middle of the longest lap and snaps to the line
document.querySelector('#manlaps button[data-la="0"]').click();
lapsOk('Add fixes the merged lap',tr.lapTimes);

// timeline: drag the end of lap 4 well away from any pass of the line: used as typed and flagged
{const h=handle(3),rc=h.getBoundingClientRect(),y=rc.top+rc.height/2,x0=xOf(A.RIDERS[0].opt.laps[3]),x1=xOf(ends[3]+tr.lapTimes[4]/2);
  h.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,cancelable:true,clientX:x0,clientY:y,button:0,pointerId:1}));
  dispatchEvent(new PointerEvent('pointermove',{clientX:x1,clientY:y,pointerId:1}));
  dispatchEvent(new PointerEvent('pointerup',{clientX:x1,clientY:y,pointerId:1}));
  const moved=A.RIDERS[0].opt.laps[3];
  check('dragging a lap end on the timeline moves it',Math.abs(moved-(ends[3]+tr.lapTimes[4]/2))<=8,`${moved} vs ${ends[3]+tr.lapTimes[4]/2}`);
  check('a lap end far from the lap line is flagged',A.M.man.pairs.some(p=>!p.near)&&/no pass of the lap line/.test(txt('manlaps')),txt('manlaps').slice(0,300));}
// double-click removes it
handle(3).dispatchEvent(new MouseEvent('dblclick',{bubbles:true}));
check('double-clicking a lap end removes it',A.M.nl===5&&A.M.man.pairs.every(p=>p.near),A.M.nl);
// click the timeline near where lap 4 really ends: a new lap end that snaps there
await sleep(450);
svg().dispatchEvent(new MouseEvent('click',{bubbles:true,clientX:xOf(ends[3]+12),clientY:svg().getBoundingClientRect().top+60,detail:1}));
lapsOk('clicking the timeline adds a lap end that snaps to the line',tr.lapTimes);

// lap ends that can't be used: back to the lap line, with a banner saying why
const keep=A.RIDERS[0].opt.laps.slice();
A.RIDERS[0].opt.laps=[5];A.run();
check('unusable lap ends fall back to the lap line',!!A.M.manFail&&A.M.nl===6,A.M.manFail);
check('a banner explains it',/lap ends you set couldn't be used/.test(txt('notes')),txt('notes').slice(0,200));
A.RIDERS[0].opt.laps=keep;A.run();
lapsOk('restored lap ends',tr.lapTimes);

// saved report keeps the choice and the lap ends
const got=captureDownloads();$('savereport').click();await sleep(100);
const html=(await got())[0]||'',i=html.indexOf('window.CX_PRELOAD='),j=html.indexOf(';</'+'script>',i),pre=JSON.parse(html.slice(i+18,j));
check('saved report keeps Set by hand',pre.course&&pre.course.lapSplit==='manual',pre.course&&pre.course.lapSplit);
check('saved report keeps the lap ends',JSON.stringify(pre.riders[0].opt.laps)===JSON.stringify(keep),JSON.stringify(pre.riders[0].opt.laps));

// two riders: each has their own lap ends, snapped to the course reference's lap line
A.loadRaw(synthRace({seed:1}),'Alex');A.addRaw(synthRace({seed:2,rider:.97}),'Blair');
view('Compare');$('settings').hidden=false;pick('manual');
check('two riders: a lap-end list for each',document.querySelectorAll('#manlaps button[data-la]').length===2);
const b=A.RIDERS[1],bl=b.M.B.slice(1);bl.splice(1,1);b.opt.laps=bl;A.run(); // drop the end of lap 2
check('two riders: removing one of Blair\'s lap ends leaves Alex alone',A.RIDERS[0].M.nl===6&&b.M.nl===5&&b.M.man.used&&!A.RIDERS[0].M.man.used,`${A.RIDERS[0].M.nl} / ${b.M.nl}`);
check('two riders: the long lap is flagged on Blair',b.M.man.long.some(o=>o.k===1),JSON.stringify(b.M.man.long));
