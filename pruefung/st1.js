/* Entnahmestellen zuordnen. Das Labor schreibt auf jeden Bericht etwas
   anderes; zusammengefasst wird trotzdem nur, was ein Mensch bestätigt hat.
   Gearbeitet wird mit den vier echten Berichten. */
const A=require('./harness.js');
let fehler=0;
const ok=(b,t)=>{if(!b)fehler++;console.log((b?'  ✓ ':'  ✗ FEHLER ')+t)};
const FIX=require('./giesswasser.json');

function bestand(){
  const d=A.leer();
  for(const n of Object.keys(FIX)){
    const r=A.parseGiess(FIX[n].seiten,FIX[n].punkte);
    r.proben.forEach((p,i)=>d.analysen.push(Object.assign({id:n+i,typ:'giesswasser',labor:r.labor,
      herkunft:'ruecklauf',symptom:'unbekannt',gewaschen:null},p)));
  }
  A.setDb(d);return d;
}

console.log('════ Was auf den echten Berichten steht ════');
{
  const d=bestand();
  const liste=A.stellenListe();
  liste.forEach(x=>console.log('   '+x.roh.padEnd(20)+x.n+' Probe'+(x.n>1?'n':' ')+'  '+
    (x.vorschlag?'Vorschlag: '+x.vorschlag.name+(x.vorschlag.vorbehalt?'  ⚠':''):'kein Vorschlag')));
  ok(liste.length===4,'Vier verschiedene Bezeichnungen für zwei Reservoirs');
  ok(d.analysen.length===5,'Fünf Proben insgesamt – ein Bericht enthielt zwei');
  ok(liste.every(x=>x.zustand.offen),'Ohne Zutun ist nichts zugeordnet – die App fasst nichts von sich aus zusammen');
  ok(liste.every(x=>x.n>0&&x.von&&x.bis),'Jede Bezeichnung nennt Anzahl und Zeitraum');
}

console.log('\n════ Der Vorschlag – ein Vorschlag, keine Tat ════');
{
  bestand();
  ok(A.stellenVorschlag('Reservoir Vorne').id==='v','«Reservoir Vorne» → vorne');
  ok(A.stellenVorschlag('Basilikum RV').id==='v','«Basilikum RV» → vorne, über die Abkürzung RV');
  ok(A.stellenVorschlag('Hinter, Ohne H2O2').id==='h','«Hinter, Ohne H2O2» → hinten');
  ok(A.stellenVorschlag('Reservoir 1')===null,'Was sich nicht ableiten lässt, bleibt ohne Vorschlag');
  ok(A.stellenVorschlag('vorne und hinten')===null,'Und Mehrdeutiges erst recht');
  const v=A.stellenVorschlag('Vorne, mitt H2O2');
  ok(v.id==='v'&&!!v.vorbehalt,'Eine behandelte Probe bekommt den Vorschlag MIT Vorbehalt');
  console.log('   ',v.vorbehalt);
  ok(!A.stellenVorschlag('Hinter, Ohne H2O2').vorbehalt,'«Ohne H2O2» ist kein Vorbehalt – das ist der Normalfall');
  /* Nichts davon darf von selbst wirken */
  ok(A.stellenListe().every(x=>x.zustand.offen),'Der blosse Vorschlag ändert nichts am Bestand');
}

console.log('\n════ Zuordnen ════');
{
  bestand();
  A.AKTION.stelleVorschlagAlle();
  const liste=A.stellenListe();
  console.log('   nach «Vorschläge übernehmen»:',liste.map(x=>x.roh+' → '+x.zustand.name).join(' | '));
  ok(liste.filter(x=>x.zustand.id==='v').length===3,'Drei Bezeichnungen zeigen jetzt auf «Reservoir vorne»');
  ok(liste.filter(x=>x.zustand.id==='h').length===1,'Eine auf «Reservoir hinten»');
  ok(liste.every(x=>!x.zustand.offen),'Nichts bleibt offen');

  /* Die Ausnahme wieder herausnehmen */
  A.AKTION.stelleZu({roh:'Vorne, mitt H2O2',id:''});
  const z=A.stelleVon({stelle:'Vorne, mitt H2O2'});
  ok(z.aus===true,'«nicht verwenden» schliesst eine Bezeichnung aus');
  ok(A.gwSichtbar({stelle:'Vorne, mitt H2O2'})===false,'Ihre Proben bilden keine Reihe mehr');
  ok(A.gwProben().some(a=>a.stelle==='Vorne, mitt H2O2'),'Im Bestand bleiben sie aber vollständig – nichts wird gelöscht');

  /* Wieder öffnen */
  A.AKTION.stelleZu({roh:'Vorne, mitt H2O2',id:'offen'});
  ok(A.stelleVon({stelle:'Vorne, mitt H2O2'}).offen===true,'Und lässt sich wieder aufheben');
  /* Derselbe Knopf noch einmal hebt die Zuordnung auf */
  ok(A.stelleVon({stelle:'Basilikum RV'}).id==='v','«Basilikum RV» ist zugeordnet');
  A.AKTION.stelleZu({roh:'Basilikum RV',id:'v'});
  ok(A.stelleVon({stelle:'Basilikum RV'}).offen===true,'Derselbe Knopf noch einmal hebt die Zuordnung auf');
  A.AKTION.stelleZu({roh:'Basilikum RV',id:'h'});
  ok(A.stelleVon({stelle:'Basilikum RV'}).id==='h','Und ein anderer Knopf ordnet um, ohne Umweg');
}

console.log('\n════ Wirkung auf die Reihen ════');
{
  bestand();
  const vorher=new Set(A.gwProben().map(A.stelleSchluessel)).size;
  A.AKTION.stelleVorschlagAlle();
  A.AKTION.stelleZu({roh:'Vorne, mitt H2O2',id:''});
  const nachher=new Set(A.gwProben().filter(A.gwSichtbar).map(A.stelleSchluessel)).size;
  console.log('   Reihen vorher:',vorher,'· nachher:',nachher);
  ok(vorher===4&&nachher===2,'Aus vier Reihen werden die zwei Reservoirs, die es wirklich gibt');
  const h=A.vGiess();
  ok(!/undefined|NaN|\[object Object\]/.test(h),'Der Reiter Giesswasser rendert sauber');
  ok(/Reservoir vorne/.test(h)&&/Reservoir hinten/.test(h),'Und zeigt die zugeordneten Namen');
  ok(/auf dem Bericht|zugeordnet:/.test(h),'Die Bezeichnung des Labors bleibt dabei nachlesbar');
  ok(/Stellen zuordnen/.test(h),'Der Knopf steht im Reiter');
  const v=A.vVerlauf();
  ok(/Stellen zuordnen/.test(v),'Auch im Reiter Verlauf');
}

console.log('\n════ Der Dialog ════');
{
  bestand();
  A.AKTION.stellen();
  const b=global.document.getElementById('dlgBody').innerHTML;
  ok(/Entnahmestellen|Bezeichnung auf dem Bericht/.test(b),'Der Dialog öffnet');
  ok((b.match(/data-tun="stelleZu"/g)||[]).length>=12,'Je Bezeichnung eine Knopfreihe – ohne Ziehen und Fallenlassen');
  ok(/Vorschläge übernehmen/.test(b),'Der Sammelknopf erscheint, solange etwas offen ist');
  ok(/nicht verwenden/.test(b),'Ausschliessen ist eine eigene Wahl, kein Weglassen');
  ok(/Wasserstoffperoxid/.test(b),'Der Vorbehalt zur behandelten Probe steht im Dialog');
  ok(/data-tun="stelleNeu"/.test(b)&&/data-aend="stelleName"/.test(b),'Stellen lassen sich anlegen und umbenennen');
  ok(/noch nicht zugeordnet/.test(b),'Und es steht da, wieviel noch offen ist');

  /* Umbenennen wirkt bis in die Diagramme */
  A.AKTION.stelleVorschlagAlle();
  A.AKTION.stelleName({id:'v'},{target:{value:'Tisch West'}});
  ok(/Tisch West/.test(A.vGiess()),'Ein neuer Name erscheint überall');
  /* Eine Stelle entfernen gibt ihre Bezeichnungen wieder frei */
  A.AKTION.stelleWeg({id:'v'});
  ok(A.stellenListe().filter(x=>x.zustand.offen).length===3,'Wird eine Stelle entfernt, werden ihre Bezeichnungen wieder offen');
  ok(!/undefined/.test(A.vGiess()),'Und der Reiter bleibt heil');
}

console.log('\n════ Escaping ════');
{
  const d=bestand();
  d.analysen[0].stelle='Reservoir <img src=x onerror=alert(1)> «vorne»';
  A.setDb(d);
  A.AKTION.stellen();
  const b=global.document.getElementById('dlgBody').innerHTML;
  ok(b.indexOf('<img src=x')<0,'Kein eingeschleustes Markup aus einer Bezeichnung');
  ok(/&lt;img/.test(b),'Sie steht als Text da');
  A.AKTION.stelleZu({roh:'Reservoir <img src=x onerror=alert(1)> «vorne»',id:'v'});
  ok(A.stelleVon({stelle:'Reservoir <img src=x onerror=alert(1)> «vorne»'}).id==='v','Und lässt sich trotzdem zuordnen');
  ok(A.vGiess().indexOf('<img src=x')<0,'Auch im Reiter nicht');
}

console.log('\n════ Migration ════');
{
  const r=A.migriere({schema:7,analysen:[
    {id:'a',typ:'giesswasser',datum:'2026-08-06',stelle:'Hinter, Ohne H2O2',werte:{},optima:{}},
    {id:'b',typ:'giesswasser',datum:'2026-08-18',stelle:'Reservoir Vorne',werte:{},optima:{}},
    {id:'c',typ:'giesswasser',datum:'2026-09-01',stelle:'Basilikum RV',werte:{},optima:{}}],
    ereignisse:[],messungen:[],rundgaenge:[],fotos:[],saetze:{},eigeneOptima:{},einst:{}});
  ok(r.db.schema===8,'Schema auf 8 gehoben');
  ok(r.db.stellen&&r.db.stellen.gruppen.length===2,'Zwei Stellen sind angelegt – so viele Reservoirs gibt es');
  ok(Object.keys(r.db.stellen.zu).length===0,'Aber nichts ist zugeordnet: das entscheidet der Mensch');
  const n=r.notizen.filter(x=>/Bezeichnungen/.test(x));
  console.log('   ',n[0]);
  ok(n.length===1,'Die Migration sagt, dass es mehr Bezeichnungen als Reservoirs gibt');
  ok(/es geht also nichts verloren|nichts verloren/.test(n[0]),'Und dass bis zur Zuordnung nichts verloren geht');
}

console.log('\n════ Ergebnis ════');
console.log(fehler?`  ${fehler} FEHLER`:'  ✓ Alle Prüfungen bestanden.');
process.exit(fehler?1:0);
