"use strict";
// v0.9.4 FIX10
// Regression-driven hotfix:
// - trackpad pinch is handled as canvas zoom instead of transient page zoom
// - two-finger tap opens the same context menu on iPad/touch
// - context menu is clamped to the visible viewport
// - add context-menu "分離" for buried/accidentally attached nodes
// - hidden hose outlines stop at their endpoint circles; deep buried nodes stay visible
// - keep hidden outlines visible while crossing/overlap motion is being rendered
// - preserve FIX9 rule: resize creates crossings, never new attachments

const ctxDetach=document.getElementById("ctxDetach");
let _webKitPinch=null;
let _twoFingerTap=null;
const _touchMenuPointers=new Map();

function _clientPointToSvg(clientX,clientY){
  const p=svg.createSVGPoint();p.x=clientX;p.y=clientY;
  return p.matrixTransform(svg.getScreenCTM().inverse());
}
function _clientPointToWorld(clientX,clientY){return svgToWorldPoint(_clientPointToSvg(clientX,clientY))}
function _eventClientPoint(evt){
  if(Number.isFinite(evt.clientX)&&Number.isFinite(evt.clientY)&&(evt.clientX||evt.clientY))return{x:evt.clientX,y:evt.clientY};
  const r=svg.getBoundingClientRect();return{x:r.left+r.width/2,y:r.top+r.height/2};
}
function _applyAbsoluteCanvasScale(clientX,clientY,startScale,gestureScale,anchor){
  const p=_clientPointToSvg(clientX,clientY),s=clamp(startScale*gestureScale,VIEW_MIN,VIEW_MAX);
  view.scale=s;view.x=p.x-anchor.x*s;view.y=p.y-anchor.y*s;applyView();renderUI();statusText(`ズーム ${Math.round(s*100)}%`);
  return s;
}

function _onGestureStart(evt){
  evt.preventDefault();evt.stopImmediatePropagation();
  const c=_eventClientPoint(evt),p=_clientPointToSvg(c.x,c.y),anchor=svgToWorldPoint(p);
  _webKitPinch={startScale:view.scale,anchor,clientX:c.x,clientY:c.y};
}
function _onGestureChange(evt){
  evt.preventDefault();evt.stopImmediatePropagation();
  if(!_webKitPinch)_onGestureStart(evt);
  const c=_eventClientPoint(evt),scale=Number.isFinite(evt.scale)?evt.scale:1;
  _applyAbsoluteCanvasScale(c.x,c.y,_webKitPinch.startScale,scale,_webKitPinch.anchor);
}
function _onGestureEnd(evt){evt.preventDefault();evt.stopImmediatePropagation();_webKitPinch=null}
for(const [type,fn] of [["gesturestart",_onGestureStart],["gesturechange",_onGestureChange],["gestureend",_onGestureEnd]]){
  window.addEventListener(type,fn,{capture:true,passive:false});
}
window.addEventListener("wheel",evt=>{
  if(!evt.ctrlKey)return;
  evt.preventDefault();evt.stopImmediatePropagation();
  _applyCanvasWheel(evt);
},{capture:true,passive:false});

function _clampContextMenu(){
  if(contextMenu.style.display!=="block")return;
  const margin=8;
  Object.assign(contextMenu.style,{maxWidth:`calc(100vw - ${margin*2}px)`,maxHeight:`calc(100vh - ${margin*2}px)`,overflowY:"auto"});
  const r=contextMenu.getBoundingClientRect();
  let left=parseFloat(contextMenu.style.left)||margin,top=parseFloat(contextMenu.style.top)||margin;
  left=clamp(left,margin,Math.max(margin,window.innerWidth-r.width-margin));
  top=clamp(top,margin,Math.max(margin,window.innerHeight-r.height-margin));
  contextMenu.style.left=left+"px";contextMenu.style.top=top+"px";
}
document.addEventListener("contextmenu",()=>requestAnimationFrame(_clampContextMenu),{capture:true});
window.addEventListener("resize",_clampContextMenu,{passive:true});

function _openTouchContext(clientX,clientY){
  if(freeLinkState)cancelFreeLink();
  restoreGestureForPinch();touches.clear();touchViewGesture=null;
  contextPoint=_clientPointToWorld(clientX,clientY);contextTarget=targetAtWorld(contextPoint);
  contextMenu.style.left=clientX+"px";contextMenu.style.top=clientY+"px";contextMenu.style.display="block";
  ctxSelect.disabled=!contextTarget;ctxDelete.disabled=!contextTarget;ctxLink.disabled=contextTarget?.type!=="node";
  if(ctxDetach)ctxDetach.disabled=!_separationTarget(contextPoint,contextTarget);
  requestAnimationFrame(_clampContextMenu);statusText("メニュー");
}

document.addEventListener("pointerdown",evt=>{
  if(evt.pointerType!=="touch")return;
  _touchMenuPointers.set(evt.pointerId,{x:evt.clientX,y:evt.clientY,sx:evt.clientX,sy:evt.clientY,t:performance.now(),moved:false});
  if(_touchMenuPointers.size===2){
    const pts=[..._touchMenuPointers.values()];
    _twoFingerTap={t:performance.now(),x:pts[0].sx,y:pts[0].sy,ids:[..._touchMenuPointers.keys()],moved:false};
  }
},{capture:true,passive:true});
document.addEventListener("pointermove",evt=>{
  const rec=_touchMenuPointers.get(evt.pointerId);if(!rec)return;
  rec.x=evt.clientX;rec.y=evt.clientY;
  if(Math.hypot(rec.x-rec.sx,rec.y-rec.sy)>12){rec.moved=true;if(_twoFingerTap)_twoFingerTap.moved=true}
},{capture:true,passive:true});
document.addEventListener("pointerup",evt=>{
  const rec=_touchMenuPointers.get(evt.pointerId);if(!rec)return;
  const candidate=_twoFingerTap,elapsed=candidate?performance.now()-candidate.t:Infinity;
  const valid=!!candidate&&!candidate.moved&&elapsed<=430&&candidate.ids.includes(evt.pointerId);
  _touchMenuPointers.delete(evt.pointerId);
  if(valid){
    evt.preventDefault();evt.stopImmediatePropagation();
    _twoFingerTap=null;_touchMenuPointers.clear();
    _openTouchContext(candidate.x,candidate.y);
  }else if(_touchMenuPointers.size<2)_twoFingerTap=null;
},{capture:true,passive:false});
document.addEventListener("pointercancel",evt=>{_touchMenuPointers.delete(evt.pointerId);if(_touchMenuPointers.size<2)_twoFingerTap=null},{capture:true,passive:true});

function _overlapDepth(a,b){return a.r+b.r-dist(a.x,a.y,b.x,b.y)}
function _isDeepBurial(lower,upper){
  if(!lower||!upper||(upper.z??0)<=(lower.z??0))return false;
  const d=dist(lower.x,lower.y,upper.x,upper.y),depth=lower.r+upper.r-d;
  if(depth<=0)return false;
  if(d+lower.r<=upper.r+1)return true;
  return depth>Math.min(lower.r,upper.r)*.30;
}
function _coveringNodes(n){
  return sortedNodes().filter(o=>o.id!==n.id&&(o.z??0)>(n.z??0)&&_overlapDepth(n,o)>1).sort((a,b)=>(b.z??0)-(a.z??0));
}
function _nodesContainingPoint(p){
  return sortedNodes().filter(n=>dist(p.x,p.y,n.x,n.y)<=n.r+10/view.scale);
}
function _separationTarget(p,fallback){
  if(!p)return fallback?.type==="node"?nodeById(fallback.id):null;
  const atPoint=_nodesContainingPoint(p);
  const buried=atPoint.filter(n=>_coveringNodes(n).length>0).sort((a,b)=>{
    const ac=_coveringNodes(a).length,bc=_coveringNodes(b).length;if(ac!==bc)return bc-ac;
    return (b.z??0)-(a.z??0);
  });
  if(buried.length)return buried[0];
  return fallback?.type==="node"?nodeById(fallback.id):null;
}
function _linkHiddenNearTarget(l,target,covers){
  if(!l||!target||!covers.length)return false;
  const fromA=l.a===target.id;if(!fromA&&l.b!==target.id)return false;
  const start=fromA?0:1,end=fromA?.34:.66,steps=18;
  for(let i=0;i<=steps;i++){
    const t=fromA?start+(end-start)*i/steps:start-(start-end)*i/steps,p=quadPoint(l,t);
    if(covers.some(c=>dist(p.x,p.y,c.x,c.y)<=c.r+linkWidth(l)/2))return true;
  }
  return false;
}
function _spotIsFree(n,x,y,margin=18){
  return nodes.every(o=>o.id===n.id||dist(x,y,o.x,o.y)>=n.r+o.r+margin);
}
function _findFreeSeparationSpot(n,covers,p){
  const primary=covers[0]||null;let ux=1,uy=0;
  if(primary){ux=n.x-primary.x;uy=n.y-primary.y;if(Math.hypot(ux,uy)<1&&p){ux=p.x-primary.x;uy=p.y-primary.y}}
  const u=unit(ux,uy),baseAngle=Math.atan2(u.y,u.x),baseDist=primary?primary.r+n.r+32:n.r*2+70;
  const angleOffsets=[0,.35,-.35,.7,-.7,1.05,-1.05,1.4,-1.4,Math.PI];
  for(let ring=0;ring<8;ring++){
    const R=baseDist+ring*(n.r*1.35+36);
    const ox=primary?primary.x:n.x,oy=primary?primary.y:n.y;
    for(const off of angleOffsets){const a=baseAngle+off,x=ox+Math.cos(a)*R,y=oy+Math.sin(a)*R;if(_spotIsFree(n,x,y))return{x,y}}
  }
  return{x:n.x+baseDist*2,y:n.y};
}
function _separateBuriedNode(n,p){
  if(!n)return false;
  const covers=_coveringNodes(n),linkIds=new Set();
  for(const l of links)if((l.a===n.id||l.b===n.id)&&_linkHiddenNearTarget(l,n,covers))linkIds.add(l.id);
  const beforeA=attachments.length,beforeL=links.length;
  for(let i=attachments.length-1;i>=0;i--)if(attachments[i].a===n.id||attachments[i].b===n.id)attachments.splice(i,1);
  for(let i=links.length-1;i>=0;i--)if(linkIds.has(links[i].id))links.splice(i,1);
  for(const key of [...crossPairs])if(key.split("|").includes(n.id))crossPairs.delete(key);
  const spot=_findFreeSeparationSpot(n,covers,p);n.x=spot.x;n.y=spot.y;n.z=++zSeq;
  selected={type:"node",id:n.id};enforceCrossInvariant();renderAll();commitHistory();
  statusText(`分離：丸1個を退避（接着${beforeA-attachments.length}、隠れ紐${beforeL-links.length}）`);return true;
}
if(ctxDetach){
  interceptMenuButton(ctxDetach,()=>{
    const n=_separationTarget(contextPoint,contextTarget),p=contextPoint;
    closeContextKeepTarget();
    if(!_separateBuriedNode(n,p))statusText("分離対象がありません");
    clearOneShotTool();
  });
}

hiddenLinkEdges=function(l,cover){
  const runs=linkNodeOverlapRanges(l,cover),out=[],a=nodeById(l.a),b=nodeById(l.b),w=linkWidth(l);
  for(const [t0,t1] of runs){
    for(const side of[-1,1]){
      let d="",drawing=false;const steps=Math.max(24,Math.ceil((t1-t0)*80));
      for(let i=0;i<=steps;i++){
        const t=t0+(t1-t0)*i/steps,p=quadPoint(l,t);
        const insideA=a&&dist(p.x,p.y,a.x,a.y)<a.r*.91,insideB=b&&dist(p.x,p.y,b.x,b.y)<b.r*.91;
        if(insideA||insideB){drawing=false;continue}
        const p0=quadPoint(l,clamp(t-.004,0,1)),p1=quadPoint(l,clamp(t+.004,0,1)),u=unit(p1.x-p0.x,p1.y-p0.y),v={x:-u.y,y:u.x},off=w/2+2,q={x:p.x+v.x*off*side,y:p.y+v.y*off*side};
        d+=(drawing?` L ${q.x} ${q.y}`:` M ${q.x} ${q.y}`);drawing=true;
      }
      if(d.trim())out.push(d.trim());
    }
  }
  return out;
};

function _shouldSuppressAttachedOutline(lower,upper){
  if(!directAttached(lower.id,upper.id))return false;
  return !_isDeepBurial(lower,upper);
}
renderHidden=function(){
  hiddenLayer.replaceChildren();const arr=sortedNodes();
  for(let i=0;i<arr.length;i++){
    const lower=arr[i];let fullCover=null;const arcs=[];
    for(let j=i+1;j<arr.length;j++){
      const upper=arr[j];if(_shouldSuppressAttachedOutline(lower,upper))continue;
      const arc=circleCoveredArc(lower,upper);if(!arc)continue;
      if(arc.full){fullCover=upper;break}arcs.push(arc.d);
    }
    if(fullCover){
      const d=hiddenCircleWithLinkGaps(lower);if(d)hiddenLayer.appendChild(sEl("path",{d,class:"hidden-outline","data-hidden-node":lower.id}));
      for(const l of links){if(l.a!==lower.id&&l.b!==lower.id)continue;for(const d2 of hiddenLinkEdges(l,fullCover))hiddenLayer.appendChild(sEl("path",{d:d2,class:"hidden-outline","data-hidden-link":l.id}))}
    }else for(const d of arcs)hiddenLayer.appendChild(sEl("path",{d,class:"hidden-outline","data-hidden-node":lower.id}));
  }
  for(const cover of arr){
    for(const l of links){
      if(l.a===cover.id||l.b===cover.id)continue;
      for(const d of hiddenLinkEdges(l,cover))hiddenLayer.appendChild(sEl("path",{d:d,class:"hidden-outline","data-hidden-link":l.id}));
    }
  }
};

renderMotionNow=function(){
  shadowLayer.style.display="none";overlapLayer.style.display="none";hiddenLayer.style.display="";
  renderLinks(true);renderNodesFast();
  if(crossPairs.size||gesture?.crossMode||gesture?.mode==="resize")renderHidden();else hiddenLayer.replaceChildren();
  renderUI();
};

window.__mochiFix10Test={
  overlapDepth:_overlapDepth,isDeepBurial:_isDeepBurial,spotIsFree:_spotIsFree,findFreeSeparationSpot:_findFreeSeparationSpot,
  separationTarget:_separationTarget,coveringNodes:_coveringNodes,linkHiddenNearTarget:_linkHiddenNearTarget,separateBuriedNode:_separateBuriedNode,applyAbsoluteCanvasScale:_applyAbsoluteCanvasScale,clampContextMenu:_clampContextMenu,
  enforceCrossInvariant,renderHidden
};

statusText=function(t){status.innerHTML=`餅マップ v0.9.4<br>BUILD 0910-FIX10<br>${t}`};
statusText("待機中");
