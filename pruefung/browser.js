/* Die schlanke App in Chromium: fünf Reiter leer und gefüllt, Bericht im
   Pop-up, Import über den Kontrolldialog, die Grafiken mit Auswahl, Zeiger
   und Klick, Zoomen (Knöpfe, Schiebebalken, Strg + Rad, das Rad allein
   scrollt), «＋ Massnahme eintragen», Zeilen ordnen und ausblenden, pH & EC
   am Tank, Einträge der Maske, Stellen zuordnen, Handybreite, Escaping.
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
  ok(reiter.join('|')==='Blattsaft & Giesswasser|Analysen|pH & EC am Tank|Einträge Maske|Einstellungen','Fünf Reiter, Blattsaft & Giesswasser zuerst');
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
  const tafeln=await p.$$eval('#cKb .tafelKopf h3',es=>es.map(e=>e.textContent));
  ok(tafeln.join('|')==='Blattsaft|Giesswasser|Kulturmanagement','Drei Grafiken untereinander: '+tafeln.join(' · '));
  const achsen=await p.$$eval('#cKb .tafel',ts=>ts.map(t=>[...t.querySelectorAll('svg text')].filter(x=>/^(Jan|Feb|Mär|Apr|Mai|Jun|Jul|Aug|Sep|Okt|Nov|Dez) \d\d$|^\d\d\.\d\d\.$/.test(x.textContent)).length));
  ok(achsen.length===3&&achsen.every(n=>n>=3),'Jede hat ihre eigene Datumsachse ('+achsen.join(' / ')+' Marken)');
  /* Ein Knopf in der Kopfzeile einer bestimmten Grafik */
  const inTafel=(titel,sel,text)=>p.evaluate(([titel,sel,text])=>{
    const t=[...document.querySelectorAll('#cKb .tafel')].find(x=>x.querySelector('h3').textContent===titel);
    const e=[...t.querySelectorAll(sel)].find(x=>x.textContent.trim()===text);e.click();return true},[titel,sel,text]);
  const vorher=await p.$$eval('#cKb circle.hit',e=>e.length);
  await inTafel('Blattsaft','.chip','Calcium');await p.waitForTimeout(350);
  ok((await p.$$eval('#cKb circle.hit',e=>e.length))>vorher,'Calcium dazu (in der Kopfzeile des Blattsafts): mehr Punkte');
  const y0=await p.evaluate(()=>window.scrollY);
  await p.evaluate(()=>window.scrollTo(0,200));await p.waitForTimeout(100);
  const yVor=await p.evaluate(()=>window.scrollY);
  /* Geklickt wird ohne Scrollen – wie mit der Maus an einer Stelle, die man gerade sieht. */
  await inTafel('Blattsaft','button','jung');await p.waitForTimeout(350);
  ok(yVor>100&&Math.abs((await p.evaluate(()=>window.scrollY))-yVor)<5,'Umschalten zeichnet nur die Grafiken neu – die Seite bleibt stehen ('+yVor+' px)');
  await p.evaluate(y=>window.scrollTo(0,y),y0);
  await inTafel('Blattsaft','button','beide');await p.waitForTimeout(250);
  await inTafel('Blattsaft','button','Lage im Optimum');await p.waitForTimeout(350);
  ok((await p.$$eval('#cKb text',es=>es.map(e=>e.textContent))).includes('Optimum'),'«Lage im Optimum»: eine Achse mit darunter – Optimum – darüber');
  await inTafel('Blattsaft','button','Messwert');await p.waitForTimeout(300);
  await p.check('#cKb [data-aend="linienUm"]');await p.waitForTimeout(300);
  ok((await p.$$eval('#cKb polyline',e=>e.length))>0,'«Punkte verbinden» in der Zoomleiste: Linien je Reihe');
  await p.uncheck('#cKb [data-aend="linienUm"]');await p.waitForTimeout(300);
  ok((await p.$$eval('#cKb polyline',e=>e.length))===0,'… und wieder ohne');
  /* Zeigen und Klicken */
  await p.$eval('#cKb',e=>e.scrollIntoView({block:'start'}));await p.waitForTimeout(150);
  const hit=(await p.$$('#cKb circle.hit'))[0];
  await hit.hover({force:true});await p.waitForTimeout(150);
  const kasten=await p.$eval('.tipp',e=>({an:e.classList.contains('an'),t:e.innerText}));
  ok(kasten.an&&/Messwert/.test(kasten.t)&&/Optimum \(Labor\)/.test(kasten.t),'Zeigen auf einen Punkt: das Kästchen mit Wert und Optimum');
  const zeiger=await p.$$eval('#cKb .zeiger',zs=>zs.map(z=>z.getAttribute('x1')));
  ok(zeiger.length===3&&zeiger.every(x=>x===zeiger[0]&&+x>0),'Der Zeiger steht in allen drei Grafiken am selben Tag');
  await hit.click({force:true});await p.waitForTimeout(350);
  ok(/^Blattsaft · Satz/.test(await p.$eval('#dlgTitel',e=>e.textContent)),'Klick auf den Punkt öffnet den Bericht');
  await p.click('#dlgFoot button:text-is("Schliessen")');

  console.log('\n── Zoomen ──');
  const zeitraum=()=>p.$eval('#cKb .zlText',e=>e.textContent);
  const z0=await zeitraum();
  ok(await p.$eval('#cKb [data-tun="zoomAus"]',e=>e.disabled)&&await p.$eval('#cKb [data-tun="zeitVorgabe"][data-v="alles"]',e=>e.classList.contains('on')),'Zu Beginn: alles sichtbar, «−» gesperrt ('+z0+')');
  await p.evaluate(()=>window.scrollTo(0,0));await p.waitForTimeout(100);
  const svg1=await (await p.$('#cKb .bild svg')).boundingBox();
  await p.mouse.move(svg1.x+svg1.width*0.6,svg1.y+80);
  const yR=await p.evaluate(()=>window.scrollY);
  for(let i=0;i<3;i++){await p.mouse.wheel(0,200);await p.waitForTimeout(80)}
  await p.waitForTimeout(250);
  ok(await zeitraum()===z0&&(await p.evaluate(()=>window.scrollY))>yR,'Das Mausrad allein scrollt die Seite – es zoomt nicht mehr');
  await p.evaluate(()=>window.scrollTo(0,0));await p.waitForTimeout(150);
  await p.mouse.move(svg1.x+svg1.width*0.6,svg1.y+80);
  await p.keyboard.down('Control');for(let i=0;i<3;i++){await p.mouse.wheel(0,-150);await p.waitForTimeout(60)}await p.keyboard.up('Control');
  await p.waitForTimeout(250);
  const z1=await zeitraum();
  ok(z1!==z0&&(await p.evaluate(()=>window.scrollY))===0,'Strg + Rad zoomt – und die Seite bleibt, wo sie ist ('+z1+')');
  await p.click('#cKb [data-tun="zeitVorgabe"][data-v="alles"]');await p.waitForTimeout(250);
  ok(await zeitraum()===z0,'«alles» zeigt wieder alles');
  await p.click('#cKb [data-tun="zoomEin"]');await p.waitForTimeout(200);
  await p.click('#cKb [data-tun="zoomEin"]');await p.waitForTimeout(200);
  const z2=await zeitraum();
  const fenster=await p.$eval('#cKb .zlFenster',e=>parseFloat(e.style.width));
  ok(z2!==z0&&fenster>30&&fenster<42&&!(await p.$eval('#cKb [data-tun="zoomAus"]',e=>e.disabled)),'Zweimal «+»: 36 % des Zeitraums, das Fenster im Schiebebalken entsprechend schmal ('+z2+', '+fenster.toFixed(0)+' %)');
  const fb=await (await p.$('#cKb .zlFenster')).boundingBox();
  await p.mouse.move(fb.x+fb.width/2,fb.y+fb.height/2);await p.mouse.down();
  await p.mouse.move(fb.x+fb.width/2-120,fb.y+fb.height/2,{steps:6});await p.mouse.up();await p.waitForTimeout(250);
  const z3=await zeitraum();
  ok(z3!==z2&&Math.abs(await p.$eval('#cKb .zlFenster',e=>parseFloat(e.style.width))-fenster)<0.5,'Den Ausschnitt im Schiebebalken ziehen: verschoben, gleich lang ('+z3+')');
  const fb2=await (await p.$('#cKb .zlFenster')).boundingBox();
  await p.mouse.move(fb2.x+fb2.width/2,fb2.y+fb2.height/2);await p.mouse.down();await p.mouse.move(fb2.x-1000,fb2.y+fb2.height/2,{steps:6});await p.mouse.up();await p.waitForTimeout(200);
  ok(await p.$eval('#cKb .zlFenster',e=>parseFloat(e.style.left))<0.5,'Ganz nach links gezogen: der Ausschnitt bleibt am Anfang stehen');
  const svg2=await (await p.$('#cKb .bild svg')).boundingBox();
  const zv=await zeitraum();
  await p.mouse.move(svg2.x+svg2.width*0.4,svg2.y+100);await p.mouse.down();
  await p.mouse.move(svg2.x+svg2.width*0.4-250,svg2.y+100,{steps:8});await p.mouse.up();await p.waitForTimeout(250);
  ok(await zeitraum()!==zv,'In der Grafik ziehen verschiebt alle drei zugleich');
  const marken=await p.$$eval('#cKb .tafel',ts=>ts.map(t=>[...t.querySelectorAll('svg text')].filter(x=>/^(Jan|Feb|Mär|Apr|Mai|Jun|Jul|Aug|Sep|Okt|Nov|Dez) \d\d$|^\d\d\.\d\d\.$/.test(x.textContent)).map(x=>x.textContent).join(' ')));
  ok(marken.length===3&&marken[0]===marken[1]&&marken[1]===marken[2],'Alle drei Achsen zeigen dieselben Daten ('+marken[0].slice(0,40)+' …)');
  for(let i=0;i<6&&!(await p.$eval('#cKb [data-tun="zoomAus"]',e=>e.disabled));i++){await p.click('#cKb [data-tun="zoomAus"]');await p.waitForTimeout(150)}
  ok(await zeitraum()===z0&&await p.$eval('#cKb [data-tun="zoomAus"]',e=>e.disabled),'«−» bis alles wieder zu sehen ist');
  /* Unten am Bildrand, solange man in den Grafiken ist */
  await p.setViewportSize({width:1280,height:640});await p.evaluate(()=>window.scrollTo(0,120));await p.waitForTimeout(400);
  const leiste=await (await p.$('#cKb .zoomleiste')).boundingBox();
  const kmOben=await p.$eval('#cKb .tafel.km',e=>e.getBoundingClientRect().top);
  ok(Math.abs(leiste.y+leiste.height-640)<2&&kmOben>640,'Die Zoomleiste klebt am unteren Bildrand, solange die Grafiken weitergehen ('+Math.round(leiste.y)+' px)');
  await p.setViewportSize({width:1280,height:1000});await p.evaluate(()=>window.scrollTo(0,0));await p.waitForTimeout(400);

  console.log('\n── Kulturmanagement ──');
  const km=await p.$eval('#cKb .tafel.km',e=>e.innerText);
  ok(/^Kulturmanagement\s*\n\s*＋ Massnahme eintragen/.test(km),'Gleich unter der Überschrift: «＋ Massnahme eintragen»');
  ok(/▸ Ereignisse zeigen \(1\): Substrat/.test(km)&&(await p.$$eval('#cKb .tafel.km g.spb circle',e=>e.length))===0,'Die Ereignisse sind eingeklappt – eine Zeile nennt sie');
  ok(!(await p.$$eval('#cKb g.spb text',ts=>ts.some(t=>/^Biovin/.test(t.textContent)))),'Biovin steht in diesem Reiter nicht');
  await p.$$eval('#cKb [data-tun="kmEreignisse"]',e=>e[0].dispatchEvent(new MouseEvent('click',{bubbles:true})));await p.waitForTimeout(250);
  ok(await p.$$eval('#cKb .tafel.km svg text',es=>es.some(e=>e.textContent==='Substrat'))&&(await p.$$eval('#cKb .tafel.km g.spb circle',e=>e.length))>0&&/▾ Ereignisse verbergen/.test(await p.$eval('#cKb .tafel.km',e=>e.innerText)),'Ein Klick klappt sie auf');
  await p.$$eval('#cKb [data-tun="kmEreignisse"]',e=>e[0].dispatchEvent(new MouseEvent('click',{bubbles:true})));await p.waitForTimeout(250);

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
  ok(await p.$$eval('#cKb .tafel.km svg text',es=>es.some(e=>e.textContent==='Kalibrierung')),'… und gleich zu sehen: die Ereignisse klappen dafür auf');
  await p.click('#view button:text-is("Zeilen ordnen und ausblenden")');await p.waitForTimeout(250);
  const zeilen2=await p.$$eval('#dlgBody .kmZeile .kmName strong',es=>es.map(e=>e.textContent));
  ok(zeilen2.includes('Schattierung')&&zeilen2.includes('Gerätekalibrierung')&&zeilen2.includes('Biorga')&&!zeilen2.includes('Biovin'),'Im Dialog: jede Zeile einzeln ('+zeilen2.join(', ')+')');
  const zweite=zeilen2[1];
  await p.click('#dlgBody .kmZeile:nth-child(2) button[data-r="-1"]');await p.waitForTimeout(250);
  ok((await p.$$eval('#dlgBody .kmZeile .kmName strong',es=>es.map(e=>e.textContent)))[0]===zweite,'↑ schiebt «'+zweite+'» nach oben');
  const erste=await p.$eval('#cKb .tafel.km g.spb text',t=>t.textContent);
  ok(erste.indexOf(zweite)===0,'Die Balken folgen sofort der neuen Reihenfolge ('+erste+')');
  await p.uncheck('#dlgBody [data-aend="kmAn"][data-k="n|Schattierung"]');await p.waitForTimeout(300);
  ok(/zeigen/.test(await p.$eval('#dlgBody .kmZeile.aus',e=>e.innerText)),'Ausgeblendete Zeilen stehen blass im Dialog');
  await p.click('#dlgFoot button:text-is("Fertig")');await p.waitForTimeout(200);
  ok(!(await balken()).some(t=>/Schattierung/.test(t)),'Schattierung ausgeblendet');
  await p.screenshot({path:shots+'/kombi.png',fullPage:true});

  console.log('\n── pH & EC am Tank ──');
  await p.click('#nav button:text-is("pH & EC am Tank")');await p.waitForTimeout(400);
  const tk=await p.$eval('#view',e=>e.innerText);
  ok(/Alle Messungen als Liste \(3\)/.test(tk)&&!(await p.$eval('#tkListe details',e=>e.open)),'Die Liste der Messungen – eingeklappt');
  ok((await p.$$eval('#cTank .tafelKopf h3',es=>es.map(e=>e.textContent))).join('|')==='pH|EC|Kulturmanagement','Darüber pH und EC als eigene Grafiken, dann das Kulturmanagement');
  await p.click('#tkListe summary');await p.waitForTimeout(200);
  await p.click('#view button[data-tun="messungWeg"]');await p.waitForTimeout(300);
  ok(/Alle Messungen als Liste \(2\)/.test(await p.$eval('#view',e=>e.innerText))&&await p.$eval('#tkListe details',e=>e.open),'Entfernen (mit Rückfrage) – die Liste bleibt dabei offen');

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
  const legende=await p.$eval('#cKb .tafelKopf .zeichen',e=>e.innerText.replace(/\s+/g,' ').trim());
  ok(legende==='vorne hinten','In der Kopfzeile des Giesswassers nur noch die zwei Reservoirs: '+legende);

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
