"use strict";
(function installFix27(){
  if(!window.__mochiFix26Installed||!window.__mochiFix26Test){setTimeout(installFix27,25);return}
  if(window.__mochiFix27Installed)return;window.__mochiFix27Installed=true;
  const F27_BUILD="0915-FIX27B",F27_NEAR_DIFF=LINK_BASE_WIDTH/2;
  let resizeArmedId=null;
  const T26=window.__mochiFix26Test;

  function nearByHoseHalf(hits){if(hits.length<2)return false;let min=Infinity,max=-Infinity;for(const n of hits){min=Math.min(min,n.r);max=Math.max(max,n.r)}return max-min<=F27_NEAR_DIFF+.001}
  T26.ambiguous=function(hits){return nearByHoseHalf(hits)};

  const prevPenDown=penDown,prevPenMove=penMove,prevPenEnd=penEnd;
  function cap(id){try{svg.setPointerCapture?.(id)}catch(_){}}
  function workToolActive(){return [newBtn,linkBtn,detachBtn,eraseBtn].some(b=>b?.getAttribute("aria-pressed")==="true")}
  function nodeAtEvent(evt){const p=eventToWorld(evt),hs=T26.rawNodes(p);if(!hs.length)return null;if(resizeArmedId){const q=hs.find(n=>n.id===resizeArmedId);if(q)return q}return [...hs].sort((a,b)=>a.r-b.r||f24NodeZ(b)-f24NodeZ(a))[0]}
  function dblTargetAt(p){const hs=T26.rawNodes(p);if(!hs.length)return null;if(hs.length===1)return hs[0];return [...hs].sort((a,b)=>a.r-b.r||f24NodeZ(b)-f24NodeZ(a))[0]}
  function beginResize(evt,n,p){selected={type:"node",id:n.id};resizeArmedId=null;gesture={pointerId:evt.pointerId,mode:"resize",nodeId:n.id,start:p,last:p,startR:n.r,resizeStartDist:dist(n.x,n.y,p.x,p.y),inputType:evt.pointerType||"mouse"};cap(evt.pointerId);statusText("リサイズ：黄色表示／ドラッグで変更");renderUI()}
  function beginGroupPending(evt,n,p){const ids=componentIds(n.id);if(ids.length!==2)return false;const g={pointerId:evt.pointerId,mode:"f27GroupPending",nodeId:n.id,compIds:ids,start:p,last:p,points:[p],inputType:evt.pointerType||"pen",holdTimer:0};g.holdTimer=setTimeout(()=>{if(gesture!==g||g.mode!=="f27GroupPending")return;g.holdTimer=0;g.mode="move";g.f27GroupMove=true;g.starts={};for(const id of ids){const q=nodeById(id);if(q)g.starts[id]={x:q.x,y:q.y}}g.contactPair=null;g.contactTimer=0;g.crossMode=false;bringComponentFront(ids);statusText("2個グループ移動：くっついたまま移動");renderUI()},EDIT_HOLD_MS);gesture=g;cap(evt.pointerId);renderUI();return true}
  function suppressLegacyNodeResize(g){if(!g||g.mode!=="nodePending")return;if(g.holdTimer){clearTimeout(g.holdTimer);g.holdTimer=0}g.holdTimer=setTimeout(()=>{if(gesture!==g||g.mode!=="nodePending"||g.moved)return;g.holdTimer=0;const n=nodeById(g.nodeId);if(n)selected={type:"node",id:n.id};statusText("選択中：長押しではサイズ変更しません");renderUI()},EDIT_HOLD_MS)}
  function rigidGroupMove(g,p){const before={};for(const id of g.compIds){const n=nodeById(id);if(n)before[id]={x:n.x,y:n.y,r:n.r}}const v0=T26.violation(g.compIds),dx=p.x-g.start.x,dy=p.y-g.start.y,hit=collisionAlongMove(g.compIds,g.starts,dx,dy,g.crossMode),safeT=hit.pair?Math.max(0,hit.t-.002):1;setMovePositions(g,dx,dy,safeT);cleanupCrossPairs();if(T26.constrain(g.compIds,before,v0)){statusText("2個グループ移動：紐との隙間を保持")}else if(hit.pair&&!g.crossMode){setContact(g,hit.pair);statusText("2個グループ移動：接触中")}else{setContact(g,null);statusText("2個グループ移動：くっついたまま移動")}g.last=p;scheduleMotionRender()}

  penDown=function(evt,allowTouch=false){
    if(gesture||(!allowTouch&&touches.size)||confirmDelete.style.display==="block")return;
    if(workToolActive())return prevPenDown(evt,allowTouch);
    const p=eventToWorld(evt),hs=T26.rawNodes(p),n=nodeAtEvent(evt);
    if(resizeArmedId&&n&&n.id===resizeArmedId){evt.preventDefault();beginResize(evt,n,p);return}
    if(hs.length>1&&nearByHoseHalf(hs)&&!T26.pending?.()){evt.preventDefault();selected=null;f22ChoiceArmed=null;f24ArmedNode=null;f25ArmedNode=null;f22ShowChooser(hs,evt);return}
    if(n&&selected?.type==="node"&&selected.id===n.id&&componentIds(n.id).length===2){evt.preventDefault();if(beginGroupPending(evt,n,p))return}
    const r=prevPenDown(evt,allowTouch);suppressLegacyNodeResize(gesture);return r
  };
  penMove=function(evt){
    if(gesture?.mode==="f27GroupPending"&&evt.pointerId===gesture.pointerId){evt.preventDefault();const g=gesture,p=eventToWorld(evt);g.last=p;const th=(g.inputType==="pen"?PEN_MOVE_THRESHOLD:MOVE_THRESHOLD)/view.scale;if(dist(g.start.x,g.start.y,p.x,p.y)>th){if(g.holdTimer){clearTimeout(g.holdTimer);g.holdTimer=0}gesture=null;const n=nodeById(g.nodeId);if(n){startMoveGesture(evt,g.start,n);return prevPenMove(evt)}}return}
    if(gesture?.f27GroupMove&&gesture.mode==="move"&&evt.pointerId===gesture.pointerId){evt.preventDefault();rigidGroupMove(gesture,eventToWorld(evt));return}
    const g=gesture,ids=g&&(g.mode==="pivot"||g.mode==="move")?componentIds(g.nodeId):[];
    if(ids.length>1){const before=(()=>{const o={};for(const id of ids){const n=nodeById(id);if(n)o[id]={x:n.x,y:n.y,r:n.r}}return o})(),v0=T26.violation(ids),r=prevPenMove(evt);if(gesture&&T26.constrain(ids,before,v0)){scheduleMotionRender();statusText("接着グループ：紐との隙間を保持")};return r}
    return prevPenMove(evt)
  };
  penEnd=function(evt){if(gesture?.mode==="f27GroupPending"&&evt.pointerId===gesture.pointerId){evt.preventDefault();if(gesture.holdTimer)clearTimeout(gesture.holdTimer);gesture=null;renderUI();statusText("選択中");return}return prevPenEnd(evt)};

  svg.addEventListener("dblclick",evt=>{const p=eventToWorld(evt),n=dblTargetAt(p);if(!n)return;evt.preventDefault();evt.stopPropagation();selected={type:"node",id:n.id};resizeArmedId=n.id;gesture=null;statusText("リサイズモード：黄色／次のドラッグで変更");renderUI()},true);

  function outerRuns(a,b){const out=[];for(const n of[a,b]){const other=n===a?b:a;let cur=[];for(let i=0;i<=240;i++){const ang=-Math.PI+Math.PI*2*i/240,p={x:n.x+Math.cos(ang)*(n.r+9/view.scale),y:n.y+Math.sin(ang)*(n.r+9/view.scale)},outside=dist(p.x,p.y,other.x,other.y)>=other.r+7/view.scale;if(outside)cur.push(p);else if(cur.length){if(cur.length>1)out.push(f23Path(cur));cur=[]}}if(cur.length>1)out.push(f23Path(cur))}return out}
  const baseRenderUI=renderUI;
  renderUI=function(){baseRenderUI();if(resizeArmedId&&!gesture){const n=nodeById(resizeArmedId);if(n)uiLayer.appendChild(sEl("circle",{cx:n.x,cy:n.y,r:n.r+14/view.scale,class:"f27-resize-armed"}))}if(gesture?.f27GroupMove&&gesture.compIds?.length===2){const a=nodeById(gesture.compIds[0]),b=nodeById(gesture.compIds[1]);if(a&&b)for(const d of outerRuns(a,b))uiLayer.appendChild(sEl("path",{d,class:"f27-group-ring"}))}};

  const oldHiddenCircle=f25HiddenCircleRuns;
  f25HiddenCircleRuns=function(lower,upper){const d=dist(lower.x,lower.y,upper.x,upper.y);if(f24NodeZ(upper)>f24NodeZ(lower)&&d+lower.r<=upper.r+1.5)return[];return oldHiddenCircle(lower,upper)};
  if(window.__mochiFix25Outline)window.__mochiFix25Outline.hiddenCircleRuns=f25HiddenCircleRuns;

  window.__mochiFix27Test={nearByHoseHalf,nearDiff:F27_NEAR_DIFF,resizeArmed:()=>resizeArmedId,outerRuns,hiddenCircleRuns:f25HiddenCircleRuns,workToolActive,suppressLegacyNodeResize,dblTargetAt,rigidGroupMove};
  statusText=function(t){status.innerHTML=`餅マップ v0.9.4<br>BUILD ${F27_BUILD}<br>${t}`;f22PlaceStatus()};
  renderAll();statusText("待機中");
})();
