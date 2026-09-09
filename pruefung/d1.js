/* Die Anwendung sichert sich selbst: eine HTML-Datei, Werkzeug und Daten in
   einem. Geprüft werden hier die beiden Textoperationen dahinter – das
   Einsetzen in das Abbild und das Herauslesen. Der ganze Weg durch den
   Browser steht in pruefung/rundreise.js. */
const A=require('./harness.js');
let fehler=0;
const ok=(b,t)=>{if(!b)fehler++;console.log((b?'  ✓ ':'  ✗ FEHLER ')+t)};

/* Ein Abbild, wie es beim Start entsteht: Datenblock leer. */
const GERUEST=`<!doctype html>
<html lang="de"><head><title>Basilikum</title></head><body>
<main id="view"></main>
<script type="application/json" id="datenblock">null<\/script>
<script>const APP=1;<\/script>
</body></html>`;

console.log('════ Einsetzen in das eigene Abbild ════');
{
  A.setSeite(GERUEST);
  const d=A.leer();
  d.analysen=[{id:'a1',typ:'blattsaft',datum:'2026-08-18',satz:'28-478',werte:{K:{wert:1040}},optima:{}}];
  d.ereignisse=[{id:'e1',datum:'2026-08-10',typ:'Düngergabe',notiz:'Test <\/script><img src=x onerror=alert(1)> & «Apostroph’',
    mittel:'biovin',menge:20,einheit:'l',jeReservoir:false,stelle:'beide',felder:{},geltung:'alle',saetze:[],quelle:'hand'}];
  A.setDb(d);
  const html=A.seiteMitDaten();
  ok(!!html,'Aus dem Abbild entsteht eine vollständige Seite');
  ok(html.indexOf('<main id="view">')>=0&&html.indexOf('const APP=1')>=0,'Das Werkzeug selbst ist unverändert darin');
  const bloecke=t=>(t.match(/<script type="application\/json" id="datenblock">/g)||[]).length;
  ok(bloecke(html)===1,'Es gibt genau einen Datenblock, nicht zwei');

  /* Der gefährlichste Fall: ein Skript-Ende im Text. Stünde es roh in der
     Datei, wäre das Dokument ab dort zerrissen – und der Rest würde als
     Markup gelesen. */
  const roh=html.slice(html.indexOf('id="datenblock">'),html.indexOf('<\/script>',html.indexOf('id="datenblock">')));
  ok(roh.indexOf('<\/script')<0,'Ein Skript-Ende im Text sprengt die Datei nicht');
  ok(roh.indexOf('\\u003c')>=0,'Es steht als \\u003c darin – im JSON dasselbe Zeichen');
  ok(html.indexOf('onerror=alert')>=0?roh.indexOf('onerror=alert')>=0:true,'Der Text selbst geht dabei nicht verloren');

  console.log('   Grösse:',Math.round(html.length/1024),'KB · Datenteil',Math.round(roh.length/1024),'KB');

  /* Zurücklesen muss exakt dasselbe ergeben. */
  const zurueck=A.datenAusText(html,'basilikum.html');
  ok(!zurueck.__fehler,'Die geschriebene Datei lässt sich wieder lesen');
  ok(zurueck.analysen.length===1&&zurueck.ereignisse.length===1,'Mit allen Beständen');
  ok(zurueck.ereignisse[0].notiz===d.ereignisse[0].notiz,'Der Text kommt zeichengenau zurück, samt Skript-Ende und Apostroph');
  ok(JSON.stringify(zurueck)===JSON.stringify(d),'Und der ganze Bestand ist identisch');
}

console.log('\n════ Zweimal sichern trägt den Bestand nicht doppelt ════');
{
  /* Das Abbild wird beim Start genommen, wenn der Block geleert ist. Würde es
     danach genommen, stünde in der zweiten Sicherung der erste Bestand noch
     einmal – und die Datei wüchse mit jedem Speichern. */
  A.setSeite(GERUEST);
  const d=A.leer();
  d.analysen=[{id:'a1',typ:'blattsaft',datum:'2026-08-18',werte:{},optima:{}}];
  A.setDb(d);
  const eins=A.seiteMitDaten();
  d.analysen.push({id:'a2',typ:'blattsaft',datum:'2026-08-19',werte:{},optima:{}});
  const zwei=A.seiteMitDaten();
  const zaehl=t=>(t.match(/<script type="application\/json" id="datenblock">/g)||[]).length;
  ok(zaehl(eins)===1&&zaehl(zwei)===1,'Auch nach dem zweiten Mal genau ein Datenblock');
  ok(Math.abs(zwei.length-eins.length)<400,'Die Datei wächst nur um den neuen Eintrag, nicht um den alten Bestand');
  ok(A.datenAusText(zwei,'x.html').analysen.length===2,'Und enthält den neuen Stand');
}

console.log('\n════ Öffnen: JSON und HTML ════');
{
  const d=A.leer();d.analysen=[{id:'a',typ:'blattsaft',datum:'2026-08-18',werte:{},optima:{}}];
  A.setDb(d);A.setSeite(GERUEST);
  ok(A.datenAusText(JSON.stringify(d),'x.json').analysen.length===1,'Eine reine Datendatei wird weiterhin angenommen');
  ok(A.datenAusText('  \n  '+JSON.stringify(d),'x.json').analysen.length===1,'Auch mit Leerraum davor');
  ok(A.datenAusText(A.seiteMitDaten(),'x.html').analysen.length===1,'Eine gesicherte HTML-Datei ebenso');

  const leerHtml=A.datenAusText(GERUEST,'werkzeug.html');
  ok(!!leerHtml.__fehler&&/leere Werkzeug/.test(leerHtml.__fehler),'Das leere Werkzeug sagt, dass keine Daten darin sind');
  console.log('   ',leerHtml.__fehler);

  const ohne=A.datenAusText('<html><body>irgendeine Seite</body></html>','fremd.html');
  ok(!!ohne.__fehler&&/kein Datenblock/.test(ohne.__fehler),'Eine fremde HTML-Datei wird benannt, nicht stillschweigend ignoriert');
  console.log('   ',ohne.__fehler);

  const kaputt=A.datenAusText(GERUEST.replace('null','{"analysen":[,]}'),'kaputt.html');
  ok(!!kaputt.__fehler&&/beschädigt/.test(kaputt.__fehler),'Ein beschädigter Datenblock wird als solcher gemeldet');
  console.log('   ',kaputt.__fehler);

  const keinJson=A.datenAusText('{ das ist kein json','x.json');
  ok(!!keinJson.__fehler,'Und eine kaputte JSON-Datei auch');
}

console.log('\n════ Ohne Abbild wird nichts erfunden ════');
{
  A.setSeite(null);
  ok(A.seiteMitDaten()===null,'Ohne Abbild gibt es keine HTML-Sicherung – die App weicht dann auf JSON aus');
  A.setSeite('<html><body>ohne Block</body></html>');
  ok(A.seiteMitDaten()===null,'Und ohne Datenblock im Abbild ebenso');
}

console.log('\n════ Ergebnis ════');
console.log(fehler?`  ${fehler} FEHLER`:'  ✓ Alle Prüfungen bestanden.');
process.exit(fehler?1:0);
