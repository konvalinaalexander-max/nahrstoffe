/* Neue Befunde, die in der Verdachtsliste nicht stehen */
const A=require('./harness.js');
const fs=require('fs');
const skript=fs.readFileSync(__dirname+'/app.js','utf8');
const r=A.parseNCC(require('./seiten.json'));
const P=t=>console.log('\n'+t+'\n'+'─'.repeat(t.length));
const O={NO3:[2010,3530],K:[3975,4800],Ca:[810,1275],Mg:[310,430],P:[360,530],S:[170,230],
         Fe:[0.8,1.6],Mn:[3,7],Zn:[1.6,2.25],B:[0.8,2.6],Cu:[0.3,0.5]};
const mk=(satz,datum,bl,w,opt)=>({id:satz+datum+bl,typ:'blattsaft',datum,satz,blattalter:bl,zustand:null,
  werte:Object.fromEntries(Object.entries(w).map(([k,v])=>[k,{wert:v}])),
  optima:JSON.parse(JSON.stringify(opt||O))});
const wv={NO3:1500,K:4200,Ca:900,Mg:350,P:400,S:200,Fe:1.0,Mn:5,Zn:1.8,B:1.2,Cu:0.4};

console.log('══════════════════════════════════════════════════════════');
console.log(' NEUE BEFUNDE');
console.log('══════════════════════════════════════════════════════════');

P('K · Ein Wechsel der Laborreferenz faellt nicht auf');
const dK=A.leer();
const O2=JSON.parse(JSON.stringify(O));O2.K=[3000,4000];   // Labor revidiert den Bereich
const wK=Object.assign({},wv,{K:4600});
dK.analysen=[mk('28-478','2026-06-01','jung',wK,O),mk('28-478','2026-08-01','jung',wK,O2)];
dK.saetze={'28-478':{}};A.setDb(dK);
const eK=A.erhebungen();
console.log('Zweimal derselbe Messwert Kalium 4600, aber:');
eK.forEach(e=>{const b=e.bew.K;
  console.log('   '+e.datum+'   Optimum '+JSON.stringify(b.werte[0].opt)+'   → '+(b.ok?'im Optimum':b.st)+
    '   Kennzahl '+Math.round(e.index.anteil*100)+' %')});
console.log('Warnung, dass sich die Referenz geaendert hat:',
  /Referenz.*ge[äa]ndert|Optimum.*abweich|unterschiedliche Optim/.test(skript)?'ja':'NEIN');
console.log('\n→ Der Verlauf im Index-Diagramm mischt zwei Referenzbereiche und zeigt eine');
console.log('  Veraenderung, die allein vom Labor kommt. Kein Hinweis darauf.');
console.log('  Labore revidieren ihre Bereiche – das ist kein Ausnahmefall.');

P('L · Verhaeltnisschwellen haben keine Toleranz, Optimumgrenzen schon');
const dL=A.leer();
for(const kmg of [7.99,8.01]){
  const d=A.leer();
  const w=Object.assign({},wv,{Mg:250,K:250*kmg});
  d.analysen=[mk('28-478','2026-08-01','jung',w),mk('28-478','2026-08-01','alt',w)];
  d.saetze={'28-478':{}};A.setDb(d);
  const f=A.befunde(A.erhebungen()[0]);
  console.log('K/Mg = '+kmg.toFixed(2)+'   Befund "verdraengt": '+(f.some(x=>x.id==='kmg:Mg')?'JA':'nein'));
}
console.log('\n→ Ein Unterschied von 0,02 im Verhaeltnis dreht den Befund. Fuer die');
console.log('  Optimumgrenzen wurde eine 5-%-Toleranz eingefuehrt, genau um solche');
console.log('  Kippschalter zu vermeiden. Fuer die Verhaeltnisschwellen nicht.');
console.log('  Dabei ist ein Verhaeltnis aus zwei fehlerbehafteten Messungen instabiler');
console.log('  als eine einzelne Messung, nicht stabiler.');

P('M · Die Bewertung der Vergangenheit aendert sich rueckwirkend');
const dM=A.leer();
dM.analysen=[mk('28-478','2026-06-01','jung',wv),mk('28-478','2026-06-01','alt',Object.assign({},wv,{K:2800}))];
dM.saetze={'28-478':{}};A.setDb(dM);
console.log('Schwelle verlagerung   Befund zu Kalium');
for(const v of [1.3,1.6]){
  const d=JSON.parse(JSON.stringify(dM));d.einst.verlagerung=v;A.setDb(d);
  const f=A.befunde(A.erhebungen()[0]);
  const kb=f.find(x=>x.param==='K');
  console.log('   '+v+'                  '+(kb?kb.titel:'keiner'));
}
console.log('\n→ Dieselbe Analyse von vor drei Monaten wird anders bewertet, sobald jemand');
console.log('  heute eine Einstellung aendert. Fuer ein Werkzeug, dessen Leitfrage lautet');
console.log('  "was haben unsere Entscheidungen bewirkt", ist das ein Problem: der Stand,');
console.log('  auf dem eine Entscheidung beruhte, ist nicht mehr rekonstruierbar.');
console.log('  Es gibt keine Festschreibung und keine Angabe, mit welchen Einstellungen');
console.log('  ein Befund entstanden ist.');

P('N · Der Nenner der Kennzahl schwankt zwischen den Erhebungen');
const dN=A.leer();
const wenig={NO3:1500,K:4200,Ca:900};       // nur drei Parameter gemessen
dN.analysen=[mk('28-478','2026-06-01','jung',wv),mk('28-478','2026-06-01','alt',wv),
             mk('28-478','2026-08-01','jung',wenig),mk('28-478','2026-08-01','alt',wenig)];
dN.saetze={'28-478':{}};A.setDb(dN);
A.erhebungen().forEach(e=>console.log('   '+e.datum+'   '+e.index.ok+' von '+e.index.n+
  '  = '+Math.round(e.index.anteil*100)+' %   ('+e.index.fehlt+' nicht bewertbar)'));
console.log('\n→ 100 % aus 3 Positionen und 100 % aus 11 Positionen erscheinen im');
console.log('  Diagramm als gleich hohe Balken und werden durch eine Linie verbunden.');
console.log('  Der Nenner steht nur im Tooltip. Anteile mit verschiedenen Nennern als');
console.log('  Zeitreihe zu zeichnen ist nicht zulaessig.');

P('O · Das abgeleitete Kulturalter wird praeziser angezeigt als es ist');
const dO=A.leer();
dO.analysen=[mk('28-478','2026-08-18','jung',wv)];dO.saetze={'28-478':{}};A.setDb(dO);
const al=A.alter(dO.analysen[0]);
console.log('Angezeigt:      Woche',A.nz(al.woche,1),' ('+al.quelle+')');
console.log('Herleitung:    ',al.text);
console.log('\nDie Kalenderwoche im Satznamen bestimmt einen MONTAG. Das tatsaechliche');
console.log('Aussaatdatum liegt irgendwo in dieser Woche.');
console.log('   Unsicherheit:  ±3,5 Tage  =  ±0,5 Wochen');
console.log('   Anzeige:       eine Nachkommastelle  =  ±0,05 Wochen');
console.log('\n→ Die Anzeige suggeriert eine zehnfach hoehere Genauigkeit als vorhanden.');
console.log('  Das Alter geht in den Reiter Nährstoffe (Achse Kulturwoche), in den');
console.log('  Planer und in jeden Vorbehaltstext ein.');

P('P · Die Jahreszeit ist nirgends als Groesse erfasst');
console.log('Felder in einer Probe:',Object.keys(r.proben[0]).join(', '));
console.log('Tageslaenge, Strahlung, Aussentemperatur im Datenmodell:',
  /tageslaenge|strahlung|globalstrahlung|lichtsumme|aussentemp/i.test(skript)?'ja':'NEIN');
console.log('Verwendung des Monats im Code:',(skript.match(/monat\(/g)||[]).length,'× – ausschliesslich fuer');
console.log('   die Vorgabe der Kulturdauer (April bis September = Sommer).');
console.log('\n→ Fuer die Leitfrage "naehern wir uns ueber die Zeit dem Optimum" ist die');
console.log('  Jahreszeit der groesste Stoerfaktor ueberhaupt – und sie ist nicht einmal');
console.log('  als Variable vorhanden. Ohne sie ist eine spaetere Korrektur unmoeglich.');

P('Q · Bei immobilen Naehrstoffen faellt ein tiefes Altblatt lautlos heraus');
const dQ=A.leer();
dQ.analysen=r.proben.map((p,i)=>Object.assign({id:'p'+i,typ:'blattsaft'},JSON.parse(JSON.stringify(p))));
dQ.saetze={'28-478':{}};A.setDb(dQ);
const bCa=A.erhebungen()[0].bew.Ca;
console.log('Calcium (immobil, beurteilt am Jungblatt):');
bCa.werte.forEach(w=>console.log('   '+w.blattalter.padEnd(6)+String(w.wert).padEnd(8)+w.st.padEnd(6)+
  (w.massgeblich?'← massgeblich':'wird nicht bewertet')));
console.log('Gesamturteil:',bCa.ok?'im Optimum':bCa.st);
console.log('\n→ Das Altblatt liegt unter dem Optimum und faellt aus dem Urteil heraus.');
console.log('  Bei einem immobilen Naehrstoff ist das Altblatt aber das Archiv der');
console.log('  Vergangenheit: Calcium wird eingelagert und nicht wieder abgezogen.');
console.log('  Ein tiefes Altblatt heisst, dass die Versorgung frueher schlechter war –');
console.log('  eine Information, die genau zur Leitfrage passt und verworfen wird.');

P('R · Substratwerte sind ueberhaupt nicht bewertbar');
const dR=A.leer();
dR.analysen=[{id:'s',typ:'substrat',datum:'2026-08-14',satz:'28-478',blattalter:null,zustand:null,
  werte:{sub_pH:{wert:5.2},sub_Nmin:{wert:22}},optima:{}}];
dR.saetze={'28-478':{}};A.setDb(dR);
console.log('optVon(Substratprobe,"sub_Nmin") =',JSON.stringify(A.optVon(dR.analysen[0],'sub_Nmin')));
console.log('status(...)                      =',A.status(22,A.optVon(dR.analysen[0],'sub_Nmin'),false));
console.log('\n→ Substratwerte haben kein Optimum und damit keinen status. Sie werden');
console.log('  ausschliesslich im Reiter "Substrat & Wasser" gegen die Richtwerte');
console.log('  eingeordnet – und dort nur die vier Paare. pH, Salz, alle Reserven und');
console.log('  alle Spurenelemente im Substrat bleiben unbewertet.');
const alle=['sub_Salz','res_P2O5','res_K2O','res_Mg','res_Ca','sub_Mn','sub_Cu','sub_Zn','sub_Fe','sub_B'];
console.log('  Unbewertet:',alle.map(k=>A.NAME[k]).join(', '));

P('S · Auch die zweite Substratprobe eines Satzes wird still verworfen');
const dS=A.leer();
dS.analysen=[
  {id:'s1',typ:'substrat',datum:'2026-08-14',satz:'28-478',tiefe:2,blattalter:null,zustand:null,werte:{sub_Nmin:{wert:80}},optima:{}},
  {id:'s2',typ:'substrat',datum:'2026-08-15',satz:'28-478',tiefe:8,blattalter:null,zustand:null,werte:{sub_Nmin:{wert:15}},optima:{}}];
dS.saetze={'28-478':{}};A.setDb(dS);
const gewaehlt=A.substratZu('28-478','2026-08-18');
console.log('Zwei Substratproben desselben Satzes, 2 cm und 8 cm Tiefe:');
console.log('   Nmin oben  (2 cm): 80 mg/l');
console.log('   Nmin unten (8 cm): 15 mg/l   ← dort sitzen die Wurzelspitzen');
console.log('   substratZu() waehlt:',gewaehlt.id,'aus',gewaehlt.tiefe,'cm Tiefe – die zeitlich naechste.');
console.log('\n→ Die Tiefe wird erfasst, aber bei der Auswahl ignoriert. Der Salzgradient');
console.log('  im Topf ist genau der Grund, warum die Tiefe erfasst wird – und dann');
console.log('  entscheidet der Zufall des Probendatums, welche Welt gezeigt wird.');
