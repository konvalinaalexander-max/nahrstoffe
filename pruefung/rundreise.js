/* Der ganze Weg im echten Browser: Daten erfassen, als HTML sichern, die
   gesicherte Datei frisch öffnen und weiterarbeiten. Das ist die Prüfung,
   die zählt – alles Übrige daran lässt sich nur im Browser feststellen.
   Aufruf:
     CHROME=… NODE_PATH=… BILDER=…/bilder node pruefung/rundreise.js        */
const {chromium}=require('playwright');
const fs=require('fs'),path=require('path'),os=require('os');
const app=path.resolve(__dirname,'..','basilikum.html');
const daten=__dirname+'/testdaten.json';
const ordner=process.env.RUND||fs.mkdtempSync(path.join(os.tmpdir(),'basilikum-rund-'));
let fehler=0;
const ok=(b,t)=>{if(!b)fehler++;console.log((b?'  ✓ ':'  ✗ FEHLER ')+t)};

(async()=>{
  const b=await chromium.launch(process.env.CHROME?{executablePath:process.env.CHROME,args:['--no-sandbox']}:{});
  const seite=async()=>{
    const p=await b.newPage({viewport:{width:1280,height:1000}});
    const stoerung=[];
    p.on('pageerror',e=>stoerung.push('pageerror: '+e.message));
    p.on('console',m=>{const t=m.text();if(m.type()==='error'&&!/Failed to load resource|net::ERR_/.test(t))stoerung.push('console: '+t)});
    p.on('dialog',async d=>{stoerung.push('ALARMFENSTER: '+d.message);await d.dismiss()});
    return {p,stoerung};
  };

  console.log('════ Erfassen ════');
  const {p,stoerung}=await seite();
  await p.goto('file://'+app);await p.waitForTimeout(1400);
  ok(await p.$eval('#datenblock',e=>e.textContent.trim())==='null',
     'Das ausgelieferte Werkzeug ist leer – im Datenblock steht «null»');
  await p.setInputFiles('#fileJson',daten);await p.waitForTimeout(900);

  /* Ein Text, der die Datei zerreissen würde, wenn er roh eingesetzt würde. */
  const GIFT='Ende </'+'script><img src=x onerror=alert(1)> & «Apostroph’ ünd ß';
  await p.click('#nav button:text-is("Logbuch")');await p.waitForTimeout(400);
  await p.fill('#lbForm [data-f="notiz"]',GIFT);
  await p.click('#lbForm button:text-is("Eintragen")');await p.waitForTimeout(500);

  if(process.env.BILDER){
    await p.click('#nav button:text-is("Fotos")');await p.waitForTimeout(300);
    await p.setInputFiles('#fileFoto',[process.env.BILDER+'/bestand-gross.png']);
    await p.waitForTimeout(2500);
    await p.click('#dlgFoot button:text-is("Übernehmen")');await p.waitForTimeout(900);
  }
  const vor=await p.evaluate(()=>({an:db.analysen.length,ev:db.ereignisse.length,me:db.messungen.length,
    fo:db.fotos.length,schema:db.schema,notiz:db.ereignisse.map(e=>e.notiz).filter(Boolean).pop(),
    bytes:db.fotos.reduce((s,f)=>s+(f.daten||'').length,0)}));
  console.log('   Bestand:',vor.an,'Analysen ·',vor.ev,'Logbuch ·',vor.fo,'Fotos ·',Math.round(vor.bytes/1024),'KB Bilddaten');

  console.log('\n════ Sichern: eine Datei, alles darin ════');
  const dl=p.waitForEvent('download');
  await p.click('header button:text-is("Sichern")');
  const d=await dl;
  const ziel=path.join(ordner,d.suggestedFilename());
  await d.saveAs(ziel);
  const gr=fs.statSync(ziel).size;
  console.log('   ',d.suggestedFilename(),'·',Math.round(gr/1024),'KB');
  ok(/^basilikum_\d{4}-\d{2}-\d{2}-\d{2}-\d{2}\.html$/.test(d.suggestedFilename()),
     'Der Name trägt Datum und Uhrzeit – ältere Stände bleiben liegen');
  const text=fs.readFileSync(ziel,'utf8');
  ok(text.indexOf('<!doctype html>')===0,'Die Datei ist ein vollständiges HTML-Dokument');
  /* Gezaehlt wird der Block selbst, nicht jede Erwaehnung: im Quelltext der
     App steht der Name noch in zwei regulaeren Ausdruecken. */
  const bloecke=t=>(t.match(/<script type="application\/json" id="datenblock">/g)||[]).length;
  ok(bloecke(text)===1,'Genau ein Datenblock darin');
  const dbTeil=text.slice(text.indexOf('id="datenblock">'),text.indexOf('</'+'script>',text.indexOf('id="datenblock">')));
  ok(dbTeil.indexOf('</'+'script')<0,'Kein rohes Skript-Ende im Datenteil – die Datei bleibt heil');
  ok(text.indexOf('function chartStapel')>0,'Das Werkzeug selbst steckt unverändert darin');
  const toast=await p.$$eval('.toast',es=>es.map(e=>e.textContent));
  console.log('   ',toast.join(' | '));
  ok(toast.some(t=>/HTML-Datei mit allem darin/.test(t)),'Und die App sagt, was sie gerade geschrieben hat');

  console.log('\n════ Die gesicherte Datei frisch öffnen ════');
  const {p:p2,stoerung:st2}=await seite();
  await p2.goto('file://'+ziel);await p2.waitForTimeout(2000);
  const nach=await p2.evaluate(()=>({an:db.analysen.length,ev:db.ereignisse.length,me:db.messungen.length,
    fo:db.fotos.length,schema:db.schema,notiz:db.ereignisse.map(e=>e.notiz).filter(Boolean).pop(),
    bytes:db.fotos.reduce((s,f)=>s+(f.daten||'').length,0),dirty}));
  ok(nach.an===vor.an&&nach.ev===vor.ev&&nach.me===vor.me&&nach.fo===vor.fo,
     `Alles ist da: ${nach.an} Analysen, ${nach.ev} Logbuch, ${nach.me} Messungen, ${nach.fo} Fotos`);
  ok(nach.notiz===GIFT,'Auch der Text mit Skript-Ende, Apostroph und Umlauten – zeichengenau');
  ok(nach.bytes===vor.bytes,'Die Bilddaten ebenfalls, Byte für Byte');
  ok(st2.filter(x=>/ALARMFENSTER/.test(x)).length===0,'Nichts davon wird ausgeführt: kein Alarmfenster');
  ok(nach.dirty===false,'Die frisch geöffnete Datei gilt als gesichert, nicht als geändert');
  const meldung=await p2.$$eval('.toast',es=>es.map(e=>e.textContent));
  console.log('   ',meldung.join(' | '));
  ok(meldung.some(t=>/Aus dieser Datei geladen/.test(t)),'Beim Öffnen steht da, woher die Daten stammen');

  console.log('\n   ── und weiterarbeiten ──');
  const reiter=await p2.$$eval('#nav button',bs=>bs.map(x=>x.textContent));
  ok(reiter.length===11,'Alle elf Reiter sind da');
  for(const t of reiter){
    await p2.click(`#nav button:text-is("${t}")`);await p2.waitForTimeout(250);
    const txt=await p2.$eval('#view',e=>e.innerText);
    if(/undefined|NaN|\[object Object\]|liess sich nicht aufbauen/.test(txt)){fehler++;console.log('  ✗ FEHLER Reiter '+t)}
  }
  console.log('  ✓ Jeder Reiter baut sich auf');
  const roh=await p2.$eval('#view',e=>e.innerHTML);
  ok(roh.indexOf('<img src=x')<0,'Kein eingeschleustes Markup aus der Notiz');

  console.log('\n════ Zweimal sichern lässt die Datei nicht wachsen ════');
  const dl2=p2.waitForEvent('download');
  await p2.click('header button:text-is("Sichern")');
  const d2=await dl2;const ziel2=path.join(ordner,'zweite.html');await d2.saveAs(ziel2);
  const gr2=fs.statSync(ziel2).size;
  console.log('   erste',Math.round(gr/1024),'KB · zweite',Math.round(gr2/1024),'KB');
  ok(Math.abs(gr2-gr)<3000,'Der Bestand wird nicht bei jedem Speichern ein zweites Mal mitgeschleppt');
  ok(bloecke(fs.readFileSync(ziel2,'utf8'))===1,'Und es bleibt bei einem Datenblock');

  console.log('\n════ Eine gesicherte HTML in ein laufendes Werkzeug laden ════');
  const {p:p3,stoerung:st3}=await seite();
  await p3.goto('file://'+app);await p3.waitForTimeout(1400);
  await p3.setInputFiles('#fileJson',ziel);await p3.waitForTimeout(1200);
  const geladen=await p3.evaluate(()=>({an:db.analysen.length,fo:db.fotos.length}));
  ok(geladen.an===vor.an&&geladen.fo===vor.fo,'Der Weg für den Versionswechsel funktioniert: neues Werkzeug, alte Datei');
  await p3.setInputFiles('#fileJson',app);await p3.waitForTimeout(900);
  const t3=await p3.$$eval('.toast',es=>es.map(e=>e.textContent));
  ok(t3.some(x=>/leere Werkzeug/.test(x)),'Das leere Werkzeug als Datei wird erkannt und benannt');
  console.log('   ',t3[t3.length-1]);

  const alleStoerungen=stoerung.concat(st2,st3);
  console.log('\n════ Ergebnis ════');
  if(alleStoerungen.length){fehler+=alleStoerungen.length;alleStoerungen.forEach(x=>console.log('  ✗',x))}
  console.log(fehler?`  ${fehler} FEHLER`:'  ✓ Die Datei trägt sich selbst.');
  console.log('  Dateien:',ordner);
  await b.close();
  process.exit(fehler?1:0);
})();
