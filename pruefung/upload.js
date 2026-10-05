/* Der Weg «Blattsaftbericht hochladen und ansehen», in Chromium mit echtem
   pdf.js. Ohne eigenes PDF wird der echte Bericht aus pruefung/seiten.json
   nachgebaut (pruefung/pdfbau.js). pdf.js kommt aus der lokalen Installation,
   damit die Prüfung ohne Netz läuft – die App selbst ist unverändert.
   Aufruf:  CHROME=… NODE_PATH=…/node_modules [PDF=bericht.pdf] node pruefung/upload.js */
const {chromium}=require('playwright');
const fs=require('fs'),path=require('path'),os=require('os');
const APP=path.resolve(__dirname,'..','basilikum.html');
const PDFJS=process.env.PDFJS||path.dirname(require.resolve('pdfjs-dist/build/pdf.min.js'));
const shots=process.env.SHOTS||path.join(os.tmpdir(),'basilikum-upload');
fs.mkdirSync(shots,{recursive:true});
let PDF=process.env.PDF;
if(!PDF){PDF=path.join(fs.mkdtempSync(path.join(os.tmpdir(),'basilikum-pdf-')),'NCC 28-478 Blattsaft.pdf');
  fs.writeFileSync(PDF,require('./pdfbau.js').blattsaftPdf(require('./seiten.json')))}
let fehler=[];
const ok=(b,t)=>{if(!b)fehler.push(t);console.log((b?'  ✓ ':'  ✗ FEHLER ')+t)};

(async()=>{
  const b=await chromium.launch(process.env.CHROME?{executablePath:process.env.CHROME,args:['--no-sandbox']}:{});
  const p=await b.newPage({viewport:{width:1280,height:1100}});
  p.on('pageerror',e=>fehler.push('pageerror: '+e.message));
  p.on('console',m=>{const t=m.text();
    if(m.type()==='error'&&!/Failed to load resource|net::ERR_/.test(t))fehler.push('console: '+t)});
  await p.route('**/pdf.min.js',r=>r.fulfill({contentType:'application/javascript',body:fs.readFileSync(PDFJS+'/pdf.min.js','utf8')}));
  await p.route('**/pdf.worker.min.js',r=>r.fulfill({contentType:'application/javascript',body:fs.readFileSync(PDFJS+'/pdf.worker.min.js','utf8')}));
  await p.goto('file://'+APP);
  await p.waitForTimeout(1200);

  console.log('── Start ──');
  ok(/Noch keine Analysen/.test(await p.$eval('#view',e=>e.innerText)),'Ohne Daten sagt die App, was fehlt');
  await p.click('#view button:text-is("Zu den Analysen")');await p.waitForTimeout(300);
  ok(await p.$eval('#nav button.active',e=>e.textContent)==='Analysen','Der Knopf führt zu den Analysen');
  ok(await p.$eval('#view button:text-is("Dateien wählen")',e=>!e.disabled),'pdf.js ist geladen: «Dateien wählen» ist bereit');

  console.log('\n── PDF hochladen ──');
  await p.setInputFiles('#filePdf',PDF);
  await p.waitForTimeout(3000);
  const titel=await p.$eval('#dlgTitel',e=>e.textContent);
  console.log('  Kontrolldialog:',titel);
  ok(/Kontrollieren und übernehmen · 2 Proben/.test(titel),'Der Kontrolldialog öffnet sich mit beiden Proben');
  const dlg=await p.$eval('#dlgBody',e=>e.innerText);
  const satz=await p.$$eval('#dlgBody input[data-f="satz"]',e=>e.map(x=>x.value));
  ok(satz.join()==='28-478,28-478','Satznummer erkannt: '+satz[0]);
  const blatt=await p.$$eval('#dlgBody select[data-f="blattalter"]',e=>e.map(x=>x.value));
  ok(blatt.join()==='jung,alt','Jung und Alt erkannt');
  ok(/Stickstoff\s/.test(dlg)&&/Spurenelemente/.test(dlg),'Felder nach Gruppen gegliedert');
  const hints=await p.$$eval('#dlgBody [data-feld] .tiny',es=>es.map(e=>e.textContent));
  ok(hints.filter(h=>/^Optimum /.test(h)).length>=40,'Das Optimum des Labors steht unter jedem Feld ('+hints.filter(h=>/^Optimum /.test(h)).length+' Felder)');
  ok(!hints.some(h=>/ungewöhnlich/.test(h)),'Kein echter Messwert fälschlich als Übertragungsfehler markiert');
  const felder=await p.$$eval('#dlgBody input[data-w]',e=>e.length);
  ok(felder===46,'Beide Proben mit je 23 Werten ('+felder+')');
  await p.screenshot({path:shots+'/1-kontrolle.png'});

  console.log('\n── Übernehmen ──');
  await p.click('#dlgFoot button:text-is("Übernehmen")');
  await p.waitForTimeout(900);
  const nachTitel=await p.$eval('#dlgTitel',e=>e.textContent);
  console.log('  Danach geöffnet:',nachTitel);
  ok(nachTitel==='Blattsaft · Satz 28-478 · 18.08.2026','Der Bericht öffnet sich von selbst');
  const det=await p.$eval('#dlgBody',e=>e.innerText);
  await p.screenshot({path:shots+'/2-bericht.png'});
  for(const nam of ['Nitrat','Kalium','Molybdän','Aluminium'])ok(det.indexOf(nam)>=0,'Wert '+nam+' im Bericht');
  ok(/junges Blatt[\s\S]{0,40}altes Blatt/i.test(det),'Jung und Alt nebeneinander');
  ok(/Der Bericht im Wortlaut/.test(det),'Der Wortlaut des Berichts ist aufklappbar');
  ok(!/Befund|zählt|Ammoniumüberschuss|Nächster Schritt/.test(det),'Keine Befunde, keine Deutung');
  const zeilen=await p.$$eval('#dlgBody table tbody tr',e=>e.length);
  ok(zeilen>=23,'Alle Werte aufgeführt ('+zeilen+' Zeilen mit Gruppentiteln)');
  await p.click('#dlgFoot button:text-is("Schliessen")');await p.waitForTimeout(300);
  const liste=await p.$$eval('#view table tbody tr',e=>e.map(x=>x.innerText.replace(/\s+/g,' ')));
  ok(liste.length===1&&/18\.08\.2026 Blattsaft Satz 28-478 jung alt NovaCropControl 202608201117, 202608201118/.test(liste[0]),'In der Liste: eine Zeile für den Bericht');

  console.log('\n── Dasselbe PDF noch einmal ──');
  await p.setInputFiles('#filePdf',PDF);await p.waitForTimeout(2500);
  ok(/bereits erfasst/.test(await p.$eval('#dlgBody',e=>e.innerText)),'Die Probennummern sind schon da – nicht vorausgewählt');
  await p.click('#dlgFoot button:text-is("Abbrechen")');await p.waitForTimeout(300);

  console.log('\n── Im Diagramm ──');
  await p.click('#nav button:text-is("Blattsaft & Giesswasser")');await p.waitForTimeout(600);
  const punkte=await p.$$eval('#cKb circle.hit',e=>e.length);
  ok(punkte===2,'Kalium jung und alt: zwei Punkte');
  ok(/Noch keine Giesswasseranalyse/.test(await p.$eval('#cKb',e=>e.textContent)),'Das Wasserfenster sagt, dass noch keine Analyse da ist');

  console.log('\n── Alle Reiter ──');
  const reiter=await p.$$eval('#nav button[data-tun="reiter"]',bs=>bs.map(b=>b.textContent));
  for(const t of reiter){
    await p.click(`#nav button:text-is("${t}")`);await p.waitForTimeout(280);
    const txt=await p.$eval('#view',e=>e.innerText);
    ok(!/undefined|NaN|\[object Object\]|liess sich nicht aufbauen/.test(txt),t.padEnd(24)+txt.split('\n')[0].slice(0,44));
  }

  console.log('\n── Ergebnis ──');
  if(fehler.length){console.log('  FEHLER:');fehler.forEach(f=>console.log('   ·',f))}
  else console.log('  ✓ Der ganze Weg von der Datei bis zum Bericht funktioniert.');
  console.log('  Bildschirmfotos:',shots);
  await b.close();
  process.exit(fehler.length?1:0);
})().catch(e=>{console.error('ABBRUCH',e);process.exit(1)});
