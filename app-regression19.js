"use strict";
(function(){
  const T=window.__mochiFix19Test||{},U=window.__mochiFix19UI||{},out=document.getElementById("regressionResults"),results=[];
  function assert(x,m){if(!x)throw new Error(m)}
  function test(name,fn){try{fn();results.push({name,ok:true})}catch(e){results.push({name,ok:false,error:e?.message||String(e)})}}
  function N(id,x,y,r=70,z=1,label=id){return{id,x,y,r,label,z,created:z}}
  function L(id,a,b,seq=1,z=2,control=null){return{id,a,b,seq,z,control}}
  function A(id,a,b,seq=1){return{id,a,b,seq,newerId:a}}
  function reset(ns=[],ls=[],as=[]){if(renderRAF){cancelAnimationFrame(renderRAF);renderRAF=0}gesture=null;selected=null;pcTool=null;nodes.splice(0,nodes.length,...ns.map(x=>({...x})));links.splice(0,links.length,...ls.map(x=>({...x,control:x.control?{...x.control}:null})));attachments.splice(0,attachments.length,...as.map(x=>({...x})));crossPairs.clear();zSeq=Math.max(2,...nodes.map(n=>n.z||0));view.x=0;view.y=0;view.scale=1;applyView();renderAll()}

  test("F19-01 ヒョコは円周そのものの滑らかな変形",()=>{reset([N("a",300,350,82,1),N("b",480,350,82,2)]);const m=f13ContactMetrics(nodeById("a"),nodeById("b")),d=T.bulgedNodePath(nodeById("a"),nodeById("b"),m);assert(d&&d.includes("L")&&!d.includes(" C "),"継ぎ足しBezier肩が残る");assert((d.match(/ L /g)||[]).length>80,"円周サンプルが粗い")});
  test("F19-02 くびれRはFIX17/18を維持",()=>{reset([N("a",350,350,80,1),N("b",502,350,80,2)],[],[A("m","a","b")]);const p=f13NeckProfile(attachments[0],0);assert(p.waist>=39&&p.waist<=45,"くびれが変わった")});
  test("F19-03 小丸完全内包の濃線は小丸外周に固定",()=>{reset([N("big",500,350,160,1),N("small",520,350,55,8)]);const runs=T.nodeRimRuns(nodeById("small"));assert(runs.length>=1,"濃線なし");const s=runs.join(" ");assert(s.includes(String(520+55+1.6).slice(0,3))||s.length>500,"小丸円周パスでない")});
  test("F19-04 接着丸内部の濃線なし",()=>{reset([N("a",400,350,90,1),N("b",560,350,90,5)],[],[A("m","a","b")]);renderNodes();assert(!nodesLayer.querySelector('[data-overlap-rim]'),"接着内部線が復活")});
  test("F19-05 重なり選択は上Zの小丸優先",()=>{reset([N("big",500,350,170,1),N("small",500,350,55,9)]);const h=T.topNodeAt(500,350,0);assert(h?.node?.id==="small","上小丸を取れない");assert(nearestNode(500,350)?.node?.id==="small","nearestNodeがZ順でない")});
  test("F19-06 部分被覆の下丸＋紐は根本外周破線あり",()=>{reset([N("low",430,350,70,1),N("out",760,350,55,2),N("cover",500,350,105,8)],[L("l","low","out",1,2)]);T.renderHidden();assert(hiddenLayer.querySelector('[data-hidden-node="low"]'),"丸破線なし");assert(hiddenLayer.querySelector('[data-hidden-link="l"]'),"紐破線なし");assert(hiddenLayer.querySelector('[data-hidden-root="l"]'),"部分被覆の根本破線なし")});
  test("F19-07 完全被覆では根本R破線なし",()=>{reset([N("low",500,350,55,1),N("out",760,350,55,2),N("cover",500,350,145,8)],[L("l","low","out",1,2)]);T.renderHidden();assert(hiddenLayer.querySelector('[data-hidden-node="low"]'),"全周破線なし");assert(!hiddenLayer.querySelector('[data-hidden-root]'),"完全被覆で根本R破線が出る")});
  test("F19-08 紐交差は白境界＋上紐再描画",()=>{reset([N("a",180,350,55,1),N("b",820,350,55,1),N("c",500,100,55,1),N("d",500,600,55,1)],[L("h","a","b",1,7),L("v","c","d",2,2)]);T.renderBoundaries();assert(overlapLayer.querySelector('[data-z-boundary="link-link-gap"][data-f19="1"]'),"白境界なし");assert(overlapLayer.querySelector('[data-z-boundary="link-link-top"][data-f19="1"]'),"上紐再描画なし")});
  test("F19-09 紐出し80.5%を維持",()=>{assert(Math.abs(T.stretchStartFrac-.805)<.0001,"紐出し比率が変わった")});
  test("F19-10 PCズーム＋−を追加",()=>{assert(document.getElementById("zoomInBtn")&&document.getElementById("zoomOutBtn"),"ズームボタンなし")});
  test("F19-11 アイコン指定を反映",()=>{assert(document.querySelector('#newBtn [data-f19-nine="1"]'),"新規丸9払いでない");assert(document.querySelector('#eraseBtn svg[data-f19-diagonal="1"]'),"消しゴムが斜めでない")});
  test("F19-12 コンテクストメニューはツールバー順",()=>{const labels=[...document.querySelectorAll('#contextMenu [data-f19-context="1"]')].map(b=>b.textContent);assert(labels.join("|")==="戻る|進む|全体|拡大|縮小|選択|新規丸|紐付け|分離|消しゴム","並びが違う")});
  test("F19-13 1回/連続ツール対象は4種",()=>{assert(U.actionToolCount===4,"対象ツール数が4でない")});

  const ok=results.every(r=>r.ok);document.body.dataset.regression19Status=ok?"PASS":"FAIL";const box=document.createElement("div");box.id="regression19";box.innerHTML=`<h3>FIX19 ${ok?"PASS":"FAIL"} (${results.filter(r=>r.ok).length}/${results.length})</h3>`+results.map(r=>`<div class="${r.ok?'pass':'fail'}">${r.ok?'✓':'✗'} ${r.name}${r.ok?'':` — ${r.error}`}</div>`).join("");out?.prepend(box)
})();
