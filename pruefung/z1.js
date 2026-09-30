/* Stand 30. September: Uhrzeiten, EM, Balken je Mittel einzeln schaltbar,
   und das vorbereitete Datenpaket «Reservoir April bis September 2026».
   Das Paket ist von Hand gelesen – diese Prüfung hält fest, was darin
   entschieden wurde, damit es niemand versehentlich wieder ändert. */
const A=require('./harness.js');
const fs=require('fs');
let fehler=0;
const ok=(b,t)=>{if(!b)fehler++;console.log((b?'  ✓ ':'  ✗ FEHLER ')+t)};
const P=A.PAKET_RES26;
const E=(datum,typ,mittel)=>P.ereignisse.filter(e=>e.datum===datum&&(!typ||e.typ===typ)&&(mittel===undefined||e.mittel===mittel));
const M=(datum,stelle)=>P.messungen.filter(m=>m.datum===datum&&(!stelle||m.stelle===stelle));

console.log('════ Uhrzeit: Grundbausteine ════');
ok(A.zeitNorm('9.05')==='09:05'&&A.zeitNorm('09:05')==='09:05'&&A.zeitNorm('17.15 Uhr')==='17:15'&&A.zeitNorm('7h45')==='07:45','Schreibweisen «9.05», «17.15 Uhr», «7h45» werden «HH:MM»');
ok(A.zeitNorm('25:00')===null&&A.zeitNorm('9.5')===null&&A.zeitNorm('')===null&&A.zeitNorm(null)===null,'Unsinn wird keine Uhrzeit – nichts geraten');
ok(A.zeitpunkt({datum:'2026-09-09',zeit:'09:05'})-A.zeitpunkt({datum:'2026-09-09'})===(9*60+5)*6e4,'Die Uhrzeit liegt auf derselben Achse wie das Datum');
ok(/^\d{4}-\d{2}-\d{2}$/.test(A.heute())&&/^\d{2}:\d{2}$/.test(A.jetztZeit()),'heute() und jetztZeit() liefern Datum und Uhrzeit des Geräts');
{
  const l=[{datum:'2026-09-09',zeit:'17:15',n:3},{datum:'2026-09-09',zeit:null,n:1},{datum:'2026-09-09',zeit:'09:00',n:2},{datum:'2026-09-08',zeit:'20:00',n:0}];
  ok(l.slice().sort(A.chrono).map(x=>x.n).join('')==='0123','Chronologisch: Datum, dann Uhrzeit, ohne Uhrzeit zuerst');
  ok(A.chronoAb(l).map(x=>x.n).join('')==='3210','Absteigend: neueste zuerst');
}
{
  const ms=[{datum:'2026-07-21',stelle:'vorne',ph:8},{datum:'2026-07-21',stelle:'vorne',ph:6.5},{datum:'2026-07-21',stelle:'hinten',ph:7.9},
    {datum:'2026-09-09',zeit:'10:20',stelle:'vorne',ph:7.5}];
  const L=A.messLage(ms);
  const tag=+new Date('2026-07-21');
  ok(L.x.get(ms[0])===tag+6*36e5&&L.x.get(ms[1])===tag+20*36e5,'Zwei Messungen ohne Uhrzeit am selben Tag: 6 und 20 Uhr – in ihrer Reihenfolge');
  ok(L.x.get(ms[2])===tag,'Eine allein am Tag bleibt auf dem Tag');
  ok(L.x.get(ms[3])===+new Date('2026-09-09')+(10*60+20)*6e4,'Mit Uhrzeit steht der Punkt genau');
  ok(L.folge.get(ms[1]).i===2&&L.folge.get(ms[1]).n===2&&!L.folge.get(ms[3]),'Das Kästchen weiss «2. von 2 Messungen»');
}
{
  const m=A.zeitMarken(+new Date('2026-09-09')+5*36e5,+new Date('2026-09-09')+19*36e5);
  ok(m.length>=4&&m.every(x=>/^\d{2}:00$/.test(x.text)),'Ein Tag im Ausschnitt: die Achse zeigt Stunden ('+m.map(x=>x.text).join(' ')+')');
  const w=A.zeitMarken(+new Date('2026-09-01'),+new Date('2026-09-09'));
  ok(w.length>=7&&/^\d{2}\.\d{2}\.$/.test(w[0].text),'Eine Woche: Tage');
}

console.log('\n════ Uhrzeit: Schema 11 ════');
{
  const r=A.migriere({schema:10,analysen:[],ereignisse:[{id:'e1',datum:'2026-09-01',typ:'Notiz',felder:{}}],
    messungen:[{id:'m1',datum:'2026-09-01',ph:6.2}],rundgaenge:[],fotos:[],saetze:{},eigeneOptima:{},einst:{}});
  ok(r.db.schema===11,'Schema auf 11 gehoben');
  ok(r.db.messungen[0].zeit===null&&r.db.ereignisse[0].zeit===null,'Bisherige Einträge bekommen «keine Uhrzeit» – nicht geraten');
  ok(r.notizen.some(n=>/Uhrzeit/.test(n)),'Die Umstellung wird gesagt');
  ok(A.leer().schema===11&&typeof A.leer().pakete==='object','Ein neuer Bestand ist Schema 11 und kennt Pakete');
}

console.log('\n════ Uhrzeit: Tabellenimport ════');
{
  ok(A.tabZeit(0.375)==='09:00'&&A.tabZeit(46274.5)==='12:00'&&A.tabZeit(46274)===null,'Excel-Bruchteile werden Uhrzeiten, ganze Tage nicht');
  ok(A.tabZeit('17.09.2026 09:05')==='09:05'&&A.tabDatum('17.09.2026 09:05',null)==='2026-09-17','«17.09.2026 09:05»: Datum und Uhrzeit aus einer Zelle');
  ok(A.tabDatum('2026-09-17T09:05',null)==='2026-09-17'&&A.tabZeit('2026-09-17T09:05')==='09:05','ISO mit Uhrzeit');
  A.setDb(A.leer());
  const t=A.tabBlatt(A.csvZeilen(fs.readFileSync(__dirname+'/fixtures/praxis-2026.tsv','utf8')));
  const neun=t.mess.filter(m=>m.datum==='2026-09-09');
  ok(neun.length===12&&neun.every(m=>/^\d{2}:\d{2}$/.test(m.zeit||'')),'Spalte «Zeit»: alle 12 Messungen vom 9.9. tragen ihre Uhrzeit');
  ok(neun.find(m=>m.stelle==='hinten'&&m.ph===6.42).zeit==='10:20','… die richtige (pH 6,42 hinten um 10:20)');
  const zs=t.vorschlaege.filter(v=>v.datum==='2026-09-09'&&v.mittel==='zitronensaeure');
  ok(zs.map(v=>v.zeit+' '+v.stelle).join(', ')==='09:05 hinten, 10:25 vorne, 16:05 hinten','Die Gaben am 9.9. mit Uhrzeit und Stelle');
  ok(t.mess.filter(m=>m.datum==='2026-08-31').every(m=>m.zeit===null),'Ohne Uhrzeit bleibt sie leer');
  /* Übernehmen schreibt Uhrzeit UND Sauerstoff in den Bestand – bis zum
     30.09. fiel der Sauerstoff dabei weg. */
  A.setTabPruef(t);A.AKTION.tabUeber();
  const db=A.getDb();
  const o2=db.messungen.filter(m=>m.o2!=null);
  ok(o2.length===1&&o2[0].o2===0.2&&o2[0].zeit==='09:00','Übernommen: O₂ 0,2 um 09:00 steht im Bestand');
  ok(db.messungen.filter(m=>m.zeit).length===14&&db.ereignisse.filter(e=>e.zeit).length===4,'Übernommen: 14 Messungen und 4 Logbucheinträge mit Uhrzeit (drei Gaben, die Neufüllung)');
}

console.log('\n════ Das Paket: Umfang und Form ════');
ok(P.id==='reservoir-2026'&&P.messungen.length===111&&P.ereignisse.length===70,`111 Messungen und 70 Logbucheinträge (${P.messungen.length} / ${P.ereignisse.length})`);
{
  const alle=P.messungen.concat(P.ereignisse),ids=alle.map(x=>x.id);
  ok(new Set(ids).size===ids.length&&ids.every(i=>/^p26[me]-/.test(i)),'Jede Kennung einmal, alle mit Präfix – zweimal aktivieren trägt nichts doppelt ein');
  ok(alle.every(x=>/^2026-\d{2}-\d{2}$/.test(x.datum)&&!isNaN(+new Date(x.datum))),'Jedes Datum ist ein Datum');
  ok(alle.every(x=>x.zeit===null||A.zeitNorm(x.zeit)===x.zeit),'Jede Uhrzeit ist «HH:MM» oder leer');
  ok(alle.every(x=>x.quelle==='paket'&&x.paket==='reservoir-2026'&&/Tabelle|Bericht/.test(x.beleg||'')),'Jeder Eintrag nennt seinen Beleg');
  ok(!JSON.stringify(P).includes('Versuch'),'Nirgends «Versuch» – es sind die Daten');
  ok(P.ereignisse.every(e=>A.EVTYPEN[e.typ]),'Nur bekannte Arten');
  ok(P.ereignisse.every(e=>!e.mittel||A.PRODUKTE_VORGABE[e.mittel]),'Nur bekannte Mittel');
  ok(P.ereignisse.every(e=>(e.menge==null)===(e.einheit==null)),'Menge und Einheit stehen immer zusammen');
  ok(P.ereignisse.every(e=>['beide','vorne','hinten'].includes(e.stelle)),'Stelle ist vorne, hinten oder beide');
  ok(P.messungen.every(m=>['vorne','hinten','wurzelraum'].includes(m.stelle)),'Messstellen: vorne, hinten, Wurzelraum');
  ok(P.messungen.every(m=>m.ph==null||(m.ph>=5&&m.ph<=8.5)),'Kein pH ausserhalb 5–8,5 – der Tippfehler ist draussen');
  ok(P.messungen.filter(m=>m.o2!=null).every(m=>m.stelle==='vorne'),'Sauerstoff nur vorne');
  ok(P.messungen.filter(m=>m.o2!=null).length===7,'Sieben Sauerstoffwerte: fünf aus der Tabelle, zweimal 0,2 aus dem Bericht');
  const tage=[...new Set(P.messungen.map(m=>m.datum))].sort();
  ok(tage[0]==='2026-04-30'&&tage[tage.length-1]==='2026-09-17','Von 30.04. bis 17.09.');
}

console.log('\n════ Das Paket: was am 30.09. entschieden wurde ════');
{
  const a=E('2026-08-18');
  ok(a.length===1&&a[0].typ==='Desinfektion'&&a[0].mittel==='halades'&&a[0].menge===1.4&&a[0].einheit==='l'&&a[0].stelle==='vorne','«RV: + 1.4l A» → Halades 1,4 l vorne');
  const em=E('2026-09-17','Biologisches Präparat','em');
  ok(em.length===2&&em.find(e=>e.stelle==='vorne').menge===5&&em.find(e=>e.stelle==='hinten').menge===10,'«MKBoden» → EM, vorne 5 l, hinten 10 l');
  ok(E('2026-07-30','Wasserzugabe').length===1&&E('2026-07-30',null,'epsotop').length===1,'Die Zeile ohne Datum ist weggelassen – der 30.07. zählt einmal');
  const v14=M('2026-08-14','vorne');
  ok(v14.length===1&&v14[0].ph===null&&v14[0].ec===0.95,'pH 1,36 am 14.08. weggelassen, der EC bleibt');
  ok(!P.messungen.some(m=>m.ph===1.36),'1,36 steht nirgends');
  ok(E('2026-08-26',null,'kali').length===1&&!P.ereignisse.some(e=>/10'000l|Kein Halades/.test(e.notiz||'')),'Die Betriebsregel «1 kg Kalisulfat pro 10\'000 l» ist keine Gabe');
  ok(E('2026-08-26',null,'kali')[0].menge===1.7&&E('2026-08-26',null,'kali')[0].einheit==='kg'&&E('2026-08-26',null,'zink')[0].menge===6&&E('2026-08-26',null,'zink')[0].einheit==='g','Kalisulfat 1,7 kg und Zink 6 g am 26.08.');
  ok(E('2026-05-06','Säurezugabe','phosphorsaeure').length===2&&/angenommen/.test(E('2026-05-06','Säurezugabe')[0].notiz),'Säure ohne Namen am 06.05. → Phosphorsäure, als Annahme benannt');
  ok(E('2026-08-07','Säurezugabe','phosphorsaeure')[0].stelle==='vorne','1,7 l Phosphorsäure am 07.08. → vorne');
  const bio=P.ereignisse.filter(e=>e.mittel==='biovin'&&e.menge==null);
  ok(bio.length===7&&bio.every(e=>/nicht notiert/.test(e.notiz)),'BioV-Wasser: sieben Biovin-Gaben ohne Menge – nicht geschätzt');
  const zs=P.ereignisse.filter(e=>e.mittel==='zitronensaeure');
  ok(zs.length===7&&zs.reduce((s,e)=>s+e.menge,0)===6,'Zitronensäure: sieben Gaben, 6 kg');
  ok(E('2026-09-09',null,'zitronensaeure').map(e=>e.zeit+' '+e.stelle).join(', ')==='09:05 hinten, 10:25 vorne, 16:05 hinten','Am 9.9. mit Uhrzeit und Stelle');
  ok(M('2026-08-31').length===6&&M('2026-08-31','vorne')[0].ec===1,'31.08.: die gemeinsame Zeile einmal (mit EC aus der Tabelle), dazu zwei aus dem Bericht');
  const n9=M('2026-09-09');
  ok(n9.length===12&&n9.every(m=>m.zeit),'9.9.: zwölf Messungen, alle mit Uhrzeit');
  ok(n9.filter(m=>m.o2===0.2).map(m=>m.zeit).join(',')==='09:00,17:15','O₂ 0,2 mg/l um 09:00 und 17:15 vorne');
  ok(E('2026-09-10','Tank neu angesetzt').length===1&&E('2026-09-10','Notiz').length===1,'10.09.: Tanks neu gefüllt, dazu die Notiz zum Geruch');
  ok(P.ereignisse.filter(e=>e.mittel==='schwefelsaeure25').length===8&&E('2026-09-16',null,'schwefelsaeure25').length===2,'Schwefelsäure: 1 l je Reservoir, am 16.09. einmal, am 17.09. dreimal');
  ok(M('2026-09-17').filter(m=>m.o2!=null).map(m=>m.o2).join(',')==='6,6.2,5.9,5.1','O₂ am 17.09. aus der Tabelle');
  ok(P.messungen.filter(m=>m.stelle==='wurzelraum').length===3,'EC im Wurzelraum: drei Sätze am 08.06.');
  ok(E('2026-08-06','Gerätekalibrierung').length===1,'Neukalibrierung am 06.08. steht im Logbuch');
  ok(E('2026-06-02','Umpumpen')[0].felder.von==='hinten'&&E('2026-08-07','Umpumpen')[0].felder.nach==='hinten','Umpumpen am 02.06. (hinten → vorne) und 07.08. (vorne → hinten)');
  ok(P.entscheide.length>=10,'Die Entscheide stehen im Paket selbst – der Dialog zeigt sie');
}

console.log('\n════ Aktivieren ════');
{
  A.setDb(A.leer());A.setTab('lage');
  ok(/Bereit zum Aktivieren/.test(A.paketHinweis()),'Vor dem Aktivieren: Hinweis im Überblick');
  A.setTab('analysen');ok(A.paketHinweis()==='','… aber nicht in jedem Reiter');
  ok(/nicht aktiv/.test(A.paketKarte()),'Einstellungen: «nicht aktiv»');
  A.AKTION.paketAn({id:'reservoir-2026'});
  const db=A.getDb();
  ok(db.messungen.length===111&&db.ereignisse.length===70,'Aktivieren trägt alles ein');
  ok(A.getTab()==='giess','… und öffnet den Reiter Giesswasser');
  ok(db.pakete['reservoir-2026'].aktiviert,'Der Bestand weiss, dass das Paket aktiv ist');
  A.AKTION.paketAn({id:'reservoir-2026'});
  ok(A.getDb().messungen.length===111&&A.getDb().ereignisse.length===70,'Zweimal aktivieren: nichts doppelt');
  A.setTab('lage');ok(A.paketHinweis()==='','Danach kein Hinweis mehr');
  ok(/>aktiv</.test(A.paketKarte()),'Einstellungen: «aktiv»');
  db.messungen[0].ph=9.99;
  db.messungen.splice(5,1);
  ok(/teilweise aktiv/.test(A.paketKarte()),'Einen Eintrag entfernt: «teilweise aktiv»');
  A.AKTION.paketAn({id:'reservoir-2026'});
  ok(A.getDb().messungen.length===111&&A.getDb().messungen[0].ph===9.99,'«Fehlende ergänzen» holt nur den fehlenden zurück – Bearbeitetes bleibt');
  let render=true;try{A.setTab('giess');A.vGiess();A.vLogbuch();A.vSaetze();A.nachRenderRun()}catch(e){render=false;console.log('   ',e.stack)}
  ok(render,'Giesswasser, Logbuch und Einstellungen bauen sich mit dem Paket fehlerfrei auf');
  A.AKTION.paketWeg({id:'reservoir-2026'});
  ok(A.getDb().messungen.length===0&&A.getDb().ereignisse.length===0,'«Wieder entfernen» nimmt alles heraus');
  ok(A.getDb().pakete['reservoir-2026'].abgelehnt,'… und merkt sich das: kein Hinweis mehr');
}
{
  /* Ein früherer Tabellenimport im selben Zeitraum wird ersetzt, von Hand
     Erfasstes bleibt. */
  const d=A.leer();
  d.messungen.push({id:'x1',datum:'2026-05-06',stelle:'vorne',ph:6.53,ec:0.94,quelle:'excel'},
    {id:'x2',datum:'2026-10-02',stelle:'vorne',ph:6.9,quelle:'excel'},
    {id:'h1',datum:'2026-05-06',stelle:'vorne',ph:6.5,quelle:'hand'});
  d.ereignisse.push({id:'xe',datum:'2026-08-18',typ:'Notiz',felder:{text:'RV: + 1.4l A'},quelle:'excel'});
  A.setDb(d);
  const alt=A.paketAltImport(A.PAKET_RES26);
  ok(alt.mess.length===1&&alt.ev.length===1,'Erkannt: ein Excel-Import im Zeitraum (Messung und Notiz), nicht der ausserhalb, nicht der von Hand');
  document.getElementById('paketErsetzen').checked=true;
  A.AKTION.paketAn({id:'reservoir-2026'});
  document.getElementById('paketErsetzen').checked=false;
  const db=A.getDb(),ids=new Set(db.messungen.map(m=>m.id).concat(db.ereignisse.map(e=>e.id)));
  ok(!ids.has('x1')&&!ids.has('xe')&&ids.has('x2')&&ids.has('h1'),'Ersetzt wird nur der alte Import im Zeitraum');
  ok(db.messungen.length===111+2,'111 aus dem Paket, dazu die zwei unberührten');
}

console.log('\n════ Balken je Mittel ════');
{
  A.setDb(A.leer());A.AKTION.paketAn({id:'reservoir-2026'});A.setModus('mittel');A.setMittelAus(new Set());
  const texte=A.beigabeBalkenMittel().map(b=>b.text);
  console.log('   '+texte.join(' | '));
  const hat=re=>texte.some(t=>re.test(t));
  ok(hat(/^Biovin 06\.05\.–26\.05\.$/)&&hat(/^Biovin 28\.07\.–26\.08\.$/),'Biovin: Mai, dann wieder Ende Juli bis August');
  ok(hat(/^Magnesium 06\.05\.–26\.05\.$/)&&hat(/^Magnesium 28\.07\.–26\.08\.$/),'Magnesium ebenso');
  ok(hat(/^Kalisulfat 26\.08\.$/)&&hat(/^Zink 26\.08\.$/),'Kalisulfat und Zink am 26.08.');
  ok(hat(/^Phosphorsäure 21\.07\.–25\.08\.$/),'Phosphorsäure bis 25.08. und dann nicht mehr');
  ok(hat(/^Halades PE 06\.08\.–19\.08\.$/),'Halades vom 06.08. bis 19.08. – mit der Gabe «A» vom 18.08.');
  ok(hat(/^Zitronensäure 31\.08\.–09\.09\.$/),'Zitronensäure 31.08.–09.09. – endet mit dem Neuansatz der Tanks, läuft nicht weiter');
  ok(hat(/^EM /)&&hat(/^Schwefelsäure 25 % /),'EM und Schwefelsäure haben ihren Balken');
  const tipp=A.beigabeBalkenMittel().find(b=>/^Magnesium 28/.test(b.text)).tipp;
  ok(/22\.5 kg|22,5 kg/.test(tipp),'Menge gesamt Magnesium 28.07.–26.08.: 22,5 kg');
  ok(/7\.1 l|7,1 l/.test(A.beigabeBalkenMittel().find(b=>/^Phosphorsäure 21/.test(b.text)).tipp),'Phosphorsäure: 4,2 l in ml und 2,9 l zusammengezählt – 7,1 l');
  ok(/ohne notierte Menge/.test(A.beigabeBalkenMittel().find(b=>/^Biovin 28/.test(b.text)).tipp),'Biovin im August: Gaben ohne Menge werden genannt, nicht geschätzt');
  A.setMittelAus(new Set(['em','halades']));
  const ohne=A.beigabeBalkenMittel().map(b=>b.text);
  ok(!ohne.some(t=>/^EM|^Halades/.test(t))&&ohne.some(t=>/^Biovin/.test(t)),'EM und Halades ausgeblendet – die übrigen bleiben');
  const sch=A.beigabenSchalter();
  ok(/data-tun="mittelBand" data-id="em"/.test(sch)&&/data-tun="mittelBandAlle"/.test(sch),'Der Schalter hat je Mittel einen Knopf und «alle zeigen»');
  A.AKTION.mittelBand({id:'em'});
  ok(!A.getMittelAus().has('em'),'Ein Klick blendet EM wieder ein');
  A.AKTION.mittelBandAlle();
  ok(A.getMittelAus().size===0,'«alle zeigen» blendet alles ein');
  const L=A.beigabeMittelListe();
  ok(L.find(x=>x.id==='em').farbe===A.MITTEL_FARBE.em&&L.find(x=>x.id==='em').name==='EM','EM hat Name und feste Farbe');
}
{
  /* Die Wahl ist persönlich und übersteht das Neuladen. */
  const speicher={};global.localStorage={getItem:k=>speicher[k]??null,setItem:(k,v)=>{speicher[k]=String(v)}};
  A.setMittelAus(new Set(['halades']));A.ansichtMerken();
  A.setMittelAus(new Set());A.ansichtLaden();
  ok(A.getMittelAus().has('halades'),'Ausgeblendete Mittel werden im Browser gemerkt');
  delete global.localStorage;
}

console.log('\n════ Ergebnis ════');
console.log(fehler?`  ${fehler} FEHLER`:'  ✓ Alle Prüfungen bestanden.');
process.exit(fehler?1:0);
