/* DOM-Ersatz, damit basilikum.html in node läuft. */
const fs=require('fs');
function mkEl(id){
  const kinder=[];
  const e={id,tagName:'DIV',type:'',innerHTML:'',textContent:'',value:'',checked:false,hidden:false,disabled:false,
    open:false,dataset:{},style:{},files:[],selectedOptions:[],clientWidth:900,
    classList:{add(){},remove(){},contains(){return false}},
    appendChild(){},insertAdjacentHTML(){},remove(){},click(){},
    querySelector(){return null},querySelectorAll(){return []},
    closest(){return null},addEventListener(){},showModal(){e.open=true},close(){e.open=false},
    setAttribute(){},getAttribute(){return null},focus(){}};
  return e;
}
const store=new Map();
global.document={
  getElementById(id){if(!store.has(id))store.set(id,mkEl(id));return store.get(id)},
  querySelector(){return null},querySelectorAll(){return []},
  createElement(t){return mkEl('neu:'+t)},
  addEventListener(){},body:mkEl('body')
};
global.window={addEventListener(){},scrollTo(){}};
global.self=global.window;
global.navigator={language:'de-CH'};
global.fetch=async()=>{throw new Error('kein Netz im Test')};
global.pdfjsLib={GlobalWorkerOptions:{},getDocument(){throw new Error('kein pdf.js im Test')}};
global.URL={createObjectURL(){return 'blob:test'},revokeObjectURL(){}};
global.Blob=function(){};
global.confirm=()=>true;
global.alert=()=>{};

let src=fs.readFileSync(__dirname+'/app.js','utf8');
const cut=src.lastIndexOf('(async()=>{');
if(cut<0)throw new Error('Selbstaufruf nicht gefunden');
src=src.slice(0,cut).replace(/^"use strict";/,'');

const NAMEN=['toNum','isLim','putz','nurMarker','leseOptimum','parseNCC','parseIns','parseAuto',
 'parseGiess','pdfPunkte','GW_PARAM','GW_MAKRO','GW_MIKRO','inMgL','leer','migriere','ausKW','montagKW','bezugFuer','aussaatVon','kulturdauer','alter',
 'optVon','optQuelle','status','istOk','istRand','lage','abstand','ausmass','schwereVon',
 'erhebungen','massgebliche','bewerte','indexVon','bilanz','verh','substratZu','befunde','wiederkehrend',
 'saetzeListe','vorschlaege','kern','einheit','nz','esc','leitProbe','alleProben','alleSaetze','datenlage',
 'vLage','vAnalysen','vNaehr','vWirkung','vSubstrat','vGiess','vLogbuch','vRund','vPlaner','vSaetze','vFotos',
 'chartPunkte','chartIndex','chartProfil','chartSaetze','render','sichern','laden','felderText',
 'fotoGruppen','exifDatum','dataUrlBytes','dbBytes','ETAGEN','PRODUKTE_VORGABE','tippBau','legende','FARBSTOFF',
 'EVTYPEN','EVTYP_ALT','evTypDef','STELLEN','evMenge','evMittelListe','monatName',
 'tabBlatt','tabDatum','tabZahl','bemerkungLesen','csvZeilen','tabZusammen','kopfArt','MITTEL_MUSTER',
 'NAME','KERN_VORGABE','KERN_WAEHLBAR','MOBIL','BALLAST','NCC','INS','PAARE','RICHT_VORGABE','TABS','AKTION','STTEXT'];

const fn=new Function('module','exports','require','document','window','globalThis',
  src+'\n;return {'+NAMEN.map(n=>n+':typeof '+n+'!=="undefined"?'+n+':undefined').join(',')+
  ', einheitVon:typeof evEinheit!=="undefined"?evEinheit:undefined, setDb:x=>{db=x}, getDb:()=>db, setTab:t=>{tab=t}, nachRenderRun:()=>{if(nachRender){const g=nachRender;nachRender=null;g()}}}');
module.exports=fn(module,{},require,global.document,global.window,global);
