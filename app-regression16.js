"use strict";
(function(){
  const T=window.__mochiFix16Test||{},out=document.getElementById("regressionResults"),results=[];
  function assert(x,m){if(!x)throw new Error(m)}
  function test(name,fn){try{fn();results.push({name,ok:true})}catch(e){results.push({name,ok:false,error:e?.message||String(e)})}}
  function N(id,x,y,r=70,z=1,label=id){return{id,x,y,r,label,z,created:z}}
  function L(id,a,b,seq=1,z=2,control=null){return{id,a,b,seq,z,control}}
  function A(id,a,b,seq=1){return{id,a,b,seq,newerId:a}}
  function reset(ns=[],ls=[],as=[]){if(renderRAF){cancelAnimationFrame(renderRAF);renderRAF=0}gesture=null;selected=null;pcTool=null;nodes.splice(0,nodes.length,...ns.map(x=>({...x})));links.splice(0,links.length,...ls.map(x=>({...x,control:x.control?{...x.control}:null})));attachments.splice(0,attachments.length,...as.map(x=>({...x})));crossPairs.clear();zSeq=Math.max(2,...nodes.map(n=>n.z||0));view.x=0;view.y=0;view.scale=1;applyView();renderAll()}

  test("F16-01 ヒョコ形状は大きく滑らかなR",()=>{reset([N("a",300,350,80,1),N("b",474,350,80,2)]);const m=T.budMetrics(nodeById("a"),nodeById("b"));assert(m.visible,"迎えなし");assert(m.half>=20,"まだ小さい");const d=T.budPath(nodeById("a"),nodeById("b"),m);assert(d&&((d.match(/ C /g)||[]).length>=2),"Bezier R不足")});
  test("F16-02 くびれRはFIX15より少し小さい",()=>{reset([N("a",350,350,80,1),N("b",502,350,80,2)],[],[A("m","a","b")]);const p=T.neckProfile(attachments[0],0);assert(p.waist<80*.615,"FIX15同等以上");assert(p.waist>80*.52,"小さすぎる")});
  test("F16-03 接着丸同士には濃い境界線を出さない",()=>{reset([N("a",400,350,90,1),N("b",560,350,90,5)],[],[A("m","a","b")]);renderNodes();assert(!nodesLayer.querySelector('[data-overlap-rim="node-node"]'),"接着部に濃い線")});
  test("F16-04 紐端点の丸には紐由来の濃い線を出さない",()=>{reset([N("a",260,350,90,5),N("b",740,350,90,1)],[L("l","a","b",1,2)]);renderNodes();assert(!nodesLayer.querySelector('[data-id="a"] [data-overlap-rim="node-link"]'),"端点丸に濃い線")});
  test("F16-05 非接着の上丸だけ重なり区間に濃い線",()=>{reset([N("low",430,350,100,1),N("up",520,350,100,5)]);renderNodes();assert(nodesLayer.querySelector('[data-id="up"] [data-overlap-rim="node-node"]'),"上丸境界なし");assert(!nodesLayer.querySelector('[data-id="low"] [data-overlap-rim="node-node"]'),"下丸に濃い線")});
  test("F16-06 完全に隠れた下丸は全周破線",()=>{reset([N("low",500,350,55,1),N("up",500,350,145,5)]);T.renderHidden();assert(hiddenLayer.querySelector('[data-hidden-node="low"][data-full-cover="1"]'),"全被覆破線なし")});
  test("F16-07 部分重なりは下丸側だけ破線",()=>{reset([N("low",450,350,100,1),N("up",530,350,100,5)]);T.renderHidden();assert(hiddenLayer.querySelector('[data-hidden-node="low"]'),"下丸破線なし");assert(!hiddenLayer.querySelector('[data-hidden-node="up"]'),"上丸が破線")});
  test("F16-08 2個接着の端はピボット開始",()=>{reset([N("a",400,350,70,1),N("b",532,350,70,2)],[],[A("m","a","b")]);startMoveGesture({pointerId:81,pointerType:"mouse"},{x:400,y:350},nodeById("a"));assert(gesture?.mode==="pivot","2個が数珠移動になった");gesture=null});
  test("F16-09 3個接着の端は専用ピボット連鎖",()=>{reset([N("a",300,350,60,1),N("b",412,350,60,2),N("c",524,350,60,3)],[],[A("m1","a","b"),A("m2","b","c")]);assert(T.threeChainInfo("a")?.otherId==="c","3連判定失敗");startMoveGesture({pointerId:82,pointerType:"mouse"},{x:300,y:350},nodeById("a"));assert(gesture?.mode==="f16PivotChain","3個端にたわみが入る");gesture=null});
  test("F16-10 4個以上は数珠たわみを維持",()=>{reset([N("a",250,350,50,1),N("b",342,350,50,2),N("c",434,350,50,3),N("d",526,350,50,4)],[],[A("m1","a","b"),A("m2","b","c"),A("m3","c","d")]);startMoveGesture({pointerId:83,pointerType:"mouse"},{x:250,y:350},nodeById("a"));assert(gesture?.mode==="move"&&gesture?.f13Bead,"4個の数珠たわみが消えた");gesture=null});
  test("F16-11 完成紐根本はendpoint接線を使う",()=>{reset([N("a",220,350),N("b",780,350)],[L("l","a","b",1,2,{x:500,y:180})]);const d=curvedRootPatchPath(linkById("l"),true);assert(d&&d.includes("C")&&!/NaN/.test(d),"滑らかな根本Rなし")});
  test("F16-12 FIX15の精密紐交差境界を維持",()=>{reset([N("a",180,350,55,1),N("b",820,350,55,1),N("c",500,100,55,1),N("d",500,600,55,1)],[L("h","a","b",1,6),L("v","c","d",2,2)]);f15RenderZBoundaries();assert(overlapLayer.querySelectorAll('[data-z-boundary="link-link-gap"]').length===1,"紐交差境界退行")});

  const ok=results.every(r=>r.ok);document.body.dataset.regression16Status=ok?"PASS":"FAIL";
  const box=document.createElement("div");box.id="regression16";box.innerHTML=`<h3>FIX16 ${ok?"PASS":"FAIL"} (${results.filter(r=>r.ok).length}/${results.length})</h3>`+results.map(r=>`<div class="${r.ok?'pass':'fail'}">${r.ok?'✓':'✗'} ${r.name}${r.ok?'':` — ${r.error}`}</div>`).join("");out?.prepend(box);
})();
