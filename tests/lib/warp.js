// Time-warped / detoured copies of a real ride (used by the local cases on your own .fit files).
// mkWarp(raw, {M, rate, jit, t0shift, pw, only:[laps], detours:[{a, len, bulge, extra} | {a, len, chord:true}]})
function mkWarp(R0,o){o=o||{};const n=R0.n,rate=o.rate||(()=>1);
  function interp1(x,xs,ys){const n=xs.length;if(x<=xs[0])return ys[0];if(x>=xs[n-1])return ys[n-1];let lo=0,hi=n-1;while(hi-lo>1){const m=(lo+hi)>>1;if(xs[m]<=x)lo=m;else hi=m;}return ys[lo]+(ys[hi]-ys[lo])*(x-xs[lo])/(xs[hi]-xs[lo]);}
  const I=(arr,t)=>{if(!arr)return null;const i=Math.floor(t),f=t-i;return i>=n-1?arr[n-1]:arr[i]+(arr[i+1]-arr[i])*f;};
  const M=o.M,ds=(o.detours||[]).map(d=>{d=Object.assign({},d);if(d.chord){const L=M.laps[1],ia=interp1(d.a,M.G,L.tg),ib=interp1(d.a+d.len,M.G,L.tg);const kx=M.kx,ky=M.ky;const dx=(I(R0.lon,ib)-I(R0.lon,ia))*kx,dy=(I(R0.lat,ib)-I(R0.lat,ia))*ky;d.extra=Math.hypot(dx,dy)-d.len;d.bulge=0;}return d;});
  // stretches in old fractional time
  const st=ds.map(d=>{const out=[];for(let k=0;k<M.nl;k++){const L=M.laps[k];if(k===0&&L.partial)continue;if(o.only&&!o.only.includes(k))continue;const ia=interp1(d.a,M.G,L.tg),ib=interp1(d.a+d.len,M.G,L.tg);if(isFinite(ia)&&isFinite(ib)&&ib>ia)out.push({i0:ia,i1:ib,d});}return out;}).flat().sort((x,y)=>x.i0-y.i0);
  function interp1(x,xs,ys){const n=xs.length;if(x<=xs[0])return ys[0];if(x>=xs[n-1])return ys[n-1];let lo=0,hi=n-1;while(hi-lo>1){const m=(lo+hi)>>1;if(xs[m]<=x)lo=m;else hi=m;}return ys[lo]+(ys[hi]-ys[lo])*(x-xs[lo])/(xs[hi]-xs[lo]);}
  const tau=[0];let j=0;
  while(true){const u=tau[tau.length-1];const s=st.find(q=>u>=q.i0&&u<q.i1);const sp=s?s.d.len/(s.d.len+s.d.extra):1;const nu=u+sp*rate(j++);if(nu>n-1)break;tau.push(nu);}
  const kx=M?M.kx:81000,ky=M?M.ky:111000;
  const extraAt=u=>{let e=0;for(const q of st){if(u>=q.i1)e+=q.d.extra;else if(u>q.i0){e+=q.d.extra*(u-q.i0)/(q.i1-q.i0);}}return e;};
  const lat=[],lon=[];
  tau.forEach((u,jj)=>{let la=I(R0.lat,u),lo=I(R0.lon,u);const s=st.find(q=>u>=q.i0&&u<=q.i1);
    if(s){const f=(u-s.i0)/(s.i1-s.i0);const la0=I(R0.lat,s.i0),lo0=I(R0.lon,s.i0),la1=I(R0.lat,s.i1),lo1=I(R0.lon,s.i1);if(s.d.chord){la=la0+(la1-la0)*f;lo=lo0+(lo1-lo0)*f;}let dx=(lo1-lo0)*kx,dy=(la1-la0)*ky;const L=Math.hypot(dx,dy)||1;const nx=-dy/L,ny=dx/L,b=s.d.bulge*Math.sin(Math.PI*f);la+=ny*b/ky;lo+=nx*b/kx;}
    if(o.jit){la+=o.jit/111000*Math.sin(jj/37);lo+=o.jit/81000*Math.cos(jj/29);}
    lat.push(la);lon.push(lo);});
  const pws=o.pw==null?1:o.pw;
  return {n:tau.length,t0:R0.t0+(o.t0shift||0),meta:R0.meta,lat,lon,alt:tau.map(u=>I(R0.alt,u)),dist:tau.map(u=>I(R0.dist,u)+extraAt(u)),
    spd:tau.map((u,jj)=>I(R0.spd,u)*Math.min(1.5,Math.max(.5,rate(jj)*(st.find(q=>u>=q.i0&&u<q.i1)?1:1)))),pw:tau.map(u=>Math.round(I(R0.pw,u)*pws)),cad:tau.map(u=>Math.round(I(R0.cad,u))),hr:R0.hr?tau.map(u=>Math.round(I(R0.hr,u))):null,devLaps:[]};
}
const RATES={
  B:j=>j<80?1:(0.962+0.025*Math.sin(j/110)),
  C:j=>j<80?1:(0.985+0.045*Math.sin(j/140+2)),
  D:j=>j<80?1:(0.975+0.035*Math.sin(j/60+1)),
  E:j=>j<80?1:(0.99+0.03*Math.sin(j/95+4)),
};
