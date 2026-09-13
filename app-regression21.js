"use strict";
(function(){
  const T=window.__mochiFix21Test||{},U=window.__mochiFix21UI||{},out=document.getElementById("regressionResults"),r=[];
  const A=(x,m)=>{if(!x)throw new Error(m)},test=(n,f)=>{try{f();r.push({n,ok:1})}catch(e){r.push({n,ok:0,e:e?.message||String(e)})}};
  function N(id,x,y,rr=70,z=1,label=id){return{id,x,y,r:rr,label,z,created:z}}
  function L(id,a,b,z=2){return{id,a,b,seq:z,z}}
  function reset(ns=[],ls=[]){if(renderRAF){cancelAnimationFrame(renderRAF);renderRAF=0}gesture=null;selected=null;pcTool=null;nodes.splice(0,nodes.length,...ns.map(x=>({...x})));links.splice(0,links.length,...ls.map(x=>({...x})));attachments.splice(0);crossPairs.clear();view.x=0;view.y=0;view.scale=1;applyView();renderAll()}
  function pts(d){const a=(d.match(/-?\d+(?:\.\d+)?/g)||[]).map(Number),o=[];for(let i=0;i+1<a.length;i+=2)o.push({x:a[i],y:a[i+1]});return o}

  test("F21-01 ヒョコは小さめで肩が広がらない",()=>{reset([N("a",300,350,82,1),N("b",480,350,82,2)]);const m=f13ContactMetrics(nodes[0],nodes[1]),d=T.bulgedNodePath(nodes[0],nodes[1],m),p=pts(d);A(p.length>200,"輪郭点不足");let near=null,best=9;for(const q of p){const a=Math.abs(Math.atan2(q.y-350,q.x-300)-1.0);if(a<best){best=a;near=q}}A(near,"1rad点なし");A(Math.abs(dist(300,350,near.x,near.y)-82)<.7,"ヒョコが横へ広がり過ぎ");A(Math.max(...p.map(q=>dist(300,350,q.x,q.y)))>82+m.ext*.9,"先端距離が縮んだ")});
  test("F21-02 下紐は根本Rと側面を分離して破線",()=>{reset([N("a",300,350,70,1),N("b",720,350,70,2),N("cover",360,350,120,9)],[L("l","a","b",3)]);T.renderHidden();A(hiddenLayer.querySelector('[data-hidden-root="l"]'),"根本R破線なし");A(hiddenLayer.querySelector('[data-hidden-link="l"]'),"紐側面破線なし");A(T.rootInfo(links[0],true).t>0,"根本R分の切り分けなし")});
  test("F21-03 上側紐を下丸が破線化しない",()=>{reset([N("a",300,350,65,9),N("b",720,350,65,9),N("cover",500,350,135,2)],[L("l","a","b",10)]);T.renderHidden();A(!hiddenLayer.querySelector('[data-hidden-link="l"]'),"下丸で上紐が破線化");A(!hiddenLayer.querySelector('[data-hidden-root="l"]'),"下丸で上根本Rが破線化")});
  test("F21-04 上小丸根本は端点Zを継承",()=>{reset([N("upper",330,350,55,9),N("far",760,350,55,1),N("cover",360,350,130,5)],[L("l","upper","far",2)]);A(T.rootInfo(links[0],true).rootZ===9,"上小丸の根本Zが端点と一致しない")});
  test("F21-05 紐交差は上紐形状の白マスク",()=>{reset([N("a",150,350,45,1),N("b",850,350,45,1),N("c",500,100,45,1),N("d",500,600,45,1)],[L("low","a","b",2),L("up","c","d",9)]);T.renderBoundaries();A(overlapLayer.querySelector('[data-z-boundary="link-link-upper-mask"]'),"上紐マスクなし");A(overlapLayer.querySelector('[data-z-boundary="link-link-upper-redraw"]'),"上紐再描画なし");A(!overlapLayer.querySelector('[data-z-boundary="link-link-lower-cut"]'),"旧下紐四角切りが残る")});
  test("F21-06 重なりタップは上下を巡回",()=>{reset([N("big",500,350,150,1),N("small",500,350,55,9)]);selected={type:"node",id:"small"};A(T.cycleChoice(T.hitsAt(500,350,0))?.id==="big","下大丸へ巡回しない")});
  test("F21-07 選択済み下丸はドラッグ時に維持",()=>{reset([N("big",500,350,150,1),N("small",500,350,55,9)]);selected={type:"node",id:"big"};A(T.dragChoice(T.hitsAt(500,350,0))?.id==="big","ドラッグで上丸へ戻る")});
  test("F21-08 消しゴムは白本体＋灰色包み紙＋黒線画",()=>{const s=document.querySelector('#eraseBtn svg'),body=s?.querySelector('[data-icon-part="body"]'),paper=s?.querySelector('[data-icon-part="paper"]');A(s?.getAttribute('data-f21-eraser')==='1',"FIX21消しゴムでない");A(body?.getAttribute('fill')==='white',"本体が白でない");A(paper?.getAttribute('fill')==='currentColor'&&parseFloat(paper.getAttribute('opacity')||'1')<.5,"包み紙が灰色でない")});
  test("F21-09 コンテクストメニューは6項目維持",()=>A((U.contextLabels?.()||[]).join("|")==="全体|選択|新規丸|紐付け|分離|消しゴム","メニュー順不正"));
  test("F21-10 連続対象は4ツールだけ",()=>{A(U.actionCount===4,"4ツールでない");A(U.selectCanHold===false,"選択に連続モードが残る")});
  test("F21-11 連続ツールは作業後も保持",()=>{U.forceHeld("new");clearOneShotTool();A(U.getHeld()==="new"&&pcTool==="new","連続が作業後に解除");U.forceCancel()});
  test("F21-12 選択は1回で自動解除",()=>{U.armSelect();A(pcTool==="select","選択が有効にならない");clearOneShotTool();A(pcTool===null&&U.getHeld()===null,"選択が解除されない")});
  test("F21-13 PCズームを維持",()=>A(document.getElementById("zoomInBtn")&&document.getElementById("zoomOutBtn"),"ズームボタンなし"));

  const ok=r.every(x=>x.ok);document.body.dataset.regression21Status=ok?"PASS":"FAIL";const box=document.createElement("div");box.id="regression21";box.innerHTML=`<h3>FIX21 ${ok?"PASS":"FAIL"} (${r.filter(x=>x.ok).length}/${r.length})</h3>`+r.map(x=>`<div class="${x.ok?'pass':'fail'}">${x.ok?'✓':'✗'} ${x.n}${x.ok?'':` — ${x.e}`}</div>`).join("");out?.prepend(box);
})();
