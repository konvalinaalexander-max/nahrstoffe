/* Online-Bausteine ohne Browser: das Vereinigen zweier Stände, die
   Sauerstoff-Sättigungsgrenze, die Stellen-Zuordnung von Messungen, die
   Satzpaare und die Migration auf Schema 9. */
const A=require('./harness.js');
let fehler=0;
const ok=(b,t)=>{if(!b)fehler++;console.log((b?'  ✓ ':'  ✗ FEHLER ')+t)};
const tagVor=n=>{const d=new Date();d.setUTCDate(d.getUTCDate()-n);return d.toISOString().slice(0,10)};

console.log('════ Schema 9 ════');
{
  const r=A.migriere({schema:8,analysen:[],ereignisse:[{id:'e1',datum:'2026-09-01',typ:'Düngergabe',mittel:'biovin',menge:20}],
    messungen:[{id:'m1',datum:'2026-09-01',ph:6.2,ec:1.8}],rundgaenge:[],fotos:[],saetze:{},eigeneOptima:{},einst:{}});
  ok(r.db.schema===10,'Schema auf 10 gehoben');
  ok(r.db.messungen[0].o2===null&&r.db.messungen[0].o2sat===null&&r.db.messungen[0].wer===null,'Alte Messungen: Sauerstoff und Kürzel auf null – nichts geraten');
  ok(r.db.ereignisse[0].wer===null,'Alte Logbucheinträge: Kürzel auf null');
  ok(r.db.einst.hoeheM===440,'Die Höhenlage steht auf 440 m (Schwerzenbach) und ist einstellbar');
  ok(r.notizen.some(n=>/Sauerstoff/.test(n)),'Die Migration sagt, was neu ist');
  const n=A.migriere({schema:9,analysen:[],ereignisse:[],messungen:[],rundgaenge:[],fotos:[],saetze:{},eigeneOptima:{},einst:{},plan:{zielwochen:[2,4,6]}});
  ok(JSON.stringify(n.db.plan.zielwochen)==='[2,4]'&&n.notizen.some(x=>/Zielwochen/.test(x)),'Die alte Vorgabe 2, 4, 6 wird auf 2 und 4 gehoben – mit Notiz, wo es änderbar ist');
  ok(n.db.einst.dauerSommer===4&&n.db.einst.dauerWinter===6,'Kulturdauer 4 (Sommer) und 6 (Winter) statt 7 und 10');
  const eig=A.migriere({schema:9,analysen:[],ereignisse:[],messungen:[],rundgaenge:[],fotos:[],saetze:{},eigeneOptima:{},einst:{dauerSommer:5,dauerWinter:9},plan:{zielwochen:[3,5]}});
  ok(JSON.stringify(eig.db.plan.zielwochen)==='[3,5]'&&eig.db.einst.dauerSommer===5,'Wer eigene Werte gesetzt hatte, behält sie');
  ok(JSON.stringify(A.leer().plan.zielwochen)==='[2,4]','Ein neuer Bestand: Zielwochen 2 und 4');
}

console.log('\n════ Sauerstoff: Sättigungsgrenze ════');
{
  const g=(t,h)=>+A.o2Saettigung(t,h).toFixed(2);
  console.log('   20 °C: Meer',g(20,0),'· 440 m',g(20,440),'· 10 °C',g(10,0),'· 30 °C',g(30,0));
  ok(g(20,0)===9.09,'20 °C auf Meereshöhe: 9,09 mg/l – der Tabellenwert');
  ok(g(20,440)<g(20,0)&&g(20,440)>8.4,'In Schwerzenbach (440 m) rund 5 % weniger');
  ok(g(10,0)>g(20,0)&&g(20,0)>g(30,0),'Kälteres Wasser löst mehr Sauerstoff');
  ok(Math.abs(g(12.5,0)-(A.O2_LOESLICH[2][1]+A.O2_LOESLICH[3][1])/2)<0.01,'Zwischen den Stützstellen wird linear gerechnet');
  ok(A.o2Saettigung(null,440)===null,'Ohne Temperatur keine Grenze – und kein erfundener Wert');
}

console.log('\n════ Messungen zu Stellen ════');
{
  A.setDb(A.leer());
  ok(A.messStelle({stelle:'Reservoir vorne'})==='Reservoir vorne','Der Name der Stelle, wie ihn das Handy schickt');
  ok(A.messStelle({stelle:'vorne'})==='Reservoir vorne','«vorne» aus Excel landet bei derselben Stelle');
  ok(A.messStelle({stelle:'hinten'})==='Reservoir hinten','«hinten» ebenso');
  ok(A.messStelle({})==='ohne Stelle','Ohne Angabe: «ohne Stelle», nicht geraten');
  ok(A.messStelle({stelle:'wurzelraum'})==='wurzelraum','Fremde Angaben bleiben, wie sie sind');
}

console.log('\n════ Zwei Stände vereinigen ════');
{
  const mein={analysen:[{id:'a1'}],ereignisse:[{id:'e1'}],messungen:[{id:'m1'}],fotos:[],rundgaenge:[],plan:{geplant:[{id:'p1'}]},einst:{toleranz:5}};
  const fremd={analysen:[{id:'a1'},{id:'a2'}],ereignisse:[{id:'e1'}],messungen:[{id:'m1'},{id:'m2',wer:'MK'},{id:'m3',wer:'AB'}],
    plan:{geplant:[{id:'p1'},{id:'p2'}]},einst:{toleranz:9}};
  const v=A.vereinigen(mein,fremd);
  ok(v.db.messungen.length===3&&v.db.messungen.some(x=>x.id==='m3'),'Messungen vom Handy, die ich noch nicht hatte, kommen dazu');
  ok(v.db.analysen.length===2,'Eine Analyse, die jemand anders eingelesen hat, ebenso');
  ok(v.db.plan.geplant.length===2,'Und geplante Proben');
  ok(v.db.einst.toleranz===5,'Einstellungen bleiben meine – der letzte Schreiber gewinnt dort');
  ok(v.dazu===4,'Gezählt wird, was übernommen wurde: '+v.dazu);
  /* Der ehrliche Haken: was ich gerade geloescht hatte, kommt zurueck */
  const w=A.vereinigen({analysen:[],ereignisse:[],messungen:[],fotos:[],rundgaenge:[]},{messungen:[{id:'geloescht'}]});
  ok(w.db.messungen.length===1&&w.dazu===1,'Was ich gelöscht hatte und der andere noch hat, kommt zurück – und wird gezählt, damit es gesagt werden kann');
  ok(A.vereinigen(mein,null).dazu===0,'Ohne fremden Stand passiert nichts');
}

console.log('\n════ Satzpaare ════');
{
  const d=A.leer();
  d.saetze={'29':{aussaat:tagVor(28)},'31':{aussaat:tagVor(14)},'33':{aussaat:tagVor(0)},'27':{aussaat:tagVor(42)}};
  A.setDb(d);
  const sp=A.satzpaare();
  ok(JSON.stringify(sp.wochen)==='[2,4]','Die Zielwochen 2 und 4');
  const n=sp.naechste;
  console.log('   nächste Einsendung:',n.datum,'·',n.proben.map(p=>'Satz '+p.satz+' W'+p.woche).join(' + '));
  ok(n&&n.datum===tagVor(0)&&n.vollstaendig,'Die nächste Einsendung ist heute und vollständig');
  ok(n.proben.some(p=>p.satz==='31'&&p.woche===2)&&n.proben.some(p=>p.satz==='29'&&p.woche===4),'Satz 31 in Woche 2 und Satz 29 in Woche 4 – genau das Schema');
  const z29=sp.zeilen.find(z=>z.satz==='29');
  ok(z29.zellen[0].zustand==='verpasst'&&z29.zellen[1].zustand==='jetzt','Satz 29: Woche 2 verpasst, Woche 4 jetzt fällig');
  const z27=sp.zeilen.find(z=>z.satz==='27');
  ok(z27.zellen.every(c=>c.zustand==='verpasst'),'Ein alter Satz ohne Proben: beide verpasst – so steht es da, statt zu verschwinden');
  /* Eine Probe nahe am Stichtag zaehlt */
  d.analysen=[{id:'x',typ:'blattsaft',datum:tagVor(1),satz:'31',blattalter:'jung',werte:{K:{wert:4000}},optima:{K:[3975,4800]}}];
  A.setDb(d);
  const sp2=A.satzpaare();
  const z31=sp2.zeilen.find(z=>z.satz==='31');
  ok(z31.zellen[0].zustand==='da'&&z31.zellen[0].abstand===-1,'Eine Probe einen Tag vor dem Stichtag gilt als Woche 2, mit Abstand −1');
  ok(sp2.naechste.proben.every(p=>p.satz!=='31'||p.woche!==2),'Und steht nicht mehr in der nächsten Einsendung');
  /* Einplanen legt beide an */
  A.AKTION.paarPlanen();
  ok(A.getDb().plan.geplant.filter(g=>/Satzpaar/.test(g.zweck)).length>=1,'«Einplanen» legt die fehlenden Proben als Termine an');
  A.AKTION.paarPlanen();
  const n2=A.getDb().plan.geplant.filter(g=>/Satzpaar/.test(g.zweck)).length;
  A.AKTION.paarPlanen();
  ok(A.getDb().plan.geplant.filter(g=>/Satzpaar/.test(g.zweck)).length===n2,'Ein zweites Mal legt nichts doppelt an');
  const h=A.vPlaner();
  ok(/Satzpaare · Woche 2 und Woche 4/.test(h)&&!/undefined|NaN/.test(h),'Die Karte im Planer rendert sauber');
  ok(/Nächste Einsendung/.test(h),'Und nennt die nächste Einsendung');
}

console.log('\n════ Seit wann wird beigegeben? ════');
{
  const d=A.leer();
  const gabe=(datum,mittel,menge,einheit)=>({id:'g'+datum+mittel,datum,typ:'Zusatzdünger / Spurenelemente',mittel,menge,einheit,stelle:'beide',felder:{},geltung:'alle',saetze:[],quelle:'hand'});
  d.ereignisse=[gabe('2026-05-05','epsotop',500,'g'),gabe('2026-05-19','epsotop',500,'g'),gabe('2026-06-02','epsotop',500,'g'),
    gabe('2026-08-20','epsotop',500,'g'),gabe(tagVor(3),'epsotop',500,'g'),
    gabe('2026-06-10','kali',300,'g'),gabe('2026-06-24','zink',20,'g')];
  A.setDb(d);
  ok(A.beigabeProdukte('Mg').includes('epsotop'),'Magnesium kommt aus Epsotop – über den Gehalt vom Etikett');
  ok(A.beigabeProdukte('K').includes('kali')&&A.beigabeProdukte('Zn').includes('zink'),'Kali und Zink über «liefert», auch ohne hinterlegten Gehalt');
  ok(A.beigabeProdukte('P').length===0,'Phosphor liefert keines der Produkte – kein Band');
  const mg=A.beigabeSpannen('Mg');
  console.log('   Magnesium:',mg.map(x=>x.von+'→'+x.bis+(x.laeuft?' läuft':'')+' ('+x.n+')').join(' | '));
  ok(mg.length===3,'Drei Spannen: Mai–Juni, dann August, dann jetzt – eine Lücke über '+A.BEIGABE_LUECKE+' Tage trennt');
  ok(mg[0].von==='2026-05-05'&&mg[0].bis==='2026-06-02'&&mg[0].n===3&&!mg[0].laeuft,'Die erste: 5.5. bis 2.6., drei Gaben, abgeschlossen');
  ok(mg[2].laeuft===true,'Die letzte läuft – die letzte Gabe ist keine vier Wochen her');
  const b=A.beigabeBalken(['Mg','K','P'],{Mg:'#8A7118',K:'#A2432E'});
  ok(b.length===4&&b.every(x=>x.tipp&&x.kennung),'Balken für Mg und K, keiner für P; jeder mit Kästchen und Kennung');
  ok(b.some(x=>/Magnesium seit/.test(x.text))&&b.some(x=>/Magnesium 05\.05\./.test(x.text)),'Text: «seit» für die laufende, Datum bis Datum für die abgeschlossene');
  const h=A.vNaehr();
  ok(!/undefined|NaN/.test(h),'Der Reiter Nährstoffe rendert mit Bändern sauber');
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
