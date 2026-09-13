"use strict";
const F22_BUILD="0914-FIX22",F22_BG="#f7f4ed",F22_YELLOW="#f0c867";

function f22W(a,u,v,x,y){return{x:a.x+u.x*x+v.x*y,y:a.y+u.y*x+v.y*y}}

// Attachment silhouette: leave/enter each circle on its true tangent, then flatten smoothly at the waist.
// This removes the four little shoulders that could be seen where the merge patch met the circles.
f13MergeBlobPath=function(m,boost=0){
  const a=nodeById(m.a),b=nodeById(m.b);if(!a||!b)return null;
  const D=Math.max(.001,dist(a.x,a.y,b.x,b.y)),u=unit(b.x-a.x,b.y-a.y),v={x:-u.y,y:u.x},pr=f13NeckProfile(m,boost);
  const shA=Math.min(pr.shoulder,a.r*.88),shB=Math.min(pr.shoulder,b.r*.88),xA=Math.sqrt(Math.max(1,a.r*a.r-shA*shA)),xB=Math.sqrt(Math.max(1,b.r*b.r-shB*shB));
  const ax=xA,bx=D-xB,mx=(ax+bx)/2,W=(x,y)=>f22W(a,u,v,x,y);
  const At=W(ax,shA),Ab=W(ax,-shA),Bt=W(bx,shB),Bb=W(bx,-shB),Wt=W(mx,pr.waist),Wb=W(mx,-pr.waist);
  const taT=unit(shA,-xA),tbT=unit(shB,xB),tbB=unit(-shB,xB),taB=unit(-shA,-xA);
  const vec=(q)=>({x:u.x*q.x+v.x*q.y,y:u.y*q.x+v.y*q.y}),A1=vec(taT),B1=vec(tbT),B0=vec(tbB),A0=vec(taB);
  const s1=Math.max(8,mx-ax),s2=Math.max(8,bx-mx),ka=Math.min(s1*.72,Math.max(12,shA*.62)),kb=Math.min(s2*.72,Math.max(12,shB*.62)),w1=s1*.42,w2=s2*.42;
  const add=(p,d,k)=>({x:p.x+d.x*k,y:p.y+d.y*k});
  const sub=(p,d,k)=>({x:p.x-d.x*k,y:p.y-d.y*k});
  return `M ${At.x} ${At.y}`+
    ` C ${add(At,A1,ka).x} ${add(At,A1,ka).y} ${sub(Wt,u,w1).x} ${sub(Wt,u,w1).y} ${Wt.x} ${Wt.y}`+
    ` C ${add(Wt,u,w2).x} ${add(Wt,u,w2).y} ${sub(Bt,B1,kb).x} ${sub(Bt,B1,kb).y} ${Bt.x} ${Bt.y}`+
    ` L ${Bb.x} ${Bb.y}`+
    ` C ${add(Bb,B0,kb).x} ${add(Bb,B0,kb).y} ${add(Wb,u,w2).x} ${add(Wb,u,w2).y} ${Wb.x} ${Wb.y}`+
    ` C ${sub(Wb,u,w1).x} ${sub(Wb,u,w1).y} ${sub(Ab,A0,ka).x} ${sub(Ab,A0,ka).y} ${Ab.x} ${Ab.y} Z`;
};
mergeBridge=function(m,shadow=false){const d=f13MergeBlobPath(m,typeof f13AttachAnim!=="undefined"&&f13AttachAnim&&f13AttachAnim.key===pairKey(m.a,m.b)?1-f13AttachAnim.progress:0);return d?sEl("path",{d,class:shadow?null:"merge-blob",fill:shadow?"#000":F22_YELLOW,stroke:"none"}):null};

// Curved hose roots: circle-side axis is radial to the actual exit point; hose-side axis uses the
// actual Bezier tangent. This prevents the root patch from sticking out when a hose is bent hard.
function f22CurvedRootPatch(l,fromA){
  const n=nodeById(fromA?l.a:l.b),ri=f21RootInfo(l,fromA);if(!n||!ri)return null;
  const w=linkWidth(l),q=quadPoint(l,ri.t),rad=unit(q.x-n.x,q.y-n.y),vr={x:-rad.y,y:rad.x};
  let tg=quadTangent(l,ri.t);if(!fromA)tg={x:-tg.x,y:-tg.y};const ut=unit(tg.x,tg.y),vt={x:-ut.y,y:ut.x};
  const half=w/2,shoulder=clamp(w*1.28,half+6,Math.min(n.r*.58,w*1.45)),x0=Math.sqrt(Math.max(1,n.r*n.r-shoulder*shoulder));
  const P1={x:n.x+rad.x*x0+vr.x*shoulder,y:n.y+rad.y*x0+vr.y*shoulder},P2={x:n.x+rad.x*x0-vr.x*shoulder,y:n.y+rad.y*x0-vr.y*shoulder};
  const Q1={x:q.x+vt.x*half,y:q.y+vt.y*half},Q2={x:q.x-vt.x*half,y:q.y-vt.y*half};
  const localTop=unit(shoulder,-x0),localBot=unit(shoulder,x0),T1={x:rad.x*localTop.x+vr.x*localTop.y,y:rad.y*localTop.x+vr.y*localTop.y},T2={x:rad.x*localBot.x+vr.x*localBot.y,y:rad.y*localBot.x+vr.y*localBot.y};
  const span=Math.max(14,dist(P1.x,P1.y,Q1.x,Q1.y)),k1=span*.52,k2=span*.36;
  const C1={x:P1.x+T1.x*k1,y:P1.y+T1.y*k1},C2={x:Q1.x-ut.x*k2,y:Q1.y-ut.y*k2},C3={x:Q2.x-ut.x*k2,y:Q2.y-ut.y*k2},C4={x:P2.x+T2.x*k1,y:P2.y+T2.y*k1};
  return`M ${P1.x} ${P1.y} C ${C1.x} ${C1.y} ${C2.x} ${C2.y} ${Q1.x} ${Q1.y} L ${Q2.x} ${Q2.y} C ${C3.x} ${C3.y} ${C4.x} ${C4.y} ${P2.x} ${P2.y} Z`;
}
curvedRootPatchPath=f22CurvedRootPatch;
linkRootPaths=function(l){return[{d:f22CurvedRootPatch(l,true)},{d:f22CurvedRootPatch(l,false)}].filter(x=>x.d)};

function f22Runs(l,test,steps=240){const out=[];let start=null,prev=test(0),pt=0;if(prev)start=0;for(let i=1;i<=steps;i++){const t=i/steps,inside=test(t);if(inside!==prev){let lo=pt,hi=t;for(let k=0;k<10;k++){const mid=(lo+hi)/2;if(test(mid)===inside)hi=mid;else lo=mid}const edge=(lo+hi)/2;if(inside)start=edge;else if(start!==null){out.push([start,edge]);start=null}}prev=inside;pt=t}if(start!==null)out.push([start,1]);return out.filter(r=>r[1]-r[0]>.001)}
function f22LowerCutRanges(lower,upper,pad=2.2){const lim=linkWidth(upper)/2+pad;return f22Runs(lower,t=>f15PointLinkDistance(upper,quadPoint(lower,t),110)<=lim).filter(([a,b])=>b>.025&&a<.975).map(([a,b])=>[Math.max(.02,a),Math.min(.98,b)])}
function f22UpperRedrawRanges(upper,lower){const lim=linkWidth(lower)/2+3.2;return f22Runs(upper,t=>f15PointLinkDistance(lower,quadPoint(upper,t),110)<=lim).filter(([a,b])=>b>.02&&a<.98).map(([a,b])=>[Math.max(.015,a),Math.min(.985,b)])}

function f22RenderZBoundaries(){
  f14NormalizeLinkZ();overlapLayer.replaceChildren();f15ZTopLayer.replaceChildren();
  const ordered=[...links].sort((a,b)=>f14ObjectZ(a,"link")-f14ObjectZ(b,"link")||((a.seq??0)-(b.seq??0)));
  for(let i=1;i<ordered.length;i++){
    const upper=ordered[i];
    for(let j=0;j<i;j++){
      const lower=ordered[j];
      for(const [a,b] of f22LowerCutRanges(lower,upper))overlapLayer.appendChild(sEl("path",{d:f15RangePath(lower,a,b),fill:"none",stroke:F22_BG,"stroke-width":linkWidth(lower),"stroke-linecap":"butt","stroke-linejoin":"round","data-z-boundary":"link-link-lower-shape-cut","data-lower":lower.id,"data-upper":upper.id}));
      for(const [a,b] of f22UpperRedrawRanges(upper,lower))overlapLayer.appendChild(sEl("path",{d:f15RangePath(upper,a,b),fill:"none",stroke:F22_YELLOW,"stroke-width":linkWidth(upper),"stroke-linecap":"round","stroke-linejoin":"round","data-z-boundary":"link-link-upper-exact","data-lower":lower.id,"data-upper":upper.id}));
    }
  }
  // A top hose must never draw back through its own endpoint circle/root. Trim every node-overlap segment
  // to the real root exit interval before painting it above a lower node.
  for(const l of links){
    const lz=f14ObjectZ(l,"link"),ra=f21RootInfo(l,true),rb=f21RootInfo(l,false),lo=ra?ra.t:.03,hi=rb?rb.t:.97;
    for(const n of nodes){if(l.a===n.id||l.b===n.id||f14ObjectZ(n,"node")>=lz)continue;for(const raw of linkNodeOverlapRanges(l,n)){
      const a=Math.max(raw[0],lo),b=Math.min(raw[1],hi);if(b-a<=.002)continue;const d=f15RangePath(l,a,b);
      f15ZTopLayer.appendChild(sEl("path",{d,fill:"none",stroke:F22_BG,"stroke-width":linkWidth(l)+4,"stroke-linecap":"butt","data-z-boundary":"link-node-gap","data-f22-trim":"1"}));
      f15ZTopLayer.appendChild(sEl("path",{d,fill:"none",stroke:F22_YELLOW,"stroke-width":linkWidth(l),"stroke-linecap":"round","data-z-boundary":"link-node-top","data-f22-trim":"1"}));
    }}
  }
}
f18RenderZBoundaries=f22RenderZBoundaries;f15RenderZBoundaries=f22RenderZBoundaries;renderOverlapEdges=f22RenderZBoundaries;

// Contact/status guide automatically moves to the farthest screen corner while a contact preview is active.
let f22GuidePoint=null;
function f22PlaceStatus(){
  if(!status)return;if(!f22GuidePoint){status.style.left="12px";status.style.right="auto";status.style.top="calc(12px + env(safe-area-inset-top))";status.style.bottom="auto";return}
  const r=svg.getBoundingClientRect(),sx=(f22GuidePoint.x*view.scale+view.x)/1000*r.width+r.left,sy=(f22GuidePoint.y*view.scale+view.y)/700*r.height+r.top;
  const corners=[{x:18,y:18,p:"tl"},{x:innerWidth-18,y:18,p:"tr"},{x:18,y:innerHeight-18,p:"bl"},{x:innerWidth-18,y:innerHeight-18,p:"br"}];corners.sort((a,b)=>((b.x-sx)**2+(b.y-sy)**2)-((a.x-sx)**2+(a.y-sy)**2));const p=corners[0].p;
  status.style.left=p.endsWith("l")?"12px":"auto";status.style.right=p.endsWith("r")?"12px":"auto";status.style.top=p.startsWith("t")?"calc(12px + env(safe-area-inset-top))":"auto";status.style.bottom=p.startsWith("b")?"calc(12px + env(safe-area-inset-bottom))":"auto";
}
const f22PreviewPrev=f13RenderContactPreview,f22ClearPreviewPrev=f13ClearContactPreview;
f13RenderContactPreview=function(aId,bId){const m=f22PreviewPrev(aId,bId),a=nodeById(aId),b=nodeById(bId);f22GuidePoint=m?.visible&&a&&b?{x:(a.x+b.x)/2,y:(a.y+b.y)/2}:null;f22PlaceStatus();return m};
f13ClearContactPreview=function(){f22GuidePoint=null;f22ClearPreviewPrev();f22PlaceStatus()};
window.addEventListener("resize",()=>f22PlaceStatus());

renderAll=function(){if(renderRAF){cancelAnimationFrame(renderRAF);renderRAF=0}shadowLayer.style.display="";overlapLayer.style.display="";hiddenLayer.style.display="";renderShadow();renderLinks(false);renderNodes();f22RenderZBoundaries();f21RenderHidden();renderUI();f22PlaceStatus()};
renderMotionNow=function(){shadowLayer.style.display="none";hiddenLayer.style.display="";renderLinks(true);renderNodes();f22RenderZBoundaries();f21RenderHidden();renderUI();f22PlaceStatus()};
window.__mochiFix22Test={mergePath:f13MergeBlobPath,rootPatch:f22CurvedRootPatch,lowerCutRanges:f22LowerCutRanges,upperRedrawRanges:f22UpperRedrawRanges,renderBoundaries:f22RenderZBoundaries,placeStatus:f22PlaceStatus};
statusText=function(t){status.innerHTML=`餅マップ v0.9.4<br>BUILD ${F22_BUILD}<br>${t}`;f22PlaceStatus()};statusText("待機中");
