/* DOM-Ersatz, damit basilikum.html in node läuft. */
const fs=require('fs');
function mkEl(id){
  const kinder=[];
  const e={id,tagName:'DIV',type:'',innerHTML:'',textContent:'',value:'',checked:false,hidden:false,disabled:false,
    open:false,dataset:{},style:{},files:[],selectedOptions:[],clientWidth:900,
    classList:{add(){},remove(){},toggle(){},contains(){return false}},
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

const NAMEN=['toNum','isLim','putz','nurMarker','leseOptimum','parseNCC','parseIns','parseAuto','parseGiess','pdfPunkte',
 'GW_PARAM','GW_MAKRO','GW_MIKRO','inMgL','einheit','nz','esc','NAME','NCC','INS','leer','migriere','optimum','optText','lage',
 'EVTYPEN','EVTYP_ALT','evTypDef','evEinheit','STELLEN','PRODUKTE_VORGABE','STELLEN_VORGABE','TABS','AKTION','render',
 'vAnalysen','vKombi','vTank','vMaske','vEinst','berichte','berichtVon','berichtSchluessel','berichtTitel','detail','wertMitOptimum',
 'pruefdialog','GRUPPEN','chartStapel','zeitMarken','spannenZeilen','spannenSvg','dunkler','tippBau','farbenFuer','spurGruppen',
 'groessenordnung','STOFFREIHE','gwProben','gwStelle','gwName','stelleVon','stelleTitel','stelleName','stelleSchluessel','gwSichtbar',
 'stellenDb','stellenListe','stellenVorschlag','stellenDialog','messStelle','tankStellen','HERKUNFT',
 'beigabeSpannenMittel','beigabeLaeuft','beigabeSumme','beigabeHand','mittelKurz','MITTEL_FARBE','BEIGABE_LUECKE',
 'kmListe','kmBalken','mittelZeitraumDazu','evMenge','evAngaben','evNotiz','evMittelListe','eigeneFarbe','typKurz',
 'paketNeues','PAKETE','PAKET_RES26','paketStand','paketZeitraum','paketAltImport','paketHinweis','paketKarte',
 'zeitNorm','zeitMin','zeitpunkt','chrono','chronoAb','messLage','fmtZ','heute','sichern','laden','datenAusText','datenAusSeite',
 'seiteMitDaten','seiteMerken','sichernJson','vereinigen','ONLINE','onlineStand','zoomMelden','ansichtMerken','ansichtLaden',
 'tabBlatt','tabDatum','tabZahl','bemerkungLesen','csvZeilen','tabZusammen','kopfArt','MITTEL_MUSTER','tabZeit','dbBytes'];

const fn=new Function('module','exports','require','document','window','globalThis',
  src+'\n;return {'+NAMEN.map(n=>n+':typeof '+n+'!=="undefined"?'+n+':undefined').join(',')+
  ', setDb:x=>{db=x}, getDb:()=>db, setTab:t=>{tab=t}, getTab:()=>tab, setKmAus:x=>{kmAus=x}, getKmAus:()=>kmAus,'+
  ' setKombi:o=>{if(o.blatt)kbBlatt=o.blatt;if(o.wasser)kbWasser=o.wasser;if(o.etage)kbEtage=o.etage;if(o.skala)kbSkala=o.skala;if(o.linien)kbLinien=o.linien},'+
  ' getKombi:()=>({blatt:kbBlatt,wasser:kbWasser,etage:kbEtage,skala:kbSkala,linien:kbLinien}), resetKombi:()=>{kbBlatt=null;kbWasser=null},'+
  ' setTabPruef:x=>{TABPRUEF=x}, setPruef:(v,b)=>{PRUEF=v;PRUEF_BEARB=!!b}, setSeite:x=>{SEITE_ROH=x}, getSeite:()=>SEITE_ROH,'+
  ' getDiag:()=>DIAG, nachRenderRun:()=>{if(nachRender){const g=nachRender;nachRender=null;g()}}}');
module.exports=fn(module,{},require,global.document,global.window,global);
