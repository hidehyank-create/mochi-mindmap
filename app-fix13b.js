"use strict";
// FIX13 constraint refinement: exact distance correction, hard non-neighbor collision,
// and multi-seam resize without old-angle bend targets fighting the new radius.

f13ApplyConstraint=function(a,b,target,pins,stiff=1){
  if(!a||!b)return;let dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy),ux,uy;if(d<1e-6){ux=1;uy=0;d=0}else{ux=dx/d;uy=dy/d}
  const delta=(d-target)*stiff,pa=pins.has(a.id),pb=pins.has(b.id);if(pa&&pb)return;
  if(pa){b.x-=ux*delta;b.y-=uy*delta;return}if(pb){a.x+=ux*delta;a.y+=uy*delta;return}
  a.x+=ux*delta*.5;a.y+=uy*delta*.5;b.x-=ux*delta*.5;b.y-=uy*delta*.5;
};

f13SolveBeads=function(ids,pinIds=new Set(),iterations=10,bendRest=null){
  const set=new Set(ids),pins=pinIds instanceof Set?pinIds:new Set(pinIds),bends=bendRest===null?f13BuildBendRest(ids):bendRest;
  function collisions(stiff=1){const arr=ids.map(nodeById).filter(Boolean);for(let i=0;i<arr.length;i++)for(let j=i+1;j<arr.length;j++){const A=arr[i],B=arr[j];if(directAttached(A.id,B.id))continue;const minD=A.r+B.r+2;if(dist(A.x,A.y,B.x,B.y)<minD)f13ApplyConstraint(A,B,minD,pins,stiff)}}
  for(let it=0;it<iterations;it++){
    for(const m of attachments){if(!set.has(m.a)||!set.has(m.b))continue;const A=nodeById(m.a),B=nodeById(m.b);f13ApplyConstraint(A,B,A.r+B.r-ATTACH_OVERLAP,pins,.96)}
    for(const br of bends){if(set.has(br.a)&&set.has(br.b))f13ApplyConstraint(nodeById(br.a),nodeById(br.b),br.d,pins,.10)}
    collisions(.96);
  }
  // End with hard collision passes so folded beads can never finish overlapped.
  for(let i=0;i<3;i++)collisions(1);
  // Then restore direct attachment lengths once more and resolve collisions again.
  for(let k=0;k<3;k++){for(const m of attachments){if(!set.has(m.a)||!set.has(m.b))continue;const A=nodeById(m.a),B=nodeById(m.b);f13ApplyConstraint(A,B,A.r+B.r-ATTACH_OVERLAP,pins,1)}collisions(1)}
  return ids;
};

f13ResizeConnected=function(n,newR){
  if(!n)return;newR=clamp(newR,MIN_R,MAX_R);const seams=directAttachmentsOf(n.id);if(seams.length===0){n.r=newR;return}
  if(seams.length===1){const m=seams[0],other=nodeById(m.a===n.id?m.b:m.a);f12ApplyAnchoredResize(n,newR,other);return}
  const ids=componentIds(n.id),cx=n.x,cy=n.y;n.r=newR;n.x=cx;n.y=cy;
  // With two or more seams, the selected center is the anchor. Distances change with radius,
  // so old second-neighbor bend lengths must not pull the neighbors back inward.
  f13SolveBeads(ids,new Set([n.id]),18,[]);n.x=cx;n.y=cy;
};

if(window.__mochiFix13Test){window.__mochiFix13Test.solveBeads=f13SolveBeads;window.__mochiFix13Test.resizeConnected=f13ResizeConnected}
