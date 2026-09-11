"use strict";
// FIX17b: suppress hidden root-R dashes whenever either endpoint is fully buried by the cover.
function f17bRenderHidden(){
  hiddenLayer.replaceChildren();const ordered=[...nodes].sort((a,b)=>f14ObjectZ(a,"node")-f14ObjectZ(b,"node")||((a.created??0)-(b.created??0)));
  for(let i=0;i<ordered.length;i++){
    const lower=ordered[i];let fullCover=null;
    for(let j=i+1;j<ordered.length;j++){
      const upper=ordered[j];if(sameComponent(lower.id,upper.id))continue;const arc=circleCoveredArc(lower,upper);if(!arc)continue;
      if(arc.full){fullCover=upper;break}
      hiddenLayer.appendChild(sEl("path",{d:arc.d,class:"hidden-outline","data-hidden-node":lower.id,"data-cover":upper.id,"data-partial":"1"}));
    }
    if(fullCover){const d=f16HiddenCirclePath(lower);if(d)hiddenLayer.appendChild(sEl("path",{d,class:"hidden-outline","data-hidden-node":lower.id,"data-full-cover":"1","data-cover":fullCover.id}))}
  }
  for(const cover of ordered){for(const l of links){
    if(l.a===cover.id||l.b===cover.id)continue;
    for(const d of hiddenLinkEdges(l,cover))hiddenLayer.appendChild(sEl("path",{d,class:"hidden-outline","data-hidden-link":l.id,"data-cover":cover.id}));
    if(typeof f12HiddenRootEdges!=="function")continue;
    const endpoints=[nodeById(l.a),nodeById(l.b)].filter(Boolean);
    if(endpoints.some(ep=>f14ObjectZ(ep,"node")<f14ObjectZ(cover,"node")&&f17NodeFullyCoveredBy(ep,cover)))continue;
    const partial=endpoints.some(ep=>f14ObjectZ(ep,"node")<f14ObjectZ(cover,"node")&&!sameComponent(ep.id,cover.id)&&dist(ep.x,ep.y,cover.x,cover.y)<ep.r+cover.r&& !f17NodeFullyCoveredBy(ep,cover));
    if(!partial)continue;
    for(const d of f12HiddenRootEdges(l,cover))hiddenLayer.appendChild(sEl("path",{d,class:"hidden-outline","data-hidden-root":l.id,"data-cover":cover.id,"data-partial-root":"1"}));
  }}
}
renderHidden=f17bRenderHidden;
if(window.__mochiFix17Test)window.__mochiFix17Test.renderHidden=f17bRenderHidden;
