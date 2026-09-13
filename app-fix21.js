"use strict";
const F21_BUILD="0914-FIX21",F21_BG="#f7f4ed",F21_YELLOW="#f0c867";
function f21AD(a,b){return Math.atan2(Math.sin(a-b),Math.cos(a-b))}
function f21Path(ps){if(!ps?.length)return"";return ps.map((p,i)=>(i?`L ${p.x} ${p.y}`:`M ${p.x} ${p.y}`)).join(" ")}

// Smaller approach bud than FIX20, but with a zero-slope transition into the parent circle.
// The nose still reaches the same tip position so the already-approved contact timing is unchanged.
f18BulgedNodePath=function(n,toward,m){
  if(!n||!toward||!m?.visible)return circlePath(n.x,n.y,n.r);
  const base=Math.atan2(toward.y-n.y,toward.x-n.x),spread=.78,pts=[],steps=240;
  for(let i=0;i<steps;i++){
    const a=-Math.PI+2*Math.PI*i/steps,d=Math.abs(f21AD(a,base));let bump=0;
    if(d<spread){const q=d/spread,s=Math.max(0,1-q*q);bump=m.ext*s*s*s}
    const r=n.r+bump;pts.push({x:n.x+Math.cos(a)*r,y:n.y+Math.sin(a)*r});
  }
  return f21Path(pts)+" Z";
};

function f21RootInfo(l,fromA){
  const n=nodeById(fromA?l.a:l.b);if(!n)return null;const w=linkWidth(l),target=n.r+clamp(w*.95,22,38),steps=120;let t=fromA?0:1;
  for(let i=1;i<=steps;i++){const tt=fromA?i/steps:1-i/steps,p=quadPoint(l,tt);t=tt;if(dist(n.x,n.y,p.x,p.y)>=target)break}
  let tg=quadTangent(l,t);if(!fromA)tg={x:-tg.x,y:-tg.y};const u=unit(tg.x,tg.y),half=w/2,shoulder=clamp(w*1.28,half+6,Math.min(n.r*.58,w*1.45));
  return{n,t,u,shoulder,angle:Math.atan2(u.y,u.x),rootZ:f14ObjectZ(n,"node")};
}
function f21CircleGap(n,a,coverZ){
  for(const l of links){if(l.a!==n.id&&l.b!==n.id)continue;const fromA=l.a===n.id,ri=f21RootInfo(l,fromA);if(!ri||coverZ<=ri.rootZ)continue;const gap=Math.asin(clamp(ri.shoulder/Math.max(1,n.r),0,.92))+.045;if(Math.abs(f21AD(a,ri.angle))<gap)return true}
  return false;
}
function f21HiddenCircleRuns(n,cover){
  const nz=f14ObjectZ(n,"node"),cz=f14ObjectZ(cover,"node");if(cz<=nz||sameComponent(n.id,cover.id))return[];
  const out=[];let cur=[];const steps=360,R=n.r+2.0;
  for(let i=0;i<=steps;i++){
    const a=-Math.PI+2*Math.PI*i/steps,p={x:n.x+Math.cos(a)*R,y:n.y+Math.sin(a)*R};
    const hidden=dist(p.x,p.y,cover.x,cover.y)<=cover.r+1.5&&!f21CircleGap(n,a,cz);
    if(hidden)cur.push(p);else if(cur.length){if(cur.length>1)out.push(f21Path(cur));cur=[]}
  }
  if(cur.length>1)out.push(f21Path(cur));return out;
}
function f21HiddenLinkSideRuns(l,cover){
  const cz=f14ObjectZ(cover,"node"),lz=f14ObjectZ(l,"link");if(cz<=lz||cover.id===l.a||cover.id===l.b)return[];
  const A=f21RootInfo(l,true),B=f21RootInfo(l,false);if(!A||!B)return[];const t0=Math.min(A.t,B.t),t1=Math.max(A.t,B.t);if(t1<=t0)return[];
  const out=[];for(const side of[-1,1]){let cur=[];const steps=180,off=linkWidth(l)/2+2.0;for(let i=0;i<=steps;i++){
    const t=t0+(t1-t0)*i/steps,p=quadPoint(l,t),tg=quadTangent(l,t),u=unit(tg.x,tg.y),q={x:p.x-u.y*off*side,y:p.y+u.x*off*side};
    const hidden=dist(q.x,q.y,cover.x,cover.y)<=cover.r+1.5;if(hidden)cur.push(q);else if(cur.length){if(cur.length>1)out.push(f21Path(cur));cur=[]}
  }if(cur.length>1)out.push(f21Path(cur))}return out;
}
function f21ClipRootCurve(c,cover){let out=[],cur=[];for(let i=0;i<=40;i++){const p=f12CubicPoint(c,i/40),inside=dist(p.x,p.y,cover.x,cover.y)<=cover.r+2;if(inside)cur.push(p);else if(cur.length){if(cur.length>1)out.push(f21Path(cur));cur=[]}}if(cur.length>1)out.push(f21Path(cur));return out}
function f21HiddenRootRuns(l,cover){
  if(cover.id===l.a||cover.id===l.b||typeof f12RootSideCurves!=="function")return[];const cz=f14ObjectZ(cover,"node"),out=[];
  for(const fromA of[true,false]){const ri=f21RootInfo(l,fromA);if(!ri||cz<=ri.rootZ||sameComponent(ri.n.id,cover.id))continue;for(const c of f12RootSideCurves(l,fromA))out.push(...f21ClipRootCurve(c,cover))}
  return out;
}
function f21RenderHidden(){
  hiddenLayer.replaceChildren();const ordered=[...nodes].sort((a,b)=>f14ObjectZ(a,"node")-f14ObjectZ(b,"node")||((a.created??0)-(b.created??0)));
  for(let i=0;i<ordered.length;i++)for(let j=i+1;j<ordered.length;j++){const lower=ordered[i],upper=ordered[j];for(const d of f21HiddenCircleRuns(lower,upper))hiddenLayer.appendChild(sEl("path",{d,class:"hidden-outline","data-hidden-node":lower.id,"data-cover":upper.id,"data-f21-circle":"1"}))}
  for(const cover of ordered)for(const l of links){
    for(const d of f21HiddenLinkSideRuns(l,cover))hiddenLayer.appendChild(sEl("path",{d,class:"hidden-outline","data-hidden-link":l.id,"data-cover":cover.id,"data-f21-side":"1"}));
    for(const d of f21HiddenRootRuns(l,cover))hiddenLayer.appendChild(sEl("path",{d,class:"hidden-outline","data-hidden-root":l.id,"data-cover":cover.id,"data-f21-root":"1"}));
  }
}
renderHidden=f21RenderHidden;

// Link crossing separator follows the upper hose shape itself.  A narrow white halo first masks the
// lower hose; the upper yellow hose is then redrawn slightly farther so no transverse white end-cap remains.
function f21Expand(l,t0,t1,px=4){if(typeof f17ArcLenToT!=="function")return[t0,t1];return[Math.max(.01,f17ArcLenToT(l,t0,-1,px,0)),Math.min(.99,f17ArcLenToT(l,t1,1,px,1))]}
function f21RenderZBoundaries(){
  f14NormalizeLinkZ();overlapLayer.replaceChildren();f15ZTopLayer.replaceChildren();const ordered=[...links].sort((a,b)=>f14ObjectZ(a,"link")-f14ObjectZ(b,"link")||((a.seq??0)-(b.seq??0)));
  for(let i=1;i<ordered.length;i++){const upper=ordered[i];for(let j=0;j<i;j++){const lower=ordered[j];for(const raw of f15LinkLinkRanges(upper,lower)){
    const r=typeof f17CompactRange==="function"?f17CompactRange(upper,lower,raw[0],raw[1]):raw;if(r[1]<=r[0])continue;
    overlapLayer.appendChild(sEl("path",{d:f15RangePath(upper,r[0],r[1]),fill:"none",stroke:F21_BG,"stroke-width":linkWidth(upper)+4,"stroke-linecap":"butt","data-z-boundary":"link-link-upper-mask","data-f21":"1"}));
    const ex=f21Expand(upper,r[0],r[1],4);overlapLayer.appendChild(sEl("path",{d:f15RangePath(upper,ex[0],ex[1]),fill:"none",stroke:F21_YELLOW,"stroke-width":linkWidth(upper),"stroke-linecap":"round","data-z-boundary":"link-link-upper-redraw","data-f21":"1"}));
  }}}
  for(const l of links){const lz=f14ObjectZ(l,"link");for(const n of nodes){if(l.a===n.id||l.b===n.id||f14ObjectZ(n,"node")>=lz)continue;for(const[t0,t1]of linkNodeOverlapRanges(l,n)){const d=f15RangePath(l,t0,t1);f15ZTopLayer.appendChild(sEl("path",{d,fill:"none",stroke:F21_BG,"stroke-width":linkWidth(l)+4,"stroke-linecap":"butt","data-z-boundary":"link-node-gap"}));f15ZTopLayer.appendChild(sEl("path",{d,fill:"none",stroke:F21_YELLOW,"stroke-width":linkWidth(l),"stroke-linecap":"round","data-z-boundary":"link-node-top"}))}}}
}
f18RenderZBoundaries=f21RenderZBoundaries;f15RenderZBoundaries=f21RenderZBoundaries;renderOverlapEdges=f21RenderZBoundaries;
renderAll=function(){if(renderRAF){cancelAnimationFrame(renderRAF);renderRAF=0}shadowLayer.style.display="";overlapLayer.style.display="";hiddenLayer.style.display="";renderShadow();renderLinks(false);renderNodes();f21RenderZBoundaries();f21RenderHidden();renderUI()};
renderMotionNow=function(){shadowLayer.style.display="none";hiddenLayer.style.display="";renderLinks(true);renderNodes();f21RenderZBoundaries();f21RenderHidden();renderUI()};
window.__mochiFix21Test={bulgedNodePath:f18BulgedNodePath,rootInfo:f21RootInfo,hiddenCircleRuns:f21HiddenCircleRuns,hiddenLinkSideRuns:f21HiddenLinkSideRuns,hiddenRootRuns:f21HiddenRootRuns,renderHidden:f21RenderHidden,renderBoundaries:f21RenderZBoundaries};
statusText=function(t){status.innerHTML=`餅マップ v0.9.4<br>BUILD ${F21_BUILD}<br>${t}`};statusText("待機中");
