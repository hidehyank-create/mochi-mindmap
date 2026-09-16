"use strict";
(function(){
  const Q=window.__mochiFix27QTest||{},out=document.getElementById("regressionResults"),r=[];
  const A=(x,m)=>{if(!x)throw new Error(m)},test=(n,f)=>{try{f();r.push({n,ok:1})}catch(e){r.push({n,ok:0,e:e?.message||String(e)})}};
  function N(id,x,y,rr=70,z=1){return{id,x,y,r:rr,label:id,z,created:z}}
  function reset(ns=[]){if(renderRAF){cancelAnimationFrame(renderRAF);renderRAF=0}cancelHold?.();gesture=null;selected=null;nodes.splice(0,nodes.length,...ns.map(x=>({...x})));links.splice(0);attachments.splice(0);crossPairs.clear();view.x=0;view.y=0;view.scale=1;applyView();f13ClearContactPreview?.();hiddenLayer?.replaceChildren?.();}
  test("F27Q-01 根本Rと紐側面は単一の連続hidden contour",()=>{reset([N("a",220,350,60,1),N("b",780,350,60,1),N("c",700,350,105,3)]);links.push({id:"ab",a:"a",b:"b",control:null,seq:1});f25RenderHidden();const paths=[...hiddenLayer.querySelectorAll('[data-f27q-lower="ab"]')];A(typeof Q.compositeSideRuns==="function","連続外形APIなし");A(paths.length>0,"根本Rを含む隠れ外形なし");A(!hiddenLayer.querySelector('[data-f27p]'),"根本Rと紐側面の旧別pathが残る");A(paths.every(e=>e.getAttribute("data-f27q-contour")==="link-exterior"),"紐外形のownerが分裂している")});
  const ok=r.every(x=>x.ok);document.body.dataset.regression27qStatus=ok?"PASS":"FAIL";const box=document.createElement("div");box.id="regression27q";box.innerHTML=`<h3>FIX27Q ${ok?"PASS":"FAIL"} (${r.filter(x=>x.ok).length}/${r.length})</h3>`+r.map(x=>`<div class="${x.ok?'pass':'fail'}">${x.ok?'✓':'✗'} ${x.n}${x.ok?'':` — ${x.e}`}</div>`).join("");out?.prepend(box);
})();
