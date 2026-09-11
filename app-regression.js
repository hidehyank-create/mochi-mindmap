"use strict";
(function(){
  const panel=document.getElementById("regressionPanel"),resultsEl=document.getElementById("regressionResults"),scenarioEl=document.getElementById("scenarioButtons");
  const T10=window.__mochiFix10Test,T12=window.__mochiFix12Test||{};
  function n(id,x,y,r=70,z=1,label=id){return{id,x,y,r,label,z,created:z}}
  function l(id,a,b,control=null,seq=1){return{id,a,b,control,seq}}
  function a(id,x,y,seq=1){return{id,a:x,b:y,seq,newerId:x}}
  function resetState(ns=[],ls=[],as=[]){
    if(renderRAF){cancelAnimationFrame(renderRAF);renderRAF=0}
    if(T12.cancelAttachAnimation)T12.cancelAttachAnimation();
    gesture=null;selected=null;pcTool=null;firstXStroke=null;clearLiveSource();receiverState=null;
    nodes.splice(0,nodes.length,...ns.map(x=>({...x})));
    links.splice(0,links.length,...ls.map(x=>x.control?{...x,control:{...x.control}}:{...x}));
    attachments.splice(0,attachments.length,...as.map(x=>({...x})));
    crossPairs.clear();zSeq=Math.max(2,...nodes.map(x=>x.z||0));attachSeq=Math.max(0,...attachments.map(x=>x.seq||0));linkSeq=Math.max(1,...links.map(x=>x.seq||0)+1);
    view.x=0;view.y=0;view.scale=1;applyView();renderAll();
  }
  function overlapScenario(){resetState([n("x1",430,350,92,1,"重なり下"),n("x2",500,350,92,5,"重なり上")])}
  function dangoScenario(){resetState([n("d1",350,350,70,1,"端1"),n("d2",482,350,70,2,"中央"),n("d3",614,350,70,3,"端2")],[],[a("m1","d1","d2",1),a("m2","d2","d3",2)])}
  function ringScenario(){resetState([n("r1",500,220,66,1,"1"),n("r2",630,315,66,2,"2"),n("r3",580,470,66,3,"3"),n("r4",420,470,66,4,"4"),n("r5",370,315,66,5,"5")],[],[a("ra","r1","r2",1),a("rb","r2","r3",2),a("rc","r3","r4",3),a("rd","r4","r5",4),a("re","r5","r1",5)])}
  function rootCoverScenario(){resetState([n("a",300,350,70,1,"A"),n("b",700,350,70,2,"B"),n("cover",355,350,90,9,"上丸")],[l("p","a","b",null,1)])}
  function siblingCoverScenario(){resetState([n("a",300,350,70,1,"A"),n("sib",432,350,70,8,"接着丸"),n("c",760,350,70,2,"C")],[l("p","a","c",null,1)],[a("m","a","sib",1)])}
  const scenarios=[["1 重なり2丸",overlapScenario],["2 接着団子3兄弟",dangoScenario],["3 ポンデリング",ringScenario],["4 根本R隠れ",rootCoverScenario],["5 接着丸＋紐",siblingCoverScenario]];
  for(const [label,fn] of scenarios){const b=document.createElement("button");b.textContent=label;b.addEventListener("click",fn);scenarioEl.appendChild(b)}

  const results=[];function test(name,fn){try{fn();results.push({name,ok:true})}catch(e){results.push({name,ok:false,error:e&&e.message?e.message:String(e)})}}function assert(cond,msg){if(!cond)throw new Error(msg)}
  function fakeEvt(id){return{pointerId:id,pointerType:"pen",preventDefault(){}}}

  test("01 丸×丸の重なりは状態も破線外形も作らない",()=>{overlapScenario();adoptExistingOverlapsAsCross(["x2"]);assert(crossPairs.size===0,"crossPairs が作られた");assert(attachments.length===0,"attachment が作られた");renderHidden();assert(hiddenLayer.querySelectorAll("[data-hidden-node]").length===0,"丸×丸の重なり破線が残る")});
  test("02 旧履歴のcrossPairsは自動消去される",()=>{overlapScenario();crossPairs.add(pairKey("x1","x2"));renderAll();assert(crossPairs.size===0,"旧crossPairsが残った")});
  test("03 接触前から双方の迎え半円がひょこっと出る",()=>{assert(typeof T12.contactMetrics==="function","FIX12 contactMetrics 未実装");resetState([n("a",300,350),n("b",510,350)]);const m=T12.contactMetrics(nodeById("a"),nodeById("b"));assert(m.visible,"迎え半円が出る距離なのに非表示");T12.renderContactPreview("a","b");assert(liveLayer.querySelectorAll("#f12ContactPreview [data-bud]").length===2,"双方の半円が描画されない")});
  test("04 迎え半円は丸中心線上に並ぶ",()=>{assert(typeof T12.contactMetrics==="function","FIX12 contactMetrics 未実装");resetState([n("a",280,300,72),n("b",505,410,80)]);const m=T12.contactMetrics(nodeById("a"),nodeById("b")),vx=nodeById("b").x-nodeById("a").x,vy=nodeById("b").y-nodeById("a").y;for(const p of[m.tipA,m.tipB]){const wx=p.x-nodeById("a").x,wy=p.y-nodeById("a").y;assert(Math.abs(vx*wy-vy*wx)<1e-4,"半円先端が中心線から外れる")}});
  test("05 半円接触で離すと動かした側だけ固定距離へ接着",()=>{assert(typeof T12.finishAttachNow==="function","FIX12 finishAttachNow 未実装");resetState([n("a",300,350),n("b",510,350)]);const e=fakeEvt(301),bx=nodeById("b").x;startMoveGesture(e,{x:300,y:350},nodeById("a"));updateMoveGesture(gesture,{x:350,y:350});assert(gesture?.contactPair,"半円接触が接着候補にならない");const g=gesture,pair={...g.contactPair};T12.finishAttachNow(g,pair);assert(directAttached("a","b"),"接着されない");assert(Math.abs(nodeById("b").x-bx)<1e-6,"相手側の丸が動いた");assert(Math.abs(dist(nodeById("a").x,nodeById("a").y,nodeById("b").x,nodeById("b").y)-(nodeById("a").r+nodeById("b").r-ATTACH_OVERLAP))<.6,"固定距離に収束しない");gesture=null});
  test("06 半円を無視して押し込むと接着せず単なる重なり",()=>{resetState([n("a",300,350),n("b",510,350)]);const e=fakeEvt(302);startMoveGesture(e,{x:300,y:350},nodeById("a"));updateMoveGesture(gesture,{x:390,y:350});assert(!gesture?.contactPair,"深い重なりでも接着候補が残る");penEnd(e);assert(attachments.length===0,"押し込みで接着した");assert(crossPairs.size===0,"押し込みで交差状態を作った")});
  test("07 接着くびれは直線橋でなく大きなRの曲線",()=>{resetState([n("a",350,350,76,1),n("b",494,350,76,2)],[],[a("m","a","b",1)]);const e=mergeBridge(attachments[0],false),d=e?.getAttribute("d")||"";assert(d.includes("C"),"くびれにBezier Rがない");assert(!e.hasAttribute("stroke")||e.getAttribute("stroke")==="none","旧直線stroke橋のまま")});
  test("08 丸×丸の重なり部分には破線を描かない",()=>{overlapScenario();renderHidden();assert(hiddenLayer.querySelectorAll("[data-hidden-node]").length===0,"重なった丸の破線が出る")});
  test("09 丸に隠れた紐は外形破線＋根本R破線を出す",()=>{rootCoverScenario();renderHidden();assert(hiddenLayer.querySelectorAll("[data-hidden-link]").length>0,"隠れ紐の外形破線がない");assert(hiddenLayer.querySelectorAll("[data-hidden-root]").length>0,"根本Rの破線がない")});
  test("10 接着した兄弟丸では内部の紐破線を出さない",()=>{siblingCoverScenario();renderHidden();assert(hiddenLayer.querySelectorAll('[data-hidden-cover="sib"]').length===0,"接着丸との内部に破線が残る")});
  test("11 接着丸のサイズ変更は接着面を固定して外向きに成長",()=>{assert(typeof T12.applyAnchoredResize==="function","FIX12 anchored resize 未実装");resetState([n("a",300,350,70,2),n("b",432,350,70,1)],[],[a("m","a","b",1)]);const A=nodeById("a"),B=nodeById("b"),oldBx=B.x;T12.applyAnchoredResize(A,105,B);assert(Math.abs(B.x-oldBx)<1e-6,"相手丸が動いた");assert(Math.abs(dist(A.x,A.y,B.x,B.y)-(A.r+B.r-ATTACH_OVERLAP))<.6,"接着面が固定されない");assert(A.x<300,"拡大丸が相手と反対側へ成長していない")});
  test("12 団子3兄弟は中央が全体移動・端が回転",()=>{dangoScenario();const e=fakeEvt(303);startMoveGesture(e,{x:482,y:350},nodeById("d2"));assert(gesture?.mode==="move"&&gesture.compIds.length===3,"中央が全体移動でない");gesture=null;if(renderRAF){cancelAnimationFrame(renderRAF);renderRAF=0}startMoveGesture(e,{x:350,y:350},nodeById("d1"));assert(gesture?.mode==="pivot","端が回転でない");gesture=null;if(renderRAF){cancelAnimationFrame(renderRAF);renderRAF=0}});
  test("13 ポンデリングはどの丸からでも全体移動",()=>{ringScenario();const e=fakeEvt(304);for(const id of["r1","r2","r3","r4","r5"]){const q=nodeById(id);startMoveGesture(e,{x:q.x,y:q.y},q);assert(gesture?.mode==="move"&&gesture.compIds.length===5,`${id}が全体移動でない`);gesture=null;if(renderRAF){cancelAnimationFrame(renderRAF);renderRAF=0}}});
  test("14 分離ボタンは上部ツールバーのワンショット操作",()=>{const b=document.getElementById("detachBtn");assert(b,"分離ボタンがない");setPcTool("detach",true);assert(b.classList.contains("active"),"分離ボタンがactiveにならない");clearOneShotTool();assert(!b.classList.contains("active"),"ワンショット解除されない")});
  test("15 下部操作窓を廃止し上部アイコンバーにする",()=>{const c=document.getElementById("controls"),cs=getComputedStyle(c),h=getComputedStyle(document.getElementById("help"));assert(cs.top!=="auto","ツールバーが上部配置でない");assert(h.display==="none","下の操作案内が残る");for(const b of c.querySelectorAll("button")){assert(b.getAttribute("aria-label"),"アイコンボタンにaria-labelがない");assert(b.querySelector("svg"),"文字ボタンのまま")}});
  test("16 キャンバス倍率変更はdocumentズームを使わない",()=>{resetState([n("z",500,350,70,1)]);const r=svg.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2,p=_clientPointToSvg(cx,cy),anchor=svgToWorldPoint(p);T10.applyAbsoluteCanvasScale(cx,cy,1,.6,anchor);assert(Math.abs(view.scale-.6)<1e-6,"canvas倍率が0.6でない");assert(!document.documentElement.style.zoom,"document zoomを変更した")});

  const allOk=results.every(r=>r.ok);document.body.dataset.regressionStatus=allOk?"PASS":"FAIL";resultsEl.innerHTML=results.map(r=>`<div class="${r.ok?'pass':'fail'}">${r.ok?'✓':'✗'} ${r.name}${r.ok?'':` — ${r.error}`}</div>`).join("");panel.querySelector("h2").textContent=`回帰テスト ${allOk?'PASS':'FAIL'} (${results.filter(r=>r.ok).length}/${results.length})`;overlapScenario();
})();
