"use strict";
f22ChooseNode=function(id){const n=nodeById(id);if(!n)return;if(typeof f13SetSelectedIds==="function")f13SetSelectedIds([]);selected={type:"node",id};f22ChoiceArmed=null;f22CloseChooser();renderAll();statusText(`重なり選択：${n.label||id}`)};
const f23CloseChooserPrev=f22CloseChooser;f22CloseChooser=function(){f23CloseChooserPrev();f22ClearChoiceRing()};
if(window.__mochiFix23Test){window.__mochiFix23Test.chooseNode=f22ChooseNode;window.__mochiFix23Test.choiceRing=()=>document.querySelector('.f22-choice-ring')}
