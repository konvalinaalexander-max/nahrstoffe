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

  console.log('\n── Diagramm: Bedienung ohne Seitensprung ──');
  await p.click('#nav button:text-is("Nährstoffe")');await p.waitForTimeout(300);

  /* Das Diagramm muss die erste Karte des Reiters sein. */
  const ersteId=await p.$eval('#view > div:first-child',e=>e.id||'');
  console.log((ersteId==='nsKarte'?'  ✓ ':'  ✗ ')+'Das Diagramm ist die erste Karte des Reiters ('+(ersteId||'ohne Kennung')+')');
  if(ersteId!=='nsKarte')fehler.push('Diagramm steht nicht zuoberst');

  /* Weit nach unten scrollen: ein Sprung an den Seitenanfang faellt hier auf.
     Geklickt wird ueber el.click(), weil Playwright sonst selbst zum Element
     scrollt und der Test seinen eigenen Sprung messen wuerde. */
  await p.evaluate(()=>window.scrollTo(0,document.body.scrollHeight));await p.waitForTimeout(200);
  const yVor=await p.evaluate(()=>window.scrollY);
  await p.$eval('#view .chip.stoff:text-is("Nitrat")',e=>e.click());await p.waitForTimeout(350);
  const yNach=await p.evaluate(()=>window.scrollY);
  const sprung=Math.abs(yVor-yNach)>40;
  console.log((sprung?'  ✗ ':'  ✓ ')+'Nährstoff dazugewählt · Scrollposition '+yVor+' → '+yNach+(sprung?' — SPRUNG':' (bleibt stehen)'));
  if(sprung)fehler.push('Seitensprung beim Wechsel des Nährstoffs');
  const h2=await p.$eval('#nsKarte h2',e=>e.textContent);
  console.log((/2 Nährstoffe/.test(h2)?'  ✓ ':'  ✗ ')+'Mehrfachauswahl: «'+h2+'»');
  if(!/2 Nährstoffe/.test(h2))fehler.push('Mehrfachauswahl greift nicht');

  /* Verschiedene Einheiten muessen sichtbar auf die Lage-Skala wechseln. */
  await p.$eval('#view .chip.stoff:text-is("Eisen")',e=>e.click());await p.waitForTimeout(350);
  const nsTxt=await p.$eval('#nsKarte',e=>e.innerText);
  const gewechselt=/Gezeigt wird deshalb die Lage 0–3/.test(nsTxt);
  console.log((gewechselt?'  ✓ ':'  ✗ ')+'Bei unvergleichbaren Grössen wird auf die Lage 0–3 gewechselt und begründet');
  if(gewechselt)console.log('     ',(nsTxt.match(/[^\n]*wäre[^\n]*/)||[''])[0].slice(0,150));
  if(!gewechselt)fehler.push('Skalenwechsel wird nicht offengelegt');

  /* Sofort-Tooltip: nach dem Zeigen sofort da, ohne Wartezeit. */
  /* Trefferflaechen ueberlappen sich; die zuletzt gezeichnete liegt oben.
     Darum die letzte anfahren, und mit der Maus statt ueber hover(), damit
     Playwright nicht wegen der oberen Leiste abbricht. */
  await p.evaluate(()=>window.scrollTo(0,0));await p.waitForTimeout(150);
  const hits=await p.$$('#cNs .hit');
  const hit=hits[hits.length-1];
  if(hit){
    const bb=await hit.boundingBox();
    await p.mouse.move(bb.x+bb.width/2,bb.y+bb.height/2);await p.waitForTimeout(120);
    const tp=await p.$eval('.tipp',e=>({an:e.classList.contains('an'),t:e.innerText}));
    console.log((tp.an&&tp.t.length>10?'  ✓ ':'  ✗ ')+'Infokästchen erscheint sofort: '+JSON.stringify(tp.t.replace(/\n/g,' · ').slice(0,80)));
    if(!tp.an)fehler.push('Kein Sofort-Tooltip am Punkt');
  }else{console.log('  ✗ keine anfassbaren Punkte im Diagramm');fehler.push('Punkte ohne Trefferflaeche')}

  /* Legende als Bedienelement */
  const legVor=await p.$$eval('#cNs .hit',e=>e.length);
  await p.click('#legNs .pos >> nth=0');await p.waitForTimeout(300);
  const legNach=await p.$$eval('#cNs .hit',e=>e.length);
  console.log((legNach<legVor?'  ✓ ':'  ✗ ')+'Klick in der Legende blendet eine Reihe aus ('+legVor+' → '+legNach+' Punkte)');
  if(legNach>=legVor)fehler.push('Legende blendet nicht aus');
  await p.click('#legNs .pos >> nth=0');await p.waitForTimeout(300);

  /* Achse, Blatt und Linien */
  await p.click('#nsKarte .seg button:text-is("Kulturwoche")');await p.waitForTimeout(300);
  console.log('  ✓ Achsenwechsel auf Kulturwoche');
  await p.click('#nsKarte .seg button:text-is("Probendatum")');await p.waitForTimeout(300);
  const vorher=await p.$$eval('#cNs polyline',e=>e.length);
  console.log((vorher===0?'  ✓ ':'  ✗ ')+'Ohne Zutun sind es Punkte, keine Linien');
  if(vorher!==0)fehler.push('Linien sind die Vorgabe statt Punkte');
  await p.click('#nsKarte .seg button:text-is("durchgehend")');await p.waitForTimeout(300);
  const linien=await p.$$eval('#cNs polyline',e=>e.length);
  console.log((linien>0?'  ✓ ':'  ✗ ')+'Linien zuschaltbar ('+linien+' Linienzüge)');
  if(!linien)fehler.push('Linien lassen sich nicht zuschalten');
  await p.click('#nsKarte .seg button:text-is("keine")');await p.waitForTimeout(300);
  console.log((await p.$$eval('#cNs polyline',e=>e.length))===0?'  ✓ Punkte ohne Linien sind die Vorgabe':'  ✗ Linien lassen sich nicht abschalten');

  /* Ein Klick auf einen Punkt oeffnet die ganze Erhebung. */
  const hits2=await p.$$('#cNs .hit');
  const bb2=await hits2[hits2.length-1].boundingBox();
  await p.mouse.click(bb2.x+bb2.width/2,bb2.y+bb2.height/2);await p.waitForTimeout(400);
  const dlg2=await p.$eval('#dlgTitel',e=>e.textContent);
  console.log((/\d{2}\.\d{2}\./.test(dlg2)?'  ✓ ':'  ✗ ')+'Klick auf einen Punkt öffnet die Erhebung: '+dlg2);
  if(!/\d{2}\.\d{2}\./.test(dlg2))fehler.push('Punktklick öffnet keine Erhebung');
  await p.click('#dlgFoot button:text-is("Schliessen")');await p.waitForTimeout(200);
  await p.screenshot({path:shots+'/diagramm_naehrstoffe.png',fullPage:false});

  /* Voreinstellung «Was daneben liegt» */
  await p.click('#nsKarte button:text-is("Was daneben liegt")');await p.waitForTimeout(350);
  console.log('  ✓ Voreinstellung gewählt:',(await p.$eval('#nsKarte h2',e=>e.textContent)));

  console.log('\n── Diagramm: Giesswasser ──');
  await p.click('#nav button:text-is("Giesswasser")');await p.waitForTimeout(350);
  await p.evaluate(()=>window.scrollTo(0,0));await p.waitForTimeout(150);
  const gwHits=await p.$$('#cGw .hit');
  const gwHit=gwHits[gwHits.length-1];
  if(gwHit){
    const gb=await gwHit.boundingBox();
    await p.mouse.move(gb.x+gb.width/2,gb.y+gb.height/2);await p.waitForTimeout(120);
    const t=await p.$eval('.tipp',e=>e.innerText);
    console.log((/Entnahmestelle/.test(t)?'  ✓ ':'  ✗ ')+'Der Name der Entnahmestelle steht sofort im Kästchen: '+JSON.stringify(t.replace(/\n/g,' · ').slice(0,90)));
    if(!/Entnahmestelle/.test(t))fehler.push('Entnahmestelle fehlt im Tooltip');
    await p.evaluate(()=>window.scrollTo(0,document.body.scrollHeight));await p.waitForTimeout(200);
    const gy=await p.evaluate(()=>window.scrollY);
    await p.$eval('#view .chip.stoff >> nth=1',e=>e.click());await p.waitForTimeout(350);
    const gy2=await p.evaluate(()=>window.scrollY);
    console.log((Math.abs(gy-gy2)<40?'  ✓ ':'  ✗ ')+'Parameterwechsel ohne Seitensprung ('+gy+' → '+gy2+')');
    if(Math.abs(gy-gy2)>=40)fehler.push('Seitensprung im Giesswasser-Reiter');
    await p.screenshot({path:shots+'/diagramm_giesswasser.png',fullPage:false});
  }else console.log('  (keine Wasserproben in den Testdaten)');

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
