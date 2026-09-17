"use strict";
(function installFix27Q(){
  if(!window.__mochiFix27PInstalled||!window.__mochiFix27PTest){setTimeout(installFix27Q,25);return}
  if(window.__mochiFix27QInstalled)return;window.__mochiFix27QInstalled=true;
  const F27Q_BUILD="0916-FIX27Q",P=window.__mochiFix27PTest;
  const orderedNodes=()=>[...nodes].sort((a,b)=>f24NodeZ(a)-f24NodeZ(b)||((a.created??0)-(b.created??0)));
  const orderedLinks=()=>f24LinkOrder();
  function curvePoints(c,reverse=false,steps=70){const out=[];for(let i=0;i<=steps;i++)out.push(f23Cubic(c[0],c[1],c[2],c[3],reverse?1-i/steps:i/steps));return out}
  function hosePoints(l,side,steps=320){const A=f21RootInfo(l,true),B=f21RootInfo(l,false);if(!A||!B)return[];const t0=Math.min(A.t,B.t),t1=Math.max(A.t,B.t),out=[],off=linkWidth(l)/2+1;for(let i=0;i<=steps;i++){const t=t0+(t1-t0)*i/steps,p=quadPoint(l,t),tg=quadTangent(l,t),u=unit(tg.x,tg.y);out.push({x:p.x-u.y*off*side,y:p.y+u.x*off*side})}return out}
  // One exterior path: root-R at A → hose side → root-R at B. The prior
  // renderer stroked these three pieces separately, leaving an almost-parallel
  // root/hose pair around an overlaid circle.
  function compositeSideRuns(l,side){const ga=f23RootGeom(l,true),gb=f23RootGeom(l,false);if(!ga||!gb)return[];const ca=side===1?ga.top:ga.bottom,cb=side===-1?gb.top:gb.bottom,points=[...curvePoints(ca),...hosePoints(l,side),...curvePoints(cb,true)],out=[];let cur=[];for(const p of points){if(P.linkHiddenAt(l,p))cur.push(p);else if(cur.length){if(cur.length>1)out.push(f23Path(cur));cur=[]}}if(cur.length>1)out.push(f23Path(cur));return out}
  function append(d,attrs){hiddenLayer.appendChild(sEl("path",{d,class:"hidden-outline","data-f27q":"1",...attrs}));}
  f25RenderHidden=function(){hiddenLayer.replaceChildren();for(const n of orderedNodes())for(const d of P.nodeRuns(n))append(d,{"data-f27q-owner":`node:${n.id}`,"data-f27q-contour":"node","data-f27q-lower":n.id});for(const l of orderedLinks())for(const side of[-1,1])for(const d of compositeSideRuns(l,side))append(d,{"data-f27q-owner":`link-exterior:${l.id}:${side}`,"data-f27q-contour":"link-exterior","data-f27q-lower":l.id,"data-f27q-side":side});};
  renderHidden=f25RenderHidden;
  renderAll=function(){if(renderRAF){cancelAnimationFrame(renderRAF);renderRAF=0}shadowLayer.style.display="";overlapLayer.style.display="";hiddenLayer.style.display="";renderShadow();renderLinks(false);renderNodes();f25RenderBoundaries();f25RenderHidden();renderUI();f22PlaceStatus();f24PlaceGuide()};
  renderMotionNow=function(){shadowLayer.style.display="none";hiddenLayer.style.display="";renderLinks(true);renderNodes();f25RenderBoundaries();f25RenderHidden();renderUI();f22PlaceStatus();f24PlaceGuide()};
  window.__mochiFix27QTest={compositeSideRuns};
  statusText=function(t){status.innerHTML=`餅マップ v0.9.4<br>BUILD ${F27Q_BUILD}<br>${t}`;f22PlaceStatus()};renderAll();statusText("待機中");
  if(!document.getElementById("f27rLoader")){const s=document.createElement("script");s.id="f27rLoader";s.src="app-fix27r.js?v=0917-fix27x";document.body.appendChild(s)}
  if(document.getElementById("regressionResults")){const loadTest=()=>{if(document.getElementById("regression27q"))return;if(!document.getElementById("regression27m")){setTimeout(loadTest,25);return}const s=document.createElement("script");s.src="app-regression27q.js?v=0916-fix27q";document.body.appendChild(s)};loadTest()}
})();
