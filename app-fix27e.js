"use strict";
(function installFix27E(){
  if(!window.__mochiFix27DInstalled||!window.__mochiFix27Test){setTimeout(installFix27E,25);return}
  if(window.__mochiFix27EInstalled)return;window.__mochiFix27EInstalled=true;
  const F27E_BUILD="0916-FIX27E";

  function pointInIncidentHoseOrRoot(cover,p,excludeLinkId){
    return links.some(x=>x.id!==excludeLinkId&&(x.a===cover.id||x.b===cover.id)&&f25PointInLinkShape(x,p,1.25));
  }

  // Do not show a hidden lower-hose side through the visible opening between
  // the root-R sides of another hose connected to the covering circle.
  f25HiddenLinkSideRuns=function(l,cover){
    if(cover.id===l.a||cover.id===l.b||f25LinkAboveNode(l,cover))return[];
    const A=f21RootInfo(l,true),B=f21RootInfo(l,false);if(!A||!B)return[];
    const t0=Math.min(A.t,B.t),t1=Math.max(A.t,B.t),out=[];
    for(const side of[-1,1]){
      let cur=[];
      for(let i=0;i<=220;i++){
        const t=t0+(t1-t0)*i/220,p=quadPoint(l,t),tg=quadTangent(l,t),u=unit(tg.x,tg.y),off=linkWidth(l)/2+1;
        const q={x:p.x-u.y*off*side,y:p.y+u.x*off*side};
        const hidden=dist(q.x,q.y,cover.x,cover.y)<=cover.r+1&&!pointInIncidentHoseOrRoot(cover,q,l.id);
        if(hidden)cur.push(q);else if(cur.length){if(cur.length>1)out.push(f23Path(cur));cur=[]}
      }
      if(cur.length>1)out.push(f23Path(cur));
    }
    return out;
  };
  if(window.__mochiFix25Outline)window.__mochiFix25Outline.hiddenLinkSideRuns=f25HiddenLinkSideRuns;

  const prevPlaceStatus=f22PlaceStatus;
  function rectsOverlap(a,b,gap=4){return a.left<b.right+gap&&a.right>b.left-gap&&a.top<b.bottom+gap&&a.bottom>b.top-gap}
  f22PlaceStatus=function(){
    prevPlaceStatus();
    if(!status||!controls)return;
    const sr=status.getBoundingClientRect(),cr=controls.getBoundingClientRect();
    if(rectsOverlap(sr,cr,2)){
      status.style.left="12px";status.style.right="auto";
      status.style.bottom="auto";
      status.style.top=`${Math.ceil(cr.bottom+8)}px`;
    }
  };
  window.addEventListener("resize",()=>requestAnimationFrame(f22PlaceStatus));
  window.addEventListener("orientationchange",()=>setTimeout(f22PlaceStatus,60));

  window.__mochiFix27ETest={pointInIncidentHoseOrRoot,rectsOverlap,placeStatus:f22PlaceStatus};
  statusText=function(t){status.innerHTML=`餅マップ v0.9.4<br>BUILD ${F27E_BUILD}<br>${t}`;f22PlaceStatus()};
  renderAll();statusText("待機中");
})();
