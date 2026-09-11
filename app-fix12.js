"use strict";
// v0.9.4 FIX12
// - circle/circle overlap stays geometry-only (no persistent crossing state)
// - mutual center-line "hiyoko" buds preview attachment; release while tips meet = attach
// - continuing through the preview = plain overlap, never attachment
// - only the moved side settles to the fixed attachment distance
// - attachment neck becomes a smooth, large-R mochi / pon-de-ring blend
// - circle/circle hidden dashes are removed; hidden hose sides + root-R remain dashed
// - a directly attached sibling never creates internal hidden hose dashes
// - single-seam resize keeps the attached face fixed and grows outward
// - top icon toolbar; one-shot detach tool

const detachBtn=document.getElementById("detachBtn");
const F12_BYPASS_DEPTH=14;
const F12_ATTACH_MS=190;
let f12AttachRAF=0,f12AttachAnim=null;

function f12Smooth(t){t=clamp(t,0,1);return t*t*(3-2*t)}
function f12ContactMetrics(a,b){
  if(!a||!b)return{visible:false,touch:false,strength:0,tipA:null,tipB:null,width:0,ext:0,gap:Infinity};
  const d=Math.max(.001,dist(a.x,a.y,b.x,b.y)),u=unit(b.x-a.x,b.y-a.y),gap=d-a.r-b.r;
  const maxWidth=clamp(Math.min(a.r,b.r)*.50,34,56),startGap=clamp(maxWidth*2.6,88,132),raw=clamp((startGap-gap)/startGap,0,1),strength=f12Smooth(raw);
  const width=maxWidth*(.45+.55*strength),ext=maxWidth*.38*strength;
  const tipA={x:a.x+u.x*(a.r+ext),y:a.y+u.y*(a.r+ext)},tipB={x:b.x-u.x*(b.r+ext),y:b.y-u.y*(b.r+ext)};
  const tipDistance=dist(tipA.x,tipA.y,tipB.x,tipB.y),visible=gap<startGap&&gap>-F12_BYPASS_DEPTH;
  return{visible,touch:visible&&tipDistance<=width+1.5,strength,width,ext,gap,startGap,tipDistance,tipA,tipB,u};
}
function f12Bud(n,toward,tip,m,side){
  const g=sEl("g",{"data-bud":side,opacity:clamp(.18+m.strength*.82,.18,1)}),dir={x:toward.x-n.x,y:toward.y-n.y},rootProgress=clamp(.18+m.strength*1.05,0,1),rootD=rootPatchPath(n,dir,m.width,rootProgress);
  if(rootD)g.appendChild(sEl("path",{d:rootD,fill:"#f0c867"}));
  g.appendChild(sEl("path",{d:`M ${n.x} ${n.y} L ${tip.x} ${tip.y}`,fill:"none",stroke:"#f0c867","stroke-width":m.width,"stroke-linecap":"round"}));
  g.appendChild(sEl("circle",{cx:tip.x,cy:tip.y,r:m.width/2,fill:"#f0c867"}));
  return g;
}
function f12ClearContactPreview(){liveLayer.querySelector("#f12ContactPreview")?.remove()}
function f12RenderContactPreview(aId,bId){
  const a=nodeById(aId),b=nodeById(bId);f12ClearContactPreview();if(!a||!b)return null;
  const m=f12ContactMetrics(a,b);if(!m.visible)return m;
  const g=sEl("g",{id:"f12ContactPreview","data-ready":m.touch?"1":"0"});
  g.append(f12Bud(a,b,m.tipA,m,"a"),f12Bud(b,a,m.tipB,m,"b"));liveLayer.appendChild(g);return m;
}
function f12PairGap(a,b){return dist(a.x,a.y,b.x,b.y)-a.r-b.r}
function f12UpdateBypass(g){
  const set=new Set(g.compIds);if(!g.bypassPairs)g.bypassPairs=new Set();
  for(const id of g.compIds){const a=nodeById(id);if(!a)continue;for(const b of nodes){if(set.has(b.id)||directAttached(id,b.id))continue;if(f12PairGap(a,b)<-F12_BYPASS_DEPTH)g.bypassPairs.add(pairKey(id,b.id))}}
}
function f12BestApproach(g){
  const set=new Set(g.compIds),skip=g.bypassPairs||new Set();let best=null,bestScore=Infinity;
  for(const id of g.compIds){const a=nodeById(id);if(!a)continue;for(const b of nodes){
    if(set.has(b.id)||directAttached(id,b.id)||skip.has(pairKey(id,b.id)))continue;
    const m=f12ContactMetrics(a,b);if(!m.visible)continue;const score=Math.max(0,m.tipDistance-m.width)+Math.abs(m.gap)*.02;
    if(score<bestScore){bestScore=score;best={pair:{movedId:id,otherId:b.id},metrics:m}}
  }}
  return best;
}

updateMoveGesture=function(g,p){
  const last=g.points.at(-1);if(!last||dist(last.x,last.y,p.x,p.y)>=2/view.scale)g.points.push(p);
  const dx=p.x-g.start.x,dy=p.y-g.start.y;setMovePositions(g,dx,dy,1);f12UpdateBypass(g);
  const best=f12BestApproach(g);g.contactPair=null;
  if(best){
    const m=f12RenderContactPreview(best.pair.movedId,best.pair.otherId);
    if(m?.touch){g.contactPair=best.pair;const readyKey=pairKey(best.pair.movedId,best.pair.otherId);if(g.f12ReadyKey!==readyKey){g.f12ReadyKey=readyKey;try{navigator.vibrate?.(8)}catch(_e){}}statusText("迎え半円が接触：離す＝くっつく / そのまま進む＝重なる")}
    else{g.f12ReadyKey=null;statusText("丸同士が迎えています")}
  }else{g.f12ReadyKey=null;f12ClearContactPreview();statusText("丸移動")}
  crossPairs.clear();scheduleMotionRender();
};

function f12ApplyAnchoredResize(n,newR,neighbor){
  if(!n)return;newR=clamp(newR,MIN_R,MAX_R);const oldR=n.r;
  if(!neighbor){n.r=newR;return}
  const u=unit(n.x-neighbor.x,n.y-neighbor.y),delta=newR-oldR;n.r=newR;n.x+=u.x*delta;n.y+=u.y*delta;
}
const f12PenMovePrevious=penMove;
penMove=function(evt){
  if(!gesture||evt.pointerId!==gesture.pointerId||gesture.mode!=="resize")return f12PenMovePrevious(evt);
  evt.preventDefault();const p=eventToWorld(evt),n=nodeById(gesture.nodeId);if(!n)return;gesture.last=p;
  if(!gesture.f12ResizeBase){const seams=directAttachmentsOf(n.id),neighbor=seams.length===1?nodeById(seams[0].a===n.id?seams[0].b:seams[0].a):null;gesture.f12ResizeBase={x:n.x,y:n.y,r:gesture.startR??n.r,neighborId:neighbor?.id||null,startDist:gesture.resizeStartDist??dist(n.x,n.y,p.x,p.y)}}
  const b=gesture.f12ResizeBase,cur=dist(b.x,b.y,p.x,p.y),newR=clamp(b.r+(cur-b.startDist),MIN_R,MAX_R);n.x=b.x;n.y=b.y;n.r=b.r;f12ApplyAnchoredResize(n,newR,b.neighborId?nodeById(b.neighborId):null);
  scheduleMotionRender();statusText(`サイズ変更：半径 ${Math.round(n.r)}${b.neighborId?"（接着面固定）":""}`);
};

function f12MergeBlobPath(m,boost=0){
  const a=nodeById(m.a),b=nodeById(m.b);if(!a||!b)return null;const D=Math.max(.001,dist(a.x,a.y,b.x,b.y)),u=unit(b.x-a.x,b.y-a.y),v={x:-u.y,y:u.x},minR=Math.min(a.r,b.r);
  const finalShoulder=clamp(minR*.56,24,minR*.68),startShoulder=clamp(minR*.68,finalShoulder+4,minR*.78),shoulder=finalShoulder+(startShoulder-finalShoulder)*boost;
  const finalWaist=clamp(minR*.40,18,minR*.50),startWaist=clamp(minR*.56,finalWaist+5,minR*.64),waist=finalWaist+(startWaist-finalWaist)*boost;
  const shA=Math.min(shoulder,a.r*.82),shB=Math.min(shoulder,b.r*.82),xA=Math.sqrt(Math.max(1,a.r*a.r-shA*shA)),xB=Math.sqrt(Math.max(1,b.r*b.r-shB*shB));
  const W=(x,y)=>({x:a.x+u.x*x+v.x*y,y:a.y+u.y*x+v.y*y}),ax=xA,bx=D-xB,mx=(ax+bx)/2;
  const At=W(ax,shA),Ab=W(ax,-shA),Bt=W(bx,shB),Bb=W(bx,-shB),Wt=W(mx,waist),Wb=W(mx,-waist),s1=Math.max(4,mx-ax),s2=Math.max(4,bx-mx);
  const c=(p,du)=>({x:p.x+u.x*du,y:p.y+u.y*du});
  return`M ${At.x} ${At.y} C ${c(At,s1*.52).x} ${c(At,s1*.52).y} ${c(Wt,-s1*.42).x} ${c(Wt,-s1*.42).y} ${Wt.x} ${Wt.y} C ${c(Wt,s2*.42).x} ${c(Wt,s2*.42).y} ${c(Bt,-s2*.52).x} ${c(Bt,-s2*.52).y} ${Bt.x} ${Bt.y} L ${Bb.x} ${Bb.y} C ${c(Bb,-s2*.52).x} ${c(Bb,-s2*.52).y} ${c(Wb,s2*.42).x} ${c(Wb,s2*.42).y} ${Wb.x} ${Wb.y} C ${c(Wb,-s1*.42).x} ${c(Wb,-s1*.42).y} ${c(Ab,s1*.52).x} ${c(Ab,s1*.52).y} ${Ab.x} ${Ab.y} Z`;
}
mergeBridge=function(m,shadow=false){
  const key=pairKey(m.a,m.b),boost=f12AttachAnim&&f12AttachAnim.key===key?1-f12AttachAnim.progress:0,d=f12MergeBlobPath(m,boost);if(!d)return null;
  return sEl("path",{d,class:shadow?null:"merge-blob",fill:shadow?"#000":"#f0c867",stroke:"none"});
};

function f12AddSecondaryAttachments(g,pair,stationaryBefore){
  let count=0;for(const aId of g.compIds){const a=nodeById(aId);if(!a)continue;for(const bId of stationaryBefore){const b=nodeById(bId);if(!b||directAttached(aId,bId))continue;if(dist(a.x,a.y,b.x,b.y)<=a.r+b.r-CONTACT_EPS){if(addAttachment(aId,bId,g.nodeId))count++}}}return count;
}
function f12AttachShift(g,pair){
  const moved=nodeById(pair.movedId),other=nodeById(pair.otherId);if(!moved||!other)return null;const D=dist(moved.x,moved.y,other.x,other.y),targetD=moved.r+other.r-ATTACH_OVERLAP,u=unit(other.x-moved.x,other.y-moved.y),amount=D-targetD;return{u,amount,targetD,D};
}
function f12FinishAttachNow(g,pair){
  if(!g||!pair)return false;const shift=f12AttachShift(g,pair);if(!shift)return false;const stationaryBefore=componentIds(pair.otherId);
  for(const id of g.compIds){const q=nodeById(id);if(q){q.x+=shift.u.x*shift.amount;q.y+=shift.u.y*shift.amount}}
  let count=addAttachment(pair.movedId,pair.otherId,g.nodeId)?1:0;count+=f12AddSecondaryAttachments(g,pair,stationaryBefore);f12ClearContactPreview();crossPairs.clear();renderAll();statusText(count>1?`接着 ${count}か所（大きなRで融合）`:"丸どうしを接着（大きなRで融合）");return true;
}
function f12CancelAttachAnimation(){if(f12AttachRAF)cancelAnimationFrame(f12AttachRAF);f12AttachRAF=0;f12AttachAnim=null;if(gesture?.mode==="attachAnimating")gesture=null}
function f12StartAttachAnimation(g,pair){
  f12CancelAttachAnimation();const shift=f12AttachShift(g,pair);if(!shift){gesture=null;return false}const stationaryBefore=componentIds(pair.otherId),starts={};for(const id of g.compIds){const q=nodeById(id);if(q)starts[id]={x:q.x,y:q.y}}
  addAttachment(pair.movedId,pair.otherId,g.nodeId);f12ClearContactPreview();f12AttachAnim={key:pairKey(pair.movedId,pair.otherId),progress:0};gesture={pointerId:-1,mode:"attachAnimating"};
  const started=performance.now();function tick(now){const t=clamp((now-started)/F12_ATTACH_MS,0,1),e=1-Math.pow(1-t,3);for(const id of g.compIds){const q=nodeById(id),s=starts[id];if(q&&s){q.x=s.x+shift.u.x*shift.amount*e;q.y=s.y+shift.u.y*shift.amount*e}}f12AttachAnim.progress=t;renderAll();if(t<1){f12AttachRAF=requestAnimationFrame(tick);return}f12AttachRAF=0;f12AddSecondaryAttachments(g,pair,stationaryBefore);f12AttachAnim=null;gesture=null;crossPairs.clear();renderAll();commitHistory();statusText("接着：餅がなじみました")}
  renderAll();f12AttachRAF=requestAnimationFrame(tick);return true;
}

const f12PenEndPrevious=penEnd;
penEnd=function(evt){
  if(!gesture||evt.pointerId!==gesture.pointerId)return;
  if(gesture.mode!=="move")return f12PenEndPrevious(evt);
  evt.preventDefault();cancelHold();const g=gesture;clearContactTimer(g);
  if(movementLooksLikeXSlash(g)){f12ClearContactPreview();restoreMoveStart(g);gesture=null;renderAll();if(acceptXStroke(g.points,g.inputType))renderAll();return}
  if(g.contactPair){const pair={...g.contactPair};f12StartAttachAnimation(g,pair);return}
  f12ClearContactPreview();gesture=null;crossPairs.clear();renderAll();commitHistory();statusText("丸移動を確定（重なりは接着なし）");
};

function f12RootSideCurves(l,fromA){
  const n=nodeById(fromA?l.a:l.b),w=linkWidth(l);if(!n)return[];const target=n.r+clamp(w*.95,22,38),steps=80;let t=fromA?0:1,q={x:n.x,y:n.y};for(let i=1;i<=steps;i++){const tt=fromA?i/steps:1-i/steps,p=quadPoint(l,tt);q=p;t=tt;if(dist(n.x,n.y,p.x,p.y)>=target)break}
  let tan=quadTangent(l,t);if(!fromA)tan={x:-tan.x,y:-tan.y};const u=unit(tan.x,tan.y),v={x:-u.y,y:u.x},half=w/2,shoulder=clamp(w*1.28,half+6,Math.min(n.r*.58,w*1.45)),x0=Math.sqrt(Math.max(1,n.r*n.r-shoulder*shoulder));
  const P1={x:n.x+u.x*x0+v.x*shoulder,y:n.y+u.y*x0+v.y*shoulder},P2={x:n.x+u.x*x0-v.x*shoulder,y:n.y+u.y*x0-v.y*shoulder},Q1={x:q.x+v.x*half,y:q.y+v.y*half},Q2={x:q.x-v.x*half,y:q.y-v.y*half},tTop=unit(shoulder,-x0),tBot=unit(shoulder,x0),topWorld={x:u.x*tTop.x+v.x*tTop.y,y:u.y*tTop.x+v.y*tTop.y},botWorld={x:u.x*tBot.x+v.x*tBot.y,y:u.y*tBot.x+v.y*tBot.y},span=Math.max(18,dist(P1.x,P1.y,Q1.x,Q1.y)),k1=span*.48,k2=span*.34,C1={x:P1.x+topWorld.x*k1,y:P1.y+topWorld.y*k1},C2={x:Q1.x-u.x*k2,y:Q1.y-u.y*k2},C3={x:Q2.x-u.x*k2,y:Q2.y-u.y*k2},C4={x:P2.x+botWorld.x*k1,y:P2.y+botWorld.y*k1};
  return[{p0:P1,c1:C1,c2:C2,p3:Q1},{p0:P2,c1:C4,c2:C3,p3:Q2}];
}
function f12CubicPoint(c,t){const u=1-t;return{x:u*u*u*c.p0.x+3*u*u*t*c.c1.x+3*u*t*t*c.c2.x+t*t*t*c.p3.x,y:u*u*u*c.p0.y+3*u*u*t*c.c1.y+3*u*t*t*c.c2.y+t*t*t*c.p3.y}}
function f12ClipCurveToCover(c,cover){let d="",drawing=false;for(let i=0;i<=32;i++){const p=f12CubicPoint(c,i/32),inside=dist(p.x,p.y,cover.x,cover.y)<=cover.r+3;if(inside){d+=(drawing?` L ${p.x} ${p.y}`:`M ${p.x} ${p.y}`);drawing=true}else drawing=false}return d.trim()}
function f12HiddenRootEdges(l,cover){const out=[];for(const fromA of[true,false]){const endpoint=nodeById(fromA?l.a:l.b);if(!endpoint||sameComponent(cover.id,endpoint.id))continue;for(const c of f12RootSideCurves(l,fromA)){const d=f12ClipCurveToCover(c,cover);if(d)out.push(d)}}return out}

renderHidden=function(){
  hiddenLayer.replaceChildren();const arr=sortedNodes();for(const cover of arr){for(const l of links){
    if(l.a===cover.id||l.b===cover.id)continue;
    if(sameComponent(cover.id,l.a)||sameComponent(cover.id,l.b))continue;
    for(const d of hiddenLinkEdges(l,cover))hiddenLayer.appendChild(sEl("path",{d,class:"hidden-outline","data-hidden-link":l.id,"data-hidden-cover":cover.id}));
    for(const d of f12HiddenRootEdges(l,cover))hiddenLayer.appendChild(sEl("path",{d,class:"hidden-outline","data-hidden-root":l.id,"data-hidden-cover":cover.id}));
  }}
};

renderMotionNow=function(){shadowLayer.style.display="none";overlapLayer.style.display="none";hiddenLayer.style.display="";renderLinks(true);renderNodesFast();renderHidden();renderUI()};

function f12ToolButtons(){return[selectBtn,eraseBtn,newBtn,document.getElementById("linkBtn"),detachBtn]}
clearOneShotTool=function(){pcTool=null;for(const b of f12ToolButtons())b?.classList.remove("active")};
setPcTool=function(tool,force=false){
  pcTool=force?tool:(pcTool===tool?null:tool);const linkBtn=document.getElementById("linkBtn");for(const[b,t]of[[selectBtn,"select"],[eraseBtn,"erase"],[newBtn,"new"],[linkBtn,"link"],[detachBtn,"detach"]])b?.classList.toggle("active",pcTool===t);
  statusText(pcTool==="erase"?"削除：対象を選択":pcTool==="new"?"新規丸：置く位置を選択":pcTool==="select"?"選択：対象を選択":pcTool==="link"?"紐付け：始点の丸を選択":pcTool==="detach"?"分離：対象を選択":"通常操作");
};
if(detachBtn){bindControl(detachBtn,()=>setPcTool("detach"));svg.addEventListener("pointerdown",evt=>{if(pcTool!=="detach")return;evt.preventDefault();evt.stopImmediatePropagation();const p=eventToWorld(evt),fallback=targetAtWorld(p),n=_separationTarget(p,fallback);if(n)_separateBuriedNode(n,p);else statusText("分離対象がありません");clearOneShotTool()},{capture:true,passive:false})}

window.__mochiFix12Test={contactMetrics:f12ContactMetrics,renderContactPreview:f12RenderContactPreview,clearContactPreview:f12ClearContactPreview,applyAnchoredResize:f12ApplyAnchoredResize,finishAttachNow:f12FinishAttachNow,cancelAttachAnimation:f12CancelAttachAnimation,mergeBlobPath:f12MergeBlobPath,hiddenRootEdges:f12HiddenRootEdges,attachShift:f12AttachShift};

statusText=function(t){status.innerHTML=`餅マップ v0.9.4<br>BUILD 0911-FIX12<br>${t}`};
statusText("待機中");
