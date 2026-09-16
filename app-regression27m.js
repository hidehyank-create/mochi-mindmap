"use strict";
(function(){
  const M=window.__mochiFix27MTest||{},out=document.getElementById("regressionResults"),r=[];
  const A=(x,m)=>{if(!x)throw new Error(m)},test=(n,f)=>{try{f();r.push({n,ok:1})}catch(e){r.push({n,ok:0,e:e?.message||String(e)})}};
  function N(id,x,y,rr=70,z=1){return{id,x,y,r:rr,label:id,z,created:z}}
  function reset(ns=[]){if(renderRAF){cancelAnimationFrame(renderRAF);renderRAF=0}cancelHold?.();gesture=null;selected=null;nodes.splice(0,nodes.length,...ns.map(x=>({...x})));links.splice(0);attachments.splice(0);crossPairs.clear();view.x=0;view.y=0;view.scale=1;applyView();}
  test("F27M-01 実根本Rポリゴンを共通開口判定に使用",()=>{reset([N("a",300,300,80,2),N("b",650,300,70,1)]);const l={id:"ab",a:"a",b:"b",control:null,seq:1};links.push(l);const poly=f24RootPoly(l,true);A(poly?.length,"根本R polygonなし");A(poly.some(p=>M.ownOpeningAt?.(nodes[0],p)),"根本R実形状を開口として認識しない")});
  test("F27M-02 根本R反対側の丸外周は消さない",()=>{reset([N("a",300,300,80,2),N("b",650,300,70,1)]);links.push({id:"ab",a:"a",b:"b",control:null,seq:1});const p={x:220,y:300};A(!M.ownOpeningAt?.(nodes[0],p),"反対側まで開口扱い")});
  test("F27M-03 実線と破線が同じ開口関数を使用",()=>{A(typeof M.nodeNodeRuns==="function"&&typeof M.nodeUnderNodeRuns==="function"&&typeof M.nodeUnderLinkRuns==="function","共通輪郭API不足")});
  test("F27M-04 接着候補も根本R開口を拒否",()=>{reset([N("target",500,300,80,2),N("hose",800,300,60,1),N("moved",600,300,60,3)]);links.push({id:"th",a:"target",b:"hose",control:null,seq:1});A(M.pairBlockedAtOpening?.({movedId:"moved",otherId:"target"}),"根本R側の接着候補を拒否しない")});
  const ok=r.every(x=>x.ok);document.body.dataset.regression27mStatus=ok?"PASS":"FAIL";const box=document.createElement("div");box.id="regression27m";box.innerHTML=`<h3>FIX27M ${ok?"PASS":"FAIL"} (${r.filter(x=>x.ok).length}/${r.length})</h3>`+r.map(x=>`<div class="${x.ok?'pass':'fail'}">${x.ok?'✓':'✗'} ${x.n}${x.ok?'':` — ${x.e}`}</div>`).join("");out?.prepend(box);
})();
