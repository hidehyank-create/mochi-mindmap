"use strict";
(function installFix27I(){
  if(!window.__mochiFix27HInstalled||!window.__mochiFix27Test){setTimeout(installFix27I,25);return}
  if(window.__mochiFix27IInstalled)return;window.__mochiFix27IInstalled=true;
  const F27I_BUILD="0916-FIX27I";

  // Use the exact same root-opening test that already suppresses hidden/dashed
  // circle outlines. Passing Infinity means every incident hose root on this
  // upper node contributes its established opening, independent of the lower
  // crossing hose's z value.
  function rootGapAt(n,p){
    const a=Math.atan2(p.y-n.y,p.x-n.x);
    return f21CircleGap(n,a,Number.POSITIVE_INFINITY);
  }
  function solidNodeLinkRuns(n,l){
    return f14CircleArcRuns(n,p=>f25PointInLinkShape(l,p,.5)&&!rootGapAt(n,p),420);
  }

  const prevRenderBoundaries=f25RenderBoundaries;
  f25RenderBoundaries=function(){
    prevRenderBoundaries();
    // FIX27F/G/H used separate approximations for this same opening. Remove
    // their solid node-over-link separator and rebuild it using f21CircleGap,
    // the already-proven hidden-outline rule.
    overlapLayer.querySelectorAll('[data-z-boundary="f25-node-link-sep"]').forEach(e=>e.remove());
    for(const l of links){
      for(const n of nodes){
        if(n.id===l.a||n.id===l.b||f25LinkAboveNode(l,n))continue;
        for(const d of solidNodeLinkRuns(n,l))overlapLayer.appendChild(sEl("path",{
          d,fill:"none",stroke:F25_SEP,"stroke-width":F25_SEP_W,
          "stroke-linecap":"round","stroke-linejoin":"round",
          "data-z-boundary":"f25-node-link-sep","data-upper":n.id,"data-lower":l.id,
          "data-f27i-gap-reuse":"1"
        }));
      }
    }
  };
  f18RenderZBoundaries=f25RenderBoundaries;f15RenderZBoundaries=f25RenderBoundaries;renderOverlapEdges=f25RenderBoundaries;
  if(window.__mochiFix25Render)window.__mochiFix25Render.renderBoundaries=f25RenderBoundaries;
  if(window.__mochiFix25Test)window.__mochiFix25Test.renderBoundaries=f25RenderBoundaries;

  window.__mochiFix27ITest={rootGapAt,solidNodeLinkRuns};
  statusText=function(t){status.innerHTML=`餅マップ v0.9.4<br>BUILD ${F27I_BUILD}<br>${t}`;f22PlaceStatus()};
  renderAll();statusText("待機中");
})();
