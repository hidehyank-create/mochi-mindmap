"use strict";
// v0.9.4 FIX13
// - closer, stick-less mochi buds with large root R
// - no new attachment while any moved node is overlapping another circle
// - moving circles no longer changes z order
// - connected chains behave like moderately stiff beads instead of rigid groups
// - lasso selection by node center + rigid multi-selection drag
// - one seam resize keeps the seam fixed; 2+ seams keep center fixed and move neighbors
// - link edit handle sits on the actual curve
// - slower mouse/trackpad resize hold
// - double-click tool lock for repeated actions
// - safe fit-all margins

const F13_ATTACH_MS=190;
const F13_BUD_GAP_MIN=28,F13_BUD_GAP_MAX=46;
const F13_MOUSE_HOLD=850,F13_TOUCH_HOLD=560,F13_PEN_HOLD=400;
let f13AttachRAF=0,f13AttachAnim=null,f13HeldTool=null,f13Lasso=null,f13GroupDrag=null;
const f13SelectedIds=new Set();

function f13Smooth(t){t=clamp(t,0,1);return t*t*(3-2*t)}
function f13ContactMetrics(a,b){
  if(!a||!b)return{visible:false,touch:false,strength:0,gap:Infinity,tipA:null,tipB:null};
  const d=Math.max(.001,dist(a.x,a.y,b.x,b.y)),u=unit(b.x-a.x,b.y-a.y),gap=d-a.r-b.r,minR=Math.min(a.r,b.r);
  const startGap=clamp(minR*.55,F13_BUD_GAP_MIN,F13_BUD_GAP_MAX),strength=f13Smooth(clamp((startGap-gap)/startGap,0,1));
  const maxExt=clamp(minR*.20,12,20),ext=maxExt*strength,half=clamp(minR*.27,13,25)*strength;
  const tipA={x:a.x+u.x*(a.r+ext),y:a.y+u.y*(a.r+ext)},tipB={x:b.x-u.x*(b.r+ext),y:b.y-u.y*(b.r+ext)};
  return{visible:gap<startGap&&gap>-16,touch:gap<=ext*2+2&&gap>-16,strength,gap,startGap,ext,half,u,tipA,tipB};
}
function f13BudPath(n,toward,m){
  if(!n||!m||m.strength<=.01)return null;const u=unit(toward.x-n.x,toward.y-n.y),v={x:-u.y,y:u.x},half=Math.min(m.half,n.r*.72),x0=Math.sqrt(Math.max(1,n.r*n.r-half*half)),noseX=n.r+m.ext;
  const W=(x,y)=>({x:n.x+u.x*x+v.x*y,y:n.y+u.y*x+v.y*y}),top=W(x0,half),bot=W(x0,-half),nose=W(noseX,0),tanT=unit(half,-x0),tanB=unit(half,x0),rootK=Math.max(4,Math.max(half*.92,m.ext*.90));
  const c1=W(x0+tanT.x*rootK,half+tanT.y*rootK),c2=W(noseX-m.ext*.18,half*.62),c3=W(noseX-m.ext*.18,-half*.62),c4=W(x0+tanB.x*rootK,-half+tanB.y*rootK);
  return`M ${top.x} ${top.y} C ${c1.x} ${c1.y} ${c2.x} ${c2.y} ${nose.x} ${nose.y} C ${c3.x} ${c3.y} ${c4.x} ${c4.y} ${bot.x} ${bot.y} Z`;
}
function f13ClearContactPreview(){liveLayer.querySelector("#f13ContactPreview")?.remove();f12ClearContactPreview?.()}
function f13RenderContactPreview(aId,bId){
  f13ClearContactPreview();const a=nodeById(aId),b=nodeById(bId);if(!a||!b)return null;const m=f13ContactMetrics(a,b);if(!m.visible)return m;
  const g=sEl("g",{id:"f13ContactPreview","data-ready":m.touch?"1":"0"}),da=f13BudPath(a,b,m),db=f13BudPath(b,a,m);
  if(da)g.appendChild(sEl("path",{d:da,fill:"#f0c867","data-bud":"a"}));if(db)g.appendChild(sEl("path",{d:db,fill:"#f0c867","data-bud":"b"}));liveLayer.appendChild(g);return m;
}
function f13ExternalOverlap(g,margin=0){
  const ids=g?.compIds||[],set=new Set(ids);for(const id of ids){const a=nodeById(id);if(!a)continue;for(const b of nodes){if(set.has(b.id)||directAttached(id,b.id))continue;if(dist(a.x,a.y,b.x,b.y)<a.r+b.r+margin)return true}}return false;
}
function f13InitialBypass(ids){const set=new Set(ids),out=new Set();for(const id of ids){const a=nodeById(id);if(!a)continue;for(const b of nodes){if(set.has(b.id))continue;if(dist(a.x,a.y,b.x,b.y)<a.r+b.r)out.add(pairKey(id,b.id))}}return out}
function f13BestApproach(g){
  if(!g||g.blockAttachUntilClear)return null;const ids=g.compIds||[g.nodeId],set=new Set(ids),skip=g.bypassPairs||new Set(),candidates=g.f13CandidateIds||[g.nodeId];let best=null,bestScore=Infinity;
  for(const id of candidates){const a=nodeById(id);if(!a)continue;for(const b of nodes){if(set.has(b.id)||directAttached(id,b.id)||skip.has(pairKey(id,b.id)))continue;const m=f13ContactMetrics(a,b);if(!m.visible)continue;const score=Math.max(0,m.gap)+m.gap*.02;if(score<bestScore){bestScore=score;best={pair:{movedId:id,otherId:b.id},metrics:m}}}}return best;
}
function f13UpdateContactState(g){
  if(f13ExternalOverlap(g,0)){g.blockAttachUntilClear=true;g.contactPair=null;f13ClearContactPreview();return}
  if(g.blockAttachUntilClear){if(!f13ExternalOverlap(g,8))g.blockAttachUntilClear=false;else{g.contactPair=null;f13ClearContactPreview();return}}
  const best=f13BestApproach(g);g.contactPair=null;if(!best){f13ClearContactPreview();return}
  const m=f13RenderContactPreview(best.pair.movedId,best.pair.otherId);if(m?.touch)g.contactPair=best.pair;
}

function f13BuildStarts(ids){const out={};for(const id of ids){const q=nodeById(id);if(q)out[id]={x:q.x,y:q.y,r:q.r}}return out}
function f13BuildBendRest(ids,starts=null){
  const set=new Set(ids),rest=[];for(const mid of ids){const ns=[];for(const m of attachments){if(m.a===mid&&set.has(m.b))ns.push(m.b);else if(m.b===mid&&set.has(m.a))ns.push(m.a)}for(let i=0;i<ns.length;i++)for(let j=i+1;j<ns.length;j++){const A=starts?.[ns[i]]||nodeById(ns[i]),B=starts?.[ns[j]]||nodeById(ns[j]);if(A&&B)rest.push({a:ns[i],b:ns[j],d:dist(A.x,A.y,B.x,B.y)})}}return rest;
}
function f13ApplyConstraint(a,b,target,pins,stiff=1){
  if(!a||!b)return;let dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy);if(d<1e-5){dx=1;dy=0;d=1}const diff=(d-target)/d*stiff,pa=pins.has(a.id),pb=pins.has(b.id);if(pa&&pb)return;if(pa){b.x-=dx*diff;b.y-=dy*diff;return}if(pb){a.x+=dx*diff;a.y+=dy*diff;return}a.x+=dx*diff*.5;a.y+=dy*diff*.5;b.x-=dx*diff*.5;b.y-=dy*diff*.5;
}
function f13SolveBeads(ids,pinIds=new Set(),iterations=10,bendRest=null){
  const set=new Set(ids),pins=pinIds instanceof Set?pinIds:new Set(pinIds),bends=bendRest||f13BuildBendRest(ids);for(let it=0;it<iterations;it++){
    for(const m of attachments){if(!set.has(m.a)||!set.has(m.b))continue;const A=nodeById(m.a),B=nodeById(m.b);f13ApplyConstraint(A,B,A.r+B.r-ATTACH_OVERLAP,pins,.94)}
    for(const br of bends){if(!set.has(br.a)||!set.has(br.b))continue;f13ApplyConstraint(nodeById(br.a),nodeById(br.b),br.d,pins,.12)}
    const arr=ids.map(nodeById).filter(Boolean);for(let i=0;i<arr.length;i++)for(let j=i+1;j<arr.length;j++){const A=arr[i],B=arr[j];if(directAttached(A.id,B.id))continue;const minD=A.r+B.r+2,d=dist(A.x,A.y,B.x,B.y);if(d<minD)f13ApplyConstraint(A,B,minD,pins,.92)}
  }return ids;
}

startMoveGesture=function(evt,p,n){
  crossPairs.clear();const ids=componentIds(n.id),starts=f13BuildStarts(ids);gesture={pointerId:evt.pointerId,mode:"move",nodeId:n.id,compIds:ids,start:p,starts,points:[p],contactPair:null,contactTimer:0,crossMode:false,inputType:evt.pointerType||"pen",bypassPairs:f13InitialBypass(ids),f13Bead:ids.length>1,f13CandidateIds:[n.id],bendRest:f13BuildBendRest(ids,starts),blockAttachUntilClear:f13ExternalOverlap({compIds:ids},0)};statusText(ids.length>1?`数珠を動かす（${ids.length}個）`:"丸移動");scheduleMotionRender();
};
updateMoveGesture=function(g,p){
  const last=g.points.at(-1);if(!last||dist(last.x,last.y,p.x,p.y)>=2/view.scale)g.points.push(p);const dx=p.x-g.start.x,dy=p.y-g.start.y;
  for(const id of g.compIds){const q=nodeById(id),s=g.starts[id];if(q&&s){q.x=s.x;q.y=s.y}}
  const moved=nodeById(g.nodeId),s=g.starts[g.nodeId];if(moved&&s){moved.x=s.x+dx;moved.y=s.y+dy}
  if(g.f13Bead)f13SolveBeads(g.compIds,new Set([g.nodeId]),10,g.bendRest);f13UpdateContactState(g);crossPairs.clear();scheduleMotionRender();
  if(g.contactPair)statusText("迎え半円が接触：離す＝くっつく / 押し込む＝重なる");else if(g.blockAttachUntilClear)statusText("重なり中：接着しません");else statusText(g.f13Bead?"数珠がたわんで追従":"丸移動");
};

function f13NeckProfile(m,boost=0){const A=nodeById(m.a),B=nodeById(m.b),minR=Math.min(A?.r||0,B?.r||0),finalShoulder=clamp(minR*.70,28,minR*.78),startShoulder=clamp(minR*.77,finalShoulder+3,minR*.84),finalWaist=clamp(minR*.54,20,minR*.62),startWaist=clamp(minR*.64,finalWaist+4,minR*.70);return{shoulder:finalShoulder+(startShoulder-finalShoulder)*boost,waist:finalWaist+(startWaist-finalWaist)*boost,minR}}
function f13MergeBlobPath(m,boost=0){
  const a=nodeById(m.a),b=nodeById(m.b);if(!a||!b)return null;const D=Math.max(.001,dist(a.x,a.y,b.x,b.y)),u=unit(b.x-a.x,b.y-a.y),v={x:-u.y,y:u.x},pr=f13NeckProfile(m,boost),shA=Math.min(pr.shoulder,a.r*.86),shB=Math.min(pr.shoulder,b.r*.86),xA=Math.sqrt(Math.max(1,a.r*a.r-shA*shA)),xB=Math.sqrt(Math.max(1,b.r*b.r-shB*shB)),W=(x,y)=>({x:a.x+u.x*x+v.x*y,y:a.y+u.y*x+v.y*y}),ax=xA,bx=D-xB,mx=(ax+bx)/2,At=W(ax,shA),Ab=W(ax,-shA),Bt=W(bx,shB),Bb=W(bx,-shB),Wt=W(mx,pr.waist),Wb=W(mx,-pr.waist),s1=Math.max(4,mx-ax),s2=Math.max(4,bx-mx),C=(p,du)=>({x:p.x+u.x*du,y:p.y+u.y*du});
  return`M ${At.x} ${At.y} C ${C(At,s1*.62).x} ${C(At,s1*.62).y} ${C(Wt,-s1*.46).x} ${C(Wt,-s1*.46).y} ${Wt.x} ${Wt.y} C ${C(Wt,s2*.46).x} ${C(Wt,s2*.46).y} ${C(Bt,-s2*.62).x} ${C(Bt,-s2*.62).y} ${Bt.x} ${Bt.y} L ${Bb.x} ${Bb.y} C ${C(Bb,-s2*.62).x} ${C(Bb,-s2*.62).y} ${C(Wb,s2*.46).x} ${C(Wb,s2*.46).y} ${Wb.x} ${Wb.y} C ${C(Wb,-s1*.46).x} ${C(Wb,-s1*.46).y} ${C(Ab,s1*.62).x} ${C(Ab,s1*.62).y} ${Ab.x} ${Ab.y} Z`;
}
mergeBridge=function(m,shadow=false){const key=pairKey(m.a,m.b),boost=f13AttachAnim&&f13AttachAnim.key===key?1-f13AttachAnim.progress:0,d=f13MergeBlobPath(m,boost);return d?sEl("path",{d,class:shadow?null:"merge-blob",fill:shadow?"#000":"#f0c867",stroke:"none"}):null};

function f13AttachShift(g,pair){const a=nodeById(pair.movedId),b=nodeById(pair.otherId);if(!a||!b)return null;const D=dist(a.x,a.y,b.x,b.y),target=a.r+b.r-ATTACH_OVERLAP,u=unit(b.x-a.x,b.y-a.y);return{u,amount:D-target,target}}
function f13FinishAttachNow(g,pair){if(!g||!pair)return false;const sh=f13AttachShift(g,pair);if(!sh)return false;for(const id of g.compIds||[pair.movedId]){const q=nodeById(id);if(q){q.x+=sh.u.x*sh.amount;q.y+=sh.u.y*sh.amount}}addAttachment(pair.movedId,pair.otherId,g.nodeId||pair.movedId);f13ClearContactPreview();renderAll();return true}
function f13CancelAttachAnimation(){if(f13AttachRAF)cancelAnimationFrame(f13AttachRAF);f13AttachRAF=0;f13AttachAnim=null;if(gesture?.mode==="f13Attach")gesture=null}
function f13StartAttachAnimation(g,pair){
  f13CancelAttachAnimation();const sh=f13AttachShift(g,pair);if(!sh){gesture=null;return false}const ids=g.compIds||[pair.movedId],starts=f13BuildStarts(ids);addAttachment(pair.movedId,pair.otherId,g.nodeId||pair.movedId);f13ClearContactPreview();f13AttachAnim={key:pairKey(pair.movedId,pair.otherId),progress:0};gesture={pointerId:-1,mode:"f13Attach"};const t0=performance.now();
  function tick(now){const t=clamp((now-t0)/F13_ATTACH_MS,0,1),e=1-Math.pow(1-t,3);for(const id of ids){const q=nodeById(id),s=starts[id];if(q&&s){q.x=s.x+sh.u.x*sh.amount*e;q.y=s.y+sh.u.y*sh.amount*e}}f13AttachAnim.progress=t;renderAll();if(t<1){f13AttachRAF=requestAnimationFrame(tick);return}f13AttachRAF=0;f13AttachAnim=null;gesture=null;crossPairs.clear();renderAll();commitHistory();statusText("接着：餅がなじみました")}
  renderAll();f13AttachRAF=requestAnimationFrame(tick);return true;
}

function f13ResizeConnected(n,newR){
  if(!n)return;newR=clamp(newR,MIN_R,MAX_R);const seams=directAttachmentsOf(n.id);if(seams.length===0){n.r=newR;return}
  if(seams.length===1){const m=seams[0],other=nodeById(m.a===n.id?m.b:m.a);f12ApplyAnchoredResize(n,newR,other);return}
  const ids=componentIds(n.id),starts=f13BuildStarts(ids),bends=f13BuildBendRest(ids,starts),cx=n.x,cy=n.y;n.r=newR;n.x=cx;n.y=cy;f13SolveBeads(ids,new Set([n.id]),14,bends);n.x=cx;n.y=cy;
}

function f13LinkEditPoint(l){return quadPoint(l,.5)}
function f13ControlForCurvePoint(l,p){const a=nodeById(l.a),b=nodeById(l.b);return{x:2*p.x-.5*(a.x+b.x),y:2*p.y-.5*(a.y+b.y)}}
function f13HoldDelay(type){return type==="mouse"?F13_MOUSE_HOLD:type==="touch"?F13_TOUCH_HOLD:F13_PEN_HOLD}
armHold=function(kind,id,evt,p){
  const g={pointerId:evt.pointerId,mode:kind==="node"?"nodePending":"linkPending",start:p,last:p,moved:false,nodeId:kind==="node"?id:null,linkId:kind==="link"?id:null,holdTimer:0,inputType:evt.pointerType||"pen"};if(kind==="link"){const l=linkById(id);g.originalControl=l?.control?{...l.control}:null}
  const delay=kind==="node"?f13HoldDelay(g.inputType):Math.min(520,f13HoldDelay(g.inputType));g.holdTimer=setTimeout(()=>{if(gesture!==g||g.moved)return;if(kind==="node"){gesture.mode="resize";const n=nodeById(id);gesture.startR=n.r;gesture.resizeStartDist=dist(n.x,n.y,g.last.x,g.last.y);statusText("サイズ変更：外へ拡大 / 内へ縮小")}else{gesture.mode="linkEdit";const l=linkById(id),c=linkControl(l);if(!l.control)l.control={...c};statusText("紐上の点を動かして曲げる")}renderUI()},delay);gesture=g;
};

const f13PenMovePrev=penMove;
penMove=function(evt){
  if(!gesture||evt.pointerId!==gesture.pointerId)return f13PenMovePrev(evt);
  if(gesture.mode==="linkEdit"){evt.preventDefault();const p=eventToWorld(evt),l=linkById(gesture.linkId);if(l){l.control=f13ControlForCurvePoint(l,p);scheduleMotionRender()}statusText("紐上の操作点で曲げる");return}
  if(gesture.mode==="resize"){
    evt.preventDefault();const p=eventToWorld(evt),n=nodeById(gesture.nodeId);if(!n)return;gesture.last=p;if(!gesture.f13ResizeBase){const ids=componentIds(n.id);gesture.f13ResizeBase={center:{x:n.x,y:n.y},startR:gesture.startR??n.r,startDist:gesture.resizeStartDist??dist(n.x,n.y,p.x,p.y),starts:f13BuildStarts(ids),ids}}
    const b=gesture.f13ResizeBase;for(const id of b.ids){const q=nodeById(id),s=b.starts[id];if(q&&s){q.x=s.x;q.y=s.y;if(id===n.id)q.r=b.startR}}
    const cur=dist(b.center.x,b.center.y,p.x,p.y),newR=clamp(b.startR+(cur-b.startDist),MIN_R,MAX_R);f13ResizeConnected(n,newR);scheduleMotionRender();statusText(`サイズ変更：半径 ${Math.round(n.r)}`);return;
  }
  return f13PenMovePrev(evt);
};
const f13PenEndPrev=penEnd;
penEnd=function(evt){
  if(!gesture||evt.pointerId!==gesture.pointerId)return;
  if(gesture.mode==="move"){
    evt.preventDefault();cancelHold();const g=gesture;if(movementLooksLikeXSlash(g)){f13ClearContactPreview();restoreMoveStart(g);gesture=null;renderAll();if(acceptXStroke(g.points,g.inputType))renderAll();return}if(g.contactPair&&!g.blockAttachUntilClear){const pair={...g.contactPair};f13StartAttachAnimation(g,pair);return}f13ClearContactPreview();gesture=null;crossPairs.clear();renderAll();commitHistory();statusText("移動を確定");return;
  }
  return f13PenEndPrev(evt);
};

const f13RenderUIPrev=renderUI;
renderUI=function(){
  f13RenderUIPrev();if(gesture?.mode==="linkEdit"){uiLayer.querySelectorAll(".edit-guide,.edit-handle").forEach(e=>e.remove());const l=linkById(gesture.linkId);if(l){const h=f13LinkEditPoint(l);uiLayer.appendChild(sEl("circle",{cx:h.x,cy:h.y,r:9/view.scale,class:"edit-handle"}))}}
  if(f13SelectedIds.size){uiLayer.querySelectorAll(".f13-multi-ring").forEach(e=>e.remove());for(const id of f13SelectedIds){const n=nodeById(id);if(n)uiLayer.appendChild(sEl("circle",{cx:n.x,cy:n.y,r:n.r+9/view.scale,class:"selection-ring f13-multi-ring"}))}}
  if(f13Lasso?.points?.length>1){let d="";for(let i=0;i<f13Lasso.points.length;i++){const p=f13Lasso.points[i];d+=(i?` L ${p.x} ${p.y}`:`M ${p.x} ${p.y}`)}uiLayer.appendChild(sEl("path",{d,class:"f13-lasso"}))}
};

function f13PointInPolygon(p,poly){let inside=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const a=poly[i],b=poly[j],hit=((a.y>p.y)!==(b.y>p.y))&&(p.x<(b.x-a.x)*(p.y-a.y)/((b.y-a.y)||1e-9)+a.x);if(hit)inside=!inside}return inside}
function f13SetSelectedIds(ids){f13SelectedIds.clear();for(const id of ids||[])if(nodeById(id))f13SelectedIds.add(id);selected=null;renderUI();return new Set(f13SelectedIds)}
function f13SelectByPolygon(poly){const ids=nodes.filter(q=>f13PointInPolygon({x:q.x,y:q.y},poly)).map(q=>q.id);return f13SetSelectedIds(ids)}
function f13MoveSelectedRigid(dx,dy){for(const id of f13SelectedIds){const q=nodeById(id);if(q){q.x+=dx;q.y+=dy}}renderAll()}
function f13AffectedIds(pinIds){const set=new Set();for(const id of pinIds)for(const x of componentIds(id))set.add(x);return[...set]}
function f13StartGroupDrag(evt,p){const ids=[...f13SelectedIds],affected=f13AffectedIds(ids),starts=f13BuildStarts(affected);f13GroupDrag={pointerId:evt.pointerId,start:p,pinIds:new Set(ids),affected,starts,bends:f13BuildBendRest(affected,starts)};statusText(`複数選択 ${ids.length}個を移動`)}
function f13UpdateGroupDrag(p){const g=f13GroupDrag;if(!g)return;const dx=p.x-g.start.x,dy=p.y-g.start.y;for(const id of g.affected){const q=nodeById(id),s=g.starts[id];if(q&&s){q.x=s.x;q.y=s.y}}for(const id of g.pinIds){const q=nodeById(id),s=g.starts[id];if(q&&s){q.x=s.x+dx;q.y=s.y+dy}}f13SolveBeads(g.affected,g.pinIds,10,g.bends);scheduleMotionRender()}
function f13EndGroupDrag(){if(!f13GroupDrag)return;f13GroupDrag=null;renderAll();commitHistory();statusText("複数選択を移動しました")}

function f13ToolButtonPairs(){return[[selectBtn,"select"],[eraseBtn,"erase"],[newBtn,"new"],[document.getElementById("linkBtn"),"link"],[document.getElementById("detachBtn"),"detach"]]}
function f13RefreshToolClasses(){for(const[b,t]of f13ToolButtonPairs()){if(!b)continue;b.classList.toggle("active",pcTool===t);b.classList.toggle("held",f13HeldTool===t)}}
function f13SetHeldTool(tool){f13HeldTool=tool||null;if(tool)pcTool=tool;else if(pcTool&&f13ToolButtonPairs().some(([,t])=>t===pcTool))pcTool=null;f13RefreshToolClasses();return f13HeldTool}
clearOneShotTool=function(){if(f13HeldTool){pcTool=f13HeldTool;f13RefreshToolClasses();return}pcTool=null;f13RefreshToolClasses()};
setPcTool=function(tool,force=false){
  if(!force&&f13HeldTool===tool&&pcTool===tool){f13HeldTool=null;pcTool=null;f13RefreshToolClasses();statusText("通常操作");return}
  if(!force&&f13HeldTool&&f13HeldTool!==tool)f13HeldTool=null;pcTool=force?tool:(pcTool===tool?null:tool);f13RefreshToolClasses();statusText(pcTool==="select"?"選択：投げ縄で囲む":pcTool==="new"?"新規丸":pcTool==="erase"?"削除":pcTool==="link"?"紐付け":pcTool==="detach"?"分離":"通常操作")
};
for(const[b,t]of f13ToolButtonPairs())b?.addEventListener("dblclick",evt=>{evt.preventDefault();evt.stopImmediatePropagation();f13SetHeldTool(t);statusText(`${b.getAttribute("aria-label")||t}：連続モード`)},{capture:true});

svg.addEventListener("pointerdown",evt=>{
  const p=eventToWorld(evt);
  if(pcTool==="select"){
    evt.preventDefault();evt.stopImmediatePropagation();f13Lasso={pointerId:evt.pointerId,points:[p],start:p};svg.setPointerCapture?.(evt.pointerId);statusText("投げ縄：丸の中心を囲む");renderUI();return;
  }
  if(!pcTool&&f13SelectedIds.size>1){const hit=nearestNode(p.x,p.y);if(hit&&f13SelectedIds.has(hit.node.id)&&hit.d<=hit.node.r+14/view.scale){evt.preventDefault();evt.stopImmediatePropagation();f13StartGroupDrag(evt,p)}}
},{capture:true,passive:false});
svg.addEventListener("pointermove",evt=>{
  if(f13Lasso&&evt.pointerId===f13Lasso.pointerId){evt.preventDefault();evt.stopImmediatePropagation();const p=eventToWorld(evt),last=f13Lasso.points.at(-1);if(dist(last.x,last.y,p.x,p.y)>3/view.scale)f13Lasso.points.push(p);renderUI();return}
  if(f13GroupDrag&&evt.pointerId===f13GroupDrag.pointerId){evt.preventDefault();evt.stopImmediatePropagation();f13UpdateGroupDrag(eventToWorld(evt))}
},{capture:true,passive:false});
function f13FinishLasso(evt){if(!f13Lasso||evt.pointerId!==f13Lasso.pointerId)return false;evt.preventDefault();evt.stopImmediatePropagation();const l=f13Lasso;f13Lasso=null;if(l.points.length>=3&&dist(l.start.x,l.start.y,l.points.at(-1).x,l.points.at(-1).y)>12/view.scale)f13SelectByPolygon(l.points);else{const t=targetAtWorld(l.start);f13SetSelectedIds(t?.type==="node"?[t.id]:[])}clearOneShotTool();renderUI();statusText(f13SelectedIds.size?`選択 ${f13SelectedIds.size}個`:"選択解除");return true}
for(const type of["pointerup","pointercancel"])svg.addEventListener(type,evt=>{if(f13FinishLasso(evt))return;if(f13GroupDrag&&evt.pointerId===f13GroupDrag.pointerId){evt.preventDefault();evt.stopImmediatePropagation();f13EndGroupDrag()}},{capture:true,passive:false});

function f13FitAllSafe(){
  if(!nodes.length)return;let minX=Infinity,minY=Infinity,maxX=-Infinity,maxY=-Infinity;for(const n of nodes){minX=Math.min(minX,n.x-n.r-12);maxX=Math.max(maxX,n.x+n.r+12);minY=Math.min(minY,n.y-n.r-12);maxY=Math.max(maxY,n.y+n.r+12)}for(const l of links){const c=linkControl(l);minX=Math.min(minX,c.x-20);maxX=Math.max(maxX,c.x+20);minY=Math.min(minY,c.y-20);maxY=Math.max(maxY,c.y+20)}const pad={l:85,r:85,t:120,b:130},iw=1000-pad.l-pad.r,ih=700-pad.t-pad.b,w=Math.max(80,maxX-minX),h=Math.max(80,maxY-minY),s=clamp(Math.min(iw/w,ih/h),VIEW_MIN,2.2);view.scale=s;view.x=pad.l+(iw-w*s)/2-minX*s;view.y=pad.t+(ih-h*s)/2-minY*s;applyView();renderAll();statusText("全体表示")}
fitAll=f13FitAllSafe;
for(const type of["pointerdown","pointerup","click"]){fitBtn.addEventListener(type,evt=>{evt.preventDefault();evt.stopImmediatePropagation();if(type==="pointerup")f13FitAllSafe()},{capture:true})}

function f13ResetTransient(){f13CancelAttachAnimation();f13ClearContactPreview();f13Lasso=null;f13GroupDrag=null;f13SelectedIds.clear();f13SetHeldTool(null)}

window.__mochiFix13Test={contactMetrics:f13ContactMetrics,renderContactPreview:f13RenderContactPreview,externalOverlap:f13ExternalOverlap,bestApproach:f13BestApproach,finishAttachNow:f13FinishAttachNow,neckProfile:f13NeckProfile,resizeConnected:f13ResizeConnected,solveBeads:f13SolveBeads,selectByPolygon:f13SelectByPolygon,setSelectedIds:f13SetSelectedIds,moveSelectedRigid:f13MoveSelectedRigid,linkEditPoint:f13LinkEditPoint,controlForCurvePoint:f13ControlForCurvePoint,holdDelay:f13HoldDelay,setHeldTool:f13SetHeldTool,fitAllSafe:f13FitAllSafe,resetTransient:f13ResetTransient};
statusText=function(t){status.innerHTML=`餅マップ v0.9.4<br>BUILD 0911-FIX13<br>${t}`};statusText("待機中");
