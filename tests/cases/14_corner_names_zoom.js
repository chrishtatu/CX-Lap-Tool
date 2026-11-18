// Corner names: a corner you haven't named is called after its section; a name you type survives moving the lap line.
// The start/finish timeline zooms with Ctrl + scroll and has a Reset zoom button.
localStorage.clear();
const R=synthRace();A.loadRaw(R,'Names');
const M=A.M,c0=M.corners[0];
const secOf=c=>A.S[c.sec-1];
{const sn=secOf(c0).name.replace(/^From the line: /,'').replace(/\s*\([^)]*\)\s*$/,'').toLowerCase(),ph=document.querySelector('#ctab input.cname').placeholder;
  check('an unnamed corner is named after its section',ph.toLowerCase().startsWith(sn),ph+' / '+secOf(c0).name);}
check('the corner table shows the section name',txt('ctab').includes(`S${c0.sec} ${secOf(c0).name}`),txt('ctab').slice(0,200));
check('corner report uses the section-based names',/C1 · /.test(txt('cornerreport')),txt('cornerreport').slice(0,200));
// name a corner in the middle of the lap, then move the lap line along the course
const j=Math.floor(M.corners.length/2),inp=[...document.querySelectorAll('#ctab input.cname')][j];
inp.value='Sand pit exit';inp.dispatchEvent(new Event('change'));
check('a typed name is used',A.M.corners[j].cname==='Sand pit exit');
const p=SYNTH_COURSE.P[400],kx=Math.PI/180*6371000*Math.cos(40*Math.PI/180),ky=Math.PI/180*6371000;
A.COURSE.lapLine={lat:40+p.y/ky,lon:-75+p.x/kx};A.COURSE.lapHeading=null;A.run();
const named=A.M.corners.filter(c=>c.cname==='Sand pit exit');
check('the name is still on one corner after the lap line moves',named.length===1,named.length);
{const a=M.corners[j],b=named[0],dx=b&&(A.M.toLL(A.M.gx[Math.round(b.s/A.M.STEP)],A.M.gy[Math.round(b.s/A.M.STEP)])),da=M.toLL(M.gx[Math.round(a.s/M.STEP)],M.gy[Math.round(a.s/M.STEP)]);
  check('… at the same place on the course',!!b&&Math.hypot((dx.lat-da.lat)*ky,(dx.lon-da.lon)*kx)<25,b&&Math.hypot((dx.lat-da.lat)*ky,(dx.lon-da.lon)*kx).toFixed(1)+' m');}
// reload the stored names with the moved lap line
A.loadRaw(synthRace(),'Names again');A.COURSE.lapLine={lat:40+p.y/ky,lon:-75+p.x/kx};A.run();
check('stored names still match after a reload with the moved lap line',A.M.corners.some(c=>c.cname==='Sand pit exit'));
A.COURSE.lapLine=null;A.run();
check('… and with the lap line back at the start',A.M.corners.some(c=>c.cname==='Sand pit exit'));

// timeline zoom
$('settingsbtn').click();
const svg=()=>document.querySelector('#trimsingle svg'),N=A.RIDERS[0].RAW.n;
{const rc=svg().getBoundingClientRect();svg().dispatchEvent(new WheelEvent('wheel',{bubbles:true,cancelable:true,ctrlKey:true,deltaY:-300,clientX:rc.left+rc.width/2,clientY:rc.top+50}));}
check('Ctrl + scroll zooms the timeline',!!document.querySelector('#trimsingle .tzreset')&&/Zoomed to/.test(txt('trimsingle')),txt('trimsingle').slice(0,120));
{const rc=svg().getBoundingClientRect();for(let q=0;q<6;q++)svg().dispatchEvent(new WheelEvent('wheel',{bubbles:true,cancelable:true,ctrlKey:true,deltaY:-300,clientX:rc.left+rc.width/2,clientY:rc.top+50}));}
const m=/Zoomed to (\d+):(\d+)–(\d+):(\d+)/.exec(txt('trimsingle')),span=m?(+m[3]*60+ +m[4])-(+m[1]*60+ +m[2]):NaN;
check('zooming in stops at 30 s',span>=29&&span<=31,span);
const before=txt('trimsingle');svg().dispatchEvent(new WheelEvent('wheel',{bubbles:true,cancelable:true,shiftKey:true,deltaY:200}));
check('Shift + scroll moves along while zoomed',txt('trimsingle')!==before);
const fin0=A.M.fin;$('finsec').value=String(fin0);A.run();
check('zoom is kept when the analysis re-runs',!!document.querySelector('#trimsingle .tzreset'));
document.querySelector('#trimsingle .tzreset').click();
check('Reset zoom shows the whole recording',!document.querySelector('#trimsingle .tzreset')&&/Whole recording/.test(txt('trimsingle')));
