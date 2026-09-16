"use strict";
(function installFix27M(){
  if(!window.__mochiFix27LInstalled||!window.__mochiFix26Test){setTimeout(installFix27M,25);return}
  if(window.__mochiFix27MInstalled)return;window.__mochiFix27MInstalled=true;
  const F27M_BUILD="0916-FIX27M",ROOT_PAD=2.25;

  function segDistM(p,a,b){const vx=b.x-a.x,vy=b.y-a.y,l2=vx*vx+vy*vy;if(l2<1e-9)return dist(p.x,p.y,a.x,a.y);const t=clamp(((p.x-a.x)*vx+(p.y-a.y)*vy)/l2,0,1),q={x:a.x+vx*t,y:a.y+vy*t};return dist(p.x,p.y,q.x,q.y)}
  function polyDistM(p,poly){if(!poly?.length)return Infinity;if(f24PointInPoly(p,poly))return 0;let d=Infinity;for(let i=0;i<poly.length;i++)d=Math.min(d,segDistM(p,poly[i],poly[(i+1)%poly.length]));return d}
  function rootObstacleDistance(l,fromA,p){const poly=f24RootPoly(l,fromA);return poly?polyDistM(p,poly):Infinity}
  function incidentOpeningDistance(n,p){let d=Infinity;for(const l of links){let fromA=null;if(l.a===n.id)fromA=true;else if(l.b===n.id)fromA=false;else continue;d=Math.min(d,rootObstacleDistance(l,fromA,p));}return d}
  function ownOpeningAt(n,p,pad=ROOT_PAD){return incidentOpeningDistance(n,p)<=pad}

  function splitCircleRuns(n,test,steps=520,R=n.r+.35){const out=[];let cur=[];for(let i=0;i<=steps;i++){const a=-Math.PI+2*Math.PI*i/steps,p={x:n.x+Math.cos(a)*R,y:n.y+Math.sin(a)*R};const on=test(p)&&!ownOpeningAt(n,p);if(on)cur.push(p);else if(cur.length){if(cur.length>1)out.push(f23Path(cur));cur=[]}}if(cur.length>1)out.push(f23Path(cur));return out}
  function nodeNodeRuns(up,low){return splitCircleRuns(up,p=>dist(p.x,p.y,low.x,low.y)<=low.r+1)}
  function nodeOverLinkRuns(n,l){return splitCircleRuns(n,p=>f25PointInLinkShape(l,p,.8))}
  function nodeUnderNodeRuns(low,up){if(f24NodeZ(up)<=f24NodeZ(low)||sameComponent(low.id,up.id))return[];return splitCircleRuns(low,p=>dist(p.x,p.y,up.x,up.y)<=up.r+1,520,low.r+1)}
  function nodeUnderLinkRuns(n,l){if(l.a===n.id||l.b===n.id||!f25LinkAboveNode(l,n))return[];return splitCircleRuns(n,p=>f25PointInLinkShape(l,p,.55),520,n.r+1)}

  // One shared opening geometry now drives solid and dashed circle contours.
  f25NodeBoundaryRuns=nodeNodeRuns;
  f25HiddenCircleRuns=nodeUnderNodeRuns;

  const prevBound=f25RenderBoundaries;
  f25RenderBoundaries=function(){
    prevBound();
    // Remove every older circle-separator family; these were produced by
    // different opening rules and are the source of partial/one-sided seams.
    overlapLayer.querySelectorAll('[data-z-boundary="f25-node-node"],[data-z-boundary="f25-node-link-sep"]').forEach(e=>e.remove());
    f15ZTopLayer.querySelectorAll('[data-z-boundary="f25-node-node"],[data-z-boundary="f26-node-over-link"]').forEach(e=>e.remove());

    const ns=[...nodes].sort((a,b)=>f24NodeZ(a)-f24NodeZ(b)||((a.created??0)-(b.created??0)));
    for(let i=0;i<ns.length;i++)for(let j=i+1;j<ns.length;j++){
      const low=ns[i],up=ns[j];if(directAttached(low.id,up.id)||sameComponent(low.id,up.id))continue;
      if(dist(low.x,low.y,up.x,up.y)>=low.r+up.r-.25)continue;
      for(const d of nodeNodeRuns(up,low)){
        const a={d,fill:"none",stroke:F25_SEP,"stroke-width":F25_SEP_W,"stroke-linecap":"round","stroke-linejoin":"round","data-z-boundary":"f25-node-node","data-upper":up.id,"data-lower":low.id,"data-f27m":"1"};
        overlapLayer.appendChild(sEl("path",a));f15ZTopLayer.appendChild(sEl("path",a));
      }
    }
    for(const n of nodes)for(const l of links){
      if(l.a===n.id||l.b===n.id||f25LinkAboveNode(l,n))continue;
      for(const d of nodeOverLinkRuns(n,l))f15ZTopLayer.appendChild(sEl("path",{d,fill:"none",stroke:F25_SEP,"stroke-width":F25_SEP_W,"stroke-linecap":"round","stroke-linejoin":"round","data-z-boundary":"f26-node-over-link","data-upper":n.id,"data-lower":l.id,"data-f27m":"1"}));
    }
  };
  f18RenderZBoundaries=f25RenderBoundaries;f15RenderZBoundaries=f25RenderBoundaries;renderOverlapEdges=f25RenderBoundaries;
  if(window.__mochiFix25Render)window.__mochiFix25Render.renderBoundaries=f25RenderBoundaries;
  if(window.__mochiFix25Test)window.__mochiFix25Test.renderBoundaries=f25RenderBoundaries;

  const prevHidden=f25RenderHidden;
  f25RenderHidden=function(){
    prevHidden();
    // Rebuild circle dashed contours with the exact same root polygon opening.
    hiddenLayer.querySelectorAll('[data-f27k="node-node"],[data-f27k="node-under-link"],[data-f25-circle="1"],[data-f25-node-under-link="1"]').forEach(e=>e.remove());
    const ns=[...nodes].sort((a,b)=>f24NodeZ(a)-f24NodeZ(b)||((a.created??0)-(b.created??0)));
    for(let i=0;i<ns.length;i++)for(let j=i+1;j<ns.length;j++)for(const d of nodeUnderNodeRuns(ns[i],ns[j]))hiddenLayer.appendChild(sEl("path",{d,class:"hidden-outline","data-f27m":"node-node"}));
    for(const n of ns)for(const l of links)for(const d of nodeUnderLinkRuns(n,l))hiddenLayer.appendChild(sEl("path",{d,class:"hidden-outline","data-f27m":"node-under-link"}));
  };
  renderHidden=f25RenderHidden;

  // Reuse the same root opening for attachment acquisition: an attached node's
  // hose/root mouth is not a valid circle-contact face.
  function pairBlockedAtOpening(pair){if(!pair)return false;const moved=nodeById(pair.movedId),other=nodeById(pair.otherId);if(!moved||!other)return false;const dx=moved.x-other.x,dy=moved.y-other.y,L=Math.hypot(dx,dy)||1,p={x:other.x+dx/L*other.r,y:other.y+dy/L*other.r};return ownOpeningAt(other,p,ROOT_PAD+1)}
  const prevBest=f13BestApproach;
  f13BestApproach=function(g){const best=prevBest(g);return best&&pairBlockedAtOpening(best.pair)?null:best};
  const prevPreview=f13RenderContactPreview;
  f13RenderContactPreview=function(aId,bId){if(pairBlockedAtOpening({movedId:aId,otherId:bId})){f13ClearContactPreview();return{visible:false,touch:false,blockedByRoot:true}}return prevPreview(aId,bId)};

  window.__mochiFix27MTest={rootObstacleDistance,incidentOpeningDistance,ownOpeningAt,nodeNodeRuns,nodeOverLinkRuns,nodeUnderNodeRuns,nodeUnderLinkRuns,pairBlockedAtOpening};
  statusText=function(t){status.innerHTML=`餅マップ v0.9.4<br>BUILD ${F27M_BUILD}<br>${t}`;f22PlaceStatus()};
  renderAll();statusText("待機中");
})();
