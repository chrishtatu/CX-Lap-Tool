// Units only change the display: metric labels, same results, replay cursor survives redraws.
A.loadRaw(synthRace(),'Units');const before=lapTimes(A.M).join();
$('u-met').click();
check('metric: speed in km/h',/km\/h/.test(document.body.innerText));
check('metric: lap length in km',/km\/lap/.test($('subtitle').textContent),$('subtitle').textContent);
check('switching units does not change lap times',lapTimes(A.M).join()===before);
A.replay.seek(60);$('u-imp').click();$('u-met').click();$('u-imp').click();
check('imperial again: mph',/mph/.test(document.body.innerText));
check('replay cursor still on the charts after unit changes',[...document.querySelectorAll('.rpc')].some(l=>l.style.display!=='none'));
