"use strict";
(function(){
  const P=window.__mochiFix27PTest||{},out=document.getElementById("regressionResults"),r=[];
  const A=(x,m)=>{if(!x)throw new Error(m)},test=(n,f)=>{try{f();r.push({n,ok:1})}catch(e){r.push({n,ok:0,e:e?.message||String(e)})}};
  function N(id,x,y,rr=70,z=1){return{id,x,y,r:rr,label:id,z,created:z}}
  function reset(ns=[]){if(renderRAF){cancelAnimationFrame(renderRAF);renderRAF=0}cancelHold?.();gesture=null;selected=null;nodes.splice(0,nodes.length,...ns.map(x=>({...x})));links.splice(0);attachments.splice(0);crossPairs.clear();view.x=0;view.y=0;view.scale=1;applyView();f13ClearContactPreview?.();hiddenLayer?.replaceChildren?.();}
  test("F27P-01 丸とそこから出る紐が同じ横紐外形を二重所有しない",()=>{reset([N("a",220,350,60,1),N("b",780,350,60,1),N("c",500,350,105,3),N("d",500,650,60,2)]);links.push({id:"ab",a:"a",b:"b",control:null,seq:1},{id:"cd",a:"c",b:"d",control:null,seq:2});f25RenderHidden();const paths=[...hiddenLayer.querySelectorAll('[data-f27p-lower="ab"][data-f27p-contour="link-side"]')];A(typeof P.linkSideRuns==="function","一意owner描画APIなし");A(paths.length>0,"横紐の隠れ外形なし");A(!hiddenLayer.querySelector('[data-f27k]'),"旧経路の破線が残る");const underC=e=>(e.getAttribute("d").match(/-?(?:\\d+\\.?\\d*|\\.\\d+)/g)||[]).map(Number).some((v,i,a)=>i%2===0&&Math.hypot(v-500,(a[i+1]??9999)-350)<106);A(paths.filter(underC).length<=2,"丸C内の横紐外形を複数経路が所有している")});
  const ok=r.every(x=>x.ok);document.body.dataset.regression27pStatus=ok?"PASS":"FAIL";const box=document.createElement("div");box.id="regression27p";box.innerHTML=`<h3>FIX27P ${ok?"PASS":"FAIL"} (${r.filter(x=>x.ok).length}/${r.length})</h3>`+r.map(x=>`<div class="${x.ok?'pass':'fail'}">${x.ok?'✓':'✗'} ${x.n}${x.ok?'':` — ${x.e}`}</div>`).join("");out?.prepend(box);
})();
