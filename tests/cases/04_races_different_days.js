// The same course on another day, a changed course, and a different venue.
const R1=synthRace({seed:1});
A.loadRaw(R1,'Race day 1');
A.addRaw(synthRace({seed:5,t0shift:-7*86400}),'Race day 0');
check('another day: accepted',A.RIDERS[1].M&&!A.RIDERS[1].err,A.RIDERS[1].err);
check('another day: entries become "races"',[...document.querySelectorAll('#viewseg button')].length>0&&/race/i.test(document.body.innerText));
// course changed on the second day: a detour on every lap
A.loadRaw(R1,'Race day 1');A.addRaw(synthRace({seed:6,t0shift:-14*86400,tweak:{a:540,len:90,bulge:35}}),'Changed course');
const r=A.RIDERS[1],Mr=r.M;
check('changed course: accepted',Mr&&!r.err,r.err);
if(Mr){check('changed course: coverage below 100%',Mr.courseCov<0.99&&Mr.courseCov>0.6,Mr.courseCov);
  check('changed course: the detour is marked as a course difference',Mr.offAny&&Mr.laps[2].offs.some(([a,b])=>a<620&&b>520),JSON.stringify(Mr.laps[2].offs));
  check('changed course: all six laps found',Mr.nl===6,Mr.nl);
  view('Compare');check('changed course: sections on the detour show "—"',/—/.test(txt('cmpsec')||document.body.innerText));}
// a different venue
A.loadRaw(R1,'Here');A.addRaw(synthRace({seed:7,origin:{lat:40.4,lon:-75.0}}),'Elsewhere');
check('different venue: rejected',!A.RIDERS[1].M&&/same course|miles away|reference course/i.test(A.RIDERS[1].err||''),A.RIDERS[1].err);
