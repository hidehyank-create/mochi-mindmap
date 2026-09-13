"use strict";
(function(){
  const T=window.__mochiFix22Test||{},U=window.__mochiFix22UI||{},H=window.__mochiFix21UI||{},out=document.getElementById("regressionResults"),r=[];
  const A=(x,m)=>{if(!x)throw new Error(m)},test=(n,f)=>{try{f();r.push({n,ok:1})}catch(e){r.push({n,ok:0,e:e?.message||String(e)})}};
  function N(id,x,y,rr=70,z=1,label=id){return{id,x,y,r:rr,label,z,created:z}}
  function L(id,a,b,z=2,control=null){const l={id,a,b,seq:z,z};if(control)l.control={...control};return l}
  function reset(ns=[],ls=[]){if(renderRAF){cancelAnimationFrame(renderRAF);renderRAF=0}gesture=null;selected=null;pcTool=null;nodes.splice(0,nodes.length,...ns.map(x=>({...x})));links.splice(0,links.length,...ls.map(x=>({...x},x.control?{...x,control:{...x.control}}:x)));attachments.splice(0);crossPairs.clear();view.x=0;view.y=0;view.scale=1;applyView();renderAll()}

  test("F22-01 接着くびれは円接線から4本のCubicで接続",()=>{reset([N("a",300,350,82,1),N("b",450,350,82,2)]);attachments.push({id:"m1",a:"a",b:"b",seq:1,newerId:"a"});const d=T.mergePath(attachments[0],0);A(d&&!/NaN/.test(d),"接着path不正");A((d.match(/ C /g)||[]).length===4,"Cubic 4本でない")});
  test("F22-02 曲げ紐根本は実際の出口に追従",()=>{reset([N("a",180,350,70,5),N("b",820,350,70,6)],[L("l","a","b",7,{x:470,y:90})]);const d=T.rootPatch(links[0],true);A(d&&!/NaN/.test(d),"曲げ紐根本path不正");A(d.includes(" C "),"根本にBezierなし")});
  test("F22-03 紐交差は下紐形状を白抜き",()=>{reset([N("a",120,350,45,1),N("b",880,350,45,1),N("c",500,100,45,1),N("d",500,600,45,1)],[L("low","a","b",2),L("up","c","d",9)]);T.renderBoundaries();A(overlapLayer.querySelector('[data-z-boundary="link-link-lower-shape-cut"]'),"下紐形状cutなし");A(overlapLayer.querySelector('[data-z-boundary="link-link-upper-exact"]'),"上紐再描画なし")});
  test("F22-04 紐付き上小丸では紐描画を根本出口から開始",()=>{reset([N("small",300,350,58,9),N("far",800,350,58,9),N("big",350,350,155,1)],[L("l","small","far",10)]);T.renderBoundaries();const p=f15ZTopLayer.querySelector('[data-f22-trim="1"]');A(p,"trim描画なし")});
  test("F22-05 金の斧銀の斧候補は重なり全丸を返す",()=>{reset([N("big",500,350,150,1,"大丸"),N("small",500,350,55,9,"小丸")]);A(window.__mochiFix22Test.hitsAt(500,350,0).length===2,"候補2丸でない")});
  test("F22-06 候補選択は下丸も直接選べる",()=>{reset([N("big",500,350,150,1,"大丸"),N("small",500,350,55,9,"小丸")]);window.__mochiFix22Test.chooseNode("big");A(selected?.id==="big","下丸を直接選べない")});
  test("F22-07 選択プルダウンに自由・矩形がある",()=>{A(document.getElementById("f22SelectModeBtn"),"選択プルダウンなし");const m=document.getElementById("f22SelectModeMenu");A(m?.querySelectorAll('button[data-mode]').length===2,"選択方式2種でない");A(U.setSelectMode("rect")==="rect","矩形モードに切替不可")});
  test("F22-08 選択ボタンは連続モードなしを維持",()=>A(H.selectCanHold===false,"選択に連続モードが復活"));
  test("F22-09 4作業ツールの連続モードを維持",()=>A(H.actionCount===4,"連続対象が4ツールでない"));
  test("F22-10 全選択移動で曲げ紐controlも平行移動",()=>{reset([N("a",200,300,55,1),N("b",600,300,55,2)],[L("l","a","b",3,{x:400,y:160})]);f13SetSelectedIds(["a","b"]);f13StartGroupDrag({pointerId:77},{x:200,y:300});f13UpdateGroupDrag({x:240,y:330});A(Math.abs(links[0].control.x-440)<.01&&Math.abs(links[0].control.y-190)<.01,`control=${links[0].control.x},${links[0].control.y}`);f13GroupDrag=null});
  test("F22-11 PCパン用UI APIが存在",()=>A(typeof U.isPanning==="function"&&typeof U.placeModeBtn==="function","PC pan/UI APIなし"));
  test("F22-12 PCズームを維持",()=>A(document.getElementById("zoomInBtn")&&document.getElementById("zoomOutBtn"),"ズームボタンなし"));

  const ok=r.every(x=>x.ok);document.body.dataset.regression22Status=ok?"PASS":"FAIL";const box=document.createElement("div");box.id="regression22";box.innerHTML=`<h3>FIX22 ${ok?"PASS":"FAIL"} (${r.filter(x=>x.ok).length}/${r.length})</h3>`+r.map(x=>`<div class="${x.ok?'pass':'fail'}">${x.ok?'✓':'✗'} ${x.n}${x.ok?'':` — ${x.e}`}</div>`).join("");out?.prepend(box);
})();
