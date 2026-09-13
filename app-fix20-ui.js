"use strict";
(function(){
  const menu=document.getElementById("contextMenu"),NS="http://www.w3.org/2000/svg";
  function path(d,a={}){const p=document.createElementNS(NS,"path");p.setAttribute("d",d);for(const[k,v]of Object.entries(a))p.setAttribute(k,v);return p}
  // Eraser: keep FIX19 diagonal, swap wrapper/body tones.
  const e=document.querySelector("#eraseBtn svg");if(e){e.setAttribute("viewBox","0 0 34 28");e.setAttribute("data-f20-eraser","1");e.replaceChildren(path("M4.2 19.2 18.8 4.6Q20.4 3 22 4.6L29.2 11.8Q30.8 13.4 29.2 15L16.2 28H9.6Z",{fill:"currentColor",stroke:"currentColor","stroke-width":"2",opacity:".30"}),path("M4.2 19.2 11.8 11.6 19.1 18.9 11 27.4H9.6Z",{"data-icon-part":"paper",fill:"none",stroke:"currentColor","stroke-width":"2",opacity:"1"}),path("M11.8 11.6 19.1 18.9",{"data-icon-part":"divider",fill:"none",stroke:"currentColor","stroke-width":"2"}))}

  const pairs=[[selectBtn,"select"],[newBtn,"new"],[document.getElementById("linkBtn"),"link"],[document.getElementById("detachBtn"),"detach"],[eraseBtn,"erase"]].filter(x=>x[0]);
  const map=new Map(pairs);let held=null,lastBtn=null,lastAt=0,timer=0;
  function refresh(){for(const[b,t]of pairs){b.classList.toggle("active",pcTool===t);b.classList.toggle("held",held===t);b.setAttribute("aria-pressed",held===t?"true":"false")}}
  function one(t){held=null;pcTool=t;refresh();statusText(`${pairs.find(([,x])=>x===t)?.[0]?.getAttribute("aria-label")||t}：1回`)}
  function hold(t){held=t;pcTool=t;refresh();statusText(`${pairs.find(([,x])=>x===t)?.[0]?.getAttribute("aria-label")||t}：連続モード`)}
  function clear(){held=null;pcTool=null;refresh();statusText("通常操作")}
  clearOneShotTool=function(){if(held){pcTool=held;refresh()}else{pcTool=null;refresh()}};
  document.addEventListener("pointerup",ev=>{const b=ev.target.closest?.("#selectBtn,#newBtn,#linkBtn,#detachBtn,#eraseBtn");if(!b||!map.has(b))return;ev.preventDefault();ev.stopImmediatePropagation();const t=map.get(b),now=performance.now();if(held===t){clear();lastBtn=null;lastAt=0;if(timer)clearTimeout(timer);timer=0;return}if(lastBtn===t&&now-lastAt<=360){if(timer)clearTimeout(timer);timer=0;hold(t);lastBtn=null;lastAt=0;return}lastBtn=t;lastAt=now;one(t);if(timer)clearTimeout(timer);timer=setTimeout(()=>{timer=0;lastBtn=null;lastAt=0},365)},true);
  document.addEventListener("click",ev=>{if(ev.target.closest?.("#selectBtn,#newBtn,#linkBtn,#detachBtn,#eraseBtn")){ev.preventDefault();ev.stopImmediatePropagation()}},true);
  document.addEventListener("dblclick",ev=>{if(ev.target.closest?.("#selectBtn,#newBtn,#linkBtn,#detachBtn,#eraseBtn")){ev.preventDefault();ev.stopImmediatePropagation()}},true);

  if(menu){menu.replaceChildren();const items=[["全体",()=>fitAll()],["選択",()=>one("select")],["新規丸",()=>one("new")],["紐付け",()=>one("link")],["分離",()=>one("detach")],["消しゴム",()=>one("erase")]];for(const[label,fn]of items){const b=document.createElement("button");b.textContent=label;b.dataset.f20Context="1";b.addEventListener("pointerup",ev=>{ev.preventDefault();ev.stopPropagation();fn();hideContext()});menu.appendChild(b)}}
  window.__mochiFix20UI={getHeld:()=>held,toolCount:pairs.length,contextLabels:()=>[...menu.querySelectorAll("button")].map(b=>b.textContent)};refresh();
})();
