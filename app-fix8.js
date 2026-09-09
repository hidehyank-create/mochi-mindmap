"use strict";
// v0.9.4 FIX8
// - crossing and attachment are mutually exclusive
// - PC context menu applies immediately to the point/object that opened it
// - one-shot toolbar modes auto-release after completion
// - provisional link tool for menu + toolbar
// - slightly wider Pencil stretch recognition

const linkBtn=document.getElementById("linkBtn");
const ctxLink=document.getElementById("ctxLink");
let freeLinkState=null;

function clearOneShotTool(){
  pcTool=null;
  for(const b of [selectBtn,eraseBtn,newBtn,linkBtn]) b?.classList.remove("active");
}

setPcTool=function(tool,force=false){
  pcTool=force?tool:(pcTool===tool?null:tool);
  for(const [b,t] of [[selectBtn,"select"],[eraseBtn,"erase"],[newBtn,"new"],[linkBtn,"link"]]) b?.classList.toggle("active",pcTool===t);
  statusText(pcTool==="erase"?"削除：対象を選択":pcTool==="new"?"新規丸：置く位置を選択":pcTool==="select"?"選択：対象を選択":pcTool==="link"?"紐付け：始点の丸を選択":"通常操作");
};

function makeNodeAt(p){
  const n={id:"n"+Date.now()+"_"+Math.floor(Math.random()*10000),x:p.x,y:p.y,r:DEFAULT_R,label:"新規"+(newNodeNo++),z:++zSeq,created:++createSeq};
  nodes.push(n);adoptExistingOverlapsAsCross([n.id]);selected={type:"node",id:n.id};renderAll();commitHistory();statusText("新しい丸");return n;
}

toolSelect=function(evt){evt.preventDefault();const p=eventToWorld(evt),t=targetAtWorld(p);selected=t?{...t}:null;renderUI();statusText(t?"選択":"選択解除");clearOneShotTool()};
toolNew=function(evt){evt.preventDefault();makeNodeAt(eventToWorld(evt));clearOneShotTool()};
toolErase=function(evt){
  evt.preventDefault();const p=eventToWorld(evt),input=evt.pointerType||"mouse",seam=nearestMergeContact(p.x,p.y,(input==="touch"?38:30)/view.scale);
  if(seam){detachMerge(seam.merge);clearOneShotTool();return}
  const n=nearestNode(p.x,p.y);if(n&&n.d<=n.node.r+(input==="touch"?22:16)/view.scale){requestDelete({type:"node",id:n.node.id});clearOneShotTool();return}
  const l=nearestLink(p.x,p.y,(input==="touch"?34:28)/view.scale);if(l){requestDelete({type:"link",id:l.link.id});clearOneShotTool();return}
  statusText("消しゴム：対象がありません");clearOneShotTool();
};

// Crossing means NOT attached. Keep this invariant even if an earlier path left stale attachment state.
function enforceCrossInvariant(){
  for(const key of crossPairs){
    const [a,b]=key.split("|");
    for(let i=attachments.length-1;i>=0;i--)if(pairKey(attachments[i].a,attachments[i].b)===pairKey(a,b))attachments.splice(i,1);
  }
}
const addAttachmentFix7=addAttachment;
addAttachment=function(a,b,newerId){if(crossPairs.has(pairKey(a,b)))return false;return addAttachmentFix7(a,b,newerId)};
const renderAllFix7=renderAll;
renderAll=function(){enforceCrossInvariant();renderAllFix7()};
const startMoveFix7b=startMoveGesture;
startMoveGesture=function(evt,p,n){enforceCrossInvariant();return startMoveFix7b(evt,p,n)};

// A crossed pair must never silently create a hose while still crossed.
const completeStretchFix7=completeStretchConnection;
completeStretchConnection=function(a,b){if(crossPairs.has(pairKey(a,b)))return false;return completeStretchFix7(a,b)};

// Slightly widen Pencil edge-to-stretch recognition while retaining the improved move response.
const penMoveFix7=penMove;
penMove=function(evt){
  if(!gesture||evt.pointerId!==gesture.pointerId||gesture.mode!=="nodePending")return penMoveFix7(evt);
  evt.preventDefault();const p=eventToWorld(evt);gesture.last=p;const pending=gesture,n=nodeById(pending.nodeId);if(!n)return;
  const m=dist(pending.start.x,pending.start.y,p.x,p.y),moveThreshold=(pending.inputType==="pen"?PEN_MOVE_THRESHOLD:MOVE_THRESHOLD)/view.scale;
  if(m<=moveThreshold)return;
  cancelHold();pending.moved=true;
  const radial=unit(pending.start.x-n.x,pending.start.y-n.y),mv=unit(p.x-pending.start.x,p.y-pending.start.y),outward=radial.x*mv.x+radial.y*mv.y,startFrac=dist(pending.start.x,pending.start.y,n.x,n.y)/Math.max(n.r,1);
  const stretchIntent=(startFrac>.78&&outward>.18)||(startFrac>.68&&outward>.42);
  if(stretchIntent){pending.mode="stretch";pending.lockId=null;pending.targetId=null;updateLiveSource(n,p);statusText("餅を伸ばす");return}
  startMoveGesture(evt,pending.start,n);if(gesture?.mode==="pivot")updatePivotGesture(gesture,p);else if(gesture?.mode==="move")updateMoveGesture(gesture,p);
};

function pointFromClient(x,y){const p=svg.createSVGPoint();p.x=x;p.y=y;const q=p.matrixTransform(svg.getScreenCTM().inverse());return svgToWorldPoint(q)}
function cancelFreeLink(msg="紐付けをキャンセル"){
  freeLinkState=null;clearLiveSource();cancelAnimationFrame(receiverRAF);receiverRAF=0;receiverState=null;renderReceiver();clearOneShotTool();renderUI();statusText(msg);
}
function connectFreeLink(targetId){
  if(!freeLinkState)return false;const sourceId=freeLinkState.sourceId;
  if(!targetId||targetId===sourceId||linkExists(sourceId,targetId)||crossPairs.has(pairKey(sourceId,targetId))){cancelFreeLink();return false}
  links.push({id:"l"+(linkSeq++),a:sourceId,b:targetId,control:null,seq:linkSeq});
  freeLinkState=null;clearLiveSource();cancelAnimationFrame(receiverRAF);receiverRAF=0;receiverState=null;renderReceiver();clearOneShotTool();renderAll();commitHistory();statusText("紐を接続");return true;
}
function beginFreeLink(sourceId,p){
  const source=nodeById(sourceId);if(!source){clearOneShotTool();return}
  freeLinkState={sourceId,lockId:null,last:p};setPcTool("link",true);selected={type:"node",id:sourceId};updateLiveSource(source,p);renderUI();statusText("紐付け：ポインタを動かす／空白クリックでキャンセル");
}
function updateFreeLink(p){
  if(!freeLinkState)return;const source=nodeById(freeLinkState.sourceId);if(!source){cancelFreeLink();return}freeLinkState.last=p;const width=updateLiveSource(source,p);const locked=updateTargetLock({nodeId:source.id,lockId:freeLinkState.lockId},p);
  // updateTargetLock mutates the lock object, so use a local compatible holder and retain the result target explicitly.
  let best=locked;
  if(!best){
    let bestGap=Infinity;for(const target of nodes){if(target.id===source.id||linkExists(source.id,target.id)||crossPairs.has(pairKey(source.id,target.id)))continue;const m=targetMetrics(source,target,p);if(m.angle<=RELEASE_ANGLE&&m.surfaceGap<=RELEASE_SURFACE&&m.surfaceGap<bestGap){bestGap=m.surfaceGap;best={target,...m}}}
  }
  if(!best){freeLinkState.lockId=null;retractReceiver();statusText("紐付け：ポインタを動かす／空白クリックでキャンセル");return}
  freeLinkState.lockId=best.target.id;const strength=clamp(1-best.surfaceGap/ACQUIRE_SURFACE,0,1);setReceiver(source.id,best.target.id,strength,width);const tip=receiverTipPoint(source,best.target,strength),touchD=(width+(receiverState?.width||width))/2,tipTouch=dist(p.x,p.y,tip.x,tip.y)<=touchD,directTouch=best.surfaceGap<=Math.max(6/view.scale,width*.55);
  statusText("紐付け：相手丸が迎えています");if(tipTouch||directTouch)connectFreeLink(best.target.id);
}

// Button mode: choose a source node, then hover the pointer; connection is automatic near a target.
bindControl(linkBtn,()=>setPcTool("link"));
svg.addEventListener("pointerdown",evt=>{
  if(pcTool!=="link")return;
  evt.preventDefault();evt.stopImmediatePropagation();const p=eventToWorld(evt),t=targetAtWorld(p);
  if(!freeLinkState){if(t?.type==="node")beginFreeLink(t.id,p);else clearOneShotTool();return}
  if(t?.type==="node"&&t.id!==freeLinkState.sourceId){connectFreeLink(t.id);return}
  cancelFreeLink();
},{capture:true,passive:false});
document.addEventListener("pointermove",evt=>{if(freeLinkState&&evt.pointerType!=="touch")updateFreeLink(pointFromClient(evt.clientX,evt.clientY))},{capture:true,passive:true});

// Context menu now targets the exact object/position where it was opened.
svg.addEventListener("contextmenu",evt=>{
  evt.preventDefault();evt.stopImmediatePropagation();if(freeLinkState)cancelFreeLink();contextPoint=eventToWorld(evt);contextTarget=targetAtWorld(contextPoint);
  contextMenu.style.left=Math.min(evt.clientX,window.innerWidth-180)+"px";contextMenu.style.top=Math.min(evt.clientY,window.innerHeight-190)+"px";contextMenu.style.display="block";
  ctxSelect.disabled=!contextTarget;ctxDelete.disabled=!contextTarget;ctxLink.disabled=contextTarget?.type!=="node";
},{capture:true});
function closeContextKeepTarget(){contextMenu.style.display="none"}
function interceptMenuButton(btn,fn){
  for(const type of ["pointerdown","pointerup","click"])btn.addEventListener(type,evt=>{evt.preventDefault();evt.stopImmediatePropagation();if(type==="pointerup")fn()},{capture:true});
}
interceptMenuButton(ctxSelect,()=>{if(contextTarget){selected={...contextTarget};renderUI();statusText("選択")}closeContextKeepTarget();clearOneShotTool()});
interceptMenuButton(ctxNew,()=>{if(contextPoint)makeNodeAt(contextPoint);closeContextKeepTarget();clearOneShotTool()});
interceptMenuButton(ctxDelete,()=>{if(contextTarget)requestDelete(contextTarget);closeContextKeepTarget();clearOneShotTool()});
interceptMenuButton(ctxLink,()=>{const t=contextTarget,p=contextPoint;closeContextKeepTarget();if(t?.type==="node"&&p)beginFreeLink(t.id,p);else clearOneShotTool()});

statusText=function(t){status.innerHTML=`餅マップ v0.9.4<br>BUILD 0909-FIX8<br>${t}`};
