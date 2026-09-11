"use strict";
(function(){
  const T=window.__mochiFix17Test||{},out=document.getElementById("regressionResults"),results=[];
  function assert(x,m){if(!x)throw new Error(m)}
  function test(name,fn){try{fn();results.push({name,ok:true})}catch(e){results.push({name,ok:false,error:e?.message||String(e)})}}
  function N(id,x,y,r=70,z=1,label=id){return{id,x,y,r,label,z,created:z}}
  function L(id,a,b,seq=1,z=2,control=null){return{id,a,b,seq,z,control}}
  function A(id,a,b,seq=1){return{id,a,b,seq,newerId:a}}
  function reset(ns=[],ls=[],as=[]){if(renderRAF){cancelAnimationFrame(renderRAF);renderRAF=0}gesture=null;selected=null;pcTool=null;nodes.splice(0,nodes.length,...ns.map(x=>({...x})));links.splice(0,links.length,...ls.map(x=>({...x,control:x.control?{...x.control}:null})));attachments.splice(0,attachments.length,...as.map(x=>({...x})));crossPairs.clear();zSeq=Math.max(2,...nodes.map(n=>n.z||0));view.x=0;view.y=0;view.scale=1;applyView();renderAll()}

  test("F17-01 ヒョコ丸は出現時から十分な大きさ",()=>{reset([N("a",300,350,80,1),N("b",474,350,80,2)]);const m=T.budMetrics(nodeById("a"),nodeById("b"));assert(m.visible,"迎えなし");assert(m.strength>=.70,"0から成長している");assert(m.half>=18,"ヒョコ丸が小さい");const d=T.budPath(nodeById("a"),nodeById("b"),m);assert(d&&((d.match(/ C /g)||[]).length>=2),"根本Rが滑らかでない")});
  test("F17-02 くびれRはFIX16より小さい",()=>{reset([N("a",350,350,80,1),N("b",502,350,80,2)],[],[A("m","a","b")]);const p=T.neckProfile(attachments[0],0);assert(p.waist<80*.565,"FIX16同等以上");assert(p.waist>80*.44,"細すぎる")});
  test("F17-03 接着コンポーネント内部に濃い線なし",()=>{reset([N("a",400,350,90,1),N("b",560,350,90,5)],[],[A("m","a","b")]);renderNodes();assert(!nodesLayer.querySelector('[data-overlap-rim="node-node"]'),"接着内部に濃い線")});
  test("F17-04 3個接着端は中央・反対端を固定",()=>{reset([N("a",300,350,60,1),N("b",412,350,60,2),N("c",524,350,60,3)],[],[A("m1","a","b"),A("m2","b","c")]);const beforeB={x:nodeById("b").x,y:nodeById("b").y},beforeC={x:nodeById("c").x,y:nodeById("c").y};startMoveGesture({pointerId:91,pointerType:"mouse"},{x:300,y:350},nodeById("a"));assert(gesture?.mode==="f17Pivot3Fixed","専用ピボットでない");penMove({pointerId:91,pointerType:"mouse",clientX:0,clientY:0,preventDefault(){}});assert(nodeById("b").x===beforeB.x&&nodeById("b").y===beforeB.y,"中央が動いた");assert(nodeById("c").x===beforeC.x&&nodeById("c").y===beforeC.y,"反対端が動いた");gesture=null});
  test("F17-05 完全被覆下丸は全周破線",()=>{reset([N("low",500,350,55,1),N("up",500,350,145,5)]);T.renderHidden();assert(hiddenLayer.querySelector('[data-hidden-node="low"][data-full-cover="1"]'),"全周破線なし")});
  test("F17-06 完全被覆の下丸＋紐は根本R破線なし",()=>{reset([N("low",500,350,55,1),N("other",760,350,55,1),N("up",500,350,150,8)],[L("l","low","other",1,2)]);T.renderHidden();assert(hiddenLayer.querySelector('[data-hidden-link="l"]'),"隠れ紐破線なし");assert(!hiddenLayer.querySelector('[data-hidden-root="l"]'),"完全被覆で根本R破線が出る")});
  test("F17-07 部分被覆では接続部の破線を補う",()=>{reset([N("low",430,350,70,1),N("other",760,350,60,1),N("up",475,350,85,8)],[L("l","low","other",1,2)]);T.renderHidden();assert(hiddenLayer.querySelector('[data-hidden-link="l"]'),"隠れ紐なし");assert(hiddenLayer.querySelector('[data-hidden-root="l"][data-partial-root="1"]'),"部分被覆の接続部破線なし")});
  test("F17-08 上下Zは移動開始だけで変えない",()=>{reset([N("low",430,350,90,1),N("up",500,350,90,5)]);const z=nodeById("low").z;startMoveGesture({pointerId:92,pointerType:"mouse"},{x:430,y:350},nodeById("low"));assert(nodeById("low").z===z,"移動開始でZ変更");gesture=null});
  test("F17-09 紐交差境界はFIX15より長くならない",()=>{reset([N("a",180,350,55,1),N("b",820,350,55,1),N("c",500,100,55,1),N("d",500,600,55,1)],[L("h","a","b",1,6),L("v","c","d",2,2)]);const upper=linkById("h"),lower=linkById("v"),raw=f15LinkLinkRanges(upper,lower)[0],compact=T.compactRange(upper,lower,raw[0],raw[1]);assert(f15RangeArcLength(upper,compact[0],compact[1],30)<=f15RangeArcLength(upper,raw[0],raw[1],30)+.01,"境界が長くなった")});
  test("F17-10 紐交差境界は個別の短いbutt区間",()=>{reset([N("a",180,350,55,1),N("b",820,350,55,1),N("c",500,100,55,1),N("d",500,600,55,1)],[L("h","a","b",1,6),L("v","c","d",2,2)]);T.renderBoundaries();const e=overlapLayer.querySelector('[data-f17-compact="1"]');assert(e,"FIX17境界なし");assert(e.getAttribute("stroke-linecap")==="butt","端が丸く伸びる")});
  test("F17-11 2個接着ピボットを維持",()=>{reset([N("a",400,350,70,1),N("b",532,350,70,2)],[],[A("m","a","b")]);startMoveGesture({pointerId:93,pointerType:"mouse"},{x:400,y:350},nodeById("a"));assert(gesture?.mode==="pivot","2個ピボット退行");gesture=null});
  test("F17-12 4個以上は数珠たわみを維持",()=>{reset([N("a",250,350,50,1),N("b",342,350,50,2),N("c",434,350,50,3),N("d",526,350,50,4)],[],[A("m1","a","b"),A("m2","b","c"),A("m3","c","d")]);startMoveGesture({pointerId:94,pointerType:"mouse"},{x:250,y:350},nodeById("a"));assert(gesture?.mode==="move"&&gesture?.f13Bead,"数珠たわみ退行");gesture=null});

  const ok=results.every(r=>r.ok);document.body.dataset.regression17Status=ok?"PASS":"FAIL";
  const box=document.createElement("div");box.id="regression17";box.innerHTML=`<h3>FIX17 ${ok?"PASS":"FAIL"} (${results.filter(r=>r.ok).length}/${results.length})</h3>`+results.map(r=>`<div class="${r.ok?'pass':'fail'}">${r.ok?'✓':'✗'} ${r.name}${r.ok?'':` — ${r.error}`}</div>`).join("");out?.prepend(box);
})();
