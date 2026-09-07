/* Logbuch: Umstellung auf strukturierte Mengen, Umbenennungen, Anzeige. */
const A=require('./harness.js');
let fehler=0;
const ok=(b,t)=>{if(!b)fehler++;console.log((b?'  ✓ ':'  ✗ FEHLER ')+t)};

console.log('════ Alte Eintraege werden umgestellt, ohne dass etwas verloren geht ════');
const alt={schema:5,analysen:[],messungen:[],rundgaenge:[],saetze:{},eigeneOptima:{},
  ereignisse:[
    {id:'a',datum:'2026-05-20',typ:'pH-Korrektur',felder:{saeure:'Phosphorsäure',menge:'3 l je Reservoir',zielPh:'6.5'}},
    {id:'b',datum:'2026-06-01',typ:'Wasser nachgefüllt',felder:{menge:'10000',einheit:'Liter'}},
    {id:'c',datum:'2026-06-10',typ:'Sonstiges',felder:{text:'Dünger leer'}},
    {id:'d',datum:'2026-06-15',typ:'Düngerwechsel',felder:{alt:'Biorga',neu:'Biovin',dosis:'0.15'}},
    {id:'e',datum:'2026-07-01',typ:'Pflanzenschutz / Nützlinge',felder:{mittel:'Nützlinge',ziel:'Thripse'}}]};
const r=A.migriere(JSON.parse(JSON.stringify(alt)));
r.notizen.filter(n=>/Logbuch|Bezeichnungen|Freitext/.test(n)).forEach(n=>console.log('   ·',n));
const e=id=>r.db.ereignisse.find(x=>x.id===id);
console.log('   Typen nachher:',r.db.ereignisse.map(x=>x.typ).join(' · '));
ok(e('a').typ==='Säurezugabe','«pH-Korrektur» heisst jetzt «Säurezugabe»');
ok(e('b').typ==='Wasserzugabe','«Wasser nachgefüllt» heisst jetzt «Wasserzugabe»');
ok(e('c').typ==='Notiz','«Sonstiges» heisst jetzt «Notiz»');
ok(e('d').typ==='Düngerwechsel','Unveraenderte Typen bleiben unveraendert');
ok(e('a').felder.saeure==='Phosphorsäure'&&e('a').felder.zielPh==='6.5','Die alten Freitextfelder bleiben vollstaendig erhalten');
ok(e('a').menge===3,'Aus «3 l je Reservoir» wird die Zahl 3 herausgelesen');
ok(e('b').menge===10000,'Und aus «10000» die Zahl 10000');
ok(e('a').mittel==='Phosphorsäure','Das Mittel wird aus dem alten Feld uebernommen');
ok(e('d').mittel==='Biovin','Beim Duengerwechsel ist das Mittel der neue Duenger');
ok(e('a').stelle==='beide','Ohne Angabe gilt ein Eintrag fuer beide Reservoirs');
ok(e('a').jeReservoir===false,'«je Reservoir» wird NICHT geraten – der Text bleibt zur Kontrolle stehen');
ok(r.notizen.some(n=>/kontrollieren/.test(n)),'Und die Migration fordert genau diese Kontrolle ein');
ok(r.db.ereignisse.every(x=>x.quelle==='hand'),'Alle Alteintraege gelten als von Hand erfasst');

console.log('\n════ Feste Einheit je Art ════');
A.setDb(r.db);
ok(A.einheitVon('Düngergabe','biovin')==='l','Biovin ist fluessig → Liter');
ok(A.einheitVon('Düngergabe','epsotop')==='kg','Epsotop ist fest → Kilogramm');
ok(A.einheitVon('Säurezugabe','zitronensaeure')==='l','Die Saeurezugabe rechnet immer in Litern');
ok(A.einheitVon('Desinfektion',null)==='ml','Desinfektion in Millilitern');
ok(A.einheitVon('Gerätekalibrierung',null)==='','Eine Kalibrierung hat keine Menge');

console.log('\n════ Anzeige der Menge ════');
ok(A.felderText({typ:'Düngergabe',mittel:'biovin',menge:15,einheit:'l',jeReservoir:false})
  .indexOf('15 l')>=0,'Menge und Einheit stehen im Text');
const je=A.felderText({typ:'Düngergabe',mittel:'biovin',menge:15,einheit:'l',jeReservoir:true});
console.log('   je Reservoir:',je);
ok(/15 l je Reservoir \(zusammen 30 l\)/.test(je),'«je Reservoir» zeigt beide Zahlen statt still umzurechnen');
ok(A.felderText({typ:'Notiz',felder:{text:'Dünger leer'},notiz:null}).indexOf('Dünger leer')>=0,'Freitextfelder erscheinen weiterhin');

console.log('\n════ Der Reiter ════');
{
  const d=A.leer();
  d.ereignisse=JSON.parse(JSON.stringify(r.db.ereignisse));
  A.setDb(d);
  const h=A.vLogbuch();
  ok(!/undefined|NaN|\[object Object\]/.test(h),'Der Reiter rendert sauber');
  ok(/Schnellerfassung/.test(h),'Die Schnellerfassung steht zuoberst');
  ok(/zeitstrahl/.test(h),'Darunter ein Zeitstrahl');
  ok(/wieder so/.test(h),'Wiederkehrendes laesst sich duplizieren');
  ok((h.match(/zs-monat/g)||[]).length>=3,'Nach Monaten gegliedert');
  ok(/data-tun="lbFilter"/.test(h),'Nach Art filterbar');
  ok(/Häufiges/.test(h),'Mit Schaltflaechen fuer haeufige Kombinationen');

  d.ereignisse[0].quelle='excel';
  A.setDb(d);
  ok(/aus Excel-Import/.test(A.vLogbuch()),'Eintraege aus dem Excel-Import tragen ein Herkunftsetikett');

  A.setDb(A.leer());
  const leer=A.vLogbuch();
  ok(/Noch keine Einträge/.test(leer),'Der leere Zustand erklaert, warum das Logbuch wichtig ist');
  ok(!/undefined/.test(leer),'Und rendert sauber');
}

console.log('\n════ Escaping ════');
{
  const d=A.leer();
  d.ereignisse=[{id:'x',datum:'2026-07-01',typ:'Notiz',titel:"<img src=x onerror=alert(1)>",
    notiz:"Test ' & <Zeichen>",felder:{},quelle:'hand',stelle:'beide'}];
  A.setDb(d);
  const h=A.vLogbuch();
  /* Geprueft wird auf echtes Markup: der maskierte Text darf «onerror=alert»
     als harmlose Zeichenfolge enthalten, aber kein <img> erzeugen. */
  ok(h.indexOf('<img src=x')<0,'Der Titel erzeugt kein <img>-Element');
  ok(/&lt;img src=x onerror=alert\(1\)&gt;/.test(h),'Sondern erscheint maskiert als Text');
  ok(h.indexOf('<Zeichen>')<0,'Die Notiz schleust ebenso wenig Markup ein');
  ok(/Test &#39; &amp; &lt;Zeichen&gt;/.test(h),'Und erscheint ebenfalls maskiert');
}

console.log('\n════ Ergebnis ════');
console.log(fehler?`  ${fehler} FEHLER`:'  ✓ Alle Pruefungen bestanden.');
process.exit(fehler?1:0);
