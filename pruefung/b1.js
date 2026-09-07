/* Soll-Ist-Bilanz: Umrechnung, Zeitfenster, Verweigerung bei Luecken. */
const A=require('./harness.js');
let fehler=0;
const ok=(b,t)=>{if(!b)fehler++;console.log((b?'  ✓ ':'  ✗ FEHLER ')+t)};

const probe=(datum,werte)=>({id:'p'+datum,typ:'giesswasser',datum,stelle:'Reservoir Vorne',
  laborId:'X'+datum,werte:Object.keys(werte).reduce((o,k)=>(o[k]={wert:werte[k]},o),{}),optima:{}});
const gabe=(datum,mittel,menge,extra)=>Object.assign({id:'e'+datum+mittel,datum,typ:'Düngergabe',
  mittel,menge,einheit:mittel==='epsotop'?'kg':'l',jeReservoir:false,stelle:'beide',
  felder:{},geltung:'alle',saetze:[],quelle:'hand'},extra||{});

/* Ein sauber gefuehrtes Logbuch: in jeder Woche des Fensters ein Eintrag. */
function aufbau(){
  const d=A.leer();
  d.einst.systemLiter=20000;
  d.analysen=[probe('2026-07-01',{}),probe('2026-08-01',{gw_Fe:0.4,gw_Mn:0.3,gw_Zn:0.2,gw_Cu:0.3,
    gw_NO3:0.3,gw_NH4:3.69,gw_Mg:2.1,gw_S:2.0})];
  d.ereignisse=[
    gabe('2026-07-05','biovin',20),
    gabe('2026-07-12','biovin',20),
    gabe('2026-07-19','epsotop',3),
    gabe('2026-07-26','biovin',20)];
  return d;
}

console.log('════ Umrechnung ════');
{
  const d=aufbau();
  A.setDb(d);
  const b=A.bilanzGiess(d.analysen[1],d.analysen);
  console.log('   Fenster:',b.fenster.grund,'·',b.fenster.von,'→',b.fenster.bis);
  console.log('   Eintraege im Fenster:',b.eintraege.length,'· Abdeckung',b.deckung.belegt+'/'+b.deckung.wochen);
  b.zeilen.forEach(z=>console.log(`   ${z.el.name.padEnd(12)} dosiert ${A.nz(z.dosiert,3).padStart(9)} · gemessen ${z.gemessen==null?'–':A.nz(z.gemessen,3)} ${z.einheit}`));
  ok(b.genug===true,'Bei lueckenloser Fuehrung wird gerechnet');
  ok(b.eintraege.length===4,'Alle vier Gaben im Fenster');

  /* 60 l Biovin, Dichte 1,25 kg/l, 0,22 % Fe
     = 60 × 1,25 × 1000 g = 75 000 g Produkt → 165 g Fe
     / 20 000 l = 8,25 mg/l → /55,845 g/mol = 0,1477 mmol/l = 147,7 µmol/l */
  const fe=b.zeilen.find(z=>z.el.el==='Fe');
  console.log('   Eisen dosiert:',A.nz(fe.dosiert,1),'µmol/l');
  ok(fe.einheit==='µmol/l','Eisen wird in µmol/l gerechnet, wie es das Labor liefert');
  ok(Math.abs(fe.dosiert-147.7)<1,'60 l Biovin mit 0,22 % Fe ergeben rund 148 µmol/l');

  /* 3 kg Epsotop, 9,86 % Mg = 295,8 g / 20 000 l = 0,01479 g/l = 14,79 mg/l
     / 24,305 = 0,6085 mmol/l */
  const mg=b.zeilen.find(z=>z.el.el==='Mg');
  console.log('   Magnesium dosiert:',A.nz(mg.dosiert,3),'mmol/l');
  ok(mg.einheit==='mmol/l','Magnesium in mmol/l');
  ok(Math.abs(mg.dosiert-0.6085)<0.005,'3 kg Epsotop mit 9,86 % Mg ergeben rund 0,61 mmol/l');

  /* Stickstoff: 60 l × 1,25 × 1000 × 9 % = 6750 g / 20 000 = 337,5 mg/l
     / 14,007 = 24,09 mmol/l. Gemessen NO3 0,3 + NH4 3,69 = 3,99 mmol/l */
  const n=b.zeilen.find(z=>z.el.el==='N');
  console.log('   Stickstoff dosiert:',A.nz(n.dosiert,2),'· gemessen',A.nz(n.gemessen,2));
  ok(Math.abs(n.dosiert-24.09)<0.1,'Stickstoff aus 60 l Biovin: rund 24 mmol/l');
  ok(Math.abs(n.gemessen-3.99)<0.001,'Gemessen wird Nitrat plus Ammonium');
  ok(Math.abs(n.anteil-3.99/24.09)<0.001,'Der Anteil ist gemessen durch dosiert');

  ok(!b.zeilen.some(z=>z.el.el==='K'),'Elemente ohne Gehalt im Produkt erscheinen nicht');
}

console.log('\n════ «je Reservoir» verdoppelt in der Bilanz – und sagt es ════');
{
  const d=aufbau();
  d.ereignisse[0].jeReservoir=true;
  A.setDb(d);
  const b=A.bilanzGiess(d.analysen[1],d.analysen);
  const fe=b.zeilen.find(z=>z.el.el==='Fe');
  console.log('   Eisen mit einer je-Reservoir-Gabe:',A.nz(fe.dosiert,1),'µmol/l');
  ok(Math.abs(fe.dosiert-147.7*80/60)<1,'20 l «je Reservoir» zaehlen als 40 l');
  ok(b.jeRes===1,'Die Zahl solcher Eintraege wird mitgefuehrt');
  const h=A.vGiess();
  ok(/je Reservoir/.test(h)&&/doppelte Menge gerechnet/.test(h),'Und im Reiter steht, dass verdoppelt wurde');
  ok(/Im Logbuch bleibt die eingetragene Zahl unverändert/.test(h),'Das Logbuch selbst bleibt unangetastet');
}

console.log('\n════ Verweigerung bei Luecken ════');
{
  const d=aufbau();
  d.ereignisse=[gabe('2026-07-05','biovin',20)];   /* nur eine Woche von vier */
  A.setDb(d);
  const b=A.bilanzGiess(d.analysen[1],d.analysen);
  console.log('   Abdeckung:',b.deckung.belegt,'von',b.deckung.wochen,'Wochen =',Math.round(b.deckung.anteil*100)+'%');
  ok(b.genug===false,'Unter 70 % Abdeckung wird die Aussage verweigert');
  const h=A.vGiess();
  ok(/Zahlen bleiben verdeckt/.test(h),'Der Reiter sagt, dass er die Zahlen verdeckt');
  ok(/Lücken/.test(h),'Und nennt den Grund: Luecken im Logbuch');
  ok(!/dosiert \(berechnet\)/.test(h),'Die Tabelle mit den Zahlen erscheint nicht');
  ok(/was nicht eingetragen wurde, erscheint als Verlust/.test(h),'Und erklaert, warum eine luerkenhafte Bilanz irrefuehrt');
}

console.log('\n════ Ohne Eintraege ════');
{
  const d=aufbau();
  d.ereignisse=[];
  A.setDb(d);
  const b=A.bilanzGiess(d.analysen[1],d.analysen);
  ok(b.eintraege.length===0&&b.genug===false,'Ohne Eintraege keine Bilanz');
  const h=A.vGiess();
  ok(/noch nicht möglich/.test(h),'Der Reiter sagt das ausdruecklich');
  ok(/Trag die Düngergaben im Logbuch ein/.test(h),'Und sagt, was zu tun ist');
}

console.log('\n════ Fehlende Dichte ════');
{
  const d=aufbau();
  d.produkte.biovin.dichte=null;
  A.setDb(d);
  const b=A.bilanzGiess(d.analysen[1],d.analysen);
  console.log('   ohne Dichte:',b.ohneDichte.join(', '));
  ok(b.ohneDichte.indexOf('biovin')>=0,'Ein fluessiges Produkt ohne Dichte wird benannt');
  ok(!b.zeilen.some(z=>z.el.el==='Fe'),'Seine Gaben fehlen in der Rechnung');
  ok(/fehlt die Dichte/.test(A.vGiess()),'Und der Reiter sagt warum');
}

console.log('\n════ Zeitfenster ════');
{
  const d=aufbau();
  A.setDb(d);
  let b=A.bilanzGiess(d.analysen[1],d.analysen);
  ok(b.fenster.von==='2026-07-01','Ohne Tankneuansatz gilt die vorige Wasserprobe als Anfang');
  d.ereignisse.push({id:'t1',datum:'2026-07-15',typ:'Tank neu angesetzt',menge:20000,einheit:'l',
    mittel:null,jeReservoir:false,stelle:'beide',felder:{},geltung:'alle',saetze:[],quelle:'hand'});
  A.setDb(d);
  b=A.bilanzGiess(d.analysen[1],d.analysen);
  console.log('   ',b.fenster.grund);
  ok(b.fenster.von==='2026-07-15','Ein Neuansatz des Tanks setzt das Fenster neu');
  ok(/Neuansetzen des Tanks/.test(b.fenster.grund),'Und der Grund wird benannt');
  ok(b.eintraege.length===2,'Nur die Gaben danach zaehlen');
}

console.log('\n════ Vorbehalte stehen sichtbar in der Ansicht ════');
{
  A.setDb(aufbau());
  const h=A.vGiess();
  ok(/frisch<\/em> angesetzte|frisch angesetzte/.test(h.replace(/<[^>]+>/g,x=>x)),'Die Rechnung gilt fuer eine frisch angesetzte Loesung');
  ok(/kein Verlust, sondern die Summe/.test(h),'Die Differenz ist kein Verlust, sondern eine Summe mehrerer Vorgaenge');
  ok(/Wochen mit Logbucheinträgen/.test(h),'Die Abdeckung des Zeitraums steht da');
  ok(/tag schaetz">Annahme/.test(h),'Die Auswertung traegt das Etikett «Annahme»');
  ok(/stammen von den Etiketten/.test(h),'Mit Herkunftsangabe');
  ok(/sagt bewusst nicht, wieviel zuzugeben wäre/.test(h),'Und verzichtet ausdruecklich auf eine Dosierungsempfehlung');
  ok(/auch im Frischwasser/.test(h),'Calcium, Magnesium und Schwefel sind als «auch im Frischwasser» gekennzeichnet');
  ok(/über 100 % ist dort normal/.test(h),'Und ein Anteil ueber 100 % wird dort erklaert');
}

console.log('\n════ Produktstammdaten im Reiter Einstellungen ════');
{
  A.setDb(aufbau());
  const h=A.vSaetze();
  ok(!/undefined|NaN|\[object Object\]/.test(h),'Der Reiter rendert sauber');
  ok(/Produkte und Systemvolumen/.test(h),'Die Stammdaten sind dort zu finden');
  ok(/data-aend="prodGehalt"/.test(h),'Die Gehalte sind editierbar');
  ok(/data-aend="prodFeld"/.test(h),'Name, Form, Dichte und Herkunft ebenso');
  ok(/data-k="systemLiter"/.test(h),'Das Systemvolumen ist einstellbar');
  ok(/keine Gehalte hinterlegt/.test(h),'Produkte ohne Gehalt sagen das, statt eine Zahl zu erfinden');
}

console.log('\n════ Ergebnis ════');
console.log(fehler?`  ${fehler} FEHLER`:'  ✓ Alle Pruefungen bestanden.');
process.exit(fehler?1:0);
