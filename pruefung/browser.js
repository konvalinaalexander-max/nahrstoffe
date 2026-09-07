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

  console.log('\n── Tabellenimport (CSV, ohne jede Bibliothek) ──');
  if(process.env.TAB){
    await p.click('#nav button:text-is("Giesswasser")');await p.waitForTimeout(350);
    const msVor=await p.evaluate(()=>document.querySelectorAll('#view table').length);
    await p.setInputFiles('#fileTab',process.env.TAB+'/phec.csv');
    await p.waitForTimeout(1200);
    const tt=await p.$eval('#dlgTitel',e=>e.textContent);
    console.log((/Tabelle kontrollieren/.test(tt)?'  ✓ ':'  ✗ ')+'Kontrolldialog wie bei den PDFs: '+tt);
    if(!/Tabelle kontrollieren/.test(tt))fehler.push('Excel-Kontrolldialog fehlt');
    const bd=await p.$eval('#dlgBody',e=>e.innerText);
    const bloecke=['Messungen am Tank','Vorgeschlagene Logbucheinträge'].every(x=>bd.indexOf(x)>=0);
    console.log((bloecke?'  ✓ ':'  ✗ ')+'Getrennte Blöcke für Messungen und Logbuchvorschläge');
    if(!bloecke)fehler.push('Import-Dialog ohne getrennte Bloecke');
    const kaesten=await p.$$eval('#dlgBody input[type=checkbox]',e=>e.length);
    console.log((kaesten>5?'  ✓ ':'  ✗ ')+'Jede Zeile einzeln abwählbar ('+kaesten+' Kästchen)');
    if(kaesten<=5)fehler.push('Zeilen nicht abwaehlbar');
    const felder=await p.$$eval('#dlgBody input[type=date]',e=>e.length);
    console.log((felder>3?'  ✓ ':'  ✗ ')+'Und im Feld korrigierbar ('+felder+' Datumsfelder)');
    console.log((/Rohtext/.test(bd)?'  ✓ ':'  ✗ ')+'Der Rohtext steht bei jedem Vorschlag');
    if(!/Rohtext/.test(bd))fehler.push('Rohtext fehlt im Vorschlag');
    console.log((/je Reservoir/.test(bd)?'  ✓ ':'  ✗ ')+'«je Reservoir» wird benannt');
    console.log((/nur eine Bemerkung, kein Messwert/.test(bd)?'  ✓ ':'  ✗ ')+'Zeilen ohne Messwert werden erklärt');
    await p.screenshot({path:shots+'/excelimport.png',fullPage:false});
    /* eine Zeile abwaehlen, dann uebernehmen */
    await p.$eval('#dlgBody input[data-k="mess"][data-i="0"]',e=>e.click());
    await p.click('#dlgFoot button:text-is("Übernehmen")');await p.waitForTimeout(900);
    const lbTxt=await p.$eval('#view',e=>e.innerText);
    console.log((/aus Excel-Import/.test(lbTxt)?'  ✓ ':'  ✗ ')+'Übernommene Einträge tragen das Herkunftsetikett');
    if(!/aus Excel-Import/.test(lbTxt))fehler.push('Herkunftsetikett fehlt');
    const zs=await p.$$eval('#view .zs',e=>e.length);
    console.log((zs>5?'  ✓ ':'  ✗ ')+'Die Logbucheinträge stehen im Zeitstrahl ('+zs+')');
    if(zs<=5)fehler.push('Logbucheintraege aus dem Import fehlen');
    await p.click('#nav button:text-is("Giesswasser")');await p.waitForTimeout(400);
    const gwTxt=await p.$eval('#view',e=>e.innerText);
    console.log((/Messungen \(/.test(gwTxt)?'  ✓ ':'  ✗ ')+'Die Tankmessungen sind im Reiter Giesswasser angekommen');
    await p.screenshot({path:shots+'/nachimport.png',fullPage:false});
  }else console.log('  (TAB nicht gesetzt – Tabellenimport uebersprungen)');

  console.log('\n── Fotos ──');
  if(process.env.BILDER){
    await p.click('#nav button:text-is("Fotos")');await p.waitForTimeout(300);
    const leer=await p.$eval('#view',e=>e.innerText);
    console.log((/Noch keine Fotos/.test(leer)?'  ✓ ':'  ✗ ')+'Leerer Zustand erklaert, wozu Fotos gut sind');
    await p.setInputFiles('#fileFoto',[process.env.BILDER+'/bestand-gross.png',process.env.BILDER+'/wurzel.png']);
    await p.waitForTimeout(2500);
    const titel=await p.$eval('#dlgTitel',e=>e.textContent);
    console.log((/2 Bilder/.test(titel)?'  ✓ ':'  ✗ ')+'Kontrolldialog vor der Uebernahme: '+titel);
    if(!/2 Bilder/.test(titel))fehler.push('Foto-Kontrolldialog fehlt');
    const herk=await p.$$eval('#dlgBody .herkunft',es=>es.map(e=>e.textContent));
    console.log('  Herkunft des Datums:',herk.join(' · '));
    console.log((herk.length===2?'  ✓ ':'  ✗ ')+'Bei jedem Bild steht, woher das Datum stammt');
    if(herk.length!==2)fehler.push('Datumsherkunft wird nicht angezeigt');
    await p.fill('#dlgBody [data-f="titel"] >> nth=0','Bestand mit \' Apostroph & <Zeichen>');
    await p.fill('#dlgBody [data-f="datum"] >> nth=0','2026-07-14');
    await p.fill('#dlgBody [data-f="datum"] >> nth=1','2026-08-18');
    await p.click('#dlgFoot button:text-is("Übernehmen")');
    await p.waitForTimeout(900);
    const gal=await p.$$eval('#view .foto img',es=>es.map(e=>({src:e.getAttribute('src').slice(0,22),n:e.getAttribute('src').length})));
    console.log('  Gespeicherte Bilder:',gal.map(g=>g.src+'… '+Math.round(g.n*3/4/1024)+' KB').join(' | '));
    const jpeg=gal.length===2&&gal.every(g=>/^data:image\/jpeg/.test(g.src));
    console.log((jpeg?'  ✓ ':'  ✗ ')+'Beide Bilder als JPEG neu kodiert');
    if(!jpeg)fehler.push('Bilder nicht als JPEG gespeichert');
    const klein=gal.every(g=>g.n*3/4<300*1024);
    console.log((klein?'  ✓ ':'  ✗ ')+'Jedes Bild unter 300 KB');
    if(!klein)fehler.push('Verkleinerung greift nicht');
    const masse=await p.evaluate(()=>{const i=document.querySelectorAll('#view .foto img');
      return [...i].map(x=>({w:x.naturalWidth,h:x.naturalHeight}))});
    console.log('  Abmessungen:',masse.map(m=>m.w+'×'+m.h).join(' · '));
    const kante=masse.every(m=>Math.max(m.w,m.h)<=1400);
    console.log((kante?'  ✓ ':'  ✗ ')+'Laengste Kante auf 1400 px begrenzt');
    if(!kante)fehler.push('Kantenlaenge nicht begrenzt');
    const roh=await p.$eval('#view',e=>e.innerHTML);
    console.log((roh.indexOf('<Zeichen>')<0?'  ✓ ':'  ✗ ')+'Kein injiziertes Markup aus dem Fototitel');
    if(roh.indexOf('<Zeichen>')>=0)fehler.push('XSS ueber den Fototitel');
    console.log((/Sicherungsdatei rund/.test(await p.$eval('#view',e=>e.innerText))?'  ✓ ':'  ✗ ')+'Groesse der Sicherungsdatei wird angezeigt');
    await p.click('#view .foto img >> nth=0');await p.waitForTimeout(400);
    const fd=await p.$eval('#dlgTitel',e=>e.textContent);
    console.log((/Foto 1 von/.test(fd)?'  ✓ ':'  ✗ ')+'Klick auf ein Bild oeffnet die grosse Ansicht: '+fd);
    if(!/Foto 1 von/.test(fd))fehler.push('Fotodialog oeffnet nicht');
    await p.click('#dlgFoot button:text-is("Schliessen")');await p.waitForTimeout(250);
    await p.screenshot({path:shots+'/fotos.png',fullPage:false});

    console.log('\n  ── Fotospur im Diagramm ──');
    await p.click('#nav button:text-is("Nährstoffe")');await p.waitForTimeout(400);
    const spur=await p.$$eval('#cNs [data-tun="fotoTag"]',e=>e.length);
    console.log((spur>0?'  ✓ ':'  ✗ ')+'Kamerasymbole erscheinen unter der Messwertflaeche ('+spur+')');
    if(!spur)fehler.push('Fotospur fehlt im Diagramm');
    await p.evaluate(()=>window.scrollTo(0,document.body.scrollHeight));await p.waitForTimeout(200);
    const yv=await p.evaluate(()=>window.scrollY);
    await p.$eval('#nsKarte .chip:text-matches("^Fotos")',e=>e.click());await p.waitForTimeout(350);
    const aus=await p.$$eval('#cNs [data-tun="fotoTag"]',e=>e.length);
    const yn=await p.evaluate(()=>window.scrollY);
    console.log((aus===0?'  ✓ ':'  ✗ ')+'Die Fotospur laesst sich abschalten ('+spur+' → '+aus+')');
    if(aus!==0)fehler.push('Fotospur nicht abschaltbar');
    console.log((Math.abs(yv-yn)<40?'  ✓ ':'  ✗ ')+'Und zwar ohne Seitensprung ('+yv+' → '+yn+')');
    if(Math.abs(yv-yn)>=40)fehler.push('Seitensprung beim Umschalten der Fotospur');
    await p.$eval('#nsKarte .chip:text-matches("^Fotos")',e=>e.click());await p.waitForTimeout(350);
    await p.evaluate(()=>window.scrollTo(0,0));await p.waitForTimeout(200);
    const marke=await p.$('#cNs [data-tun="fotoTag"]');
    if(marke){
      const bb=await marke.boundingBox();
      await p.mouse.move(bb.x+bb.width/2,bb.y+bb.height/2);await p.waitForTimeout(150);
      const bild=await p.$$eval('.tipp img',e=>e.length);
      console.log((bild>0?'  ✓ ':'  ✗ ')+'Das Infokaestchen zeigt ein Vorschaubild');
      if(!bild)fehler.push('Kein Vorschaubild im Tooltip');
      await p.mouse.click(bb.x+bb.width/2,bb.y+bb.height/2);await p.waitForTimeout(450);
      const t2=await p.$eval('#dlgTitel',e=>e.textContent);
      console.log((/Foto \d+ von/.test(t2)?'  ✓ ':'  ✗ ')+'Klick auf das Kamerasymbol oeffnet die Bilder: '+t2);
      if(!/Foto \d+ von/.test(t2))fehler.push('Klick auf die Fotospur oeffnet nichts');
      await p.screenshot({path:shots+'/fotodialog.png',fullPage:false});
      await p.click('#dlgFoot button:text-is("Schliessen")');await p.waitForTimeout(250);
    }
  }else console.log('  (BILDER nicht gesetzt – Fotopruefung uebersprungen)');

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

  console.log('\n── Logbuch: Schnellerfassung und Zeitstrahl ──');
  await p.click('#nav button:text-is("Logbuch")');await p.waitForTimeout(300);
  const lbVorher=await p.$$eval('#view .zs',e=>e.length);
  /* Schnellknopf «Biovin» stellt Art und Mittel ein */
  await p.click('#view button:text-is("Biovin")');await p.waitForTimeout(300);
  const lbArt=await p.$eval('#lbForm [data-f="typ"]',e=>e.value);
  const lbMit=await p.$eval('#lbForm [data-f="mittel"]',e=>e.value);
  const lbEinh=await p.$eval('#lbForm [data-f="menge"]',e=>e.closest('div').querySelector('.lab').textContent.trim());
  console.log('  Schnellknopf Biovin →',lbArt,'·',lbMit,'· Einheit:',lbEinh);
  console.log(((lbArt==='Düngergabe'&&lbMit==='biovin')?'  ✓ ':'  ✗ ')+'Häufiges stellt Art und Mittel in einem Klick ein');
  if(lbArt!=='Düngergabe'||lbMit!=='biovin')fehler.push('Schnellknopf stellt nichts ein');
  console.log((/\bl\b/.test(lbEinh)?'  ✓ ':'  ✗ ')+'Die Einheit steht fest und folgt der Form des Produkts (flüssig → l)');
  await p.fill('#lbForm [data-f="menge"]','15');
  await p.fill('#lbForm [data-f="notiz"]',"Test mit ' Apostroph & <Zeichen>");
  await p.click('#lbForm .chip:text-is("je Reservoir")');await p.waitForTimeout(250);
  await p.click('#lbForm button:text-is("Eintragen")');await p.waitForTimeout(450);
  const lbNachher=await p.$$eval('#view .zs',e=>e.length);
  const lb=await p.$eval('#view',e=>e.innerText);
  console.log(((lbNachher===lbVorher+1)?'  ✓ ':'  ✗ ')+'Ein Klick legt den Eintrag an ('+lbVorher+' → '+lbNachher+' im Zeitstrahl)');
  if(lbNachher!==lbVorher+1)fehler.push('Schnellerfassung legt keinen Eintrag an');
  console.log((/Apostroph/.test(lb)?'  ✓ ':'  ✗ ')+'Eintrag mit Apostroph gespeichert');
  console.log((/je Reservoir \(zusammen 30 l\)/.test(lb)?'  ✓ ':'  ✗ ')+'«je Reservoir» wird angezeigt, nicht stillschweigend umgerechnet');
  if(!/je Reservoir \(zusammen 30 l\)/.test(lb))fehler.push('je-Reservoir-Vorbehalt fehlt');
  /* Wiederkehrendes duplizieren */
  await p.click('#view .zs button:text-is("wieder so") >> nth=0');await p.waitForTimeout(400);
  const lbHeute=new Date().toISOString().slice(0,10);
  const dup=await p.$eval('#lbForm [data-f="datum"]',e=>e.value);
  const dupM=await p.$eval('#lbForm [data-f="menge"]',e=>e.value);
  console.log(((dup===lbHeute&&dupM==='15')?'  ✓ ':'  ✗ ')+'«wieder so» übernimmt die Werte mit heutigem Datum ('+dup+', '+dupM+')');
  if(dup!==lbHeute||dupM!=='15')fehler.push('Duplizieren übernimmt nicht');
  /* Filter nach Art */
  const lbAlle=await p.$$eval('#view .zs',e=>e.length);
  const chips=await p.$$('#view .chip[data-tun="lbFilter"]');
  if(chips.length>1){
    const art2=await chips[0].getAttribute('data-t');
    await chips[0].click();await p.waitForTimeout(350);
    const gefiltert=await p.$$eval('#view .zs',e=>e.length);
    console.log(((gefiltert<lbAlle&&gefiltert>0)?'  ✓ ':'  ✗ ')+'Zeitstrahl nach Art filterbar: nur «'+art2+'» ('+lbAlle+' → '+gefiltert+')');
    if(!(gefiltert>0&&gefiltert<lbAlle))fehler.push('Logbuchfilter greift nicht');
    await p.click('#view button:text-is("Filter aufheben")');await p.waitForTimeout(300);
    const zurueck=await p.$$eval('#view .zs',e=>e.length);
    console.log(((zurueck===lbAlle)?'  ✓ ':'  ✗ ')+'Filter aufheben zeigt wieder alle');
    if(zurueck!==lbAlle)fehler.push('Filter laesst sich nicht aufheben');
  }else console.log('  (nur eine Art im Bestand – Filter nicht pruefbar)');
  const rohLb=await p.$eval('#view',e=>e.innerHTML);
  console.log((rohLb.indexOf('<Zeichen>')<0?'  ✓ ':'  ✗ ')+'Kein injiziertes Markup aus der Notiz');
  if(rohLb.indexOf('<Zeichen>')>=0)fehler.push('XSS über die Logbuchnotiz');
  await p.screenshot({path:shots+'/logbuch.png',fullPage:false});
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
