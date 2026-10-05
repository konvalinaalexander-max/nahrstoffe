/* Die schlanke App in Chromium: fünf Reiter leer und gefüllt, Bericht im
   Pop-up, Import über den Kontrolldialog, das Diagramm mit Auswahl, Zoom und
   Klick, «＋ Massnahme eintragen», Balken ein- und ausblenden, pH & EC am
   Tank, Einträge der Maske, Stellen zuordnen, Handybreite, Escaping.
   Aufruf:  CHROME=… NODE_PATH=… node pruefung/browser.js                   */
const {chromium}=require('playwright');
const path=require('path').resolve(__dirname,'..','basilikum.html');
const daten=__dirname+'/testdaten.json';
const seiten=require('./seiten.json');
const shots=(process.env.SHOTS||require('os').tmpdir()+'/basilikum-shots');
require('fs').mkdirSync(shots,{recursive:true});
let fehler=0;
const ok=(b,t)=>{if(!b)fehler++;console.log((b?'  ✓ ':'  ✗ FEHLER ')+t)};
const kaputt=t=>/undefined|NaN|\[object Object\]|liess sich nicht aufbauen/.test(t);

(async()=>{
  const b=await chromium.launch(process.env.CHROME?{executablePath:process.env.CHROME,args:['--no-sandbox']}:{});
  const p=await b.newPage({viewport:{width:1280,height:1000}});
  const stoerung=[];
  p.on('console',m=>{const t=m.text();if(m.type()==='error'&&!/Failed to load resource|net::ERR_/.test(t))stoerung.push('console: '+t)});
  p.on('pageerror',e=>stoerung.push('pageerror: '+e.message));
  p.on('dialog',d=>d.accept());
  await p.goto('file://'+path);
  await p.waitForTimeout(1500);

  const reiter=await p.$$eval('#nav button[data-tun="reiter"]',bs=>bs.map(b=>b.textContent));
  console.log('Reiter:',reiter.join(' · '));
  ok(reiter.join('|')==='Analysen|Blattsaft & Giesswasser|pH & EC am Tank|Einträge Maske|Einstellungen','Fünf Reiter');
  ok(await p.$eval('#nav button.active',e=>e.textContent)==='Blattsaft & Giesswasser','Die App öffnet mit Blattsaft & Giesswasser');

  console.log('\n── leere Datenbank ──');
  for(const t of reiter){
    await p.click(`#nav button:text-is("${t}")`);await p.waitForTimeout(160);
    const txt=await p.$eval('#view',e=>e.innerText);
    ok(!kaputt(txt),t+' – leer sauber ('+txt.replace(/\n+/g,' ').slice(0,60)+')');
  }
  await p.click('#nav button:text-is("Blattsaft & Giesswasser")');await p.waitForTimeout(200);
  ok(/Noch keine Analysen/.test(await p.$eval('#view',e=>e.innerText))&&!!(await p.$('#view button:text-is("Zu den Analysen")')),'Ohne Analysen: Hinweis mit dem Weg zu den Analysen');

  console.log('\n── Datei laden ──');
  await p.setInputFiles('#fileJson',daten);await p.waitForTimeout(900);
  if(await p.$eval('#dlg',d=>d.open))await p.click('#dlgFoot button.primary');
  ok(await p.evaluate(()=>db.analysen.length)===10,'Die Testdaten sind geladen (10 Analysen)');

  console.log('\n── gefüllte Datenbank ──');
  for(const t of reiter){
    await p.click(`#nav button:text-is("${t}")`);await p.waitForTimeout(350);
    const txt=await p.$eval('#view',e=>e.innerText);
    const svg=await p.$$eval('#view svg',s=>s.length);
    ok(!kaputt(txt),t.padEnd(24)+svg+' svg · '+txt.length+' Zeichen');
    await p.screenshot({path:shots+'/'+t.replace(/[^\wÄÖÜäöü]/g,'_')+'.png',fullPage:false});
  }

  console.log('\n── Analysen: Liste und Bericht ──');
  await p.click('#nav button:text-is("Analysen")');await p.waitForTimeout(250);
  ok(!!(await p.$('#drop'))&&!!(await p.$('#view button:text-is("Dateien wählen")')),'Oben: hochladen');
  const zeilen=await p.$$eval('#view table tbody tr',es=>es.map(e=>e.innerText.replace(/\s+/g,' ')));
  ok(zeilen.length===8,'Darunter alle Analysen – jung und alt eines Berichts in einer Zeile ('+zeilen.length+' Berichte aus 10 Proben)');
  ok(/01\.09\.2026/.test(zeilen[0]),'Neueste zuerst');
  await p.click('#view .seg button:has-text("Giesswasser")');await p.waitForTimeout(200);
  ok((await p.$$eval('#view table tbody tr',es=>es.length))===5,'Filter «Giesswasser»: fünf Proben');
  await p.click('#view .seg button:has-text("alle")');await p.waitForTimeout(200);
  await p.click('#view table tbody tr:has-text("18.08.2026"):has-text("Blattsaft")');await p.waitForTimeout(350);
  const titel=await p.$eval('#dlgTitel',e=>e.textContent);
  const kopf=await p.$$eval('#dlgBody thead th',es=>es.map(e=>e.textContent).join(' | '));
  const bericht=await p.$eval('#dlgBody',e=>e.innerText);
  ok(titel==='Blattsaft · Satz 28-478 · 18.08.2026','Bericht: '+titel);
  ok(kopf==='Parameter | junges Blatt | altes Blatt | Optimum (Labor)','Spalten: '+kopf);
  ok(/STICKSTOFF/i.test(bericht)&&/SPURENELEMENTE/i.test(bericht)&&(await p.$$eval('#dlgBody .bar .opt',e=>e.length))>30,'Gruppiert wie der Laborbericht, jeder Wert mit seinem Optimum als Band');
  ok(!/Befund|zu tief|zu hoch|unter Optimum|über Optimum|zählt|Nächster Schritt|Kennzahl/.test(bericht),'Keine Deutung');
  await p.screenshot({path:shots+'/bericht.png'});
  await p.click('#dlgFoot button:text-is("Schliessen")');

  console.log('\n── Import über den Kontrolldialog ──');
  /* Ohne pdf.js: der Kontrolldialog bekommt, was der Parser aus dem echten
     Bericht liest (pruefung/seiten.json). */
  await p.evaluate(s=>{const r=parseNCC(s);db.analysen=db.analysen.filter(a=>a.datum!=='2026-08-18'||a.typ!=='blattsaft');
    pruefdialog(r.proben.map(x=>Object.assign({id:uid(),typ:'blattsaft',labor:r.labor,quelle:{datei:'NCC 28-478.pdf',text:r.rohtext},hinweise:r.hinweise.slice()},x)))},seiten);
  await p.waitForTimeout(400);
  ok(/Kontrollieren und übernehmen · 2 Proben/.test(await p.$eval('#dlgTitel',e=>e.textContent)),'Der Kontrolldialog öffnet mit beiden Proben');
  const opt=await p.$$eval('#dlgBody [data-feld] .tiny',es=>es.map(e=>e.textContent).filter(t=>/^Optimum/.test(t)).length);
  ok(opt>=40,'Unter jedem Feld das Optimum des Labors ('+opt+')');
  ok(!(await p.$('#dlgBody details')),'Keine Satz-Angaben, kein Kulturalter mehr');
  await p.click('#dlgFoot button:text-is("Übernehmen")');await p.waitForTimeout(700);
  ok(await p.$eval('#nav button.active',e=>e.textContent)==='Analysen'&&/Satz 28-478 · 18\.08\.2026/.test(await p.$eval('#dlgTitel',e=>e.textContent)),'Nach dem Übernehmen: Reiter Analysen, der neue Bericht offen');
  await p.click('#dlgFoot button:text-is("Schliessen")');

  console.log('\n── Blattsaft & Giesswasser ──');
  await p.click('#nav button:text-is("Blattsaft & Giesswasser")');await p.waitForTimeout(500);
  const wz=await p.$$eval('#kbKopf .wz > .lab',es=>es.map(e=>e.textContent));
  ok(wz.join('|')==='Blattsaft|Blatt|Giesswasser','Die Bedienung: Blattsaft – Blatt, Linien, Anzeige – Giesswasser');
  const fenster=await p.$$eval('#cKb text',es=>es.map(e=>e.textContent));
  ok(fenster.indexOf('Blattsaft')>=0&&fenster.indexOf('Giesswasser')>fenster.indexOf('Blattsaft')&&fenster.indexOf('Kulturmanagement')>fenster.indexOf('Giesswasser'),'Zwei Fenster und darunter das Kulturmanagement');
  const vorher=await p.$$eval('#cKb circle.hit',e=>e.length);
  await p.click('#kbKopf .chip:text-is("Calcium")');await p.waitForTimeout(350);
  ok((await p.$$eval('#cKb circle.hit',e=>e.length))>vorher,'Calcium dazu: mehr Punkte');
  const y0=await p.evaluate(()=>window.scrollY);
  await p.evaluate(()=>window.scrollTo(0,200));await p.waitForTimeout(100);
  const yVor=await p.evaluate(()=>window.scrollY);
  /* Geklickt wird ohne Scrollen – wie mit der Maus an einer Stelle, die man gerade sieht. */
  await p.evaluate(()=>[...document.querySelectorAll('#kbKopf button')].find(b=>b.textContent.trim()==='jung').click());await p.waitForTimeout(350);
  ok(yVor>100&&Math.abs((await p.evaluate(()=>window.scrollY))-yVor)<5,'Umschalten zeichnet nur das Diagramm neu – die Seite bleibt stehen ('+yVor+' px)');
  await p.evaluate(y=>window.scrollTo(0,y),y0);
  await p.click('#kbKopf button:text-is("beide")');await p.waitForTimeout(250);
  await p.click('#kbKopf button:text-is("Lage im Optimum")');await p.waitForTimeout(350);
  ok((await p.$$eval('#cKb text',es=>es.map(e=>e.textContent))).includes('Optimum'),'«Lage im Optimum»: ein Fenster mit darunter – Optimum – darüber');
  await p.click('#kbKopf button:text-is("Messwert")');await p.waitForTimeout(300);
  await p.click('#kbKopf button:text-is("je Reihe")');await p.waitForTimeout(300);
  ok((await p.$$eval('#cKb polyline',e=>e.length))>0,'Linien je Reihe');
  await p.click('#kbKopf button:text-is("keine")');await p.waitForTimeout(300);
  /* Zeigen und Klicken */
  await p.$eval('#cKb',e=>e.scrollIntoView({block:'center'}));await p.waitForTimeout(150);
  const hit=(await p.$$('#cKb circle.hit'))[0];
  await hit.hover({force:true});await p.waitForTimeout(150);
  const kasten=await p.$eval('.tipp',e=>({an:e.classList.contains('an'),t:e.innerText}));
  ok(kasten.an&&/Messwert/.test(kasten.t)&&/Optimum \(Labor\)/.test(kasten.t),'Zeigen auf einen Punkt: das Kästchen mit Wert und Optimum');
  await hit.click({force:true});await p.waitForTimeout(350);
  ok(/^Blattsaft · Satz/.test(await p.$eval('#dlgTitel',e=>e.textContent)),'Klick auf den Punkt öffnet den Bericht');
  await p.click('#dlgFoot button:text-is("Schliessen")');
  /* Zoomen und Zurücksetzen */
  const achse0=await p.$$eval('#cKb text',es=>es.map(e=>e.textContent).filter(t=>/^(Jan|Feb|Mär|Apr|Mai|Jun|Jul|Aug|Sep|Okt|Nov|Dez) \d\d$|^\d\d\.\d\d\.$/.test(t)).join(' '));
  const box=await (await p.$('#cKb svg')).boundingBox();
  await p.mouse.move(box.x+box.width*0.6,box.y+120);
  for(let i=0;i<6;i++){await p.mouse.wheel(0,-200);await p.waitForTimeout(80)}
  await p.waitForTimeout(300);
  const achse1=await p.$$eval('#cKb text',es=>es.map(e=>e.textContent).filter(t=>/^(Jan|Feb|Mär|Apr|Mai|Jun|Jul|Aug|Sep|Okt|Nov|Dez) \d\d$|^\d\d\.\d\d\.$/.test(t)).join(' '));
  ok(achse1!==achse0,'Das Rad zoomt die Zeitachse ('+achse1.slice(0,40)+')');
  await p.dblclick('#cKb svg',{position:{x:box.width*0.6,y:120}});await p.waitForTimeout(400);
  const achse2=await p.$$eval('#cKb text',es=>es.map(e=>e.textContent).filter(t=>/^(Jan|Feb|Mär|Apr|Mai|Jun|Jul|Aug|Sep|Okt|Nov|Dez) \d\d$|^\d\d\.\d\d\.$/.test(t)).join(' '));
  ok(achse2===achse0,'Doppelklick setzt zurück');

  console.log('\n── ＋ Massnahme und Balken ──');
  await p.click('#view button:text-is("＋ Massnahme eintragen")');await p.waitForTimeout(250);
  await p.fill('#mnName','Schattierung');await p.fill('#mnVon','2026-09-15');
  await p.click('#dlgFoot button:text-is("Eintragen")');await p.waitForTimeout(400);
  const balken=()=>p.$$eval('#cKb g.spb text',ts=>ts.map(t=>t.textContent));
  ok((await balken()).includes('Schattierung seit 15.09.'),'Eine neue Massnahme steht sofort als Balken da');
  await p.$$eval('#cKb g.spb',gs=>{const g=gs.find(x=>/Schattierung/.test(x.textContent));g.dispatchEvent(new MouseEvent('click',{bubbles:true}))});await p.waitForTimeout(300);
  ok(await p.$eval('#dlgTitel',e=>e.textContent)==='Schattierung','Klick auf den Balken öffnet sie zum Ändern');
  await p.click('#spLaeuft');await p.fill('#spBis','2026-09-30');
  await p.click('#dlgFoot button:text-is("Speichern")');await p.waitForTimeout(400);
  ok((await balken()).includes('Schattierung 15.09.–30.09.'),'Ende gesetzt');
  await p.click('#view button:text-is("＋ Massnahme eintragen")');await p.waitForTimeout(250);
  await p.selectOption('#mnWas','t|Gerätekalibrierung');
  ok(await p.$eval('#mnDauerBox',e=>e.hidden)&&await p.$eval('#mnNameBox',e=>e.hidden),'Ein Ereignis braucht weder Namen noch Dauer – die Felder verschwinden');
  await p.fill('#mnVon','2026-09-20');await p.fill('#mnNotiz','pH-Sonde neu');
  await p.click('#dlgFoot button:text-is("Eintragen")');await p.waitForTimeout(400);
  ok(await p.evaluate(()=>db.ereignisse.some(e=>e.typ==='Gerätekalibrierung'&&e.datum==='2026-09-20'&&e.notiz==='pH-Sonde neu')),'Die Kalibrierung ist eingetragen');
  await p.click('#view button:text-is("Balken ein- und ausblenden")');await p.waitForTimeout(250);
  const chips=await p.$$eval('#dlgBody [data-tun="kmAn"]',es=>es.map(e=>e.textContent.trim()));
  ok(chips.includes('Schattierung')&&chips.includes('Gerätekalibrierung')&&chips.includes('Biorga'),'Im Dialog: jede Zeile einzeln ('+chips.join(', ')+')');
  await p.click('#dlgBody [data-tun="kmAn"]:has-text("Schattierung")');await p.waitForTimeout(300);
  await p.click('#dlgFoot button:text-is("Fertig")');await p.waitForTimeout(200);
  ok(!(await balken()).some(t=>/Schattierung/.test(t)),'Schattierung ausgeblendet');
  await p.screenshot({path:shots+'/kombi.png',fullPage:true});

  console.log('\n── pH & EC am Tank ──');
  await p.click('#nav button:text-is("pH & EC am Tank")');await p.waitForTimeout(400);
  const tk=await p.$eval('#view',e=>e.innerText);
  ok(/Messungen \(3\)/.test(tk),'Die Liste der Messungen');
  ok((await p.$$eval('#cTank text',es=>es.map(e=>e.textContent))).includes('pH'),'Darüber das Diagramm');
  await p.click('#view button[data-tun="messungWeg"]');await p.waitForTimeout(300);
  ok(/Messungen \(2\)/.test(await p.$eval('#view',e=>e.innerText)),'Entfernen (mit Rückfrage)');

  console.log('\n── Einträge Maske ──');
  await p.evaluate(()=>{db.messungen.push({id:'mx',datum:'2026-10-04',zeit:'07:45',stelle:'Reservoir vorne',ph:6.1,ec:1.31,wer:'MK',quelle:'erfassen'});render()});
  await p.click('#nav button:text-is("Einträge Maske")');await p.waitForTimeout(300);
  ok(/MK/.test(await p.$eval('#view',e=>e.innerText))&&/pH 6.1/.test(await p.$eval('#view',e=>e.innerText)),'Die Messung vom Handy steht in der Liste');

  console.log('\n── Einstellungen: Stellen zuordnen ──');
  await p.click('#nav button:text-is("Einstellungen")');await p.waitForTimeout(300);
  ok(/4 noch nicht zugeordnet/.test(await p.$eval('#view',e=>e.innerText)),'Vier Bezeichnungen sind offen');
  await p.click('#view button:text-is("Stellen zuordnen")');await p.waitForTimeout(300);
  await p.click('#dlgBody button:text-is("Vorschläge übernehmen")');await p.waitForTimeout(400);
  await p.click('#dlgFoot button:text-is("Fertig")');await p.waitForTimeout(300);
  ok(/alle zugeordnet/.test(await p.$eval('#view',e=>e.innerText)),'Nach «Vorschläge übernehmen»: alle zugeordnet');
  await p.click('#nav button:text-is("Blattsaft & Giesswasser")');await p.waitForTimeout(400);
  const legende=await p.$eval('#kbKopf .zeichen',e=>e.innerText.replace(/\s+/g,' ').trim());
  ok(legende==='vorne hinten','Über dem Diagramm nur noch die zwei Reservoirs: '+legende);

  console.log('\n── Escaping ──');
  await p.evaluate(()=>{db.analysen.push({id:'gift',typ:'giesswasser',datum:'2026-09-30',stelle:'<img src=x onerror=alert(1)>',werte:{gw_K:{wert:0.6}},optima:{}});render()});
  await p.click('#nav button:text-is("Analysen")');await p.waitForTimeout(300);
  ok((await p.$eval('#view',e=>e.innerHTML)).indexOf('<img src=x')<0,'Ein Name mit Markup bleibt Text');

  console.log('\n── Handybreite ──');
  await p.setViewportSize({width:390,height:860});
  for(const t of reiter){
    await p.click(`#nav button:text-is("${t}")`).catch(async()=>{await p.$eval(`#nav button[data-reiter]`,()=>{});});
    await p.evaluate(t=>{const x=[...document.querySelectorAll('#nav button')].find(b=>b.textContent===t);x.click()},t);await p.waitForTimeout(300);
    const breit=await p.evaluate(()=>document.documentElement.scrollWidth);
    ok(breit<=392,t+': keine seitliche Rollbalken auf der Seite ('+breit+' px)');
  }
  await p.screenshot({path:shots+'/handy.png',fullPage:true});

  console.log('\n── Ergebnis ──');
  if(stoerung.length){fehler+=stoerung.length;stoerung.forEach(x=>console.log('  ✗',x))}
  console.log(fehler?`  ${fehler} FEHLER`:'  ✓ Die App tut, was sie soll.');
  console.log('  Bildschirmfotos:',shots);
  await b.close();
  process.exit(fehler?1:0);
})().catch(e=>{console.error('ABBRUCH',e);process.exit(1)});
