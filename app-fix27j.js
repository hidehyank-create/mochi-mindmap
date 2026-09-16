"use strict";
(function installFix27J(){
  if(!window.__mochiFix27IInstalled||!window.__mochiFix27Test){setTimeout(installFix27J,25);return}
  if(window.__mochiFix27JInstalled)return;window.__mochiFix27JInstalled=true;
  const F27J_BUILD="0916-FIX27J";

  const hasIncident=n=>links.some(l=>l.a===n.id||l.b===n.id);
  const rootGapAt=(n,p)=>f21CircleGap(n,Math.atan2(p.y-n.y,p.x-n.x),Number.POSITIVE_INFINITY);

  function circleUnderLinkComposite(n,l){
    if(l.a===n.id||l.b===n.id||!f25LinkAboveNode(l,n))return[];
    return f14CircleArcRuns(n,p=>f25PointInLinkShape(l,p,.5)&&!rootGapAt(n,p),420);
  }

  function linkSideRunsUnderLink(low,up){
    const A=f21RootInfo(low,true),B=f21RootInfo(low,false);if(!A||!B)return[];
    const t0=Math.min(A.t,B.t),t1=Math.max(A.t,B.t),out=[];
    for(const side of[-1,1]){
      let cur=[];
      for(let i=0;i<=280;i++){
        const t=t0+(t1-t0)*i/280,p=quadPoint(low,t),tg=quadTangent(low,t),u=unit(tg.x,tg.y),off=linkWidth(low)/2+1;
        const q={x:p.x-u.y*off*side,y:p.y+u.x*off*side};
        const hidden=f25PointInLinkShape(up,q,.6);
        if(hidden)cur.push(q);else if(cur.length){if(cur.length>1)out.push(f23Path(cur));cur=[]}
      }
      if(cur.length>1)out.push(f23Path(cur));
    }
    return out;
  }

  function rootRunsUnderLink(low,up){
    const out=[];
    for(const fromA of[true,false]){
      const g=f23RootGeom(low,fromA);if(!g)continue;
      const src=g.ri.n;
      const test=p=>f25PointInLinkShape(up,p,.6)&&dist(p.x,p.y,src.x,src.y)>=src.r-.8;
      out.push(...f23CurveRuns(g.top,test),...f23CurveRuns(g.bottom,test));
    }
    return out;
  }

  const prevRenderBoundaries=f25RenderBoundaries;
  f25RenderBoundaries=function(){
    prevRenderBoundaries();
    // Linked-shape overlaps are expressed by the hidden object's dashed outer
    // silhouette, not by a white internal separator.  Keep yellow redraw/fill
    // layers that establish z-order; remove only the white separator strokes.
    overlapLayer.querySelectorAll('[data-z-boundary="f25-node-link-sep"]').forEach(e=>{
      const id=e.getAttribute("data-upper"),n=id&&nodeById(id);if(n&&hasIncident(n))e.remove();
    });
    // These older separator paths do not carry node ids. For node/link overlap,
    // the dashed hidden silhouette is now the single visual language, so remove
    // the white separator family globally while preserving node-node separators.
    f15ZTopLayer.querySelectorAll('[data-z-boundary="f25-link-node-sep"],[data-z-boundary="f25-root-node-sep"]').forEach(e=>e.remove());
  };
  f18RenderZBoundaries=f25RenderBoundaries;f15RenderZBoundaries=f25RenderBoundaries;renderOverlapEdges=f25RenderBoundaries;
  if(window.__mochiFix25Render)window.__mochiFix25Render.renderBoundaries=f25RenderBoundaries;
  if(window.__mochiFix25Test)window.__mochiFix25Test.renderBoundaries=f25RenderBoundaries;

  const prevHidden=f25RenderHidden;
  f25RenderHidden=function(){
    prevHidden();
    // Rebuild circle-under-link dashes with the same root opening gaps used by
    // hidden circle-under-circle outlines, so a linked node reads as one shape.
    hiddenLayer.querySelectorAll('[data-f25-node-under-link="1"]').forEach(e=>e.remove());
    for(const n of nodes)for(const l of links)for(const d of circleUnderLinkComposite(n,l))hiddenLayer.appendChild(sEl("path",{
      d,class:"hidden-outline","data-f27j-composite-circle":"1","data-node":n.id,"data-cover-link":l.id
    }));

    // Existing code had no dashed outline for a lower hose hidden by an upper
    // hose. Add only the lower hose's external side/root contours: never a
    // centerline and never an internal separator.
    const os=f24LinkOrder();
    for(let i=1;i<os.length;i++){
      const up=os[i];
      for(let j=0;j<i;j++){
        const low=os[j];
        for(const d of linkSideRunsUnderLink(low,up))hiddenLayer.appendChild(sEl("path",{
          d,class:"hidden-outline","data-f27j-link-link-side":"1","data-lower":low.id,"data-upper":up.id
        }));
        for(const d of rootRunsUnderLink(low,up))hiddenLayer.appendChild(sEl("path",{
          d,class:"hidden-outline","data-f27j-link-link-root":"1","data-lower":low.id,"data-upper":up.id
        }));
      }
    }
  };
  renderHidden=f25RenderHidden;
  renderAll=function(){if(renderRAF){cancelAnimationFrame(renderRAF);renderRAF=0}shadowLayer.style.display="";overlapLayer.style.display="";hiddenLayer.style.display="";renderShadow();renderLinks(false);renderNodes();f25RenderBoundaries();f25RenderHidden();renderUI();f22PlaceStatus();f24PlaceGuide()};
  renderMotionNow=function(){shadowLayer.style.display="none";hiddenLayer.style.display="";renderLinks(true);renderNodes();f25RenderBoundaries();f25RenderHidden();renderUI();f22PlaceStatus();f24PlaceGuide()};

  window.__mochiFix27JTest={circleUnderLinkComposite,linkSideRunsUnderLink,rootRunsUnderLink,hasIncident};
  statusText=function(t){status.innerHTML=`餅マップ v0.9.4<br>BUILD ${F27J_BUILD}<br>${t}`;f22PlaceStatus()};
  renderAll();statusText("待機中");
})();
