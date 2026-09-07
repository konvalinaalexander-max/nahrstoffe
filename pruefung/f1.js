/* Fotos: Migration, Fotospur im Diagramm, Escaping, Groessenwarnung.
   Das Verkleinern selbst braucht ein <canvas> und wird in browser.js geprueft. */
const A=require('./harness.js');
let fehler=0;
const ok=(b,t)=>{if(!b)fehler++;console.log((b?'  ✓ ':'  ✗ FEHLER ')+t)};

/* ein winziges, echtes JPEG als Data-URL (1x1 Pixel) */
const MINI='data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/wAALCAABAAEBAREA/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAD8AKp//2Q==';

console.log('════ Migration von Schema 5 auf 6 ════');
{
  const alt={schema:5,analysen:[],ereignisse:[{id:'e1',datum:'2026-07-01',typ:'pH-Korrektur'}],
    messungen:[{id:'m1',datum:'2026-07-01',ph:6.4,ec:1.2}],rundgaenge:[],saetze:{},eigeneOptima:{}};
  const r=A.migriere(JSON.parse(JSON.stringify(alt)));
  r.notizen.forEach(n=>console.log('   ·',n));
  ok(r.db.schema===6,'Schema auf 6 gehoben');
  ok(Array.isArray(r.db.fotos)&&r.db.fotos.length===0,'Fotoablage leer angelegt');
  ok(r.db.produkte&&r.db.produkte.biovin&&r.db.produkte.epsotop,'Produktstammdaten angelegt');
  ok(r.db.produkte.biovin.gehalt.N_gesamt===9&&r.db.produkte.epsotop.gehalt.Mg===9.86,'Mit den Etikettwerten vorbelegt');
  ok(r.db.einst.systemLiter===20000,'Systemvolumen mit 20 000 Litern vorbelegt');
  ok(r.db.messungen[0].quelle==='hand','Bestehende Messungen als von Hand erfasst gekennzeichnet');
  ok(r.db.ereignisse[0].quelle==='hand','Bestehende Logbucheintraege ebenso');
  ok(r.notizen.some(n=>/Fotoablage/.test(n)),'Die Migration sagt, dass es eine Fotoablage gibt');
  ok(r.notizen.some(n=>/Produktstammdaten/.test(n)),'Und dass Produktstammdaten angelegt wurden');
  ok(r.db.analysen.length===0&&r.db.ereignisse.length===1,'Bestehende Daten bleiben unveraendert');
}

console.log('\n════ Fotospur im Diagramm ════');
{
  const d=A.leer();
  d.fotos=[
    {id:'f1',datum:'2026-07-14',titel:'Spitze aufgehellt',satz:'28-478',etage:'Spitze / jüngstes Blatt',notiz:'',daten:MINI},
    {id:'f2',datum:'2026-07-14',titel:'Wurzelballen',satz:'28-478',etage:'Wurzel',notiz:'',daten:MINI},
    {id:'f3',datum:'2026-08-18',titel:'Bestand',satz:'28-478',etage:'Bestand',notiz:'',daten:MINI}];
  A.setDb(d);
  const gr=A.fotoGruppen();
  console.log('   Gruppen:',gr.map(g=>g.datum+' ('+g.anzahl+')').join(' · '));
  ok(gr.length===2,'Fotos werden je Tag gebuendelt');
  ok(gr[0].anzahl===2&&gr[1].anzahl===1,'Die Anzahl je Tag stimmt');
  ok(gr[0].x<gr[1].x,'Nach Datum sortiert');
  ok(/Spitze aufgehellt|2 Fotos/.test(gr[0].tipp),'Das Infokaestchen nennt den Inhalt');
  ok(gr[0].tipp.indexOf('<img')>=0,'Und enthaelt ein Vorschaubild');

  const box={clientWidth:900,innerHTML:''};
  A.chartPunkte(box,{serien:[{id:'s',name:'K',farbe:'#2C7A4B',form:'kreis',
      punkte:[{x:+new Date('2026-07-14'),y:1200,xtext:'14.07.',tipp:'x'},
              {x:+new Date('2026-08-18'),y:1400,xtext:'18.08.',tipp:'x'}]}],
    yTyp:'wert',xTyp:'datum',xLabel:'Probendatum',fotos:gr});
  const svg=box.innerHTML;
  const marken=(svg.match(/data-tun="fotoTag"/g)||[]).length;
  console.log('   Kamerasymbole im Diagramm:',marken);
  ok(marken===2,'Je Tag ein Kamerasymbol');
  ok(/data-datum="2026-07-14"/.test(svg),'Das Symbol traegt sein Datum');
  ok(/>2<\/text>/.test(svg),'Mehrere Fotos desselben Tages zeigen die Anzahl');
  ok(/Fotos<\/text>/.test(svg),'Die Spur ist beschriftet');

  /* ohne Fotos keine Spur, und das Diagramm bleibt gleich hoch */
  const box2={clientWidth:900,innerHTML:''};
  A.chartPunkte(box2,{serien:[{id:'s',name:'K',farbe:'#2C7A4B',form:'kreis',
      punkte:[{x:+new Date('2026-07-14'),y:1200,xtext:'14.07.',tipp:'x'}]}],
    yTyp:'wert',xTyp:'datum',xLabel:'Probendatum'});
  ok(box2.innerHTML.indexOf('fotoTag')<0,'Ohne Fotos wird keine Spur gezeichnet');
  const hoeheMit=+(svg.match(/height="(\d+)"/)||[])[1];
  const hoeheOhne=+(box2.innerHTML.match(/height="(\d+)"/)||[])[1];
  console.log('   Diagrammhoehe mit Spur',hoeheMit,'· ohne',hoeheOhne);
  ok(hoeheMit>hoeheOhne,'Die Spur bekommt eigenen Platz und verdeckt keinen Messpunkt');

  /* Auf der Kulturwochen-Achse ergibt eine Datumsspur keinen Sinn */
  const box3={clientWidth:900,innerHTML:''};
  A.chartPunkte(box3,{serien:[{id:'s',name:'K',farbe:'#2C7A4B',form:'kreis',
      punkte:[{x:3,y:1200,xtext:'3 W',tipp:'x'}]}],yTyp:'wert',xTyp:'zahl',xLabel:'Woche',fotos:gr});
  ok(box3.innerHTML.indexOf('fotoTag')<0,'Auf einer Nicht-Datumsachse erscheint keine Fotospur');
}

console.log('\n════ Escaping von Titel und Notiz ════');
{
  const d=A.leer();
  d.fotos=[{id:'f1',datum:'2026-07-14',titel:"Test mit ' Apostroph & <Zeichen>",
    notiz:'<img src=x onerror=alert(1)>',satz:null,etage:null,daten:MINI}];
  A.setDb(d);
  const h=A.vFotos();
  ok(h.indexOf('<Zeichen>')<0,'Der Titel schleust kein Markup ein');
  ok(h.indexOf('onerror=alert')<0,'Die Notiz ebenso wenig');
  ok(/Test mit &#39; Apostroph &amp; &lt;Zeichen&gt;/.test(h),'Und erscheint maskiert als Text');
  const gr=A.fotoGruppen();
  ok(gr[0].tipp.indexOf('<Zeichen>')<0,'Auch im Infokaestchen des Diagramms');
}

console.log('\n════ Groesse der Sicherungsdatei ════');
{
  const d=A.leer();
  d.fotos=[{id:'f1',datum:'2026-07-14',titel:'klein',daten:MINI}];
  A.setDb(d);
  const klein=A.vFotos();
  ok(/Sicherungsdatei rund/.test(klein),'Die Groesse der Sicherungsdatei wird immer angezeigt');
  ok(!/gross geworden/.test(klein),'Bei kleiner Datei keine Warnung');

  /* eine kuenstlich grosse Ablage: die Warnung muss kommen */
  const gross='data:image/jpeg;base64,'+'A'.repeat(3*1024*1024);
  d.fotos=[];
  for(let i=0;i<15;i++)d.fotos.push({id:'g'+i,datum:'2026-07-14',titel:'gross '+i,daten:gross});
  A.setDb(d);
  const h=A.vFotos();
  ok(/gross geworden/.test(h),'Ab 40 MB warnt die App vor der Dateigroesse');
  ok(/Messwerte bleiben davon unberührt/.test(h),'Und sagt, dass Loeschen die Messwerte nicht antastet');
}

console.log('\n════ Leerer Zustand ════');
{
  A.setDb(A.leer());
  const h=A.vFotos();
  ok(/Noch keine Fotos/.test(h),'Der leere Zustand erklaert, wozu Fotos gut sind');
  ok(!/undefined|NaN|\[object Object\]/.test(h),'Und rendert sauber');
  ok(A.fotoGruppen().length===0,'Ohne Fotos keine Gruppen');
}

console.log('\n════ Ergebnis ════');
console.log(fehler?`  ${fehler} FEHLER`:'  ✓ Alle Pruefungen bestanden.');
process.exit(fehler?1:0);
