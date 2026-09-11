"use strict";
// v0.9.4 FIX15
// - larger stick-less approach buds; neck R tuned between FIX13/FIX14
// - node overlap boundary only on the actual covered arc, in darker mochi yellow
// - precise zoom-independent link/link overlap separators from real lower-link width
// - stable bead-end ring closure after reselect/retry
// - touch/pen/mouse double-tap repeat mode for all action tools
// - fit-all uses the largest safe scale

const F15_BUILD="0912-FIX15";
const F15_BOUNDARY="#c3922e";
const F15_BG="#f7f4ed";
let f15HeldTool=null;
const f15LastTap=new Map();

// ---------- attachment preview / neck ----------
f13ContactMetrics=function(a,b){
  if(!a||!b)return{visible:false,touch:false,strength:0,gap:Infinity,tipA:null,tipB:null};
  const d=Math.max(.001,dist(a.x,a.y,b.x,b.y)),u=unit(b.x-a.x,b.y-a.y),gap=d-a.r-b.r,minR=Math.min(a.r,b.r);
  const startGap=clamp(minR*.38,24,34),strength=f13Smooth(clamp((startGap-gap)/startGap,0,1));
  // Bigger than FIX14, still only a rounded bud; no stem.
  const maxExt=clamp(minR*.19,13,19),ext=maxExt*strength,half=clamp(minR*.25,15,21)*strength;
  const tipA={x:a.x+u.x*(a.r+ext),y:a.y+u.y*(a.r+ext)},tipB={x:b.x-u.x*(b.r+ext),y:b.y-u.y*(b.r+ext)};
  return{visible:gap<startGap&&gap>-14,touch:gap<=ext*2+5&&gap>-14,strength,gap,startGap,ext,half,u,tipA,tipB};
};
f13BudPath=function(n,toward,m){
  if(!n||!m||m.strength<=.01)return null;
  const u=unit(toward.x-n.x,toward.y-n.y),v={x:-u.y,y:u.x},tipR=Math.max(1,m.half),rootHalf=clamp(tipR*1.78,tipR+4,Math.min(n.r*.48,36))*m.strength;
  const x0=Math.sqrt(Math.max(1,n.r*n.r-rootHalf*rootHalf)),noseX=n.r+m.ext,W=(x,y)=>({x:n.x+u.x*x+v.x*y,y:n.y+u.y*x+v.y*y});
  const top=W(x0,rootHalf),bot=W(x0,-rootHalf),nose=W(noseX,0),rootK=Math.max(5,rootHalf*.92),noseK=Math.max(4,tipR*.76);
  const c1=W(x0+rootK,rootHalf*.62),c2=W(noseX-noseK,tipR),c3=W(noseX-noseK,-tipR),c4=W(x0+rootK,-rootHalf*.62);
  return`M ${top.x} ${top.y} C ${c1.x} ${c1.y} ${c2.x} ${c2.y} ${nose.x} ${nose.y} C ${c3.x} ${c3.y} ${c4.x} ${c4.y} ${bot.x} ${bot.y} Z`;
};
f13NeckProfile=function(m,boost=0){
  const A=nodeById(m.a),B=nodeById(m.b),minR=Math.min(A?.r||0,B?.r||0);
  // Deliberately between FIX13 and FIX14 after device review.
  const finalShoulder=clamp(minR*.735,31,minR*.81),startShoulder=clamp(minR*.79,finalShoulder+3,minR*.85);
  const finalWaist=clamp(minR*.615,23,minR*.66),startWaist=clamp(minR*.67,finalWaist+3,minR*.72);
  return{shoulder:finalShoulder+(startShoulder-finalShoulder)*boost,waist:finalWaist+(startWaist-finalWaist)*boost,minR};
};

// ---------- stable ring-end approach ----------
f13BestApproach=function(g){
  if(!g||g.blockAttachUntilClear)return null;
  const ids=g.compIds||[g.nodeId],set=new Set(ids),skip=g.bypassPairs||new Set(),candidates=g.f13CandidateIds||[g.nodeId];let best=null,bestScore=Infinity;
  for(const id of candidates){const a=nodeById(id);if(!a)continue;for(const b of nodes){
    if(id===b.id||directAttached(id,b.id)||skip.has(pairKey(id,b.id)))continue;
    const same=set.has(b.id),ringEnd=same&&ids.length>=3&&f14AttachDegree(id)===1&&f14AttachDegree(b.id)===1;
    if(same&&!ringEnd)continue;
    const m=f13ContactMetrics(a,b);if(ringEnd&&m.gap<m.startGap+6)m.visible=true;if(ringEnd&&m.gap<=m.ext*2+8&&m.gap>-14)m.touch=true;
    if(!m.visible)continue;const score=Math.max(0,m.gap)+(ringEnd?0:2)+Math.abs(m.gap)*.02;
    if(score<bestScore){bestScore=score;best={pair:{movedId:id,otherId:b.id},metrics:m,ringEnd}}
  }}return best;
};

// ---------- geometry helpers for exact overlap ----------
function f15PointLinkDistance(l,p,steps=150){
  let best=Infinity,prev=quadPoint(l,0);for(let i=1;i<=steps;i++){const cur=quadPoint(l,i/steps),h=pointSegClosest(p,prev,cur);if(h.d<best)best=h.d;prev=cur}return best;
}
function f15InsideLowerLink(upper,lower,t){const p=quadPoint(upper,t);return f15PointLinkDistance(lower,p,120)<=linkWidth(lower)/2+1.25}
function f15RefineTransition(upper,lower,a,b,wantInside){
  let lo=a,hi=b;for(let i=0;i<9;i++){const mid=(lo+hi)/2,inside=f15InsideLowerLink(upper,lower,mid);if(inside===wantInside)hi=mid;else lo=mid}return(lo+hi)/2;
}
function f15LinkLinkRanges(upper,lower){
  const runs=[];let start=null,prevInside=f15InsideLowerLink(upper,lower,0),prevT=0;if(prevInside)start=0;
  const steps=220;for(let i=1;i<=steps;i++){const t=i/steps,inside=f15InsideLowerLink(upper,lower,t);if(inside!==prevInside){const edge=f15RefineTransition(upper,lower,prevT,t,inside);if(inside)start=edge;else if(start!==null){if(edge-start>.0015)runs.push([start,edge]);start=null}}prevInside=inside;prevT=t}if(start!==null)runs.push([start,1]);
  // avoid endpoint/root self-nearness; separators are for overlap/crossing intervals.
  return runs.filter(([a,b])=>b>.025&&a<.975).map(([a,b])=>[Math.max(.02,a),Math.min(.98,b)]).filter(([a,b])=>b-a>.0015);
}
function f15RangeArcLength(l,t0,t1,steps=80){let len=0,prev=quadPoint(l,t0);for(let i=1;i<=steps;i++){const p=quadPoint(l,t0+(t1-t0)*i/steps);len+=dist(prev.x,prev.y,p.x,p.y);prev=p}return len}
function f15RangePath(l,t0,t1){const len=f15RangeArcLength(l,t0,t1,40),steps=Math.max(5,Math.min(40,Math.ceil(len/4)));return sampledLinkSegment(l,t0,t1,steps)}

// Draw links without the old angle-based approximate separator.
renderLinks=function(fast=false){
  f14NormalizeLinkZ();linksLayer.replaceChildren();mergeLayer.replaceChildren();
  const ordered=[...links].sort((a,b)=>f14ObjectZ(a,"link")-f14ObjectZ(b,"link")||((a.seq??0)-(b.seq??0)));
  for(const l of ordered){for(const rp of linkRootPaths(l))linksLayer.appendChild(sEl("path",{d:rp.d,fill:"#f0c867","data-link-z":f14ObjectZ(l,"link")}));linksLayer.appendChild(sEl("path",{d:linkPath(l),class:"link-body","stroke-width":linkWidth(l),"data-link-z":f14ObjectZ(l,"link")}))}
  for(const m of attachments){const e=mergeBridge(m,false);if(e)mergeLayer.appendChild(e)}
};

const f15ZTopLayer=(()=>{let g=document.getElementById("zTopLayer");if(!g){g=sEl("g",{id:"zTopLayer"});nodesLayer.parentNode.insertBefore(g,hiddenLayer)}return g})();
function f15RenderZBoundaries(){
  f14NormalizeLinkZ();overlapLayer.replaceChildren();f15ZTopLayer.replaceChildren();
  const ordered=[...links].sort((a,b)=>f14ObjectZ(a,"link")-f14ObjectZ(b,"link")||((a.seq??0)-(b.seq??0)));
  // Link over link: separator length is the exact interval whose centerline sits over the lower hose body.
  for(let i=1;i<ordered.length;i++){const upper=ordered[i];for(let j=0;j<i;j++){const lower=ordered[j];for(const [t0,t1] of f15LinkLinkRanges(upper,lower)){const d=f15RangePath(upper,t0,t1);overlapLayer.appendChild(sEl("path",{d,fill:"none",stroke:F15_BG,"stroke-width":linkWidth(upper)+5,"stroke-linecap":"butt","data-z-boundary":"link-link-gap","data-lower":lower.id}))}}}
  // Link over node must be physically above the node layer, so redraw only the overlap interval in zTopLayer.
  for(const l of links){const lz=f14ObjectZ(l,"link");for(const n of nodes){if(l.a===n.id||l.b===n.id||f14ObjectZ(n,"node")>=lz)continue;for(const [t0,t1] of linkNodeOverlapRanges(l,n)){const d=f15RangePath(l,t0,t1);f15ZTopLayer.appendChild(sEl("path",{d,fill:"none",stroke:F15_BG,"stroke-width":linkWidth(l)+5,"stroke-linecap":"butt","data-z-boundary":"link-node-gap"}));f15ZTopLayer.appendChild(sEl("path",{d,fill:"none",stroke:"#f0c867","stroke-width":linkWidth(l),"stroke-linecap":"round","data-z-boundary":"link-node-top"}))}}}
}
renderOverlapEdges=f15RenderZBoundaries;

// ---------- node rendering: z-stable + overlap arc only ----------
function f15DecorateNodeOverlap(n,g){
  if(!n||!g)return;g.querySelectorAll('[data-upper-rim="1"],[data-overlap-rim]').forEach(e=>e.remove());const nz=f14ObjectZ(n,"node");
  for(const lower of nodes){if(lower.id===n.id||f14ObjectZ(lower,"node")>=nz)continue;const arc=circleOverlapArc(n,lower);if(arc&&!arc.full)g.appendChild(sEl("path",{d:arc.d,fill:"none",stroke:F15_BOUNDARY,"stroke-width":3,"stroke-linecap":"round","data-overlap-rim":"node-node"}))}
  for(const l of links){if(f14ObjectZ(l,"link")>=nz)continue;for(const d of f14CircleArcRuns(n,p=>f15PointLinkDistance(l,p,90)<=linkWidth(l)/2+2.4,220))g.appendChild(sEl("path",{d,fill:"none",stroke:F15_BOUNDARY,"stroke-width":3,"stroke-linecap":"round","data-overlap-rim":"node-link"}))}
}
renderNodes=function(){
  nodesLayer.replaceChildren();const hidden=hiddenNodeMap();for(const n of sortedNodes()){
    const g=sEl("g",{"data-id":n.id}),blob=sEl("path",{d:circlePath(n.x,n.y,n.r),class:"node"});g.appendChild(blob);
    if(!hidden.has(n.id)){const text=sEl("text",{x:n.x,y:n.y,class:"label","font-size":Math.max(15,Math.min(22,n.r*.34))});text.textContent=n.label;g.appendChild(text)}
    nodesLayer.appendChild(g);f15DecorateNodeOverlap(n,g);
  }
};
renderNodesFast=renderNodes;

// ---------- all tools: double tap/click repeat mode ----------
function f15ToolPairs(){return[[selectBtn,"select"],[eraseBtn,"erase"],[newBtn,"new"],[document.getElementById("linkBtn"),"link"],[document.getElementById("detachBtn"),"detach"]]}
function f15RefreshTools(){for(const[b,t]of f15ToolPairs()){if(!b)continue;b.classList.toggle("active",pcTool===t);b.classList.toggle("held",f15HeldTool===t);b.setAttribute("aria-pressed",f15HeldTool===t?"true":"false")}}
function f15SetHeldTool(tool){f15HeldTool=tool||null;if(f15HeldTool)pcTool=f15HeldTool;else if(pcTool&&f15ToolPairs().some(([,t])=>t===pcTool))pcTool=null;f15RefreshTools();return f15HeldTool}
clearOneShotTool=function(){if(f15HeldTool){pcTool=f15HeldTool;f15RefreshTools();return}pcTool=null;f15RefreshTools()};
setPcTool=function(tool,force=false){
  if(f15HeldTool&&f15HeldTool!==tool)f15HeldTool=null;pcTool=force?tool:(pcTool===tool?null:tool);f15RefreshTools();statusText(pcTool==="select"?"選択：投げ縄":pcTool==="new"?"新規丸":pcTool==="erase"?"消しゴム":pcTool==="link"?"紐付け":pcTool==="detach"?"分離":"通常操作");
};
for(const [b,tool] of f15ToolPairs())if(b){
  b.addEventListener("pointerup",evt=>{const now=performance.now(),prev=f15LastTap.get(tool)||0;if(f15HeldTool===tool&&now-prev>420){evt.preventDefault();evt.stopImmediatePropagation();f15SetHeldTool(null);statusText(`${b.getAttribute("aria-label")||tool}：連続解除`);f15LastTap.set(tool,0);return}if(now-prev<=420){evt.preventDefault();evt.stopImmediatePropagation();f15SetHeldTool(tool);statusText(`${b.getAttribute("aria-label")||tool}：連続モード`);f15LastTap.set(tool,0);return}f15LastTap.set(tool,now)},{capture:true,passive:false});
}
controls?.addEventListener("dblclick",evt=>{evt.preventDefault();evt.stopImmediatePropagation()},{capture:true});

// ---------- larger safe fit ----------
fitAll=function(){
  if(!nodes.length)return;let minX=Infinity,minY=Infinity,maxX=-Infinity,maxY=-Infinity;
  for(const n of nodes){minX=Math.min(minX,n.x-n.r);maxX=Math.max(maxX,n.x+n.r);minY=Math.min(minY,n.y-n.r);maxY=Math.max(maxY,n.y+n.r)}
  for(const l of links)for(let i=0;i<=36;i++){const p=quadPoint(l,i/36),r=linkWidth(l)/2;minX=Math.min(minX,p.x-r);maxX=Math.max(maxX,p.x+r);minY=Math.min(minY,p.y-r);maxY=Math.max(maxY,p.y+r)}
  const pad={l:24,r:24,t:50,b:30},iw=1000-pad.l-pad.r,ih=700-pad.t-pad.b,w=Math.max(60,maxX-minX),h=Math.max(60,maxY-minY),s=clamp(Math.min(iw/w,ih/h),VIEW_MIN,2.8);
  view.scale=s;view.x=pad.l+(iw-w*s)/2-minX*s;view.y=pad.t+(ih-h*s)/2-minY*s;applyView();renderAll();statusText("全体表示");
};
// Override earlier capture handlers by adding an even later capture listener on the button itself.
for(const type of["pointerdown","pointerup","click"]){fitBtn.addEventListener(type,evt=>{evt.preventDefault();evt.stopImmediatePropagation();if(type==="pointerup")fitAll()},{capture:true})}

// ---------- final render wrappers ----------
renderAll=function(){
  if(renderRAF){cancelAnimationFrame(renderRAF);renderRAF=0}shadowLayer.style.display="";overlapLayer.style.display="";hiddenLayer.style.display="";renderShadow();renderLinks(false);renderNodes();f15RenderZBoundaries();renderHidden();renderUI();
};
renderMotionNow=function(){shadowLayer.style.display="none";hiddenLayer.style.display="";renderLinks(true);renderNodes();f15RenderZBoundaries();renderHidden();renderUI()};

window.__mochiFix15Test={
  budMetrics:f13ContactMetrics,budPath:f13BudPath,neckProfile:f13NeckProfile,bestApproach:f13BestApproach,
  boundaryColor:F15_BOUNDARY,decorateNodeOverlap:f15DecorateNodeOverlap,linkLinkRanges:f15LinkLinkRanges,rangeArcLength:f15RangeArcLength,boundaries:f15RenderZBoundaries,
  setHeldTool:f15SetHeldTool,getHeldTool:()=>f15HeldTool,pointLinkDistance:f15PointLinkDistance
};
statusText=function(t){status.innerHTML=`餅マップ v0.9.4<br>BUILD ${F15_BUILD}<br>${t}`};statusText("待機中");
