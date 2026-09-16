"use strict";
(function installFix27R(){
  if(!window.__mochiFix27QInstalled||!window.__mochiFix27PTest){setTimeout(installFix27R,25);return}
  if(window.__mochiFix27RInstalled)return;window.__mochiFix27RInstalled=true;
  const F27R_BUILD="0917-FIX27T",P=window.__mochiFix27PTest;
  const diagnosticStyle=document.createElement("style");diagnosticStyle.id="f27tLayerColors";diagnosticStyle.textContent=`#hiddenLayer path.hidden-outline{stroke:#e32636!important}#zTopLayer path{stroke:#1769e0!important}#overlapLayer path{stroke:#16a34a!important}#linksLayer path,#mergeLayer path,#liveLayer path{stroke:#a21caf!important}`;document.head.appendChild(diagnosticStyle);
  const orderedNodes=()=>[...nodes].sort((a,b)=>f24NodeZ(a)-f24NodeZ(b)||((a.created??0)-(b.created??0)));
  const orderedLinks=()=>f24LinkOrder();
  const linkAbove=(low,up)=>{const os=orderedLinks(),a=os.findIndex(l=>l.id===low.id),b=os.findIndex(l=>l.id===up.id);return a>=0&&b>a};
  function nodeCoversLink(n,l,p){return n.id!==l.a&&n.id!==l.b&&!f25LinkAboveNode(l,n)&&dist(p.x,p.y,n.x,n.y)<=n.r+1}
  function externalLinkPoint(l,p){const a=nodeById(l.a),b=nodeById(l.b);if((a&&dist(p.x,p.y,a.x,a.y)<a.r-.2)||(b&&dist(p.x,p.y,b.x,b.y)<b.r-.2))return false;return !links.some(o=>o.id!==l.id&&sameComponent(o.a,l.a)&&f25PointInLinkShape(o,p,.12))}
  // A node owns every part of a lower contour that lies under it.  A hose
  // rooted in that node must never become a second owner of the same contour.
  function ownerAt(l,p){
    const node=orderedNodes().find(n=>nodeCoversLink(n,l,p));
    if(node)return{kind:"node",id:node.id};
    const upper=orderedLinks().find(up=>up.id!==l.id&&linkAbove(l,up)&&f25PointInLinkShape(up,p,.6));
    return upper?{kind:"link",id:upper.id}:null;
  }
  function hiddenAt(l,p){return externalLinkPoint(l,p)&&!!ownerAt(l,p)}
  function curvePoints(c,reverse=false,steps=70){const out=[];for(let i=0;i<=steps;i++)out.push(f23Cubic(c[0],c[1],c[2],c[3],reverse?1-i/steps:i/steps));return out}
  function hosePoints(l,side,steps=320){const A=f21RootInfo(l,true),B=f21RootInfo(l,false);if(!A||!B)return[];const t0=Math.min(A.t,B.t),t1=Math.max(A.t,B.t),out=[],off=linkWidth(l)/2+1;for(let i=0;i<=steps;i++){const t=t0+(t1-t0)*i/steps,p=quadPoint(l,t),tg=quadTangent(l,t),u=unit(tg.x,tg.y);out.push({x:p.x-u.y*off*side,y:p.y+u.x*off*side})}return out}
  function contourRuns(l,side){const ga=f23RootGeom(l,true),gb=f23RootGeom(l,false);if(!ga||!gb)return[];const ca=side===1?ga.top:ga.bottom,cb=side===-1?gb.top:gb.bottom,points=[...curvePoints(ca),...hosePoints(l,side),...curvePoints(cb,true)],out=[];let cur=[];for(const p of points){if(hiddenAt(l,p))cur.push(p);else if(cur.length){if(cur.length>1)out.push(f23Path(cur));cur=[]}}if(cur.length>1)out.push(f23Path(cur));return out}
  function append(d,attrs){const color=attrs?.["data-f27r-contour"]==="node"?"#d12c5b":"#1479d1";hiddenLayer.appendChild(sEl("path",{d,class:"hidden-outline","data-f27r":"1",...attrs,style:`stroke:${color};stroke-width:2;stroke-dasharray:9 8;opacity:.9`}))}
  function suppressDuplicateZTop(){
    const hidden=[...hiddenLayer.querySelectorAll("path.hidden-outline")];
    const samples=hidden.map(path=>{const len=path.getTotalLength();const out=[];for(let i=0;i<=10;i++){const p=path.getPointAtLength(len*i/10);out.push(p)}return out});
    const near=(p,pts)=>pts.some(q=>Math.hypot(p.x-q.x,p.y-q.y)<=3.5);
    for(const path of [...zTopLayer.querySelectorAll("path[data-z-boundary]")]){
      const kind=path.getAttribute("data-z-boundary")||"";
      if(!/(sep|upper-link-side|upper-link-root|node-over-link)$/.test(kind))continue;
      const len=path.getTotalLength();if(len<8)continue;
      let hit=0,total=0;
      for(let i=1;i<10;i++){const p=path.getPointAtLength(len*i/10);total++;if(samples.some(pts=>near(p,pts)))hit++}
      if(total&&hit/total>=.55)path.remove();
    }
  }
  f25RenderHidden=function(){
    hiddenLayer.replaceChildren();
    for(const n of orderedNodes())for(const d of P.nodeRuns(n))append(d,{"data-f27r-owner":`node:${n.id}`,"data-f27r-contour":"node","data-f27r-lower":n.id});
    for(const l of orderedLinks())for(const side of[-1,1])for(const d of contourRuns(l,side))append(d,{"data-f27r-owner":`link-exterior:${l.id}:${side}`,"data-f27r-contour":"link-exterior","data-f27r-lower":l.id,"data-f27r-side":side});
    suppressDuplicateZTop();
  };
  renderHidden=f25RenderHidden;
  renderAll=function(){if(renderRAF){cancelAnimationFrame(renderRAF);renderRAF=0}shadowLayer.style.display="";overlapLayer.style.display="";hiddenLayer.style.display="";renderShadow();renderLinks(false);renderNodes();f25RenderBoundaries();f25RenderHidden();renderUI();f22PlaceStatus();f24PlaceGuide()};
  renderMotionNow=function(){shadowLayer.style.display="none";hiddenLayer.style.display="";renderLinks(true);renderNodes();f25RenderBoundaries();f25RenderHidden();renderUI();f22PlaceStatus();f24PlaceGuide()};
  window.__mochiFix27RTest={ownerAt,hiddenAt,contourRuns};
  statusText=function(t){status.innerHTML=`餅マップ v0.9.4<br>BUILD ${F27R_BUILD}<br>${t}`;f22PlaceStatus()};renderAll();statusText("診断色：hidden＝赤／zTop＝青／overlap＝緑／その他＝紫");
  if(document.getElementById("regressionResults")){const loadTest=()=>{if(document.getElementById("regression27r"))return;if(!document.getElementById("regression27q")){setTimeout(loadTest,25);return}const s=document.createElement("script");s.src="app-regression27r.js?v=0916-fix27r";document.body.appendChild(s)};loadTest()}
})();
