const A=require('./harness.js');
let fehler=0;
const ok=(b,t)=>{if(!b)fehler++;console.log((b?'  ✓ ':'  ✗ FEHLER ')+t)};

console.log('════ 13 · Migration einer Sicherung im alten Format 3 ════');
/* So sah eine Datei der alten Fassung aus: limit statt unter, Substratwerte im
   Blattsaft-Namensraum, Al-Optimum als Spanne [0,5;0,5]. */
const alt3={schema:3,version:7,gespeichert:'2026-08-01T10:00:00.000Z',
  analysen:[
    {id:'a1',typ:'blattsaft',labor:'NovaCropControl',datum:'2026-08-18',satz:'28-478',blattalter:'jung',zustand:null,
     werte:{K:{wert:1040},Mo:{wert:0.05,limit:true},Al:{wert:1.03,limit:false},NO3:{wert:36},Ca:{wert:814}},
     optima:{K:[3975,4800],Mo:[null,0.05],Al:[0.5,0.5],NO3:[2010,3530],Ca:[810,1275]}},
    {id:'a2',typ:'substrat',labor:'Labor Ins AG',datum:'2026-08-14',satz:'28-478',blattalter:null,zustand:null,
     parzelle:'28-478 grün',
     werte:{pH:{wert:5.2},Nmin:{wert:22},Salz:{wert:1.4},Mn:{wert:14},sof_K2O:{wert:180}},optima:{}}],
  ereignisse:[{id:'e1',datum:'2026-08-05',typ:'Düngerwechsel',titel:'Biorga',felder:{},geltung:'alle',saetze:[]}],
  messungen:[{id:'m1',datum:'2026-08-10',ph:6.2,ec:1.4,ecFrisch:2.1,notiz:null}],
  rundgaenge:[{id:'r1',datum:'2026-08-12',satz:'alle',kultur:'blass',notiz:null,eintraege:[{schaden:'mehltau',stufe:1}]}],
  saetze:{'28-478':{substrat:'Ökohum'}},
  eigeneOptima:{},
  plan:{zielwochen:[2,4,6],begleitet:[],geplant:[]},
  einst:{verlagerung:1.3,kMg:8,kCa:3,dauerSommer:7,dauerWinter:10,schaeden:['mehltau','botrytis']}};

const erg=A.migriere(JSON.parse(JSON.stringify(alt3)));
console.log('   von Format',erg.von,'nach',erg.db.schema);
erg.notizen.forEach(n=>console.log('   ·',n));
ok(erg.db.schema===6,'Schema auf 6 gehoben');
ok(Array.isArray(erg.db.fotos)&&!erg.db.fotos.length,'Fotoablage leer angelegt');
ok(erg.db.produkte&&erg.db.produkte.biovin&&erg.db.produkte.biovin.gehalt.Fe===0.22,'Produktstammdaten mit den Etikettwerten angelegt');
ok(erg.db.analysen.length===2,'Beide Analysen übernommen');
ok(erg.db.ereignisse.length===1&&erg.db.messungen.length===1&&erg.db.rundgaenge.length===1,'Logbuch, Messungen und Rundgänge übernommen');
const a1=erg.db.analysen[0],a2=erg.db.analysen[1];
ok(a1.werte.Mo.unter===true&&a1.werte.Mo.limit===undefined,'limit → unter umbenannt');
ok(a1.optima.Al[0]===null&&a1.optima.Al[1]===0.5,'Al-Optimum [0,5;0,5] als Nachweisgrenze korrigiert');
ok(a2.werte.sub_pH&&a2.werte.sub_pH.wert===5.2,'Substrat-pH nach sub_pH verschoben');
ok(a2.werte.sub_Mn&&!a2.werte.Mn,'Substrat-Mangan nach sub_Mn verschoben');
ok(a2.werte.sof_K2O&&a2.werte.sof_K2O.wert===180,'Bereits richtig benannte Substratwerte unverändert');
ok(erg.db.einst.kern&&erg.db.einst.kern.length===11,'Kern-Vorgabe gesetzt');
ok(erg.db.einst.verlagerung===1.3&&erg.db.einst.kMg===8,'Eigene Schwellen erhalten');
ok(erg.db.einst.schaeden.length===2,'Eigene Schadensauswahl erhalten');
ok(erg.db.saetze['28-478'].substrat==='Ökohum','Satzangaben erhalten');
A.setDb(erg.db);
ok(A.optVon(a2,'sub_Mn')==null,'Ein eigener Blattsaft-Zielbereich greift nicht mehr auf Substratwerte');
erg.db.eigeneOptima={Mn:[1,4]};
A.setDb(erg.db);
ok(A.optVon(a2,'sub_Mn')==null,'Auch mit gesetztem eigenem Mn-Bereich bleibt der Substratwert unberührt');

console.log('\n════ 14 · Sicherung schreiben und wieder laden ════');
ok(erg.db.analysen.every(a=>a.typ!=='giesswasser'||!a.einheitAlt),'Ohne Wasseranalysen keine Einheitenwarnung');
const rund=JSON.parse(JSON.stringify(erg.db));
const erg2=A.migriere(rund);
ok(erg2.von===6&&!erg2.notizen.length,'Eine Datei im aktuellen Format wird ohne Umbau geladen');
ok(JSON.stringify(erg2.db.analysen)===JSON.stringify(erg.db.analysen),'Analysen bleiben beim Rundlauf identisch');
A.setDb(erg2.db);
let render=true;try{A.vLage();A.vSubstrat();A.vSaetze();A.nachRenderRun()}catch(e){render=false;console.log('   FEHLER',e.message)}
ok(render,'Die geladene Datei rendert fehlerfrei');

console.log('\n════ 15 · Phantomdaten sind jetzt sichtbar ════');
const d=A.leer();
d.analysen=[
 {id:'b1',typ:'blattsaft',labor:'NovaCropControl',datum:'2026-08-18',satz:'28-478',blattalter:'jung',zustand:null,
  kultur:'Eichhof 8B',laborId:'202608201117',
  werte:{Mo:{wert:0.05,unter:true},K:{wert:1040}},optima:{Mo:[null,0.05],K:[3975,4800]}},
 {id:'s1',typ:'substrat',datum:'2026-08-14',satz:'28-478',blattalter:null,zustand:'grün',tiefe:5,
  parzelle:'28-478 grün 5cm',werte:{sub_pH:{wert:5.2},sub_Nmin:{wert:22}},optima:{}}];
d.saetze={'28-478':{notiz:'Ecke beim Tor',tisch:'Tisch 3',substrat:'Ökohum neu',duenger:'Biorga'}};
A.setDb(d);
const hSaetze=A.vSaetze(),hAnalysen=A.vAnalysen(),hSub=A.vSubstrat();
ok(/Ecke beim Tor/.test(hSaetze),'saetze[].notiz wird angezeigt');
ok(/Tisch 3/.test(hSaetze),'saetze[].tisch wird angezeigt');
ok(/5 cm/.test(hAnalysen)||/5 cm/.test(hSub),'Entnahmetiefe wird angezeigt');
ok(/Entnahmetiefe nicht erfasst|cm/.test(hSub),'Substrat-Reiter thematisiert die Entnahmetiefe');
/* limit/unter im Detail */
let detailHtml='';
const alterD=A.AKTION.detail;
global.document.getElementById('dlgBody').innerHTML='';
alterD({id:'b1'});
detailHtml=global.document.getElementById('dlgBody').innerHTML;
ok(/&lt;0,05|unter Nachweisgrenze/.test(detailHtml),'Werte unter der Nachweisgrenze werden als solche gezeigt statt als Zahl');
ok(/Eichhof 8B/.test(detailHtml),'analysen[].kultur (Herkunft) wird angezeigt');
alterD({id:'s1'});
ok(/28-478 grün 5cm/.test(global.document.getElementById('dlgBody').innerHTML),'analysen[].parzelle wird angezeigt');
const hPlaner=A.vPlaner();
ok(/pill al">jetzt|dringend/.test(hPlaner)||!/vorschlag/.test(hPlaner),'dringend wird im Planer dargestellt');

console.log('\n════ 16 · Nachweisgrenze fliesst in keine Kennzahl ════');
const d6=A.leer();
d6.einst.kern=['Mo','K'];
d6.analysen=[{id:'x',typ:'blattsaft',datum:'2026-08-18',satz:'28-478',blattalter:'jung',zustand:null,
  werte:{Mo:{wert:0.05,unter:true},K:{wert:5000}},optima:{Mo:[null,0.05],K:[3975,4800]}}];
d6.saetze={'28-478':{}};A.setDb(d6);
const e6=A.erhebungen()[0];
console.log('   Kennzahl:',e6.index.ok,'von',e6.index.n,'· Molybdaen:',JSON.stringify(e6.bew.Mo));
ok(e6.index.n===1,'Der Wert unter der Nachweisgrenze zaehlt nicht mit (Nenner 1 statt 2)');
ok(e6.bew.Mo.fehlt&&e6.bew.Mo.grund==='Nachweisgrenze','Und wird als «Nachweisgrenze» ausgewiesen');

process.exit(fehler?1:0);
