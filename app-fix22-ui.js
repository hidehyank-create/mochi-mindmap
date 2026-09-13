"use strict";
(function(){
  let selectMode="lasso",rectSel=null,spaceDown=false,pan=null;
  const modeBtn=document.createElement("button"),modeMenu=document.createElement("div");
  modeBtn.id="f22SelectModeBtn";modeBtn.type="button";modeBtn.textContent="▾";modeBtn.title="選択方法";document.body.appendChild(modeBtn);
  modeMenu.id="f22SelectModeMenu";modeMenu.innerHTML='<button data-mode="lasso">自由選択</button><button data-mode="rect">矩形選択</button>';document.body.appendChild(modeMenu);
  function placeModeBtn(){const r=selectBtn?.getBoundingClientRect();if(!r)return;modeBtn.style.left=(r.right-18)+"px";modeBtn.style.top=(r.top+2)+"px";if(modeMenu.style.display==="block"){modeMenu.style.left=Math.min(innerWidth-130,r.left)+"px";modeMenu.style.top=(r.bottom+4)+"px"}}
  function closeModeMenu(){modeMenu.style.display="none"}
  modeBtn.addEventListener("pointerdown",e=>{e.preventDefault();e.stopPropagation()});
  modeBtn.addEventListener("pointerup",e=>{e.preventDefault();e.stopPropagation();modeMenu.style.display=modeMenu.style.display==="block"?"none":"block";placeModeBtn()});
  modeMenu.addEventListener("pointerdown",e=>{e.preventDefault();e.stopPropagation()});
  modeMenu.addEventListener("pointerup",e=>{const b=e.target.closest("button[data-mode]");if(!b)return;e.preventDefault();e.stopPropagation();selectMode=b.dataset.mode;closeModeMenu();window.__mochiFix21UI?.armSelect?.();statusText(selectMode==="rect"?"選択：矩形で囲む（1回）":"選択：自由に囲む（1回）")});
  document.addEventListener("pointerdown",e=>{if(!modeMenu.contains(e.target)&&e.target!==modeBtn)closeModeMenu()},{capture:true});
  window.addEventListener("resize",placeModeBtn);setTimeout(placeModeBtn,0);

  const f22RenderUIPrev=renderUI;
  renderUI=function(){f22RenderUIPrev();if(rectSel){const x=Math.min(rectSel.start.x,rectSel.now.x),y=Math.min(rectSel.start.y,rectSel.now.y),w=Math.abs(rectSel.now.x-rectSel.start.x),h=Math.abs(rectSel.now.y-rectSel.start.y);uiLayer.appendChild(sEl("rect",{x,y,width:w,height:h,class:"f22-rect-select"}))}};

  function stageTarget(t){return t===svg||svg.contains(t)}
  window.addEventListener("pointerdown",e=>{
    if(pcTool!=="select"||selectMode!=="rect"||!stageTarget(e.target))return;
    e.preventDefault();e.stopImmediatePropagation();const p=eventToWorld(e);rectSel={pointerId:e.pointerId,start:p,now:p};svg.setPointerCapture?.(e.pointerId);renderUI();statusText("矩形選択：丸の中心を四角で囲む");
  },true);
  window.addEventListener("pointermove",e=>{if(!rectSel||e.pointerId!==rectSel.pointerId)return;e.preventDefault();e.stopImmediatePropagation();rectSel.now=eventToWorld(e);renderUI()},true);
  function finishRect(e){if(!rectSel||e.pointerId!==rectSel.pointerId)return false;e.preventDefault();e.stopImmediatePropagation();const r=rectSel;rectSel=null;const minX=Math.min(r.start.x,r.now.x),maxX=Math.max(r.start.x,r.now.x),minY=Math.min(r.start.y,r.now.y),maxY=Math.max(r.start.y,r.now.y),ids=nodes.filter(n=>n.x>=minX&&n.x<=maxX&&n.y>=minY&&n.y<=maxY).map(n=>n.id);f13SetSelectedIds(ids);clearOneShotTool();renderUI();statusText(ids.length?`矩形選択 ${ids.length}個`:"選択解除");return true}
  window.addEventListener("pointerup",finishRect,true);window.addEventListener("pointercancel",finishRect,true);

  document.addEventListener("keydown",e=>{if(e.code==="Space"&&!e.repeat&&!/INPUT|TEXTAREA/.test(e.target?.tagName||"")){spaceDown=true;document.body.classList.add("f22-space-pan");e.preventDefault()}});
  document.addEventListener("keyup",e=>{if(e.code==="Space"){spaceDown=false;document.body.classList.remove("f22-space-pan")}});
  window.addEventListener("blur",()=>{spaceDown=false;document.body.classList.remove("f22-space-pan")});
  window.addEventListener("pointerdown",e=>{if(e.pointerType!=="mouse"||!stageTarget(e.target))return;const wants=e.button===1||(e.button===0&&spaceDown);if(!wants)return;e.preventDefault();e.stopImmediatePropagation();pan={pointerId:e.pointerId,x:e.clientX,y:e.clientY,vx:view.x,vy:view.y};document.body.classList.add("f22-panning");svg.setPointerCapture?.(e.pointerId);statusText("画面移動")},true);
  window.addEventListener("pointermove",e=>{if(!pan||e.pointerId!==pan.pointerId)return;e.preventDefault();e.stopImmediatePropagation();const r=svg.getBoundingClientRect();view.x=pan.vx+(e.clientX-pan.x)*1000/Math.max(1,r.width);view.y=pan.vy+(e.clientY-pan.y)*700/Math.max(1,r.height);applyView()},true);
  function endPan(e){if(!pan||e.pointerId!==pan.pointerId)return false;e.preventDefault();e.stopImmediatePropagation();pan=null;document.body.classList.remove("f22-panning");renderAll();statusText("画面移動を確定");return true}
  window.addEventListener("pointerup",endPan,true);window.addEventListener("pointercancel",endPan,true);window.addEventListener("auxclick",e=>{if(e.button===1&&stageTarget(e.target))e.preventDefault()},true);

  const startGroupPrev=f13StartGroupDrag,updateGroupPrev=f13UpdateGroupDrag;
  f13StartGroupDrag=function(evt,p){startGroupPrev(evt,p);const g=f13GroupDrag;if(!g)return;const set=new Set(g.affected);g.f22Controls=[];for(const l of links){if(!l.control||!set.has(l.a)||!set.has(l.b))continue;const A=g.starts[l.a]||nodeById(l.a),B=g.starts[l.b]||nodeById(l.b);if(A&&B)g.f22Controls.push({id:l.id,c:{...l.control},a:{x:A.x,y:A.y},b:{x:B.x,y:B.y}})}};
  f13UpdateGroupDrag=function(p){updateGroupPrev(p);const g=f13GroupDrag;if(!g?.f22Controls)return;for(const s of g.f22Controls){const l=linkById(s.id),A=nodeById(l?.a),B=nodeById(l?.b);if(!l||!A||!B)continue;const dx=((A.x-s.a.x)+(B.x-s.b.x))/2,dy=((A.y-s.a.y)+(B.y-s.b.y))/2;l.control={x:s.c.x+dx,y:s.c.y+dy}}scheduleMotionRender()};

  window.__mochiFix22UI={getSelectMode:()=>selectMode,setSelectMode:m=>{selectMode=m==="rect"?"rect":"lasso";return selectMode},placeModeBtn,isPanning:()=>!!pan};
})();
(function(){const c=document.createElement("link");c.rel="stylesheet";c.href="style-fix23.css?v=0914-fix23";document.head.appendChild(c);const files=["app-fix23-geometry.js","app-fix23-render.js","app-fix23-hit.js","app-fix23-guide.js","app-fix23-context.js"],test=document.getElementById("regressionResults")?"app-regression23.js":null;function load(i){if(i>=files.length){if(test){const s=document.createElement("script");s.src=test+"?v=0914-fix23";document.body.appendChild(s)}return}const s=document.createElement("script");s.src=files[i]+"?v=0914-fix23";s.onload=()=>load(i+1);document.body.appendChild(s)}load(0)})();
