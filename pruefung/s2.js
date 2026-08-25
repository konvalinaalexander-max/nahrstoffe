/* Verdachtsliste D · E · F — Unsicherheit, Zensierung, Struktur */
const A=require('./harness.js');
const fs=require('fs');
const r=A.parseNCC(require('./seiten.json'));
const P=t=>console.log('\n'+t+'\n'+'─'.repeat(t.length));
const basis=()=>{const d=A.leer();
  d.analysen=r.proben.map((p,i)=>Object.assign({id:'p'+i,typ:'blattsaft',labor:r.labor},JSON.parse(JSON.stringify(p))));
  d.saetze={'28-478':{}};A.setDb(d);return d};

console.log('══════════════════════════════════════════════════════════');
console.log(' D · Messunsicherheit');
console.log('══════════════════════════════════════════════════════════');

P('D1 · Gibt der Laborbericht eine Praezision an?');
const roh=[].concat(...require('./seiten.json')).join('\n');
const treffer=roh.match(/[Pp]r[äa]zision|[Uu]nsicherheit|[Uu]ncertaint|[Ss]tandardabw|\bSD\b|\bCV\b|[Ww]iederhol|[Tt]oleranz|±/g);
console.log('Fundstellen im Bericht:',treffer?treffer.join(', '):'KEINE');
console.log('\n→ Der Bericht nennt keinerlei Angabe zur Messpraezision.');
console.log('  Aus den Daten selbst laesst sie sich nicht schaetzen: dafuer braeuchte es');
console.log('  Wiederholungen derselben Probe – die es nicht gibt (siehe F).');

P('D2 · Die 5-%-Toleranz haengt an der Grenze, nicht an der Messung');
console.log('Parameter    Untergrenze   5 % davon      relativ zum gemessenen Wert');
const j=r.proben[0].werte,o=r.proben[0].optima;
for(const k of ['NO3','K','Mg','B','Cu','Zn']){
  if(!o[k]||o[k][0]==null)continue;
  const lo=o[k][0],tol=lo*0.05,v=j[k].wert;
  console.log((A.NAME[k]||k).padEnd(13)+String(lo).padEnd(14)+tol.toFixed(3).padEnd(15)+(tol/v*100).toFixed(1)+' % des Messwerts');
}
console.log('\n→ Bei Nitrat sind 5 % der Untergrenze 100 ppm – das ist das Dreifache des');
console.log('  gemessenen Wertes von 36 ppm. Die Toleranz ist dort voellig bedeutungslos.');
console.log('  Bei Bor sind es 0,04 ppm auf einen Messwert von 0,79 – rund 5 %.');
console.log('  Dieselbe Zahl bedeutet je nach Parameter voellig Verschiedenes.');

console.log('\n══════════════════════════════════════════════════════════');
console.log(' E · Werte unter der Nachweisgrenze');
console.log('══════════════════════════════════════════════════════════');

P('E1 · Wie viele sind es in der echten Datei?');
const unter=Object.entries(r.proben[0].werte).filter(([k,w])=>w.unter);
console.log('Betroffen:',unter.map(([k,w])=>A.NAME[k]+' <'+w.wert).join(', ')||'keine');
console.log('In der Kennzahl enthalten?',unter.map(([k])=>k).filter(k=>A.kern().indexOf(k)>=0).length?'ja':'nein – Molybdaen steht nicht in KERN');

P('E2 · Die Richtung der Verzerrung');
const d=basis();
d.einst.kern=['NO3','K','Ca','Mg','P','S','Fe','Mn','Zn','B','Cu','Mo'];
d.analysen.forEach(a=>{a.optima.Mo=[0.2,0.9]});   // hypothetisch: Mo mit Untergrenze
A.setDb(d);
let e=A.erhebungen()[0];
console.log('Mit Molybdaen in der Kennzahl, Optimum ab 0,20, gemessen <0,05:');
console.log('   Kennzahl',e.index.ok,'von',e.index.n,'=',Math.round(e.index.anteil*100)+' %   (Molybdaen ausgeschlossen)');
const d2=basis();
d2.einst.kern=['NO3','K','Ca','Mg','P','S','Fe','Mn','Zn','B','Cu','Mo'];
d2.analysen.forEach(a=>{a.optima.Mo=[0.2,0.9];a.werte.Mo.unter=false});
A.setDb(d2);
const e2=A.erhebungen()[0];
console.log('Wuerde der Wert als 0,05 gezaehlt (also als Mangel):');
console.log('   Kennzahl',e2.index.ok,'von',e2.index.n,'=',Math.round(e2.index.anteil*100)+' %');
console.log('\n→ Der Ausschluss hebt die Kennzahl an: es faellt ein Naehrstoff heraus, der');
console.log('  mit Sicherheit NICHT im Optimum liegt. Das ist der klassische Fall');
console.log('  linksseitig zensierter Daten – der Ausschluss ist nicht neutral.');
console.log('  Richtig waere: als "sicher unter dem Optimum" zaehlen, wenn die');
console.log('  Nachweisgrenze selbst unter der Untergrenze liegt.');
console.log('  Das ist ohne jede Statistik entscheidbar und kostet eine Zeile.');

console.log('\n══════════════════════════════════════════════════════════');
console.log(' F · Datenstruktur');
console.log('══════════════════════════════════════════════════════════');

const skript=fs.readFileSync(__dirname+'/app.js','utf8');

P('F1 · Typabhaengige Verzweigungen quer durch den Code');
const zweige=skript.match(/typ\s*===?\s*'(blattsaft|substrat|giesswasser)'/g)||[];
const zaehl={};zweige.forEach(z=>{const m=z.match(/'(\w+)'/)[1];zaehl[m]=(zaehl[m]||0)+1});
console.log('Vorkommen:',Object.entries(zaehl).map(([k,v])=>k+' '+v+'×').join(' · '),'– zusammen',zweige.length);

P('F2 · Die Erhebung wird rekonstruiert, nicht modelliert');
console.log("Schluessel:  (a.satz||'?') + '|' + a.datum + '|' + (a.zustand||'')");
const dd=A.leer();
const mk=(id,extra)=>Object.assign({id,typ:'blattsaft',datum:'2026-08-18',satz:'28-478',blattalter:'jung',
  zustand:null,werte:{K:{wert:1040}},optima:{K:[3975,4800]}},extra);
dd.analysen=[mk('a'),mk('b')];   // zwei Proben, gleicher Tag, gleicher Satz – z.B. zwei Tische
dd.saetze={'28-478':{}};A.setDb(dd);
const eh=A.erhebungen();
console.log('Zwei Proben vom selben Tag, selber Satz, selbes Blattalter (z.B. zwei Tische):');
console.log('   Erhebungen:',eh.length,'· Proben in der Erhebung:',eh[0].liste.length,
            '· in proben.jung:',eh[0].proben.jung.id);
console.log('\n→ Die zweite Probe ueberschreibt die erste in e.proben.jung und ist fuer die');
console.log('  gesamte Bewertung unsichtbar. Genau eine solche Doppelprobe waere aber die');
console.log('  Voraussetzung fuer jede Varianzschaetzung.');
console.log('  Es gibt kein Feld fuer Tisch, Position oder Replikat auf der Probe.');

P('F3 · Optima liegen redundant in jeder Probe');
const testdaten=JSON.parse(fs.readFileSync(__dirname+'/testdaten.json','utf8'));
const gesamt=JSON.stringify(testdaten).length;
const optBytes=testdaten.analysen.reduce((s,a)=>s+JSON.stringify(a.optima||{}).length,0);
console.log('Sicherungsdatei gesamt:',gesamt,'Bytes');
console.log('davon Optimum-Bereiche:',optBytes,'Bytes =',Math.round(optBytes/gesamt*100)+' %');
const sig=new Set(testdaten.analysen.map(a=>JSON.stringify(a.optima)));
console.log('verschiedene Optimum-Saetze:',sig.size,'bei',testdaten.analysen.length,'Analysen');

P('F4 · Einheiten werden aus dem Schluesselnamen abgeleitet');
console.log("einheit() ist eine Kette von Regex-Tests auf den Schluessel:");
console.log('   Mn       →',A.einheit('Mn'));
console.log('   sub_Mn   →',A.einheit('sub_Mn'));
console.log('   gw_Na    →',A.einheit('gw_Na'));
console.log('   Neuer_Parameter_XY →',A.einheit('Neuer_Parameter_XY'),'  ← stille Vorgabe');
console.log('\n→ Ein neuer Parameter oder ein Laborwechsel mit anderer Einheit bekommt');
console.log('  lautlos "ppm" verpasst. Die Einheit steht nirgends im Datensatz.');

P('F5 · Keine Plausibilitaetspruefung beim Erfassen');
const dp=A.leer();
dp.analysen=[Object.assign({},mk('t'),{werte:{K:{wert:104000}}})];  // Tippfehler: Faktor 100
dp.saetze={'28-478':{}};A.setDb(dp);
const ep=A.erhebungen()[0];
console.log('Kalium mit Tippfehler 104000 statt 1040 (Optimum 3975–4800):');
console.log('   Bewertung:',ep.bew.K?ep.bew.K.st:'–',' Befund:',(A.befunde(ep)[0]||{}).titel||'keiner');
console.log('\n→ Wird als gewoehnlicher Ueberschuss verbucht. Kein Hinweis, dass der Wert');
console.log('  das 25-fache der Obergrenze ist und damit physiologisch unmoeglich.');

P('F6 · Keine Provenienz je Messwert');
console.log('Felder auf einem Messwert:',JSON.stringify(Object.keys(r.proben[0].werte.K)));
console.log('\n→ Wer hat wann korrigiert, und wie lautete der urspruengliche Wert?');
console.log('  Nicht rekonstruierbar. Bei einer Datei, die zwischen zwei Personen');
console.log('  hin- und hergeht, ist das eine echte Luecke.');
