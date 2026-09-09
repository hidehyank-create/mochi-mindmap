"use strict";
// v0.9.4 FIX9
// - trackpad wheel/pinch keeps working over fixed UI overlays
// - delete confirmation moved away from bottom controls
// - overlapping nodes in the same attachment component still show hidden dashed outlines unless directly attached
// - resizing over another member never creates a new attachment automatically
// - attached clusters of 3+ prefer inner nodes for selection; inner node drag moves the whole component

// Keep confirmation messages readable above the toolbar/help overlays.
Object.assign(confirmDelete.style,{
  top:"calc(74px + env(safe-area-inset-top))",
  bottom:"auto",
  zIndex:"10060"
});

function _applyCanvasWheel(evt){
  const p=clientToSvg(evt);
  if(evt.ctrlKey){
    const anchor=svgToWorldPoint(p),factor=Math.exp(-evt.deltaY*.006),s=clamp(view.scale*factor,VIEW_MIN,VIEW_MAX);
    view.scale=s;view.x=p.x-anchor.x*s;view.y=p.y-anchor.y*s;applyView();renderUI();statusText(`ズーム ${Math.round(s*100)}%`);
  }else{
    const m=svg.getScreenCTM(),sx=Math.abs(m?.a)||1,sy=Math.abs(m?.d)||1;
    view.x-=evt.deltaX/sx;view.y-=evt.deltaY/sy;applyView();renderUI();statusText("パン");
  }
}
// app-core handles wheel events whose target is inside the SVG. This covers the fixed controls/help/status/dialog area.
document.addEventListener("wheel",evt=>{
  if(svg.contains(evt.target))return;
  evt.preventDefault();
  _applyCanvasWheel(evt);
},{capture:true,passive:false});

function _attachmentDegree(id){return directAttachmentsOf(id).length}
function _clusterAwareNodeHit(p){
  const hidden=hiddenNodeHit(p.x,p.y);
  if(hidden)return hidden;
  const candidates=[];
  for(const n of nodes){
    const d=dist(p.x,p.y,n.x,n.y);
    if(d<=n.r+18/view.scale)candidates.push({n,d,comp:componentIds(n.id).length,deg:_attachmentDegree(n.id)});
  }
  if(!candidates.length)return null;
  const inner=candidates.filter(c=>c.comp>=3&&c.deg>=2);
  const pool=inner.length?inner:candidates;
  pool.sort((a,b)=>{
    const da=a.d/Math.max(a.n.r,1),db=b.d/Math.max(b.n.r,1);
    if(Math.abs(da-db)>.04)return da-db;
    if(a.deg!==b.deg)return b.deg-a.deg;
    return (b.n.z??0)-(a.n.z??0);
  });
  return pool[0].n;
}

targetAtWorld=function(p){
  const n=_clusterAwareNodeHit(p);if(n)return{type:"node",id:n.id};
  const l=nearestLink(p.x,p.y,26/view.scale);if(l)return{type:"link",id:l.link.id};
  return null;
};

// Once an inner member of a 3+ attachment cluster is selected, touching it again moves the whole component.
svg.addEventListener("pointerdown",evt=>{
  if(evt.pointerType==="touch"||gesture||pcTool||!selected||selected.type!=="node")return;
  const n=nodeById(selected.id);if(!n)return;
  const comp=componentIds(n.id);if(comp.length<3||_attachmentDegree(n.id)<2)return;
  const p=eventToWorld(evt);if(dist(p.x,p.y,n.x,n.y)>n.r+14/view.scale)return;
  evt.preventDefault();evt.stopImmediatePropagation();
  startMoveGesture(evt,p,n);svg.setPointerCapture?.(evt.pointerId);
},{capture:true,passive:false});

// Resize is never a new attachment gesture. Any newly overlapped, non-direct neighbor is a crossing.
addSideAttachmentsWithinComponent=function(nodeId){
  const n=nodeById(nodeId);if(!n)return;
  for(const o of nodes){
    if(o.id===n.id||directAttached(n.id,o.id))continue;
    if(dist(n.x,n.y,o.x,o.y)<n.r+o.r-1)crossPairs.add(pairKey(n.id,o.id));
  }
  enforceCrossInvariant();
};

// Same connected component does NOT mean the two circles are directly attached.
// Dashed hidden outlines are suppressed only for directly attached circle pairs.
renderHidden=function(){
  hiddenLayer.replaceChildren();const arr=sortedNodes();
  for(let i=0;i<arr.length;i++){
    const lower=arr[i];let fullCover=null;const arcs=[];
    for(let j=i+1;j<arr.length;j++){
      const upper=arr[j];if(directAttached(lower.id,upper.id))continue;
      const arc=circleCoveredArc(lower,upper);if(!arc)continue;
      if(arc.full){fullCover=upper;break}arcs.push(arc.d);
    }
    if(fullCover){
      const d=hiddenCircleWithLinkGaps(lower);if(d)hiddenLayer.appendChild(sEl("path",{d,class:"hidden-outline"}));
      for(const l of links){if(l.a!==lower.id&&l.b!==lower.id)continue;for(const d2 of hiddenLinkEdges(l,fullCover))hiddenLayer.appendChild(sEl("path",{d:d2,class:"hidden-outline"}))}
    }else for(const d of arcs)hiddenLayer.appendChild(sEl("path",{d,class:"hidden-outline"}));
  }
  for(const cover of arr){
    for(const l of links){
      if(l.a===cover.id||l.b===cover.id)continue;
      for(const d of hiddenLinkEdges(l,cover))hiddenLayer.appendChild(sEl("path",{d,class:"hidden-outline"}));
    }
  }
};

statusText=function(t){status.innerHTML=`餅マップ v0.9.4<br>BUILD 0909-FIX9<br>${t}`};
