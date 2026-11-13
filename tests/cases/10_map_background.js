// Exercise the online-map lifecycle without depending on an external tile service.
const append=document.head.appendChild.bind(document.head),maps=[];
document.head.appendChild=function(el){if(el.dataset&&'cxBasemap' in el.dataset){setTimeout(()=>el.onload(),0);return el;}return append(el);};
class TestMap{
  constructor(options){this.options=options;this.events={};this.bounds=[];maps.push(this);setTimeout(()=>this.emit('idle'),0);}
  on(name,fn){(this.events[name]||(this.events[name]=[])).push(fn);}
  emit(name){(this.events[name]||[]).forEach(fn=>fn({}));}
  resize(){}
  fitBounds(b){this.bounds.push(b);}
  isStyleLoaded(){return true;}
  areTilesLoaded(){return true;}
  remove(){this.removed=true;}
}
window.maplibregl={Map:TestMap};
A.loadRaw(synthRace(),'Map test');const times=JSON.stringify(lapTimes(A.M));
check('loading starts automatically without blocking the course',A.background.status==='loading'&&!$('report').hidden&&!!$('map').querySelector('.msec'));
await sleep(80);
check('Map becomes visible with attribution',A.background.status==='ready'&&$('mapframe').classList.contains('with-basemap')&&!$('map-attribution').hidden);
check('successful maps need no on/off toggle or retry control',!$('bg-map')&&!$('bg-clean')&&$('map-retry').hidden&&txt('mapstatus')==='');
const b=A.background.bounds();
check('camera bounds are geographic and contain the synthetic course',b&&b.flat().every(isFinite)&&b[0][0]<-75&&b[1][0]>-75&&b[0][1]<40&&b[1][1]>40,JSON.stringify(b));
const width=b[1][0]-b[0][0];$('mz-in').click();await sleep(80);const z=A.background.bounds();
check('background camera follows course zoom',z[1][0]-z[0][0]<width*.8&&maps[0].bounds.length>1);
A.selectSection(1);A.replay.seek(45);
check('sections and replay work over the background',A.state.sel===1&&$('replaylayer').children.length>0&&A.background.status==='ready');
maps[0].emit('webglcontextlost');
check('lost graphics context falls back to the SVG course',A.background.status==='unavailable'&&!$('mapframe').classList.contains('with-basemap')&&$('map').querySelector('.msec')&&maps[0].removed);
$('map-retry').click();await sleep(60);
check('Retry map recovers after a failure',A.background.status==='ready'&&maps.length===2);
window.dispatchEvent(new Event('offline'));
check('going offline immediately retains a clean course',A.background.status==='offline'&&/Offline/.test(txt('mapstatus'))&&maps[1].removed);
window.dispatchEvent(new Event('online'));await sleep(60);
check('returning online automatically restores the map',A.background.status==='ready');
check('background changes never alter lap analysis',JSON.stringify(lapTimes(A.M))===times);
check('Simple is the default background',$('map-style').value==='simple'&&typeof maps[0].options.style==='string'&&!$('map-credit-simple').hidden);
const beforeView=$('map').getAttribute('viewBox'),beforeSel=A.state.sel;
function background(mode){$('map-style').value=mode;$('map-style').dispatchEvent(new Event('change'));}
background('aerial');await sleep(60);
const aerial=maps[maps.length-1];
check('Aerial loads imagery with provider credits',A.background.status==='ready'&&aerial.options.style.sources.aerial.type==='raster'&&aerial.options.style.sources.aerial.maxzoom===16&&!$('map-credit-aerial').hidden&&$('map-credit-simple').hidden);
check('changing style preserves zoom, selection, replay and lap times',$('map').getAttribute('viewBox')===beforeView&&A.state.sel===beforeSel&&$('replaylayer').children.length>0&&JSON.stringify(lapTimes(A.M))===times);
window.dispatchEvent(new Event('offline'));
check('Aerial also falls back offline',A.background.status==='offline'&&aerial.removed&&!$('mapframe').classList.contains('with-basemap'));
window.dispatchEvent(new Event('online'));await sleep(60);
check('reconnection restores the selected Aerial style',A.background.status==='ready'&&typeof maps[maps.length-1].options.style==='object');
background('simple');background('aerial');background('simple');await sleep(60);
check('rapid style changes cannot revive a stale background',A.background.status==='ready'&&$('map-style').value==='simple'&&typeof maps[maps.length-1].options.style==='string');
background('aerial');await sleep(60);
const previous=maps[maps.length-1];A.loadRaw(synthRace({seed:2}),'Next course');await sleep(60);
check('a new analysis always starts with Simple',A.background.status==='ready'&&previous.removed&&$('map-style').value==='simple'&&typeof maps[maps.length-1].options.style==='string');
document.head.appendChild=append;
