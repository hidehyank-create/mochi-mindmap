"use strict";
const F20_BUILD="0914-FIX20",F20_BG="#f7f4ed",F20_BOUNDARY="#c3922e";
function f20Norm(a){return Math.atan2(Math.sin(a),Math.cos(a))}
function f20Path(ps,close=false){if(!ps?.length)return"";let d=`M ${ps[0].x} ${ps[0].y}`;for(let i=1;i<ps.length;i++)d+=` L ${ps[i].x} ${ps[i].y}`;return d+(close?" Z":"")}

// Broader deformation: the parent circle itself swells toward the partner.
f18BulgedNodePath=function(n,toward,m){if(!n||!toward||!m?.visible)return circlePath(n.x,n.y,n.r);const base=Math.atan2(toward.y-n.y,toward.x-n.x),spread=1.48,pts=[];for(let i=0;i<180;i++){const a=-Math.PI+2*Math.PI*i/180,d=Math.abs(f20Norm(a-base));let bump=0;if(d<spread){const s=(1+Math.cos(Math.PI*d/spread))/2;bump=m.ext*s*s*s}const r=n.r+bump;pts.push({x:n.x+Math.cos(a)*r,y:n.y+Math.sin(a)*r})}return f20Path(pts,true)};

function f20FullyCovered(n,c){return dist(n.x,n.y,c.x,c.y)+n.r<=c.r+.75}
function f20Partial(n,c){const d=dist(n.x,n.y,c.x,c.y);return d<n.r+c.r&&!f20FullyCovered(n,c)&&!(d+c.r<=n.r)}

// One z rule for hidden node arcs, hose sides, and both root-R side curves.
f18RenderHidden=function(){hiddenLayer.replaceChildren();const arr=[...nodes].sort((a,b)=>f14ObjectZ(a,"node")-f14ObjectZ(b,"node")||((a.created??0)-(b.created??0)));for(let i=0;i<arr.length;i++){const lower=arr[i];for(let j=i+1;j<arr.length;j++){const upper=arr[j];if(sameComponent(lower.id,upper.id))continue;const arc=circleCoveredArc(lower,upper);if(!arc)continue;if(arc.full){const d=hiddenCircleWithLinkGaps(lower);if(d)hiddenLayer.appendChild(sEl("path",{d,class:"hidden-outline","data-hidden-node":lower.id,"data-full-cover":"1","data-cover":upper.id,"data-f20":"1"}));break}hiddenLayer.appendChild(sEl("path",{d:arc.d,class:"hidden-outline","data-hidden-node":lower.id,"data-partial":"1","data-cover":upper.id,"data-f20":"1"}))}}
  for(const cover of arr){for(const l of links){if(l.a===cover.id||l.b===cover.id)continue;if(sameComponent(cover.id,l.a)||sameComponent(cover.id,l.b))continue;for(const d of hiddenLinkEdges(l,cover))hiddenLayer.appendChild(sEl("path",{d,class:"hidden-outline","data-hidden-link":l.id,"data-cover":cover.id,"data-f20":"1"}));if(typeof f12HiddenRootEdges==="function")for(const d of f12HiddenRootEdges(l,cover))hiddenLayer.appendChild(sEl("path",{d,class:"hidden-outline","data-hidden-root":l.id,"data-cover":cover.id,"data-f20":"1"}))}}
};
renderHidden=f18RenderHidden;

// Crossing: erase the lower hose in the actual overlap interval, then redraw the upper hose.
function f20Expand(l,t0,t1,px=3.5){if(typeof f17ArcLenToT!=="function")return[t0,t1];return[Math.max(.01,f17ArcLenToT(l,t0,-1,px,0)),Math.min(.99,f17ArcLenToT(l,t1,1,px,1))]}
f18RenderZBoundaries=function(){f14NormalizeLinkZ();overlapLayer.replaceChildren();f15ZTopLayer.replaceChildren();const ordered=[...links].sort((a,b)=>f14ObjectZ(a,"link")-f14ObjectZ(b,"link")||((a.seq??0)-(b.seq??0)));for(let i=1;i<ordered.length;i++){const upper=ordered[i];for(let j=0;j<i;j++){const lower=ordered[j];const lowerRanges=f15LinkLinkRanges(lower,upper);for(const raw of lowerRanges){const r=typeof f17CompactRange==="function"?f17CompactRange(lower,upper,raw[0],raw[1]):raw;if(r[1]<=r[0])continue;overlapLayer.appendChild(sEl("path",{d:f15RangePath(lower,r[0],r[1]),fill:"none",stroke:F20_BG,"stroke-width":linkWidth(lower)+4,"stroke-linecap":"butt","data-z-boundary":"link-link-lower-cut","data-f20":"1"}))}const upperRanges=f15LinkLinkRanges(upper,lower);for(const raw of upperRanges){const r=typeof f17CompactRange==="function"?f17CompactRange(upper,lower,raw[0],raw[1]):raw;if(r[1]<=r[0])continue;const ex=f20Expand(upper,r[0],r[1]);overlapLayer.appendChild(sEl("path",{d:f15RangePath(upper,ex[0],ex[1]),fill:"none",stroke:"#f0c867","stroke-width":linkWidth(upper),"stroke-linecap":"round","data-z-boundary":"link-link-upper-redraw","data-f20":"1"}))}}}
  for(const l of links){const lz=f14ObjectZ(l,"link");for(const n of nodes){if(l.a===n.id||l.b===n.id||f14ObjectZ(n,"node")>=lz)continue;for(const[t0,t1]of linkNodeOverlapRanges(l,n)){const d=f15RangePath(l,t0,t1);f15ZTopLayer.appendChild(sEl("path",{d,fill:"none",stroke:F20_BG,"stroke-width":linkWidth(l)+4,"stroke-linecap":"butt","data-z-boundary":"link-node-gap"}));f15ZTopLayer.appendChild(sEl("path",{d,fill:"none",stroke:"#f0c867","stroke-width":linkWidth(l),"stroke-linecap":"round","data-z-boundary":"link-node-top"}))}}}
};
f15RenderZBoundaries=f18RenderZBoundaries;renderOverlapEdges=f18RenderZBoundaries;

renderAll=function(){if(renderRAF){cancelAnimationFrame(renderRAF);renderRAF=0}shadowLayer.style.display="";overlapLayer.style.display="";hiddenLayer.style.display="";renderShadow();renderLinks(false);renderNodes();f18RenderZBoundaries();f18RenderHidden();renderUI()};
renderMotionNow=function(){shadowLayer.style.display="none";hiddenLayer.style.display="";renderLinks(true);renderNodes();f18RenderZBoundaries();f18RenderHidden();renderUI()};
window.__mochiFix20Test={bulgedNodePath:f18BulgedNodePath,renderHidden:f18RenderHidden,renderBoundaries:f18RenderZBoundaries,fullyCovered:f20FullyCovered,partial:f20Partial};
statusText=function(t){status.innerHTML=`餅マップ v0.9.4<br>BUILD ${F20_BUILD}<br>${t}`};statusText("待機中");