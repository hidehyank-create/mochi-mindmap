"use strict";
(function installFix27P(){
  if(!window.__mochiFix27MInstalled||!window.__mochiFix27MTest){setTimeout(installFix27P,25);return}
  if(window.__mochiFix27PInstalled)return;window.__mochiFix27PInstalled=true;
  const F27P_BUILD="0916-FIX27P",M=window.__mochiFix27MTest;

  // A hidden contour is owned by the object whose exterior is being hidden.
  // Do not emit one copy per occluder: a node and its incident hose can cover
  // the same part of a lower hose, but that exterior is still one contour.
  const orderedNodes=()=>[...nodes].sort((a,b)=>f24NodeZ(a)-f24NodeZ(b)||((a.created??0)-(b.created??0)));
  const orderedLinks=()=>f24LinkOrder();
  const linkAbove=(low,up)=>{
    const os=orderedLinks(),a=os.findIndex(l=>l.id===low.id),b=os.findIndex(l=>l.id===up.id);
    return a>=0&&b>a;
  };
  function nodeCoversLink(n,l,p){
    return n.id!==l.a&&n.id!==l.b&&!f25LinkAboveNode(l,n)&&dist(p.x,p.y,n.x,n.y)<=n.r+1;
  }
  function higherLinkCovers(low,p){
    return orderedLinks().some(up=>up.id!==low.id&&linkAbove(low,up)&&f25PointInLinkShape(up,p,.6));
  }
  function externalLinkPoint(l,p){
    const a=nodeById(l.a),b=nodeById(l.b);
    if((a&&dist(p.x,p.y,a.x,a.y)<a.r-.2)||(b&&dist(p.x,p.y,b.x,b.y)<b.r-.2))return false;
    return !links.some(o=>o.id!==l.id&&sameComponent(o.a,l.a)&&f25PointInLinkShape(o,p,.12));
  }
  function linkHiddenAt(l,p){
    if(!externalLinkPoint(l,p))return false;
    return nodes.some(n=>nodeCoversLink(n,l,p))||higherLinkCovers(l,p);
  }
  function linkSideRuns(l){
    const A=f21RootInfo(l,true),B=f21RootInfo(l,false);if(!A||!B)return[];
    const t0=Math.min(A.t,B.t),t1=Math.max(A.t,B.t),out=[];
    for(const side of[-1,1]){let cur=[];
      for(let i=0;i<=320;i++){
        const t=t0+(t1-t0)*i/320,p=quadPoint(l,t),tg=quadTangent(l,t),u=unit(tg.x,tg.y),off=linkWidth(l)/2+1;
        const q={x:p.x-u.y*off*side,y:p.y+u.x*off*side};
        if(linkHiddenAt(l,q))cur.push(q);else if(cur.length){if(cur.length>1)out.push({d:f23Path(cur),side});cur=[]}
      }
      if(cur.length>1)out.push({d:f23Path(cur),side});
    }
    return out;
  }
  function rootRuns(l){
    const out=[];
    for(const fromA of[true,false]){
      const g=f23RootGeom(l,fromA);if(!g)continue;
      for(const c of[g.top,g.bottom])for(const d of f23CurveRuns(c,p=>linkHiddenAt(l,p)))out.push({d,fromA});
    }
    return out;
  }
  function nodeHiddenAt(n,p){
    const underNode=nodes.some(up=>up.id!==n.id&&f24NodeZ(up)>f24NodeZ(n)&&!sameComponent(n.id,up.id)&&dist(p.x,p.y,up.x,up.y)<=up.r+1);
    const underLink=links.some(l=>f25LinkAboveNode(l,n)&&f25PointInLinkShape(l,p,.55));
    return (underNode||underLink)&&!M.ownOpeningAt(n,p,.15);
  }
  function nodeRuns(n){
    const out=[],steps=520,R=n.r+.85;let cur=[];
    for(let i=0;i<=steps;i++){
      const a=-Math.PI+2*Math.PI*i/steps,p={x:n.x+Math.cos(a)*R,y:n.y+Math.sin(a)*R};
      if(nodeHiddenAt(n,p))cur.push(p);else if(cur.length){if(cur.length>1)out.push(f23Path(cur));cur=[]}
    }
    if(cur.length>1)out.push(f23Path(cur));return out;
  }
  function append(d,attrs){hiddenLayer.appendChild(sEl("path",{d,class:"hidden-outline","data-f27p":"1",...attrs}));}

  f25RenderHidden=function(){
    hiddenLayer.replaceChildren();
    // One traversal per lower exterior: its hidden runs are the union of all
    // higher occluders, so no second route can redraw an overlapping segment.
    for(const n of orderedNodes())for(const d of nodeRuns(n))append(d,{"data-f27p-owner":`node:${n.id}`,"data-f27p-contour":"node","data-f27p-lower":n.id});
    for(const l of orderedLinks()){
      for(const run of linkSideRuns(l))append(run.d,{"data-f27p-owner":`link-side:${l.id}:${run.side}`,"data-f27p-contour":"link-side","data-f27p-lower":l.id});
      for(const run of rootRuns(l))append(run.d,{"data-f27p-owner":`root:${l.id}:${run.fromA?"a":"b"}`,"data-f27p-contour":"root","data-f27p-lower":l.id});
    }
  };
  renderHidden=f25RenderHidden;
  renderAll=function(){if(renderRAF){cancelAnimationFrame(renderRAF);renderRAF=0}shadowLayer.style.display="";overlapLayer.style.display="";hiddenLayer.style.display="";renderShadow();renderLinks(false);renderNodes();f25RenderBoundaries();f25RenderHidden();renderUI();f22PlaceStatus();f24PlaceGuide()};
  renderMotionNow=function(){shadowLayer.style.display="none";hiddenLayer.style.display="";renderLinks(true);renderNodes();f25RenderBoundaries();f25RenderHidden();renderUI();f22PlaceStatus();f24PlaceGuide()};
  window.__mochiFix27PTest={linkSideRuns,rootRuns,nodeRuns,linkHiddenAt};
  statusText=function(t){status.innerHTML=`餅マップ v0.9.4<br>BUILD ${F27P_BUILD}<br>${t}`;f22PlaceStatus()};
  renderAll();statusText("待機中");
  if(!document.getElementById("f27qLoader")){const s=document.createElement("script");s.id="f27qLoader";s.src="app-fix27q.js?v=0917-fix27aa";document.body.appendChild(s)}
})();
