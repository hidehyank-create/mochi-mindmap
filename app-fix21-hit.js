"use strict";
function f21HitsAt(x,y,pad=0){return[...sortedNodes()].reverse().filter(n=>dist(x,y,n.x,n.y)<=n.r+pad)}
function f21TopAt(x,y,pad=0){return f21HitsAt(x,y,pad)[0]||null}
function f21CycleChoice(hits){if(!hits.length)return null;if(selected?.type==="node"){const i=hits.findIndex(n=>n.id===selected.id);if(i>=0)return hits[(i+1)%hits.length]}return hits[0]}
function f21DragChoice(hits){if(!hits.length)return null;if(selected?.type==="node"){const n=hits.find(x=>x.id===selected.id);if(n)return n}return hits[0]}
nearestNode=function(x,y){const n=f21TopAt(x,y,24/view.scale);return n?{node:n,d:dist(x,y,n.x,n.y)}:null};
targetAtWorld=function(p){const n=f21TopAt(p.x,p.y,18/view.scale);if(n)return{type:"node",id:n.id};const l=nearestLink(p.x,p.y,26/view.scale);if(l)return{type:"link",id:l.link.id};return null};

const f21PenDownPrev=penDown,f21PenMovePrev=penMove,f21PenEndPrev=penEnd;
penDown=function(evt,allowTouch=false){
  if(gesture||(!allowTouch&&touches.size)||confirmDelete.style.display==="block")return;
  const p=eventToWorld(evt),pad=(evt.pointerType==="mouse"?32:12)/view.scale,hits=f21HitsAt(p.x,p.y,pad);
  if(hits.length>1){const preferred=f21DragChoice(hits),d=preferred?dist(p.x,p.y,preferred.x,preferred.y):Infinity,moveFrac=evt.pointerType==="mouse"?.78:.70;if(preferred&&d<=preferred.r*moveFrac){
    evt.preventDefault();gesture={pointerId:evt.pointerId,mode:"f21OverlapPending",start:p,last:p,hits:hits.map(n=>n.id),preferredId:preferred.id,inputType:evt.pointerType||"pen"};svg.setPointerCapture?.(evt.pointerId);statusText("重なり：タップで上下選択／ドラッグで選択中の丸を移動");return;
  }}
  return f21PenDownPrev(evt,allowTouch);
};
penMove=function(evt){
  if(!gesture||gesture.pointerId!==evt.pointerId||gesture.mode!=="f21OverlapPending")return f21PenMovePrev(evt);
  evt.preventDefault();const g=gesture,p=eventToWorld(evt);g.last=p;const threshold=(g.inputType==="pen"?PEN_MOVE_THRESHOLD:MOVE_THRESHOLD)/view.scale;if(dist(g.start.x,g.start.y,p.x,p.y)<=threshold)return;
  const hits=g.hits.map(nodeById).filter(Boolean),n=hits.find(x=>x.id===g.preferredId)||hits[0];gesture=null;if(!n)return;selected={type:"node",id:n.id};startMoveGesture(evt,g.start,n);return f21PenMovePrev(evt);
};
penEnd=function(evt){
  if(!gesture||gesture.pointerId!==evt.pointerId||gesture.mode!=="f21OverlapPending")return f21PenEndPrev(evt);
  evt.preventDefault();const g=gesture,hits=g.hits.map(nodeById).filter(Boolean),pick=f21CycleChoice(hits);gesture=null;if(pick){selected={type:"node",id:pick.id};renderAll();statusText(`重なり選択：${pick.label||pick.id}`)}else renderAll();
};
if(window.__mochiFix21Test){window.__mochiFix21Test.hitsAt=f21HitsAt;window.__mochiFix21Test.topAt=f21TopAt;window.__mochiFix21Test.cycleChoice=f21CycleChoice;window.__mochiFix21Test.dragChoice=f21DragChoice}
