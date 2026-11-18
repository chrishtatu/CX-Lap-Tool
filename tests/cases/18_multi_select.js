// Ctrl + click picks several sections at once: the section card adds them up (by lap, or by rider in Compare / Leaderboard), the section table
// gets a "Selected" row, and Clear selection / Esc clear them all. Plus the side-by-side average corner time chart.
localStorage.clear();
A.loadRaw(synthRace(),'Multi');
const row=i=>document.querySelector(`#heat tr.row[data-i="${i}"] td`);
const click=(el,ctrl)=>el.dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true,ctrlKey:!!ctrl}));
click(row(1));click(row(3),true);click(row(4),true);
check('Ctrl + click adds sections to the selection',JSON.stringify(A.state.sels)==='[1,3,4]',JSON.stringify(A.state.sels));
check('the section card adds them up',/3 sections together/.test(txt('detail')),txt('detail').slice(0,80));
{const k=2,want=[1,3,4].reduce((a,i)=>a+A.S[i].laps[k].t,0);
  check('… and its lap total is the sum of the three sections',txt('detail').includes(want.toFixed(1)),want.toFixed(1));}
check('the section table gets a "Selected" row',/Selected S2 \+ S4 \+ S5/.test(txt('heat')),txt('heat').slice(-300));
check('every selected section is highlighted in the table',[1,3,4].every(i=>document.querySelector(`#heat tr.row[data-i="${i}"]`).classList.contains('sel')));
check('the charts shade every selected section',document.querySelectorAll('#spd rect[fill="var(--wash)"]').length===3);
click(row(3),true);
check('Ctrl + click again takes one out',JSON.stringify(A.state.sels)==='[1,4]',JSON.stringify(A.state.sels));
click(row(2));
check('a plain click goes back to one section',(!A.state.sels||!A.state.sels.length)&&A.state.sel===2);
click(row(5),true);click(row(6),true);
$('clearsel').click();
check('Clear selection removes them all',A.state.sel==null&&!A.state.sels.length&&/Lap times/.test(txt('detail')));
click(row(0));click(row(1),true);
document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}));
check('Esc clears the selection',A.state.sel==null&&!A.state.sels.length);

// Compare and Leaderboard
A.addRaw(synthRace({seed:2,rider:.97}),'Blair');A.addRaw(synthRace({seed:3,rider:1.03}),'Casey');
view('Compare');
const srow=(id,i)=>document.querySelector(`#${id} tr.row[data-i="${i}"] td`);
click(srow('cmpsec',0));click(srow('cmpsec',2),true);
check('Compare: the section card adds the picked sections up for both riders',/2 sections together/.test(txt('detail'))&&/together:/.test(txt('detail')),txt('detail').slice(0,200));
view('Leaderboard');
click(srow('lbsec',1));click(srow('lbsec',2),true);click(srow('lbsec',5),true);
check('Leaderboard: a "Together" row for every rider',/3 sections together/.test(txt('detail'))&&/Together \(typical lap\)/.test(txt('detail')),txt('detail').slice(0,200));
$('clearsel').click();

// side-by-side average corner time with its spread
{const s=$('lbcorners').querySelector('.stackm');s.value='avg';s.dispatchEvent(new Event('change'));}
const lc=$('lbcorners');
check('the corner chart offers average time side by side',A.state.stackMetric==='avg'&&/average time, side by side/.test(txt('lbcorners')));
check('… one bar per rider per corner',lc.querySelectorAll('.stackbars rect:not(.cb)').length===A.M.corners.length*3,lc.querySelectorAll('.stackbars rect:not(.cb)').length);
check('… with spread lines',lc.querySelectorAll('.stackbars line[stroke="var(--ink)"]').length>=A.M.corners.length*3,lc.querySelectorAll('.stackbars line[stroke="var(--ink)"]').length);
check('… explained in the hint',/standard deviation/.test(txt('lbcorners')));
