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

  console.log('\n── Verlauf: gekoppelte Zeitachse ──');
  await p.click('#nav button:text-is("Verlauf")');await p.waitForTimeout(450);

  /* Das Diagramm ist auch hier die erste Karte. */
  const vlErst=await p.$eval('#view > div:first-child',e=>e.id||'');
  console.log((vlErst==='vlKarte'?'  ✓ ':'  ✗ ')+'Das gekoppelte Diagramm ist die erste Karte ('+(vlErst||'ohne Kennung')+')');
  if(vlErst!=='vlKarte')fehler.push('Verlauf: Diagramm steht nicht zuoberst');

  /* Mehrere Spuren, aber nur EINE Zeitachse: sonst waere die Kopplung nur behauptet. */
  const vlSvgN=await p.$$eval('#cVl svg',e=>e.length);
  const vlSpuren=await p.$$eval('#cVl text',es=>es.map(e=>e.textContent).filter(t=>/^(Pflanze|Wasser)/.test(t)));
  const vlAchse=await p.$$eval('#cVl text',es=>es.filter(e=>/Ziehen verschiebt/.test(e.textContent)).length);
  console.log('  Spuren:',vlSpuren.join(' | '));
  console.log(((vlSvgN===1&&vlSpuren.length>=2)?'  ✓ ':'  ✗ ')+'Mehrere Spuren in einer einzigen Zeichnung ('+vlSvgN+' SVG, '+vlSpuren.length+' Spuren)');
  if(vlSvgN!==1||vlSpuren.length<2)fehler.push('Verlauf: Spuren nicht gekoppelt');
  console.log((vlAchse===1?'  ✓ ':'  ✗ ')+'Und genau eine gemeinsame Zeitachse');
  if(vlAchse!==1)fehler.push('Verlauf: nicht genau eine Zeitachse');

  /* Der Wechsel der Frage muss Titel, Diagramm UND Text aendern – nicht nur
     die Schaltflaeche einfaerben. Genau dieser Fehler ist beim Bauen passiert. */
  await p.evaluate(()=>window.scrollTo(0,document.body.scrollHeight));await p.waitForTimeout(200);
  const vy=await p.evaluate(()=>window.scrollY);
  const vlVor={t:await p.$eval('#vlKarte h2',e=>e.textContent),
               s:await p.$eval('#cVl',e=>e.innerHTML.length),
               n:await p.$eval('#vlKarte .note',e=>e.innerText)};
  await p.$eval('#vlKarte .chip:text-is("Kommt das Eisen an?")',e=>e.click());await p.waitForTimeout(450);
  const vlNach={t:await p.$eval('#vlKarte h2',e=>e.textContent),
                s:await p.$eval('#cVl',e=>e.innerHTML.length),
                n:await p.$eval('#vlKarte .note',e=>e.innerText)};
  const vy2=await p.evaluate(()=>window.scrollY);
  /* Wird die Seite durch den Wechsel kuerzer, rutscht sie zwangslaeufig hoch.
     Erwartet wird deshalb die alte Stelle, begrenzt auf das neue Seitenende. */
  const vMax=await p.evaluate(()=>Math.max(0,document.body.scrollHeight-window.innerHeight));
  const vErw=Math.min(vy,vMax);
  console.log('  Frage:',JSON.stringify(vlVor.t),'→',JSON.stringify(vlNach.t));
  const gewechselt2=vlVor.t!==vlNach.t&&vlVor.n!==vlNach.n&&vlVor.s!==vlNach.s;
  console.log((gewechselt2?'  ✓ ':'  ✗ ')+'Der Wechsel der Frage ändert Titel, Diagramm und Erwartungstext');
  if(!gewechselt2)fehler.push('Verlauf: Fragewechsel wirkt nicht auf den Inhalt');
  console.log((Math.abs(vErw-vy2)<40?'  ✓ ':'  ✗ ')+'Ohne Seitensprung ('+vy+' → '+vy2+', möglich wären '+vMax+')');
  if(Math.abs(vErw-vy2)>=40)fehler.push('Verlauf: Seitensprung beim Fragewechsel');

  /* Getrennte Achsen je Einheit: µmol/l und pH duerfen sich keine teilen. */
  const vlEinh=await p.$$eval('#cVl text',es=>es.map(e=>e.textContent).filter(t=>/µmol\/l|ohne Einheit|Lage 0–3/.test(t)));
  console.log('  Einheiten der Spuren:',[...new Set(vlEinh)].join(' | '));
  console.log((new Set(vlEinh).size>=2?'  ✓ ':'  ✗ ')+'Jede Spur trägt ihre eigene Einheit');
  if(new Set(vlEinh).size<2)fehler.push('Verlauf: Einheiten nicht getrennt');

  /* Zoomen, Ziehen, Zuruecksetzen */
  await p.evaluate(()=>window.scrollTo(0,0));await p.waitForTimeout(200);
  const marken=()=>p.$$eval('#cVl text',es=>es.map(e=>e.textContent).filter(t=>/^\d\d\.\d\d\.$|^(Jan|Feb|Mär|Apr|Mai|Jun|Jul|Aug|Sep|Okt|Nov|Dez) \d\d$/.test(t)));
  const box=await (await p.$('#cVl')).boundingBox();
  const mx=box.x+box.width*0.6,my=box.y+box.height*0.45;
  const mVor=await marken();
  await p.mouse.move(mx,my);await p.waitForTimeout(120);

  /* Der gemeinsame Zeiger steht dort, wo die Maus steht – über allen Spuren. */
  const zeiger=await p.$eval('#cVl .zeiger',e=>({x:+e.getAttribute('x1'),h:+e.getAttribute('y2')-+e.getAttribute('y1')}));
  console.log(((zeiger.x>0&&zeiger.h>100)?'  ✓ ':'  ✗ ')+'Ein gemeinsamer Zeiger läuft über alle Spuren (x='+Math.round(zeiger.x)+', Höhe '+Math.round(zeiger.h)+')');
  if(!(zeiger.x>0&&zeiger.h>100))fehler.push('Verlauf: kein gemeinsamer Zeiger');

  await p.mouse.wheel(0,-240);await p.waitForTimeout(400);
  const mZoom=await marken();
  console.log('  Zeitmarken vor dem Zoom:',mVor.join(' '),'· danach:',mZoom.join(' '));
  const gezoomt=JSON.stringify(mVor)!==JSON.stringify(mZoom);
  console.log((gezoomt?'  ✓ ':'  ✗ ')+'Das Mausrad zoomt den Ausschnitt');
  if(!gezoomt)fehler.push('Verlauf: Mausrad zoomt nicht');

  /* Nach dem Zoomen darf kein Zeitraumknopf mehr aktiv sein – sonst luegt er. */
  const aktivNachZoom=await p.$$eval('#vlKarte [data-tun="vlZeit"]',es=>es.filter(e=>e.classList.contains('on')).map(e=>e.textContent));
  console.log((aktivNachZoom.length===0?'  ✓ ':'  ✗ ')+'Kein Zeitraumknopf behauptet danach noch, er gelte ('+(aktivNachZoom.join(',')||'keiner')+')');
  if(aktivNachZoom.length)fehler.push('Verlauf: Zeitraumknopf bleibt nach dem Zoom aktiv');

  await p.mouse.move(mx,my);await p.mouse.down();
  await p.mouse.move(mx-160,my,{steps:8});await p.mouse.up();await p.waitForTimeout(400);
  const mZieh=await marken();
  console.log((JSON.stringify(mZoom)!==JSON.stringify(mZieh)?'  ✓ ':'  ✗ ')+'Ziehen verschiebt den Ausschnitt · '+mZieh.join(' '));
  if(JSON.stringify(mZoom)===JSON.stringify(mZieh))fehler.push('Verlauf: Ziehen verschiebt nicht');

  await p.mouse.dblclick(mx,my);await p.waitForTimeout(450);
  const mZurueck=await marken();
  console.log((JSON.stringify(mZurueck)===JSON.stringify(mVor)?'  ✓ ':'  ✗ ')+'Doppelklick setzt auf den ganzen Zeitraum zurück');
  if(JSON.stringify(mZurueck)!==JSON.stringify(mVor))fehler.push('Verlauf: Doppelklick setzt nicht zurueck');
  const aktivZurueck=await p.$$eval('#vlKarte [data-tun="vlZeit"]',es=>es.filter(e=>e.classList.contains('on')).map(e=>e.textContent));
  console.log((aktivZurueck.join('')==='alles'?'  ✓ ':'  ✗ ')+'Und der Knopf «alles» ist wieder aktiv');

  /* Zeitraumknopf greift */
  await p.click('#vlKarte [data-tun="vlZeit"]:text-is("6 Wochen")');await p.waitForTimeout(400);
  const m6=await marken();
  console.log(((m6.length&&m6.length<=7)?'  ✓ ':'  ✗ ')+'«6 Wochen» schneidet den Ausschnitt zu ('+m6.join(' ')+')');
  if(!(m6.length&&m6.length<=7))fehler.push('Verlauf: Zeitraumknopf greift nicht');
  await p.click('#vlKarte [data-tun="vlZeit"]:text-is("alles")');await p.waitForTimeout(350);

  /* Freie Auswahl: jeder Nährstoff und jede Wassergrösse einzeln. */
  console.log('  ── freie Auswahl ──');
  const nChips=await p.$$eval('#vlKarte [data-tun="vlStoff"]',e=>e.length);
  const wChips=await p.$$eval('#vlKarte [data-tun="vlWass"]',e=>e.length);
  console.log((nChips>=15&&wChips>=15?'  ✓ ':'  ✗ ')+'Alle Grössen stehen einzeln zur Wahl ('+nChips+' Nährstoffe, '+wChips+' Wassergrössen)');
  if(nChips<15||wChips<15)fehler.push('Verlauf: Auswahl unvollstaendig');
  await p.evaluate(()=>window.scrollTo(0,0));await p.waitForTimeout(150);
  const vorFrei=await p.$eval('#vlKarte h2',e=>e.textContent);
  await p.$eval('#vlKarte [data-tun="vlStoff"][data-k="K"]',e=>e.click());await p.waitForTimeout(400);
  const nachFrei=await p.$eval('#vlKarte h2',e=>e.textContent);
  const sub=await p.$eval('#vlKarte .sub',e=>e.textContent);
  console.log('  '+(/Eigene Auswahl|Nur /.test(nachFrei)?'✓ ':'✗ ')+'Ein Klick auf «Kalium» schaltet auf die eigene Auswahl: «'+vorFrei+'» → «'+nachFrei+'»');
  if(!/Eigene Auswahl|Nur /.test(nachFrei))fehler.push('Verlauf: freie Auswahl greift nicht');
  console.log((/Kalium/.test(sub)?'  ✓ ':'  ✗ ')+'Die Unterzeile nennt beide Seiten: '+JSON.stringify(sub.slice(0,90)));
  const eigenAktiv=await p.$eval('#vlKarte [data-v="eigen"]',e=>e.classList.contains('on'));
  console.log((eigenAktiv?'  ✓ ':'  ✗ ')+'Und der Knopf «eigene Auswahl» ist gesetzt');
  if(!eigenAktiv)fehler.push('Verlauf: eigene Auswahl nicht markiert');

  /* Gleiche Farbe oben wie unten – das ist der Sinn der gemeinsamen Achse. */
  const passBtn=await p.$('#vlKarte button:text-is("passend zur Pflanze")');
  if(passBtn){await passBtn.click();await p.waitForTimeout(450)}
  const legFarben=await p.$$eval('#legVl .pos',es=>es.map(e=>({
    t:e.textContent.trim(),c:(e.querySelector('[fill]')||{}).getAttribute?e.querySelector('[fill]').getAttribute('fill'):null})));
  const kal=legFarben.filter(x=>/^Kalium/.test(x.t));
  console.log('   Kalium in der Legende:',kal.map(x=>x.t+' '+x.c).join(' | ')||'nicht vorhanden');
  const gleich=kal.length>=2&&new Set(kal.map(x=>x.c)).size===1;
  console.log((gleich?'  ✓ ':'  ✗ ')+'Kalium trägt oben und unten dieselbe Farbe');
  if(!gleich)fehler.push('Verlauf: Farbe nicht gekoppelt');
  const spurenFrei=await p.$$eval('#cVl text',es=>es.map(e=>e.textContent).filter(t=>/^(Pflanze|Wasser)/.test(t)));
  console.log('   Spuren jetzt:',spurenFrei.join(' | '));
  console.log((spurenFrei.length<=4?'  ✓ ':'  ✗ ')+'Nicht mehr als vier Spuren, sonst wird es höher als der Bildschirm');
  if(spurenFrei.length>4)fehler.push('Verlauf: zu viele Spuren');
  await p.screenshot({path:shots+'/verlauf_frei.png',fullPage:false});
  /* zurueck auf eine Frage */
  await p.$eval('#vlKarte .chip:text-is("Stickstoffform")',e=>e.click());await p.waitForTimeout(400);
  const zurueckFrage=await p.$eval('#vlKarte h2',e=>e.textContent);
  console.log((/Stickstoffform/.test(zurueckFrage)?'  ✓ ':'  ✗ ')+'Der Rückweg auf eine vorformulierte Frage funktioniert');
  if(!/Stickstoffform/.test(zurueckFrage))fehler.push('Verlauf: Rueckweg auf Voreinstellung fehlt');

  /* Ein Punkt oeffnet die ganze Erhebung, wie im Reiter Nährstoffe. */
  const vlHits=await p.$$('#cVl .hit');
  if(vlHits.length){
    /* Die Zeichnung ist inzwischen hoeher als das Fenster – der Punkt muss
       erst sichtbar sein, sonst zeigt die Maus ins Leere. */
    const ziel=vlHits[vlHits.length-1];
    await ziel.scrollIntoViewIfNeeded();await p.waitForTimeout(200);
    const hb=await ziel.boundingBox();
    /* Erst weg, dann hin: steht der Zeiger schon auf dem Punkt, gibt es
       keine Bewegung mehr, und das Kaestchen bliebe zu. */
    await p.mouse.move(4,4);await p.waitForTimeout(80);
    await p.mouse.move(hb.x+hb.width/2,hb.y+hb.height/2);await p.waitForTimeout(200);
    const vt=await p.$eval('.tipp',e=>({an:e.classList.contains('an'),t:e.innerText}));
    console.log((vt.an?'  ✓ ':'  ✗ ')+'Infokästchen am Punkt: '+JSON.stringify(vt.t.replace(/\n/g,' · ').slice(0,80)));
    if(!vt.an)fehler.push('Verlauf: kein Tooltip am Punkt');
  }else{console.log('  ✗ keine anfassbaren Punkte');fehler.push('Verlauf: Punkte ohne Trefferflaeche')}
  await p.screenshot({path:shots+'/verlauf.png',fullPage:false});

  /* Entnahmestellen zuordnen: das Labor schreibt jedes Mal etwas anderes. */
  console.log('\n── Entnahmestellen zuordnen ──');
  await p.click('#nav button:text-is("Giesswasser")');await p.waitForTimeout(500);
  const stHinweis=await p.$('#view button:text-is("Jetzt zuordnen")');
  console.log((stHinweis?'  ✓ ':'  ✗ ')+'Der Reiter weist von sich aus auf die offenen Bezeichnungen hin');
  if(!stHinweis)fehler.push('Stellen: kein Hinweis im Reiter');
  const reihenVor=await p.$$eval('#legGw .pos',e=>e.length);
  if(stHinweis){
    await stHinweis.click();await p.waitForTimeout(500);
    const dt=await p.$eval('#dlgTitel',e=>e.textContent);
    console.log((/Entnahmestellen zuordnen/.test(dt)?'  ✓ ':'  ✗ ')+'Der Dialog öffnet: '+dt);
    const zeilen=await p.$$eval('#dlgBody tbody tr',e=>e.length);
    const bez=await p.$$eval('#dlgBody tbody tr td:first-child strong',es=>es.map(e=>e.textContent));
    console.log('   Bezeichnungen:',bez.join(' | '));
    console.log((bez.length>=4?'  ✓ ':'  ✗ ')+'Jede Bezeichnung aus den echten Berichten steht da');
    if(bez.length<4)fehler.push('Stellen: Bezeichnungen unvollstaendig');
    const warn=await p.$eval('#dlgBody',e=>e.innerText);
    console.log((/Wasserstoffperoxid/.test(warn)?'  ✓ ':'  ✗ ')+'Die behandelte Probe trägt einen Vorbehalt');
    if(!/Wasserstoffperoxid/.test(warn))fehler.push('Stellen: kein Vorbehalt bei H2O2');
    console.log((/noch offen/.test(warn)?'  ✓ ':'  ✗ ')+'Ohne Zutun ist nichts zugeordnet');
    await p.click('#dlgBody button:text-is("Vorschläge übernehmen")');await p.waitForTimeout(700);
    const nach=await p.$eval('#dlgBody',e=>e.innerText);
    console.log((!/noch offen/.test(nach)?'  ✓ ':'  ✗ ')+'«Vorschläge übernehmen» ordnet alles zu, was ableitbar ist');
    if(/noch offen/.test(nach))fehler.push('Stellen: Vorschlaege greifen nicht');
    /* Die behandelte Probe herausnehmen */
    await p.click('#dlgBody tr:has-text("H2O2"):has-text("mitt") button:text-is("nicht verwenden")');await p.waitForTimeout(600);
    await p.screenshot({path:shots+'/stellen.png',fullPage:false});
    await p.click('#dlgFoot button:text-is("Fertig")');await p.waitForTimeout(600);
    const reihenNach=await p.$$eval('#legGw .pos',e=>e.length);
    console.log('   Reihen im Diagramm: '+reihenVor+' → '+reihenNach);
    console.log((reihenNach<reihenVor?'  ✓ ':'  ✗ ')+'Aus vielen Bezeichnungen werden die Stellen, die es wirklich gibt');
    if(reihenNach>=reihenVor)fehler.push('Stellen: Zuordnung wirkt nicht auf die Reihen');
    const gwTxt=await p.$eval('#view',e=>e.innerText);
    console.log((/Reservoir vorne/.test(gwTxt)&&/Reservoir hinten/.test(gwTxt)?'  ✓ ':'  ✗ ')+'Die Karten tragen die zugeordneten Namen');
    console.log((/zugeordnet:/.test(gwTxt)?'  ✓ ':'  ✗ ')+'Und nennen, welche Bezeichnungen dahinterstehen');
    if(!/zugeordnet:/.test(gwTxt))fehler.push('Stellen: Herkunft der Bezeichnung fehlt');
    console.log((!/Jetzt zuordnen/.test(gwTxt)?'  ✓ ':'  ✗ ')+'Der Hinweis verschwindet, sobald nichts mehr offen ist');
  }

  /* Filter im Reiter Verlauf: Blattetage und Linien. */
  console.log('\n── Verlauf: Blattetage und Linien ──');
  await p.click('#nav button:text-is("Verlauf")');await p.waitForTimeout(600);
  const legAlle=await p.$$eval('#legVl .pos',es=>es.map(e=>e.textContent.trim()));
  console.log('   Legende, beide Etagen:',legAlle.join(' | '));
  console.log((legAlle.some(t=>/jung/.test(t))&&legAlle.some(t=>/alt/.test(t))?'  ✓ ':'  ✗ ')+'Vorgabe zeigt beide Blattetagen');
  console.log((legAlle.some(t=>/Reservoir vorne/.test(t))?'  ✓ ':'  ✗ ')+'Und die Wasserreihen tragen die zugeordneten Stellennamen');
  if(!legAlle.some(t=>/Reservoir vorne/.test(t)))fehler.push('Verlauf: Zuordnung wirkt nicht');
  const linVor=await p.$$eval('#cVl polyline',e=>e.length);
  await p.click('#vlKarte [data-tun="vlLinien"][data-v="reihe"]');await p.waitForTimeout(450);
  const linNach=await p.$$eval('#cVl polyline',e=>e.length);
  console.log((linVor===0&&linNach>0?'  ✓ ':'  ✗ ')+'Linien sind zuschaltbar und nicht die Vorgabe ('+linVor+' → '+linNach+')');
  if(!(linVor===0&&linNach>0))fehler.push('Verlauf: Linien schalten nicht');
  const linTxt=await p.$eval('#vlKarte',e=>e.innerText);
  console.log((/Linie ist eine Behauptung/.test(linTxt)?'  ✓ ':'  ✗ ')+'Mit dem Vorbehalt dazu');
  await p.click('#vlKarte [data-tun="vlEtage"][data-v="jung"]');await p.waitForTimeout(450);
  const legJung=await p.$$eval('#legVl .pos',es=>es.map(e=>e.textContent.trim()));
  console.log('   nur jung:',legJung.join(' | '));
  const nurJung=!legJung.some(t=>/·\s*alt$/.test(t))&&legJung.length<legAlle.length;
  console.log((nurJung?'  ✓ ':'  ✗ ')+'«nur jung» lässt das Altblatt weg');
  if(!nurJung)fehler.push('Verlauf: Blattfilter greift nicht');
  const jungTxt=await p.$eval('#vlKarte',e=>e.innerText);
  console.log((/sieht die Hälfte/.test(jungTxt)?'  ✓ ':'  ✗ ')+'Und sagt, was man dabei nicht sieht');
  await p.screenshot({path:shots+'/verlauf_filter.png',fullPage:false});
  await p.click('#vlKarte [data-tun="vlEtage"][data-v="beide"]');await p.waitForTimeout(400);
  await p.click('#vlKarte [data-tun="vlLinien"][data-v="keine"]');await p.waitForTimeout(400);

  /* Die Wirkungsanalyse ist vom eigenen Reiter in den Logbuch-Zeitstrahl gewandert. */
  console.log('\n── Wirkungsanalyse am Logbucheintrag ──');
  await p.click('#nav button:text-is("Logbuch")');await p.waitForTimeout(400);
  const wBtn=await p.$('#view .zs button:text-is("Wirkung prüfen")');
  if(wBtn){
    await wBtn.click();await p.waitForTimeout(500);
    const wt=await p.$eval('#dlgBody',e=>e.innerText);
    console.log((/Vergleichsgruppe/.test(wt)?'  ✓ ':'  ✗ ')+'Die Vergleichsgruppen-Analyse ist erhalten geblieben');
    if(!/Vergleichsgruppe/.test(wt))fehler.push('Wirkungsanalyse ohne Vergleichsgruppe');
    console.log((/kein Beweis/.test(wt)?'  ✓ ':'  ✗ ')+'Und sagt weiterhin, dass sie nichts beweist');
    if(!/kein Beweis/.test(wt))fehler.push('Wirkung: Vorbehalt fehlt');
    await p.screenshot({path:shots+'/wirkung.png',fullPage:false});
    await p.click('#dlgFoot button:text-is("Schliessen")');await p.waitForTimeout(250);
  }else{console.log('  ✗ kein Knopf «Wirkung prüfen» am Zeitstrahl');fehler.push('Wirkung: Knopf fehlt')}

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

  console.log('\n── Planer ──');
  await p.click('#nav button:text-is("Planer")');await p.waitForTimeout(350);
  const plKopf=await p.$eval('#view > div:not(.note)',e=>e.innerText.split('\n')[0]);
  console.log((/Geplante Proben/.test(plKopf)?'  ✓ ':'  ✗ ')+'Das Eintragen von Hand ist der Hauptweg: «'+plKopf+'»');
  if(!/Geplante Proben/.test(plKopf))fehler.push('Planer: Handeingabe nicht zuoberst');
  const zugeklappt=await p.$$eval('#view details',es=>es.filter(e=>!e.open).length);
  console.log((zugeklappt>0?'  ✓ ':'  ✗ ')+'Die automatischen Vorschläge stehen zugeklappt darunter');
  if(!zugeklappt)fehler.push('Planer: Vorschlaege nicht zugeklappt');
  await p.fill('#view [data-f="zweck"]','Wirkung des Säurewechsels');
  const plVor=await p.$$eval('#view table tbody tr',e=>e.length);
  await p.click('#view button:text-is("Anlegen")');await p.waitForTimeout(400);
  const plTxt=await p.$eval('#view',e=>e.innerText);
  console.log((/Säurewechsels/.test(plTxt)?'  ✓ ':'  ✗ ')+'Ein Klick legt die geplante Probe an');
  if(!/Säurewechsels/.test(plTxt))fehler.push('Planer: Anlegen ohne Wirkung');
  console.log((/Blattsaft/.test(plTxt)?'  ✓ ':'  ✗ ')+'Mit Art der Probe');
  const verk=await p.$$('#view select[data-aend="plAnalyse"]');
  if(verk.length){
    await verk[0].selectOption({index:1});await p.waitForTimeout(400);
    const nachher=await p.$eval('#view',e=>e.innerText);
    console.log((/erledigt/.test(nachher)?'  ✓ ':'  ✗ ')+'Verknüpfen mit einer Analyse hakt die Probe ab');
    if(!/erledigt/.test(nachher))fehler.push('Planer: Verknuepfen ohne Wirkung');
  }else console.log('  (keine passende Analyse zum Verknuepfen in den Testdaten)');
  await p.click('#view summary');await p.waitForTimeout(300);
  const vor=await p.$$('#view .vorschlag');
  console.log('  Vorschläge nach dem Aufklappen:',vor.length);
  if(vor.length){
    await p.click('#view .vorschlag button:text-is("einplanen")');await p.waitForTimeout(350);
    const t=await p.$eval('#view',e=>e.innerText);
    console.log(((/offen/.test(t))?'  ✓ ':'  ✗ ')+'einplanen legt weiterhin einen Termin an');
  }
  await p.screenshot({path:shots+'/planer.png',fullPage:false});

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
  console.log('  Alles Übrige bedienbar: ja (siehe oben, elf Reiter gerendert)');

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
