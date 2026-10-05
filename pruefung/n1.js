const A=require('./harness.js');
let fehler=0;
const ok=(b,t)=>{if(!b)fehler++;console.log((b?'  ✓ ':'  ✗ FEHLER ')+t)};
const seiten=require('./seiten.json');

console.log('════ 1 · Parser gegen die echte Datei ════');
const r=A.parseNCC(seiten);
const soll={Zucker:[1.1,0.5],pH:[5.8,5.8],EC:[9.7,8.5],K:[1040,1418],Ca:[814,766],'K/Ca':[1.28,1.85],
 Mg:[654,314],Na:[4,13],NH4:[178,85],NO3:[36,263],N_aus_NO3:[8,59],N_gesamt:[1466,807],Cl:[2706,1811],
 S:[377,327],P:[520,380],Si:[31.5,47.2],Fe:[1.06,1.22],Mn:[7.08,10.54],Zn:[0.64,0.57],B:[0.79,1.05],
 Cu:[0.29,0.18],Mo:[0.05,0.05],Al:[1.03,1.42]};
let ab=0;
for(const [k,[sj,sa]] of Object.entries(soll)){
  if(r.proben[0].werte[k]?.wert!==sj||r.proben[1].werte[k]?.wert!==sa){ab++;
    console.log('   ABWEICHUNG',k,r.proben[0].werte[k]?.wert,r.proben[1].werte[k]?.wert,'soll',sj,sa)}
}
ok(ab===0,'Alle 23 Parameter x 2 Proben unverändert korrekt gelesen');
ok(r.proben[0].satz==='28-478'&&r.proben[0].datum==='2026-08-18','Satz und Datum korrekt');
ok(r.proben[0].blattalter==='jung'&&r.proben[1].blattalter==='alt','Blattalter korrekt zugeordnet');
ok(r.proben[0].werte.Mo.unter===true,'Molybdaen <0,05 ist als Nachweisgrenze gekennzeichnet');

console.log('\n════ 2 · Behoben: Aluminium-Nachweisgrenze ════');
console.log('   Al-Optimum gelesen:',JSON.stringify(r.proben[0].optima.Al),'(im PDF: <0,50 - <0,50)');
ok(r.proben[0].optima.Al[0]===null,'«<0,50 - <0,50» wird als Obergrenze gelesen, nicht als Spanne [0,5;0,5]');
A.setDb(Object.assign(A.leer(),{analysen:[]}));
console.log('   lage(0,5) =',A.lage(0.5,[null,0.5]),'· Anzeige:',A.optText([null,0.5]));
ok(A.lage(0.5,[null,0.5])<=2,'Ein Wert an der Obergrenze liegt im Optimum');
ok(A.optText([null,0.5])==='bis 0.5'&&/^810–1.275$/.test(A.optText([810,1275]))&&A.optText([2,null])==='ab 2','Das Optimum wird so gezeigt, wie es gemeint ist: «bis», «ab» oder eine Spanne');
ok(r.proben[0].optima.Mo[0]===null&&r.proben[0].optima.Mo[1]===0.05,'Molybdaen-Optimum «< 0,05» korrekt als [null; 0,05]');

console.log('\n════ 3 · Behoben: geteiltes optima-Objekt ════');
ok(r.proben[0].optima!==r.proben[1].optima,'Jede Probe hat ihr eigenes Optima-Objekt');
r.proben[0].optima.K=[1,1];
ok(r.proben[1].optima.K[0]===3975,'Aendern der einen Probe laesst die andere unberuehrt');

console.log('\n════ 4 · Behoben: putz() frisst keine Messwerte mehr ════');
const mut=JSON.parse(JSON.stringify(seiten));
mut[0][40]='Na - Natrium ppm 2 22 - 44';
mut[0][42]='ppm 1';
const rm=A.parseNCC(mut);
console.log('   Na jung:',rm.proben[0].werte.Na?.wert,'· Na alt:',rm.proben[1].werte.Na?.wert,
            '· Optimum:',JSON.stringify(rm.proben[0].optima.Na));
ok(rm.proben[0].werte.Na?.wert===2,'Messwert 2 bleibt 2 (frueher: 22)');
ok(rm.proben[1].werte.Na?.wert===1,'Messwert 1 der Altprobe bleibt erhalten (frueher: verschwunden)');
ok(rm.proben[0].optima.Na&&rm.proben[0].optima.Na[0]===22,'Das Optimum 22-44 bleibt erhalten (frueher: weg)');
const mut2=JSON.parse(JSON.stringify(seiten));
const r2=A.parseNCC(mut2);
ok(Object.keys(r2.proben[0].werte).length===23,'Die echte Datei wird weiterhin vollstaendig gelesen');

console.log('\n════ 5 · Gezeigt wird das Optimum des Labors ════');
const d3=A.leer();
d3.analysen=[{id:'x',typ:'blattsaft',datum:'2025-05-12',satz:'19-434',blattalter:'jung',zustand:null,
  werte:{K:{wert:4200}},optima:{K:[4500,6000],Na:[null,null]}}];
d3.eigeneOptima={K:[null,5200]};A.setDb(d3);
ok(JSON.stringify(A.optimum(d3.analysen[0],'K'))==='[4500,6000]','Eigene Grenzen aus früheren Fassungen verändern das Optimum nicht – es steht, was im Bericht steht');
ok(A.optimum(d3.analysen[0],'Na')===null,'Ein leeres Optimum gilt als keines');
ok(A.optimum(d3.analysen[0],'Mg')===null,'Ein fehlendes erst recht');
ok(A.lage(4200,[4500,6000])<1&&A.lage(5000,[4500,6000])>1&&A.lage(5000,[4500,6000])<2&&A.lage(7000,[4500,6000])>2,'Lage 0–3: darunter, im Optimum, darüber');

process.exit(fehler?1:0);
