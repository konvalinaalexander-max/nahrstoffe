/* Online-Bausteine ohne Browser: das Vereinigen zweier Stände, die
   Stellen-Zuordnung von Messungen, die Balken je Mittel und die Migration
   der Felder für Sauerstoff und Namen. */
const A=require('./harness.js');
let fehler=0;
const ok=(b,t)=>{if(!b)fehler++;console.log((b?'  ✓ ':'  ✗ FEHLER ')+t)};
const tagVor=n=>{const d=new Date();d.setDate(d.getDate()-n);return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')};

console.log('════ Felder für Sauerstoff und Namen ════');
{
  const r=A.migriere({schema:8,analysen:[],ereignisse:[{id:'e1',datum:'2026-09-01',typ:'Düngergabe',mittel:'biovin',menge:20}],
    messungen:[{id:'m1',datum:'2026-09-01',ph:6.2,ec:1.8}],rundgaenge:[],fotos:[],saetze:{},eigeneOptima:{},einst:{}});
  ok(r.db.schema===12,'Schema auf 12 gehoben');
  ok(r.db.messungen[0].o2===null&&r.db.messungen[0].o2sat===null&&r.db.messungen[0].wer===null,'Alte Messungen: Sauerstoff und Name auf null – nichts geraten');
  ok(r.db.ereignisse[0].wer===null,'Alte Einträge: Name auf null');
  ok(r.db.ereignisse[0].einheit==='l','Eine alte Gabe ohne Einheit bekommt sie aus der Form des Produkts');
}

console.log('\n════ Messungen zu Stellen ════');
{
  A.setDb(A.leer());
  ok(A.messStelle({stelle:'Reservoir vorne'})==='Reservoir vorne','Der Name der Stelle, wie ihn das Handy schickt');
  ok(A.messStelle({stelle:'vorne'})==='Reservoir vorne','«vorne» aus Excel landet bei derselben Stelle');
  ok(A.messStelle({stelle:'hinten'})==='Reservoir hinten','«hinten» ebenso');
  ok(A.messStelle({})==='ohne Stelle','Ohne Angabe: «ohne Stelle», nicht geraten');
  ok(A.messStelle({stelle:'wurzelraum'})==='Wurzelraum'&&A.messStelle({stelle:'Tisch 3'})==='Tisch 3','Der Wurzelraum heisst gross geschrieben, fremde Angaben bleiben, wie sie sind');
  const d=A.leer();
  d.messungen=[{id:'1',datum:'2026-09-01',stelle:'Tisch 3',ph:6},{id:'2',datum:'2026-09-01',stelle:'hinten',ph:6},{id:'3',datum:'2026-09-01',stelle:'vorne',ph:6}];
  A.setDb(d);
  ok(A.tankStellen().join('|')==='Reservoir vorne|Reservoir hinten|Tisch 3','Im Reiter pH & EC: erst die Reservoirs, wie unter Einstellungen, dann der Rest');
}

console.log('\n════ Zwei Stände vereinigen ════');
{
  const mein={analysen:[{id:'a1'}],ereignisse:[{id:'e1'}],messungen:[{id:'m1'}],einst:{x:5},beigabeZeiten:[{id:'z1'}]};
  const fremd={analysen:[{id:'a1'},{id:'a2'}],ereignisse:[{id:'e1'},{id:'e2',wer:'MK'}],messungen:[{id:'m1'},{id:'m2',wer:'MK'},{id:'m3',wer:'AB'}],
    einst:{x:9},beigabeZeiten:[{id:'z2'}]};
  const v=A.vereinigen(mein,fremd);
  ok(v.db.messungen.length===3&&v.db.messungen.some(x=>x.id==='m3'),'Messungen vom Handy, die ich noch nicht hatte, kommen dazu');
  ok(v.db.ereignisse.length===2,'Gaben vom Handy ebenso');
  ok(v.db.analysen.length===2,'Und eine Analyse, die jemand anders eingelesen hat');
  ok(v.db.beigabeZeiten.length===2,'Eine Massnahme, die jemand anders gleichzeitig eingetragen hat, geht nicht verloren');
  ok(v.db.einst.x===5,'Einstellungen bleiben meine – der letzte Schreiber gewinnt dort');
  ok(v.dazu===5,'Gezählt wird, was übernommen wurde: '+v.dazu);
  const w=A.vereinigen({analysen:[],ereignisse:[],messungen:[]},{messungen:[{id:'geloescht'}]});
  ok(w.db.messungen.length===1&&w.dazu===1,'Was ich gelöscht hatte und der andere noch hat, kommt zurück – und wird gezählt, damit es gesagt werden kann');
  ok(A.vereinigen(mein,null).dazu===0,'Ohne fremden Stand passiert nichts');
}

console.log('\n════ Seit wann wird beigegeben? ════');
{
  const d=A.leer();
  const gabe=(datum,mittel,menge,einheit)=>({id:'g'+datum+mittel,datum,typ:'Zusatzdünger / Spurenelemente',mittel,menge,einheit,stelle:'beide',felder:{},geltung:'alle',saetze:[],quelle:'hand'});
  d.ereignisse=[gabe('2026-05-05','epsotop',500,'g'),gabe('2026-05-19','epsotop',500,'g'),gabe('2026-06-02','epsotop',500,'g'),
    gabe('2026-08-20','epsotop',500,'g'),gabe(tagVor(3),'epsotop',500,'g'),
    gabe('2026-06-10','kali',300,'g'),gabe('2026-06-24','zink',20,'g')];
  A.setDb(d);
  const mg=A.beigabeSpannenMittel('epsotop');
  console.log('   Magnesium:',mg.map(x=>x.von+'→'+x.bis+(x.laeuft?' läuft':'')+' ('+x.n+')').join(' | '));
  ok(mg.length===3,'Drei Spannen: Mai–Juni, dann August, dann jetzt – eine Lücke über '+A.BEIGABE_LUECKE+' Tage trennt');
  ok(mg[0].von==='2026-05-05'&&mg[0].bis==='2026-06-02'&&mg[0].n===3&&!mg[0].laeuft,'Die erste: 5.5. bis 2.6., drei Gaben, abgeschlossen');
  ok(mg[2].laeuft===true,'Die letzte läuft – die letzte Gabe ist keine vier Wochen her');
  const b=A.kmBalken();
  const txt=b.map(x=>x.text);
  console.log('   Balken:',txt.join(' | '));
  ok(b.length===5&&b.every(x=>x.tipp&&x.kennung),'Fünf Balken: drei für Magnesium, je einer für Kali und Zink; jeder mit Kästchen und Kennung');
  ok(txt.some(t=>/^Magnesium seit /.test(t))&&txt.includes('Magnesium 05.05.–02.06.'),'Text: «seit» für den laufenden, Datum bis Datum für den abgeschlossenen');
  ok(/Menge gesamt: <span class="w">1.500 g/.test(b.find(x=>/^Magnesium 05/.test(x.text)).tipp.replace(/&#39;/g,"'")),'Im Kästchen die Summe: 3 × 500 g');
  d.ereignisse.push({id:'neu',datum:tagVor(1),typ:'Tank neu angesetzt',mittel:null,stelle:'beide'});
  A.setDb(d);
  ok(A.beigabeSpannenMittel('epsotop')[2].laeuft===false,'Nach «Tank neu angesetzt» läuft nichts mehr weiter – mit dem Wasser ist auch das Mittel weg');
  ok(!/undefined|NaN/.test(A.vKombi()+A.vTank()),'Beide Diagramm-Reiter rendern mit den Balken sauber');
}

console.log('\n════ Stand in der Kopfzeile ════');
{
  A.setDb(A.leer());
  ok(/^$|gesichert|ungesicherte/.test(A.onlineStand()),'Im Datei-Modus wie bisher');
  A.ONLINE.an=true;A.ONLINE.zustand='fehler';A.ONLINE.fehler='Failed to fetch';
  ok(/nicht erreichbar/.test(A.onlineStand()),'Online ohne Server: «nicht erreichbar – Änderungen warten»');
  A.ONLINE.zustand='gesichert';A.ONLINE.geaendert='2026-09-26T08:21:00Z';A.ONLINE.von='hinten';
  ok(/online · gesichert/.test(A.onlineStand())&&/«hinten»/.test(A.onlineStand()),'Gesichert, mit dem, der zuletzt geschrieben hat');
  A.ONLINE.an=false;
}

console.log('\n════ Ergebnis ════');
console.log(fehler?`  ${fehler} FEHLER`:'  ✓ Alle Prüfungen bestanden.');
process.exit(fehler?1:0);
