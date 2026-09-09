"use strict";
// v0.9.4 FIX7 targeted interaction/render hotfixes.
// Loaded AFTER app-ui.js so selection-mode behavior can be safely overridden.

function _normAngle(a){while(a>Math.PI)a-=Math.PI*2;while(a<-Math.PI)a+=Math.PI*2;return a}
function _angleOnSweep(start,end,candidate){const d=_normAngle(end-start),dc=_normAngle(candidate-start);if(Math.abs(d)<1e-6)return false;return Math.sign(dc)===Math.sign(d)&&Math.abs(dc)<=Math.abs(d)+1e-5}
function _removeAttachmentBetween(a,b){for(let i=attachments.length-1;i>=0;i--){const m=attachments[i];if(pairKey(m.a,m.b)===pairKey(a,b))attachments.splice(i,1)}}
function _normalizeDeepCrossFor(n){for(const o of nodes){if(o.id===n.id)continue;const d=dist(n.x,n.y,o.x,o.y),penetration=n.r+o.r-d;if(crossPairs.has(pairKey(n.id,o.id))||penetration>ATTACH_OVERLAP+10){_removeAttachmentBetween(n.id,o.id);crossPairs.add(pairKey(n.id,o.id))}}}

// Selection mode: first touch selects. Once selected, touching the same object again
// returns to normal Pencil semantics (move / edge-hold resize / stretch).
toolSelect = function(evt){
  evt.preventDefault();
  const p=eventToWorld(evt),t=targetAtWorld(p);
  if(t&&selected&&t.type===selected.type&&t.id===selected.id){
    penDown(evt);
    return;
  }
  selected=t?{...t}:null;
  renderUI();
  statusText(t?"選択":"選択解除");
};

const _startMoveFix6=startMoveGesture;
startMoveGesture=function(evt,p,n){
  _normalizeDeepCrossFor(n);
  const crossPartners=[];
  for(const key of crossPairs){const[a,b]=key.split("|");if(a===n.id)crossPartners.push(b);else if(b===n.id)crossPartners.push(a)}
  if(crossPartners.length){
    for(const partner of crossPartners)_removeAttachmentBetween(n.id,partner);
    const comp=componentIds(n.id);
    if(comp.length===1){
      bringComponentFront([n.id]);
      gesture={pointerId:evt.pointerId,mode:"move",nodeId:n.id,compIds:[n.id],start:p,starts:{[n.id]:{x:n.x,y:n.y}},points:[p],contactPair:null,contactTimer:0,crossMode:false,inputType:evt.pointerType||"pen"};
      statusText("交差丸を単独移動");scheduleMotionRender();return;
    }
  }
  _startMoveFix6(evt,p,n);
  if(gesture?.mode==="pivot")gesture.lastPointerAngle=Math.atan2(p.y-nodeById(gesture.pivotId).y,p.x-nodeById(gesture.pivotId).x);
};

function _clearPivotTimer(g){if(g?.pivotContactTimer){clearTimeout(g.pivotContactTimer);g.pivotContactTimer=0}}
function _setPivotContact(g,pair){
  if(g.contactPair&&g.contactPair.movedId===pair.movedId&&g.contactPair.otherId===pair.otherId)return;
  _clearPivotTimer(g);g.contactPair=pair;g.crossMode=false;
  try{navigator.vibrate?.(12)}catch(_e){}
  g.pivotContactTimer=setTimeout(()=>{
    if(gesture!==g||g.mode!=="pivot"||!g.contactPair)return;
    g.crossMode=true;g.crossTargetId=g.contactPair.otherId;g.contactPair=null;g.pivotContactTimer=0;
    statusText("交差モード：そのまま押し込めます");renderUI();
  },CONTACT_HOLD_MS);
}

function _pivotCollision(g,n,pivot,fromAngle,toAngle){
  let best=null,bestArc=Infinity;
  for(const o of nodes){
    if(o.id===n.id||o.id===pivot.id||directAttached(n.id,o.id)||crossPairs.has(pairKey(n.id,o.id)))continue;
    const contactR=n.r+o.r-ATTACH_OVERLAP;
    for(const q of circleCircleIntersections(pivot,g.pivotRadius,o,contactR)){
      const a=Math.atan2(q.y-pivot.y,q.x-pivot.x);
      if(!_angleOnSweep(fromAngle,toAngle,a))continue;
      const arc=Math.abs(_normAngle(a-fromAngle));
      if(arc<bestArc){bestArc=arc;best={q,o}}
    }
  }
  return best;
}

updatePivotGesture=function(g,p){
  const n=nodeById(g.nodeId),pivot=nodeById(g.pivotId);if(!n||!pivot)return;
  const last=g.points.at(-1);if(!last||dist(last.x,last.y,p.x,p.y)>=2/view.scale)g.points.push(p);
  const desired=Math.atan2(p.y-pivot.y,p.x-pivot.x),prev=g.lastPointerAngle??Math.atan2(n.y-pivot.y,n.x-pivot.x);
  g.lastPointerAngle=desired;
  const raw={x:pivot.x+Math.cos(desired)*g.pivotRadius,y:pivot.y+Math.sin(desired)*g.pivotRadius};
  if(g.crossMode){n.x=raw.x;n.y=raw.y;cleanupCrossPairs();scheduleMotionRender();statusText("交差モード");return}
  if(g.contactPair){
    const hit=nodeById(g.contactPair.otherId),sep=hit?dist(raw.x,raw.y,hit.x,hit.y)-(n.r+hit.r-ATTACH_OVERLAP):0;
    if(sep>10/view.scale){_clearPivotTimer(g);g.contactPair=null;n.x=raw.x;n.y=raw.y;statusText("接着したまま回転")}
    scheduleMotionRender();return;
  }
  const hit=_pivotCollision(g,n,pivot,prev,desired);
  if(hit){n.x=hit.q.x;n.y=hit.q.y;_setPivotContact(g,{movedId:n.id,otherId:hit.o.id});statusText("接触中：離す＝くっつく / 1.0秒＝交差");renderUI()}
  else{n.x=raw.x;n.y=raw.y;statusText("接着したまま回転")}
  cleanupCrossPairs();scheduleMotionRender();
};

const _penEndFix6=penEnd;
penEnd=function(evt){
  if(!gesture||evt.pointerId!==gesture.pointerId||gesture.mode!=="pivot")return _penEndFix6(evt);
  evt.preventDefault();cancelHold();const g=gesture;_clearPivotTimer(g);
  if(movementLooksLikeXSlash(g)){restoreMoveStart(g);gesture=null;renderAll();if(acceptXStroke(g.points,g.inputType))renderAll();return}
  if(g.crossMode){
    for(const[a,b]of overlappingPairsBetween([g.nodeId])){_removeAttachmentBetween(a,b);crossPairs.add(pairKey(a,b))}
    statusText("丸の交差を確定：回転した丸が上");
  }else if(g.contactPair){addAttachment(g.contactPair.movedId,g.contactPair.otherId,g.nodeId);statusText("回転したまま接着")}
  else statusText("回転を確定");
  gesture=null;cleanupCrossPairs();renderAll();commitHistory();
};

// More precise quadratic Bezier crossing refinement.
function _refineQuadIntersection(a,b,ta,tb){
  let u=ta,v=tb;
  for(let k=0;k<8;k++){
    const pa=quadPoint(a,u),pb=quadPoint(b,v),fa={x:pa.x-pb.x,y:pa.y-pb.y},da=quadTangent(a,u),db=quadTangent(b,v),det=da.y*db.x-da.x*db.y;
    if(Math.abs(det)<1e-8)break;
    const du=(db.x*fa.y-fa.x*db.y)/det,dv=(da.x*fa.y-da.y*fa.x)/det;
    u=clamp(u-du,0,1);v=clamp(v-dv,0,1);
    if(Math.abs(du)+Math.abs(dv)<1e-7)break;
  }
  const p=quadPoint(a,u);return{t:u,s:v,x:p.x,y:p.y};
}
linkCrossings=function(upper,lower){
  const seeds=[],N=56;let pa=quadPoint(upper,0);
  for(let i=1;i<=N;i++){const qa=quadPoint(upper,i/N);let pb=quadPoint(lower,0);for(let j=1;j<=N;j++){const qb=quadPoint(lower,j/N),h=segmentIntersection(pa,qa,pb,qb);if(h)seeds.push({ta:((i-1)+(Number.isFinite(h.t)?h.t:.5))/N,tb:((j-1)+(Number.isFinite(h.u)?h.u:.5))/N});pb=qb}pa=qa}
  const out=[];for(const s of seeds){const r=_refineQuadIntersection(upper,lower,s.ta,s.tb);if(r.t<=.08||r.t>=.92||r.s<=.08||r.s>=.92||out.some(h=>dist(h.x,h.y,r.x,r.y)<7/view.scale))continue;const ta=quadTangent(upper,r.t),tb=quadTangent(lower,r.s),au=unit(ta.x,ta.y),bu=unit(tb.x,tb.y),sin=Math.abs(au.x*bu.y-au.y*bu.x);out.push({x:r.x,y:r.y,t:r.t,sin})}return out;
};

// Symmetric root-R overlay: keep both shoulders visually identical even after link editing.
const _renderLinksFix6=renderLinks;
renderLinks=function(fast=false){
  _renderLinksFix6(fast);
  if(fast)return;
  for(const l of [...links].sort((a,b)=>(a.seq??0)-(b.seq??0))){for(const rp of linkRootPaths(l))linksLayer.appendChild(sEl("path",{d:rp.d,fill:"#f0c867"}))}
};

const _renderUIFix6=renderUI;
renderUI=function(){
  _renderUIFix6();
  if(gesture?.mode==="pivot"&&gesture.contactPair&&!gesture.crossMode){
    const a=nodeById(gesture.contactPair.movedId),b=nodeById(gesture.contactPair.otherId);if(!a||!b)return;
    const u=unit(b.x-a.x,b.y-a.y),p={x:a.x+u.x*a.r,y:a.y+u.y*a.r},bounds=visibleWorldBounds(),w=224/view.scale,h=30/view.scale,x=clamp(p.x,bounds.left+w/2+8/view.scale,bounds.right-w/2-8/view.scale),y=clamp(p.y-44/view.scale,bounds.top+h/2+8/view.scale,bounds.bottom-h/2-8/view.scale),g=sEl("g");
    g.appendChild(sEl("rect",{x:x-w/2,y:y-h/2,width:w,height:h,rx:10/view.scale,class:"contact-hint-bg"}));const t=sEl("text",{x,y,class:"contact-hint","font-size":12/view.scale});t.textContent="離す＝くっつく　1.0秒＝交差";g.appendChild(t);uiLayer.appendChild(g)
  }
};

statusText=function(t){status.innerHTML=`餅マップ v0.9.4<br>BUILD 0909-FIX7<br>${t}`};
