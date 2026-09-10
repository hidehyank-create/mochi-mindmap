"use strict";
(function(){
  const panel=document.getElementById("regressionPanel"),resultsEl=document.getElementById("regressionResults"),scenarioEl=document.getElementById("scenarioButtons");
  const T10=window.__mochiFix10Test,T11=window.__mochiFix11Test;
  function n(id,x,y,r=70,z=1,label=id){return{id,x,y,r,label,z,created:z}}
  function l(id,a,b,control=null,seq=1){return{id,a,b,control,seq}}
  function a(id,x,y,seq=1){return{id,a:x,b:y,seq,newerId:x}}
  function resetState(ns=[],ls=[],as=[]){
    if(renderRAF){cancelAnimationFrame(renderRAF);renderRAF=0}
    gesture=null;selected=null;pcTool=null;firstXStroke=null;clearLiveSource();receiverState=null;
    nodes.splice(0,nodes.length,...ns.map(x=>({...x})));
    links.splice(0,links.length,...ls.map(x=>x.control?{...x,control:{...x.control}}:{...x}));
    attachments.splice(0,attachments.length,...as.map(x=>({...x})));
    crossPairs.clear();zSeq=Math.max(2,...nodes.map(x=>x.z||0));attachSeq=Math.max(0,...attachments.map(x=>x.seq||0));linkSeq=Math.max(1,...links.map(x=>x.seq||0)+1);
    view.x=0;view.y=0;view.scale=1;applyView();renderAll();
  }
  function buriedScenario(){
    const ns=[n("h1",440,300,54,1,"隠れ1"),n("h2",520,300,54,2,"隠れ2"),n("h3",440,390,54,3,"隠れ3"),n("h4",520,390,54,4,"隠れ4"),n("o1",180,210,48,5,"外1"),n("o2",770,210,48,6,"外2"),n("o3",180,520,48,7,"外3"),n("o4",770,520,48,8,"外4"),n("cover",480,345,210,20,"巨大丸")];
    const ls=[l("lh1","h1","o1",null,1),l("lh2","h2","o2",null,2),l("lh3","h3","o3",null,3),l("lh4","h4","o4",null,4)];
    resetState(ns,ls,[a("accidental","h4","cover",1)]);
  }
  function overlapScenario(){resetState([n("x1",430,350,92,1,"重なり下"),n("x2",500,350,92,5,"重なり上")])}
  function dangoScenario(){resetState([n("d1",350,350,70,1,"端1"),n("d2",482,350,70,2,"中央"),n("d3",614,350,70,3,"端2")],[],[a("m1","d1","d2",1),a("m2","d2","d3",2)])}
  function ringScenario(){resetState([n("r1",500,220,66,1,"1"),n("r2",630,315,66,2,"2"),n("r3",580,470,66,3,"3"),n("r4",420,470,66,4,"4"),n("r5",370,315,66,5,"5")],[],[a("ra","r1","r2",1),a("rb","r2","r3",2),a("rc","r3","r4",3),a("rd","r4","r5",4),a("re","r5","r1",5)])}
  function hoseOnCircleScenario(){resetState([n("p1",250,350,62,1,"A"),n("p2",750,350,62,2,"B"),n("cover",500,350,105,8,"上丸")],[l("p","p1","p2",null,1)])}
  const scenarios=[["1 巨大丸＋隠れ4丸",buriedScenario],["2 重なり2丸",overlapScenario],["3 団子3兄弟",dangoScenario],["4 ポンデリング",ringScenario],["5 紐 on 丸",hoseOnCircleScenario]];
  for(const [label,fn] of scenarios){const b=document.createElement("button");b.textContent=label;b.addEventListener("click",fn);scenarioEl.appendChild(b)}

  const results=[];function test(name,fn){try{fn();results.push({name,ok:true})}catch(e){results.push({name,ok:false,error:e&&e.message?e.message:String(e)})}}function assert(cond,msg){if(!cond)throw new Error(msg)}
  function hiddenNodeIds(){return new Set([...hiddenLayer.querySelectorAll("[data-hidden-node]")].map(e=>e.getAttribute("data-hidden-node")))}
  function fakeEvt(id){return{pointerId:id,pointerType:"pen",preventDefault(){}}}

  test("01 丸の重なりは位置関係だけで交差状態を作らない",()=>{overlapScenario();adoptExistingOverlapsAsCross(["x2"]);assert(crossPairs.size===0,"crossPairs が作られた");assert(attachments.length===0,"attachment が作られた");renderHidden();assert(hiddenNodeIds().has("x1"),"下側丸の破線が出ない")});
  test("02 旧履歴のcrossPairsは自動消去される",()=>{overlapScenario();crossPairs.add(pairKey("x1","x2"));renderAll();assert(crossPairs.size===0,"旧crossPairsが残った")});
  test("03 接触位置で離した時だけ接着する",()=>{resetState([n("a",300,350),n("b",500,350)]);const e=fakeEvt(201);startMoveGesture(e,{x:300,y:350},nodeById("a"));updateMoveGesture(gesture,{x:360,y:350});assert(gesture?.contactPair,"接触候補にならない");penEnd(e);assert(directAttached("a","b"),"接触で離しても接着しない")});
  test("04 押し込んだ丸は接着せずそのまま重なる",()=>{resetState([n("a",300,350),n("b",500,350)]);const e=fakeEvt(202);startMoveGesture(e,{x:300,y:350},nodeById("a"));updateMoveGesture(gesture,{x:390,y:350});assert(!gesture?.contactPair,"深い重なりが接触候補のまま");assert(attachments.length===0,"押し込みで接着した");assert(crossPairs.size===0,"押し込みでcrossPairsを作った");assert(Math.abs(nodeById("a").x-390)<.01,"重なり位置へ移動できない");renderMotionNow();assert(hiddenLayer.querySelectorAll(".hidden-outline").length>0,"重なり中の破線が出ない");gesture=null;renderAll()});
  test("05 サイズ変更で接着も交差状態も増やさない",()=>{resetState([n("a",360,350,70,1),n("b",540,350,70,2)]);nodeById("a").r=125;addSideAttachmentsWithinComponent("a");assert(attachments.length===0,"サイズ変更でattachmentが増えた");assert(crossPairs.size===0,"サイズ変更でcrossPairsが増えた");renderHidden();assert(hiddenLayer.querySelectorAll(".hidden-outline").length>0,"重なり破線が出ない")});
  test("06 巨大丸の下の4丸をすべて破線表示",()=>{buriedScenario();renderHidden();const ids=hiddenNodeIds();for(const id of["h1","h2","h3","h4"])assert(ids.has(id),`${id} の隠れ外形がない`)});
  test("07 隠れ紐の破線は端丸中心へ食い込まない",()=>{buriedScenario();const paths=hiddenLinkEdges(linkById("lh1"),nodeById("cover"));assert(paths.length>0,"隠れ紐破線なし");const endpoint=nodeById("h1");for(const d of paths){const nums=(d.match(/-?\d+(?:\.\d+)?(?:e[-+]?\d+)?/ig)||[]).map(Number);for(let i=0;i+1<nums.length;i+=2)assert(dist(nums[i],nums[i+1],endpoint.x,endpoint.y)>endpoint.r*.58,"端丸中心へ入りすぎ")}});
  test("08 分離で埋没丸を接着・隠れ紐から回収",()=>{buriedScenario();const target=nodeById("h4"),oldLinks=links.length;assert(T10.separateBuriedNode(target,{x:target.x,y:target.y}),"分離失敗");assert(!attachments.some(m=>m.a==="h4"||m.b==="h4"),"接着が残る");assert(links.length<oldLinks,"隠れ紐が残る");assert(nodes.every(o=>o.id==="h4"||dist(target.x,target.y,o.x,o.y)>=target.r+o.r+15),"退避先が重なる")});
  test("09 団子3兄弟は中央が全体移動・端が回転",()=>{dangoScenario();const e=fakeEvt(203);startMoveGesture(e,{x:482,y:350},nodeById("d2"));assert(gesture?.mode==="move"&&gesture.compIds.length===3,"中央が全体移動でない");gesture=null;if(renderRAF){cancelAnimationFrame(renderRAF);renderRAF=0}startMoveGesture(e,{x:350,y:350},nodeById("d1"));assert(gesture?.mode==="pivot","端が回転でない");gesture=null;if(renderRAF){cancelAnimationFrame(renderRAF);renderRAF=0}});
  test("10 ポンデリングはどの丸からでも全体移動",()=>{ringScenario();const e=fakeEvt(204);for(const id of["r1","r2","r3","r4","r5"]){const q=nodeById(id);startMoveGesture(e,{x:q.x,y:q.y},q);assert(gesture?.mode==="move"&&gesture.compIds.length===5,`${id}が全体移動でない`);gesture=null;if(renderRAF){cancelAnimationFrame(renderRAF);renderRAF=0}}});
  test("11 丸移動中も隠れ破線を保持",()=>{overlapScenario();const e=fakeEvt(205);startMoveGesture(e,{x:500,y:350},nodeById("x2"));renderMotionNow();assert(hiddenLayer.style.display!=="none","hiddenLayerが非表示");assert(hiddenLayer.querySelectorAll(".hidden-outline").length>0,"移動中に破線が消える");gesture=null;renderAll()});
  test("12 キャンバス倍率変更はdocumentズームを使わない",()=>{resetState([n("z",500,350,70,1)]);const r=svg.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2,p=_clientPointToSvg(cx,cy),anchor=svgToWorldPoint(p);T10.applyAbsoluteCanvasScale(cx,cy,1,.6,anchor);assert(Math.abs(view.scale-.6)<1e-6,"canvas倍率が0.6でない");assert(!document.documentElement.style.zoom,"document zoomを変更した")});

  const allOk=results.every(r=>r.ok);document.body.dataset.regressionStatus=allOk?"PASS":"FAIL";resultsEl.innerHTML=results.map(r=>`<div class="${r.ok?'pass':'fail'}">${r.ok?'✓':'✗'} ${r.name}${r.ok?'':` — ${r.error}`}</div>`).join("");panel.querySelector("h2").textContent=`回帰テスト ${allOk?'PASS':'FAIL'} (${results.filter(r=>r.ok).length}/${results.length})`;buriedScenario();
})();
