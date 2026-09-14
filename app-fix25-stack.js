"use strict";
const F25_SEP="#e9e6df",F25_SEP_W=2;
function f25RootPatchPath(l,fromA){const g=f23RootGeom(l,fromA);if(!g)return null;const t=g.top,b=g.bottom;return`M ${t[0].x} ${t[0].y} C ${t[1].x} ${t[1].y} ${t[2].x} ${t[2].y} ${t[3].x} ${t[3].y} L ${b[3].x} ${b[3].y} C ${b[2].x} ${b[2].y} ${b[1].x} ${b[1].y} ${b[0].x} ${b[0].y} Z`}
linkRootPaths=function(l){return[true,false].map(f=>({d:f25RootPatchPath(l,f)})).filter(x=>x.d)};
function f25Seq(l){return Number.isFinite(l?.seq)?l.seq:0}
function f25NodeLinkSeq(n){const a=links.filter(l=>l.a===n.id||l.b===n.id);return a.length?Math.max(...a.map(f25Seq)):null}
function f25LinkAboveNode(l,n){if(l.a===n.id||l.b===n.id)return false;const ns=f25NodeLinkSeq(n);if(ns!==null){const ls=f25Seq(l);if(ls!==ns)return ls>ns}return f14ObjectZ(l,"link")>f24NodeZ(n)}
function f25PointInLinkShape(l,p,extra=0){return f15PointLinkDistance(l,p,120)<=linkWidth(l)/2+extra||f24PointInRoot(l,p)}
window.__mochiFix25Stack={rootPatch:f25RootPatchPath,linkAboveNode:f25LinkAboveNode,nodeLinkSeq:f25NodeLinkSeq,separator:{color:F25_SEP,width:F25_SEP_W}};
