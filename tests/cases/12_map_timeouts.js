// A slow or non-responsive provider cannot block analysis or revive a disconnected map.
const append=document.head.appendChild.bind(document.head),maps=[];
document.head.appendChild=function(el){if(el.dataset&&'cxBasemap' in el.dataset){setTimeout(()=>el.onload(),300);return el;}return append(el);};
class StalledMap{
  constructor(){this.events={};maps.push(this);}
  on(n,f){(this.events[n]||(this.events[n]=[])).push(f);}
  resize(){} fitBounds(){} remove(){this.removed=true;}
  isStyleLoaded(){return true;} areTilesLoaded(){return false;}
}
window.maplibregl={Map:StalledMap};
A.loadRaw(synthRace(),'Slow map');
check('course remains usable while the background loads',A.background.status==='loading'&&!$('report').hidden&&!!$('map').querySelector('.msec'));
window.dispatchEvent(new Event('offline'));await sleep(400);
check('a late library load does not revive a disconnected map',A.background.status==='offline'&&maps.length===0);
window.dispatchEvent(new Event('online'));await sleep(80);
check('retry starts a background with the downloaded library',A.background.status==='loading'&&maps.length===1);
await sleep(8100);
check('stalled tiles fall back with a retry option',A.background.status==='unavailable'&&maps[0].removed&&!$('mapframe').classList.contains('with-basemap')&&!$('map-retry').hidden);
A.selectSection(0);A.replay.seek(30);
check('timed-out provider leaves section selection and replay working',A.state.sel===0&&$('replaylayer').children.length>0);
document.head.appendChild=append;
