"use strict";
(function(){
  const T=window.__mochiFix14Test||{},out=document.getElementById("regressionResults");
  const results=[];function assert(x,m){if(!x)throw new Error(m)}function test(name,fn){try{fn();results.push({name,ok:true})}catch(e){results.push({name,ok:false,error:e.message||String(e)})}}
  function N(id,x,y,r=70,z=1,label=id){return{id,x,y,r,label,z,created:z}}
  function L(id,a,b,seq=1,z=null){const q={id,a,b,control:null,seq};if(z!=null)q.z=z;return q}
  function A(id,a,b,seq=1){return{id,a,b,seq,newerId:a}}
  function reset(ns=[],ls=[],as=[]){gesture=null;selected=null;pcTool=null;nodes.splice(0,nodes.length,...ns);links.splice(0,links.length,...ls);attachments.splice(0,attachments.length,...as);crossPairs.clear();zSeq=Math.max(2,...ns.map(n=>n.z||0));view.x=0;view.y=0;view.scale=1;applyView();renderAll()}

  test("F14-01 紐にzが付く",()=>{reset([N("a",250,350),N("b",750,350,70,4)],[L("l","a","b",1)]);T.normalizeLinkZ();assert(Number.isFinite(links[0].z),"link.zなし")});
  test("F14-02 丸×丸は上側の重複外周だけ境界線",()=>{reset([N("a",430,350,100,1),N("b",520,350,100,4)]);T.boundaries();assert(overlapLayer.querySelectorAll('[data-z-boundary="node-node"]').length>0,"node境界なし")});
  test("F14-03 上の丸に濃い外周",()=>{reset([N("a",430,350,100,1),N("b",520,350,100,4)]);renderNodes();assert(nodesLayer.querySelector('[data-id="b"] [data-upper-rim="1"]'),"上丸rimなし")});
  test("F14-04 上紐×下丸は重複区間だけ再描画",()=>{reset([N("a",180,350,60,1),N("b",820,350,60,1),N("c",500,350,105,1)],[L("l","a","b",1,5)]);T.boundaries();assert(overlapLayer.querySelector('[data-z-boundary="link-node-top"]'),"link-node上書きなし")});
  test("F14-05 下紐×上丸は丸外周境界",()=>{reset([N("a",180,350,60,1),N("b",820,350,60,1),N("c",500,350,105,7)],[L("l","a","b",1,2)]);T.boundaries();assert(overlapLayer.querySelector('[data-z-boundary="node-link"]'),"node-link境界なし")});
  test("F14-06 迎え半円は近距離だけ",()=>{reset([N("a",300,350),N("b",520,350)]);let m=T.budMetrics(nodeById("a"),nodeById("b"));assert(!m.visible,"遠距離で迎えが出る");nodeById("b").x=456;m=T.budMetrics(nodeById("a"),nodeById("b"));assert(m.visible,"近距離で迎えが出ない")});
  test("F14-07 迎え先端は紐先端級の小ささ",()=>{reset([N("a",300,350),N("b",455,350)]);const m=T.budMetrics(nodeById("a"),nodeById("b"));assert(m.half<=14,"迎えが大きすぎる");assert(T.budPath(nodeById("a"),nodeById("b"),m)?.includes("C"),"大R曲線でない")});
  test("F14-08 完成くびれRは大きい",()=>{reset([N("a",350,350,80),N("b",502,350,80)],[],[A("m","a","b")]);const p=T.neckProfile(attachments[0],0);assert(p.waist>=80*.60,"くびれRが小さい");assert(p.shoulder>p.waist,"肩R不正")});
  test("F14-09 非接着丸を分離しても飛ばない",()=>{reset([N("a",350,350),N("b",650,350)]);const x=nodeById("a").x,y=nodeById("a").y;assert(T.detach(nodeById("a"),{x,y})===false,"非接着を分離した");assert(nodeById("a").x===x&&nodeById("a").y===y,"非接着丸が動いた")});
  test("F14-10 接着丸の分離は少しだけ",()=>{reset([N("a",350,350),N("b",482,350)],[],[A("m","a","b")]);const before=nodeById("a").x;assert(T.detach(nodeById("a"),{x:416,y:350}),"分離失敗");assert(attachments.length===0,"attachment残存");assert(Math.abs(nodeById("a").x-before)<30,"飛びすぎ")});
  test("F14-11 分離後も迎え候補に戻れる",()=>{reset([N("a",350,350),N("b",482,350)],[],[A("m","a","b")]);T.detach(nodeById("a"),{x:416,y:350});nodeById("a").x=337;const m=T.budMetrics(nodeById("a"),nodeById("b"));assert(m.visible,"分離後の迎え不可")});
  test("F14-12 全体表示は安全余白を取りすぎない",()=>{reset([N("a",250,250,70),N("b",750,450,70)]);fitAll();assert(view.scale>.85,"全体表示が小さすぎる");assert(view.scale<=2.45,"倍率上限超過")});
  test("F14-13 新規丸アイコンは閉じ切らない筆跡",()=>{const p=document.querySelector('#newBtn svg path');assert(p&&!document.querySelector('#newBtn svg circle'),"既製円アイコンのまま")});
  test("F14-14 紐付け/分離は専用自作SVG",()=>{assert(document.querySelectorAll('#linkBtn svg path').length>=2,"紐付け専用形状なし");assert(document.querySelectorAll('#detachBtn svg path').length>=2,"分離専用形状なし")});

  const ok=results.every(r=>r.ok);document.body.dataset.regression14Status=ok?"PASS":"FAIL";
  const box=document.createElement("div");box.id="regression14";box.innerHTML=`<h3>FIX14 ${ok?"PASS":"FAIL"} (${results.filter(r=>r.ok).length}/${results.length})</h3>`+results.map(r=>`<div class="${r.ok?'pass':'fail'}">${r.ok?'✓':'✗'} ${r.name}${r.ok?'':` — ${r.error}`}</div>`).join("");out?.prepend(box);
})();
