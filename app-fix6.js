"use strict";
// v0.9.4 FIX6 targeted hotfixes: selection re-drag, cross-pair independence,
// precise link-crossing halo alignment, symmetric edited-link root R.

const _toolSelectFix5 = toolSelect;
toolSelect = function(evt){
  evt.preventDefault();
  const p = eventToWorld(evt), t = targetAtWorld(p);
  if(t && t.type === "node" && selected?.type === "node" && selected.id === t.id){
    const n = nodeById(t.id);
    if(n){
      startMoveGesture(evt,p,n);
      svg.setPointerCapture?.(evt.pointerId);
      return;
    }
  }
  selected = t ? {...t} : null;
  renderUI();
  statusText(t ? "選択" : "選択解除");
};

const _startMoveGestureFix5 = startMoveGesture;
startMoveGesture = function(evt,p,n){
  const partners=[];
  for(const key of crossPairs){
    const [a,b]=key.split("|");
    if(a===n.id) partners.push(b);
    else if(b===n.id) partners.push(a);
  }
  if(partners.length){
    for(let i=attachments.length-1;i>=0;i--){
      const m=attachments[i], other=m.a===n.id?m.b:(m.b===n.id?m.a:null);
      if(other && partners.includes(other)) attachments.splice(i,1);
    }
    const comp=componentIds(n.id);
    if(comp.length===1){
      bringComponentFront([n.id]);
      gesture={pointerId:evt.pointerId,mode:"move",nodeId:n.id,compIds:[n.id],start:p,
        starts:{[n.id]:{x:n.x,y:n.y}},points:[p],contactPair:null,contactTimer:0,
        crossMode:false,inputType:evt.pointerType||"pen"};
      statusText("交差丸を単独移動");
      scheduleMotionRender();
      return;
    }
  }
  return _startMoveGestureFix5(evt,p,n);
};

linkCrossings = function(upper,lower){
  const hits=[],N=96;
  let pa=quadPoint(upper,0);
  for(let i=1;i<=N;i++){
    const qa=quadPoint(upper,i/N);
    let pb=quadPoint(lower,0);
    for(let j=1;j<=N;j++){
      const qb=quadPoint(lower,j/N), hit=segmentIntersection(pa,qa,pb,qb);
      if(hit){
        const ut=((i-1)+(Number.isFinite(hit.t)?hit.t:.5))/N;
        const lt=((j-1)+(Number.isFinite(hit.u)?hit.u:.5))/N;
        if(ut>.08&&ut<.92&&lt>.08&&lt<.92&&!hits.some(h=>dist(h.x,h.y,hit.x,hit.y)<8/view.scale)){
          const ta=quadTangent(upper,ut),tb=quadTangent(lower,lt),ua=unit(ta.x,ta.y),ub=unit(tb.x,tb.y);
          hits.push({x:hit.x,y:hit.y,t:ut,sin:Math.abs(ua.x*ub.y-ua.y*ub.x)});
        }
      }
      pb=qb;
    }
    pa=qa;
  }
  return hits;
};

localLinkSegment = function(l,t,fullLen){
  const tg=quadTangent(l,t),speed=Math.hypot(tg.x,tg.y)||1,
        dt=clamp((fullLen/2)/speed,.003,.06),t0=clamp(t-dt,0,1),t1=clamp(t+dt,0,1),steps=12;
  let d="";
  for(let i=0;i<=steps;i++){
    const p=quadPoint(l,t0+(t1-t0)*i/steps);
    d += i ? ` L ${p.x} ${p.y}` : `M ${p.x} ${p.y}`;
  }
  return d;
};

curvedRootPatchPath = function(l,fromA){
  const n=nodeById(fromA?l.a:l.b),w=linkWidth(l);
  if(!n) return null;
  let tan=quadTangent(l,fromA?0:1);
  if(!fromA) tan={x:-tan.x,y:-tan.y};
  return rootPatchPath(n,tan,w,1);
};
linkRootPaths = function(l){
  return [{d:curvedRootPatchPath(l,true)},{d:curvedRootPatchPath(l,false)}].filter(x=>x.d);
};

statusText = function(t){status.innerHTML=`餅マップ v0.9.4<br>BUILD 0909-FIX6<br>${t}`};
