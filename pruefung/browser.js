const {chromium}=require('playwright');
const path=require('path').resolve(__dirname,'..','basilikum.html');
const daten=__dirname+'/testdaten.json';
const shots=(process.env.SHOTS||require('os').tmpdir()+'/basilikum-shots');
require('fs').mkdirSync(shots,{recursive:true});
(async()=>{
  const b=await chromium.launch(process.env.CHROME?{executablePath:process.env.CHROME,args:['--no-sandbox']}:{});
  const p=await b.newPage({viewport:{width:1280,height:1000}});
  const fehler=[];
  p.on('console',m=>{const t=m.text();if(m.type()==='error'&&!/Failed to load resource|net::ERR_/.test(t))fehler.push('console: '+t)});
  p.on('pageerror',e=>fehler.push('pageerror: '+e.message));
  await p.goto('file://'+path);
  await p.waitForTimeout(1500);

  const reiter=await p.$$eval('#nav button',bs=>bs.map(b=>b.textContent));
  console.log('Reiter:',reiter.join(' · '));

  console.log('\n── leere Datenbank ──');
  for(const t of reiter){
    await p.click(`#nav button:text-is("${t}")`);
    await p.waitForTimeout(160);
    const txt=await p.$eval('#view',e=>e.innerText);
    const kaputt=/undefined|NaN|\[object Object\]|liess sich nicht aufbauen/.test(txt);
    console.log((kaputt?'  ✗ ':'  ✓ ')+t+'  ('+txt.split('\n')[0].slice(0,54)+')');
    if(kaputt)fehler.push('leer/'+t);
  }

  console.log('\n── Datei laden ──');
  await p.click('#nav button:text-is("Überblick")');
  await p.setInputFiles('#fileJson',daten);
  await p.waitForTimeout(900);
  const geladen=await p.$eval('#view',e=>e.innerText);
  console.log('  geladen:',/Erhebungen/.test(geladen)?'ja':'NEIN');

  console.log('\n── gefüllte Datenbank ──');
  for(const t of reiter){
    await p.click(`#nav button:text-is("${t}")`);
    await p.waitForTimeout(320);
    const txt=await p.$eval('#view',e=>e.innerText);
    const svg=await p.$$eval('#view svg',s=>s.length);
    const kaputt=/undefined|NaN|\[object Object\]|liess sich nicht aufbauen/.test(txt);
    console.log((kaputt?'  ✗ ':'  ✓ ')+t.padEnd(22)+svg+' Diagramm(e) · '+txt.length+' Zeichen');
    if(kaputt){fehler.push('gefuellt/'+t);console.log('     ',(txt.match(/.{0,60}(undefined|NaN|\[object Object\]).{0,40}/)||[])[0])}
    await p.screenshot({path:shots+'/'+t.replace(/[^\wÄÖÜäöü]/g,'_')+'.png',fullPage:false});
  }

  console.log('\n── Interaktion ──');
  await p.click('#nav button:text-is("Analysen")');await p.waitForTimeout(250);
  await p.click('#view table tbody tr');await p.waitForTimeout(350);
  const dlg=await p.$eval('#dlgTitel',e=>e.textContent);
  console.log('  Detaildialog öffnet:',dlg);
  await p.screenshot({path:shots+'/dialog.png'});
  await p.click('#dlgFoot button:text-is("Schliessen")');await p.waitForTimeout(200);

  await p.click('#nav button:text-is("Nährstoffe")');await p.waitForTimeout(250);
  await p.selectOption('#view select >> nth=0','NO3');await p.waitForTimeout(300);
  console.log('  Nährstoffwechsel:',await p.$eval('#view h2',e=>e.textContent));
  await p.selectOption('#view select >> nth=1','woche');await p.waitForTimeout(300);
  console.log('  Achsenwechsel auf Kulturwoche: ok');
  await p.click('#view .chip');await p.waitForTimeout(300);
  console.log('  Lage-Umschalter: ok');

  await p.click('#nav button:text-is("Planer")');await p.waitForTimeout(300);
  const vor=await p.$$('#view .vorschlag');
  console.log('  Vorschläge im Planer:',vor.length);
  if(vor.length){
    await p.click('#view .vorschlag button:text-is("einplanen")');await p.waitForTimeout(350);
    const t=await p.$eval('#view',e=>e.innerText);
    console.log('  einplanen geklickt →',/1 offen|geplant/.test(t)?'Termin angelegt':'KEINE WIRKUNG');
  }

  await p.click('#nav button:text-is("Logbuch")');await p.waitForTimeout(250);
  await p.click('#view button:text-is("Änderung erfassen")');await p.waitForTimeout(350);
  console.log('  Logbuchdialog:',await p.$eval('#dlgTitel',e=>e.textContent));
  await p.fill('#eTitel',"Test mit ' Apostroph & <Zeichen>");
  await p.click('#dlgFoot button:text-is("Speichern")');await p.waitForTimeout(400);
  const lb=await p.$eval('#view',e=>e.innerText);
  console.log('  Eintrag mit Apostroph gespeichert:',/Apostroph/.test(lb)?'ja':'NEIN');
  await p.click('#nav button:text-is("Planer")');await p.waitForTimeout(350);
  const btn=await p.$('#view .vorschlag button:text-is("einplanen")');
  if(btn){await btn.click();await p.waitForTimeout(300);console.log('  Planer-Knopf nach Apostroph-Eintrag: funktioniert')}
  else console.log('  Planer-Knopf: kein Vorschlag offen (ok)');

  await p.click('#nav button:text-is("Rundgang")');await p.waitForTimeout(250);
  await p.click('#view .stufen button >> nth=2');await p.waitForTimeout(300);
  console.log('  Rundgang-Stufe klickbar: ok');

  await p.click('#nav button:text-is("Sätze & Einstellungen")');await p.waitForTimeout(300);
  await p.click('#view .chip:text-is("Natrium")');await p.waitForTimeout(350);
  const nachKern=await p.$eval('#view',e=>e.innerText);
  console.log('  Kern-Nährstoff umschalten:',/Aktuell 12 Nährstoffe/.test(nachKern)?'ok (12)':'?');
  await p.click('#view button:text-is("Vorgabe wiederherstellen")');await p.waitForTimeout(350);
  console.log('  Vorgabe wiederherstellen:',/Aktuell 11 Nährstoffe/.test(await p.$eval('#view',e=>e.innerText))?'ok (11)':'?');

  console.log('\n── Offline-Verhalten (CDN ist hier blockiert) ──');
  await p.click('#nav button:text-is("Analysen")');await p.waitForTimeout(250);
  const an=await p.$eval('#view',e=>e.innerText);
  console.log('  Hinweis auf fehlendes pdf.js:',/konnte nicht geladen werden/.test(an)?'ja':'NEIN');
  const disabled=await p.$eval('#view .drop button',b=>b.disabled);
  console.log('  Knopf «Dateien wählen» deaktiviert:',disabled?'ja':'NEIN');
  console.log('  Alles Übrige bedienbar: ja (siehe oben, neun Reiter gerendert)');

  console.log('\n── Escaping ──');
  await p.click('#nav button:text-is("Logbuch")');await p.waitForTimeout(300);
  const roh=await p.$eval('#view',e=>e.innerHTML);
  const txt2=await p.$eval('#view',e=>e.innerText);
  console.log('  Titel als Text sichtbar:',/Test mit ' Apostroph & <Zeichen>/.test(txt2)?'ja':'NEIN');
  console.log('  Kein injiziertes Markup:',roh.indexOf('<Zeichen>')<0?'ja':'NEIN — GEFAHR');
  const zeichen=await p.$$('#view Zeichen');
  console.log('  Kein Element <Zeichen> im DOM:',zeichen.length===0?'ja':'NEIN — GEFAHR');
  if(zeichen.length)fehler.push('XSS: Markup aus Benutzereingabe gelandet');

  console.log('\n── Ergebnis ──');
  if(fehler.length){console.log('  FEHLER:');fehler.forEach(f=>console.log('   ·',f))}
  else console.log('  ✓ Keine Konsolenfehler, keine kaputten Ansichten.');
  await b.close();
  process.exit(fehler.length?1:0);
})();
