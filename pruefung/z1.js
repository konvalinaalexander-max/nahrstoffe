/* Uhrzeiten, die Balken des Kulturmanagements und das vorbereitete
   Datenpaket «Reservoir April bis September 2026».
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
ok(/^\d{4}-\d{2}-\d{2}$/.test(A.heute()),'heute() liefert das Datum des Geräts');
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
  ok(r.db.schema===12,'Schema auf 12 gehoben');
  ok(r.db.messungen[0].zeit===null&&r.db.ereignisse[0].zeit===null,'Bisherige Einträge bekommen «keine Uhrzeit» – nicht geraten');
  ok(A.leer().schema===12&&typeof A.leer().pakete==='object','Ein neuer Bestand ist Schema 12 und kennt Pakete');
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
  ok(db.messungen.filter(m=>m.zeit).length===14&&db.ereignisse.filter(e=>e.zeit).length===4,'Übernommen: 14 Messungen und 4 Einträge mit Uhrzeit (drei Gaben, die Neufüllung)');
  ok(A.getTab()==='tank','Danach steht der Reiter pH & EC am Tank offen');
}

console.log('\n════ Das Paket: Umfang und Form ════');
ok(P.id==='reservoir-2026'&&P.messungen.length===149&&P.ereignisse.length===76&&P.version===2,`149 Messungen und 76 Gaben und Ereignisse, Fassung 2 (${P.messungen.length} / ${P.ereignisse.length})`);
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
  ok(P.messungen.filter(m=>m.o2!=null).length===22,'22 Sauerstoffwerte: fünf aus der ersten Tabelle, zweimal 0,2 aus dem Bericht, 15 «DO vorne» vom 18.–30.09.');
  const tage=[...new Set(P.messungen.map(m=>m.datum))].sort();
  ok(tage[0]==='2026-04-30'&&tage[tage.length-1]==='2026-09-30','Von 30.04. bis 30.09.');
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
  /* Seit dem 5. Oktober: Phosphorsäure gibt es nicht – kein Eintrag, kein Wort. */
  ok(!P.ereignisse.some(e=>e.mittel==='phosphorsaeure')&&!/phosphor|p-säure|\bPS\b/i.test(JSON.stringify(P)),'Im Paket steht keine Phosphorsäure – weder als Eintrag noch im Text');
  ok(!E('2026-05-06','Säurezugabe').length&&!E('2026-07-21','Säurezugabe').length&&!E('2026-08-25','Säurezugabe').length,'Die Säuregaben vom 06.05., 21.07. und 25.08. gibt es nicht mehr');
  ok(E('2026-05-06',null,'epsotop')[0].id==='p26e-05-06-3'&&E('2026-08-07','Umpumpen')[0].id==='p26e-08-07-2'&&E('2026-05-06',null,'biovin')[1].id==='p26e-05-06-6',
     'Die übrigen Einträge behalten ihre Kennung – ein aktivierter Bestand bleibt «aktiv»');
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
  ok(E('2026-09-16',null,'schwefelsaeure25').length===2&&E('2026-09-17',null,'schwefelsaeure25').length===6,'Schwefelsäure: 1 l je Reservoir, am 16.09. einmal, am 17.09. dreimal');
  const s25=P.ereignisse.filter(e=>e.mittel==='schwefelsaeure25');
  ok(s25.length===19&&Math.abs(s25.reduce((a,e)=>a+e.menge,0)-15.5)<1e-9,'Schwefelsäure insgesamt: 19 Gaben, 15,5 l');
  ok(M('2026-09-17').filter(m=>m.o2!=null).map(m=>m.o2).join(',')==='6,6.2,5.9,5.1','O₂ am 17.09. aus der Tabelle');
  ok(P.messungen.filter(m=>m.stelle==='wurzelraum').length===3,'EC im Wurzelraum: drei Sätze am 08.06.');
  ok(E('2026-08-06','Gerätekalibrierung').length===1,'Neukalibrierung am 06.08. ist eingetragen');
  ok(E('2026-06-02','Umpumpen')[0].felder.von==='hinten'&&E('2026-08-07','Umpumpen')[0].felder.nach==='hinten','Umpumpen am 02.06. (hinten → vorne) und 07.08. (vorne → hinten)');
  ok(P.entscheide.length>=10,'Die Entscheide stehen im Paket selbst – der Dialog zeigt sie');
  ok(!P.entscheide.join(' ').includes('Logbuch'),'Ohne Verweis auf ein Logbuch, das es nicht mehr gibt');
}

console.log('\n════ Aktivieren ════');
{
  A.setDb(A.leer());A.setTab('kombi');
  ok(/Bereit zum Aktivieren/.test(A.paketHinweis()),'Vor dem Aktivieren: Hinweis über den Diagrammen');
  A.setTab('tank');ok(/Bereit zum Aktivieren/.test(A.paketHinweis()),'… auch im Reiter pH & EC');
  A.setTab('analysen');ok(A.paketHinweis()==='','… aber nicht bei den Analysen');
  ok(/nicht aktiv/.test(A.paketKarte()),'Einstellungen: «nicht aktiv»');
  A.AKTION.paketAn({id:'reservoir-2026'});
  const db=A.getDb();
  ok(db.messungen.length===149&&db.ereignisse.length===76&&db.beigabeZeiten.length===3,'Aktivieren trägt alles ein, dazu drei laufende Beigaben');
  ok(A.getTab()==='tank','… und öffnet den Reiter pH & EC am Tank');
  ok(db.pakete['reservoir-2026'].aktiviert,'Der Bestand weiss, dass das Paket aktiv ist');
  A.AKTION.paketAn({id:'reservoir-2026'});
  ok(A.getDb().messungen.length===149&&A.getDb().ereignisse.length===76,'Zweimal aktivieren: nichts doppelt');
  A.setTab('kombi');ok(A.paketHinweis()==='','Danach kein Hinweis mehr');
  ok(/>aktiv</.test(A.paketKarte()),'Einstellungen: «aktiv»');
  db.messungen[0].ph=9.99;
  db.messungen.splice(5,1);
  ok(/teilweise aktiv/.test(A.paketKarte()),'Einen Eintrag entfernt: «teilweise aktiv»');
  A.AKTION.paketAn({id:'reservoir-2026'});
  ok(A.getDb().messungen.length===149&&A.getDb().messungen[0].ph===9.99,'«Fehlende ergänzen» holt nur den fehlenden zurück – Bearbeitetes bleibt');
  let render=true;try{for(const v of ['vKombi','vTank','vMaske','vEinst']){const x=A[v]();A.nachRenderRun();if(/undefined|NaN/.test(x))throw new Error(v)}}catch(e){render=false;console.log('   ',e.stack)}
  ok(render,'Die Reiter bauen sich mit dem Paket fehlerfrei auf');
  A.AKTION.paketWeg({id:'reservoir-2026'});
  ok(A.getDb().messungen.length===0&&A.getDb().ereignisse.length===0&&A.getDb().beigabeZeiten.length===0,'«Wieder entfernen» nimmt alles heraus, auch die laufenden Beigaben');
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
  ok(db.messungen.length===149+2,'149 aus dem Paket, dazu die zwei unberührten');
}

console.log('\n════ Balken je Mittel ════');
{
  A.setDb(A.leer());A.AKTION.paketAn({id:'reservoir-2026'});A.setKmAus(new Set());
  const balken=()=>A.kmBalken().filter(b=>!b.marke);
  const texte=balken().map(b=>b.text);
  console.log('   '+texte.join(' | '));
  const hat=re=>texte.some(t=>re.test(t));
  ok(hat(/^Biovin 06\.05\.–26\.05\.$/)&&hat(/^Biovin 28\.07\.–26\.08\.$/),'Biovin: Mai, dann wieder Ende Juli bis August');
  ok(hat(/^Magnesium 06\.05\.–26\.05\.$/)&&hat(/^Magnesium seit 28\.07\.$/),'Magnesium im Mai, dann seit 28.07. – läuft weiter (laut Betrieb)');
  ok(hat(/^Kalisulfat seit 26\.08\.$/)&&hat(/^Zink seit 26\.08\.$/),'Kalisulfat und Zink seit 26.08. – laufen weiter');
  const mg=balken().find(b=>/^Magnesium seit/.test(b.text));
  ok(mg.x1===+new Date(A.heute())&&mg.laeuft,'Der laufende Balken reicht bis heute und endet in einer Spitze');
  ok(!hat(/Phosphor/),'Kein Balken für Phosphorsäure');
  ok(hat(/^Halades PE 06\.08\.–19\.08\.$/),'Halades vom 06.08. bis 19.08. – mit der Gabe «A» vom 18.08.');
  ok(hat(/^Zitronensäure 31\.08\.–09\.09\.$/),'Zitronensäure 31.08.–09.09. – endet mit dem Neuansatz der Tanks, läuft nicht weiter');
  ok(hat(/^EM /)&&hat(/^Schwefelsäure 25 % /),'EM und Schwefelsäure haben ihren Balken');
  const tipp=t=>balken().find(b=>t.test(b.text)).tipp.replace(/&#39;/g,"'");
  ok(/22\.5 kg/.test(tipp(/^Magnesium seit 28/)),'Menge gesamt Magnesium 28.07.–26.08.: 22,5 kg');
  ok(/ohne notierte Menge/.test(tipp(/^Biovin 28/)),'Biovin im August: Gaben ohne Menge werden genannt, nicht geschätzt');
  ok(!/Versuch/.test(texte.join(' ')),'Kein Etikett «Versuch» – einfach die Daten');
  A.setKmAus(new Set(['m|em','m|halades']));
  const ohne=balken().map(b=>b.text);
  ok(!ohne.some(t=>/^EM|^Halades/.test(t))&&ohne.some(t=>/^Biovin/.test(t)),'EM und Halades ausgeblendet – die übrigen bleiben');
  A.AKTION.kmBearbeiten();
  const w=document.getElementById('dlgBody').innerHTML,wf=document.getElementById('dlgFoot').innerHTML;
  ok(/data-aend="kmAn" data-k="m\|em"/.test(w)&&/data-tun="kmSchieben"/.test(w)&&/data-tun="kmLoeschen"/.test(w)&&/data-tun="kmAlle"/.test(wf)&&/Ereignisse/.test(w),
     '«Zeilen ordnen und ausblenden»: je Zeile hoch, runter, zeigen, löschen – dazu «alle»');
  A.AKTION.kmAn({k:'m|em'});
  ok(!A.getKmAus().has('m|em'),'Ein Klick blendet EM wieder ein');
  A.AKTION.kmAlle({v:'an'});
  ok(A.getKmAus().size===0,'«alle zeigen» blendet alles ein');
  A.AKTION.kmAlle({v:'aus'});
  ok(A.kmBalken().length===0,'«alle ausblenden» blendet alles aus');
  A.AKTION.kmAlle({v:'an'});
  const L=A.kmListe();
  ok(L.find(x=>x.id==='em').farbe===A.MITTEL_FARBE.em&&L.find(x=>x.id==='em').name==='EM','EM hat Name und feste Farbe');
}
{
  /* Die Wahl ist persönlich und übersteht das Neuladen. */
  const speicher={};global.localStorage={getItem:k=>speicher[k]??null,setItem:(k,v)=>{speicher[k]=String(v)}};
  A.setKmAus(new Set(['m|halades']));A.ansichtMerken();
  A.setKmAus(new Set());A.ansichtLaden();
  ok(A.getKmAus().has('m|halades'),'Ausgeblendete Balken werden im Browser gemerkt');
  delete global.localStorage;
}

console.log('\n════ Balken von Hand: Beginn, Ende, läuft ════');
{
  A.setDb(A.leer());A.AKTION.paketAn({id:'reservoir-2026'});A.setKmAus(new Set());
  const T=()=>A.kmBalken().filter(b=>!b.marke).map(b=>b.text);
  const $=id=>document.getElementById(id);
  const setze=(von,bis,laeuft,notiz)=>{$('spVon').value=von;$('spBis').value=bis||'';$('spLaeuft').checked=!!laeuft;$('spNotiz').value=notiz||''};
  A.AKTION.spanne({id:'m|halades|2026-08-06'});
  const dlgHtml=['dlgBody','dlgFoot'].map(id=>$(id).innerHTML||'').join('');
  ok(/Zeitraum des Balkens/.test(dlgHtml)&&/spLaeuft/.test(dlgHtml)&&/spanneSpeichern/.test(dlgHtml),'Klick auf den Balken öffnet den Dialog mit Beginn, Ende und «wird weiterhin gegeben»');
  ok((dlgHtml.match(/data-tun="evWeg"/g)||[]).length===5,'Darin jede der fünf Gaben, einzeln entfernbar');
  ok(!/Logbuch/.test(dlgHtml),'Ohne Verweis auf ein Logbuch');
  setze('2026-08-06','',true,'jede Woche');
  A.AKTION.spanneSpeichern({id:'m|halades|2026-08-06'});
  ok(T().includes('Halades PE seit 06.08.'),'Halades «wird weiterhin gegeben»: Balken seit 06.08. bis heute');
  const h=A.beigabeHand(x=>x.mittel==='halades');
  ok(h.length===1&&h[0].bis===null&&h[0].notiz==='jede Woche'&&h[0].gesetzt===A.heute(),'Im Bestand: ein Zeitraum von Hand, mit Notiz und Datum');
  const sp=A.beigabeSpannenMittel('halades');
  ok(sp.length===1&&sp[0].n===5&&sp[0].hand,'Die fünf Gaben stecken im Balken');
  setze('2026-08-10','2026-08-12',false);
  A.AKTION.spanneSpeichern({id:'m|halades|2026-08-06'});
  const hal=T().filter(t=>/^Halades/.test(t));
  console.log('   Halades:',hal.join(' | '));
  ok(hal.includes('Halades PE 10.08.–12.08.')&&A.beigabeHand(x=>x.mittel==='halades').length===1,'Beginn und Ende geändert – derselbe Zeitraum, kein zweiter');
  ok(hal.includes('Halades PE 06.08.–07.08.')&&hal.includes('Halades PE 13.08.–19.08.'),'Die Gaben ausserhalb verschwinden nicht: davor und danach je ein Balken');
  ok(A.getDb().ereignisse.filter(e=>e.mittel==='halades').length===5,'Die Gaben selbst bleiben unverändert');
  const vorher=JSON.stringify(A.getDb().beigabeZeiten);
  setze('2026-08-20','2026-08-10',false);
  A.AKTION.spanneSpeichern({id:'m|halades|2026-08-10'});
  ok(JSON.stringify(A.getDb().beigabeZeiten)===vorher,'Ende vor Beginn: nichts gespeichert');
  setze('2026-08-10','',false);
  A.AKTION.spanneSpeichern({id:'m|halades|2026-08-10'});
  ok(JSON.stringify(A.getDb().beigabeZeiten)===vorher,'Ohne Ende und ohne «weiterhin»: nichts gespeichert');
  A.AKTION.spanneAuto({id:A.beigabeHand(x=>x.mittel==='halades')[0].id});
  ok(T().includes('Halades PE 06.08.–19.08.')&&!A.beigabeHand(x=>x.mittel==='halades').length,'«Wieder automatisch»: der Balken kommt wieder aus den Gaben');
  setze('2026-08-26','2026-09-20',false);
  A.AKTION.spanneSpeichern({id:'m|kali|2026-08-26'});
  ok(T().includes('Kalisulfat 26.08.–20.09.')&&A.beigabeHand(x=>x.mittel==='kali').length===1,'Kalisulfat mit Ende 20.09. – ersetzt das «läuft» aus dem Paket');
  setze('2026-09-01','',true);
  A.AKTION.spanneSpeichern({id:'m|zink|2026-08-26'});
  ok(T().includes('Zink seit 01.09.')&&T().includes('Zink 26.08.'),'Zink: Beginn auf 01.09. verschoben – die Gabe vom 26.08. bleibt als eigener Balken');
  A.getDb().beigabeZeiten.push({id:'t1',mittel:'halades',von:'2026-09-25',bis:null});
  ok(T().includes('Halades PE seit 25.09.'),'Ein Zeitraum ohne Gabe ist trotzdem ein Balken');
  A.AKTION.paketAn({id:'reservoir-2026'});
  ok(T().includes('Kalisulfat 26.08.–20.09.')&&A.beigabeHand(x=>x.mittel==='kali').length===1,'Paket ergänzen lässt von Hand Gesetztes stehen');
  const r=A.migriere(JSON.parse(JSON.stringify(A.getDb())));
  ok(r.db.beigabeZeiten.length===A.getDb().beigabeZeiten.length,'Die Zeiträume überstehen Sichern und Laden');
  ok(Array.isArray(A.migriere({schema:10,analysen:[],ereignisse:[],messungen:[]}).db.beigabeZeiten),'Alte Bestände bekommen eine leere Liste');
}

console.log('\n════ Balken in Zeilen: je Mittel eine ════');
{
  A.setDb(A.leer());A.AKTION.paketAn({id:'reservoir-2026'});A.setKmAus(new Set());
  const alle=A.kmBalken(),bal=alle.filter(b=>!b.marke),marken=alle.filter(b=>b.marke);
  const x0=+new Date('2026-04-20'),x1=+new Date('2026-10-01'),X=v=>100+(v-x0)/(x1-x0)*900;
  const Z=A.spannenZeilen(alle,X,x0,x1);
  const zeilen=new Set(alle.map(b=>b.zeile));
  ok(Z.n===zeilen.size,`${alle.length} Balken und Marken in ${Z.n} Zeilen – eine je Mittel und je Art (${zeilen.size})`);
  const zeileVon=t=>Z.liste.find(x=>x.sp.text===t).z;
  ok(zeileVon('Biovin 06.05.–26.05.')===zeileVon('Biovin 28.07.–26.08.'),'Biovin Mai und Biovin August teilen sich eine Zeile');
  let stoss=null;for(const a of Z.liste)for(const b of Z.liste)if(a!==b&&a.z===b.z&&!a.sp.marke&&a.xa<b.xa&&a.ende>b.links)stoss=a.sp.text;
  ok(!stoss,'Keine Beschriftung stösst an den nächsten Balken derselben Zeile'+(stoss?': '+stoss:''));
  ok(Z.liste.every(x=>x.innen?x.xb-x.xa>=x.sp.text.length*6.4+18:true),'Weisse Schrift nur, wo sie in den Balken passt – sonst dunkel daneben');
  const R=A.spannenZeilen(bal,X,x0,x1,1000);
  ok(R.liste.filter(x=>x.lage==='rechts').every(x=>x.ende-12<=1000),'Keine Beschriftung ragt über den rechten Rand');
  ok(R.liste.some(x=>x.lage==='links'),'Kurze Balken am rechten Rand tragen ihre Beschriftung links davor');
  const svgB=A.spannenSvg(Z,300,104);
  ok((svgB.match(/<path d="M/g)||[]).length===bal.filter(x=>x.laeuft).length,'Jeder laufende Balken endet in einer Spitze ('+bal.filter(x=>x.laeuft).length+')');
  ok(/height="18"/.test(svgB)&&/font-size="11" font-weight="600" fill="#fff"/.test(svgB),'18 Bildpunkte hoch, weisse, halbfette Schrift');
  const eng=A.spannenZeilen(bal,v=>100+(v-x0)/(x1-x0)*250,x0,x1);
  ok(eng.n>A.spannenZeilen(bal,X,x0,x1).n,'Wird es eng, bekommt ein Mittel eine zweite Zeile, statt dass Text übereinanderliegt');
}

console.log('\n════ Paketfassung 2: gezielt nur das Neue ergänzen ════');
{
  /* Stand eines Betriebs, der Fassung 1 aktiviert hat: ohne die Daten vom
     18.–30.09. und ohne laufende Beigaben; eine Messung hat er selbst gelöscht. */
  const d=A.leer();
  d.messungen=A.PAKET_RES26.messungen.filter(m=>!m.pv).map(m=>Object.assign({},m));
  d.ereignisse=A.PAKET_RES26.ereignisse.filter(e=>!e.pv).map(e=>Object.assign({},e));
  const weg=d.messungen.splice(3,1)[0];
  d.pakete={'reservoir-2026':{aktiviert:'2026-09-30',abgelehnt:false}};
  A.setDb(d);A.setTab('kombi');
  const n=A.paketNeues(A.PAKET_RES26);
  ok(n.length===53,'Neu gegenüber Fassung 1: 38 Messungen, 12 Gaben und Ereignisse, 3 laufende Beigaben ('+n.length+')');
  ok(!n.some(x=>x.id===weg.id),'Was der Betrieb selbst gelöscht hat, gilt nicht als neu');
  ok(/Neu im Paket/.test(A.paketHinweis())&&/Ergänzen/.test(A.paketHinweis()),'Über den Diagrammen: «Neu im Paket» mit «Ergänzen»');
  A.AKTION.paketNeu({id:'reservoir-2026'});
  const db=A.getDb();
  ok(db.messungen.length===148&&db.ereignisse.length===76&&db.beigabeZeiten.length===3,'Ergänzt: jetzt 148 Messungen (eine bleibt gelöscht), 76 Einträge, 3 laufende Beigaben');
  ok(!db.messungen.some(m=>m.id===weg.id),'Die gelöschte Messung kommt nicht zurück');
  ok(db.pakete['reservoir-2026'].version===2&&A.paketNeues(A.PAKET_RES26).length===0,'Danach kein Hinweis mehr');
  A.setTab('kombi');ok(!/Neu im Paket/.test(A.paketHinweis()),'… auch nicht über den Diagrammen');
  const neun=db.messungen.filter(m=>m.datum==='2026-09-24');
  ok(neun.length===10&&neun.every(m=>/^\d\d:\d\d$/.test(m.zeit)),'24.09.: zehn Messungen, alle mit Uhrzeit');
  const misch=db.ereignisse.find(e=>e.datum==='2026-09-24'&&e.typ==='Umpumpen');
  ok(misch&&misch.zeit==='08:30'&&/gemischt/.test(misch.titel),'«RV und RH mischen» am 24.09. um 08:30');
  const s23=db.ereignisse.filter(e=>e.datum==='2026-09-23'&&e.mittel==='schwefelsaeure25');
  ok(s23.length===8&&Math.abs(s23.filter(e=>e.stelle==='vorne').reduce((a,e)=>a+e.menge,0)-2.2)<1e-9&&Math.abs(s23.filter(e=>e.stelle==='hinten').reduce((a,e)=>a+e.menge,0)-2.8)<1e-9,'23.09.: Schwefelsäure vorne 2,2 l, hinten 2,8 l');
  ok(db.messungen.find(m=>m.datum==='2026-09-30'&&m.stelle==='vorne').o2===6,'30.09. 08:00: O₂ vorne 6 mg/l');
}

console.log('\n════ Ereignisse ohne Mittel: Marken, eine Zeile je Art ════');
{
  A.setDb(A.leer());A.AKTION.paketAn({id:'reservoir-2026'});A.setKmAus(new Set());
  const marken=A.kmBalken().filter(b=>b.marke);
  const ohneMittel=A.getDb().ereignisse.filter(e=>!e.mittel);
  ok(marken.reduce((s,m)=>s+m.n,0)===ohneMittel.length,`Alle ${ohneMittel.length} Ereignisse ohne Mittel stehen als Marke – nichts geht verloren`);
  ok(new Set(marken.map(m=>m.zeile)).size===new Set(ohneMittel.map(e=>e.typ)).size,'Eine Zeile je Art');
  ok(marken.find(m=>m.zeile==='t|Tank neu angesetzt').zeileText==='Neuansatz','Die Zeile ist links benannt, kurz genug für den Rand');
  const zwei=marken.find(m=>m.n>1);
  ok(zwei&&/Wasserzugabe/.test(zwei.tipp),'Zwei am selben Tag: eine Marke mit Zahl, das Kästchen nennt beide');
  const misch=marken.find(m=>m.kennung==='t|Umpumpen|2026-09-24');
  ok(misch&&/08:30/.test(misch.tipp)&&/gemischt/.test(misch.tipp),'Das Kästchen nennt Uhrzeit und Notiz');
  const x0=+new Date('2026-04-20'),x1=+new Date('2026-10-01'),X=v=>104+(v-x0)/(x1-x0)*800;
  const Z=A.spannenZeilen(marken,X,x0,x1);
  const svg=A.spannenSvg(Z,300,104);
  ok(/>Neuansatz<\/text>/.test(svg)&&/text-anchor="end"/.test(svg),'Die Zeilennamen stehen links am Rand');
  ok(/>2<\/text>/.test(svg)&&/<circle/.test(svg),'Marke mit Zahl, sonst ein Punkt');
  A.AKTION.spanne({id:'t|Umpumpen|2026-09-24'});
  ok(/Umpumpen · 24\.09\.2026/.test(document.getElementById('dlgTitel').textContent)&&/data-tun="evWeg"/.test(document.getElementById('dlgBody').innerHTML),'Anklicken zeigt die Einträge des Tages, einzeln entfernbar');
  const box=document.getElementById('probeDiagramm');
  A.zeitBild(box,{tafeln:[{kopf:'pH',spuren:[{serien:[{id:'s',farbe:'#000',form:'kreis',punkte:[{x:+new Date('2026-05-01'),y:6},{x:+new Date('2026-09-15'),y:7}]}]}]}],
    km:{spannen:A.kmBalken(),typen:['Umpumpen'],offen:true}});
  const h=box.innerHTML;
  ok(/>Kulturmanagement</.test(h)&&(h.match(/class="spb"/g)||[]).length===A.kmBalken().length,'Unter den Grafiken das Kulturmanagement – aufgeklappt jeder Balken, jede Marke');
  ok(!/>Logbuch</.test(h),'Eine eigene Logbuch-Zeile gibt es nicht mehr');
}

console.log('\n════ Phosphorsäure: als hätte es sie nie gegeben ════');
{
  const alt={schema:11,analysen:[],messungen:[
      {id:'p26m-07-21-v1',datum:'2026-07-21',stelle:'vorne',ph:8.03,notiz:'morgens, vor der Phosphorsäure',beleg:'Tabelle «pH/EC Reservoir», Zeile 22: «Morgens, vor PS»',quelle:'paket',paket:'reservoir-2026'},
      {id:'h1',datum:'2026-07-21',stelle:'vorne',ph:7,notiz:'nach PS',quelle:'hand'}],
    ereignisse:[{id:'p26e-07-21-1',datum:'2026-07-21',typ:'Säurezugabe',mittel:'phosphorsaeure',menge:2100,einheit:'ml',quelle:'paket',paket:'reservoir-2026'},
      {id:'x1',datum:'2026-08-25',typ:'Säurezugabe',mittel:'phosphorsaeure',menge:1.2,einheit:'l',quelle:'hand'},
      {id:'p26e-08-07-2',datum:'2026-08-07',typ:'Umpumpen',mittel:null,notiz:'«alles nach hinten gepumpt»',beleg:'Tabelle «pH/EC Reservoir», Zeile 32: «Zugabe 1.7l P-Säure --> alles nach hinten gepumpt»',quelle:'paket',paket:'reservoir-2026'}],
    beigabeZeiten:[{id:'z',mittel:'phosphorsaeure',von:'2026-09-01',bis:null}],
    produkte:{phosphorsaeure:{name:'Phosphorsäure',form:'fluessig'}}};
  const r=A.migriere(alt);
  ok(r.db.ereignisse.length===1&&!r.db.beigabeZeiten.length,'Jede Gabe und jeder Zeitraum für Phosphorsäure ist weg – auch von Hand eingetragene');
  ok(!r.db.produkte.phosphorsaeure&&!A.leer().produkte.phosphorsaeure,'Das Produkt gibt es nicht mehr');
  ok(/entfernt/.test(r.notizen.join(' ')),'Beim Laden wird gesagt, dass etwas entfernt wurde');
  const m=r.db.messungen.find(x=>x.id==='p26m-07-21-v1');
  ok(m.notiz==='morgens'&&!/PS/.test(m.beleg),'Einträge aus dem Paket bekommen seinen heutigen Wortlaut – ohne Phosphorsäure');
  ok(!/P-Säure/.test(r.db.ereignisse[0].beleg),'Auch der Beleg des Umpumpens vom 07.08.');
  ok(r.db.messungen.find(x=>x.id==='h1').notiz==='nach PS','Was jemand selbst geschrieben hat, bleibt unangetastet');
  ok(!A.migriere(JSON.parse(JSON.stringify(r.db))).notizen.length,'Beim nächsten Laden ist nichts mehr zu tun');
  const v=A.vereinigen({analysen:[],ereignisse:[],messungen:[]},{ereignisse:[{id:'alt',mittel:'phosphorsaeure',datum:'2026-08-25'},{id:'gut',mittel:'kali',datum:'2026-08-26'}]});
  ok(v.db.ereignisse.length===1&&v.db.ereignisse[0].id==='gut','Auch aus einem älteren Stand auf dem Server kommt sie nicht zurück');
  ok(!A.MITTEL_MUSTER.some(mu=>mu.mittel==='phosphorsaeure'),'Der Tabellenimport kennt sie nicht');
}

console.log('\n════ Ergebnis ════');
console.log(fehler?`  ${fehler} FEHLER`:'  ✓ Alle Prüfungen bestanden.');
process.exit(fehler?1:0);
