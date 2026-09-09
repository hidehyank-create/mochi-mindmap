"use strict";
function setPcTool(tool,force=false){pcTool=force?tool:(pcTool===tool?null:tool);for(const [b,t] of [[selectBtn,"select"],[eraseBtn,"erase"],[newBtn,"new"]])b.classList.toggle("active",pcTool===t);statusText(pcTool==="erase"?"削除：対象を選択":pcTool==="new"?"新規丸：置く位置を選択":pcTool==="select"?"選択：対象を選択":"通常操作") }
let lastControlFire=0;
function bindControl(btn,action){btn.addEventListener("pointerdown",evt=>{evt.preventDefault();evt.stopPropagation()},{passive:false});btn.addEventListener("pointerup",evt=>{evt.preventDefault();evt.stopPropagation();lastControlFire=Date.now();action()},{passive:false});btn.addEventListener("click",evt=>{evt.preventDefault();evt.stopPropagation();if(Date.now()-lastControlFire>450)action()})}
bindControl(undoBtn,undo);bindControl(redoBtn,redo);bindControl(selectBtn,()=>setPcTool("select"));bindControl(eraseBtn,()=>setPcTool("erase"));bindControl(newBtn,()=>setPcTool("new"));bindControl(fitBtn,fitAll);bindControl(cancelDelete,()=>{deleteCandidate=null;confirmDelete.style.display="none";statusText("削除をキャンセル")});bindControl(doDelete,performDelete);
function toolSelect(evt){evt.preventDefault();const p=eventToWorld(evt),t=targetAtWorld(p);selected=t?{...t}:null;renderUI();statusText(t?"選択":"選択解除")}
function toolErase(evt){evt.preventDefault();const p=eventToWorld(evt),input=evt.pointerType||"mouse",seam=nearestMergeContact(p.x,p.y,(input==="touch"?38:30)/view.scale);if(seam){detachMerge(seam.merge);return}const n=nearestNode(p.x,p.y);if(n&&n.d<=n.node.r+(input==="touch"?22:16)/view.scale){requestDelete({type:"node",id:n.node.id});return}const l=nearestLink(p.x,p.y,(input==="touch"?34:28)/view.scale);if(l){requestDelete({type:"link",id:l.link.id});return}statusText("消しゴム：対象がありません")}
function toolNew(evt){evt.preventDefault();const p=eventToWorld(evt),n={id:"n"+Date.now(),x:p.x,y:p.y,r:DEFAULT_R,label:"新規"+(newNodeNo++),z:++zSeq,created:++createSeq};nodes.push(n);adoptExistingOverlapsAsCross([n.id]);selected={type:"node",id:n.id};renderAll();commitHistory();statusText("新しい丸")}
function targetAtWorld(p){const h=hiddenNodeHit(p.x,p.y);if(h)return{type:"node",id:h.id};const n=nearestNode(p.x,p.y);if(n&&n.d<=n.node.r+18/view.scale)return{type:"node",id:n.node.id};const l=nearestLink(p.x,p.y,26/view.scale);if(l)return{type:"link",id:l.link.id};return null}
function hideContext(){contextMenu.style.display="none";contextTarget=null;contextPoint=null}
function showContext(evt){evt.preventDefault();contextPoint=eventToWorld(evt);contextTarget=null;contextMenu.style.left=Math.min(evt.clientX,window.innerWidth-170)+"px";contextMenu.style.top=Math.min(evt.clientY,window.innerHeight-150)+"px";contextMenu.style.display="block";ctxDelete.disabled=false;ctxSelect.disabled=false}
bindControl(ctxSelect,()=>{setPcTool("select",true);hideContext()});
bindControl(ctxNew,()=>{setPcTool("new",true);hideContext()});
bindControl(ctxDelete,()=>{setPcTool("erase",true);hideContext()});
document.addEventListener("pointerdown",evt=>{if(contextMenu.style.display==="block"&&!contextMenu.contains(evt.target))hideContext()},{capture:true});
document.addEventListener("keydown",evt=>{if((evt.key==="Delete"||evt.key==="Backspace")&&selected&&!confirmDelete.offsetParent){evt.preventDefault();requestDelete(selected)}});
svg.addEventListener("pointerdown",evt=>{if(pcTool==="select"){toolSelect(evt);return}if(pcTool==="erase"){toolErase(evt);return}if(pcTool==="new"){toolNew(evt);return}if(evt.pointerType==="touch")touchDown(evt);else penDown(evt)},{passive:false});
svg.addEventListener("pointermove",evt=>{if(evt.pointerType==="touch")touchMove(evt);else penMove(evt)},{passive:false});
svg.addEventListener("pointerup",evt=>{if(evt.pointerType==="touch")touchEnd(evt);else penEnd(evt)},{passive:false});
svg.addEventListener("pointercancel",evt=>{if(evt.pointerType==="touch")touchEnd(evt);else penEnd(evt)},{passive:false});
svg.addEventListener("contextmenu",showContext);
for(const type of["gesturestart","gesturechange","gestureend"])document.addEventListener(type,e=>e.preventDefault(),{passive:false});
document.addEventListener("touchmove",e=>e.preventDefault(),{passive:false});
document.addEventListener("dblclick",e=>e.preventDefault(),{passive:false});
applyView();renderAll();historyPast.push(snapshotState());updateHistoryButtons();
