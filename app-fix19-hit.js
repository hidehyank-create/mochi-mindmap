"use strict";
function f19TopNodeAt(x,y,pad=0){for(const n of [...sortedNodes()].reverse()){const d=dist(x,y,n.x,n.y);if(d<=n.r+pad)return{node:n,d}}return null}
nearestNode=function(x,y){return f19TopNodeAt(x,y,24/view.scale)};
const f19TargetAtWorldPrev=targetAtWorld;
targetAtWorld=function(p){const top=f19TopNodeAt(p.x,p.y,18/view.scale);if(top)return{type:"node",id:top.node.id};return f19TargetAtWorldPrev(p)};
const f19PenDownPrev=penDown;
penDown=function(evt,allowTouch=false){
  if(gesture||(!allowTouch&&touches.size)||confirmDelete.style.display==="block")return;
  const p=eventToWorld(evt),pad=(evt.pointerType==="mouse"?32:12)/view.scale,hits=[...sortedNodes()].reverse().filter(n=>dist(p.x,p.y,n.x,n.y)<=n.r+pad);
  if(hits.length>1){const top=hits[0],external=hits.some(n=>n.id!==top.id&&!sameComponent(n.id,top.id));if(external){evt.preventDefault();selected={type:"node",id:top.id};const d=dist(p.x,p.y,top.x,top.y),moveFrac=evt.pointerType==="mouse"?.78:.70;if(d<=top.r*moveFrac)startMoveGesture(evt,p,top);else armHold("node",top.id,evt,p);svg.setPointerCapture?.(evt.pointerId);return}}
  return f19PenDownPrev(evt,allowTouch)
};
if(window.__mochiFix19Test)window.__mochiFix19Test.topNodeAt=f19TopNodeAt;
