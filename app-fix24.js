"use strict";
const F24_BUILD="0914-FIX24",F24_SEP="#d7d3cc",F24_SEP_W=1.65,F24_SMALL_RATIO=.80,F24_DEEP_RATIO=.46;
let f24ArmedNode=null,f24GuidePair=null;

// ---------- contact guide: stay near the two circles, but never sit on the contact itself ----------
function f24WorldClient(x,y){const p=svg.createSVGPoint();p.x=x;p.y=y;return p.matrixTransform(world.getScreenCTM())}
function f24RectOverlap(a,b){return Math.max(0,Math.min(a.right,b.right)-Math.max(a.left,b.left))*Math.max(0,Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top))}
function f24PlaceGuide(){
  const guide=document.getElementById("f23ContactGuide");if(!guide||!f24GuidePair){return}
  const a=nodeById(f24GuidePair.a),b=nodeById(f24GuidePair.b);if(!a||!b||guide.style.display==="none")return;
  const A=f24WorldClient(a.x,a.y),B=f24WorldClient(b.x,b.y),mid={x:(A.x+B.x)/2,y:(A.y+B.y)/2},dx=B.x-A.x,dy=B.y-A.y,L=Math.hypot(dx,dy)||1,u={x:dx/L,y:dy/L},v={x:-u.y,y:u.x};
  const gm=world.getScreenCTM(),px=Math.max(.01,Math.hypot(gm.a,gm.b)),rA=a.r*px,rB=b.r*px,w=guide.offsetWidth||230,h=guide.offsetHeight||34,off=Math.min(110,Math.max(58,Math.max(rA,rB)*.58+h*.60+10)),m=10;
  const controlsR=controls?.getBoundingClientRect?.()||null,statusR=status?.getBoundingClientRect?.()||null;
  const dirs=[v,{x:-v.x,y:-v.y},u,{x:-u.x,y:-u.y}];let best=null;
  for(let i=0;i<dirs.length;i++){
    const d=dirs[i],cx=mid.x+d.x*off,cy=mid.y+d.y*off,left=Math.max(m,Math.min(innerWidth-w-m,cx-w/2)),top=Math.max(m,Math.min(innerHeight-h-m,cy-h/2)),r={left,top,right:left+w,bottom:top+h};
    const ca={left:A.x-rA,top:A.y-rA,right:A.x+rA,bottom:A.y+rA},cb={left:B.x-rB,top:B.y-rB,right:B.x+rB,bottom:B.y+rB};
    let penalty=f24RectOverlap(r,ca)*40+f24RectOverlap(r,cb)*40;if(controlsR)penalty+=f24RectOverlap(r,controlsR)*18;if(statusR)penalty+=f24RectOverlap(r,statusR)*12;penalty+=Math.hypot((left+w/2)-mid.x,(top+h/2)-mid.y)*.12;
    if(!best||penalty<best.penalty)best={left,top,penalty};
  }
  if(best){guide.style.left=best.left+"px";guide.style.top=best.top+"px"}
}
const f24PreviewPrev=f13RenderContactPreview,f24ClearPrev=f13ClearContactPreview;
f13RenderContactPreview=function(aId,bId){const m=f24PreviewPrev(aId,bId);f24GuidePair=m?.visible?{a:aId,b:bId}:null;requestAnimationFrame(f24PlaceGuide);return m};
f13ClearContactPreview=function(){f24GuidePair=null;f24ClearPrev();requestAnimationFrame(f24PlaceGuide)};
const f24RenderUIPrev=renderUI;renderUI=function(){f24RenderUIPrev();f24PlaceGuide()};
window.addEventListener("resize",f24PlaceGuide);

// ---------- hit ownership: smaller covered mochi owns its whole footprint ----------
function f24NodeZ(n){return f14ObjectZ(n,"node")}
function f24RawNodes(x,y,pad=0){return nodes.filter(n=>dist(x,y,n.x,n.y)<=n.r+pad).sort((a,b)=>f24NodeZ(b)-f24NodeZ(a)||((b.created??0)-(a.created??0)))}
function f24LinkDistanceHit(l,x,y,pad=0){return f15PointLinkDistance(l,{x,y},100)<=linkWidth(l)/2+pad}
function f24ExclusiveLinkAt(x,y){
  const covers=f24RawNodes(x,y,0);if(!covers.length)return null;let best=null,bestD=Infinity;
  for(const l of links){if(!f24LinkDistanceHit(l,x,y,8/view.scale))continue;const A=nodeById(l.a),B=nodeById(l.b);for(const c of covers){if(c.id===l.a||c.id===l.b)continue;const small=Math.min(A?.r??Infinity,B?.r??Infinity);if(!(small<=c.r*F24_SMALL_RATIO))continue;const d=f15PointLinkDistance(l,{x,y},80);if(d<bestD){bestD=d;best=l}}}
  return best;
}
function f24ResolvedNodeHits(x,y,pad=0){
  const actual=f24RawNodes(x,y,0);
  if(f24ArmedNode){const armed=actual.find(n=>n.id===f24ArmedNode);if(armed)return[armed]}
  if(f24ExclusiveLinkAt(x,y))return[];
  if(actual.length===1)return actual;
  if(actual.length>1){
    const bySize=[...actual].sort((a,b)=>a.r-b.r||f24NodeZ(b)-f24NodeZ(a)),small=bySize[0],large=bySize.at(-1),ratio=small.r/Math.max(1,large.r);
    if(ratio<F24_SMALL_RATIO)return[small];
    const top=[...actual].sort((a,b)=>f24NodeZ(b)-f24NodeZ(a)||((b.created??0)-(a.created??0)))[0];
    const other=actual.find(n=>n.id!==top.id)||top,d=dist(top.x,top.y,other.x,other.y),deep=d/Math.max(1,top.r+other.r)<=F24_DEEP_RATIO;
    return deep?[top,...actual.filter(n=>n.id!==top.id)]:[top];
  }
  if(pad>0){const near=f24RawNodes(x,y,pad);if(near.length)return[near[0]]}
  return[];
}
f22HitsAt=function(x,y,pad=0){return f24ResolvedNodeHits(x,y,pad)};
nearestNode=function(x,y){const h=f24ResolvedNodeHits(x,y,24/view.scale)[0]||null;return h?{node:h,d:dist(x,y,h.x,h.y)}:null};
targetAtWorld=function(p){const ex=f24ExclusiveLinkAt(p.x,p.y);if(ex)return{type:"link",id:ex.id};const n=f24ResolvedNodeHits(p.x,p.y,0)[0];if(n)return{type:"node",id:n.id};const l=nearestLink(p.x,p.y,26/view.scale);if(l)return{type:"link",id:l.link.id};return null};
f22ChooseNode=function(id){const n=nodeById(id);if(!n)return;if(typeof f13SetSelectedIds==="function")f13SetSelectedIds([]);selected={type:"node",id};f24ArmedNode=id;f22ChoiceArmed=null;f22CloseChooser();renderAll();statusText(`重なり選択：${n.label||id}`)};
const f24PenDownPrev=penDown;penDown=function(evt,allowTouch=false){const armed=f24ArmedNode,r=f24PenDownPrev(evt,allowTouch);if(armed&&gesture?.nodeId===armed)f24ArmedNode=null;return r};

// ---------- exact root / hose silhouettes ----------
function f24CurvePoints(c,rev=false,steps=54){const a=[];for(let i=0;i<=steps;i++){const t=(rev?steps-i:i)/steps;a.push(f23Cubic(c[0],c[1],c[2],c[3],t))}return a}
function f24RootPoly(l,fromA){const g=f23RootGeom(l,fromA);if(!g)return null;return[...f24CurvePoints(g.top,false),...f24CurvePoints(g.bottom,true)]}
function f24PointInPoly(p,poly){let inside=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const a=poly[i],b=poly[j],hit=((a.y>p.y)!==(b.y>p.y))&&(p.x<(b.x-a.x)*(p.y-a.y)/((b.y-a.y)||1e-9)+a.x);if(hit)inside=!inside}return inside}
function f24PointInRoot(l,p){for(const f of[true,false]){const poly=f24RootPoly(l,f);if(poly&&f24PointInPoly(p,poly))return true}return false}
function f24RootRuns(l,cover,fromA,rootAbove){const g=f23RootGeom(l,fromA);if(!g||cover.id===l.a||cover.id===l.b)return[];const src=g.ri.n,cz=f24NodeZ(cover),rz=g.ri.rootZ;if(rootAbove?rz<=cz:cz<=rz)return[];const test=p=>dist(p.x,p.y,cover.x,cover.y)<=cover.r+1.5&&dist(p.x,p.y,src.x,src.y)>=src.r-.7;return[...f23CurveRuns(g.top,test),...f23CurveRuns(g.bottom,test)]}
function f24CircleUnderLink(n,l){if(l.a===n.id||l.b===n.id||f14ObjectZ(l,"link")<=f24NodeZ(n))return[];const out=[];let cur=[];for(let i=0;i<=360;i++){const a=-Math.PI+Math.PI*2*i/360,p={x:n.x+Math.cos(a)*(n.r+2),y:n.y+Math.sin(a)*(n.r+2)},on=f15PointLinkDistance(l,p,110)<=linkWidth(l)/2+1.2||f24PointInRoot(l,p);if(on)cur.push(p);else if(cur.length){if(cur.length>1)out.push(f23Path(cur));cur=[]}}if(cur.length>1)out.push(f23Path(cur));return out}

// Strict hose stacking: earlier-created hose is always lower. One separator is generated per upper hose,
// and a still-higher hose suppresses any lower separator beneath it (important for 3-way crossings).
function f24LinkOrder(){return[...links].sort((a,b)=>((a.seq??0)-(b.seq??0))||String(a.id).localeCompare(String(b.id)))}
function f24PointInLinkShape(l,p,extra=0){return f15PointLinkDistance(l,p,110)<=linkWidth(l)/2+extra||f24PointInRoot(l,p)}
function f24LinkSidesAgainst(up,lowers,blockers){const A=f21RootInfo(up,true),B=f21RootInfo(up,false);if(!A||!B||!lowers.length)return[];const t0=Math.min(A.t,B.t),t1=Math.max(A.t,B.t),off=linkWidth(up)/2+.9,out=[];for(const side of[-1,1]){let cur=[];for(let i=0;i<=320;i++){const t=t0+(t1-t0)*i/320,p=quadPoint(up,t),tg=quadTangent(up,t),u=unit(tg.x,tg.y),q={x:p.x-u.y*off*side,y:p.y+u.x*off*side},under=lowers.some(l=>f24PointInLinkShape(l,q,1.0)),blocked=blockers.some(l=>f24PointInLinkShape(l,q,1.0));if(under&&!blocked)cur.push(q);else if(cur.length){if(cur.length>1)out.push(f23Path(cur));cur=[]}}if(cur.length>1)out.push(f23Path(cur))}return out}

renderLinks=function(fast=false){linksLayer.replaceChildren();mergeLayer.replaceChildren();for(const l of f24LinkOrder()){for(const rp of linkRootPaths(l))linksLayer.appendChild(sEl("path",{d:rp.d,fill:F23_YELLOW,"data-f24-seq":l.seq??0}));linksLayer.appendChild(sEl("path",{d:linkPath(l),class:"link-body","stroke-width":linkWidth(l),"data-f24-seq":l.seq??0}))}for(const m of attachments){const e=mergeBridge(m,false);if(e)mergeLayer.appendChild(e)}};

const f24RenderNodesPrev=renderNodes;renderNodes=function(){f24RenderNodesPrev();for(const e of nodesLayer.querySelectorAll('[data-overlap-rim="node-link"]'))e.remove()};renderNodesFast=renderNodes;
function f24RenderBoundaries(){
  overlapLayer.replaceChildren();f15ZTopLayer.replaceChildren();const os=f24LinkOrder();
  for(let i=1;i<os.length;i++){const up=os[i],low=os.slice(0,i),block=os.slice(i+1);for(const d of f24LinkSidesAgainst(up,low,block))overlapLayer.appendChild(sEl("path",{d,fill:"none",stroke:F24_SEP,"stroke-width":F24_SEP_W,"stroke-linecap":"round","stroke-linejoin":"round","data-z-boundary":"f24-link-link","data-upper":up.id}))}
  for(const l of links){const lz=f14ObjectZ(l,"link"),A=f21RootInfo(l,true),B=f21RootInfo(l,false),lo=A&&B?Math.min(A.t,B.t):.03,hi=A&&B?Math.max(A.t,B.t):.97;for(const n of nodes){if(n.id===l.a||n.id===l.b||f24NodeZ(n)>=lz)continue;for(const r of linkNodeOverlapRanges(l,n)){const a=Math.max(lo,r[0]),b=Math.min(hi,r[1]);if(b-a>.002)f15ZTopLayer.appendChild(sEl("path",{d:f15RangePath(l,a,b),fill:"none",stroke:F23_YELLOW,"stroke-width":linkWidth(l),"stroke-linecap":"round","data-z-boundary":"f24-link-node-top"}))}for(const d of f23LinkSidesNode(l,n))f15ZTopLayer.appendChild(sEl("path",{d,fill:"none",stroke:F24_SEP,"stroke-width":F24_SEP_W,"stroke-linecap":"round","stroke-linejoin":"round","data-z-boundary":"f24-link-node-sep"}));for(const f of[true,false]){const g=f23RootGeom(l,f),runs=f24RootRuns(l,n,f,true);if(!g||!runs.length)continue;const id=`f24clip_${l.id}_${n.id}_${f?1:0}`.replace(/[^a-zA-Z0-9_-]/g,"_");const cp=sEl("clipPath",{id});cp.appendChild(sEl("circle",{cx:n.x,cy:n.y,r:n.r+1.5}));f15ZTopLayer.appendChild(cp);f15ZTopLayer.appendChild(sEl("path",{d:g.fill,fill:F23_YELLOW,stroke:"none","clip-path":`url(#${id})`,"data-z-boundary":"f24-root-node-top"}));for(const d of runs)f15ZTopLayer.appendChild(sEl("path",{d,fill:"none",stroke:F24_SEP,"stroke-width":F24_SEP_W,"stroke-linecap":"round","data-z-boundary":"f24-root-node-sep"}))}}}}
}
function f24RenderHidden(){hiddenLayer.replaceChildren();const os=[...nodes].sort((a,b)=>f24NodeZ(a)-f24NodeZ(b)||((a.created??0)-(b.created??0)));for(let i=0;i<os.length;i++)for(let j=i+1;j<os.length;j++)for(const d of f21HiddenCircleRuns(os[i],os[j]))hiddenLayer.appendChild(sEl("path",{d,class:"hidden-outline","data-f24-circle":"1"}));for(const n of os)for(const l of links){for(const d of f21HiddenLinkSideRuns(l,n))hiddenLayer.appendChild(sEl("path",{d,class:"hidden-outline","data-f24-side":"1"}));for(const f of[true,false])for(const d of f24RootRuns(l,n,f,false))hiddenLayer.appendChild(sEl("path",{d,class:"hidden-outline","data-f24-root":"1"}));for(const d of f24CircleUnderLink(n,l))hiddenLayer.appendChild(sEl("path",{d,class:"hidden-outline","data-f24-node-under-link":"1"}))}}
f18RenderZBoundaries=f24RenderBoundaries;f15RenderZBoundaries=f24RenderBoundaries;renderOverlapEdges=f24RenderBoundaries;renderHidden=f24RenderHidden;
renderAll=function(){if(renderRAF){cancelAnimationFrame(renderRAF);renderRAF=0}shadowLayer.style.display="";overlapLayer.style.display="";hiddenLayer.style.display="";renderShadow();renderLinks(false);renderNodes();f24RenderBoundaries();f24RenderHidden();renderUI();f22PlaceStatus();f24PlaceGuide()};
renderMotionNow=function(){shadowLayer.style.display="none";hiddenLayer.style.display="";renderLinks(true);renderNodes();f24RenderBoundaries();f24RenderHidden();renderUI();f22PlaceStatus();f24PlaceGuide()};
window.__mochiFix24Test={rawNodes:f24RawNodes,resolvedHits:f24ResolvedNodeHits,exclusiveLinkAt:f24ExclusiveLinkAt,rootRuns:f24RootRuns,circleUnderLink:f24CircleUnderLink,linkOrder:f24LinkOrder,linkSidesAgainst:f24LinkSidesAgainst,renderBoundaries:f24RenderBoundaries,renderHidden:f24RenderHidden,placeGuide:f24PlaceGuide,separator:{color:F24_SEP,width:F24_SEP_W}};
statusText=function(t){status.innerHTML=`餅マップ v0.9.4<br>BUILD ${F24_BUILD}<br>${t}`;f22PlaceStatus()};statusText("待機中");
