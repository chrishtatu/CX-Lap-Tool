// Marking sections as Barriers / Run-up: names, map tags, off-the-bike card, storage, saved reports.
localStorage.clear();
const R=synthRace();A.loadRaw(R,'Marks');
const flat=A.S.findIndex(s=>!/run-up/i.test(s.name)&&s.s0>200);
A.selectSection(flat);const sel=$('sec-mark');check('section panel has a "Mark this section as" menu',!!sel);
sel.value='barriers';sel.dispatchEvent(new Event('change'));
check('marked section is renamed "Barriers"',A.S[flat].name==='Barriers',A.S[flat].name);
check('map shows a "barriers" tag',[...document.querySelectorAll('#map text')].some(t=>t.textContent==='barriers'));
check('off-the-bike card lists the barriers',/Barriers:/.test(txt('offcard')),txt('offcard').slice(0,200));
check('no dismount there, and it says so',/No dismount found here/.test(txt('offcard')));
A.run();check('mark survives a re-run (stored for this course)',A.S[flat].mark==='barriers');
// a name you typed keeps your words
document.getElementById('editsec').click();
const inp=document.querySelector(`#detail input[data-i="${flat}"]`);inp.value='Plank pit';inp.dispatchEvent(new Event('change'));
check('your own name keeps the mark added',A.S[flat].name==='Plank pit (barriers)',A.S[flat].name);
const ms=document.querySelector(`#detail select[data-mk="${flat}"]`);check('section editor has a "Mark as" column',!!ms);
ms.value='runup';ms.dispatchEvent(new Event('change'));check('changing the mark in the editor',A.S[flat].mark==='runup');
$('ed-done').click();
// saved report carries the marks
const got=captureDownloads();$('savereport').click();if($('sv-go'))$('sv-go').click();await sleep(100);
const html=(await got())[0]||'';check('saved report contains the mark',/"marks":\[\{[^\]]*"type":"runup"/.test(html));
// clearing
A.selectSection(flat);$('sec-mark').value='';$('sec-mark').dispatchEvent(new Event('change'));check('mark can be removed',!A.S[flat].mark);
localStorage.clear();
