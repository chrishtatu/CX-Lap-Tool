// Three riders: the rider menu repeated above the charts, more than two riders on the Compare charts, picking who shows in the Leaderboard,
// and the stacked corner chart under the corner tables.
localStorage.clear();
A.loadRaw(synthRace({seed:1}),'Alex');A.addRaw(synthRace({seed:2,rider:.97}),'Blair');A.addRaw(synthRace({seed:3,rider:1.03}),'Casey');
const col=i=>getComputedStyle(document.body).getPropertyValue('--l'+(i%8+1)).trim();
const drawn=(chart,i)=>[...document.querySelectorAll(`#${chart} path`)].some(p=>p.getAttribute('stroke')===col(i)&&['2.5','2.2'].includes(p.getAttribute('stroke-width')));
view('Compare');
const bar=$('chartbar');
check('the rider menu is repeated above the time-gap chart',!!bar.querySelector('select[data-cb="a"]')&&!!bar.querySelector('select[data-cb="b"]')&&!!bar.querySelector('select[data-cb="basis"]'));
check('… and above the speed chart',!!$('chartbar2').querySelector('select[data-cb="a"]'));
check('two riders on the charts to start with',drawn('spd',0)&&drawn('spd',1)&&!drawn('spd',2));
const more=bar.querySelector('input[data-cbmore="2"]');check('"also show" offers the third rider',!!more);
more.click();
check('ticking the third rider adds them to the speed chart',drawn('spd',2));
check('… and to the time-gap chart',drawn('gap',2)&&drawn('gap',1));
check('the gap note talks about every rider shown',/each bold line/.test(txt('cmpgapnote')),txt('cmpgapnote').slice(0,120));
{const s=$('chartbar2').querySelector('select[data-cb="a"]');s.value='2';s.dispatchEvent(new Event('change'));}
check('switching "Compare" from the chart menu changes the comparison',A.state.cmp.a===2&&/Casey/.test(txt('cmphead')),A.state.cmp.a);
check('the menus stay in step',$('chartbar').querySelector('select[data-cb="a"]').value==='2');
check('the stacked corner chart is under the Compare corner table',$('cmpcorners').querySelectorAll('.stackbars rect.cb').length===A.M.corners.length);
// Leaderboard: everyone to start with, untick one
view('Leaderboard');
check('Leaderboard charts show every rider',[0,1,2].every(i=>drawn('spd',i)));
$('chartbar').querySelector('input[data-cbshow="1"]').click();
check('unticking a rider takes them off the charts',!drawn('spd',1)&&drawn('spd',0)&&drawn('spd',2));
{const z=$('chartbar').querySelector('select[data-cb="zero"]');z.value='2';z.dispatchEvent(new Event('change'));}
check('the zero line can be picked',/Casey's/.test(txt('cmpgapnote')),txt('cmpgapnote').slice(0,80));
const lc=$('lbcorners');
check('the stacked corner chart is under the corner leaderboard',lc.querySelectorAll('.stackbars rect.cb').length===A.M.corners.length);
check('… with one legend entry per rider shown',lc.querySelectorAll('.stackleg > span').length===2,lc.querySelectorAll('.stackleg > span').length);
check('… and blocks drawn',lc.querySelectorAll('.stackbars rect:not(.cb)').length>0);
{const s=lc.querySelector('.stackm');s.value='behind';s.dispatchEvent(new Event('change'));}
check('the stacked chart can show time behind the quickest',A.state.stackMetric==='behind'&&$('lbcorners').querySelectorAll('.stackbars rect:not(.cb)').length>0);
$('lbcorners').querySelector('.stackbars rect.cb[data-j="2"]').dispatchEvent(new MouseEvent('click',{bubbles:true}));
check('clicking a bar picks that corner',A.state.corner===2,A.state.corner);
