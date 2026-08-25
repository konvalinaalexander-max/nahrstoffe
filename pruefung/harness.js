/* Minimaler DOM-Ersatz, damit app.js in node läuft. */
const fs=require('fs');
function mkEl(id){
  const e={id,innerHTML:'',textContent:'',value:'',checked:false,hidden:false,disabled:false,
    dataset:{},style:{},files:[],selectedOptions:[],clientWidth:900,
    classList:{add(){},remove(){},contains(){return false}},
    appendChild(){},insertAdjacentHTML(){},remove(){},click(){},
    querySelector(){return null},querySelectorAll(){return []},
    addEventListener(){},showModal(){},close(){},setAttribute(){},getAttribute(){return null}};
  return e;
}
const store=new Map();
global.document={
  getElementById(id){if(!store.has(id))store.set(id,mkEl(id));return store.get(id)},
  querySelector(){return null},querySelectorAll(){return []},
  createElement(t){return mkEl('neu:'+t)},
  addEventListener(){},body:mkEl('body')
};
global.window={addEventListener(){},scrollTo(){}, __pruef:null};
global.self=global.window;
global.navigator={language:'de-CH'};
global.location={href:''};
global.fetch=async()=>{throw new Error('kein Netz im Test')};
global.pdfjsLib={GlobalWorkerOptions:{},getDocument(){throw new Error('kein pdf.js im Test')}};
global.URL={createObjectURL(){return 'blob:test'},revokeObjectURL(){}};
global.Blob=function(){};
global.confirm=()=>true;
global.alert=()=>{};
global.dlg=mkEl('dlg');
global.fileJson=mkEl('fileJson');
global.filePdf=mkEl('filePdf');
global.setTimeout=global.setTimeout;

let src=fs.readFileSync(__dirname+'/app.js','utf8');
/* Selbstaufruf am Ende abschneiden */
const cut=src.lastIndexOf('(async()=>{');
if(cut<0)throw new Error('IIFE nicht gefunden');
src=src.slice(0,cut);
/* "use strict" verhindert implizite Globals nicht – wir brauchen die Funktionen im Scope */
src=src.replace(/^"use strict";/,'');
const mod={};
const fn=new Function('module','exports','require','document','window','globalThis',
  src+'\n;return {'+
  ['toNum','isLim','lage','status','index','erhebungen','bilanz','befunde','alter','ausKW','aussaatVon',
   'kulturdauer','optVon','optEigen','leer','saetzeListe','vorschlaege','parseNCC','parseIns','parseAuto',
   'einheit','leitProbe','alleSaetze','nz','esc','putz','vLage','vAnalysen','vNaehr','vKultur','vWirkung',
   'vPlaner','vLogbuch','vKreis','vRund','vSaetze','render','setTab','KERN','HAUPT','MOBIL','NAME','NCC','INS',
   'befundHtml','streifen','balken','chartLinien','chartIndex','chartProfil','chartSaetze','abstand','fmt'
  ].map(n=>n+':typeof '+n+'!=="undefined"?'+n+':undefined').join(',')+
  ', setDb:(x)=>{db=x}, getDb:()=>db, setTab2:(t)=>{tab=t}, nachRenderRun:()=>{if(nachRender){const g=nachRender;nachRender=null;g()}}}');
module.exports=fn(mod,{},require,global.document,global.window,global);
