/* Futures V2.1 research engine.
 * Uses completed 1m/5m/15m candles only; historical fills start at next candle open.
 */
(function(root){
'use strict';
const ema=(a,n)=>{const o=Array(a.length).fill(null),k=2/(n+1);let p=null,s=0,c=0;for(let i=0;i<a.length;i++){const v=+a[i].c;if(p===null){s+=v;c++;if(c===n){p=s/n;o[i]=p;}}else{p=v*k+p*(1-k);o[i]=p;}}return o;};
const atr=(a,n=14)=>{const tr=a.map((x,i)=>i?Math.max(x.h-x.l,Math.abs(x.h-a[i-1].c),Math.abs(x.l-a[i-1].c)):x.h-x.l),o=Array(a.length).fill(null);let p=null,s=0;for(let i=0;i<tr.length;i++){if(i<n){s+=tr[i];if(i===n-1){p=s/n;o[i]=p;}}else{p=(p*(n-1)+tr[i])/n;o[i]=p;}}return o;};
const rsi=(a,n=14)=>{const o=Array(a.length).fill(null);let g=0,l=0;for(let i=1;i<=n&&i<a.length;i++){const d=a[i].c-a[i-1].c;g+=Math.max(0,d);l+=Math.max(0,-d);}if(a.length<=n)return o;g/=n;l/=n;o[n]=l===0?100:100-100/(1+g/l);for(let i=n+1;i<a.length;i++){const d=a[i].c-a[i-1].c;g=(g*(n-1)+Math.max(0,d))/n;l=(l*(n-1)+Math.max(0,-d))/n;o[i]=l===0?100:100-100/(1+g/l);}return o;};
const adx=(a,n=14)=>{const out=Array(a.length).fill(null);if(a.length<n*2+1)return out;const tr=[],plus=[],minus=[];for(let i=1;i<a.length;i++){const up=a[i].h-a[i-1].h,dn=a[i-1].l-a[i].l;tr.push(Math.max(a[i].h-a[i].l,Math.abs(a[i].h-a[i-1].c),Math.abs(a[i].l-a[i-1].c)));plus.push(up>dn&&up>0?up:0);minus.push(dn>up&&dn>0?dn:0);}let st=0,sp=0,sm=0;for(let i=0;i<n;i++){st+=tr[i];sp+=plus[i];sm+=minus[i];}const dx=[];for(let i=n;i<tr.length;i++){if(i>n){st=st-st/n+tr[i];sp=sp-sp/n+plus[i];sm=sm-sm/n+minus[i];}const p=st?100*sp/st:0,m=st?100*sm/st:0;dx.push(p+m?100*Math.abs(p-m)/(p+m):0);}if(dx.length<n)return out;let v=dx.slice(0,n).reduce((x,y)=>x+y,0)/n;const first=2*n;out[first]=v;for(let j=n;j<dx.length;j++){v=(v*(n-1)+dx[j])/n;out[j+n+1]=v;}return out;};
const aggregate=(a,ms)=>{const out=[];for(const x of a){const t=Math.floor(x.t/ms)*ms;let z=out[out.length-1];if(!z||z.t!==t){z={t,o:x.o,h:x.h,l:x.l,c:x.c,v:x.v,ct:t+ms-1};out.push(z);}else{z.h=Math.max(z.h,x.h);z.l=Math.min(z.l,x.l);z.c=x.c;z.v+=x.v;}}return out;};
function direction(a){if(a.length<70)return {side:'neutral',why:'Chưa đủ dữ liệu'};const c=a.map(x=>x.c),e20=ema(a,20),e50=ema(a,50),rr=rsi(a),ax=adx(a),i=a.length-1;const up=e20[i]>e50[i]&&e20[i]>e20[i-3]&&c[i]>e20[i],dn=e20[i]<e50[i]&&e20[i]<e20[i-3]&&c[i]<e20[i];return {side:up?'long':dn?'short':'neutral',rsi:rr[i],adx:ax[i],ema20:e20[i],ema50:e50[i]};}
function evaluate(c1){
 const now=Date.now(),a1=c1.filter(x=>x.ct<=now);if(a1.length<100)return {ready:false,reason:'Cần tối thiểu 100 nến 1m đã đóng'};
 const lastClosed=a1[a1.length-1].ct;
 // Crucial: higher-timeframe candles are valid only after their actual close time.
 const a5=aggregate(a1,300000).filter(x=>x.ct<=lastClosed),a15=aggregate(a1,900000).filter(x=>x.ct<=lastClosed);
 if(a5.length<70||a15.length<70)return {ready:false,reason:'Cần thêm dữ liệu 5m/15m đã đóng'};
 const d15=direction(a15),d5=direction(a5),i=a1.length-1,p=a1[i],e1=ema(a1,9),r1=rsi(a1),vAvg=a1.slice(Math.max(0,i-20),i).reduce((s,x)=>s+x.v,0)/Math.min(20,i),volRatio=vAvg?p.v/vAvg:1;
 const last5=a5[a5.length-1],touchLong=last5.l<=d5.ema20*1.005&&last5.c>=d5.ema20,touchShort=last5.h>=d5.ema20*0.995&&last5.c<=d5.ema20;
 const prior=a1.slice(Math.max(0,i-5),i),hi=Math.max(...prior.map(x=>x.h)),lo=Math.min(...prior.map(x=>x.l));
 const regime=d15.adx>=25?'trend':d15.adx>=18?'transition':'range';
 let side='neutral',why=[];
 if(d15.side==='long'&&d5.side==='long'&&d15.adx>=18&&d5.adx>=16&&touchLong&&p.c>hi&&p.c>e1[i]&&r1[i]>=52&&volRatio>=1){side='long';why=['15m/5m đồng thuận tăng','ADX xác nhận có xu hướng','5m hồi về EMA20 rồi giữ giá','1m phá đỉnh 5 nến','RSI ≥ 52 và volume xác nhận'];}
 if(d15.side==='short'&&d5.side==='short'&&d15.adx>=18&&d5.adx>=16&&touchShort&&p.c<lo&&p.c<e1[i]&&r1[i]<=48&&volRatio>=1){side='short';why=['15m/5m đồng thuận giảm','ADX xác nhận có xu hướng','5m hồi về EMA20 rồi bị từ chối','1m phá đáy 5 nến','RSI ≤ 48 và volume xác nhận'];}
 const aa=atr(a5,14),atr5=aa[aa.length-1]||last5.c*.003,sw=a5.slice(-6),sg=side==='short'?-1:1,entry=p.c;
 const swing=side==='long'?Math.min(...sw.map(x=>x.l)):Math.max(...sw.map(x=>x.h));
 const stop=side==='neutral'?null:(side==='long'?Math.min(swing,entry-atr5*1.2):Math.max(swing,entry+atr5*1.2));
 const risk=side==='neutral'?null:Math.abs(entry-stop),target=side==='neutral'?null:entry+sg*risk*1.8;
 return {ready:true,side,entry,stop,target,risk,rr:1.8,score:side==='neutral'?0:5,why,time:p.ct,price:p.c,trend15:d15.side,trend5:d5.side,adx15:d15.adx,adx5:d5.adx,regime,rsi1:r1[i],volumeRatio:volRatio,atr5,candles:{m1:a1.length,m5:a5.length,m15:a15.length}};
}
function stats(rows){const rs=rows.map(x=>x.R),wins=rs.filter(x=>x>0),losses=rs.filter(x=>x<=0),gw=wins.reduce((a,b)=>a+b,0),gl=-losses.reduce((a,b)=>a+b,0);return {trades:rows.length,wins:wins.length,losses:losses.length,winRate:rows.length?wins.length/rows.length:0,expectancy:rs.length?rs.reduce((a,b)=>a+b,0)/rs.length:0,pf:gl?gw/gl:(gw?Infinity:null),netR:rs.reduce((a,b)=>a+b,0)};}
function backtest(c1,fee=.0005,slippage=.0002){const signals=[];let last=-Infinity;for(let i=100;i<c1.length-2;i++){if(c1[i].t%300000!==0||c1[i].t-last<20*60000)continue;const s=evaluate(c1.slice(0,i+1));if(!s.ready||s.side==='neutral')continue;const side=s.side,sg=side==='long'?1:-1,fillIndex=i+1,entry=c1[fillIndex].o*(1+sg*slippage),risk=Math.abs(entry-s.stop);if(!risk||!Number.isFinite(risk))continue;let exit=null,exitType='timeout',exitIndex=Math.min(c1.length-1,fillIndex+180);for(let j=fillIndex;j<=exitIndex;j++){const x=c1[j],sl=side==='long'?x.l<=s.stop:x.h>=s.stop,tp=side==='long'?x.h>=s.target:x.l<=s.target;if(sl){exit=s.stop*(1-sg*slippage);exitType='stop';exitIndex=j;break;}if(tp){exit=s.target*(1-sg*slippage);exitType='target';exitIndex=j;break;}}if(exit===null)exit=c1[exitIndex].c*(1-sg*slippage);const fees=fee*(entry+exit),R=(sg*(exit-entry)-fees)/risk;signals.push({time:c1[i].ct,side,entry,stop:s.stop,target:s.target,exit,exitType,exitTime:c1[exitIndex].ct,R,regime:s.regime,adx15:s.adx15,adx5:s.adx5});last=c1[i].t;i=fillIndex;}
 const eq=[0];for(const x of signals)eq.push(eq[eq.length-1]+x.R);let peak=0,dd=0;for(const x of eq){peak=Math.max(peak,x);dd=Math.max(dd,peak-x);}
 const bySide={long:stats(signals.filter(x=>x.side==='long')),short:stats(signals.filter(x=>x.side==='short'))},byRegime={};for(const k of ['trend','transition','range'])byRegime[k]=stats(signals.filter(x=>x.regime===k));
 return {...stats(signals),maxDrawdownR:dd,bySide,byRegime,signals,fee,slippage,fillModel:'next 1m open + adverse slippage',higherTimeframe:'completed candles only'};
}
root.FuturesV2={aggregate,evaluate,backtest,ema,atr,rsi,adx};if(typeof module!=='undefined'&&module.exports)module.exports=root.FuturesV2;
})(typeof globalThis!=='undefined'?globalThis:this);
