"use strict";
(function installFix26(){
  if(!window.__mochiFix25aInstalled||!window.__mochiFix25Test||typeof f25RenderBoundaries!=="function"){setTimeout(installFix26,25);return}
  if(window.__mochiFix26Installed)return;window.__mochiFix26Installed=true;
  const F26_BUILD="0915-FIX26",F26_GAP_PX=5,F26_TOUCH_DIFF=36,F26_PEN_DIFF=24,F26_MOUSE_DIFF=12;
  let pendingChoice=null,pendingChoicePointer=null;

  function pxPerWorld(){const m=world.getScreenCTM?.();return Math.max(.01,m?Math.hypot(m.a,m.b):view.scale||1)}
  function gapWorld(){return F26_GAP_PX/pxPerWorld()}
  function rawNodes(p){return nodes.filter(n=>dist(p.x,p.y,n.x,n.y)<=n.r).sort((a,b)=>f24NodeZ(b)-f24NodeZ(a)||((b.created??0)-(a.created??0)))}
  function diffThreshold(evt){return (evt?.pointerType==="mouse"?F26_MOUSE_DIFF:evt?.pointerType==="pen"?F26_PEN_DIFF:F26_TOUCH_DIFF)/pxPerWorld()}
  function ambiguous(hits,evt){if(hits.length<2)return false;const a=[...hits].sort((x,y)=>x.r-y.r)[0],b=[...hits].sort((x,y)=>y.r-x.r)[0];return Math.abs(b.r-a.r)<=diffThreshold(evt)}
  function resolvedHits(x,y,pad=0){const p={x,y},actual=rawNodes(p);if(actual.length===1)return actual;if(actual.length>1){const bySize=[...actual].sort((a,b)=>a.r-b.r||f24NodeZ(b)-f24NodeZ(a)),small=bySize[0],large=bySize.at(-1);if(Math.abs(large.r-small.r)>F26_TOUCH_DIFF/pxPerWorld())return[small];return actual}if(pad>0){const near=nodes.filter(n=>dist(x,y,n.x,n.y)<=n.r+pad).sort((a,b)=>f24NodeZ(b)-f24NodeZ(a));if(near.length)return[near[0]]}return[]}
  f22HitsAt=function(x,y,pad=0){return resolvedHits(x,y,pad)};
  nearestNode=function(x,y){const n=resolvedHits(x,y,24/view.scale)[0]||null;return n?{node:n,d:dist(x,y,n.x,n.y)}:null};

  function startNodePointer(evt,p,n){selected={type:"node",id:n.id};const d=dist(p.x,p.y,n.x,n.y),moveFrac=evt.pointerType==="mouse"?.78:.70;if(d<=n.r*moveFrac)startMoveGesture(evt,p,n);else armHold("node",n.id,evt,p);svg.setPointerCapture?.(evt.pointerId)}
  f22ChooseNode=function(id){const n=nodeById(id);if(!n)return;if(typeof f13SetSelectedIds==="function")f13SetSelectedIds([]);selected={type:"node",id};pendingChoice=id;pendingChoicePointer=null;f22ChoiceArmed=null;f24ArmedNode=null;f25ArmedNode=null;f22CloseChooser();renderAll();statusText(`重なり選択：${n.label||id}（次の1回だけ固定）`)};
  const prevPenDown=penDown;
  penDown=function(evt,allowTouch=false){
    if(gesture||(!allowTouch&&touches.size)||confirmDelete.style.display==="block")return;
    const p=eventToWorld(evt),hits=rawNodes(p);
    if(hits.length){
      if(pendingChoice){const chosen=hits.find(n=>n.id===pendingChoice);if(chosen){evt.preventDefault();pendingChoicePointer=evt.pointerId;const id=pendingChoice;pendingChoice=null;startNodePointer(evt,p,chosen);statusText(`選択固定：${chosen.label||id}`);return}pendingChoice=null}
      if(hits.length>1&&ambiguous(hits,evt)){evt.preventDefault();selected=null;f22ChoiceArmed=null;f24ArmedNode=null;f25ArmedNode=null;f22ShowChooser(hits,evt);return}
      let n=hits[0];if(hits.length>1){n=[...hits].sort((a,b)=>a.r-b.r||f24NodeZ(b)-f24NodeZ(a))[0]}
      evt.preventDefault();startNodePointer(evt,p,n);return;
    }
    pendingChoice=null;return prevPenDown(evt,allowTouch)
  };
  function clearPendingAfterGesture(e){if(pendingChoicePointer===e.pointerId){pendingChoicePointer=null;pendingChoice=null;f22ChoiceArmed=null;f24ArmedNode=null;f25ArmedNode=null}}
  window.addEventListener("pointerup",clearPendingAfterGesture,true);window.addEventListener("pointercancel",clearPendingAfterGesture,true);

  function segDist(p,a,b){const vx=b.x-a.x,vy=b.y-a.y,l2=vx*vx+vy*vy;if(l2<1e-9)return dist(p.x,p.y,a.x,a.y);const t=clamp(((p.x-a.x)*vx+(p.y-a.y)*vy)/l2,0,1),q={x:a.x+vx*t,y:a.y+vy*t};return dist(p.x,p.y,q.x,q.y)}
  function polyDist(p,poly){if(!poly?.length)return Infinity;if(f24PointInPoly(p,poly))return 0;let d=Infinity;for(let i=0;i<poly.length;i++)d=Math.min(d,segDist(p,poly[i],poly[(i+1)%poly.length]));return d}
  function nodeLinkSeparation(n,l){if(!n||!l||l.a===n.id||l.b===n.id)return Infinity;const p={x:n.x,y:n.y};let sep=f15PointLinkDistance(l,p,160)-linkWidth(l)/2-n.r;for(const f of[true,false]){const poly=f24RootPoly(l,f);if(poly)sep=Math.min(sep,polyDist(p,poly)-n.r)}return sep}
  function nodeMinSeparation(n){let sep=Infinity;for(const l of links)sep=Math.min(sep,nodeLinkSeparation(n,l));return sep}
  function violation(ids,margin=gapWorld()){let v=0;for(const id of ids||[]){const n=nodeById(id);if(!n)continue;const s=nodeMinSeparation(n);if(Number.isFinite(s))v=Math.max(v,margin-s)}return Math.max(0,v)}
  function snap(ids){const o={};for(const id of ids){const n=nodeById(id);if(n)o[id]={x:n.x,y:n.y,r:n.r}}return o}
  function restore(s){for(const[id,q]of Object.entries(s)){const n=nodeById(id);if(n){n.x=q.x;n.y=q.y;n.r=q.r}}}
  function interpolate(a,b,t){for(const id of Object.keys(a)){const n=nodeById(id),x=b[id];if(!n||!x)continue;const s=a[id];n.x=s.x+(x.x-s.x)*t;n.y=s.y+(x.y-s.y)*t;n.r=s.r+(x.r-s.r)*t}}
  function constrain(ids,before,beforeV){const after=snap(ids),afterV=violation(ids);if(afterV<=0||afterV<beforeV-.01)return false;if(beforeV>0){restore(before);return true}let lo=0,hi=1;for(let k=0;k<14;k++){const m=(lo+hi)/2;interpolate(before,after,m);if(violation(ids)<=.001)lo=m;else hi=m}interpolate(before,after,lo);return true}
  function tracked(g){if(!g)return[];const ids=g.compIds?.length?[...g.compIds]:(g.nodeId?componentIds(g.nodeId):[]);return ids.filter(id=>directAttachmentsOf(id).length>0)}
  const prevPenMove=penMove;
  penMove=function(evt){const g=gesture,ids=tracked(g);if(!ids.length)return prevPenMove(evt);const before=snap(ids),v0=violation(ids);const r=prevPenMove(evt);if(gesture&&ids.length&&constrain(ids,before,v0)){scheduleMotionRender();statusText("紐との見える隙間を保って停止")}return r};

  function predictAttachAllowed(g,pair){if(!g||!pair)return false;const ids=g.compIds?.length?[...g.compIds]:componentIds(pair.movedId),sh=f13AttachShift(g,pair);if(!sh)return false;const before=snap(ids);for(const id of ids){const n=nodeById(id);if(n){n.x+=sh.u.x*sh.amount;n.y+=sh.u.y*sh.amount}}const ok=violation(ids)<=.001;restore(before);return ok}
  f13BestApproach=function(g){if(!g||g.blockAttachUntilClear)return null;const ids=g.compIds||[g.nodeId],set=new Set(ids),skip=g.bypassPairs||new Set(),candidates=g.f13CandidateIds||[g.nodeId];let best=null,bestScore=Infinity;for(const id of candidates){const a=nodeById(id);if(!a)continue;for(const b of nodes){if(set.has(b.id)||directAttached(id,b.id)||skip.has(pairKey(id,b.id)))continue;const m=f13ContactMetrics(a,b);if(!m.visible)continue;const pair={movedId:id,otherId:b.id};if(!predictAttachAllowed(g,pair))continue;const score=Math.max(0,m.gap)+m.gap*.02;if(score<bestScore){bestScore=score;best={pair,metrics:m}}} }return best};
  const prevPreview=f13RenderContactPreview;
  f13RenderContactPreview=function(aId,bId){const g={nodeId:aId,compIds:componentIds(aId)},pair={movedId:aId,otherId:bId};if(!predictAttachAllowed(g,pair)){f13ClearContactPreview();return{visible:false,touch:false,blockedByLink:true}}return prevPreview(aId,bId)};
  const prevAddAttachment=addAttachment;
  addAttachment=function(a,b,newerId){if(!a||!b||a===b||directAttached(a,b))return false;const moved=(newerId&&componentIds(newerId).includes(a))?a:(newerId&&componentIds(newerId).includes(b)?b:a),other=moved===a?b:a,g={nodeId:moved,compIds:componentIds(moved)};if(!predictAttachAllowed(g,{movedId:moved,otherId:other})){statusText("紐・根本Rとの隙間が足りないため接着しません");return false}return prevAddAttachment(a,b,newerId)};

  const baseBoundaries=f25RenderBoundaries;
  function rootVsLinkRuns(up,fromA,low){const g=f23RootGeom(up,fromA);if(!g)return[];const test=p=>f25PointInLinkShape(low,p,F25_SEP_W*.55);return[...f23CurveRuns(g.top,test),...f23CurveRuns(g.bottom,test)]}
  f25RenderBoundaries=function(){baseBoundaries();
    for(const n of nodes)for(const l of links){if(l.a===n.id||l.b===n.id||f25LinkAboveNode(l,n))continue;for(const d of f14CircleArcRuns(n,p=>f25PointInLinkShape(l,p,.8),360))f15ZTopLayer.appendChild(sEl("path",{d,fill:"none",stroke:F25_SEP,"stroke-width":F25_SEP_W,"stroke-linecap":"round","stroke-linejoin":"round","data-z-boundary":"f26-node-over-link","data-upper":n.id,"data-lower":l.id}))}
    const os=f24LinkOrder();for(let i=1;i<os.length;i++){const up=os[i];for(let j=0;j<i;j++){const low=os[j];for(const f of[true,false])for(const d of rootVsLinkRuns(up,f,low))f15ZTopLayer.appendChild(sEl("path",{d,fill:"none",stroke:F25_SEP,"stroke-width":F25_SEP_W,"stroke-linecap":"round","stroke-linejoin":"round","data-z-boundary":"f26-root-over-link","data-upper":up.id,"data-lower":low.id}))}}
  };
  f18RenderZBoundaries=f25RenderBoundaries;f15RenderZBoundaries=f25RenderBoundaries;renderOverlapEdges=f25RenderBoundaries;window.__mochiFix25Test.renderBoundaries=f25RenderBoundaries;

  const prevRenderAll=renderAll,prevRenderMotion=renderMotionNow;
  renderAll=function(){prevRenderAll();f25RenderBoundaries();renderUI();f22PlaceStatus()};
  renderMotionNow=function(){prevRenderMotion();f25RenderBoundaries();renderUI();f22PlaceStatus()};

  window.__mochiFix26Test={rawNodes,resolvedHits,ambiguous,diffThreshold,startNodePointer,pending:()=>pendingChoice,gapWorld,nodeLinkSeparation,nodeMinSeparation,violation,predictAttachAllowed,constrain,rootVsLinkRuns,renderBoundaries:f25RenderBoundaries};
  statusText=function(t){status.innerHTML=`餅マップ v0.9.4<br>BUILD ${F26_BUILD}<br>${t}`;f22PlaceStatus()};
  renderAll();statusText("待機中");
})();
