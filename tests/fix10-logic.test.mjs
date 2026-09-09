import assert from 'node:assert/strict';
const dist=(x1,y1,x2,y2)=>Math.hypot(x2-x1,y2-y1);
const unit=(dx,dy)=>{const d=Math.hypot(dx,dy)||1;return{x:dx/d,y:dy/d}};
function spotIsFree(n,nodes,x,y,margin=18){return nodes.every(o=>o.id===n.id||dist(x,y,o.x,o.y)>=n.r+o.r+margin)}
function findFree(n,nodes,primary,p){let ux=1,uy=0;if(primary){ux=n.x-primary.x;uy=n.y-primary.y;if(Math.hypot(ux,uy)<1&&p){ux=p.x-primary.x;uy=p.y-primary.y}}const u=unit(ux,uy),baseAngle=Math.atan2(u.y,u.x),baseDist=primary?primary.r+n.r+32:n.r*2+70,offs=[0,.35,-.35,.7,-.7,1.05,-1.05,1.4,-1.4,Math.PI];for(let ring=0;ring<8;ring++){const R=baseDist+ring*(n.r*1.35+36),ox=primary?primary.x:n.x,oy=primary?primary.y:n.y;for(const off of offs){const a=baseAngle+off,x=ox+Math.cos(a)*R,y=oy+Math.sin(a)*R;if(spotIsFree(n,nodes,x,y))return{x,y}}}return{x:n.x+baseDist*2,y:n.y}}
const cover={id:'c',x:500,y:350,r:200},target={id:'t',x:500,y:350,r:55},others=[cover,target,{id:'o1',x:820,y:350,r:55},{id:'o2',x:500,y:650,r:55}];const s=findFree(target,others,cover,{x:500,y:350});assert(spotIsFree(target,others,s.x,s.y),`free spot overlaps: ${JSON.stringify(s)}`);
const deep=(a,b)=>{const d=dist(a.x,a.y,b.x,b.y),depth=a.r+b.r-d;return depth>0&&(d+a.r<=b.r+1||depth>Math.min(a.r,b.r)*.30)};assert.equal(deep(target,cover),true);assert.equal(deep({id:'a',x:0,y:0,r:80},{id:'b',x:152,y:0,r:80}),false);
console.log('fix10 pure logic PASS');
