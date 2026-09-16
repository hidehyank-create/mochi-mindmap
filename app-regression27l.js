"use strict";
(function(){
  const L=window.__mochiFix27LTest||{},out=document.getElementById("regressionResults"),r=[];
  const A=(x,m)=>{if(!x)throw new Error(m)},test=(n,f)=>{try{f();r.push({n,ok:1})}catch(e){r.push({n,ok:0,e:e?.message||String(e)})}};
  function N(id,x,y,rr=70,z=1){return{id,x,y,r:rr,label:id,z,created:z}}
  function reset(ns=[]){if(renderRAF){cancelAnimationFrame(renderRAF);renderRAF=0}cancelHold?.();gesture=null;selected=null;nodes.splice(0,nodes.length,...ns.map(x=>({...x})));links.splice(0);attachments.splice(0);crossPairs.clear();view.x=0;view.y=0;view.scale=1;applyView();}
  test("F27L-01 上側丸の実線も自分の根本R開口を認識",()=>{reset([N("n",500,350,80,3),N("d",500,600,60,2)]);links.push({id:"own",a:"n",b:"d",control:null,seq:2});const p={x:500,y:430};A(f21CircleGap(nodes[0],Math.atan2(p.y-nodes[0].y,p.x-nodes[0].x),Infinity),"既存の開口判定がfalse");A(L.ownRootGapAt?.(nodes[0],p),"実線側が根本R開口を認識しない")});
  test("F27L-02 丸境界生成APIは根本R開口除外版",()=>{A(typeof L.nodeBoundaryRunsGap==="function","丸境界の開口除外APIなし");A(typeof L.nodeLinkBoundaryRunsGap==="function","丸-紐境界の開口除外APIなし")});
  const ok=r.every(x=>x.ok);document.body.dataset.regression27lStatus=ok?"PASS":"FAIL";const box=document.createElement("div");box.id="regression27l";box.innerHTML=`<h3>FIX27L ${ok?"PASS":"FAIL"} (${r.filter(x=>x.ok).length}/${r.length})</h3>`+r.map(x=>`<div class="${x.ok?'pass':'fail'}">${x.ok?'✓':'✗'} ${x.n}${x.ok?'':` — ${x.e}`}</div>`).join("");out?.prepend(box);
})();
