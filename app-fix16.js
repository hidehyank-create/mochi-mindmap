"use strict";
// v0.9.4 FIX16
// - smooth tangent roots for live/completed/edited links
// - large smooth mochi approach bulge (no small round nub)
// - attached/link-connected nodes never receive overlap rim
// - geometric hidden dashed outlines follow true z order, including full cover
// - 2-node pivot restored; 3-node endpoint pivot chain; bead flex starts at 4 nodes
// - neck R reduced from FIX15

const F16_BUILD="0912-FIX16";
const F16_BOUNDARY="#c3922e";

function f16NodeZ(n){return n?.z??0}
function f16LinkZ(l){return f14ObjectZ(l,"link")}
function f16SameLinkEndpoint(n,l){return !!n&&(l.a===n.id||l.b===n.id)}
function f16TrueNodeOverlap(upper,lower){return !!upper&&!!lower&&!directAttached(upper.id,lower.id)&&dist(upper.x,upper.y,lower.x,lower.y)<upper.r+lower.r-.25}

// ---------- smooth root geometry ----------
function f16RootPatch(n,dir,width,progress=1){
  if(!n||progress<=.01)return null;
  const u=unit(dir.x,dir.y),v={x:-u.y,y:u.x},half=width/2,p=clamp(progress,0,1);
  const shoulderMax=clamp(width*1.34,half+7,Math.min(n.r*.60,width*1.55));
  const shoulder=half+(shoulderMax-half)*p;
  const x0=Math.sqrt(Math.max(1,n.r*n.r-shoulder*shoulder));
  const neck=clamp(width*1.18,22,48)*p,x1=n.r+neck;
  const W=(x,y)=>({x:n.x+u.x*x+v.x*y,y:n.y+u.y*x+v.y*y});
  const P1=W(x0,shoulder),P2=W(x0,-shoulder),Q1=W(x1,half),Q2=W(x1,-half);
  const tangentTop=unit(shoulder,-x0),tangentBot=unit(shoulder,x0);
  const k1=Math.max(5,neck*.72),k2=Math.max(5,neck*.46);
  const C1=W(x0+tangentTop.x*k1,shoulder+tangentTop.y*k1),C2=W(x1-k2,half);
  const C3=W(x1-k2,-half),C4=W(x0+tangentBot.x*k1,-shoulder+tangentBot.y*k1);
  return `M ${P1.x} ${P1.y} C ${C1.x} ${C1.y} ${C2.x} ${C2.y} ${Q1.x} ${Q1.y} L ${Q2.x} ${Q2.y} C ${C3.x} ${C3.y} ${C4.x} ${C4.y} ${P2.x} ${P2.y} Z`;
}
rootPatchPath=f16RootPatch;
curvedRootPatchPath=function(l,fromA){
  const n=nodeById(fromA?l.a:l.b);if(!n)return null;
  let tg=quadTangent(l,fromA?0.012:.988);if(!fromA)tg={x:-tg.x,y:-tg.y};
  return f16RootPatch(n,tg,linkWidth(l),1);
};
linkRootPaths=function(l){return[{d:curvedRootPatchPath(l,true)},{d:curvedRootPatchPath(l,false)}].filter(x=>x.d)};

// ---------- approach bulge: final mochi appears to swell outward ----------
f13ContactMetrics=function(a,b){
  if(!a||!b)return{visible:false,touch:false,strength:0,gap:Infinity,tipA:null,tipB:null};
  const d=Math.max(.001,dist(a.x,a.y,b.x,b.y)),u=unit(b.x-a.x,b.y-a.y),gap=d-a.r-b.r,minR=Math.min(a.r,b.r);
  const startGap=clamp(minR*.48,28,42),strength=f13Smooth(clamp((startGap-gap)/startGap,0,1));
  const maxExt=clamp(minR*.27,18,28),ext=maxExt*strength;
  const half=clamp(minR*.43,22,36)*strength;
  const tipA={x:a.x+u.x*(a.r+ext),y:a.y+u.y*(a.r+ext)},tipB={x:b.x-u.x*(b.r+ext),y:b.y-u.y*(b.r+ext)};
  return{visible:gap<startGap&&gap>-14,touch:gap<=ext*2+6&&gap>-14,strength,gap,startGap,ext,half,u,tipA,tipB};
};
f13BudPath=function(n,toward,m){
  if(!n||!m||m.strength<=.01)return null;
  const u=unit(toward.x-n.x,toward.y-n.y),v={x:-u.y,y:u.x};
  const capR=Math.min(Math.max(2,m.half),n.r*.58),rootHalf=Math.min(n.r*.62,capR*1.35+6*m.strength);
  const x0=Math.sqrt(Math.max(1,n.r*n.r-rootHalf*rootHalf)),noseX=n.r+m.ext;
  const W=(x,y)=>({x:n.x+u.x*x+v.x*y,y:n.y+u.y*x+v.y*y});
  const top=W(x0,rootHalf),bot=W(x0,-rootHalf),nose=W(noseX,0);
  const rt=unit(rootHalf,-x0),rb=unit(rootHalf,x0),kRoot=Math.max(8,rootHalf*.98),kNose=Math.max(7,capR*.82);
  const c1=W(x0+rt.x*kRoot,rootHalf+rt.y*kRoot),c2=W(noseX-kNose,capR);
  const c3=W(noseX-kNose,-capR),c4=W(x0+rb.x*kRoot,-rootHalf+rb.y*kRoot);
  return `M ${top.x} ${top.y} C ${c1.x} ${c1.y} ${c2.x} ${c2.y} ${nose.x} ${nose.y} C ${c3.x} ${c3.y} ${c4.x} ${c4.y} ${bot.x} ${bot.y} Z`;
};

// Slightly smaller than FIX15, slightly fuller than original FIX13.
f13NeckProfile=function(m,boost=0){
  const A=nodeById(m.a),B=nodeById(m.b),minR=Math.min(A?.r||0,B?.r||0);
  const finalShoulder=clamp(minR*.705,29,minR*.78),startShoulder=clamp(minR*.765,finalShoulder+3,minR*.83);
  const finalWaist=clamp(minR*.565,21,minR*.62),startWaist=clamp(minR*.625,finalWaist+3,minR*.68);
  return{shoulder:finalShoulder+(startShoulder-finalShoulder)*boost,waist:finalWaist+(startWaist-finalWaist)*boost,minR};
};

// ---------- z / overlap rendering ----------
function f16DecorateNodeOverlap(n,g){
  if(!n||!g)return;g.querySelectorAll('[data-upper-rim="1"],[data-overlap-rim]').forEach(e=>e.remove());
  const nz=f16NodeZ(n);
  for(const lower of nodes){
    if(lower.id===n.id||f16NodeZ(lower)>=nz||!f16TrueNodeOverlap(n,lower))continue;
    const arc=circleOverlapArc(n,lower);if(arc&&!arc.full)g.appendChild(sEl("path",{d:arc.d,fill:"none",stroke:F16_BOUNDARY,"stroke-width":3,"stroke-linecap":"round","data-overlap-rim":"node-node","data-lower":lower.id}));
  }
  for(const l of links){
    if(f16SameLinkEndpoint(n,l)||f16LinkZ(l)>=nz)continue;
    for(const d of f14CircleArcRuns(n,p=>f15PointLinkDistance(l,p,110)<=linkWidth(l)/2+2.2,240))g.appendChild(sEl("path",{d,fill:"none",stroke:F16_BOUNDARY,"stroke-width":3,"stroke-linecap":"round","data-overlap-rim":"node-link","data-lower":l.id}));
  }
}

function f16HiddenCirclePath(n){
  const dirs=[];
  for(const l of links){if(l.a!==n.id&&l.b!==n.id)continue;const other=nodeById(l.a===n.id?l.b:l.a);if(!other)continue;const a=Math.atan2(other.y-n.y,other.x-n.x),gap=Math.asin(clamp((linkWidth(l)*.66+7)/Math.max(n.r,1),0,.94))+.12;dirs.push({a,gap})}
  for(const m of attachments){if(m.a!==n.id&&m.b!==n.id)continue;const o=nodeById(m.a===n.id?m.b:m.a);if(!o)continue;const a=Math.atan2(o.y-n.y,o.x-n.x),pr=f13NeckProfile(m,0),gap=Math.asin(clamp((pr.shoulder+5)/Math.max(n.r,1),0,.95))+.10;dirs.push({a,gap})}
  let d="",drawing=false;const steps=240,R=n.r+2;
  for(let i=0;i<=steps;i++){const a=-Math.PI+2*Math.PI*i/steps,inGap=dirs.some(q=>Math.abs(Math.atan2(Math.sin(a-q.a),Math.cos(a-q.a)))<q.gap),p={x:n.x+Math.cos(a)*R,y:n.y+Math.sin(a)*R};if(!inGap){d+=(drawing?` L ${p.x} ${p.y}`:`M ${p.x} ${p.y}`);drawing=true}else drawing=false}
  return d;
}
function f16RenderHidden(){
  hiddenLayer.replaceChildren();const ordered=[...nodes].sort((a,b)=>f16NodeZ(a)-f16NodeZ(b)||((a.created??0)-(b.created??0)));
  for(let i=0;i<ordered.length;i++){
    const lower=ordered[i];let full=false;
    for(let j=i+1;j<ordered.length;j++){
      const upper=ordered[j];if(directAttached(lower.id,upper.id))continue;const arc=circleCoveredArc(lower,upper);if(!arc)continue;
      if(arc.full){full=true;break}
      hiddenLayer.appendChild(sEl("path",{d:arc.d,class:"hidden-outline","data-hidden-node":lower.id,"data-cover":upper.id}));
    }
    if(full){const d=f16HiddenCirclePath(lower);if(d)hiddenLayer.appendChild(sEl("path",{d,class:"hidden-outline","data-hidden-node":lower.id,"data-full-cover":"1"}))}
  }
  // Preserve hidden hose sides/root information under covering circles.
  for(const cover of ordered){for(const l of links){if(f16SameLinkEndpoint(cover,l))continue;for(const d of hiddenLinkEdges(l,cover))hiddenLayer.appendChild(sEl("path",{d,class:"hidden-outline","data-hidden-link":l.id}))}}
}
renderHidden=f16RenderHidden;

// Rebuild node layer with true z decoration only; attached pairs themselves get no rim.
renderNodes=function(){
  nodesLayer.replaceChildren();const hidden=hiddenNodeMap();for(const n of sortedNodes()){
    const g=sEl("g",{"data-id":n.id}),blob=sEl("path",{d:circlePath(n.x,n.y,n.r),class:"node"});g.appendChild(blob);
    if(!hidden.has(n.id)){const text=sEl("text",{x:n.x,y:n.y,class:"label","font-size":Math.max(15,Math.min(22,n.r*.34))});text.textContent=n.label;g.appendChild(text)}
    nodesLayer.appendChild(g);f16DecorateNodeOverlap(n,g);
  }
};
renderNodesFast=renderNodes;

// ---------- 2/3-node pivot behavior; bead flex starts at 4 ----------
function f16Degree(id){return directAttachmentsOf(id).length}
function f16ThreeChainInfo(id){
  const ids=componentIds(id);if(ids.length!==3||f16Degree(id)!==1)return null;
  const seam=directAttachmentsOf(id)[0],midId=seam.a===id?seam.b:seam.a;if(f16Degree(midId)!==2)return null;
  const otherSeam=directAttachmentsOf(midId).find(m=>m.a!==id&&m.b!==id),otherId=otherSeam?(otherSeam.a===midId?otherSeam.b:otherSeam.a):null;
  return otherId?{ids,midId,otherId}:null;
}
const f16StartMovePrev=startMoveGesture;
startMoveGesture=function(evt,p,n){
  const ids=componentIds(n.id),seams=directAttachmentsOf(n.id);
  if(ids.length===2&&seams.length===1){
    const pivotId=seams[0].a===n.id?seams[0].b:seams[0].a,pivot=nodeById(pivotId);if(pivot){crossPairs.clear();gesture={pointerId:evt.pointerId,mode:"pivot",nodeId:n.id,pivotId,compIds:[n.id],start:p,starts:{[n.id]:{x:n.x,y:n.y}},points:[p],pivotRadius:dist(n.x,n.y,pivot.x,pivot.y),contactPair:null,inputType:evt.pointerType||"pen"};selected={type:"node",id:n.id};statusText("2個接着：相手の外形に沿って回転");scheduleMotionRender();return}
  }
  const tri=f16ThreeChainInfo(n.id);if(tri){
    const mid=nodeById(tri.midId),other=nodeById(tri.otherId);crossPairs.clear();gesture={pointerId:evt.pointerId,mode:"f16PivotChain",nodeId:n.id,pivotId:mid.id,otherId:other.id,compIds:tri.ids,start:p,points:[p],startAngle:Math.atan2(n.y-mid.y,n.x-mid.x),otherStartAngle:Math.atan2(other.y-mid.y,other.x-mid.x),pivotRadius:dist(n.x,n.y,mid.x,mid.y),otherRadius:dist(other.x,other.y,mid.x,mid.y),contactPair:null,inputType:evt.pointerType||"pen"};selected={type:"node",id:n.id};statusText("3個接着：端を回すと反対端も逃げる");scheduleMotionRender();return
  }
  if(ids.length===3){
    const starts=f13BuildStarts(ids);gesture={pointerId:evt.pointerId,mode:"f16Rigid3",nodeId:n.id,compIds:ids,start:p,starts,points:[p],contactPair:null,inputType:evt.pointerType||"pen"};selected={type:"node",id:n.id};statusText("3個接着：中央操作は形を保って移動");scheduleMotionRender();return
  }
  return f16StartMovePrev(evt,p,n);
};
function f16UpdatePivotChain(g,p){
  const n=nodeById(g.nodeId),mid=nodeById(g.pivotId),other=nodeById(g.otherId);if(!n||!mid||!other)return;
  const last=g.points.at(-1);if(!last||dist(last.x,last.y,p.x,p.y)>=2/view.scale)g.points.push(p);
  const a=Math.atan2(p.y-mid.y,p.x-mid.x),delta=Math.atan2(Math.sin(a-g.startAngle),Math.cos(a-g.startAngle));
  n.x=mid.x+Math.cos(a)*g.pivotRadius;n.y=mid.y+Math.sin(a)*g.pivotRadius;
  const oa=g.otherStartAngle+delta*.58;other.x=mid.x+Math.cos(oa)*g.otherRadius;other.y=mid.y+Math.sin(oa)*g.otherRadius;
  const probe={compIds:g.compIds,nodeId:g.nodeId,f13CandidateIds:[g.nodeId],bypassPairs:new Set(),blockAttachUntilClear:false};const best=f13BestApproach(probe);g.contactPair=best?.metrics?.touch?best.pair:null;if(best)f13RenderContactPreview(best.pair.movedId,best.pair.otherId);else f13ClearContactPreview();scheduleMotionRender();
}
function f16UpdateRigid3(g,p){const last=g.points.at(-1);if(!last||dist(last.x,last.y,p.x,p.y)>=2/view.scale)g.points.push(p);const dx=p.x-g.start.x,dy=p.y-g.start.y;for(const id of g.compIds){const q=nodeById(id),s=g.starts[id];if(q&&s){q.x=s.x+dx;q.y=s.y+dy}}scheduleMotionRender()}
const f16PenMovePrev=penMove;
penMove=function(evt){if(gesture&&evt.pointerId===gesture.pointerId&&gesture.mode==="f16PivotChain"){evt.preventDefault();f16UpdatePivotChain(gesture,eventToWorld(evt));return}if(gesture&&evt.pointerId===gesture.pointerId&&gesture.mode==="f16Rigid3"){evt.preventDefault();f16UpdateRigid3(gesture,eventToWorld(evt));return}return f16PenMovePrev(evt)};
const f16PenEndPrev=penEnd;
penEnd=function(evt){
  if(gesture&&evt.pointerId===gesture.pointerId&&gesture.mode==="f16PivotChain"){
    evt.preventDefault();const g=gesture;if(g.contactPair)addAttachment(g.contactPair.movedId,g.contactPair.otherId,g.nodeId);f13ClearContactPreview();gesture=null;renderAll();commitHistory();statusText("3個接着の回転を確定");return
  }
  if(gesture&&evt.pointerId===gesture.pointerId&&gesture.mode==="f16Rigid3"){evt.preventDefault();gesture=null;renderAll();commitHistory();statusText("3個接着の移動を確定");return}
  return f16PenEndPrev(evt)
};

// Final wrappers keep hidden/z layers live during drag.
renderAll=function(){if(renderRAF){cancelAnimationFrame(renderRAF);renderRAF=0}shadowLayer.style.display="";overlapLayer.style.display="";hiddenLayer.style.display="";renderShadow();renderLinks(false);renderNodes();f15RenderZBoundaries();f16RenderHidden();renderUI()};
renderMotionNow=function(){shadowLayer.style.display="none";hiddenLayer.style.display="";renderLinks(true);renderNodes();f15RenderZBoundaries();f16RenderHidden();renderUI()};

window.__mochiFix16Test={
  rootPatch:f16RootPatch,budMetrics:f13ContactMetrics,budPath:f13BudPath,neckProfile:f13NeckProfile,decorate:f16DecorateNodeOverlap,
  renderHidden:f16RenderHidden,trueNodeOverlap:f16TrueNodeOverlap,threeChainInfo:f16ThreeChainInfo,nodeZ:f16NodeZ
};
statusText=function(t){status.innerHTML=`餅マップ v0.9.4<br>BUILD ${F16_BUILD}<br>${t}`};statusText("待機中");
