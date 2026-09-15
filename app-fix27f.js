"use strict";
(function installFix27F(){
  if(!window.__mochiFix27EInstalled||!window.__mochiFix27Test){setTimeout(installFix27F,25);return}
  if(window.__mochiFix27FInstalled)return;window.__mochiFix27FInstalled=true;
  const F27F_BUILD="0916-FIX27F";

  // Keep the hidden/dashed outline logic from FIX27D/E. Only erase the solid
  // node-vs-link separator where that separator lies inside this node's own
  // incident hose/root. This is the unwanted solid arc seen between root-Rs.
  function f27fOwnRootMaskRuns(n,lowerLink){
    const incident=links.filter(x=>(x.a===n.id||x.b===n.id)&&x.id!==lowerLink.id);
    const out=[];
    for(const own of incident){
      for(const d of f14CircleArcRuns(n,p=>f25PointInLinkShape(lowerLink,p,.5)&&f25PointInLinkShape(own,p,1.75),360))out.push(d);
    }
    return out;
  }
  const prevRenderBoundaries=f25RenderBoundaries;
  f25RenderBoundaries=function(){
    prevRenderBoundaries();
    for(const l of links){
      for(const n of nodes){
        if(n.id===l.a||n.id===l.b||f25LinkAboveNode(l,n))continue;
        for(const d of f27fOwnRootMaskRuns(n,l)){
          overlapLayer.appendChild(sEl("path",{d,fill:"none",stroke:F23_YELLOW,"stroke-width":F25_SEP_W+2.4,"stroke-linecap":"round","stroke-linejoin":"round","data-f27f-root-gap-mask":"1","data-node":n.id,"data-lower-link":l.id}));
        }
      }
    }
  };
  f18RenderZBoundaries=f25RenderBoundaries;f15RenderZBoundaries=f25RenderBoundaries;renderOverlapEdges=f25RenderBoundaries;
  if(window.__mochiFix25Render)window.__mochiFix25Render.renderBoundaries=f25RenderBoundaries;
  if(window.__mochiFix25Test)window.__mochiFix25Test.renderBoundaries=f25RenderBoundaries;

  // The build/status window is a development aid. Keep it permanently out of
  // the top toolbar area on every device: bottom-left with safe-area padding.
  f22PlaceStatus=function(){
    if(!status)return;
    status.style.left="12px";status.style.right="auto";status.style.top="auto";
    status.style.bottom="calc(12px + env(safe-area-inset-bottom))";
  };
  window.addEventListener("resize",()=>requestAnimationFrame(f22PlaceStatus));
  window.addEventListener("orientationchange",()=>setTimeout(f22PlaceStatus,60));

  window.__mochiFix27FTest={ownRootMaskRuns:f27fOwnRootMaskRuns,placeStatus:f22PlaceStatus};
  statusText=function(t){status.innerHTML=`餅マップ v0.9.4<br>BUILD ${F27F_BUILD}<br>${t}`;f22PlaceStatus()};
  renderAll();statusText("待機中");
})();
