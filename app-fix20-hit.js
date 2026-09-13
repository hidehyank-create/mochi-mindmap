"use strict";
function f20HitsAt(x,y,pad=0){return[...sortedNodes()].reverse().filter(n=>dist(x,y,n.x,n.y)<=n.r+pad)}
let f20HitCycle={key:"",index:0,time:0};
function f20TopNode(x,y,pad=0){return f20HitsAt(x,y,pad)[0]||null}
function f20PickNode(x,y,pad=0){const hits=f20HitsAt(x,y,pad);if(!hits.length)return null;if(hits.length===1){f20HitCycle={key:hits[0].id,index:0,time:performance.now()};return hits[0]}const key=hits.map(n=>n.id).join("|");const now=performance.now();if(f20HitCycle.key===key&&now-f20HitCycle.time<1300)f20HitCycle.index=(f20HitCycle.index+1)%hits.length;else f20HitCycle.index=0;f20HitCycle.key=key;f20HitCycle.time=now;return hits[f20HitCycle.index]}
nearestNode=function(x,y){const n=f20TopNode(x,y,24/view.scale);return n?{node:n,d:dist(x,y,n.x,n.y)}:null};
targetAtWorld=function(p){const n=f20TopNode(p.x,p.y,18/view.scale);if(n)return{type:"node",id:n.id};const l=nearestLink(p.x,p.y,26/view.scale);if(l)return{type:"link",id:l.link.id};return null};
const f20PenDownPrev=penDown;
penDown=function(evt,allowTouch=false){if(gesture||(!allowTouch&&touches.size)||confirmDelete.style.display==="block")return;const p=eventToWorld(evt),pad=(evt.pointerType==="mouse"?32:12)/view.scale,hits=f20HitsAt(p.x,p.y,pad);if(hits.length>1){const picked=f20PickNode(p.x,p.y,pad);if(picked){evt.preventDefault();selected={type:"node",id:picked.id};const d=dist(p.x,p.y,picked.x,picked.y),moveFrac=evt.pointerType==="mouse"?.78:.70;if(d<=picked.r*moveFrac)startMoveGesture(evt,p,picked);else armHold("node",picked.id,evt,p);svg.setPointerCapture?.(evt.pointerId);return}}return f20PenDownPrev(evt,allowTouch)};
if(window.__mochiFix20Test){window.__mochiFix20Test.hitsAt=f20HitsAt;window.__mochiFix20Test.topNode=f20TopNode;window.__mochiFix20Test.pickNode=f20PickNode}
