"use strict";
(function installFix27G(){
  if(!window.__mochiFix27FInstalled||!window.__mochiFix27Test){setTimeout(installFix27G,25);return}
  if(window.__mochiFix27GInstalled)return;window.__mochiFix27GInstalled=true;
  const F27G_BUILD="0916-FIX27G";

  function pointInOwnOpening(n,lowerLink,p){
    for(const own of links){
      if(own.id===lowerLink.id)continue;
      if(own.a!==n.id&&own.b!==n.id)continue;
      if(f25PointInLinkShape(own,p,2.25))return true;
    }
    return false;
  }
  function filteredNodeLinkSepRuns(n,l){
    return f14CircleArcRuns(n,p=>f25PointInLinkShape(l,p,.5)&&!pointInOwnOpening(n,l,p),360);
  }

  // Rebuild only the solid node-over-link separators.  FIX27F tried to paint
  // over the unwanted segment afterwards; here the segment is not generated
  // in the first place.  Hidden/dashed outlines are untouched.
  const prevRenderBoundaries=f25RenderBoundaries;
  f25RenderBoundaries=function(){
    prevRenderBoundaries();
    overlapLayer.querySelectorAll('[data-z-boundary="f25-node-link-sep"],[data-f27f-root-gap-mask="1"]').forEach(e=>e.remove());
    for(const l of links){
      for(const n of nodes){
        if(n.id===l.a||n.id===l.b||f25LinkAboveNode(l,n))continue;
        for(const d of filteredNodeLinkSepRuns(n,l))overlapLayer.appendChild(sEl("path",{
          d,fill:"none",stroke:F25_SEP,"stroke-width":F25_SEP_W,
          "stroke-linecap":"round","stroke-linejoin":"round",
          "data-z-boundary":"f25-node-link-sep","data-upper":n.id,"data-lower":l.id,
          "data-f27g-filtered":"1"
        }));
      }
    }
  };
  f18RenderZBoundaries=f25RenderBoundaries;f15RenderZBoundaries=f25RenderBoundaries;renderOverlapEdges=f25RenderBoundaries;
  if(window.__mochiFix25Render)window.__mochiFix25Render.renderBoundaries=f25RenderBoundaries;
  if(window.__mochiFix25Test)window.__mochiFix25Test.renderBoundaries=f25RenderBoundaries;

  // The receiver (迎え紐) now uses the same fully-developed root-R profile as
  // the pulled/source hose.  Only the receiver extension length still follows
  // its approach strength; root size/curvature no longer shrinks with it.
  renderReceiver=function(){
    let g=liveLayer.querySelector("#receiverShape");
    if(!receiverState||receiverState.strength<=.01){g?.remove();return}
    const n=nodeById(receiverState.targetId),s=nodeById(receiverState.sourceId);if(!n||!s){g?.remove();return}
    if(!g){g=sEl("g",{id:"receiverShape"});liveLayer.appendChild(g)}
    const u=unit(s.x-n.x,s.y-n.y),ext=RECEIVER_MAX_EXTEND*clamp(receiverState.strength,0,1),width=receiverState.width||LINK_BASE_WIDTH;
    const tip={x:n.x+u.x*(n.r+ext),y:n.y+u.y*(n.r+ext)};
    const rootD=rootPatchPath(n,{x:u.x,y:u.y},width,1);
    const body=sEl("path",{d:`M ${n.x} ${n.y} L ${tip.x} ${tip.y}`,class:"link-body","stroke-width":width});
    const cap=sEl("circle",{cx:tip.x,cy:tip.y,r:width/2,class:"live-tip"}),els=[];
    if(rootD)els.push(sEl("path",{d:rootD,fill:"#f0c867","data-f27g-receiver-root":"1"}));
    els.push(body,cap);g.replaceChildren(...els);
  };

  window.__mochiFix27GTest={pointInOwnOpening,filteredNodeLinkSepRuns,receiverRootProgress:1};
  statusText=function(t){status.innerHTML=`餅マップ v0.9.4<br>BUILD ${F27G_BUILD}<br>${t}`;f22PlaceStatus()};
  renderAll();statusText("待機中");
})();
