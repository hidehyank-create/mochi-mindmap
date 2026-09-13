"use strict";
(function(){
  const T=window.__mochiFix18Test||{},out=document.getElementById("regressionResults"),results=[];
  function assert(x,m){if(!x)throw new Error(m)}
  function test(name,fn){try{fn();results.push({name,ok:true})}catch(e){results.push({name,ok:false,error:e?.message||String(e)})}}
  function N(id,x,y,r=70,z=1,label=id){return{id,x,y,r,label,z,created:z}}
  function L(id,a,b,seq=1,z=2,control=null){return{id,a,b,seq,z,control}}
  function A(id,a,b,seq=1){return{id,a,b,seq,newerId:a}}
  function reset(ns=[],ls=[],as=[]){if(renderRAF){cancelAnimationFrame(renderRAF);renderRAF=0}gesture=null;selected=null;pcTool=null;nodes.splice(0,nodes.length,...ns.map(x=>({...x})));links.splice(0,links.length,...ls.map(x=>({...x,control:x.control?{...x.control}:null})));attachments.splice(0,attachments.length,...as.map(x=>({...x})));crossPairs.clear();zSeq=Math.max(2,...nodes.map(n=>n.z||0));view.x=0;view.y=0;view.scale=1;applyView();renderAll()}

  test("F18-01 紐出し強判定は84%→80.5%",()=>{assert(Math.abs(T.stretchStartFrac-.805)<.0001,"80.5%でない");assert(Math.abs(DEFAULT_R*(1-T.stretchStartFrac)-16)<.2,"初期丸で内側16pxにならない")});
  test("F18-02 ヒョコ丸は丸本体と一体の外形",()=>{reset([N("a",300,350,82,1),N("b",480,350,82,2)]);const m=T.budMetrics(nodeById("a"),nodeById("b"));const d=T.bulgedNodePath(nodeById("a"),nodeById("b"),m);assert(d&&d.includes("C")&&d.includes("L"),"一体外形パスでない");T.setPreview("a","b");renderNodes();assert(nodesLayer.querySelector('[data-id="a"] [data-f18-bulged="1"]'),"本体がヒョコ外形に置換されない");T.clearPreview()});
  test("F18-03 FIX17のくびれRを維持",()=>{reset([N("a",350,350,80,1),N("b",502,350,80,2)],[],[A("m","a","b")]);const p=T.neckProfile(attachments[0],0);assert(p.waist>=39&&p.waist<=45,"くびれRが変わった")});
  test("F18-04 接着丸内部に濃い線なし",()=>{reset([N("a",400,350,90,1),N("b",560,350,90,5)],[],[A("m","a","b")]);renderNodes();assert(!nodesLayer.querySelector('[data-overlap-rim="node-node"]'),"接着内部線が復活")});
  test("F18-05 大丸の上に完全に載る小丸は濃い全周外形",()=>{reset([N("big",500,350,150,1),N("small",520,350,55,6)]);renderNodes();const p=nodesLayer.querySelector('[data-id="small"] [data-overlap-rim="node-node"][data-full-overlap="1"]');assert(p,"小さい上丸の濃い全周線がない")});
  test("F18-06 3個接着端回転は中央と反対端固定",()=>{reset([N("a",300,350,60,1),N("b",412,350,60,2),N("c",524,350,60,3)],[],[A("m1","a","b"),A("m2","b","c")]);startMoveGesture({pointerId:180,pointerType:"mouse"},{x:300,y:350},nodeById("a"));assert(gesture?.mode==="f17Pivot3Fixed","3個固定ピボットでない");gesture=null});
  test("F18-07 隠れ丸＋紐は根本R破線を描かない",()=>{reset([N("low",500,350,55,1),N("out",760,350,55,2),N("cover",500,350,145,8)],[L("l","low","out",1,2)]);T.renderHidden();assert(hiddenLayer.querySelector('[data-hidden-node="low"]'),"隠れ丸破線なし");assert(hiddenLayer.querySelector('[data-hidden-link="l"]'),"隠れ紐破線なし");assert(!hiddenLayer.querySelector('[data-hidden-root]'),"根本R破線が残る")});
  test("F18-08 紐交差は白い包帯ではなく左右外縁だけ",()=>{reset([N("a",180,350,55,1),N("b",820,350,55,1),N("c",500,100,55,1),N("d",500,600,55,1)],[L("h","a","b",1,7),L("v","c","d",2,2)]);T.renderBoundaries();assert(!overlapLayer.querySelector('[data-z-boundary="link-link-gap"]'),"白帯が残る");assert(overlapLayer.querySelectorAll('[data-z-boundary="link-link-edge"]').length===2,"左右外縁2本でない")});
  test("F18-09 近接複数交差でも境界は交差ごと独立",()=>{reset([N("a",150,350,45,1),N("b",850,350,45,1),N("c",455,100,45,1),N("d",455,600,45,1),N("e",545,100,45,1),N("f",545,600,45,1)],[L("h","a","b",1,9),L("v1","c","d",2,2),L("v2","e","f",3,3)]);T.renderBoundaries();assert(overlapLayer.querySelectorAll('[data-z-boundary="link-link-edge"]').length===4,"2交差が独立4エッジにならない")});
  test("F18-10 スマホ縦画面は全ボタン収容モード",()=>{assert(T.mobileToolbarMax===480,"スマホ専用幅が不正");assert(document.querySelectorAll('#controls button').length===8,"ツール数が変わった")});
  test("F18-11 新規丸アイコンは太線＋右下払い",()=>{const p=document.querySelector('#newBtn [data-icon-part="scribble"]');assert(p,"新規丸アイコンなし");assert(parseFloat(p.getAttribute("stroke-width")||"0")>=2.7,"線が太くない");assert(p.getAttribute("data-f18-tail")==="1","右下払い指定なし")});
  test("F18-12 紐付け/分離/消しゴムは大型化",()=>{assert(document.querySelector('#linkBtn svg')?.getAttribute('data-f18-large')==='1',"紐付け未大型化");assert(document.querySelector('#detachBtn svg')?.getAttribute('data-f18-large')==='1',"分離未大型化");assert(document.querySelector('#eraseBtn svg')?.getAttribute('data-f18-long')==='1',"消しゴム未長尺化")});

  const ok=results.every(r=>r.ok);document.body.dataset.regression18Status=ok?"PASS":"FAIL";
  const box=document.createElement("div");box.id="regression18";box.innerHTML=`<h3>FIX18 ${ok?"PASS":"FAIL"} (${results.filter(r=>r.ok).length}/${results.length})</h3>`+results.map(r=>`<div class="${r.ok?'pass':'fail'}">${r.ok?'✓':'✗'} ${r.name}${r.ok?'':` — ${r.error}`}</div>`).join("");out?.prepend(box);
})();