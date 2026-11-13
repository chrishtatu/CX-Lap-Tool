// Helpers available to every test case.
//   check(name, ok, detail)          record a pass / fail
//   near(name, value, want, tol)     pass when |value - want| <= tol
//   view(label)                      click a View button ("Compare", "Leaderboard", a rider name)
//   $(id), txt(id), sleep(ms)
//   A = window.CXApp (the app's test interface), FIX = loaded fixtures (ArrayBuffers, local cases only)
const T={checks:[],errors:[]};
window.addEventListener('error',e=>T.errors.push(e.message));
const $=id=>document.getElementById(id);
const txt=id=>($(id)?$(id).innerText:'').replace(/\n+/g,' | ');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
function check(name,ok,detail){T.checks.push({name,ok:!!ok,detail:detail==null?'':String(detail)});return !!ok;}
function near(name,v,want,tol){return check(name,isFinite(v)&&Math.abs(v-want)<=tol,`got ${isFinite(v)?(+v).toFixed(2):v}, want ${(+want).toFixed(2)} ± ${tol}`);}
function view(label){const b=[...document.querySelectorAll('#viewseg button')].find(b=>b.textContent.trim()===label);if(!b)throw new Error('no View button "'+label+'"');b.click();}
const lapTimes=M=>M.lapSum.map(l=>+l.time.toFixed(1));
// capture CSV downloads: returns a function giving the texts downloaded so far
function captureDownloads(){const blobs=[];URL.createObjectURL=b=>{blobs.push(b);return 'blob:test';};HTMLAnchorElement.prototype.click=function(){};
  return async()=>Promise.all(blobs.map(b=>b.text()));}
// simulated pointer events on the map (touch or mouse)
function pointer(type,id,x,y,kind){const tgt=type==='pointerdown'?(document.elementFromPoint(x,y)||$('map')):$('map');
  tgt.dispatchEvent(new PointerEvent(type,{pointerId:id,pointerType:kind||'touch',clientX:x,clientY:y,bubbles:true,cancelable:true,button:0,isPrimary:id===1}));return tgt;}

// Keep analysis tests independent of optional online mapping. Map cases replace these fakes.
window.maplibregl={Map:class{constructor(){throw new Error('Map provider unavailable in this test');}}};
const appendTestHead=document.head.appendChild.bind(document.head);
document.head.appendChild=function(el){
  if(el.dataset&&'cxBasemap' in el.dataset){setTimeout(()=>el.onerror(),0);return el;}
  return appendTestHead(el);
};
