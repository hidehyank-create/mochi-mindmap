"use strict";
(function installFix27H(){
  if(!window.__mochiFix27GInstalled||!window.__mochiFix27Test){setTimeout(installFix27H,25);return}
  if(window.__mochiFix27HInstalled)return;window.__mochiFix27HInstalled=true;
  const F27H_BUILD="0916-FIX27H";

  function incidentRootOpening(n,p,ignoreLinkId=null){
    const a=Math.atan2(p.y-n.y,p.x-n.x);
    for(const l of links){
      if(l.id===ignoreLinkId||(l.a!==n.id&&l.b!==n.id))continue;
      const fromA=l.a===n.id;
      let tg=quadTangent(l,fromA?.012:.988);if(!fromA)tg={x:-tg.x,y:-tg.y};
      const ca=Math.atan2(tg.y,tg.x),w=linkWidth(l),half=w/2;
      const shoulder=clamp(w*1.34,half+7,Math.min(n.r*.60,w*1.55));
      const gap=Math.asin(clamp((shoulder+3)/Math.max(n.r,1),0,.95))+.045;
      const da=Math.abs(Math.atan2(Math.sin(a-ca),Math.cos(a-ca)));
      if(da<=gap)return true;
    }
    return false;
  }
  function filteredNodeLinkSepRunsH(n,l){
    return f14CircleArcRuns(n,p=>f25PointInLinkShape(l,p,.5)&&!incidentRootOpening(n,p,l.id),420);
  }

  // Remove the solid circle/link separator across this node's own root opening.
  // Keep the hidden dashed lower-hose outline visible, including beneath the root fill.
  const prevRenderBoundaries=f25RenderBoundaries;
  f25RenderBoundaries=function(){
    prevRenderBoundaries();
    overlapLayer.querySelectorAll('[data-z-boundary="f25-node-link-sep"]').forEach(e=>e.remove());
    for(const l of links){
      for(const n of nodes){
        if(n.id===l.a||n.id===l.b||f25LinkAboveNode(l,n))continue;
        for(const d of filteredNodeLinkSepRunsH(n,l))overlapLayer.appendChild(sEl("path",{
          d,fill:"none",stroke:F25_SEP,"stroke-width":F25_SEP_W,
          "stroke-linecap":"round","stroke-linejoin":"round",
          "data-z-boundary":"f25-node-link-sep","data-upper":n.id,"data-lower":l.id,
          "data-f27h-filtered":"1"
        }));
        if(links.some(x=>x.id!==l.id&&(x.a===n.id||x.b===n.id))){
          for(const d of f25HiddenLinkSideRuns(l,n))f15ZTopLayer.appendChild(sEl("path",{
            d,class:"hidden-outline","data-f27h-hidden-side-top":"1","data-node":n.id,"data-link":l.id
          }));
        }
      }
    }
  };
  f18RenderZBoundaries=f25RenderBoundaries;f15RenderZBoundaries=f25RenderBoundaries;renderOverlapEdges=f25RenderBoundaries;
  if(window.__mochiFix25Render)window.__mochiFix25Render.renderBoundaries=f25RenderBoundaries;
  if(window.__mochiFix25Test)window.__mochiFix25Test.renderBoundaries=f25RenderBoundaries;

  function receiverRootPath(n,u,width,ext){
    const v={x:-u.y,y:u.x},half=width/2;
    const shoulder=clamp(width*1.34,half+7,Math.min(n.r*.60,width*1.55));
    const x0=Math.sqrt(Math.max(1,n.r*n.r-shoulder*shoulder)),x1=n.r+Math.max(4,ext);
    const W=(x,y)=>({x:n.x+u.x*x+v.x*y,y:n.y+u.y*x+v.y*y});
    const P1=W(x0,shoulder),P2=W(x0,-shoulder),Q1=W(x1,half),Q2=W(x1,-half);
    const tangentTop=unit(shoulder,-x0),tangentBot=unit(shoulder,x0);
    const span=Math.max(8,x1-x0),k1=Math.max(5,Math.min(span*.72,width*1.18)),k2=Math.max(4,Math.min(span*.46,width*.78));
    const C1=W(x0+tangentTop.x*k1,shoulder+tangentTop.y*k1),C2=W(x1-k2,half);
    const C3=W(x1-k2,-half),C4=W(x0+tangentBot.x*k1,-shoulder+tangentBot.y*k1);
    return`M ${P1.x} ${P1.y} C ${C1.x} ${C1.y} ${C2.x} ${C2.y} ${Q1.x} ${Q1.y} L ${Q2.x} ${Q2.y} C ${C3.x} ${C3.y} ${C4.x} ${C4.y} ${P2.x} ${P2.y} Z`;
  }

  // Full-size root shoulder, but the root terminates at the current receiver tip,
  // so the round tip cap always remains visible as a semicircular nose.
  renderReceiver=function(){
    let g=liveLayer.querySelector("#receiverShape");
    if(!receiverState||receiverState.strength<=.01){g?.remove();return}
    const n=nodeById(receiverState.targetId),s=nodeById(receiverState.sourceId);if(!n||!s){g?.remove();return}
    if(!g){g=sEl("g",{id:"receiverShape"});liveLayer.appendChild(g)}
    const u=unit(s.x-n.x,s.y-n.y),ext=RECEIVER_MAX_EXTEND*clamp(receiverState.strength,0,1),width=receiverState.width||LINK_BASE_WIDTH;
    const tip={x:n.x+u.x*(n.r+ext),y:n.y+u.y*(n.r+ext)},rootD=receiverRootPath(n,u,width,ext);
    const body=sEl("path",{d:`M ${n.x} ${n.y} L ${tip.x} ${tip.y}`,class:"link-body","stroke-width":width});
    const cap=sEl("circle",{cx:tip.x,cy:tip.y,r:width/2,class:"live-tip","data-f27h-receiver-cap":"1"});
    g.replaceChildren(sEl("path",{d:rootD,fill:"#f0c867","data-f27h-receiver-root":"1"}),body,cap);
  };

  window.__mochiFix27HTest={incidentRootOpening,filteredNodeLinkSepRuns:filteredNodeLinkSepRunsH,receiverRootPath};
  statusText=function(t){status.innerHTML=`餅マップ v0.9.4<br>BUILD ${F27H_BUILD}<br>${t}`;f22PlaceStatus()};
  renderAll();statusText("待機中");
})();
