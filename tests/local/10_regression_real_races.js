// fixtures: westhill treehouse
// Exact numbers from two real races. Any change to the analysis engine must reproduce these.
A.handleBuffer(FIX.westhill,'West Hill');let M=A.M;
check('West Hill: start at 75 s',M.rs===75,M.rs);
check('West Hill: lap times',lapTimes(M).join()==='463.4,455.1,466.3,466.9,464.3,460.8',lapTimes(M).join());
check('West Hill: 33 corners',M.corners.length===33,M.corners.length);
check('West Hill: 16 automatic sections',A.S.length===16,A.S.length);
check('West Hill: off-bike zone ≈ 1810–1914 m',M.zones.length===1&&Math.abs(M.zones[0].c0-1810)<15&&Math.abs(M.zones[0].c1-1914)<15,JSON.stringify(M.zones.map(z=>[z.c0|0,z.c1|0])));
check('West Hill: no lap 1 estimate',M.lapSum[0].adj==null);
A.handleBuffer(FIX.treehouse,'Treehouse');M=A.M;
check('Treehouse: start at 12 s',M.rs===12,M.rs);
check('Treehouse: lap times',lapTimes(M).join()==='473,503,501.7,503.9,499.9',lapTimes(M).join());
check('Treehouse: 45 corners',M.corners.length===45,M.corners.length);
check('Treehouse: 18 automatic sections',A.S.length===18,A.S.length);
const l=M.lapSum[0];
check('Treehouse: lap 1 shortcut found (≈293–635 m)',l.diff&&l.diff.length===1&&l.diff[0].kind==='skip'&&Math.abs(l.diff[0].a-293)<10&&Math.abs(l.diff[0].b-635)<10,JSON.stringify(l.diff));
near('Treehouse: estimated lap 1 (s)',l.adj,552.2,0.5);
// a different venue is rejected
A.handleBuffer(FIX.treehouse,'Treehouse');const RT=A.RIDERS[0].RAW;
A.handleBuffer(FIX.westhill,'West Hill');A.addRaw(RT,'Treehouse');
check('Treehouse added to West Hill is rejected as another course',!A.RIDERS[1].M&&/miles away|same course/.test(A.RIDERS[1].err||''),A.RIDERS[1].err);
