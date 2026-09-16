"use strict";
(function installFix27L(){
  if(!window.__mochiFix27KInstalled||!window.__mochiFix27Test){setTimeout(installFix27L,25);return}
  if(window.__mochiFix27LInstalled)return;window.__mochiFix27LInstalled=true;
  const F27L_BUILD="0916-FIX27L";

  function ownRootGapAt(n,p){
    return f21CircleGap(n,Math.atan2(p.y-n.y,p.x-n.x),Number.POSITIVE_INFINITY);
  }
  function nodeBoundaryRunsGap(up,low){
    const out=[];let cur=[];const steps=480,R=up.r+.35;
    for(let i=0;i<=steps;i++){
      const a=-Math.PI+2*Math.PI*i/steps,p={x:up.x+Math.cos(a)*R,y:up.y+Math.sin(a)*R};
      const inside=dist(p.x,p.y,low.x,low.y)<=low.r+1;
      const on=inside&&!ownRootGapAt(up,p);
      if(on)cur.push(p);else if(cur.length){if(cur.length>1)out.push(f23Path(cur));cur=[]}
    }
    if(cur.length>1)out.push(f23Path(cur));
    return out;
  }
  function nodeLinkBoundaryRunsGap(n,l){
    return f14CircleArcRuns(n,p=>f25PointInLinkShape(l,p,.5)&&!ownRootGapAt(n,p),420);
  }

  // Make every solid circle boundary honor the same root opening already used
  // by the successful dashed hidden-circle rule.
  f25NodeBoundaryRuns=nodeBoundaryRunsGap;

  const prevBound=f25RenderBoundaries;
  f25RenderBoundaries=function(){
    prevBound();
    // Older layers can still contain node/link circle separators that cross an
    // incident root opening. Rebuild those separators with the shared gap rule.
    overlapLayer.querySelectorAll('[data-z-boundary="f25-node-link-sep"]').forEach(e=>e.remove());
    for(const l of links)for(const n of nodes){
      if(n.id===l.a||n.id===l.b||f25LinkAboveNode(l,n))continue;
      for(const d of nodeLinkBoundaryRunsGap(n,l))overlapLayer.appendChild(sEl("path",{
        d,fill:"none",stroke:F25_SEP,"stroke-width":F25_SEP_W,
        "stroke-linecap":"round","stroke-linejoin":"round",
        "data-z-boundary":"f25-node-link-sep","data-upper":n.id,"data-lower":l.id,
        "data-f27l-root-gap":"1"
      }));
    }
  };
  f18RenderZBoundaries=f25RenderBoundaries;f15RenderZBoundaries=f25RenderBoundaries;renderOverlapEdges=f25RenderBoundaries;
  if(window.__mochiFix25Render)window.__mochiFix25Render.renderBoundaries=f25RenderBoundaries;
  if(window.__mochiFix25Test)window.__mochiFix25Test.renderBoundaries=f25RenderBoundaries;

  window.__mochiFix27LTest={ownRootGapAt,nodeBoundaryRunsGap,nodeLinkBoundaryRunsGap};
  statusText=function(t){status.innerHTML=`餅マップ v0.9.4<br>BUILD ${F27L_BUILD}<br>${t}`;f22PlaceStatus()};
  renderAll();statusText("待機中");
})();
