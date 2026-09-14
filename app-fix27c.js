"use strict";
(function installFix27C(){
  if(!window.__mochiFix27Installed||!window.__mochiFix27Test){setTimeout(installFix27C,25);return}
  if(window.__mochiFix27CInstalled)return;window.__mochiFix27CInstalled=true;
  const F27C_BUILD="0915-FIX27C",DBL_MS=450,DBL_SLOP_PX=18;
  const T27=window.__mochiFix27Test;
  let lastPress=null,resizeArmedId=null;
  const prevPenDown=penDown,prevPenMove=penMove;

  function pxPerWorld(){const m=world.getScreenCTM?.();return Math.max(.01,m?Math.hypot(m.a,m.b):view.scale||1)}
  function doubleSlopWorld(){return DBL_SLOP_PX/pxPerWorld()}
  function isSecondPress(prev,id,p,now){return !!(prev&&prev.id===id&&now-prev.t<=DBL_MS&&dist(prev.p.x,prev.p.y,p.x,p.y)<=doubleSlopWorld())}
  function targetAt(p){return T27.dblTargetAt(p)}
  function armResize(n){selected={type:"node",id:n.id};resizeArmedId=n.id;gesture=null;statusText("リサイズモード：黄色／丸全体でダブルクリック・ダブルタップ");renderUI()}
  function beginResize(evt,n,p){selected={type:"node",id:n.id};resizeArmedId=null;gesture={pointerId:evt.pointerId,mode:"resize",nodeId:n.id,start:p,last:p,startR:n.r,resizeStartDist:dist(n.x,n.y,p.x,p.y),inputType:evt.pointerType||"mouse"};try{svg.setPointerCapture?.(evt.pointerId)}catch(_){}statusText("リサイズ：黄色表示／ドラッグで変更");renderUI()}

  // Native dblclick only survived reliably near the old edge/hold zone. Stop it and
  // recognize the second pointer press ourselves over the entire visible circle.
  window.addEventListener("dblclick",evt=>{if(evt.target===svg||svg.contains(evt.target)){evt.preventDefault();evt.stopImmediatePropagation()}},true);

  penDown=function(evt,allowTouch=false){
    if(gesture||(!allowTouch&&touches.size)||confirmDelete.style.display==="block")return;
    if(T27.workToolActive?.()){lastPress=null;return prevPenDown(evt,allowTouch)}
    const p=eventToWorld(evt),n=targetAt(p);
    if(resizeArmedId){
      if(n&&n.id===resizeArmedId){evt.preventDefault();lastPress=null;beginResize(evt,n,p);return}
      resizeArmedId=null;renderUI();
    }
    if(n){
      const now=performance.now();
      if(isSecondPress(lastPress,n.id,p,now)){
        evt.preventDefault();evt.stopPropagation();lastPress=null;armResize(n);return;
      }
      lastPress={id:n.id,t:now,p:{x:p.x,y:p.y},pointerId:evt.pointerId};
    }else lastPress=null;
    return prevPenDown(evt,allowTouch)
  };

  penMove=function(evt){
    if(lastPress&&lastPress.pointerId===evt.pointerId){const p=eventToWorld(evt);if(dist(lastPress.p.x,lastPress.p.y,p.x,p.y)>doubleSlopWorld())lastPress=null}
    return prevPenMove(evt)
  };

  const baseRenderUI=renderUI;
  renderUI=function(){baseRenderUI();if(resizeArmedId&&!gesture){const n=nodeById(resizeArmedId);if(n)uiLayer.appendChild(sEl("circle",{cx:n.x,cy:n.y,r:n.r+14/view.scale,class:"f27-resize-armed","data-f27c-resize":"1"}))}};

  window.__mochiFix27CTest={targetAt,isSecondPress,doubleMs:DBL_MS,doubleSlopWorld,resizeArmed:()=>resizeArmedId};
  statusText=function(t){status.innerHTML=`餅マップ v0.9.4<br>BUILD ${F27C_BUILD}<br>${t}`;f22PlaceStatus()};
  renderAll();statusText("待機中");
})();
