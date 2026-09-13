"use strict";
(function(){
  const NS="http://www.w3.org/2000/svg";
  function path(d,a={}){const p=document.createElementNS(NS,"path");p.setAttribute("d",d);for(const[k,v]of Object.entries(a))p.setAttribute(k,v);return p}

  // Eraser: black outline, exposed rubber remains white, rear paper sleeve is gray.
  const e=document.querySelector("#eraseBtn svg");if(e){
    e.setAttribute("viewBox","0 0 34 28");e.setAttribute("data-f21-eraser","1");
    e.replaceChildren(
      path("M4.2 19.2 18.8 4.6Q20.4 3 22 4.6L29.2 11.8Q30.8 13.4 29.2 15L16.2 28H9.6Z",{"data-icon-part":"body",fill:"white",stroke:"currentColor","stroke-width":"2","stroke-linejoin":"round"}),
      path("M11.8 11.6 18.8 4.6Q20.4 3 22 4.6L29.2 11.8Q30.8 13.4 29.2 15L19.1 18.9Z",{"data-icon-part":"paper",fill:"currentColor",stroke:"currentColor","stroke-width":"2",opacity:".30","stroke-linejoin":"round"}),
      path("M11.8 11.6 19.1 18.9",{"data-icon-part":"divider",fill:"none",stroke:"currentColor","stroke-width":"2"})
    );
  }

  const actions=[[newBtn,"new"],[document.getElementById("linkBtn"),"link"],[document.getElementById("detachBtn"),"detach"],[eraseBtn,"erase"]].filter(x=>x[0]),actionMap=new Map(actions);
  let held=null,lastTool=null,lastAt=0,lastTimer=0,cancelTimer=0,cancelTool=null;
  function labelFor(t){return actions.find(([,x])=>x===t)?.[0]?.getAttribute("aria-label")||t}
  function refresh(){
    selectBtn?.classList.toggle("active",pcTool==="select");selectBtn?.classList.remove("held");selectBtn?.setAttribute("aria-pressed","false");
    for(const[b,t]of actions){b.classList.toggle("active",pcTool===t);b.classList.toggle("held",held===t);b.setAttribute("aria-pressed",held===t?"true":"false")}
  }
  function setOne(t){held=null;pcTool=t;refresh();statusText(`${labelFor(t)}：1回`)}
  function setHeld(t){held=t;pcTool=t;refresh();statusText(`${labelFor(t)}：連続モード`)}
  function cancelHeld(){held=null;pcTool=null;cancelTool=null;if(cancelTimer)clearTimeout(cancelTimer);cancelTimer=0;refresh();statusText("通常操作")}
  function armSelect(){held=null;pcTool="select";refresh();statusText("選択：1回")}

  // Every operation calls this in several generations of the app.  Four creation/edit tools stay active
  // while held; selection is deliberately one-shot only.
  clearOneShotTool=function(){if(held){pcTool=held;refresh();return}pcTool=null;refresh()};

  // Capture on window so the older FIX19/FIX20 delegated button handlers never run first.
  window.addEventListener("pointerup",ev=>{
    const b=ev.target.closest?.("#selectBtn,#newBtn,#linkBtn,#detachBtn,#eraseBtn");
    if(!b){if(held)setTimeout(()=>{if(held){pcTool=held;refresh()}},0);return}
    ev.preventDefault();ev.stopImmediatePropagation();
    if(b===selectBtn){if(cancelTimer)clearTimeout(cancelTimer);cancelTimer=0;cancelTool=null;held=null;lastTool=null;lastAt=0;armSelect();return}
    if(!actionMap.has(b))return;const t=actionMap.get(b),now=performance.now();

    if(held===t){
      // A single click while held cancels.  Wait briefly so a double click can be recognized and ignored.
      if(cancelTool===t&&cancelTimer&&now-lastAt<=360){clearTimeout(cancelTimer);cancelTimer=0;cancelTool=null;lastTool=null;lastAt=0;setHeld(t);return}
      cancelTool=t;lastTool=t;lastAt=now;if(cancelTimer)clearTimeout(cancelTimer);cancelTimer=setTimeout(()=>{cancelTimer=0;if(held===t&&cancelTool===t)cancelHeld()},365);return;
    }

    if(lastTool===t&&now-lastAt<=360){if(lastTimer)clearTimeout(lastTimer);lastTimer=0;lastTool=null;lastAt=0;setHeld(t);return}
    if(cancelTimer){clearTimeout(cancelTimer);cancelTimer=0;cancelTool=null}
    lastTool=t;lastAt=now;setOne(t);if(lastTimer)clearTimeout(lastTimer);lastTimer=setTimeout(()=>{lastTimer=0;lastTool=null;lastAt=0},365);
  },true);
  window.addEventListener("click",ev=>{if(ev.target.closest?.("#selectBtn,#newBtn,#linkBtn,#detachBtn,#eraseBtn")){ev.preventDefault();ev.stopImmediatePropagation()}},true);
  window.addEventListener("dblclick",ev=>{if(ev.target.closest?.("#selectBtn,#newBtn,#linkBtn,#detachBtn,#eraseBtn")){ev.preventDefault();ev.stopImmediatePropagation()}},true);

  window.__mochiFix21UI={
    getHeld:()=>held,actionCount:actions.length,selectCanHold:false,
    forceHeld:t=>setHeld(t),forceCancel:()=>cancelHeld(),armSelect,
    contextLabels:()=>[...document.querySelectorAll("#contextMenu button")].map(b=>b.textContent)
  };
  refresh();
})();
