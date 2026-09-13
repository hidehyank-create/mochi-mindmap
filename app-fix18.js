"use strict";
// v0.9.4 FIX18
// - unified node+approach silhouette (no separate bump overlay)
// - stretch-priority band widened from 84% to 80.5% of radius (~16 px on default R82)
// - hidden node/link contours omit root-R dashes and use one geometric visibility rule
// - link/link crossings use two short edge separators instead of white wrap bands
// - fully-overlapping small upper nodes receive the dark mochi outline
// - FIX17 neck/pivot/attachment behavior preserved

const F18_BUILD="0913-FIX18";
const F18_BOUNDARY="#c3922e";
const F18_STRETCH_START_FRAC=.805;
const F18_MOBILE_TOOLBAR_MAX=480;
let f18PreviewPair=null;

// ---------- approach preview: one continuous outer silhouette ----------
function f18BulgedNodePath(n,toward,m){
  if(!n||!toward||!m?.visible)return circlePath(n.x,n.y,n.r);
  const u=unit(toward.x-n.x,toward.y-n.y),v={x:-u.y,y:u.x};
  const tipR=Math.min(Math.max(10,m.half),n.r*.48),rootHalf=Math.min(n.r*.60,tipR*1.50+7);
  const x0=Math.sqrt(Math.max(1,n.r*n.r-rootHalf*rootHalf)),noseX=n.r+m.ext;
  const W=(x,y)=>({x:n.x+u.x*x+v.x*y,y:n.y+u.y*x+v.y*y});
  const top=W(x0,rootHalf),bot=W(x0,-rootHalf),nose=W(noseX,0);
  const rt=unit(rootHalf,-x0),rb=unit(rootHalf,x0),kRoot=Math.max(10,rootHalf*1.02),kNose=Math.max(8,tipR*.86);
  const c1=W(x0+rt.x*kRoot,rootHalf+rt.y*kRoot),c2=W(noseX-kNose,tipR),c3=W(noseX-kNose,-tipR),c4=W(x0+rb.x*kRoot,-rootHalf+rb.y*kRoot);
  let d=`M ${top.x} ${top.y} C ${c1.x} ${c1.y} ${c2.x} ${c2.y} ${nose.x} ${nose.y} C ${c3.x} ${c3.y} ${c4.x} ${c4.y} ${bot.x} ${bot.y}`;
  const theta=Math.asin(clamp(rootHalf/Math.max(1,n.r),0,.999));
  const steps=44;for(let i=1;i<=steps;i++){const a=-theta+(-2*Math.PI+2*theta)*(i/steps),p=W(n.r*Math.cos(a),n.r*Math.sin(a));d+=` L ${p.x} ${p.y}`}
  return d+" Z";
}
function f18ClearPreview(){f18PreviewPair=null;liveLayer.querySelector("#f13ContactPreview")?.remove();if(typeof f12ClearContactPreview==="function")f12ClearContactPreview()}
function f18SetPreview(aId,bId){const a=nodeById(aId),b=nodeById(bId);if(!a||!b){f18ClearPreview();return null}const m=f13ContactMetrics(a,b);if(!m.visible){f18ClearPreview();return m}f18PreviewPair={aId,bId,m};liveLayer.querySelector("#f13ContactPreview")?.remove();return m}
f13ClearContactPreview=f18ClearPreview;
f13RenderContactPreview=f18SetPreview;

function f18PreviewForNode(n){if(!f18PreviewPair||!n)return null;if(n.id===f18PreviewPair.aId){const o=nodeById(f18PreviewPair.bId);return o?{toward:o,m:f13ContactMetrics(n,o)}:null}if(n.id===f18PreviewPair.bId){const o=nodeById(f18PreviewPair.aId);return o?{toward:o,m:f13ContactMetrics(n,o)}:null}return null}

// ---------- upper-node overlap rim ----------
function f18DecorateNodeOverlap(n,g){
  if(!n||!g)return;g.querySelectorAll('[data-upper-rim="1"],[data-overlap-rim]').forEach(e=>e.remove());const nz=f14ObjectZ(n,"node");
  for(const lower of nodes){
    if(lower.id===n.id||f14ObjectZ(lower,"node")>=nz||sameComponent(n.id,lower.id)||linkExists(n.id,lower.id))continue;
    const dd=dist(n.x,n.y,lower.x,lower.y);if(dd>=n.r+lower.r-.25)continue;
    // If a smaller upper circle sits completely on a larger lower circle, its whole visible perimeter defines the overlap edge.
    if(dd+n.r<=lower.r+.5){g.appendChild(sEl("path",{d:circlePath(n.x,n.y,n.r),fill:"none",stroke:F18_BOUNDARY,"stroke-width":3,"stroke-linecap":"round","data-overlap-rim":"node-node","data-full-overlap":"1","data-lower":lower.id}));continue}
    const arc=circleOverlapArc(n,lower);if(arc&&!arc.full)g.appendChild(sEl("path",{d:arc.d,fill:"none",stroke:F18_BOUNDARY,"stroke-width":3,"stroke-linecap":"round","data-overlap-rim":"node-node","data-lower":lower.id}))
  }
  for(const l of links){if(l.a===n.id||l.b===n.id||f14ObjectZ(l,"link")>=nz)continue;for(const d of f14CircleArcRuns(n,p=>f15PointLinkDistance(l,p,100)<=linkWidth(l)/2+2.2,240))g.appendChild(sEl("path",{d,fill:"none",stroke:F18_BOUNDARY,"stroke-width":3,"stroke-linecap":"round","data-overlap-rim":"node-link","data-lower":l.id}))}
}
renderNodes=function(){
  nodesLayer.replaceChildren();const hidden=hiddenNodeMap();for(const n of sortedNodes()){
    const g=sEl("g",{"data-id":n.id}),pv=f18PreviewForNode(n),d=pv&&pv.m.visible?f18BulgedNodePath(n,pv.toward,pv.m):circlePath(n.x,n.y,n.r),blob=sEl("path",{d,class:"node","data-f18-bulged":pv&&pv.m.visible?"1":null});g.appendChild(blob);
    if(!hidden.has(n.id)){const text=sEl("text",{x:n.x,y:n.y,class:"label","font-size":Math.max(15,Math.min(22,n.r*.34))});text.textContent=n.label;g.appendChild(text)}
    nodesLayer.appendChild(g);f18DecorateNodeOverlap(n,g)
  }
};renderNodesFast=renderNodes;

// ---------- stretch priority: 16 px inward on default R82 ----------
const f18PenMovePrev=penMove;
penMove=function(evt){
  if(gesture&&evt.pointerId===gesture.pointerId&&gesture.mode==="nodePending"){
    const p=eventToWorld(evt),pending=gesture,n=nodeById(pending.nodeId);if(n){const m=dist(pending.start.x,pending.start.y,p.x,p.y),threshold=(pending.inputType==="pen"?PEN_MOVE_THRESHOLD:MOVE_THRESHOLD)/view.scale;if(m>threshold){
      const radial=unit(pending.start.x-n.x,pending.start.y-n.y),mv=unit(p.x-pending.start.x,p.y-pending.start.y),outward=radial.x*mv.x+radial.y*mv.y,startFrac=dist(pending.start.x,pending.start.y,n.x,n.y)/Math.max(n.r,1);
      if((startFrac>F18_STRETCH_START_FRAC&&outward>.28)||(startFrac>.70&&outward>.50)){
        evt.preventDefault();cancelHold();pending.moved=true;pending.mode="stretch";pending.lockId=null;pending.targetId=null;updateLiveSource(n,p);statusText("餅を伸ばす");return
      }
    }}
  }
  return f18PenMovePrev(evt)
};

// ---------- hidden contour: circle + hose sides, never internal root R ----------
function f18LinkGapAtNode(n,angle){for(const l of links){if(l.a!==n.id&&l.b!==n.id)continue;const o=nodeById(l.a===n.id?l.b:l.a);if(!o)continue;const a=Math.atan2(o.y-n.y,o.x-n.x),gap=Math.asin(clamp((linkWidth(l)*.58+5)/Math.max(1,n.r),0,.92))+.08;if(Math.abs(Math.atan2(Math.sin(angle-a),Math.cos(angle-a)))<gap)return true}return false}
function f18NodePointHidden(n,p){const nz=f14ObjectZ(n,"node");for(const upper of nodes){if(upper.id===n.id||f14ObjectZ(upper,"node")<=nz||sameComponent(n.id,upper.id))continue;if(dist(p.x,p.y,upper.x,upper.y)<upper.r-1)return true}return false}
function f18HiddenCircleRuns(n){
  const runs=[];let pts=[];const steps=300,R=n.r+2;for(let i=0;i<=steps;i++){const a=-Math.PI+2*Math.PI*i/steps,p={x:n.x+Math.cos(a)*R,y:n.y+Math.sin(a)*R},on=f18NodePointHidden(n,p)&&!f18LinkGapAtNode(n,a);if(on)pts.push(p);else if(pts.length){if(pts.length>1)runs.push(pts);pts=[]}}if(pts.length>1)runs.push(pts);return runs.map(arr=>arr.map((p,i)=>(i?`L ${p.x} ${p.y}`:`M ${p.x} ${p.y}`)).join(" "))
}
function f18RenderHidden(){
  hiddenLayer.replaceChildren();for(const n of nodes)for(const d of f18HiddenCircleRuns(n))hiddenLayer.appendChild(sEl("path",{d,class:"hidden-outline","data-hidden-node":n.id,"data-f18-unified":"1"}));
  const ordered=[...nodes].sort((a,b)=>f14ObjectZ(a,"node")-f14ObjectZ(b,"node")||((a.created??0)-(b.created??0)));for(const cover of ordered){for(const l of links){if(l.a===cover.id||l.b===cover.id)continue;for(const d of hiddenLinkEdges(l,cover))hiddenLayer.appendChild(sEl("path",{d,class:"hidden-outline","data-hidden-link":l.id,"data-cover":cover.id,"data-f18-unified":"1"}))}}
}
renderHidden=f18RenderHidden;

// ---------- crossings: two short edge separators, no white transverse band ----------
function f18OffsetRangePath(l,t0,t1,side){const len=f15RangeArcLength(l,t0,t1,36),steps=Math.max(7,Math.min(34,Math.ceil(len/4))),off=linkWidth(l)/2+1.8;let d="";for(let i=0;i<=steps;i++){const t=t0+(t1-t0)*i/steps,p=quadPoint(l,t),tg=quadTangent(l,t),u=unit(tg.x,tg.y),q={x:p.x-u.y*off*side,y:p.y+u.x*off*side};d+=(i?` L ${q.x} ${q.y}`:`M ${q.x} ${q.y}`)}return d}
function f18RenderZBoundaries(){
  f14NormalizeLinkZ();overlapLayer.replaceChildren();f15ZTopLayer.replaceChildren();const ordered=[...links].sort((a,b)=>f14ObjectZ(a,"link")-f14ObjectZ(b,"link")||((a.seq??0)-(b.seq??0)));
  for(let i=1;i<ordered.length;i++){const upper=ordered[i];for(let j=0;j<i;j++){const lower=ordered[j];for(const raw of f15LinkLinkRanges(upper,lower)){const range=typeof f17CompactRange==="function"?f17CompactRange(upper,lower,raw[0],raw[1]):raw;const t0=range[0],t1=range[1];if(t1<=t0)continue;for(const side of[-1,1])overlapLayer.appendChild(sEl("path",{d:f18OffsetRangePath(upper,t0,t1,side),fill:"none",stroke:F18_BOUNDARY,"stroke-width":2.4,"stroke-linecap":"round","data-z-boundary":"link-link-edge","data-lower":lower.id,"data-side":String(side)}))}}}
  // Preserve link-over-node z rendering from FIX17, but do not add a transverse link/link band.
  for(const l of links){const lz=f14ObjectZ(l,"link");for(const n of nodes){if(l.a===n.id||l.b===n.id||f14ObjectZ(n,"node")>=lz)continue;for(const[t0,t1]of linkNodeOverlapRanges(l,n)){const d=f15RangePath(l,t0,t1);f15ZTopLayer.appendChild(sEl("path",{d,fill:"none",stroke:"#f7f4ed","stroke-width":linkWidth(l)+4,"stroke-linecap":"butt","data-z-boundary":"link-node-gap"}));f15ZTopLayer.appendChild(sEl("path",{d,fill:"none",stroke:"#f0c867","stroke-width":linkWidth(l),"stroke-linecap":"round","data-z-boundary":"link-node-top"}))}}}
}
f15RenderZBoundaries=f18RenderZBoundaries;renderOverlapEdges=f18RenderZBoundaries;

// Re-wrap final render functions so late FIX18 renderers are always used.
renderAll=function(){if(renderRAF){cancelAnimationFrame(renderRAF);renderRAF=0}shadowLayer.style.display="";overlapLayer.style.display="";hiddenLayer.style.display="";renderShadow();renderLinks(false);renderNodes();f18RenderZBoundaries();f18RenderHidden();renderUI()};
renderMotionNow=function(){shadowLayer.style.display="none";hiddenLayer.style.display="";renderLinks(true);renderNodes();f18RenderZBoundaries();f18RenderHidden();renderUI()};

window.__mochiFix18Test={stretchStartFrac:F18_STRETCH_START_FRAC,mobileToolbarMax:F18_MOBILE_TOOLBAR_MAX,budMetrics:f13ContactMetrics,bulgedNodePath:f18BulgedNodePath,setPreview:f18SetPreview,clearPreview:f18ClearPreview,neckProfile:f13NeckProfile,decorateNode:f18DecorateNodeOverlap,renderHidden:f18RenderHidden,renderBoundaries:f18RenderZBoundaries,offsetRangePath:f18OffsetRangePath};
statusText=function(t){status.innerHTML=`餅マップ v0.9.4<br>BUILD ${F18_BUILD}<br>${t}`};statusText("待機中");