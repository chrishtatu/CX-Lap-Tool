// Several riders on the same course: Compare, Leaderboard, system weight and the CSV exports.
const R1=synthRace({seed:1}),R2=synthRace({seed:2,rider:0.96}),R3=synthRace({seed:3,rider:1.03}),R4=synthRace({seed:4,rider:0.99});
A.loadRaw(R1,'Alex');A.addRaw(R2,'Blair');A.addRaw(R3,'Casey');A.addRaw(R4,'Drew');
check('four riders analysed',A.RIDERS.every(r=>r.M&&!r.err),A.RIDERS.map(r=>r.err).join(' / '));
const med=r=>{const t=r.truth.lapTimes.slice(1);t.sort((a,b)=>a-b);return t[Math.floor(t.length/2)];};
view('Compare');
check('Compare view title',/Alex vs Blair/.test($('title').textContent),$('title').textContent);
check('Compare bottom line names the faster rider (Alex)',/Alex<\/b> is faster|Alex is faster/.test($('cmpfind').innerHTML),txt('cmpfind').slice(0,160));
view('Leaderboard');
const rank=[...document.querySelectorAll('#lbfind table tr')].slice(1,5).map(tr=>tr.children[1]&&tr.children[1].innerText.trim().split(/\s/)[0]);
const want=[['Alex',R1],['Blair',R2],['Casey',R3],['Drew',R4]].sort((a,b)=>med(a[1])-med(b[1])).map(x=>x[0]);
check('Leaderboard ranks riders by typical lap',JSON.stringify(rank)===JSON.stringify(want),`${rank} vs ${want}`);
check('ideal lap shown',/Ideal lap/.test(txt('lbfind')));
// weights -> W/kg
A.RIDERS.forEach((r,i)=>r.sysLb=160+i*5);A.state.useWeight=true;A.renderAll();
check('W/kg used with weights on',/W\/kg/.test(document.body.innerText));
A.state.useWeight=false;A.renderAll();
// CSV exports from each view
const got=captureDownloads();
for(const v of ['Alex','Compare','Leaderboard']){view(v);const ep=$('exportpanel');ep.hidden=false;A.renderAll();ep.querySelectorAll('button[data-ex]').forEach(b=>b.click());}
const files=await got();
check('CSV exports produced',files.length>=8,files.length);
check('CSV files have a header and rows',files.every(f=>f.split('\r\n').filter(Boolean).length>=2));
