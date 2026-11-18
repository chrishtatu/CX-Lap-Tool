// Section editor: S splits where you point, dragging a boundary onto the next one merges the two sections, and clicking a section in the list
// zooms the map to it (and in "Draw in order" carries on drawing from its start).
localStorage.clear();
A.loadRaw(synthRace(),'Editor');
$('editsec').click();$('tool-adj').click();
const n0=A.USER.cuts.length;
// point at the speed chart, press S
{const ov=document.querySelector('#spd .ov'),rc=ov.getBoundingClientRect(),c=A.charts?null:null;
  const x=rc.left+rc.width*0.5;ov.dispatchEvent(new MouseEvent('mousemove',{bubbles:true,clientX:x,clientY:rc.top+40}));
  document.dispatchEvent(new KeyboardEvent('keydown',{key:'s',bubbles:true}));}
check('S adds a boundary where you point',A.USER.cuts.length===n0+1,`${n0} → ${A.USER.cuts.length}`);
check('… and names line up with sections',A.USER.names.length===A.USER.cuts.length+1);
document.dispatchEvent(new KeyboardEvent('keydown',{key:'s',bubbles:true}));
check('S on an existing boundary doesn\'t add another',A.USER.cuts.length===n0+1&&/already a boundary/.test(txt('filenote')),txt('filenote'));
// drag boundary 2 onto boundary 3: the section between them closes up
const svg=$('map'),hc=ci=>svg.querySelector(`circle[data-cut="${ci}"]`),ctr=el=>{const r=el.getBoundingClientRect();return {x:r.left+r.width/2,y:r.top+r.height/2};};
const cuts0=A.USER.cuts.slice(),names0=A.USER.names.slice();
{const a=ctr(hc(1)),b=ctr(hc(2)),ev=(type,p,tg)=>(tg||svg).dispatchEvent(new PointerEvent(type,{bubbles:true,cancelable:true,clientX:p.x,clientY:p.y,pointerId:7,pointerType:'mouse',button:0,isPrimary:true}));
  ev('pointerdown',a,hc(1));for(let q=1;q<=10;q++)ev('pointermove',{x:a.x+(b.x-a.x)*q/10,y:a.y+(b.y-a.y)*q/10});
  check('dragging onto the next boundary shows "merge"',/merge/.test(txt('drawinfo')),txt('drawinfo'));
  ev('pointerup',b);}
check('letting go merges: one boundary fewer',A.USER.cuts.length===cuts0.length-1,`${cuts0.length} → ${A.USER.cuts.length}`);
check('the boundary it was dropped on stays put',A.USER.cuts.some(c=>Math.abs(c-cuts0[2])<0.5)&&!A.USER.cuts.some(c=>Math.abs(c-cuts0[1])<0.5),JSON.stringify(A.USER.cuts.map(Math.round)));
check('the closed-up section\'s name is gone, the others keep theirs',A.USER.names.length===names0.length-1&&A.USER.names[1]===names0[1]&&A.USER.names[2]===names0[3],JSON.stringify(A.USER.names));
// pick a section in the list
const pick=i=>document.querySelector(`#detail tr[data-es="${i}"] td`).click();
A.state.mz.z=1;pick(3);
check('clicking a section in the list zooms the map to it',A.state.mz.z>1.05,A.state.mz.z.toFixed(2));
check('… and lights it up',/picked/.test(txt('drawinfo'))&&!!document.querySelector('#detail tr[data-es="3"]').style.outline,txt('drawinfo'));
// picking a section in "Draw in order" switches to Adjust: nothing starts following the pointer
$('tool-draw').click();pick(2);
check('picking a section switches to Adjust instead of drawing from it',$('tool-adj').classList.contains('on')&&/picked/.test(txt('drawinfo')),txt('drawinfo').slice(0,80));
// arrow keys move the picked section's end (→ ←) and start (Shift)
$('ed-reset').click();pick(2);
const key=(k,shift)=>document.dispatchEvent(new KeyboardEvent('keydown',{key:k,shiftKey:!!shift,bubbles:true}));
{const s0=A.S[2].s0,s1=A.S[2].s1;key('ArrowRight');key('ArrowRight');
  check('→ moves the end forward (3 m a press)',Math.abs(A.S[2].s1-(s1+6))<0.6&&Math.abs(A.S[2].s0-s0)<0.1,`${s1.toFixed(1)} → ${A.S[2].s1.toFixed(1)}`);
  key('ArrowLeft',true);check('Shift + ← moves the start back',Math.abs(A.S[2].s0-(s0-3))<0.6,`${s0.toFixed(1)} → ${A.S[2].s0.toFixed(1)}`);}
// keep pushing the end: once it passes the next section's end, that section merges in
{const n=A.S.length,nm=A.USER.names[2],next1=A.S[3].s1;let guard=0;while(A.S.length===n&&guard++<400)key('ArrowRight');
  check('pushing the end past the next boundary merges that section in',A.S.length===n-1,`${n} → ${A.S.length}`);
  check('… the picked section keeps its name and stays picked',/picked/.test(txt('drawinfo'))&&txt('drawinfo').includes('S3'),txt('drawinfo').slice(0,80));
  check('… and now reaches past where the merged section ended',A.S[2].s1>=next1-0.5,`${A.S[2].s1.toFixed(1)} vs ${next1.toFixed(1)}`);}
// drag a handle past the next boundary, into the section after it: the section it passed merges in
$('ed-reset').click();
{const cuts0=A.USER.cuts.slice(),a=ctr(hc(1)),g=A.mapGeom,tgt=(cuts0[2]+cuts0[3])/2,gi=Math.round(tgt/A.M.STEP),pt=svg.createSVGPoint();pt.x=g.px(A.M.gx[gi]);pt.y=g.py(A.M.gy[gi]);const c=pt.matrixTransform(svg.getScreenCTM()),b={x:c.x,y:c.y};
  const ev=(type,p,tg)=>(tg||svg).dispatchEvent(new PointerEvent(type,{bubbles:true,cancelable:true,clientX:p.x,clientY:p.y,pointerId:8,pointerType:'mouse',button:0,isPrimary:true}));
  ev('pointerdown',a,hc(1));for(let q=1;q<=20;q++)ev('pointermove',{x:a.x+(b.x-a.x)*q/20,y:a.y+(b.y-a.y)*q/20});
  check('dragging past a boundary shows "merge"',/merge/.test(txt('drawinfo')),txt('drawinfo'));ev('pointerup',b);
  check('… and letting go removes the boundary it passed',A.USER.cuts.length===cuts0.length-1&&!A.USER.cuts.some(c=>Math.abs(c-cuts0[2])<0.5)&&A.USER.cuts.some(c=>Math.abs(c-tgt)<15),JSON.stringify(A.USER.cuts.map(Math.round))+' target '+Math.round(tgt));}
$('ed-done').click();
