"use strict";
(function(){
  const NS="http://www.w3.org/2000/svg",controls=document.getElementById("controls"),menu=document.getElementById("contextMenu");
  function path(d,a={}){const p=document.createElementNS(NS,"path");p.setAttribute("d",d);for(const[k,v]of Object.entries(a))p.setAttribute(k,v);return p}
  function line(x1,y1,x2,y2){const e=document.createElementNS(NS,"line");for(const[k,v]of Object.entries({x1,y1,x2,y2}))e.setAttribute(k,v);return e}
  const st=document.createElement("style");st.textContent=`#zoomInBtn,#zoomOutBtn{flex:0 0 50px!important;width:50px!important;min-width:50px!important}.f19-zoom-glyph{font-size:24px;line-height:23px;font-weight:500}.tool-icon.icon-eraser{width:33px;height:27px}#contextMenu{max-height:min(440px,calc(100vh - 20px));overflow:auto}@media(max-width:680px){#zoomInBtn,#zoomOutBtn{display:none!important}}`;document.head.appendChild(st);

  // New-circle icon: heavier hand-drawn loop whose release sweeps to the lower-left, not a Q tail.
  const n=document.querySelector("#newBtn svg");if(n){n.setAttribute("viewBox","0 0 32 32");n.replaceChildren(path("M13 28.1C6.4 27.5 2.4 22.2 3.1 15.3 3.8 7.4 10.7 2.6 18.4 3.1 26.4 3.6 30.2 10.2 28.5 18.1 27 25.1 21.2 28.5 14.5 28.2 12.6 28 10.7 27.5 9.2 26.6 10.5 28.2 9.1 29.5 6.8 30.4",{"data-icon-part":"scribble","data-f19-nine":"1",fill:"none",stroke:"currentColor","stroke-width":"3.1","stroke-linecap":"round","stroke-linejoin":"round"}))}

  // Return eraser to the earlier diagonal silhouette; extend the wrapper and enlarge only slightly.
  const e=document.querySelector("#eraseBtn svg");if(e){e.setAttribute("viewBox","0 0 34 28");e.setAttribute("data-f19-diagonal","1");e.replaceChildren(path("M4.2 19.2 18.8 4.6Q20.4 3 22 4.6L29.2 11.8Q30.8 13.4 29.2 15L16.2 28H9.6Z",{fill:"none",stroke:"currentColor","stroke-width":"2"}),path("M4.2 19.2 11.8 11.6 19.1 18.9 11 27.4H9.6Z",{"data-icon-part":"paper",fill:"currentColor",stroke:"none",opacity:".30"}),path("M11.8 11.6 19.1 18.9",{"data-icon-part":"divider",fill:"none",stroke:"currentColor","stroke-width":"2"}))}

  function zoomBy(f){const cx=500,cy=350,anchor=svgToWorldPoint({x:cx,y:cy}),s=clamp(view.scale*f,VIEW_MIN,VIEW_MAX);view.scale=s;view.x=cx-anchor.x*s;view.y=cy-anchor.y*s;applyView();renderAll();statusText(`ズーム ${Math.round(s*100)}%`)}
  function mkZoom(id,label,glyph,f){const b=document.createElement("button");b.id=id;b.type="button";b.setAttribute("aria-label",label);b.innerHTML=`<span class="f19-zoom-glyph">${glyph}</span><span class="tool-label">${label}</span>`;b.addEventListener("pointerdown",x=>{x.preventDefault();x.stopPropagation()});b.addEventListener("pointerup",x=>{x.preventDefault();x.stopPropagation();zoomBy(f)});return b}
  const zin=mkZoom("zoomInBtn","拡大","＋",1.18),zout=mkZoom("zoomOutBtn","縮小","−",1/1.18);fitBtn.after(zin,zout);

  const actionMap=new Map([[newBtn,"new"],[document.getElementById("linkBtn"),"link"],[document.getElementById("detachBtn"),"detach"],[eraseBtn,"erase"]].filter(x=>x[0]));
  let held=null,lastTool=null,lastAt=0,releaseTimer=0;
  function refresh(){for(const[b,t]of actionMap){b.classList.toggle("active",pcTool===t);b.classList.toggle("held",held===t);b.setAttribute("aria-pressed",held===t?"true":"false")}}
  function setOneShot(t){held=null;pcTool=t;refresh();statusText(`${[...actionMap].find(([,x])=>x===t)?.[0]?.getAttribute("aria-label")||t}：1回`)}
  function setHeld(t){held=t;pcTool=t;refresh();statusText(`${[...actionMap].find(([,x])=>x===t)?.[0]?.getAttribute("aria-label")||t}：連続モード`)}
  function clearHeld(){held=null;pcTool=null;refresh();statusText("通常操作")}
  clearOneShotTool=function(){if(held){pcTool=held;refresh();return}pcTool=null;refresh()};

  document.addEventListener("pointerup",ev=>{const b=ev.target.closest?.("#newBtn,#linkBtn,#detachBtn,#eraseBtn");if(!b||!actionMap.has(b))return;ev.preventDefault();ev.stopImmediatePropagation();const t=actionMap.get(b),now=performance.now();
    if(held===t){if(lastTool===t&&now-lastAt<=360){if(releaseTimer)clearTimeout(releaseTimer);releaseTimer=0;setHeld(t);lastTool=null;lastAt=0}else{lastTool=t;lastAt=now;if(releaseTimer)clearTimeout(releaseTimer);releaseTimer=setTimeout(()=>{releaseTimer=0;if(held===t)clearHeld();lastTool=null;lastAt=0},365)}return}
    if(lastTool===t&&now-lastAt<=360){if(releaseTimer)clearTimeout(releaseTimer);releaseTimer=0;setHeld(t);lastTool=null;lastAt=0;return}
    lastTool=t;lastAt=now;setOneShot(t)
  },true);
  document.addEventListener("click",ev=>{if(ev.target.closest?.("#newBtn,#linkBtn,#detachBtn,#eraseBtn")){ev.preventDefault();ev.stopImmediatePropagation()}},true);
  document.addEventListener("dblclick",ev=>{if(ev.target.closest?.("#newBtn,#linkBtn,#detachBtn,#eraseBtn")){ev.preventDefault();ev.stopImmediatePropagation()}},true);

  // Context menu follows toolbar order. Zoom entries are useful on PC right-click only.
  if(menu){menu.replaceChildren();const items=[
    ["戻る",()=>undo(),()=>historyPast.length<=1],["進む",()=>redo(),()=>historyFuture.length===0],["全体",()=>fitAll()],["拡大",()=>zoomBy(1.18)],["縮小",()=>zoomBy(1/1.18)],
    ["選択",()=>setPcTool("select",true)],["新規丸",()=>setOneShot("new")],["紐付け",()=>setOneShot("link")],["分離",()=>setOneShot("detach")],["消しゴム",()=>setOneShot("erase")]
  ];for(const[label,fn,disabled]of items){const b=document.createElement("button");b.textContent=label;b.dataset.f19Context="1";b.addEventListener("pointerup",ev=>{ev.preventDefault();ev.stopPropagation();if(disabled?.())return;fn();hideContext()});menu.appendChild(b)}}

  window.__mochiFix19UI={zoomBy,getHeld:()=>held,actionToolCount:actionMap.size};refresh();
})();
