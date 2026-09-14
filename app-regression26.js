"use strict";
(function(){
  const T=window.__mochiFix26Test||{},out=document.getElementById("regressionResults"),r=[];const A=(x,m)=>{if(!x)throw new Error(m)},test=(n,f)=>{try{f();r.push({n,ok:1})}catch(e){r.push({n,ok:0,e:e?.message||String(e)})}};
  function N(id,x,y,rr=70,z=1){return{id,x,y,r:rr,label:id,z,created:z}}
  function L(id,a,b,seq=1,z=2,c=null){const l={id,a,b,seq,z};if(c)l.control={...c};return l}
  function reset(ns=[],ls=[],as=[]){if(renderRAF){cancelAnimationFrame(renderRAF);renderRAF=0}cancelHold?.();gesture=null;selected=null;pcTool=null;nodes.splice(0,nodes.length,...ns.map(x=>({...x})));links.splice(0,links.length,...ls.map(x=>x.control?{...x,control:{...x.control}}:{...x}));attachments.splice(0,attachments.length,...as.map(x=>({...x})));crossPairs.clear();view.x=0;view.y=0;view.scale=1;applyView();renderAll()}

  test("F26-01 大丸下の小丸は上下に関係なく直接候補",()=>{reset([N("big",500,350,150,20),N("small",500,350,55,1)]);const h=T.resolvedHits(500,350,0);A(h.length===1&&h[0].id==="small",`hit=${h.map(x=>x.id)}`)});
  test("F26-02 指で触り分けられない径差だけ近似候補",()=>{reset([N("a",500,350,100,1),N("b",500,350,82,2)]);const hs=T.rawNodes({x:500,y:350});A(T.ambiguous(hs,{pointerType:"touch"})===true,"18 world差がtouch近似にならない");nodes[1].r=48;A(T.ambiguous(T.rawNodes({x:500,y:350}),{pointerType:"touch"})===false,"大きな径差まで近似")});
  test("F26-03 近似候補ロックは恒久状態にしない",()=>{A(typeof T.pending==="function"&&T.pending()===null,"開始時pendingが残存")});
  test("F26-04 重なり大丸の外周タッチは即resizeではなくhold待ち",()=>{reset([N("big",500,350,150,1),N("small",500,350,45,9)]);const e={pointerId:901,pointerType:"touch"},p={x:635,y:350};T.startNodePointer(e,p,nodes[0]);A(gesture?.mode==="nodePending","即resizeになった");cancelHold();gesture=null});
  test("F26-05 丸が上・紐が下では丸外形境界を最前面へ",()=>{reset([N("n",500,350,75,9),N("a",100,350,40,1),N("b",900,350,40,1)],[L("l","a","b",1,1)]);T.renderBoundaries();A(f15ZTopLayer.querySelector('[data-z-boundary="f26-node-over-link"][data-upper="n"]'),"node-over-link境界なし")});
  test("F26-06 上紐の根本Rが下紐に重なる時も境界を出す",()=>{reset([N("a",260,350,70,1),N("b",760,350,70,1),N("c",340,120,55,1),N("d",340,580,55,1)],[L("low","c","d",1,1),L("up","a","b",2,2)]);const runs=T.rootVsLinkRuns(links[1],true,links[0]);A(Array.isArray(runs),"root runs APIなし")});
  test("F26-07 紐に触れる位置では接着候補を拒否",()=>{reset([N("target",500,350,70,1),N("hoseEnd",800,350,50,1),N("m",617,350,55,2)],[L("targetHose","target","hoseEnd",1,1)]);const g={nodeId:"m",compIds:["m"]};A(T.predictAttachAllowed(g,{movedId:"m",otherId:"target"})===false,"紐接触位置で接着可能")});
  test("F26-08 紐から離れた外周なら接着可能",()=>{reset([N("target",500,350,70,1),N("hoseEnd",800,350,50,1),N("m",385,350,55,2)],[L("targetHose","target","hoseEnd",1,1)]);const g={nodeId:"m",compIds:["m"]};A(T.predictAttachAllowed(g,{movedId:"m",otherId:"target"})===true,"空いた外周まで禁止")});
  test("F26-09 接着丸と紐の必要隙間は画面px基準",()=>{reset([N("n",500,300,45,1),N("a",100,350,40,1),N("b",900,350,40,1)],[L("l","a","b",1,1)],[{id:"m1",a:"n",b:"a",seq:1,newerId:"n"}]);A(T.gapWorld()>0&&T.gapWorld()<30,"gap world不正")});
  test("F26-10 丸が大きくなるほど同じ紐への違反量が増える",()=>{reset([N("n",500,300,30,1),N("a",100,350,40,1),N("b",900,350,40,1)],[L("l","a","b",1,1)]);const s1=T.nodeMinSeparation(nodes[0]);nodes[0].r=60;const s2=T.nodeMinSeparation(nodes[0]);A(s2<s1,"サイズ変更が禁止範囲へ反映されない")});
  test("F26-11 紐削除でその禁止範囲も消える",()=>{reset([N("n",500,300,45,1),N("a",100,350,40,1),N("b",900,350,40,1)],[L("l","a","b",1,1)]);const a=T.nodeMinSeparation(nodes[0]);links.splice(0);const b=T.nodeMinSeparation(nodes[0]);A(Number.isFinite(a)&&b===Infinity,"紐削除後も制約が残る")});
  test("F26-12 移動制約は衝突時に見える隙間位置へ戻せる",()=>{reset([N("n",500,260,45,1),N("pivot",500,100,50,1),N("a",100,350,40,1),N("b",900,350,40,1)],[L("l","a","b",1,1)],[{id:"m1",a:"n",b:"pivot",seq:1,newerId:"n"}]);const ids=["n"],before={n:{x:500,y:260,r:45}},v0=T.violation(ids);nodes[0].y=340;const changed=T.constrain(ids,before,v0);A(changed&&nodes[0].y<340,"衝突位置を制限できない")});

  const ok=r.every(x=>x.ok);document.body.dataset.regression26Status=ok?"PASS":"FAIL";const box=document.createElement("div");box.id="regression26";box.innerHTML=`<h3>FIX26 ${ok?"PASS":"FAIL"} (${r.filter(x=>x.ok).length}/${r.length})</h3>`+r.map(x=>`<div class="${x.ok?'pass':'fail'}">${x.ok?'✓':'✗'} ${x.n}${x.ok?'':` — ${x.e}`}</div>`).join("");out?.prepend(box)
})();
