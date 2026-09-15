"use strict";
(function installFix27D(){
  if(!window.__mochiFix27CInstalled||!window.__mochiFix27Test){setTimeout(installFix27D,25);return}
  if(window.__mochiFix27DInstalled)return;window.__mochiFix27DInstalled=true;
  const F27D_BUILD="0915-FIX27D";

  // FIX27 had suppressed a completely covered lower circle. That made a small
  // circle disappear when a larger circle sat on top of it. Restore the normal
  // hidden-outline rule: every covered portion of the lower circle is dashed,
  // including the full circumference when it is completely hidden.
  f25HiddenCircleRuns=function(lower,upper){
    if(f24NodeZ(upper)<=f24NodeZ(lower)||sameComponent(lower.id,upper.id))return[];
    const out=[];let cur=[],steps=360,R=lower.r+1;
    for(let i=0;i<=steps;i++){
      const a=-Math.PI+2*Math.PI*i/steps;
      const p={x:lower.x+Math.cos(a)*R,y:lower.y+Math.sin(a)*R};
      const hidden=dist(p.x,p.y,upper.x,upper.y)<=upper.r+1&&!f21CircleGap(lower,a,f24NodeZ(upper));
      if(hidden)cur.push(p);else if(cur.length){if(cur.length>1)out.push(f23Path(cur));cur=[]}
    }
    if(cur.length>1)out.push(f23Path(cur));
    return out;
  };
  if(window.__mochiFix25Outline)window.__mochiFix25Outline.hiddenCircleRuns=f25HiddenCircleRuns;
  if(window.__mochiFix27Test)window.__mochiFix27Test.hiddenCircleRuns=f25HiddenCircleRuns;

  window.__mochiFix27DTest={hiddenCircleRuns:f25HiddenCircleRuns};
  statusText=function(t){status.innerHTML=`餅マップ v0.9.4<br>BUILD ${F27D_BUILD}<br>${t}`;f22PlaceStatus()};
  renderAll();statusText("待機中");
})();
