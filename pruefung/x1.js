/* Tabellenimport: Datumsformate, doppelte Datumszeilen, leere Messwerte mit
   Bemerkung, «je Reservoir», gemischte Dezimaltrennzeichen, Bemerkungen zu
   Vorschlägen für Gaben und Ereignisse.

   Geprueft wird gegen einen Nachbau der beschriebenen Datei, nicht gegen die
   Datei selbst – die lag beim Bauen nicht vor. Der Parser sucht die Spalten
   deshalb ueber die Ueberschrift statt ueber feste Positionen: ein
   verschobener Kopfblock oder eine zusaetzliche Spalte macht ihn nicht blind.
   Bleibt beim ersten Lauf mit der echten Datei etwas liegen, sagt der
   Dialog «Nichts erkannt», welche Blaetter er gesehen hat.                 */
const A=require('./harness.js');
let fehler=0;
const ok=(b,t)=>{if(!b)fehler++;console.log((b?'  ✓ ':'  ✗ FEHLER ')+t)};

/* Nachbau des Blattes «pH/EC Reservoir»: Kopfblock, dann zwei
   nebeneinanderstehende Tabellen. */
const BLATT=[
  ['Reservoir Masse',null,null,null,null,null,null,null,null,null,null,null],
  ['Volumen je Reservoir',10000,'l',null,null,null,null,null,null,null,null,null],
  ['Dosierziel','0,15','%',null,null,null,null,null,null,null,null,null],
  [null,null,null,null,null,null,null,null,null,null,null,null],
  ['Datum','EC vorne','EC hinten','pH vorne','pH hinten','Bemerkung',
   'Datum','Satz','EC 1 Wurzel','EC 2 Wurzel','EC 3 Wurzel','Durchschnitt'],
  ['30.04.2026',1.2,'1,3',7.4,7.6,'über Wochenende Wasser ohne Dünger zudosiert ca 3000l',
   '30.04.2026','18-431',2.1,'2,3',2.0,2.13],
  ['10.6.',0.9,1.0,7.8,7.9,'nach Säurezugabe (ca. 3l je Reservoir) und Düngerzugabe (3kg Epsotop + 5l Biovin je Reservoir)',
   null,null,null,null,null,null],
  ['17.06',1.1,1.15,7.5,7.6,"danach, am 20.5. 15'000l (je Reservoir ca. 7500l) mit 0,1% Dünger Biovin zudosiert (15l)",
   null,null,null,null,null,null],
  ['2.7',null,null,null,null,'im vorderen Reservoir 10l Dünger zudosiert (aus versehen mit 0,2%)',
   null,null,null,null,null,null],
  ['9.7.',1.0,1.1,7.6,7.7,'+ 10000l BioV-Wasser + 3kg ET',null,null,null,null,null,null],
  ['9.7.',null,null,null,null,'Dünger leer, neue Lieferung am 15.7. geplant',null,null,null,null,null,null],
  ['21.07',1.3,1.4,8.0,8.1,'Morgens, vor Säurezugabe','21.07','28-478',2.4,2.5,2.6,2.5],
  ['21.07',1.1,1.2,6.6,6.7,'Abends, nach Säurezugabe. Zugabe 1.7l P-Säure --> alles nach hinten gepumpt',
   null,null,null,null,null,null],
  ['4.8.',1.2,1.25,7.7,7.8,'EC + pH-Gerät neu kalbriert! (war sehr falsch)',null,null,null,null,null,null],
  ['12.8.',1.15,1.2,7.9,7.9,'Reservoir vorne: 8000l BioV-Wasser + 2.5kg ET + 900ml Halades PE',
   null,null,null,null,null,null],
  [46000,1.0,1.05,7.8,7.85,'Excel-Seriennummer statt Text',null,null,null,null,null,null]];

A.setDb(A.leer());
const r=A.tabBlatt(BLATT);

console.log('════ Datumsformate ════');
const daten=[...new Set(r.mess.map(m=>m.datum))].sort();
console.log('   erkannt:',daten.join(' · '));
ok(daten.indexOf('2026-04-30')>=0,'Vollstaendiges Datum 30.04.2026');
ok(daten.indexOf('2026-06-10')>=0,'«10.6.» ohne Jahr – aus dem letzten vollstaendigen uebernommen');
ok(daten.indexOf('2026-06-17')>=0,'«17.06» ohne Punkt am Ende');
ok(daten.indexOf('2026-07-09')>=0,'«9.7.» einstellig');
ok(daten.indexOf('2026-07-21')>=0,'«21.07» zweistellig');
ok(daten.indexOf('2026-08-04')>=0,'«4.8.»');
ok(daten.indexOf('2025-12-14')>=0||daten.some(d=>/^2025-12/.test(d)),'Excel-Seriennummer 46000 gelesen');
console.log('   Seriennummer 46000 →',r.mess.filter(m=>m.notiz==='Excel-Seriennummer statt Text').map(m=>m.datum)[0]);

console.log('\n════ Jahreswechsel ════');
{
  const b=[['Datum','EC','Bemerkung'],['20.11.2026',1.0,''],['5.1',1.1,''],['3.2',1.2,'']];
  const x=A.tabBlatt(b);
  console.log('   ',x.mess.map(m=>m.datum).join(' · '));
  ok(x.mess[1]&&x.mess[1].datum==='2027-01-05','Springt der Monat zurueck, wird das Jahr erhoeht');
  ok(x.mess[2]&&x.mess[2].datum==='2027-02-03','Und bleibt danach im neuen Jahr');
}

console.log('\n════ Zwei Entnahmestellen je Zeile ════');
const erste=r.mess.filter(m=>m.datum==='2026-04-30');
console.log('   ',erste.map(m=>`${m.stelle}: EC ${m.ec} pH ${m.ph}`).join(' | '));
ok(erste.length===2,'Eine Zeile ergibt zwei Messungen');
ok(erste.some(m=>m.stelle==='vorne'&&m.ec===1.2),'Vorne korrekt');
ok(erste.some(m=>m.stelle==='hinten'&&m.ec===1.3),'Hinten korrekt – «1,3» mit Komma gelesen');

console.log('\n════ Gemischte Dezimaltrennzeichen ════');
ok(r.mess.some(m=>m.ec===1.15),'Punkt als Trennzeichen');
ok(r.mess.some(m=>m.ec===1.3),'Komma als Trennzeichen');

console.log('\n════ Mehrere Zeilen mit demselben Datum ════');
const am21=r.mess.filter(m=>m.datum==='2026-07-21');
console.log('   ',am21.map(m=>`${m.stelle} EC ${m.ec} · «${(m.notiz||'').slice(0,28)}»`).join(' | '));
ok(am21.length===4,'Zwei Zeilen à zwei Stellen bleiben als vier Messungen erhalten');
ok(am21.some(m=>/Morgens/.test(m.notiz||''))&&am21.some(m=>/Abends/.test(m.notiz||'')),
   'Die Bemerkung unterscheidet sie');
ok(am21.filter(m=>m.stelle==='vorne').map(m=>m.ph).sort().join(',')==='6.6,8', 'Beide pH-Werte vorne erhalten');

console.log('\n════ Leere Messwerte bei vorhandener Bemerkung ════');
ok(!r.mess.some(m=>m.datum==='2026-07-02'),'Eine Zeile ohne Messwert erzeugt KEINE Messung');
ok(r.vorschlaege.some(v=>v.datum==='2026-07-02'),'Aber sehr wohl einen Vorschlag für eine Gabe');
ok(r.hinweise.some(h=>/nur eine Bemerkung/.test(h)),'Und die App sagt, dass sie das getan hat');

console.log('\n════ Wurzel-EC ════');
console.log('   ',r.wurzel.map(w=>`${w.datum} ${w.satz} [${w.werte.join(',')}] Ø ${w.schnitt}`).join(' | '));
ok(r.wurzel.length===2,'Beide Wurzelzeilen erkannt');
ok(r.wurzel[0].satz==='18-431'&&r.wurzel[0].werte.length===3,'Satz und drei Einzelwerte');
ok(r.wurzel[0].werte[1]===2.3,'Auch hier Komma als Trennzeichen');

console.log('\n════ Bemerkungen zu Vorschlägen ════');
const v=(d,typ,mittel)=>r.vorschlaege.find(x=>x.datum===d&&x.typ===typ&&(mittel===undefined||x.mittel===mittel));
r.vorschlaege.forEach(x=>console.log(`   ${x.datum} ${x.typ.padEnd(22)} ${String(x.mittel||'–').padEnd(15)} ${x.menge==null?'–':x.menge+' '+(x.einheit||'')}${x.jeReservoir?' je Reservoir':''}`));

ok(!!v('2026-04-30','Wasserzugabe'),'«Wasser ohne Dünger zudosiert ca 3000l» → Wasserzugabe');
ok(v('2026-04-30','Wasserzugabe').menge===3000,'Mit 3000 l');

const saeure=v('2026-06-10','Säurezugabe');
ok(!!saeure&&saeure.menge===3,'«Säurezugabe (ca. 3l je Reservoir)» → 3 l');
ok(saeure.jeReservoir===true,'Und «je Reservoir» ist erkannt');
ok(!!v('2026-06-10','Düngergabe','epsotop')&&v('2026-06-10','Düngergabe','epsotop').menge===3,'«3kg Epsotop» → 3 kg Epsotop');
ok(v('2026-06-10','Düngergabe','epsotop').einheit==='kg','Epsotop ist fest → Kilogramm');
ok(!!v('2026-06-10','Düngergabe','biovin')&&v('2026-06-10','Düngergabe','biovin').menge===5,'«5l Biovin» → 5 l Biovin');
ok(v('2026-06-10','Düngergabe','biovin').jeReservoir===true,'Auch dort «je Reservoir»');

ok(!!v('2026-06-17','Düngergabe','biovin'),"«15'000l … 0,1% Dünger Biovin» wird als Düngergabe vorgeschlagen");
ok(v('2026-06-17','Düngergabe','biovin').felder.dosis==='0.1','Die Dosierung 0,1 % wird mitgelesen');

const vorne=v('2026-07-02','Düngergabe');
ok(!!vorne&&vorne.menge===10,'«im vorderen Reservoir 10l Dünger» → 10 l');
ok(vorne.stelle==='vorne','Und die Entnahmestelle «vorne»');

const biov=v('2026-07-09','Wasserzugabe');
ok(!!biov&&biov.menge===10000,'«10000l BioV-Wasser» → Wasserzugabe 10 000 l');
console.log('   Warnung:',biov.warnung);
ok(!!biov.warnung&&/Wieviel Dünger darin war, steht in dieser Bemerkung nicht/.test(biov.warnung),
   'MIT Warnung: BioV-Wasser ist Wasser mit Dünger – wieviel, steht nicht da');
ok(biov.felder.mitDuenger==='ja','Und der Eintrag ist als «mit Dünger angesetzt» gekennzeichnet');
/* «15'000l (je Reservoir ca. 7500l) mit 0,1% Dünger Biovin zudosiert (15l)»:
   Liter ab 500 sind Wasser, nicht Dünger – aus dem Satz werden zwei Eintraege,
   und das «je Reservoir» in der Klammer verdoppelt nichts, weil eine
   Gesamtmenge dasteht. */
const mehr=v('2026-06-17','Düngergabe','biovin');
const mehrW=v('2026-06-17','Wasserzugabe',null);
ok(!!mehr&&mehr.menge===15&&!mehr.jeReservoir,'Biovin 15 l – nicht verdoppelt, weil 15 000 l als Gesamtmenge dasteht');
ok(!!mehrW&&mehrW.menge===15000&&mehrW.felder.mitDuenger==='ja','Und 15 000 l Wasser mit Dünger als eigener Eintrag – Liter ab 500 sind Wasser');
ok(mehr.menge===15,'Die Menge kurz hinter dem Mittel wird gewählt (15 l Biovin, nicht 15 000 l Wasser)');
ok(!!v('2026-07-09','Düngergabe','epsotop'),'«3kg ET» → Epsotop');
ok(v('2026-07-09','Düngergabe','epsotop').menge===3,'Mit 3 kg');

ok(!!v('2026-07-09','Notiz'),'«Dünger leer» wird als Notiz erfasst');
ok(!!v('2026-07-21','Säurezugabe','phosphorsaeure'),'«1.7l P-Säure» → Phosphorsäure');
ok(v('2026-07-21','Säurezugabe','phosphorsaeure').menge===1.7,'Mit 1,7 l');
ok(!!v('2026-07-21','Umpumpen'),'«alles nach hinten gepumpt» → Umpumpen');
ok(!!v('2026-08-04','Gerätekalibrierung'),'«EC + pH-Gerät neu kalbriert» → Gerätekalibrierung');

const halades=v('2026-08-12','Desinfektion','halades');
ok(!!halades&&halades.menge===900&&halades.einheit==='ml','«900ml Halades PE» → 900 ml Desinfektion');
ok(halades.stelle==='vorne','Und «Reservoir vorne» gilt für die ganze Bemerkung');
ok(!!v('2026-08-12','Düngergabe','epsotop')&&v('2026-08-12','Düngergabe','epsotop').menge===2.5,'«2.5kg ET» → 2,5 kg');

console.log('\n════ Nichts geht verloren ════');
ok(r.vorschlaege.every(x=>x.roh&&x.roh.length),'Jeder Vorschlag traegt den Rohtext seiner Bemerkung');
{
  const x=A.bemerkungLesen('irgendetwas völlig Unbekanntes passierte','2026-07-01');
  ok(x.length===1&&x[0].typ==='Notiz','Unzuordenbares wird als Notiz vorgeschlagen');
  ok(x[0].felder.text==='irgendetwas völlig Unbekanntes passierte','Mit dem Rohtext');
  ok(/Nicht zugeordnet/.test(x[0].hinweis||''),'Und der Hinweis sagt warum');
  ok(A.bemerkungLesen('','2026-07-01').length===0,'Eine leere Bemerkung erzeugt nichts');
}

console.log('\n════ «je Reservoir» wird nie stillschweigend verdoppelt ════');
ok(saeure.menge===3,'Die erkannte Menge bleibt die im Text genannte (3, nicht 6)');
ok(saeure.jeReservoir===true,'Der Vorbehalt steht als eigenes Feld daneben');
ok(A.evMenge({menge:3,einheit:'l',jeReservoir:true}).indexOf('zusammen 6 l')>=0,'Beide Zahlen werden gezeigt');

console.log('\n════ CSV ohne jede Bibliothek ════');
{
  const csv='Datum;EC vorne;EC hinten;pH vorne;pH hinten;Bemerkung\n'+
            '30.04.2026;1,2;1,3;7,4;7,6;"Wasser zudosiert ca 3000l"\n'+
            '10.6.;0,9;1,0;7,8;7,9;"3kg Epsotop"\n';
  const z=A.csvZeilen(csv);
  const x=A.tabBlatt(z);
  console.log('   Zeilen:',z.length,'· Messungen:',x.mess.length,'· Vorschlaege:',x.vorschlaege.length);
  ok(z.length===3,'CSV mit Semikolon zerlegt');
  ok(x.mess.length===4,'Zwei Zeilen à zwei Stellen');
  ok(x.mess[0].ec===1.2,'Komma als Dezimaltrennzeichen im CSV');
  ok(x.vorschlaege.length>=2,'Auch im CSV entstehen Vorschläge');
}

console.log('\n════ Robustheit ════');
{
  ok(A.tabBlatt([]).mess.length===0,'Eine leere Datei bringt nichts zum Absturz');
  ok(A.tabBlatt([['nur','Text','ohne','Kopf']]).mess.length===0,'Ohne Kopfzeile wird nichts erfunden');
  const versch=[[null,null,null],[null,'Datum','EC','pH','Bemerkung'],[null,'1.5.2026',1.1,7.2,'']];
  ok(A.tabBlatt(versch).mess.length===1,'Ein verschobener Kopfblock macht den Parser nicht blind');
  ok(A.tabDatum('31.02.2026',null)===null,'Ein unmoegliches Datum wird verworfen statt geraten');
  ok(A.tabDatum('10.6.',null)===null,'Ohne Bezug wird ein Datum ohne Jahr nicht geraten');
}

console.log('\n════ Die echte Tabelle: April bis September 2026 ════');
{
  /* pruefung/fixtures/tank-2026.tsv ist das Blatt «pH/EC Reservoir», so wie
     es am 26.9. aus Excel kopiert wurde – mit allen Eigenheiten. */
  const fs=require('fs');
  A.setDb(A.leer());
  const zeilen=A.csvZeilen(fs.readFileSync(__dirname+'/fixtures/tank-2026.tsv','utf8'));
  ok(zeilen[1].length>=12,'Tabulator als Trenner wird erkannt');
  const t=A.tabBlatt(zeilen);
  const hat=d=>t.mess.some(m=>m.datum===d);
  console.log('   Messungen:',t.mess.length,'· Vorschläge:',t.vorschlaege.length,'· Hinweise:',t.hinweise.length);
  ok(t.mess.length>=80,'Über 80 Messungen aus 29 Tagen');
  ok(hat('2026-06-17')&&hat('2026-06-25')&&hat('2026-07-02')&&hat('2026-07-21')&&hat('2026-08-12'),'Daten mit Komma («17,06», «2,7», «12,8») werden gelesen');
  ok(hat('2026-07-09')&&t.vorschlaege.some(x=>x.datum==='2026-07-30'),'Und die mit Punkt ohne Jahr («9.7.», «30.7.»)');
  const o2=t.mess.filter(m=>m.o2!=null);
  ok(o2.length===5&&o2.every(m=>m.stelle==='vorne')&&o2[0].o2===5.6,'Die O₂-Spalte kommt an – fünf Werte, alle zur vorderen Stelle');
  const tipp=t.mess.find(m=>m.datum==='2026-08-14'&&m.stelle==='vorne');
  ok(tipp&&tipp.ph===1.36&&/Tippfehler/.test(tipp.warnung||''),'pH 1,36 am 14.8. wird als unwahrscheinlich markiert – nicht verworfen, nicht geglaubt');
  ok(t.hinweise.some(h=>/Zeile 27: kein Datum/.test(h)),'Die Zeile ohne Datum (zweites «10000l BioV-Wasser») wird benannt, nicht stillschweigend datiert');
  const V=(datum,typ,mittel)=>t.vorschlaege.filter(x=>x.datum===datum&&x.typ===typ&&(mittel===undefined||x.mittel===mittel));
  ok(V('2026-08-13','Düngergabe','epsotop').length===1&&V('2026-08-13','Desinfektion','halades')[0].menge===1.5,'«5kg EPT + 1.5l HA» → Epsotop 5 kg und Halades 1,5 l');
  ok(V('2026-08-26','Zusatzdünger / Spurenelemente','kali')[0].menge===1.7&&V('2026-08-26','Zusatzdünger / Spurenelemente','zink')[0].menge===6,'«1,7kg KS + 6g Zn» → Kalisulfat 1,7 kg und Zink 6 g');
  ok(V('2026-08-25','Säurezugabe','phosphorsaeure')[0].menge===1.2,'«+1,2l PS» → Phosphorsäure 1,2 l');
  ok(V('2026-08-06','Desinfektion','halades').length===1,'«Haldes PE» mit Tippfehler → Halades');
  const ps=V('2026-07-21','Säurezugabe','phosphorsaeure');
  ok(ps.length===2&&ps.some(x=>x.stelle==='vorne'&&x.menge===2100&&x.einheit==='ml')&&ps.some(x=>x.stelle==='hinten'),
     '«nach PS (vorne 2100ml, hinten 2100ml)» → zwei Gaben, das Mittel aus dem Satzanfang mitgetragen');
  ok(!t.vorschlaege.some(x=>x.datum==='2026-07-21'&&x.typ==='Notiz'&&/nach PS/.test(x.felder.text||'')),'Und keine überflüssige Notiz «PS erwähnt» daneben');
  const h2=V('2026-09-16','Säurezugabe','schwefelsaeure25');
  ok(h2.length===2&&h2.some(x=>x.stelle==='vorne')&&h2.some(x=>x.stelle==='hinten')&&h2.every(x=>x.menge===1),
     '«RV (ca. 5000l) + 1l H2S04 RH(ca.7000l) + 1l H2SO4» → je 1 l Schwefelsäure vorne und hinten, das Volumen ist keine Zugabe');
  ok(!t.vorschlaege.some(x=>x.datum==='2026-09-16'&&x.typ==='Wasserzugabe'),'5000 l und 7000 l in der Klammer werden nicht zu Wasserzugaben');
  const zs=V('2026-08-31','Säurezugabe','zitronensaeure');
  ok(zs.length===1&&zs[0].menge===1&&zs[0].jeReservoir===true,'«je 1kg Zitronensäure RV + RH» → 1 kg je Reservoir');
  /* Am 30.09. geklärt: «MKBoden» ist EM (Effektive Mikroorganismen). */
  const mk=V('2026-09-17','Biologisches Präparat','em');
  ok(mk.length===2&&mk.some(x=>x.stelle==='vorne'&&x.menge===5&&x.einheit==='l')&&mk.some(x=>x.stelle==='hinten'&&x.menge===10),'«5l MKBoden» vorne und «10l MKBoden» hinten → EM 5 l und 10 l');
  ok(!t.vorschlaege.some(x=>x.typ==='Notiz'&&/MKBoden/.test((x.felder&&x.felder.text)||'')),'Keine MKBoden-Notiz mehr');
  const a=t.vorschlaege.find(x=>x.datum==='2026-08-18');
  ok(a&&a.typ==='Notiz'&&/ohne erkennbares Mittel/.test(a.hinweis||''),'«1.4l A» bleibt eine Notiz mit Nachfrage – «A» ist kein bekanntes Kürzel');
  ok(!t.vorschlaege.some(x=>x.datum==='2026-05-05'&&x.typ==='Notiz'),'«Wasser ohne Dünger» ergibt eine Wasserzugabe und keine zweite Notiz');
  ok(V('2026-05-26','Düngergabe',null)[0].menge===10&&V('2026-05-26','Düngergabe',null)[0].stelle==='vorne','«10l Dünger» ohne Produktnamen bleibt eine Düngergabe ohne Mittel, vorne');
  /* Uebernahme in den Bestand: die Baender entstehen von selbst */
  const d=A.leer();
  for(const v of t.vorschlaege)if(v.typ!=='Notiz')d.ereignisse.push({id:'e'+d.ereignisse.length,datum:v.datum,typ:v.typ,mittel:v.mittel,menge:v.menge,einheit:v.einheit,jeReservoir:v.jeReservoir,stelle:v.stelle,felder:v.felder||{},geltung:'alle',saetze:[],quelle:'excel'});
  A.setDb(d);
  const M=A.kmBalken().filter(x=>!x.marke);
  const txt=M.map(x=>x.text);
  console.log('   Mittel:',txt.join(' | '));
  ok(txt.some(t=>/^Halades( PE)? 06\.08\.–19\.08\./.test(t)),'Halades: 6. bis 19. August, dann nicht mehr – ein Balken mit Anfang und Ende');
  ok(txt.some(t=>/^Phosphorsäure .*–25\.08\./.test(t)),'Phosphorsäure: bis 25. August');
  /* Ob «seit» oder ein einzelner Tag, haengt davon ab, wie lange der 31.8.
     heute her ist – die Regel sagt: laeuft, solange keine 28 Tage vergangen sind. */
  ok(txt.some(t=>/^Zitronensäure (seit )?31\.08\./.test(t)),'Zitronensäure: 31. August – und danach nichts mehr in der Tabelle');
  ok(txt.some(t=>/^Schwefelsäure 25 % seit 16\.09\./.test(t)),'Schwefelsäure: seit 16. September, läuft');
  ok(txt.some(t=>/^Kalisulfat (seit )?26\.08\./.test(t))&&txt.some(t=>/^Zink (seit )?26\.08\./.test(t)),'Kalisulfat und Zink ab 26. August – in der Tabelle steht danach keine weitere Gabe, also kein «seit» ohne Beleg');
  ok(M.every(x=>x.tipp&&/Menge gesamt/.test(x.tipp)),'Im Kästchen die Summe der Mengen');
  ok(txt.some(t=>/^Magnesium 06\.05\./.test(t)),'Magnesium: ein Balken ab 6. Mai');
  ok(!/Versuch/.test(txt.join(' ')),'Kein Etikett «Versuch» – einfach die Daten');
}

console.log('\n════ Der Praxisbericht (31.08.–10.09.2026) als Tabelle ════');
{
  /* pruefung/fixtures/praxis-2026.tsv sind die Messreihen aus dem Bericht
     «pH- und Säure-Praxisversuch», abgeschrieben ins Tabellenformat.
     Mehrere Messungen am selben Tag, keine Uhrzeit (kennt das Modell nicht). */
  const fs=require('fs');
  A.setDb(A.leer());
  const t=A.tabBlatt(A.csvZeilen(fs.readFileSync(__dirname+'/fixtures/praxis-2026.tsv','utf8')));
  ok(t.mess.length===25,'25 pH-Messungen, mehrere je Tag, gehen nicht verloren: '+t.mess.length);
  ok(t.mess.filter(m=>m.datum==='2026-09-09').length===12,'Der 9. September hat 12 Einzelwerte (6 vorne, 6 hinten)');
  const o2=t.mess.filter(m=>m.o2!=null);
  ok(o2.length===1&&o2[0].o2===0.2&&o2[0].stelle==='vorne','O₂ 0,2 mg/l am 9.9. steht vorne');
  const zs=t.vorschlaege.filter(v=>v.typ==='Säurezugabe'&&v.mittel==='zitronensaeure');
  ok(zs.length===7&&zs.reduce((s,v)=>s+v.menge,0)===6,'Sieben Zitronensäure-Gaben, zusammen 6 kg');
  ok(zs.filter(v=>v.datum==='2026-09-09').length===3&&zs.filter(v=>v.datum==='2026-09-09'&&v.stelle==='hinten').length===2,'Am 9.9. drei Gaben: zwei hinten, eine vorne');
  const neu=t.vorschlaege.filter(v=>v.typ==='Tank neu angesetzt');
  ok(neu.length===1&&neu[0].datum==='2026-09-10','«Wasser abgepumpt, Tanks neu gefüllt» → Tank neu angesetzt am 10.9., kein Umpumpen');
  ok(!t.vorschlaege.some(v=>v.typ==='Umpumpen'),'Kein Umpumpen daraus');
  ok(!t.mess.some(m=>m.warnung),'Keine der pH-Zahlen gilt als unplausibel');
  ok(!JSON.stringify(t).includes('Versuch'),'Nichts wird als «Versuch» ausgewiesen');
}

console.log('\n════ Ergebnis ════');
console.log(fehler?`  ${fehler} FEHLER`:'  ✓ Alle Prüfungen bestanden.');
process.exit(fehler?1:0);
