/* Der Weg «PDF hochladen und verstehen», in Chromium durchgespielt.
   pdf.js wird aus der lokalen Installation umgeleitet, damit der Test ohne
   Netz laeuft – die App selbst ist unveraendert. */
const {chromium}=require('playwright');
const fs=require('fs'),path=require('path');
const APP=path.resolve(__dirname,'..','basilikum.html');
const PDF=process.env.PDF;              // Pfad zu einer echten Blattsaft-PDF
const PDFJS=process.env.PDFJS;          // Ordner node_modules/pdfjs-dist/build
const shots=process.env.SHOTS||require('os').tmpdir()+'/basilikum-upload';
fs.mkdirSync(shots,{recursive:true});
let fehler=[];
const ok=(b,t)=>{if(!b)fehler.push(t);console.log((b?'  ✓ ':'  ✗ FEHLER ')+t)};

(async()=>{
  const b=await chromium.launch(process.env.CHROME?{executablePath:process.env.CHROME,args:['--no-sandbox']}:{});
  const p=await b.newPage({viewport:{width:1280,height:1100}});
  p.on('pageerror',e=>fehler.push('pageerror: '+e.message));
  p.on('console',m=>{const t=m.text();
    if(m.type()==='error'&&!/Failed to load resource|net::ERR_/.test(t))fehler.push('console: '+t)});

  if(PDFJS){
    await p.route('**/pdf.min.js',r=>r.fulfill({contentType:'application/javascript',
      body:fs.readFileSync(PDFJS+'/pdf.min.js','utf8')}));
    await p.route('**/pdf.worker.min.js',r=>r.fulfill({contentType:'application/javascript',
      body:fs.readFileSync(PDFJS+'/pdf.worker.min.js','utf8')}));
  }
  await p.goto('file://'+APP);
  await p.waitForTimeout(1200);

  console.log('── Start ──');
  const start=await p.$eval('#view',e=>e.innerText);
  ok(/Willkommen/.test(start),'Startbildschirm erklaert das Werkzeug');
  ok(/Erste Analyse einlesen/.test(start),'und bietet den Einstieg an');

  if(!PDF||!PDFJS){
    console.log('\n(kein PDF oder pdf.js angegeben – Importweg uebersprungen)');
    await b.close();process.exit(fehler.length?1:0);
  }

  console.log('\n── PDF hochladen ──');
  await p.click('#view button:text-is("Erste Analyse einlesen")');
  await p.waitForTimeout(300);
  await p.setInputFiles('#filePdf',PDF);
  await p.waitForTimeout(3000);
  const titel=await p.$eval('#dlgTitel',e=>e.textContent);
  console.log('  Kontrolldialog:',titel);
  ok(/Kontrollieren und bestätigen/.test(titel),'Der Kontrolldialog oeffnet sich');
  const dlg=await p.$eval('#dlgBody',e=>e.innerText);
  const satz=await p.$eval('#dlgBody input[data-f="satz"]',e=>e.value);
  ok(satz==='28-478','Satznummer erkannt: '+satz);
  ok(/Stickstoff\s/.test(dlg)&&/Spurenelemente/.test(dlg),'Felder nach Naehrstoffgruppen gegliedert');
  const hints=await p.$$eval('#dlgBody [data-feld] .tiny',es=>es.map(e=>e.textContent));
  ok(hints.filter(h=>/^Soll /.test(h)).length>=40,
     'Der Sollbereich steht unter jedem Feld ('+hints.filter(h=>/^Soll /.test(h)).length+' Felder)');
  ok(!hints.some(h=>/ungewöhnlich/.test(h)),'Kein echter Messwert faelschlich als Uebertragungsfehler markiert');
  const felder=await p.$$eval('#dlgBody input[data-w]',e=>e.length);
  console.log('  Messwertfelder im Dialog:',felder);
  ok(felder>=44,'Beide Proben mit je 23 Parametern');
  await p.screenshot({path:shots+'/1-kontrolle.png'});

  console.log('\n── Uebernehmen ──');
  await p.click('#dlgFoot button:text-is("Übernehmen")');
  await p.waitForTimeout(900);
  const nachTitel=await p.$eval('#dlgTitel',e=>e.textContent);
  console.log('  Danach geoeffnet:',nachTitel);
  ok(/Satz 28-478 · 18\.08\.2026/.test(nachTitel),'Die Auswertung der Erhebung oeffnet sich von selbst');
  const det=await p.$eval('#dlgBody',e=>e.innerText);
  await p.screenshot({path:shots+'/2-erhebung.png'});
  for(const [nam,wert] of [['Nitrat','36'],['Kalium','1040'],['Molybdän','0.05'],['Aluminium','1.03']]){
    ok(det.indexOf(nam)>=0,'Parameter '+nam+' in der Tabelle');
  }
  ok(/jung[\s\S]{0,40}alt/.test(det),'Jung und Alt nebeneinander');
  ok(/zählt/.test(det),'Das massgebliche Blatt ist markiert');
  ok(/Ammoniumüberschuss bremst die Kaliumaufnahme/.test(det),'Die Befunde stehen darunter');
  const zeilen=await p.$$eval('#dlgBody table tbody tr',e=>e.length);
  console.log('  Tabellenzeilen (inkl. Gruppentitel):',zeilen);
  ok(zeilen>=23,'Alle Parameter aufgefuehrt');

  console.log('\n── Ueberblick dahinter ──');
  await p.click('#dlgFoot button:text-is("Schliessen")');
  await p.waitForTimeout(500);
  const ub=await p.$eval('#view',e=>e.innerText);
  const iBefund=ub.indexOf('Ammoniumüberschuss');
  const iDiagramm=ub.indexOf('Nähern wir uns dem Optimum');
  console.log('  Befund bei Zeichen',iBefund,'· Verlaufsfrage bei',iDiagramm,'von',ub.length);
  ok(iBefund>=0&&iBefund<iDiagramm,'Die Befunde stehen VOR den Verlaufsdiagrammen');
  ok(/Dafür braucht es eine zweite Erhebung/.test(ub),'Statt eines leeren Diagramms steht dort, was noch fehlt');
  ok(!/Nährstofflage über die Zeit/.test(ub),'Das zweite Verlaufsdiagramm ist bei einer Erhebung ausgeblendet');
  await p.screenshot({path:shots+'/3-ueberblick.png',fullPage:true});

  console.log('\n── Wiedereinstieg ──');
  await p.click('#view button:text-is("Alle Werte ansehen")');
  await p.waitForTimeout(400);
  ok(/Satz 28-478/.test(await p.$eval('#dlgTitel',e=>e.textContent)),'Die Erhebung ist aus dem Ueberblick erreichbar');
  await p.click('#dlgFoot button:text-is("Schliessen")');
  await p.waitForTimeout(300);
  await p.click('#nav button:text-is("Analysen")');
  await p.waitForTimeout(300);
  await p.click('#view table tbody tr');
  await p.waitForTimeout(400);
  const einzel=await p.$eval('#dlgFoot',e=>e.innerText);
  ok(/Ganze Erhebung ansehen/.test(einzel),'Auch aus der Einzelprobe fuehrt ein Weg zur ganzen Erhebung');
  await p.click('#dlgFoot button:text-is("Ganze Erhebung ansehen")');
  await p.waitForTimeout(400);
  ok(/Satz 28-478/.test(await p.$eval('#dlgTitel',e=>e.textContent)),'und er funktioniert');

  console.log('\n── Alle Reiter mit einer einzigen Analyse ──');
  await p.click('#dlgFoot button:text-is("Schliessen")');
  await p.waitForTimeout(300);
  const reiter=await p.$$eval('#nav button',bs=>bs.map(b=>b.textContent));
  for(const t of reiter){
    await p.click(`#nav button:text-is("${t}")`);
    await p.waitForTimeout(280);
    const txt=await p.$eval('#view',e=>e.innerText);
    const kaputt=/undefined|NaN|\[object Object\]|liess sich nicht aufbauen/.test(txt);
    console.log((kaputt?'  ✗ ':'  ✓ ')+t.padEnd(22)+txt.split('\n')[0].slice(0,44));
    if(kaputt)fehler.push('Reiter '+t);
  }

  console.log('\n── Ergebnis ──');
  if(fehler.length){console.log('  FEHLER:');fehler.forEach(f=>console.log('   ·',f))}
  else console.log('  ✓ Der ganze Weg von der Datei bis zur Auswertung funktioniert.');
  console.log('  Screenshots:',shots);
  await b.close();
  process.exit(fehler.length?1:0);
})();
