/* Verdachtsliste G · H · I · J */
const A=require('./harness.js');
const fs=require('fs');
const P=t=>console.log('\n'+t+'\n'+'─'.repeat(t.length));
const skript=fs.readFileSync(__dirname+'/app.js','utf8');
const td=JSON.parse(fs.readFileSync(__dirname+'/testdaten.json','utf8'));

console.log('══════════════════════════════════════════════════════════');
console.log(' G · Der Reiter Wirkung');
console.log('══════════════════════════════════════════════════════════');

P('G1 · Was zeigt er, und was fehlt');
A.setDb(A.migriere(JSON.parse(JSON.stringify(td))).db);
const h=A.vWirkung();
const bewegung=(h.match(/(\d+) Nährstoffe Richtung Optimum, (\d+) davon weg/)||[]);
console.log('Angezeigt:',bewegung[0]||'–');
console.log('Vorbehalte in Prosa:',(h.match(/Konkret: [^<]*/)||['–'])[0].slice(0,150));
console.log('\nGesucht: eine Zahl, ab der eine Aenderung ueberhaupt erkennbar waere.');
console.log('Im Quelltext:',/erkennbar|Nachweisgrenze der Aenderung|kleinste|detectable/.test(skript)?'gefunden':'NICHT VORHANDEN');

P('G2 · Was es fuer eine solche Zahl braeuchte');
console.log('Kleinste erkennbare Differenz  =  z · sqrt(2) · s     (gepaart: z · s · sqrt(2/n))');
console.log('  s  = Standardabweichung einer Einzelbestimmung');
console.log('  n  = Anzahl Replikate je Erhebung');
console.log('\nVerfuegbar im Datenbestand:');
const proErhebung=new Map();
td.analysen.filter(a=>a.typ==='blattsaft').forEach(a=>{
  const k=a.satz+'|'+a.datum+'|'+(a.blattalter||'');
  proErhebung.set(k,(proErhebung.get(k)||0)+1)});
const mehr=[...proErhebung.values()].filter(v=>v>1).length;
console.log('  Proben je Satz/Datum/Blattalter:',[...new Set(proErhebung.values())].join(', '));
console.log('  davon mit mehr als einer Wiederholung:',mehr);
console.log('\n→ s ist nicht schaetzbar. Ohne Replikate gibt es keine Zahl, gegen die man');
console.log('  eine Veraenderung messen koennte. Die App muesste genau das sagen:');
console.log('  "Mit einer Probe je Erhebung ist keine Aenderung von Rauschen zu trennen.');
console.log('   Ab X Replikaten waere eine Aenderung von Y % erkennbar."');

console.log('\n══════════════════════════════════════════════════════════');
console.log(' H · Confounding');
console.log('══════════════════════════════════════════════════════════');

P('H1 · Rang der Designmatrix an den echten Verhaeltnissen');
/* Gauss-Elimination, um zu zeigen welche Effekte ueberhaupt trennbar sind */
function rang(M){
  const m=M.map(r=>r.slice()),R=m.length,C=m[0].length;let rg=0;
  for(let c=0;c<C&&rg<R;c++){
    let piv=-1,best=1e-9;
    for(let i=rg;i<R;i++)if(Math.abs(m[i][c])>best){best=Math.abs(m[i][c]);piv=i}
    if(piv<0)continue;
    const t=m[rg];m[rg]=m[piv];m[piv]=t;
    for(let i=0;i<R;i++){if(i===rg)continue;const f=m[i][c]/m[rg][c];
      for(let k2=c;k2<C;k2++)m[i][k2]-=f*m[rg][k2]}
    rg++;
  }
  return rg;
}
/* Reale Lage: 1 Satz, 2 Erhebungen, 2 Ereignisse dazwischen */
const erh=A.erhebungen();
console.log('Erhebungen im Testbestand:',erh.map(e=>e.satz+' '+e.datum).join(' · '));
const evs=A.getDb().ereignisse;
console.log('Ereignisse:',evs.map(e=>e.titel+' ('+e.datum+')').join(' · '));
const Z=erh.map(e=>{
  const alter=e.alter.woche==null?0:e.alter.woche;
  const monatN=+e.datum.slice(5,7);
  return [1,alter,monatN].concat(evs.map(ev=>e.datum>=ev.datum?1:0));
});
const spalten=['Achsenabschnitt','Kulturalter','Monat'].concat(evs.map(e=>'Ereignis "'+e.titel+'"'));
console.log('\nDesignmatrix ('+Z.length+' Erhebungen × '+Z[0].length+' Effekte):');
console.log('   '+spalten.map(s=>s.slice(0,16).padEnd(17)).join(''));
Z.forEach((z,i)=>console.log('   '+z.map(v=>String(Math.round(v*10)/10).padEnd(17)).join('')+'  ← '+erh[i].satz+' '+erh[i].datum));
console.log('\nRang:',rang(Z),'von',Z[0].length,'Spalten · Beobachtungen:',Z.length);
console.log('→ Schaetzbar sind hoechstens',rang(Z),'Parameter. Alles darueber ist');
console.log('  nicht identifizierbar: Kulturalter, Jahreszeit und jedes Ereignis');
console.log('  bewegen sich in diesem Bestand exakt parallel.');
console.log('  Selbst ein Modell mit nur Achsenabschnitt und einem Effekt waere');
console.log('  ueberparametrisiert.');

P('H2 · Wird das in der App gezeigt?');
console.log('Designmatrix, Aliasstruktur oder Identifizierbarkeit im Quelltext:',
  /[Dd]esignmatrix|[Aa]lias|identifizierbar|konfundiert|[Kk]ollinear/.test(skript)?'gefunden':'NICHT VORHANDEN');
console.log('Vorbehalte in Prosa:',(skript.match(/Indiz, kein Beweis/g)||[]).length,'× "Indiz, kein Beweis"');
console.log('\n→ Die App warnt, benennt aber nicht, WELCHE Vergleiche moeglich waeren.');

console.log('\n══════════════════════════════════════════════════════════');
console.log(' I · Substratanbindung');
console.log('══════════════════════════════════════════════════════════');
P('I1 · Herkunft der Richtwerte');
console.log('RICHT_VORGABE:',JSON.stringify(A.RICHT_VORGABE));
console.log('Quellenangabe im Quelltext:',/Quelle|nach \w+ \(\d{4}\)|Literatur/.test(skript.split('RICHT_VORGABE')[0].slice(-600))?'vorhanden':'KEINE');
console.log('Als Annahme gekennzeichnet:',/tag schaetz">Annahme/.test(skript)?'ja':'nein');
console.log('\n→ Als Annahme gekennzeichnet – gut. Aber ohne Herkunft: niemand kann');
console.log('  pruefen, worauf die Zahlen beruhen. Sie entscheiden ueber die');
console.log('  Einordnung "Angebotsproblem" gegen "Aufnahmeproblem" – also ueber die');
console.log('  Handlungsempfehlung.');
P('I2 · Das Zeitfenster');
console.log('substratZu(satz,datum,fenster) – Vorgabe:',(skript.match(/const f=fenster\|\|(\d+)/)||[])[1],'Tage');
console.log('→ Ad-hoc gesetzt. Es gibt keine Begruendung im Code und keine im Text.');

console.log('\n══════════════════════════════════════════════════════════');
console.log(' J · Kleinere Unsauberkeiten');
console.log('══════════════════════════════════════════════════════════');

P('J1 · wiederkehrend() ohne Nenner');
const wk=A.wiederkehrend();
console.log('Ausgabe:',wk.length?wk.map(x=>x.n+'× '+x.titel).slice(0,3).join(' | '):'keine');
console.log('Anzahl Erhebungen gesamt:',A.erhebungen().length);
console.log('Nenner in der Anzeige:',/von \$\{erh\.length\}|von.*Erhebungen/.test(skript.split('Was immer wieder auftritt')[1]||'')?'ja':'NEIN');
console.log('→ "2×" ohne "von wie vielen". Bei zwei Erhebungen heisst 2× "immer",');
console.log('  bei zwanzig heisst es "selten". Die Zahl allein ist nicht lesbar.');
console.log('  Zusaetzlich werden Erhebungen verschiedener Saetze addiert.');

P('J2 · Linie zwischen Punkten verschiedener Saetze');
const box={clientWidth:900,innerHTML:''};
const d3=A.leer();
const O={K:[3975,4800]};
const mk=(satz,datum)=>({id:satz+datum,typ:'blattsaft',datum,satz,blattalter:'jung',zustand:null,
  werte:{K:{wert:4000}},optima:JSON.parse(JSON.stringify(O))});
d3.analysen=[mk('19-434','2026-05-12'),mk('23-501','2026-06-20'),mk('28-478','2026-07-30')];
d3.saetze={'19-434':{},'23-501':{},'28-478':{}};d3.einst.kern=['K'];A.setDb(d3);
A.chartIndex(box,A.erhebungen());
console.log('Drei Erhebungen aus drei VERSCHIEDENEN Saetzen.');
console.log('Polyline im Diagramm:',/polyline/.test(box.innerHTML)?'JA – sie werden verbunden':'nein');
console.log('→ Eine durchgezogene Linie suggeriert eine Entwicklung. Es sind drei');
console.log('  verschiedene Pflanzenbestaende zu drei Zeitpunkten.');

P('J3 · bilanz() mittelt ueber Saetze und Alter');
A.setDb(d3);
const b=A.bilanz();
console.log('bilanz() fuer Kalium:',JSON.stringify({n:b[0].n,ok:b[0].ok,mittel:+b[0].mittel.toFixed(2)}));
console.log('→ n=3 mischt drei Saetze verschiedenen Alters, als waeren sie austauschbar.');
console.log('  Im Ueberblick steht darueber "vom Kulturalter unabhaengig" – das gilt fuer');
console.log('  den Anteil im Optimum, nicht fuer den gemittelten Lagewert daneben.');

P('J4 · Keine Ausreissererkennung');
console.log('Suche nach Ausreisser-Logik im Quelltext:',
  /[Aa]usreisser|[Mm]edian|IQR|[Zz]-Score|robust/.test(skript)?'gefunden':'NICHT VORHANDEN');
