"use strict";
// v0.9.4 FIX14
// - links get persistent z values; overlap boundaries are drawn only on the actually overlapped interval
// - upper circles keep a darker overlap rim; lower labels are naturally occluded by z order
// - smaller stick-less attachment buds, larger smooth attachment necks
// - safer Pencil micro-slip / detach gestures
// - detach only works on true attachments and moves only enough to peel apart
// - repeated erase/detach lock, temporary lasso selection, compact fit-all

const F14_BUILD="0911-FIX14";
const F14_BOUNDARY="#7d6d52";
const F14_BG="#f7f4ed";
const F14_DETACH_GAP=7;
let f14HeldTool=null;

function f14ObjectZ(o,type){
  if(type==="node")return o.z??0;
  if(o.z==null){const A=nodeById(o.a),B=nodeById(o.b);o.z=Math.max(0,Math.min(A?.z??0,B?.z??0)+(o.seq??0)*.001+.25)}
  return o.z;
}
function f14NormalizeLinkZ(){for(const l of links)f14ObjectZ(l,"link")}

// --- attachment buds: small tip like a hose end; large root blend, no stem ---
f13ContactMetrics=function(a,b){
  if(!a||!b)return{visible:false,touch:false,strength:0,gap:Infinity,tipA:null,tipB:null};
  const d=Math.max(.001,dist(a.x,a.y,b.x,b.y)),u=unit(b.x-a.x,b.y-a.y),gap=d-a.r-b.r,minR=Math.min(a.r,b.r);
  const startGap=clamp(minR*.34,20,32),strength=f13Smooth(clamp((startGap-gap)/startGap,0,1));
  const maxExt=clamp(minR*.13,8,14),ext=maxExt*strength,half=clamp(LIVE_END_WIDTH*.42,9,13)*strength;
  const tipA={x:a.x+u.x*(a.r+ext),y:a.y+u.y*(a.r+ext)},tipB={x:b.x-u.x*(b.r+ext),y:b.y-u.y*(b.r+ext)};
  return{visible:gap<startGap&&gap>-14,touch:gap<=ext*2+2&&gap>-14,strength,gap,startGap,ext,half,u,tipA,tipB};
};
f13BudPath=function(n,toward,m){
  if(!n||!m||m.strength<=.01)return null;
  const u=unit(toward.x-n.x,toward.y-n.y),v={x:-u.y,y:u.x};
  const tipR=Math.max(1,m.half),rootHalf=clamp(tipR*2.15,tipR+3,Math.min(n.r*.42,30))*m.strength;
  const x0=Math.sqrt(Math.max(1,n.r*n.r-rootHalf*rootHalf)),noseX=n.r+m.ext;
  const W=(x,y)=>({x:n.x+u.x*x+v.x*y,y:n.y+u.y*x+v.y*y});
  const top=W(x0,rootHalf),bot=W(x0,-rootHalf),nose=W(noseX,0);
  const kRoot=Math.max(5,rootHalf*.82),kNose=Math.max(3,tipR*.72);
  const c1=W(x0+kRoot,rootHalf*.66),c2=W(noseX-kNose,tipR),c3=W(noseX-kNose,-tipR),c4=W(x0+kRoot,-rootHalf*.66);
  return`M ${top.x} ${top.y} C ${c1.x} ${c1.y} ${c2.x} ${c2.y} ${nose.x} ${nose.y} C ${c3.x} ${c3.y} ${c4.x} ${c4.y} ${bot.x} ${bot.y} Z`;
};

// Smooth, large pon-de-ring style waist; shoulders stay tangent and do not make side bumps.
f13NeckProfile=function(m,boost=0){
  const A=nodeById(m.a),B=nodeById(m.b),minR=Math.min(A?.r||0,B?.r||0);
  const finalShoulder=clamp(minR*.78,34,minR*.86),startShoulder=clamp(minR*.82,finalShoulder+2,minR*.89);
  const finalWaist=clamp(minR*.65,26,minR*.72),startWaist=clamp(minR*.70,finalWaist+3,minR*.76);
  return{shoulder:finalShoulder+(startShoulder-finalShoulder)*boost,waist:finalWaist+(startWaist-finalWaist)*boost,minR};
};
f13MergeBlobPath=function(m,boost=0){
  const a=nodeById(m.a),b=nodeById(m.b);if(!a||!b)return null;
  const D=Math.max(.001,dist(a.x,a.y,b.x,b.y)),u=unit(b.x-a.x,b.y-a.y),v={x:-u.y,y:u.x},pr=f13NeckProfile(m,boost);
  const shA=Math.min(pr.shoulder,a.r*.90),shB=Math.min(pr.shoulder,b.r*.90),xA=Math.sqrt(Math.max(1,a.r*a.r-shA*shA)),xB=Math.sqrt(Math.max(1,b.r*b.r-shB*shB));
  const W=(x,y)=>({x:a.x+u.x*x+v.x*y,y:a.y+u.y*x+v.y*y}),ax=xA,bx=D-xB,mx=(ax+bx)/2;
  const At=W(ax,shA),Ab=W(ax,-shA),Bt=W(bx,shB),Bb=W(bx,-shB),Wt=W(mx,pr.waist),Wb=W(mx,-pr.waist);
  const s1=Math.max(3,mx-ax),s2=Math.max(3,bx-mx),C=(p,du)=>({x:p.x+u.x*du,y:p.y+u.y*du});
  const a1=.78,a2=.60;
  return`M ${At.x} ${At.y} C ${C(At,s1*a1).x} ${C(At,s1*a1).y} ${C(Wt,-s1*a2).x} ${C(Wt,-s1*a2).y} ${Wt.x} ${Wt.y} C ${C(Wt,s2*a2).x} ${C(Wt,s2*a2).y} ${C(Bt,-s2*a1).x} ${C(Bt,-s2*a1).y} ${Bt.x} ${Bt.y} L ${Bb.x} ${Bb.y} C ${C(Bb,-s2*a1).x} ${C(Bb,-s2*a1).y} ${C(Wb,s2*a2).x} ${C(Wb,s2*a2).y} ${Wb.x} ${Wb.y} C ${C(Wb,-s1*a2).x} ${C(Wb,-s1*a2).y} ${C(Ab,s1*a1).x} ${C(Ab,s1*a1).y} ${Ab.x} ${Ab.y} Z`;
};

// --- z-aware link rendering ---
renderLinks=function(fast=false){
  f14NormalizeLinkZ();linksLayer.replaceChildren();mergeLayer.replaceChildren();
  const ordered=[...links].sort((a,b)=>f14ObjectZ(a,"link")-f14ObjectZ(b,"link")||((a.seq??0)-(b.seq??0)));
  for(let i=0;i<ordered.length;i++){
    const l=ordered[i];
    if(!fast)for(let j=0;j<i;j++){
      const lower=ordered[j];
      for(const hit of linkCrossings(l,lower)){
        const fullLen=clamp((linkWidth(lower)+3)/Math.max(hit.sin,.28),linkWidth(lower)+3,(linkWidth(lower)+3)*2.2);
        linksLayer.appendChild(sEl("path",{d:localLinkSegment(l,hit.t,fullLen),fill:"none",stroke:F14_BG,"stroke-width":linkWidth(l)+5,"stroke-linecap":"butt","stroke-linejoin":"round","data-z-boundary":"link-link"}));
      }
    }
    for(const rp of linkRootPaths(l))linksLayer.appendChild(sEl("path",{d:rp.d,fill:"#f0c867","data-link-z":f14ObjectZ(l,"link")}));
    linksLayer.appendChild(sEl("path",{d:linkPath(l),class:"link-body","stroke-width":linkWidth(l),"data-link-z":f14ObjectZ(l,"link")}));
  }
  for(const m of attachments){const e=mergeBridge(m,false);if(e)mergeLayer.appendChild(e)}
};

function f14PointLinkDistance(l,p){
  let best=Infinity;for(let i=0;i<=80;i++){const q=quadPoint(l,i/80);best=Math.min(best,dist(p.x,p.y,q.x,q.y))}return best;
}
function f14CircleArcRuns(n,test,steps=180){
  const runs=[];let pts=[];for(let i=0;i<=steps;i++){
    const a=-Math.PI+2*Math.PI*i/steps,p={x:n.x+Math.cos(a)*(n.r+1.8),y:n.y+Math.sin(a)*(n.r+1.8)},inside=test(p);
    if(inside)pts.push(p);else if(pts.length){if(pts.length>1)runs.push(pts);pts=[]}
  }if(pts.length>1)runs.push(pts);return runs.map(ps=>ps.map((p,i)=>(i?`L ${p.x} ${p.y}`:`M ${p.x} ${p.y}`)).join(" "));
}
function f14UpperNodeHasLower(n){
  const nz=f14ObjectZ(n,"node");
  for(const o of nodes){if(o.id!==n.id&&f14ObjectZ(o,"node")<nz&&dist(n.x,n.y,o.x,o.y)<n.r+o.r)return true}
  for(const l of links){if(f14ObjectZ(l,"link")<nz&&f14CircleArcRuns(n,p=>f14PointLinkDistance(l,p)<=linkWidth(l)/2+3,72).length)return true}
  return false;
}
function f14RenderZBoundaries(){
  f14NormalizeLinkZ();overlapLayer.replaceChildren();
  // Node over node: only the upper circumference that is physically over the lower circle.
  for(const upper of nodes){const uz=f14ObjectZ(upper,"node");for(const lower of nodes){if(upper.id===lower.id||f14ObjectZ(lower,"node")>=uz)continue;const arc=circleOverlapArc(upper,lower);if(arc&&!arc.full)overlapLayer.appendChild(sEl("path",{d:arc.d,fill:"none",stroke:F14_BOUNDARY,"stroke-width":3,"stroke-linecap":"round","data-z-boundary":"node-node"}))}}
  // Node over link: dark rim only on the arc whose outside actually sits over that lower link.
  for(const n of nodes){const nz=f14ObjectZ(n,"node");for(const l of links){if(f14ObjectZ(l,"link")>=nz)continue;for(const d of f14CircleArcRuns(n,p=>f14PointLinkDistance(l,p)<=linkWidth(l)/2+4))overlapLayer.appendChild(sEl("path",{d,fill:"none",stroke:F14_BOUNDARY,"stroke-width":3,"stroke-linecap":"round","data-z-boundary":"node-link"}))}}
  // Link over node: redraw only its overlapped interval above the circle with a narrow background separator.
  for(const l of links){const lz=f14ObjectZ(l,"link");for(const n of nodes){if(f14ObjectZ(n,"node")>=lz||l.a===n.id||l.b===n.id)continue;for(const [t0,t1] of linkNodeOverlapRanges(l,n)){const d=sampledLinkSegment(l,t0,t1,18);overlapLayer.appendChild(sEl("path",{d,fill:"none",stroke:F14_BG,"stroke-width":linkWidth(l)+5,"stroke-linecap":"butt","data-z-boundary":"link-node-gap"}));overlapLayer.appendChild(sEl("path",{d,fill:"none",stroke:"#f0c867","stroke-width":linkWidth(l),"stroke-linecap":"round","data-z-boundary":"link-node-top"}))}}}
}
const f14RenderOverlapPrev=renderOverlapEdges;
renderOverlapEdges=f14RenderZBoundaries;

// Keep an upper overlapping circle visually explicit with a dark outer contour.
const f14RenderNodesPrev=renderNodes;
renderNodes=function(){
  f14RenderNodesPrev();for(const n of nodes){if(!f14UpperNodeHasLower(n))continue;const g=nodesLayer.querySelector(`[data-id="${n.id}"]`);if(g)g.appendChild(sEl("path",{d:circlePath(n.x,n.y,n.r),fill:"none",stroke:F14_BOUNDARY,"stroke-width":2.4,"data-upper-rim":"1"}))}
};
const f14RenderNodesFastPrev=typeof renderNodesFast==="function"?renderNodesFast:null;
if(f14RenderNodesFastPrev)renderNodesFast=function(){f14RenderNodesFastPrev();for(const n of nodes){if(!f14UpperNodeHasLower(n))continue;const g=nodesLayer.querySelector(`[data-id="${n.id}"]`);if(g)g.appendChild(sEl("path",{d:circlePath(n.x,n.y,n.r),fill:"none",stroke:F14_BOUNDARY,"stroke-width":2.4,"data-upper-rim":"1"}))}};

// Hidden geometry: circle/circle is explained by z boundary; hoses hidden by upper circles retain dashed sides/root R.
const f14HiddenPrev=renderHidden;
renderHidden=function(){f14HiddenPrev();for(const p of hiddenLayer.querySelectorAll("path")){if(p.getAttribute("data-hidden-node"))p.remove()}};

// Pencil micro-slip must never become an accidental detach stroke.
const f14FindMergeCutPrev=typeof findMergeCut==="function"?findMergeCut:null;
if(f14FindMergeCutPrev)findMergeCut=function(pts){
  if(!pts||pts.length<2)return null;let len=0;for(let i=1;i<pts.length;i++)len+=dist(pts[i-1].x,pts[i-1].y,pts[i].x,pts[i].y);
  const first=pts[0],startNode=nodes.find(n=>dist(first.x,first.y,n.x,n.y)<n.r-5);
  if(startNode||len<38/view.scale)return null;return f14FindMergeCutPrev(pts);
};

// True detach only: peel the selected attached circle slightly away. Never launch unrelated circles.
_separateBuriedNode=function(n,p){
  if(!n)return false;const seams=directAttachmentsOf(n.id);if(!seams.length){statusText("分離：この丸は接着していません");return false}
  let best=seams[0],bestD=Infinity;for(const m of seams){const other=nodeById(m.a===n.id?m.b:m.a);if(!other)continue;const d=p?dist(p.x,p.y,(n.x+other.x)/2,(n.y+other.y)/2):0;if(d<bestD){bestD=d;best=m}}
  const other=nodeById(best.a===n.id?best.b:best.a);for(let i=attachments.length-1;i>=0;i--)if(attachments[i].id===best.id||pairKey(attachments[i].a,attachments[i].b)===pairKey(best.a,best.b)){attachments.splice(i,1);break}
  if(other){const u=unit(n.x-other.x,n.y-other.y),target=n.r+other.r+F14_DETACH_GAP,d=dist(n.x,n.y,other.x,other.y),shift=Math.max(0,target-d);n.x+=u.x*shift;n.y+=u.y*shift}
  crossPairs.clear();selected={type:"node",id:n.id};renderAll();commitHistory();statusText("分離：少しだけ剥がしました");return true;
};

// Tool lock: double click erase/detach/new/link/select keeps it active; one-shot keeps previous behavior.
const f14ClearPrev=clearOneShotTool;
clearOneShotTool=function(){
  if(f14HeldTool){pcTool=f14HeldTool;for(const [b,t]of [[selectBtn,"select"],[eraseBtn,"erase"],[newBtn,"new"],[document.getElementById("linkBtn"),"link"],[document.getElementById("detachBtn"),"detach"]])b?.classList.toggle("active",t===f14HeldTool);return}
  f14ClearPrev();
};
for(const [id,tool] of [["newBtn","new"],["selectBtn","select"],["eraseBtn","erase"],["linkBtn","link"],["detachBtn","detach"]]){
  const b=document.getElementById(id);if(!b)continue;b.addEventListener("dblclick",e=>{e.preventDefault();e.stopImmediatePropagation();f14HeldTool=f14HeldTool===tool?null:tool;setPcTool(tool,true);b.classList.toggle("held",f14HeldTool===tool);statusText(f14HeldTool?`${b.title||tool}：連続モード`:`${b.title||tool}：1回モード`)},{capture:true});
}
document.addEventListener("keydown",e=>{if(e.key==="Escape"){f14HeldTool=null;f13SelectedIds?.clear?.();f13Lasso=null;f13GroupDrag=null;f14ClearPrev();renderUI();statusText("選択・連続モード解除")}});

// Lasso is temporary: blank tap or leaving Select clears the multi-selection.
svg.addEventListener("pointerdown",evt=>{if(pcTool!=="select"&&f13SelectedIds?.size){f13SelectedIds.clear();f13Lasso=null;f13GroupDrag=null;renderUI()}else if(pcTool==="select"){const p=eventToWorld(evt),t=targetAtWorld(p);if(!t&&f13SelectedIds?.size){f13SelectedIds.clear();f13Lasso=null;f13GroupDrag=null;renderUI();statusText("複数選択解除")}}},{capture:true,passive:false});

// Fit as large as possible while keeping only a practical safe margin.
fitAll=function(){
  if(!nodes.length)return;let minX=Infinity,minY=Infinity,maxX=-Infinity,maxY=-Infinity;
  for(const n of nodes){minX=Math.min(minX,n.x-n.r);maxX=Math.max(maxX,n.x+n.r);minY=Math.min(minY,n.y-n.r);maxY=Math.max(maxY,n.y+n.r)}
  for(const l of links)for(let i=0;i<=28;i++){const p=quadPoint(l,i/28),r=linkWidth(l)/2;minX=Math.min(minX,p.x-r);maxX=Math.max(maxX,p.x+r);minY=Math.min(minY,p.y-r);maxY=Math.max(maxY,p.y+r)}
  const marginX=38,marginTop=58,marginBottom=42,w=Math.max(80,maxX-minX),h=Math.max(80,maxY-minY),availW=1000-marginX*2,availH=700-marginTop-marginBottom;
  const s=clamp(Math.min(availW/w,availH/h),VIEW_MIN,2.45),cx=(minX+maxX)/2,cy=(minY+maxY)/2;
  view.scale=s;view.x=500-cx*s;view.y=marginTop+(availH-h*s)/2-minY*s;applyView();renderAll();statusText("全体表示")
};

// Ensure every render has z-aware boundaries even in motion.
const f14RenderAllPrev=renderAll;
renderAll=function(){f14NormalizeLinkZ();f14RenderAllPrev();f14RenderZBoundaries()};
renderMotionNow=function(){shadowLayer.style.display="none";hiddenLayer.style.display="";renderLinks(true);renderNodesFast();renderHidden();f14RenderZBoundaries();renderUI()};

window.__mochiFix14Test={
  objectZ:f14ObjectZ,normalizeLinkZ:f14NormalizeLinkZ,boundaries:f14RenderZBoundaries,pointLinkDistance:f14PointLinkDistance,
  detach:_separateBuriedNode,budMetrics:f13ContactMetrics,budPath:f13BudPath,neckProfile:f13NeckProfile
};
statusText=function(t){status.innerHTML=`餅マップ v0.9.4<br>BUILD ${F14_BUILD}<br>${t}`};
statusText("待機中");
