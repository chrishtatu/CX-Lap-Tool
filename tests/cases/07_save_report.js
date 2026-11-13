// "Save report as HTML": the saved file is the whole app plus the data and settings.
localStorage.clear();
A.loadRaw(synthRace({seed:1}),'Alex');A.addRaw(synthRace({seed:2,rider:.97}),'Blair');
view('Leaderboard');A.state.units='met';A.state.cmp.basis=2;A.renderAll();
const got=captureDownloads();$('savereport').click();
check('save panel lets you pick riders',document.querySelectorAll('#savepanel input[data-sv]').length===2);
document.querySelectorAll('#savepanel input[data-sv]').forEach(c=>c.checked=true);$('sv-go').click();await sleep(100);
const html=(await got())[0]||'';
check('saved file is a full HTML page with the app',/^<!doctype html>/i.test(html)&&/window\.CXApp=/.test(html));
const i=html.indexOf('window.CX_PRELOAD='),j=html.indexOf(';</'+'script>',i),data=html.slice(i+18,j);
check('data block found',i>0&&j>i);
const pre=JSON.parse(data);
check('both riders saved',pre.riders&&pre.riders.length===2,pre.riders&&pre.riders.length);
check('view, units and basis saved',pre.view==='lb'&&pre.units==='met'&&pre.cmp&&pre.cmp.basis===2,JSON.stringify({v:pre.view,u:pre.units,b:pre.cmp&&pre.cmp.basis}));
check('no stray closing script tag inside the data',data.indexOf('</'+'script')<0);
A.state.units='imp';
