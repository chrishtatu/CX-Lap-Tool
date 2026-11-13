// Synthetic cyclocross race generator for tests: a made-up course and rider, no real data.
//
// synthRace(opts) returns the same "raw series" object the app builds from a .fit file
// ({n, t0, lat, lon, alt, dist, spd, pw, cad, hr, meta, devLaps}, one sample per second), plus `truth`:
// what really happened (lap times, course length, the run-up position), so tests can compare the
// app's answer with the right one.
//
// The course (about 1.6 km) has a long start straight, a serpentine of 90° turns, a diagonal,
// a fast straight, a run-up (off the bike, climbing, wheel stopped) and a sweeping return to the line.
// Speed comes from corner radius with braking/acceleration limits; power and cadence follow it.
//
// Options (all optional):
//   seed        random seed (jitter, noise)                        default 1
//   laps        number of laps                                     default 6
//   lapFactors  speed multiplier per lap                           default [1, 1.02, 1.0, .99, .985, .975]
//   rider       overall speed multiplier (another rider)           default 1
//   t0shift     seconds added to the start time (another day)      default 0
//   origin      {lat, lon} of the course                           default 40.0, -75.0
//   skip1       {a, b}: lap 1 cuts straight from position a to b (metres along the lap) - a shortcut start route
//   loop1       {at, r}: lap 1 rides an extra loop of radius r (m) off the course at position at
//   startAt     metres along the lap where the race starts (grid past the lap line)
//   tweak       {a, len, bulge}: every lap takes a detour bulge (m) between a and a+len (course changed on another day)
//   jitter      GPS noise in metres                                default 1.2
//   noPower     drop the power and cadence channels                default false

(function(){
const ORIGIN={lat:40.0,lon:-75.0};
const WAYPOINTS=[[0,0],[230,0],[230,45],[60,45],[60,90],[230,90],[310,170],[190,262],[-40,262],[-62,140],[-42,32]];
const RUNUP={from:0.30,to:0.62,climb:7}; // fraction of the leg from waypoint 8 to 9 that is ridden on foot, and its climb (m)

function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
function smoothNoise(rnd,len,step){const k=[];for(let i=0;i<=Math.ceil(len/step)+1;i++)k.push(rnd()*2-1);
  return s=>{const u=s/step,i=Math.floor(u),f=u-i,w=(1-Math.cos(Math.PI*f))/2;return k[i%k.length]*(1-w)+k[(i+1)%k.length]*w;};}

// the regular course, sampled every metre: {x, y, alt, off, v (target speed m/s)}
function buildCourse(){
  const W=WAYPOINTS,raw=[];let legStart=[];
  for(let i=0;i<W.length;i++){const [x0,y0]=W[i],[x1,y1]=W[(i+1)%W.length],L=Math.hypot(x1-x0,y1-y0),n=Math.max(1,Math.round(L));
    legStart.push(raw.length);for(let j=0;j<n;j++){const f=j/n;raw.push({x:x0+(x1-x0)*f,y:y0+(y1-y0)*f,leg:i,f});}}
  // round the corners (closed-loop moving average), then resample at exactly 1 m
  const N=raw.length,K=9,sm=raw.map((_,i)=>{let sx=0,sy=0;for(let d=-K;d<=K;d++){const p=raw[(i+d+N)%N];sx+=p.x;sy+=p.y;}return {x:sx/(2*K+1),y:sy/(2*K+1),leg:raw[i].leg,f:raw[i].f};});
  const cs=[0];for(let i=1;i<=N;i++){const a=sm[i-1],b=sm[i%N];cs.push(cs[i-1]+Math.hypot(b.x-a.x,b.y-a.y));}
  const L=cs[N],pts=[];let j=0;
  for(let s=0;s<L-0.5;s+=1){while(cs[j+1]<s)j++;const a=sm[j],b=sm[(j+1)%N],t=(s-cs[j])/((cs[j+1]-cs[j])||1);pts.push({x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t,leg:a.leg,f:a.f});}
  // shift so the lap line (index 0) sits on the start straight, 20 m after the corner
  const sh=pts.findIndex(p=>p.leg===0&&p.f>0.09);const P=pts.slice(sh).concat(pts.slice(0,sh));const n=P.length;
  // elevation: flat, the run-up climbs, then it eases back down to the line
  P.forEach(p=>{let a=100;if(p.leg===8){a+=p.f<RUNUP.from?0:p.f>RUNUP.to?RUNUP.climb:RUNUP.climb*(p.f-RUNUP.from)/(RUNUP.to-RUNUP.from);}
    else if(p.leg===9)a+=RUNUP.climb*(1-p.f*0.6);else if(p.leg===10)a+=RUNUP.climb*0.4*(1-p.f);p.alt=a;p.off=p.leg===8&&p.f>=RUNUP.from&&p.f<=RUNUP.to;});
  // target speed from curvature (lateral grip), then braking / acceleration limits
  const hd=i=>{const a=P[(i-3+n)%n],b=P[(i+3)%n];return Math.atan2(b.y-a.y,b.x-a.x);};
  const vc=P.map((_,i)=>{let d=hd((i+4)%n)-hd((i-4+n)%n);while(d>Math.PI)d-=2*Math.PI;while(d<-Math.PI)d+=2*Math.PI;const R=8/Math.max(1e-3,Math.abs(d));return Math.min(8.6,Math.sqrt(3.2*R));});
  P.forEach((p,i)=>{if(p.off)vc[i]=2.0;});
  const v=vc.slice();for(let r=0;r<2;r++){for(let i=1;i<2*n;i++){const a=(i-1)%n,b=i%n;v[b]=Math.min(v[b],Math.sqrt(v[a]*v[a]+2*1.1));}
    for(let i=2*n-2;i>=0;i--){const a=(i+1)%n,b=i%n;v[b]=Math.min(v[b],Math.sqrt(v[a]*v[a]+2*2.8));}}
  P.forEach((p,i)=>{p.v=v[i];});
  const runupS=[P.findIndex(p=>p.off),n-1-[...P].reverse().findIndex(p=>p.off)];
  return {P,L:n,runupS};
}
const COURSE=buildCourse();

function lineTo(a,b,v,extra){const L=Math.hypot(b.x-a.x,b.y-a.y),n=Math.max(1,Math.round(L)),out=[];for(let j=1;j<n;j++){const f=j/n;out.push({x:a.x+(b.x-a.x)*f,y:a.y+(b.y-a.y)*f,alt:a.alt+(b.alt-a.alt)*f,off:false,v,ins:1,...(extra||{})});}return out;}

function synthRace(o){
  o=Object.assign({seed:1,laps:6,lapFactors:[1,1.02,1.0,0.99,0.985,0.975],rider:1,t0shift:0,origin:ORIGIN,jitter:1.2},o||{});
  const rnd=mulberry32(o.seed),C=COURSE.P,L=COURSE.L,noise=smoothNoise(rnd,L*o.laps,60);
  // one long path of 1 m points: lap after lap, with this race's lap-1 route and course changes spliced in
  const path=[],lapStartIdx=[];
  for(let k=0;k<o.laps;k++){
    const s0=k===0&&o.startAt?Math.round(o.startAt):0;lapStartIdx.push(path.length);
    const reg=[];for(let s=s0;s<L;s++)reg.push({...C[s],s,lap:k});
    let seg=reg;
    const splice=(a,b,ins)=>{const ia=seg.findIndex(p=>p.s>=a),ib=seg.findIndex(p=>p.s>=b);seg=seg.slice(0,ia+1).concat(ins,seg.slice(ib));};
    if(o.tweak){const {a,len,bulge}=o.tweak,A=C[a],B=C[a+len],dx=B.x-A.x,dy=B.y-A.y,l=Math.hypot(dx,dy),nx=-dy/l,ny=dx/l,ins=[];
      const m=Math.round(len*1.4);for(let j=1;j<m;j++){const f=j/m,b=bulge*Math.sin(Math.PI*f);ins.push({x:A.x+dx*f+nx*b,y:A.y+dy*f+ny*b,alt:A.alt+(B.alt-A.alt)*f,off:false,v:5.0,ins:1,lap:k});}
      splice(a,a+len,ins);}
    if(k===0&&o.skip1){const A=C[o.skip1.a],B=C[o.skip1.b];splice(o.skip1.a,o.skip1.b,lineTo(A,B,6.0,{lap:0}));}
    if(k===0&&o.loop1){const A=C[o.loop1.at],B=C[o.loop1.at+2],r=o.loop1.r,dx=B.x-A.x,dy=B.y-A.y,l=Math.hypot(dx,dy),ux=dx/l,uy=dy/l,nx=-uy,ny=ux,ins=[];
      // leave the course to the right, ride a circle, come back to the same spot
      const cx=A.x-nx*r,cy=A.y-ny*r,m=Math.round(2*Math.PI*r);for(let j=1;j<m;j++){const th=j/m*2*Math.PI,x=cx+nx*r*Math.cos(th)+ux*r*Math.sin(th),y=cy+ny*r*Math.cos(th)+uy*r*Math.sin(th);ins.push({x,y,alt:A.alt,off:false,v:5.0,ins:1,lap:0});}
      splice(o.loop1.at,o.loop1.at+1,ins);}
    seg.forEach(p=>path.push(p));
  }
  path.push({...C[0],s:0,lap:o.laps});const finishIdx=path.length-1;
  // ride it: one sample per second
  const pre=150,post=150,T=[];let pos=0,t=0;
  for(;t<pre;t++)T.push({i:0,v:0,state:'grid'});
  const lapT=[];let nextLap=1;
  while(pos<finishIdx){
    const i=Math.floor(pos),p=path[i],k=Math.min(o.laps-1,p.lap),f=(o.lapFactors[k]||1)*o.rider*(1+0.025*noise(i));
    const v=Math.max(0.8,p.v*(p.off?1:f));T.push({i:pos,v,state:p.off?'foot':'ride',acc:(path[Math.min(finishIdx,i+8)].v-p.v)});
    const np=pos+v;while(nextLap<=o.laps&&lapStartIdx[nextLap]!==undefined&&np>=lapStartIdx[nextLap]){lapT.push(t+(lapStartIdx[nextLap]-pos)/v);nextLap++;}
    if(np>=finishIdx&&nextLap===o.laps){lapT.push(t+(finishIdx-pos)/v);nextLap++;}
    pos=np;t++;}
  for(let j=0;j<post;j++)T.push({i:finishIdx,v:j<25?2.5:0,state:j<25?'cool':'stop',drift:j<25?j*2.5:62});
  // series
  const lat0=o.origin.lat,lon0=o.origin.lon,kx=Math.PI/180*6371000*Math.cos(lat0*Math.PI/180),ky=Math.PI/180*6371000;
  const jx=smoothNoise(rnd,T.length,7),jy=smoothNoise(rnd,T.length,9);
  const R={n:T.length,t0:1131000000+o.t0shift,meta:{sport:2,sub:11,name:'Synthetic CX'},lat:[],lon:[],alt:[],dist:[],spd:[],pw:o.noPower?null:[],cad:o.noPower?null:[],hr:null,devLaps:[]};
  let wheel=0;
  T.forEach((q,j)=>{const i=Math.min(finishIdx,Math.floor(q.i)),fr=q.i-i,a=path[i],b=path[Math.min(finishIdx,i+1)];
    let x=a.x+(b.x-a.x)*fr,y=a.y+(b.y-a.y)*fr;if(q.drift){x+=q.drift*0.7;y-=q.drift*0.7;}
    x+=o.jitter*jx(j);y+=o.jitter*jy(j);
    const wheelV=q.state==='foot'?0:q.v;wheel+=wheelV;
    R.lat.push(lat0+y/ky);R.lon.push(lon0+x/kx);R.alt.push(a.alt+(b.alt-a.alt)*fr);R.dist.push(wheel);R.spd.push(wheelV);
    if(!o.noPower){let pw=0,cad=0;if(q.state==='ride'){pw=q.acc>0.3?420:q.acc<-0.6?0:250;pw=Math.round(pw*(1+0.08*Math.sin(j/3)));cad=pw>0?88:0;}else if(q.state==='cool'){pw=60;cad=60;}
      R.pw.push(pw);R.cad.push(cad);}});
  const laps=lapT.map((x,k)=>x-(k?lapT[k-1]:pre));
  return Object.assign(R,{truth:{start:pre,lapTimes:laps,lapLen:L,runup:COURSE.runupS,finish:pre+lapT[lapT.length-1]}});
}
window.synthRace=synthRace;window.SYNTH_COURSE=COURSE;
})();
