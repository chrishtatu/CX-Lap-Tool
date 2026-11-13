// Map touch: tap near a line selects it, pinch zooms, one finger pans once zoomed; mouse panning still works.
A.loadRaw(synthRace(),'Touch');const M=A.M,svg=$('map');svg.scrollIntoView();await sleep(50);
check('at full view a one-finger swipe scrolls the page',svg.style.touchAction==='pan-y',svg.style.touchAction);
const g=A.mapGeom,r=svg.getBoundingClientRect(),k=r.width/g.W,scr=(x,y)=>[r.left+g.px(x)*k,r.top+g.py(y)*k];
// tap 12 px off the middle of a section, on empty map
const i=A.S.length>3?3:1,s=A.S[i],gi=Math.round((s.s0+s.s1)/2/M.STEP);let [x,y]=scr(M.gx[gi],M.gy[gi]);
let hit=null;for(const [dx,dy] of [[12,0],[-12,0],[0,12],[0,-12],[9,9]]){const e=document.elementFromPoint(x+dx,y+dy);if(e===svg||(e&&e.closest('#map')&&!e.classList.contains('msec')&&!e.classList.contains('mcor'))){hit=[x+dx,y+dy];break;}}
if(hit){pointer('pointerdown',1,...hit);pointer('pointerup',1,...hit);await sleep(30);check('tap next to a line selects that section',A.state.sel===i,`sel ${A.state.sel}, want ${i}`);}
else check('found empty map next to the line to tap',false);
const c=svg.getBoundingClientRect(),cx=c.left+c.width/2,cy=c.top+c.height/2;
pointer('pointerdown',1,cx-30,cy);pointer('pointerdown',2,cx+30,cy);
for(let j=1;j<=5;j++){pointer('pointermove',1,cx-30-j*12,cy);pointer('pointermove',2,cx+30+j*12,cy);}
pointer('pointerup',1,cx-90,cy);pointer('pointerup',2,cx+90,cy);await sleep(80);
check('pinch zooms in',A.state.mz.z>1.5,A.state.mz.z.toFixed(2));
check('zoomed in: one finger pans the map',$('map').style.touchAction==='none');
function emptyPoint(){const b=$('map').getBoundingClientRect();for(let yy=b.top+30;yy<b.bottom-30;yy+=13)for(let xx=b.left+30;xx<b.right-120;xx+=13){const e=document.elementFromPoint(xx,yy);if(e&&e.closest('#map')&&!e.classList.contains('msec')&&!e.classList.contains('mcor'))return [xx,yy];}return null;}
for(const kind of ['touch','mouse']){const pt=emptyPoint(),v0=A.state.mz.vx;
  pointer('pointerdown',5,pt[0],pt[1],kind);for(let j=1;j<=5;j++)pointer('pointermove',5,pt[0]+j*15,pt[1],kind);pointer('pointerup',5,pt[0]+75,pt[1],kind);await sleep(80);
  check(`${kind} drag pans the zoomed map`,Math.abs(A.state.mz.vx-v0)>5,(A.state.mz.vx-v0).toFixed(1));}
$('mz-fit').click();check('Fit resets the zoom',A.state.mz.z===1);
check('no "Reset zoom" button',!$('resetzoom'));
