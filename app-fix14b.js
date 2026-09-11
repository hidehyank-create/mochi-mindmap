"use strict";
// FIX14b: Pencil object priority, ring closure, and smooth hose roots.

function f14AttachDegree(id){let d=0;for(const m of attachments)if(m.a===id||m.b===id)d++;return d}

// Same-component contact is normally ignored, except two free ends of a 3+ bead chain.
f13BestApproach=function(g){
  if(!g||g.blockAttachUntilClear)return null;
  const ids=g.compIds||[g.nodeId],set=new Set(ids),skip=g.bypassPairs||new Set(),candidates=g.f13CandidateIds||[g.nodeId];let best=null,bestScore=Infinity;
  for(const id of candidates){const a=nodeById(id);if(!a)continue;for(const b of nodes){
    if(id===b.id||directAttached(id,b.id)||skip.has(pairKey(id,b.id)))continue;
    const inSame=set.has(b.id),ringEnd=inSame&&ids.length>=3&&f14AttachDegree(id)===1&&f14AttachDegree(b.id)===1;
    if(inSame&&!ringEnd)continue;
    const m=f13ContactMetrics(a,b);if(!m.visible)continue;const score=Math.max(0,m.gap)+Math.abs(m.gap)*.02;
    if(score<bestScore){bestScore=score;best={pair:{movedId:id,otherId:b.id},metrics:m,ringEnd}}
  }}return best;
};

// Pencil/touch on a circle always means circle interaction first. This prevents a tiny slip near a seam
// from becoming an ink/cut stroke. Mouse behavior is left unchanged.
const f14PenDownPrev=penDown;
penDown=function(evt,allowTouch=false){
  if(evt.pointerType==="mouse"||firstXStroke)return f14PenDownPrev(evt,allowTouch);
  if(gesture||(!allowTouch&&touches.size)||confirmDelete.style.display==="block")return;
  const p=eventToWorld(evt),hidden=hiddenOutlineHit(p.x,p.y);if(hidden)return f14PenDownPrev(evt,allowTouch);
  const near=nearestNode(p.x,p.y);
  if(near&&near.d<=near.node.r+16/view.scale){
    evt.preventDefault();const n=near.node;selected={type:"node",id:n.id};
    const moveFrac=.72;if(near.d<=n.r*moveFrac)startMoveGesture(evt,p,n);else armHold("node",n.id,evt,p);
    svg.setPointerCapture?.(evt.pointerId);return;
  }
  return f14PenDownPrev(evt,allowTouch);
};

// Keep root R tangent to the actual hose direction and remove the small angular spur seen after link edits.
curvedRootPatchPath=function(l,fromA){
  const n=nodeById(fromA?l.a:l.b),w=linkWidth(l);if(!n)return null;
  const t=fromA?.035:.965;let tg=quadTangent(l,t);if(!fromA)tg={x:-tg.x,y:-tg.y};
  return rootPatchPath(n,tg,w,1);
};
linkRootPaths=function(l){return[{d:curvedRootPatchPath(l,true)},{d:curvedRootPatchPath(l,false)}].filter(x=>x.d)};

if(window.__mochiFix14Test){window.__mochiFix14Test.attachDegree=f14AttachDegree;window.__mochiFix14Test.bestApproach=f13BestApproach}
