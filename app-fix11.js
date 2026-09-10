"use strict";
// v0.9.4 FIX11
// Circle/circle overlap is geometry-only. No persistent crossing state.
// Contact/release still attaches; pushing farther through simply overlaps without attachment.

const F11_OVERLAP_PUSH=14;
const F11_CONTACT_RELEASE=8;

function f11AttachmentDegree(id){return directAttachmentsOf(id).length}
function f11ComponentDegree(id,ids){const set=new Set(ids);let d=0;for(const m of attachments){if(m.a===id&&set.has(m.b))d++;else if(m.b===id&&set.has(m.a))d++}return d}
function f11InitialBypass(ids,starts){
  const set=new Set(ids),out=new Set();
  for(const id of ids){const n=nodeById(id),s=starts[id];if(!n||!s)continue;for(const o of nodes){if(set.has(o.id))continue;if(dist(s.x,s.y,o.x,o.y)<n.r+o.r-1)out.add(pairKey(id,o.id))}}
  return out;
}
function f11StartState(ids){const starts={};for(const id of ids){const q=nodeById(id);if(q)starts[id]={x:q.x,y:q.y}}return starts}

// Persistent crossPairs is retired. Old history entries are normalized on render/restore.
adoptExistingOverlapsAsCross=function(){crossPairs.clear()};
cleanupCrossPairs=function(){crossPairs.clear()};
enforceCrossInvariant=function(){crossPairs.clear()};
addSideAttachmentsWithinComponent=function(){crossPairs.clear()};
crossPairs.clear();

startMoveGesture=function(evt,p,n){
  crossPairs.clear();
  const seams=directAttachmentsOf(n.id),component=componentIds(n.id),centerGrab=dist(p.x,p.y,n.x,n.y)<=n.r*.43;
  const componentDegree=f11ComponentDegree(n.id,component);
  const wholeCluster=component.length>=3&&componentDegree>=2;
  const wholePair=component.length===2&&centerGrab;
  if(seams.length===1&&!wholeCluster&&!wholePair){
    const m=seams[0],pivotId=m.a===n.id?m.b:m.a,pivot=nodeById(pivotId);
    if(pivot){
      bringComponentFront([n.id]);
      const starts={[n.id]:{x:n.x,y:n.y}};
      gesture={pointerId:evt.pointerId,mode:"pivot",nodeId:n.id,pivotId,compIds:[n.id],start:p,starts,points:[p],pivotRadius:dist(n.x,n.y,pivot.x,pivot.y),contactPair:null,inputType:evt.pointerType||"pen",bypassPairs:f11InitialBypass([n.id],starts),lastPointerAngle:Math.atan2(p.y-pivot.y,p.x-pivot.x)};
      statusText("接着したまま回転");scheduleMotionRender();return;
    }
  }
  const ids=component;bringComponentFront(ids);const starts=f11StartState(ids);
  gesture={pointerId:evt.pointerId,mode:"move",nodeId:n.id,compIds:ids,start:p,starts,points:[p],contactPair:null,contactTimer:0,crossMode:false,inputType:evt.pointerType||"pen",bypassPairs:f11InitialBypass(ids,starts)};
  statusText(ids.length>1?`接着グループ移動（${ids.length}個）`:"丸移動");scheduleMotionRender();
};

function f11CollisionAlongMove(g,dx,dy){
  const set=new Set(g.compIds),skip=g.bypassPairs||new Set();let bestT=1,bestPair=null;
  for(const id of g.compIds){const s=g.starts[id],n=nodeById(id);if(!s||!n)continue;for(const o of nodes){
    if(set.has(o.id)||skip.has(pairKey(id,o.id)))continue;
    const R=n.r+o.r,p0x=s.x-o.x,p0y=s.y-o.y,a=dx*dx+dy*dy;if(a<1e-8)continue;
    const c=p0x*p0x+p0y*p0y-R*R;if(c<=0){continue}
    const b=2*(p0x*dx+p0y*dy),disc=b*b-4*a*c;if(disc<0)continue;
    const sq=Math.sqrt(disc),t1=(-b-sq)/(2*a),t2=(-b+sq)/(2*a),t=t1>=0&&t1<=1?t1:(t2>=0&&t2<=1?t2:null);
    if(t!==null&&t<bestT){bestT=t;bestPair={movedId:id,otherId:o.id}}
  }}
  return{t:bestT,pair:bestPair};
}
function f11RawPenetration(g,pair,dx,dy,attachOverlap=0){
  if(!pair)return-Infinity;const s=g.starts[pair.movedId],n=nodeById(pair.movedId),o=nodeById(pair.otherId);if(!s||!n||!o)return-Infinity;
  return n.r+o.r-attachOverlap-dist(s.x+dx,s.y+dy,o.x,o.y);
}
function f11SetContactPosition(g,dx,dy,hit){const safeT=hit.pair?Math.max(0,hit.t-.001):1;setMovePositions(g,dx,dy,safeT)}

updateMoveGesture=function(g,p){
  const last=g.points.at(-1);if(!last||dist(last.x,last.y,p.x,p.y)>=2/view.scale)g.points.push(p);
  const dx=p.x-g.start.x,dy=p.y-g.start.y,push=F11_OVERLAP_PUSH/view.scale,release=F11_CONTACT_RELEASE/view.scale;
  if(g.contactPair){
    const pen=f11RawPenetration(g,g.contactPair,dx,dy,0);
    if(pen>push){g.bypassPairs.add(pairKey(g.contactPair.movedId,g.contactPair.otherId));g.contactPair=null;setMovePositions(g,dx,dy,1);statusText("丸を重ねています（接着なし）");scheduleMotionRender();return}
    if(pen<-release){g.contactPair=null;setMovePositions(g,dx,dy,1);statusText("丸移動");scheduleMotionRender();return}
    const h=f11CollisionAlongMove(g,dx,dy);if(h.pair)f11SetContactPosition(g,dx,dy,h);statusText("接触中：離す＝くっつく / 押し込む＝重ねる");renderUI();scheduleMotionRender();return;
  }
  const hit=f11CollisionAlongMove(g,dx,dy);
  if(hit.pair){
    const pen=f11RawPenetration(g,hit.pair,dx,dy,0);
    if(pen>push){g.bypassPairs.add(pairKey(hit.pair.movedId,hit.pair.otherId));setMovePositions(g,dx,dy,1);statusText("丸を重ねています（接着なし）")}
    else{g.contactPair=hit.pair;f11SetContactPosition(g,dx,dy,hit);statusText("接触中：離す＝くっつく / 押し込む＝重ねる");renderUI()}
  }else{setMovePositions(g,dx,dy,1);statusText("丸移動")}
  crossPairs.clear();scheduleMotionRender();
};

function f11AngleNorm(a){while(a>Math.PI)a-=Math.PI*2;while(a<-Math.PI)a+=Math.PI*2;return a}
function f11AngleOnSweep(start,end,candidate){const d=f11AngleNorm(end-start),dc=f11AngleNorm(candidate-start);if(Math.abs(d)<1e-6)return false;return Math.sign(dc)===Math.sign(d)&&Math.abs(dc)<=Math.abs(d)+1e-5}
function f11PivotCollision(g,n,pivot,fromAngle,toAngle){
  let best=null,bestArc=Infinity;const skip=g.bypassPairs||new Set();
  for(const o of nodes){
    if(o.id===n.id||o.id===pivot.id||directAttached(n.id,o.id)||skip.has(pairKey(n.id,o.id)))continue;
    const contactR=n.r+o.r-ATTACH_OVERLAP;
    for(const q of circleCircleIntersections(pivot,g.pivotRadius,o,contactR)){
      const a=Math.atan2(q.y-pivot.y,q.x-pivot.x);if(!f11AngleOnSweep(fromAngle,toAngle,a))continue;
      const arc=Math.abs(f11AngleNorm(a-fromAngle));if(arc<bestArc){bestArc=arc;best={q,o}}
    }
  }
  return best;
}
updatePivotGesture=function(g,p){
  const n=nodeById(g.nodeId),pivot=nodeById(g.pivotId);if(!n||!pivot)return;
  const last=g.points.at(-1);if(!last||dist(last.x,last.y,p.x,p.y)>=2/view.scale)g.points.push(p);
  const desired=Math.atan2(p.y-pivot.y,p.x-pivot.x),prev=g.lastPointerAngle??Math.atan2(n.y-pivot.y,n.x-pivot.x),raw={x:pivot.x+Math.cos(desired)*g.pivotRadius,y:pivot.y+Math.sin(desired)*g.pivotRadius},push=F11_OVERLAP_PUSH/view.scale,release=F11_CONTACT_RELEASE/view.scale;
  g.lastPointerAngle=desired;
  if(g.contactPair){const o=nodeById(g.contactPair.otherId),pen=o?n.r+o.r-ATTACH_OVERLAP-dist(raw.x,raw.y,o.x,o.y):-Infinity;
    if(pen>push){g.bypassPairs.add(pairKey(n.id,g.contactPair.otherId));g.contactPair=null;n.x=raw.x;n.y=raw.y;statusText("丸を重ねています（接着なし）");scheduleMotionRender();return}
    if(pen<-release){g.contactPair=null;n.x=raw.x;n.y=raw.y;statusText("接着したまま回転");scheduleMotionRender();return}
    statusText("接触中：離す＝くっつく / 押し込む＝重ねる");renderUI();scheduleMotionRender();return;
  }
  const hit=f11PivotCollision(g,n,pivot,prev,desired);
  if(hit){const pen=n.r+hit.o.r-ATTACH_OVERLAP-dist(raw.x,raw.y,hit.o.x,hit.o.y);if(pen>push){g.bypassPairs.add(pairKey(n.id,hit.o.id));n.x=raw.x;n.y=raw.y;statusText("丸を重ねています（接着なし）")}else{n.x=hit.q.x;n.y=hit.q.y;g.contactPair={movedId:n.id,otherId:hit.o.id};statusText("接触中：離す＝くっつく / 押し込む＝重ねる");renderUI()}}
  else{n.x=raw.x;n.y=raw.y;statusText("接着したまま回転")}
  crossPairs.clear();scheduleMotionRender();
};

const f11PenEndPrevious=penEnd;
penEnd=function(evt){
  if(!gesture||evt.pointerId!==gesture.pointerId)return;
  if(gesture.mode==="move"){
    evt.preventDefault();cancelHold();const g=gesture;clearContactTimer(g);
    if(movementLooksLikeXSlash(g)){restoreMoveStart(g);gesture=null;renderAll();if(acceptXStroke(g.points,g.inputType))renderAll();return}
    if(g.contactPair)attachAtContact(g,g.contactPair);else statusText("丸移動を確定（重なりは接着なし）");
    gesture=null;crossPairs.clear();renderAll();commitHistory();return;
  }
  if(gesture.mode==="pivot"){
    evt.preventDefault();cancelHold();const g=gesture;if(g.pivotContactTimer){clearTimeout(g.pivotContactTimer);g.pivotContactTimer=0}
    if(movementLooksLikeXSlash(g)){restoreMoveStart(g);gesture=null;renderAll();if(acceptXStroke(g.points,g.inputType))renderAll();return}
    if(g.contactPair){addAttachment(g.contactPair.movedId,g.contactPair.otherId,g.nodeId);statusText("回転したまま接着")}else statusText("回転を確定（重なりは接着なし）");
    gesture=null;crossPairs.clear();renderAll();commitHistory();return;
  }
  return f11PenEndPrevious(evt);
};

// Keep the hidden geometry visible while a circle is moving over other circles.
renderMotionNow=function(){
  shadowLayer.style.display="none";overlapLayer.style.display="none";hiddenLayer.style.display="";
  renderLinks(true);renderNodesFast();renderHidden();renderUI();
};

const f11RenderUIPrevious=renderUI;
renderUI=function(){f11RenderUIPrevious();for(const t of uiLayer.querySelectorAll(".contact-hint"))t.textContent="離す＝くっつく　押し込む＝重ねる"};

window.__mochiFix11Test={
  initialBypass:f11InitialBypass,collisionAlongMove:f11CollisionAlongMove,rawPenetration:f11RawPenetration,
  attachmentDegree:f11AttachmentDegree,componentDegree:f11ComponentDegree
};

statusText=function(t){status.innerHTML=`餅マップ v0.9.4<br>BUILD 0911-FIX11<br>${t}`};
statusText("待機中");
