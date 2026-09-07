const A=require('./harness.js');
let fehler=0;
const ok=(b,t)=>{if(!b)fehler++;console.log((b?'  ✓ ':'  ✗ FEHLER ')+t)};
const FIX=require('./giesswasser.json');
const lese=n=>A.parseGiess(FIX[n].seiten,FIX[n].punkte);

console.log('════ Bericht mit Historie: zwei Proben ════');
const a=lese('vorneZwei');
console.log('Entnahmestelle:',a.proben.map(p=>p.stelle)[0],'· Lage:',a.proben[0].kultur);
a.proben.forEach(p=>console.log('   '+p.datum+'  Nr '+p.laborId+'  '+Object.keys(p.werte).length+' Parameter'));
a.hinweise.forEach(h=>console.log('   Hinweis:',h));
ok(a.proben.length===2,'Zwei Proben erkannt (Analyse und eine aus der Historie)');
ok(a.proben[0].datum==='2026-08-18'&&a.proben[1].datum==='2026-07-23','Beide Probendaten korrekt');
ok(a.proben[0].laborId==='202608200042'&&a.proben[1].laborId==='202607300193','Beide Probennummern korrekt');
ok(a.proben[0].stelle==='Reservoir Vorne','Entnahmestelle aus der Kopfzeile');
ok(a.proben[0].kultur==='Eichhof 8B','Lage aus der Kopfzeile');

console.log('\n Werte gegen den Bericht:');
const soll1={gw_EC:1.0,gw_pH:7.6,gw_NH4:3.69,gw_K:0.5,gw_Na:0.7,gw_Ca:1.1,gw_KCa:0.42,gw_Mg:2.1,
  gw_Si:0.1,gw_NO3:0.3,gw_Cl:1.0,gw_S:2.0,gw_HCO3:2.64,gw_P:1.47,gw_Fe:0.4,gw_Mn:0.3,gw_Zn:0.2,
  gw_B:5.0,gw_Cu:0.3,gw_Mo:0.3,gw_Al:5.0};
const soll2={gw_EC:0.8,gw_pH:7.3,gw_NH4:4.55,gw_K:0.3,gw_Na:0.5,gw_Ca:1.2,gw_KCa:0.25,gw_Mg:0.8,
  gw_Si:0.1,gw_NO3:0.3,gw_Cl:0.9,gw_S:0.8,gw_HCO3:1.71,gw_P:2.81,gw_Fe:3.4,gw_Mn:0.6,gw_Zn:1.0,
  gw_B:5.0,gw_Cu:0.3,gw_Mo:0.3,gw_Al:5.0};
let ab=0;
console.log('  Parameter   18.08.     23.07.    Einheit');
for(const k of Object.keys(soll1)){
  const v1=a.proben[0].werte[k],v2=a.proben[1].werte[k];
  if(!v1||v1.wert!==soll1[k]){ab++;console.log('   ABWEICHUNG',k,v1&&v1.wert,'soll',soll1[k])}
  if(!v2||v2.wert!==soll2[k]){ab++;console.log('   ABWEICHUNG',k,v2&&v2.wert,'soll',soll2[k])}
  console.log('  '+k.slice(3).padEnd(11)+
    ((v1.unter?'<':'')+v1.wert).padEnd(11)+((v2.unter?'<':'')+v2.wert).padEnd(10)+A.einheit(k));
}
ok(ab===0,'Alle 21 Parameter × 2 Proben stimmen mit dem Bericht überein');
ok(a.proben[0].werte.gw_Si.unter===true,'Nachweisgrenzen erkannt (<0,1 bei Silizium)');
ok(A.einheit('gw_HCO3')==='mmol/l','Makronährstoffe in mmol/l');
ok(A.einheit('gw_Fe')==='µmol/l','Spurenelemente in µmol/l');
ok(A.einheit('gw_EC')==='mS/cm'&&A.einheit('gw_pH')==='','EC und pH ohne falsche Einheit');

console.log('\n════ Einzelberichte vom selben Tag ════');
const b=lese('hintenOhne'),c=lese('vorneMit');
console.log('  '+b.proben[0].datum+'  '+b.proben[0].stelle+'   Nr '+b.proben[0].laborId);
console.log('  '+c.proben[0].datum+'  '+c.proben[0].stelle+'   Nr '+c.proben[0].laborId);
ok(b.proben.length===1&&c.proben.length===1,'Je eine Probe – die Historie enthält nur dieselbe Probe');
ok(b.proben[0].datum===c.proben[0].datum,'Beide vom selben Tag (06.08.2026)');
ok(b.proben[0].stelle!==c.proben[0].stelle,'Aber unterschiedliche Entnahmestellen: «'+b.proben[0].stelle+'» und «'+c.proben[0].stelle+'»');
ok(b.proben[0].laborId!==c.proben[0].laborId,'und unterschiedliche Probennummern');
console.log('\n  Vergleich der beiden Stellen vom 06.08.:');
console.log('  Parameter   '+b.proben[0].stelle.padEnd(20)+c.proben[0].stelle);
for(const k of ['gw_EC','gw_pH','gw_HCO3','gw_NO3','gw_Fe','gw_Na','gw_Cl']){
  const x=b.proben[0].werte[k],y=c.proben[0].werte[k];
  console.log('  '+k.slice(3).padEnd(11)+
    ((x.unter?'<':'')+x.wert+' '+A.einheit(k)).padEnd(20)+((y.unter?'<':'')+y.wert+' '+A.einheit(k)));
}
ok(b.proben[0].werte.gw_HCO3.wert===3.92&&c.proben[0].werte.gw_HCO3.wert===6.28,'Hydrogencarbonat je Stelle korrekt gelesen');

console.log('\n════ Erkennung durch parseAuto ════');
for(const n of ['vorneZwei','hintenOhne','vorneMit']){
  const r=A.parseAuto(FIX[n].seiten,FIX[n].punkte);
  console.log('  '+n.padEnd(12)+'typ='+r.typ+'  Labor='+r.labor+'  Proben='+r.proben.length);
  ok(r.typ==='giesswasser','parseAuto erkennt '+n+' als Giesswasser');
}
const bs=A.parseAuto(require('./seiten.json'),null);
ok(bs.typ==='blattsaft','Blattsaft wird weiterhin als Blattsaft erkannt');

console.log('\n════ Umrechnung zur Einordnung ════');
for(const [k,v] of [['gw_Na',0.7],['gw_Cl',1.0],['gw_HCO3',3.92],['gw_Fe',1.0]]){
  console.log('  '+k.slice(3).padEnd(6)+v+' '+A.einheit(k)+'  =  '+A.nz(A.inMgL(k,v),1)+' mg/l');
}
ok(Math.abs(A.inMgL('gw_Na',0.7)-16.09)<0.1,'0,7 mmol/l Natrium sind 16,1 mg/l');
ok(Math.abs(A.inMgL('gw_Fe',1.0)-0.056)<0.001,'1,0 µmol/l Eisen sind 0,056 mg/l');



console.log('\n════ Der Reiter Giesswasser ════');
{
  const d=A.leer();
  const alle=[];
  for(const n of ['vorneZwei','hintenOhne','vorneMit']){
    const r=A.parseGiess(FIX[n].seiten,FIX[n].punkte);
    r.proben.forEach((p,i)=>alle.push(Object.assign({id:n+i,typ:'giesswasser',labor:r.labor},p)));
  }
  d.analysen=alle;
  d.messungen=[{id:'m1',datum:'2026-08-10',ph:6.1,ec:1.5,ecFrisch:2.1,temp:24,notiz:null}];
  A.setDb(d);
  const h=A.vGiess();A.nachRenderRun();
  console.log('  Proben im Bestand:',alle.length);
  const stellen=[...new Set(alle.map(a=>a.stelle))];
  console.log('  Entnahmestellen:',stellen.join(' · '));
  ok(stellen.length===3,'Drei Entnahmestellen erkannt');
  ok(!/undefined|NaN|\[object Object\]/.test(h),'Der Reiter rendert sauber');
  ok(/Reservoir Vorne/.test(h)&&/Hinter, Ohne H2O2/.test(h)&&/Vorne, mitt H2O2/.test(h),'Alle drei Namen erscheinen');
  ok(/Alle Proben nebeneinander/.test(h),'Vergleichstabelle vorhanden');
  ok(/Verlauf/.test(h),'Verlaufsdiagramm vorhanden');
  const tooltips=(h.match(/title="[^"]*Vorne, mitt H2O2[^"]*"/g)||[]).length;
  console.log('  Tooltips mit dem Stellennamen:',tooltips);
  ok(tooltips>=3,'Der Name der Entnahmestelle steht in den Tooltips');
  /* zwei Proben am selben Tag */
  const amTag=alle.filter(a=>a.datum==='2026-08-06');
  console.log('  Proben am 06.08.:',amTag.map(a=>a.stelle).join(' und '));
  ok(amTag.length===2&&amTag[0].stelle!==amTag[1].stelle,'Zwei Proben vom selben Tag, unterscheidbar benannt');
  const farbig=(h.match(/border-radius:50%;background:#[0-9A-F]{6}/gi)||[]).length;
  ok(farbig>=3,'Jede Entnahmestelle hat eine eigene Farbe ('+farbig+' Farbpunkte)');
  ok(/über dem Richtwert/.test(h),'Richtwertüberschreitungen werden benannt');
  ok(/Annahme/.test(h)&&/Nicht vom Labor vorgegeben/.test(h),'Richtwerte als Annahme mit Herkunft gekennzeichnet');
  ok(/Was mit dem Wasser schon an Nährstoffen hereinkommt/.test(h),'Zeigt, was das Wasser schon mitbringt');
  ok(/Dosierungsrechnung baut die App bewusst nicht/.test(h),'Und verzichtet ausdrücklich auf eine Dosierungsrechnung');
  ok(/Der Kreislauf selbst/.test(h),'Der Kreislauf ist in denselben Reiter gewandert');

  console.log('\n  Verlaufsdiagramm: Punkte je Entnahmestelle');
  const box={clientWidth:900,innerHTML:''};
  const farbenMap=A.getDb();
  A.setDb(d);
  const hh=A.vGiess();A.nachRenderRun();
  const svg=global.document.getElementById('cGw').innerHTML;
  const titel=[...svg.matchAll(/<title>([^<]*)<\/title>/g)].map(m=>m[1]);
  titel.slice(0,4).forEach(t=>console.log('   ',t));
  ok(titel.some(t=>/Reservoir Vorne/.test(t)),'Tooltip im Diagramm nennt die Entnahmestelle');

  console.log('\n  Alle Reiter mit Wasserdaten:');
  const bad=[];
  for(const t of ['vLage','vAnalysen','vNaehr','vWirkung','vSubstrat','vGiess','vLogbuch','vRund','vPlaner','vSaetze']){
    try{const x=A[t]();A.nachRenderRun();if(/undefined|NaN|\[object Object\]/.test(x))bad.push(t)}
    catch(e){bad.push(t+' WIRFT '+e.message)}
  }
  ok(!bad.length,'Alle zehn Reiter sauber'+(bad.length?': '+bad.join(', '):''));
}

console.log('\n════ Migration alter Wasserdaten ════');
{
  const alt3={schema:4,version:1,analysen:[
    {id:'g',typ:'giesswasser',datum:'2026-05-01',satz:null,blattalter:null,zustand:null,
     werte:{gw_Na:{wert:18},gw_Cl:{wert:26}},optima:{}}],
    ereignisse:[],messungen:[],rundgaenge:[],saetze:{},eigeneOptima:{},
    plan:{zielwochen:[2,4,6],begleitet:[],geplant:[]},einst:{}};
  const erg=A.migriere(alt3);
  console.log('  Notizen:',erg.notizen.length?erg.notizen.join(' | '):'keine');
  ok(erg.db.analysen[0].einheitAlt===true,'Von Hand erfasste Wasserwerte werden als einheitenunklar markiert');
  ok(erg.notizen.some(n=>/mmol\/l/.test(n)),'Und die Migration sagt warum');
  A.setDb(erg.db);
  ok(/vor der Umstellung/.test(A.vGiess()),'Der Reiter weist darauf hin');
}
process.exit(fehler?1:0);
