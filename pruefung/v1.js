/* Der gekoppelte Reiter «Verlauf»: gemeinsame Zeitachse, getrennte Achsen,
   Voreinstellungen, Rangliste, Eingangsbilanz, Jung gegen Alt. */
const A=require('./harness.js');
let fehler=0;
const ok=(b,t)=>{if(!b)fehler++;console.log((b?'  ✓ ':'  ✗ FEHLER ')+t)};

const FIX=require('./giesswasser.json');
function aufbau(){
  const d=A.migriere(JSON.parse(JSON.stringify(require('./testdaten.json')))).db;
  for(const n of ['vorneZwei','hintenOhne','vorneMit']){
    const r=A.parseGiess(FIX[n].seiten,FIX[n].punkte);
    r.proben.forEach((p,i)=>d.analysen.push(Object.assign({id:n+i,typ:'giesswasser',labor:r.labor,
      herkunft:'ruecklauf',symptom:'unbekannt',gewaschen:null},p)));
  }
  for(let i=0;i<10;i++){const t=new Date(Date.UTC(2026,6,1+i*5));
    d.messungen.push({id:'m'+i,datum:t.toISOString().slice(0,10),stelle:i%2?'vorne':'hinten',
      ph:7.2+i*0.05,ec:1.0,ecFrisch:null,temp:null,notiz:null,quelle:'excel'});}
  return d;
}

console.log('════ Schema 8 ════');
{
  const r=A.migriere({schema:6,analysen:[{id:'a',typ:'blattsaft',datum:'2026-08-18',werte:{},optima:{}}],
    ereignisse:[],messungen:[],rundgaenge:[],fotos:[],saetze:{},eigeneOptima:{},
    einst:{systemLiter:20000}});
  r.notizen.filter(n=>/Nitrit|Herkunft|Systemvolumen/.test(n)).forEach(n=>console.log('   ·',n));
  ok(r.db.schema===8,'Schema auf 8 gehoben');
  ok(r.db.analysen[0].herkunft==='unbekannt','Herkunft der Probe angelegt, auf «unbekannt» – nichts geraten');
  ok(r.db.analysen[0].symptom==='unbekannt','Symptomatisch oder gesund: das Feld gibt es jetzt');
  ok(r.db.analysen[0].gewaschen===null,'Und ob das Blatt gewaschen war');
  ok(r.db.einst.systemLiter===19200,'Systemvolumen auf 19 200 l berichtigt');
  ok(A.GW_PARAM.indexOf('NO2')>=0,'Nitrit ist als Wasserparameter vorgesehen');
  ok(A.einheit('gw_NO2')==='mmol/l','In mmol/l wie die übrigen Makronährstoffe');
  ok(r.notizen.some(n=>/Nitrit/.test(n)),'Die Migration sagt, warum Nitrit dazugekommen ist');
}

console.log('\n════ Voreinstellungen ════');
{
  ok(A.PAARE_VOR.length>=5,'Fünf benannte Fragen statt einer leeren Auswahl');
  A.PAARE_VOR.forEach(p=>{
    console.log('   '+p.name.padEnd(26)+' Blatt: '+p.blatt.join(',').padEnd(12)+' Wasser: '+p.wasser.join(','));
  });
  ok(A.PAARE_VOR.every(p=>p.frage&&p.erwartung&&p.widerlegt),
     'Jede Frage sagt, was zu sehen sein sollte UND was die Erwartung widerlegen würde');
  ok(A.PAARE_VOR.some(p=>p.blatt.includes('NO3')&&p.wasser.includes('gw_NH4')),
     'Die Stickstoffform verbindet Blatt-Nitrat mit Wasser-Ammonium');
  ok(A.PAARE_VOR.some(p=>p.wasser.includes('gw_NO2')),'Nitrit ist in der Stickstofffrage vorgesehen');
}

console.log('\n════ Der Reiter ════');
{
  const d=aufbau();
  A.setDb(d);
  const h=A.vVerlauf();
  ok(!/undefined|NaN|\[object Object\]/.test(h),'Rendert sauber');
  ok(/Stickstoffform/.test(h),'Öffnet mit einer sinnvollen Voreinstellung, nicht leer');
  ok(/Was zu sehen sein sollte/.test(h)&&/widerlegen würde/.test(h),'Erwartung und Gegenprobe stehen dabei');
  ok(/nicht<\/strong> ineinander umgerechnet/.test(h),'Es steht da, dass NICHT umgerechnet wird');
  ok(/Jung gegen Alt/.test(h),'Die Jung/Alt-Ansicht steht darunter');
  A.nachRenderRun();
  const svg=global.document.getElementById('cVl').innerHTML;
  console.log('   SVG',svg.length,'Zeichen');
  ok(/Pflanze · Blattsaft/.test(svg),'Spur «Pflanze»');
  ok(/Wasser ·/.test(svg),'Spur «Wasser»');
  ok(/>Logbuch</.test(svg),'Spur «Logbuch»');
  const achsen=(svg.match(/Ziehen verschiebt/g)||[]).length;
  ok(achsen===1,'Genau EINE gemeinsame Zeitachse für alle Spuren');
  ok((svg.match(/class="hit"/g)||[]).length>4,'Punkte sind anfassbar');
  ok(/class="zeiger"/.test(svg),'Ein gemeinsamer Zeiger über alle Spuren');
}

console.log('\n════ Getrennte Achsen je Einheit ════');
{
  const d=aufbau();
  A.setDb(d);
  /* «Kommt das Eisen an?» mischt µmol/l und pH – das darf nicht auf eine Achse */
  A.AKTION.vlPaar({v:'fe'});
  const svg=global.document.getElementById('cVl').innerHTML;
  const spuren=(svg.match(/Wasser · [^<]*/g)||[]);
  console.log('   Wasserspuren:',spuren.join(' | '));
  ok(spuren.length===2,'Eisen und pH bekommen getrennte Spuren');
  ok(spuren.some(x=>/Eisen/.test(x))&&spuren.some(x=>/pH/.test(x)),'Und sind benannt');
  ok(/µmol\/l/.test(svg)&&/ohne Einheit/.test(svg),'Jede Spur zeigt ihre eigene Einheit');
  ok(!/-\d/.test((svg.match(/font-family="JetBrains Mono,monospace">-[\d.]+/)||[''])[0]||''),
     'Keine negative Konzentration auf der Achse');
}

console.log('\n════ Was im Wasser gar nicht gemessen ist ════');
{
  /* Ein Bestand, in dem es Wasseranalysen gibt – aber ohne die Parameter,
     um die es in der gewaehlten Frage geht. Ohne Hinweis saehe die Frage
     beantwortet aus, obwohl die halbe Antwort fehlt. */
  const d=A.migriere(JSON.parse(JSON.stringify(require('./testdaten.json')))).db;
  d.analysen=d.analysen.filter(a=>a.typ!=='giesswasser');
  d.analysen.push({id:'gwarm',typ:'giesswasser',datum:'2026-08-01',stelle:'Reservoir Vorne',
    herkunft:'ruecklauf',symptom:'unbekannt',gewaschen:null,
    werte:{gw_pH:{wert:7.6},gw_EC:{wert:0.6},gw_Na:{wert:18}},optima:{}});
  A.setDb(d);
  A.AKTION.vlPaar({v:'fe'});
  const h=A.vVerlauf();
  ok(/in keiner Probe gemessen/.test(h),'Der Reiter sagt, dass der Parameter im Wasser fehlt');
  ok(/Eisen/.test(h.split('data-tun="vlPaar"')[0])&&/nicht<\/strong> beantworten/.test(h),
     'Und dass sich die Frage mit dem vorhandenen Bestand nicht beantworten lässt');
  A.nachRenderRun();
  const svg=global.document.getElementById('cVl').innerHTML;
  ok(/in keiner Wasserprobe gemessen/.test(svg)&&/Wasser · Eisen/.test(svg),
     'Die fehlende Spur verschwindet nicht wortlos, sondern steht leer da und sagt warum');
  A.AKTION.vlPaar({v:'n'});
  const hn=A.vVerlauf();
  ok(/Nitrit/.test(hn)&&/Trennversuch/.test(hn),
     'Bei der Stickstofffrage wird Nitrit ausdrücklich als Trennversuch nachbestellt');
}

console.log('\n════ Wechsel der Frage wirkt auf den ganzen Reiter ════');
{
  const d=aufbau();
  A.setDb(d);
  A.AKTION.vlPaar({v:'n'});
  const a=A.vVerlauf();
  A.AKTION.vlPaar({v:'zn'});
  const b=A.vVerlauf();
  /* Die Namen aller Fragen stehen immer als Auswahlknoepfe da – gepruefft wird
     deshalb der Titel, also das Stueck vor der Knopfreihe. */
  const titel=h=>h.split('data-tun="vlPaar"')[0];
  ok(/Stickstoffform/.test(titel(a))&&!/Kommt das Zink an/.test(titel(a)),'Vorher die eine Frage');
  ok(/Kommt das Zink an/.test(titel(b))&&!/Stickstoffform/.test(titel(b)),'Nachher die andere');
  ok(/Zink wird mit dem Dünger|Dasselbe für Zink/.test(b),'Mit dem passenden Text');
}

console.log('\n════ Freie Auswahl statt fünf fester Fragen ════');
{
  const d=aufbau();
  A.setDb(d);
  A.AKTION.vlPaar({v:'n'});
  A.vVerlauf();
  /* Ein Nährstoff dazu: das ist bereits die eigene Auswahl. Die
     Voreinstellung selbst darf davon nicht verändert werden. */
  const vorher=JSON.stringify(A.PAARE_VOR.find(p=>p.id==='n'));
  A.AKTION.vlStoff({k:'Fe'});
  const h=A.vVerlauf();
  ok(/Eigene Auswahl/.test(h),'Ein Klick auf einen Nährstoff schaltet auf die eigene Auswahl');
  ok(JSON.stringify(A.PAARE_VOR.find(p=>p.id==='n'))===vorher,'Die Voreinstellung selbst bleibt unangetastet');
  ok(/Oben Nitrat, Ammonium, Eisen/.test(h),'Die vorige Auswahl wird übernommen, nicht weggeworfen');
  ok(/keine<\/strong> vorformulierte Erwartung/.test(h),
     'Bei eigener Auswahl behauptet die App nicht, was zu sehen sein sollte');

  /* Jeder Nährstoff und jede Wassergrösse steht zur Wahl. */
  const chips=(h.match(/data-tun="vlStoff" data-k="([^"]+)"/g)||[]).length;
  const wchips=(h.match(/data-tun="vlWass" data-k="([^"]+)"/g)||[]).length;
  console.log('   wählbar:',chips,'Nährstoffe ·',wchips,'Wassergrössen');
  ok(chips>=15,'Alle gemessenen Nährstoffe stehen zur Wahl, nicht nur die der Fragen');
  ok(wchips>=15,'Und alle Grössen des Wasserberichts');
  ok(/data-tun="vlWass" data-k="gw_NO2"/.test(h),'Auch nie gemessene – sonst wäre die Lücke unsichtbar');
  ok(/·nie/.test(h),'Sie sind als «nie gemessen» gekennzeichnet');

  /* Wieder zurück auf eine Voreinstellung */
  A.AKTION.vlPaar({v:'k'});
  ok(/Kalium/.test(A.vVerlauf().split('data-tun="vlPaar"')[0]),'Der Rückweg auf eine Frage funktioniert');
}

console.log('\n════ Gleiche Farbe oben wie unten ════');
{
  const d=aufbau();A.setDb(d);
  A.AKTION.vlPaar({v:'n'});
  A.vVerlauf();A.nachRenderRun();
  const svg=global.document.getElementById('cVl').innerHTML;
  /* Nitrat steht im Blatt und im Wasser. Beide Male dieselbe Farbe – sonst
     ist die Kopplung nur behauptet. Die Farbe steht in der Legende. */
  const leg=global.document.getElementById('legVl').innerHTML;
  const farbeVon=n=>{const m=leg.match(new RegExp('fill="(#[0-9A-Fa-f]{6})"[^<]*(?:<[^>]+>)*[^<]{0,80}'+n));return m&&m[1]};
  const f=[...leg.matchAll(/fill="(#[0-9A-Fa-f]{6})"[\s\S]{0,200}?>([^<]+)</g)].map(m=>({c:m[1],t:m[2].trim()}));
  const nitrat=f.filter(x=>/^Nitrat/.test(x.t)).map(x=>x.c);
  console.log('   Nitrat-Einträge in der Legende:',f.filter(x=>/^Nitrat/.test(x.t)).map(x=>x.t+' '+x.c).join(' | '));
  ok(nitrat.length>=2&&new Set(nitrat).size===1,
     'Nitrat trägt in der Pflanzenspur und in der Wasserspur dieselbe Farbe');
  const ammon=f.filter(x=>/^Ammonium/.test(x.t)).map(x=>x.c);
  ok(ammon.length>=2&&new Set(ammon).size===1,'Ammonium ebenso');
  ok(nitrat[0]!==ammon[0],'Und die beiden Stoffe unterscheiden sich voneinander');
}

console.log('\n════ Getrennte Achsen auch bei gleicher Einheit ════');
{
  /* Ammonium bei rund 4 mmol/l und Nitrit bei 0,02 mmol/l teilen die Einheit.
     Auf einer gemeinsamen Achse wäre Nitrit eine Linie auf null – dieselbe
     Regel wie im Reiter Nährstoffe, Faktor 25. */
  const d=aufbau();
  d.analysen.filter(a=>a.typ==='giesswasser').forEach((a,i)=>{
    a.werte.gw_NH4={wert:3.6+i*0.1};a.werte.gw_NO2={wert:0.02+i*0.002};
  });
  A.setDb(d);
  A.AKTION.vlPaar({v:'n'});
  A.vVerlauf();A.nachRenderRun();
  const svg=global.document.getElementById('cVl').innerHTML;
  const spuren=(svg.match(/Wasser · [^<]*/g)||[]);
  console.log('   Wasserspuren:',spuren.join(' | '));
  ok(spuren.length>=2,'Ammonium und Nitrit bekommen getrennte Achsen');
  ok(spuren.some(x=>/Nitrit/.test(x))&&!spuren.some(x=>/Nitrit/.test(x)&&/Ammonium/.test(x)),
     'Nitrit steht nicht auf derselben Achse wie Ammonium');
}

console.log('\n════ Zu viele Wassergrössen: Hinweis statt stiller Quetschung ════');
{
  const d=aufbau();A.setDb(d);
  A.AKTION.vlPaar({v:'n'});
  A.vVerlauf();
  ['gw_pH','gw_HCO3','gw_Ca','gw_Na'].forEach(k=>A.AKTION.vlWass({k}));
  A.vVerlauf();A.nachRenderRun();
  const hw=global.document.getElementById('vlHinweis').innerHTML;
  const svg=global.document.getElementById('cVl').innerHTML;
  const spuren=(svg.match(/Wasser · [^<]*/g)||[]);
  console.log('   Spuren:',spuren.length,'· Hinweis:',hw?hw.replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim().slice(0,110):'keiner');
  ok(spuren.length<=3,'Es bleibt bei höchstens drei Wasserspuren – sonst wird die Zeichnung höher als der Bildschirm');
  ok(!hw||/teilt sich jetzt eine Achse/.test(hw),'Und wenn zusammengelegt wird, steht es da');
}

console.log('\n════ Nichts ausgewählt ════');
{
  const d=aufbau();A.setDb(d);
  A.AKTION.vlPaar({v:'fe'});
  A.vVerlauf();
  A.AKTION.vlStoff({k:'Fe'});              /* den einzigen Nährstoff wieder weg */
  const h=A.vVerlauf();
  ok(/Nur das Wasser/.test(h.split('data-tun="vlPaar"')[0]),'Ohne Nährstoff bleibt die Wasserseite bedienbar');
  A.nachRenderRun();
  ok(/kein Nährstoff ausgewählt/.test(global.document.getElementById('cVl').innerHTML),
     'Die obere Spur sagt, dass nichts gewählt ist – statt leer dazustehen');
}

console.log('\n════ Zeitachse ════');
{
  const kurz=A.zeitMarken(+new Date('2026-07-01'),+new Date('2026-08-15'));
  const lang=A.zeitMarken(+new Date('2026-01-01'),+new Date('2026-12-31'));
  console.log('   6 Wochen:',kurz.map(t=>t.text).join(' '));
  console.log('   12 Monate:',lang.map(t=>t.text).join(' '));
  ok(kurz.length>=5&&kurz.length<=8,'Kurze Spanne: Wochenmarken');
  ok(lang.length>=11&&lang.length<=13,'Lange Spanne: Monatsmarken');
  ok(A.zeitMarken(0,0).length===1,'Auch eine leere Spanne bringt nichts zum Absturz');
}

console.log('\n════ Rangliste der Mängel ════');
{
  const d=aufbau();
  A.setDb(d);
  const r=A.rangliste();
  console.log('   die ersten fünf:',r.slice(0,5).map(x=>(A.NAME[x.k]||x.k)+' '+x.daneben+'/'+x.n).join(' · '));
  ok(r.length>5,'Über alle Parameter, nicht nur die der Kennzahl');
  ok(r.every((x,i)=>i===0||r[i-1].schwere>=x.schwere),'Nach Schwere sortiert');
  ok(r.every(x=>x.n>=2),'Parameter mit einer einzigen Messung fallen heraus');
  ok(r.every(x=>['Mangel','Überschuss','gemischt','im Rahmen'].indexOf(x.richtung)>=0),'Jede Zeile hat eine Richtung');
  const h=A.ranglisteKarte();
  ok(/Woran fehlt es wirklich/.test(h),'Die Karte ist da');
  ok(/ein Hinweis, kein Nachweis/.test(h),'Der Trendpfeil ist als Hinweis gekennzeichnet, nicht als Nachweis');
  ok(/Nachweisgrenze/.test(h),'Und es steht da, dass Werte unter der Nachweisgrenze fehlen');
  ok(A.pfeil(0.4)==='↗'&&A.pfeil(-0.4)==='↘'&&A.pfeil(0)==='→','Der Pfeil zeigt die Richtung');
  ok(/weiter weg vom Sollbereich|Richtung Sollbereich|unverändert/.test(h),'Und wird in Worte gefasst');
}

console.log('\n════ Eingangsbilanz ════');
{
  A.setDb(aufbau());
  const b=A.eingangsbilanz();
  b.forEach(x=>console.log('   '+x.el.name.padEnd(12)+(x.quellen.length?x.quellen.map(q=>q.name).join(', '):'>>> keine Quelle <<<')));
  const ohne=b.filter(x=>x.ohneQuelle).map(x=>x.el.el);
  ok(ohne.indexOf('K')>=0,'Kalium hat mit den Vorgabeprodukten KEINE Quelle');
  ok(ohne.indexOf('P')>=0,'Phosphor ebenso wenig');
  ok(b.find(x=>x.el.el==='Fe').quellen.length>0,'Eisen dagegen kommt aus dem Dünger');
  ok(b.find(x=>x.el.el==='Mg').quellen.some(q=>q.produkt==='epsotop'),'Magnesium aus Epsotop');
  const h=A.eingangsKarte();
  ok(/Ohne jede Quelle/.test(h),'Die Karte benennt die Elemente ohne Quelle');
  ok(/Rücklauf/.test(h),'Und sagt, dass die Wassermessung aus dem Rücklauf stammt');
  ok(/tag schaetz">Annahme/.test(h),'Sie trägt das Etikett «Annahme»');
}

console.log('\n════ Jung gegen Alt ════');
{
  A.setDb(aufbau());
  const ja=A.jungAlt();
  console.log('   '+ja.slice(0,5).map(x=>(A.NAME[x.k]||x.k)+' '+x.mittel.toFixed(2)).join(' · '));
  ok(ja.length>3,'Für alle Parameter mit beiden Blattetagen');
  ok(ja.every(x=>x.n>=1&&x.erwartet),'Jede Zeile nennt n und die Erwartung aus der Mobilität');
  const fe=ja.find(x=>x.k==='Fe');
  if(fe)ok(fe.mob==='immobil','Eisen ist als immobil gefuehrt – ein Symptom müsste am Jungblatt erscheinen');
  const mg=ja.find(x=>x.k==='Mg');
  if(mg)ok(mg.mob==='mobil','Magnesium ist mobil – ein Symptom müsste am Altblatt erscheinen');
}

console.log('\n════ Verdünnungsspalte der Soll-Ist-Bilanz ════');
{
  const d=A.leer();d.einst.systemLiter=20000;
  const probe=(dt,w)=>({id:'p'+dt,typ:'giesswasser',datum:dt,stelle:'V',
    werte:Object.keys(w).reduce((o,k)=>(o[k]={wert:w[k]},o),{}),optima:{}});
  d.analysen=[probe('2026-07-01',{}),probe('2026-08-01',{gw_Fe:0.4})];
  const ev=(dt,typ,m,mg)=>({id:'e'+dt+typ,datum:dt,typ,mittel:m,menge:mg,einheit:'l',
    jeReservoir:false,stelle:'beide',felder:{},geltung:'alle',saetze:[],quelle:'hand'});
  d.ereignisse=[ev('2026-07-05','Düngergabe','biovin',20),ev('2026-07-08','Wasserzugabe',null,10000),
    ev('2026-07-12','Düngergabe','biovin',20),ev('2026-07-15','Wasserzugabe',null,10000),
    ev('2026-07-19','Düngergabe','biovin',20),ev('2026-07-22','Wasserzugabe',null,10000),
    ev('2026-07-26','Düngergabe','biovin',20),ev('2026-07-29','Wasserzugabe',null,10000)];
  A.setDb(d);
  const b=A.bilanzGiess(d.analysen[1],d.analysen);
  const fe=b.zeilen.find(z=>z.el.el==='Fe');
  console.log('   Wasserzugaben',b.wasserGesamt,'l · dosiert',fe.dosiert.toFixed(1),
    '· nach Verdünnung',fe.verduennt.toFixed(1),'· gemessen',fe.gemessen);
  ok(b.wasserGesamt===40000,'Die Wasserzugaben im Fenster werden summiert');
  ok(fe.verduennt<fe.dosiert,'Die Verdünnung senkt den erwarteten Wert');
  ok(fe.anteilV>fe.anteil,'Und hebt damit den Anteil, der angekommen ist');
  ok(fe.anteilV<0.05,'Selbst verdünnungskorrigiert kommen unter 5 % an');
  const h=A.vGiess();
  ok(/nach Verdünnung/.test(h),'Die Spalte erscheint in der Ansicht');
  ok(/tag schaetz">Modell/.test(h),'Sie ist als Modell gekennzeichnet, nicht als Messwert');
  ok(/fehlt eine, ist die Zahl zu hoch/.test(h),'Mit dem Vorbehalt, dass alle Wasserzugaben erfasst sein müssen');

  /* ohne erfasste Wasserzugaben: keine Spalte, aber eine Erklaerung */
  d.ereignisse=d.ereignisse.filter(e=>e.typ!=='Wasserzugabe');
  A.setDb(d);
  const h2=A.vGiess();
  ok(!/nach Verdünnung<\/th>/.test(h2),'Ohne erfasste Wasserzugaben keine Spalte');
  ok(/Obergrenze/.test(h2),'Stattdessen der Hinweis, dass «dosiert» eine Obergrenze ist');
}

console.log('\n════ Wirkungsanalyse ist erhalten geblieben ════');
{
  const d=aufbau();
  d.ereignisse.push({id:'w1',datum:'2026-08-01',typ:'Düngergabe',mittel:'biovin',menge:20,
    einheit:'l',jeReservoir:false,stelle:'beide',titel:'Probe',felder:{},geltung:'alle',saetze:[],quelle:'hand'});
  A.setDb(d);
  ok(/Wirkung prüfen/.test(A.vLogbuch()),'Der Knopf steht am Logbucheintrag');
  A.AKTION.wirkung({id:'w1'});
  const dlg=global.document.getElementById('dlgBody').innerHTML;
  ok(dlg.length>200,'Der Dialog öffnet');
  ok(/Vergleichsgruppe|ganze Gewächshaus/.test(dlg),'Die Vergleichsgruppen-Analyse ist nicht mit dem Reiter weggefallen');
}

console.log('\n════ Ergebnis ════');
console.log(fehler?`  ${fehler} FEHLER`:'  ✓ Alle Pruefungen bestanden.');
process.exit(fehler?1:0);
