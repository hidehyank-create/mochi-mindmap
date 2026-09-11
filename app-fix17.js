"use strict";
// v0.9.4 FIX17
// Device-review fixes after FIX16:
// - approach bud appears already near final size, with a smooth large root R
// - attached components never get internal dark overlap rims
// - 3-node chain endpoint pivot keeps middle + opposite endpoint fixed
// - hidden node+link contours: partial root shoulders only; full-cover root R stays hidden
// - link/link separator intervals are tightened to the real crossing width
// - neck R slightly smaller than FIX16

const F17_BUILD="0912-FIX17";
const F17_BOUNDARY="#c3922e";
const F17_BG="#f7f4ed";

// ---------- approach bud: no growth from zero ----------
f13ContactMetrics=function(a,b){
  if(!a||!b)return{visible:false,touch:false,strength:0,gap:Infinity,tipA:null,tipB:null};
  const d=Math.max(.001,dist(a.x,a.y,b.x,b.y)),u=unit(b.x-a.x,b.y-a.y),gap=d-a.r-b.r,minR=Math.min(a.r,b.r);
  const startGap=clamp(minR*.42,27,38),raw=clamp((startGap-gap)/startGap,0,1);
  // Once it appears, the bud is already close to its final size instead of growing from zero.
  const visible=gap<startGap&&gap>-14,strength=visible?(.72+.28*f13Smooth(raw)):0;
  const ext=clamp(minR*.25,17,26)*strength,half=clamp(minR*.35,20,31)*strength;
  const tipA={x:a.x+u.x*(a.r+ext),y:a.y+u.y*(a.r+ext)},tipB={x:b.x-u.x*(b.r+ext),y:b.y-u.y*(b.r+ext)};
  return{visible,touch:visible&&gap<=ext*2+6&&gap>-14,strength,gap,startGap,ext,half,u,tipA,tipB};
};
f13BudPath=function(n,toward,m){
  if(!n||!m||!m.visible||m.strength<=.01)return null;
  const u=unit(toward.x-n.x,toward.y-n.y),v={x:-u.y,y:u.x};
  const tipR=Math.min(Math.max(10,m.half),n.r*.48),rootHalf=Math.min(n.r*.60,tipR*1.50+7);
  const x0=Math.sqrt(Math.max(1,n.r*n.r-rootHalf*rootHalf)),noseX=n.r+m.ext;
  const W=(x,y)=>({x:n.x+u.x*x+v.x*y,y:n.y+u.y*x+v.y*y});
  const top=W(x0,rootHalf),bot=W(x0,-rootHalf),nose=W(noseX,0);
  // Tangents follow the circle at the root, preventing a visible corner where the bulge leaves the circle.
  const rt=unit(rootHalf,-x0),rb=unit(rootHalf,x0),kRoot=Math.max(10,rootHalf*1.02),kNose=Math.max(8,tipR*.86);
  const c1=W(x0+rt.x*kRoot,rootHalf+rt.y*kRoot),c2=W(noseX-kNose,tipR);
  const c3=W(noseX-kNose,-tipR),c4=W(x0+rb.x*kRoot,-rootHalf+rb.y*kRoot);
  return`M ${top.x} ${top.y} C ${c1.x} ${c1.y} ${c2.x} ${c2.y} ${nose.x} ${nose.y} C ${c3.x} ${c3.y} ${c4.x} ${c4.y} ${bot.x} ${bot.y} Z`;
};

// Smaller than FIX16, but still visibly softer than the old narrow dango neck.
f13NeckProfile=function(m,boost=0){
  const A=nodeById(m.a),B=nodeById(m.b),minR=Math.min(A?.r||0,B?.r||0);
  const finalShoulder=clamp(minR*.665,27,minR*.74),startShoulder=clamp(minR*.72,finalShoulder+3,minR*.79);
  const finalWaist=clamp(minR*.505,20,minR*.565),startWaist=clamp(minR*.56,finalWaist+3,minR*.62);
  return{shoulder:finalShoulder+(startShoulder-finalShoulder)*boost,waist:finalWaist+(startWaist-finalWaist)*boost,minR};
};

// ---------- overlap rims: never inside an attached component ----------
function f17DecorateNodeOverlap(n,g){
  if(!n||!g)return;g.querySelectorAll('[data-upper-rim="1"],[data-overlap-rim]').forEach(e=>e.remove());
  const nz=f14ObjectZ(n,"node");
  for(const lower of nodes){
    if(lower.id===n.id||f14ObjectZ(lower,"node")>=nz)continue;
    if(sameComponent(n.id,lower.id)||linkExists(n.id,lower.id))continue;
    const arc=circleOverlapArc(n,lower);
    if(arc&&!arc.full)g.appendChild(sEl("path",{d:arc.d,fill:"none",stroke:F17_BOUNDARY,"stroke-width":3,"stroke-linecap":"round","data-overlap-rim":"node-node","data-lower":lower.id}));
  }
  for(const l of links){
    if(l.a===n.id||l.b===n.id||f14ObjectZ(l,"link")>=nz)continue;
    for(const d of f14CircleArcRuns(n,p=>f15PointLinkDistance(l,p,100)<=linkWidth(l)/2+2.2,240))
      g.appendChild(sEl("path",{d,fill:"none",stroke:F17_BOUNDARY,"stroke-width":3,"stroke-linecap":"round","data-overlap-rim":"node-link","data-lower":l.id}));
  }
}
f16DecorateNodeOverlap=f17DecorateNodeOverlap;

// ---------- 3-node chain: selected end moves, middle/opposite end stay fixed ----------
function f17ThreeChainInfo(id){
  const ids=componentIds(id);if(ids.length!==3)return null;
  const seams=directAttachmentsOf(id);if(seams.length!==1)return null;
  const midId=seams[0].a===id?seams[0].b:seams[0].a;if(directAttachmentsOf(midId).length!==2)return null;
  const otherSeam=directAttachmentsOf(midId).find(m=>m.a!==id&&m.b!==id);if(!otherSeam)return null;
  const otherId=otherSeam.a===midId?otherSeam.b:otherSeam.a;return{ids,midId,otherId};
}
const f17StartMovePrev=startMoveGesture;
startMoveGesture=function(evt,p,n){
  const tri=f17ThreeChainInfo(n.id);
  if(tri){const mid=nodeById(tri.midId),other=nodeById(tri.otherId);if(mid&&other){
    crossPairs.clear();gesture={pointerId:evt.pointerId,mode:"f17Pivot3Fixed",nodeId:n.id,pivotId:mid.id,otherId:other.id,compIds:tri.ids,start:p,points:[p],pivotRadius:dist(n.x,n.y,mid.x,mid.y),contactPair:null,inputType:evt.pointerType||"pen"};selected={type:"node",id:n.id};f13ClearContactPreview();statusText("3個接着：選択端だけ回転");scheduleMotionRender();return;
  }}
  return f17StartMovePrev(evt,p,n);
};
function f17UpdatePivot3(g,p){
  const n=nodeById(g.nodeId),mid=nodeById(g.pivotId),other=nodeById(g.otherId);if(!n||!mid||!other)return;
  const last=g.points.at(-1);if(!last||dist(last.x,last.y,p.x,p.y)>=2/view.scale)g.points.push(p);
  const u=unit(p.x-mid.x,p.y-mid.y);n.x=mid.x+u.x*g.pivotRadius;n.y=mid.y+u.y*g.pivotRadius;
  // Middle and opposite endpoint are deliberately untouched.
  const m=f13ContactMetrics(n,other);g.contactPair=null;
  if(m.visible){f13RenderContactPreview(n.id,other.id);if(m.touch)g.contactPair={movedId:n.id,otherId:other.id}}
  else f13ClearContactPreview();
  statusText(g.contactPair?"両端接触：離すと輪を閉じる":"3個接着：中央・反対端は固定");scheduleMotionRender();
}
const f17PenMovePrev=penMove;
penMove=function(evt){if(gesture&&evt.pointerId===gesture.pointerId&&gesture.mode==="f17Pivot3Fixed"){evt.preventDefault();f17UpdatePivot3(gesture,eventToWorld(evt));return}return f17PenMovePrev(evt)};
const f17PenEndPrev=penEnd;
penEnd=function(evt){
  if(gesture&&evt.pointerId===gesture.pointerId&&gesture.mode==="f17Pivot3Fixed"){
    evt.preventDefault();const g=gesture,pair=g.contactPair?{...g.contactPair}:null;f13ClearContactPreview();gesture=null;
    if(pair){addAttachment(pair.movedId,pair.otherId,g.nodeId);statusText("3個の両端を接着：輪を閉じました")}else statusText("3個接着の回転を確定");
    renderAll();commitHistory();return;
  }
  return f17PenEndPrev(evt);
};

// ---------- hidden contours ----------
function f17NodeFullyCoveredBy(n,cover){return dist(n.x,n.y,cover.x,cover.y)+n.r<=cover.r+.75}
function f17RenderHidden(){
  hiddenLayer.replaceChildren();const ordered=[...nodes].sort((a,b)=>f14ObjectZ(a,"node")-f14ObjectZ(b,"node")||((a.created??0)-(b.created??0)));
  for(let i=0;i<ordered.length;i++){
    const lower=ordered[i];let fullCover=null;
    for(let j=i+1;j<ordered.length;j++){
      const upper=ordered[j];if(sameComponent(lower.id,upper.id))continue;const arc=circleCoveredArc(lower,upper);if(!arc)continue;
      if(arc.full){fullCover=upper;break}
      hiddenLayer.appendChild(sEl("path",{d:arc.d,class:"hidden-outline","data-hidden-node":lower.id,"data-cover":upper.id,"data-partial":"1"}));
    }
    if(fullCover){const d=f16HiddenCirclePath(lower);if(d)hiddenLayer.appendChild(sEl("path",{d,class:"hidden-outline","data-hidden-node":lower.id,"data-full-cover":"1","data-cover":fullCover.id}))}
  }
  // Hidden hose sides are always preserved. Root shoulder dashes are used only for a partial cover;
  // a fully buried endpoint intentionally has no separate root-R dash.
  for(const cover of ordered){for(const l of links){
    if(l.a===cover.id||l.b===cover.id)continue;
    for(const d of hiddenLinkEdges(l,cover))hiddenLayer.appendChild(sEl("path",{d,class:"hidden-outline","data-hidden-link":l.id,"data-cover":cover.id}));
    if(typeof f12HiddenRootEdges==="function"){
      for(const endpointId of[l.a,l.b]){const endpoint=nodeById(endpointId);if(!endpoint||sameComponent(endpoint.id,cover.id)||f14ObjectZ(endpoint,"node")>=f14ObjectZ(cover,"node"))continue;if(f17NodeFullyCoveredBy(endpoint,cover))continue;
        for(const d of f12HiddenRootEdges(l,cover))hiddenLayer.appendChild(sEl("path",{d,class:"hidden-outline","data-hidden-root":l.id,"data-cover":cover.id,"data-partial-root":"1"}));break;
      }
    }
  }}
}
renderHidden=f17RenderHidden;

// ---------- exact compact link/link separator ----------
function f17UnitTangent(l,t){const q=quadTangent(l,t);return unit(q.x,q.y)}
function f17ClosestLowerT(lower,p){let bestT=0,best=Infinity;const steps=100;for(let i=0;i<=steps;i++){const t=i/steps,q=quadPoint(lower,t),d=dist(p.x,p.y,q.x,q.y);if(d<best){best=d;bestT=t}}return bestT}
function f17ArcLenToT(l,mid,dir,target,limit){let lo=0,hi=Math.abs(limit-mid);for(let i=0;i<16;i++){const d=(lo+hi)/2,t=mid+dir*d,len=f15RangeArcLength(l,Math.min(mid,t),Math.max(mid,t),20);if(len<target)lo=d;else hi=d}return mid+dir*((lo+hi)/2)}
function f17CompactRange(upper,lower,t0,t1){
  const mid=(t0+t1)/2,p=quadPoint(upper,mid),lt=f17ClosestLowerT(lower,p),tu=f17UnitTangent(upper,mid),tl=f17UnitTangent(lower,lt),sin=Math.abs(tu.x*tl.y-tu.y*tl.x);
  const existing=f15RangeArcLength(upper,t0,t1,40),wanted=Math.min(existing,Math.max(linkWidth(lower)+2,(linkWidth(lower)+2)/Math.max(.58,sin)));
  const half=Math.max(2,wanted/2-1.25),a=f17ArcLenToT(upper,mid,-1,half,t0),b=f17ArcLenToT(upper,mid,1,half,t1);return[a,b];
}
function f17RenderZBoundaries(){
  f14NormalizeLinkZ();overlapLayer.replaceChildren();f15ZTopLayer.replaceChildren();const ordered=[...links].sort((a,b)=>f14ObjectZ(a,"link")-f14ObjectZ(b,"link")||((a.seq??0)-(b.seq??0)));
  for(let i=1;i<ordered.length;i++){const upper=ordered[i];for(let j=0;j<i;j++){const lower=ordered[j];for(const raw of f15LinkLinkRanges(upper,lower)){const[t0,t1]=f17CompactRange(upper,lower,raw[0],raw[1]);if(t1<=t0)continue;const d=f15RangePath(upper,t0,t1);overlapLayer.appendChild(sEl("path",{d,fill:"none",stroke:F17_BG,"stroke-width":linkWidth(upper)+4,"stroke-linecap":"butt","data-z-boundary":"link-link-gap","data-lower":lower.id,"data-f17-compact":"1"}))}}}
  for(const l of links){const lz=f14ObjectZ(l,"link");for(const n of nodes){if(l.a===n.id||l.b===n.id||f14ObjectZ(n,"node")>=lz)continue;for(const[t0,t1]of linkNodeOverlapRanges(l,n)){const d=f15RangePath(l,t0,t1);f15ZTopLayer.appendChild(sEl("path",{d,fill:"none",stroke:F17_BG,"stroke-width":linkWidth(l)+4,"stroke-linecap":"butt","data-z-boundary":"link-node-gap"}));f15ZTopLayer.appendChild(sEl("path",{d,fill:"none",stroke:"#f0c867","stroke-width":linkWidth(l),"stroke-linecap":"round","data-z-boundary":"link-node-top"}))}}}
}
f15RenderZBoundaries=f17RenderZBoundaries;renderOverlapEdges=f17RenderZBoundaries;

window.__mochiFix17Test={budMetrics:f13ContactMetrics,budPath:f13BudPath,neckProfile:f13NeckProfile,threeChainInfo:f17ThreeChainInfo,renderHidden:f17RenderHidden,compactRange:f17CompactRange,renderBoundaries:f17RenderZBoundaries,decorateNode:f17DecorateNodeOverlap};
statusText=function(t){status.innerHTML=`餅マップ v0.9.4<br>BUILD ${F17_BUILD}<br>${t}`};
statusText("待機中");
