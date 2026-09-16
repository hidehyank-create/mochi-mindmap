"use strict";
(function installFix27K(){
  if(!window.__mochiFix27JInstalled||!window.__mochiFix27Test){setTimeout(installFix27K,25);return}
  if(window.__mochiFix27KInstalled)return;window.__mochiFix27KInstalled=true;
  const F27K_BUILD="0916-FIX27K";

  const incidentLinks=n=>links.filter(l=>l.a===n.id||l.b===n.id);
  function insideOwnCompositeExceptNode(n,p){
    return incidentLinks(n).some(l=>f25PointInLinkShape(l,p,.15));
  }
  function pointInsideEndpointNode(l,p){
    const a=nodeById(l.a),b=nodeById(l.b);
    return !!((a&&dist(p.x,p.y,a.x,a.y)<a.r-.2)||(b&&dist(p.x,p.y,b.x,b.y)<b.r-.2));
  }
  function pointInsideSiblingLink(l,p){
    return links.some(o=>o.id!==l.id&&sameComponent(o.a,l.a)&&f25PointInLinkShape(o,p,.12));
  }
  function externalLinkPoint(l,p){return !pointInsideEndpointNode(l,p)&&!pointInsideSiblingLink(l,p)}

  function circleRunsUnderLink(n,l){
    if(l.a===n.id||l.b===n.id||!f25LinkAboveNode(l,n))return[];
    return f14CircleArcRuns(n,p=>f25PointInLinkShape(l,p,.5)&&!insideOwnCompositeExceptNode(n,p),480);
  }
  function linkSideRunsUnderNode(l,n){
    if(n.id===l.a||n.id===l.b||f25LinkAboveNode(l,n))return[];
    const A=f21RootInfo(l,true),B=f21RootInfo(l,false);if(!A||!B)return[];
    const t0=Math.min(A.t,B.t),t1=Math.max(A.t,B.t),out=[];
    for(const side of[-1,1]){let cur=[];for(let i=0;i<=300;i++){
      const t=t0+(t1-t0)*i/300,p=quadPoint(l,t),tg=quadTangent(l,t),u=unit(tg.x,tg.y),off=linkWidth(l)/2+1;
      const q={x:p.x-u.y*off*side,y:p.y+u.x*off*side};
      const hidden=dist(q.x,q.y,n.x,n.y)<=n.r+1&&externalLinkPoint(l,q);
      if(hidden)cur.push(q);else if(cur.length){if(cur.length>1)out.push(f23Path(cur));cur=[]}
    }if(cur.length>1)out.push(f23Path(cur))}return out;
  }
  function rootRunsUnderNode(l,n){
    if(n.id===l.a||n.id===l.b||f25LinkAboveNode(l,n))return[];
    const out=[];for(const fromA of[true,false]){const g=f23RootGeom(l,fromA);if(!g)continue;
      const test=p=>dist(p.x,p.y,n.x,n.y)<=n.r+1&&externalLinkPoint(l,p);
      out.push(...f23CurveRuns(g.top,test),...f23CurveRuns(g.bottom,test));
    }return out;
  }
  function linkSideRunsUnderLink(low,up){
    const A=f21RootInfo(low,true),B=f21RootInfo(low,false);if(!A||!B)return[];
    const t0=Math.min(A.t,B.t),t1=Math.max(A.t,B.t),out=[];
    for(const side of[-1,1]){let cur=[];for(let i=0;i<=320;i++){
      const t=t0+(t1-t0)*i/320,p=quadPoint(low,t),tg=quadTangent(low,t),u=unit(tg.x,tg.y),off=linkWidth(low)/2+1;
      const q={x:p.x-u.y*off*side,y:p.y+u.x*off*side};
      const hidden=f25PointInLinkShape(up,q,.6)&&externalLinkPoint(low,q);
      if(hidden)cur.push(q);else if(cur.length){if(cur.length>1)out.push(f23Path(cur));cur=[]}
    }if(cur.length>1)out.push(f23Path(cur))}return out;
  }
  function rootRunsUnderLink(low,up){
    const out=[];for(const fromA of[true,false]){const g=f23RootGeom(low,fromA);if(!g)continue;
      const test=p=>f25PointInLinkShape(up,p,.6)&&externalLinkPoint(low,p);
      out.push(...f23CurveRuns(g.top,test),...f23CurveRuns(g.bottom,test));
    }return out;
  }

  const prevBound=f25RenderBoundaries;
  f25RenderBoundaries=function(){
    prevBound();
    // FIX27J removed all upper-link separators. Restore them: when a hose is
    // visibly on top, both external sides (and root R sides) must remain solid.
    for(const l of links)for(const n of nodes){
      if(n.id===l.a||n.id===l.b||!f25LinkAboveNode(l,n))continue;
      for(const d of f25LinkSideRunsNode(l,n))f15ZTopLayer.appendChild(sEl("path",{d,fill:"none",stroke:F25_SEP,"stroke-width":F25_SEP_W,"stroke-linecap":"round","stroke-linejoin":"round","data-z-boundary":"f27k-upper-link-side"}));
      for(const fromA of[true,false])for(const d of f25RootRunsAgainst(l,n,fromA,true))f15ZTopLayer.appendChild(sEl("path",{d,fill:"none",stroke:F25_SEP,"stroke-width":F25_SEP_W,"stroke-linecap":"round","data-z-boundary":"f27k-upper-link-root"}));
    }
  };
  f18RenderZBoundaries=f25RenderBoundaries;f15RenderZBoundaries=f25RenderBoundaries;renderOverlapEdges=f25RenderBoundaries;

  f25RenderHidden=function(){
    hiddenLayer.replaceChildren();
    const ns=[...nodes].sort((a,b)=>f24NodeZ(a)-f24NodeZ(b)||((a.created??0)-(b.created??0)));
    // node under node: keep established rule (already understands root openings)
    for(let i=0;i<ns.length;i++)for(let j=i+1;j<ns.length;j++)for(const d of f25HiddenCircleRuns(ns[i],ns[j]))hiddenLayer.appendChild(sEl("path",{d,class:"hidden-outline","data-f27k":"node-node"}));
    // node/link overlaps: linked object is treated as one composite silhouette.
    for(const n of ns)for(const l of links){
      if(f25LinkAboveNode(l,n)){
        for(const d of circleRunsUnderLink(n,l))hiddenLayer.appendChild(sEl("path",{d,class:"hidden-outline","data-f27k":"node-under-link"}));
      }else{
        for(const d of linkSideRunsUnderNode(l,n))hiddenLayer.appendChild(sEl("path",{d,class:"hidden-outline","data-f27k":"link-side-under-node"}));
        for(const d of rootRunsUnderNode(l,n))hiddenLayer.appendChild(sEl("path",{d,class:"hidden-outline","data-f27k":"root-under-node"}));
      }
    }
    // link/link overlaps: same exterior-only rule on both side contours and roots.
    const os=f24LinkOrder();for(let i=1;i<os.length;i++)for(let j=0;j<i;j++){
      const up=os[i],low=os[j];
      for(const d of linkSideRunsUnderLink(low,up))hiddenLayer.appendChild(sEl("path",{d,class:"hidden-outline","data-f27k":"link-under-link"}));
      for(const d of rootRunsUnderLink(low,up))hiddenLayer.appendChild(sEl("path",{d,class:"hidden-outline","data-f27k":"root-under-link"}));
    }
  };
  renderHidden=f25RenderHidden;
  renderAll=function(){if(renderRAF){cancelAnimationFrame(renderRAF);renderRAF=0}shadowLayer.style.display="";overlapLayer.style.display="";hiddenLayer.style.display="";renderShadow();renderLinks(false);renderNodes();f25RenderBoundaries();f25RenderHidden();renderUI();f22PlaceStatus();f24PlaceGuide()};
  renderMotionNow=function(){shadowLayer.style.display="none";hiddenLayer.style.display="";renderLinks(true);renderNodes();f25RenderBoundaries();f25RenderHidden();renderUI();f22PlaceStatus();f24PlaceGuide()};

  window.__mochiFix27KTest={insideOwnCompositeExceptNode,externalLinkPoint,circleRunsUnderLink,linkSideRunsUnderNode,rootRunsUnderNode,linkSideRunsUnderLink,rootRunsUnderLink};
  statusText=function(t){status.innerHTML=`餅マップ v0.9.4<br>BUILD ${F27K_BUILD}<br>${t}`;f22PlaceStatus()};
  renderAll();statusText("待機中");
})();
