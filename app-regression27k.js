"use strict";
(function(){
  const K=window.__mochiFix27KTest||{},out=document.getElementById("regressionResults"),r=[];
  const A=(x,m)=>{if(!x)throw new Error(m)},test=(n,f)=>{try{f();r.push({n,ok:1})}catch(e){r.push({n,ok:0,e:e?.message||String(e)})}};
  function N(id,x,y,rr=70,z=1){return{id,x,y,r:rr,label:id,z,created:z}}
  function reset(ns=[]){if(renderRAF){cancelAnimationFrame(renderRAF);renderRAF=0}cancelHold?.();gesture=null;selected=null;nodes.splice(0,nodes.length,...ns.map(x=>({...x})));links.splice(0);attachments.splice(0);crossPairs.clear();view.x=0;view.y=0;view.scale=1;applyView();}
  test("F27K-01 紐付き丸の内部開口は複合外形から除外",()=>{reset([N("a",300,350,80,2),N("b",650,350,70,1)]);links.push({id:"ab",a:"a",b:"b",control:null,seq:1});const p={x:380,y:350};A(K.insideOwnCompositeExceptNode?.(nodes[0],p),"根本開口を複合内部として認識しない")});
  test("F27K-02 紐交差で下側紐の左右外形を生成",()=>{reset([N("a",150,350,60,1),N("b",850,350,60,1),N("c",500,100,60,2),N("d",500,600,60,2)]);links.push({id:"low",a:"a",b:"b",control:null,seq:1},{id:"up",a:"c",b:"d",control:null,seq:2});const rr=K.linkSideRunsUnderLink?.(links[0],links[1])||[];A(rr.length>=2,`左右外形不足 ${rr.length}`)});
  test("F27K-03 上側紐の境界線を両側復元",()=>{reset([N("a",150,350,60,1),N("b",850,350,60,1),N("n",500,350,90,0)]);links.push({id:"up",a:"a",b:"b",control:null,seq:5});renderAll();A(f15ZTopLayer.querySelectorAll('[data-z-boundary="f27k-upper-link-side"]').length>=2,"上側紐の境界線が片側欠落")});
  const ok=r.every(x=>x.ok);document.body.dataset.regression27kStatus=ok?"PASS":"FAIL";const box=document.createElement("div");box.id="regression27k";box.innerHTML=`<h3>FIX27K ${ok?"PASS":"FAIL"} (${r.filter(x=>x.ok).length}/${r.length})</h3>`+r.map(x=>`<div class="${x.ok?'pass':'fail'}">${x.ok?'✓':'✗'} ${x.n}${x.ok?'':` — ${x.e}`}</div>`).join("");out?.prepend(box);
})();
