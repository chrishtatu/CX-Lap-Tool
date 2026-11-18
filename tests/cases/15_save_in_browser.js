// "Save my sections in this browser" (Settings): on by default, sections come back (on "Mine") when the same course is loaded again;
// off, nothing is written to the browser's storage, but your sections still last through re-runs until the page is closed.
localStorage.clear();
const stored=()=>JSON.parse(localStorage.getItem('cxLapAnalyzer.sections.v1')||'[]').length;
const rename=(i,v)=>{$('editsec').click();const inp=document.querySelector(`#detail input[data-i="${i}"]`);inp.value=v;inp.dispatchEvent(new Event('change'));$('ed-done').click();};
A.loadRaw(synthRace(),'Save on');$('settingsbtn').click();
check('the setting is in Settings and on by default',$('savebrowser')&&$('savebrowser').checked);
rename(1,'Sand pit');
check('on: your sections are saved in the browser',stored()===1,stored());
A.loadRaw(synthRace({seed:3}),'Same course again');
check('on: loading the same course again opens on "Mine"',A.state.secMode==='user'&&A.S[1].name==='Sand pit',`${A.state.secMode} ${A.S[1].name}`);
check('… and says so',/saved sections for this course/.test(txt('filenote')),txt('filenote'));
check('"Forget" is offered when something is saved',!$('forgetcourse').disabled);
$('forgetcourse').click();
check('"Forget" removes what was saved for this course',stored()===0&&$('forgetcourse').disabled,stored());

// off
$('savebrowser').click();
check('turning it off is remembered',localStorage.getItem('cxLapAnalyzer.saveInBrowser')==='0');
rename(1,'Plank pit');
check('off: nothing is written to the browser',stored()===0,stored());
A.run();
check('off: your sections still last through a re-run',A.S[1].name==='Plank pit',A.S[1].name);
A.loadRaw(synthRace({seed:4}),'Reopened');
check('off: a newly loaded file doesn\'t switch to "Mine" from storage',A.state.secMode!=='user'||!/saved sections/.test(txt('filenote')),A.state.secMode);
$('settingsbtn').click();if($('settings').hidden)$('settingsbtn').click();
check('the hint explains how to keep them',/Export.*Save report as HTML/.test(txt('savehint')),txt('savehint'));
// on again: what you have now is saved straight away
$('savebrowser').click();
check('turning it back on saves your current sections',stored()===1,stored());
// a lap line picked on the map ("Move lap line") is saved too, and comes back with the next file of the course
localStorage.clear();
const lines=()=>JSON.parse(localStorage.getItem('cxLapAnalyzer.lapLine.v1')||'[]').length;
A.loadRaw(synthRace(),'Lap line');
check('"Move lap line" is on the course map',!!$('mappick')&&$('mappick').getClientRects().length>0);
$('mappick').click();
check('it starts picking the lap line',/Pick the lap line/.test(txt('mapbanner')),txt('mapbanner'));
{$('map').scrollIntoView({block:'center'});const svg=$('map'),g=A.mapGeom,gi=150,pt=svg.createSVGPoint();pt.x=g.px(A.M.gx[gi]);pt.y=g.py(A.M.gy[gi]);const c=pt.matrixTransform(svg.getScreenCTM());
  const el=document.elementFromPoint(c.x,c.y)||svg;el.dispatchEvent(new MouseEvent('click',{bubbles:true,clientX:c.x,clientY:c.y}));}
check('a picked lap line is used',!!A.COURSE.lapLine,JSON.stringify(A.COURSE.lapLine));
check('… and saved in the browser',lines()===1,lines());
A.loadRaw(synthRace({seed:5}),'Lap line again');
check('the next file of the course gets the saved lap line back',!!A.COURSE.lapLine&&!!A.M,JSON.stringify(A.COURSE.lapLine));
check('… and says so',/saved lap line/.test(txt('filenote')),txt('filenote'));
$('settingsbtn').click();if($('settings').hidden)$('settingsbtn').click();
$('lineauto').click();
check('"Use start position" forgets the saved lap line',lines()===0&&!A.COURSE.lapLine,lines());
