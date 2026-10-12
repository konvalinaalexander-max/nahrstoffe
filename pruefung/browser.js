/* Die schlanke App in Chromium: fünf Reiter leer und gefüllt, Bericht im
   Pop-up, Import über den Kontrolldialog, die Grafiken mit Auswahl, Zeiger
   und Klick (nächster Punkt), Zoomen (− und + oben rechts, Rollbalken,
   Strg + Rad, das Rad allein scrollt, Tastatur), «Punkte verbinden» je
   Grafik, das Kulturmanagement zwischen den Grafiken mit Ziehen-und-Ablegen,
   pH, EC & O₂, Einträge der Mobile App, Stellen zuordnen, Handybreite.
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
  ok(reiter.join('|')==='Blattsaft & Giesswasser|pH, EC & O₂|Einträge Mobile App|Analysen|Einstellungen','Fünf Reiter in der gewünschten Reihenfolge');
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
  const zeilenDatum=await p.$$eval('#view table tbody tr',es=>es.map(e=>e.querySelector('td').textContent));
  ok((await p.$$eval('#view table tbody tr.tagNeu',es=>es.length))===new Set(zeilenDatum).size-1,'Ein Strich trennt die Tage – was am selben Tag kam, steht beisammen');
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
  ok(tafeln.join('|')==='Blattsaft|Kulturmanagement|Giesswasser','Das Kulturmanagement steht zwischen Blattsaft und Giesswasser: '+tafeln.join(' · '));
  const DAT=/^(Jan|Feb|Mär|Apr|Mai|Jun|Jul|Aug|Sep|Okt|Nov|Dez) \d\d$|^\d\d\.\d\d\.$|^\d\d:00$/;
  const achsen=await p.$$eval('#cKb .tafel:not(.km)',(ts,re)=>ts.map(t=>[...t.querySelectorAll('svg text')].filter(x=>new RegExp(re).test(x.textContent)).length),DAT.source);
  ok(achsen.length===2&&achsen.every(n=>n>=3),'Beide Grafiken haben ihre eigene Datumsachse ('+achsen.join(' / ')+' Marken)');
  const zz=await p.$eval('#cKb .zeitzeile',e=>({t:e.innerText.replace(/\s+/g,' '),oben:e.getBoundingClientRect().top,
    rechts:e.querySelector('.zlZoom').getBoundingClientRect().right,box:e.closest('.zeitbild').getBoundingClientRect().right,
    erste:document.querySelector('#cKb .tafel').getBoundingClientRect().top}));
  ok(zz.oben<zz.erste&&zz.box-zz.rechts<40,'− und + stehen oben rechts, über der ersten Grafik');
  ok(/· \d+ Tage/.test(zz.t)&&/alles/.test(zz.t)&&!/6 Monate|3 Monate/.test(zz.t),'Daneben der Zeitraum und «alles» – feste Zeiträume, die länger als die Daten wären, fehlen ('+zz.t.trim()+')');
  /* Ein Knopf in der Kopfzeile einer bestimmten Grafik */
  const inTafel=(titel,sel,text)=>p.evaluate(([titel,sel,text])=>{
    const t=[...document.querySelectorAll('#cKb .tafel')].find(x=>x.querySelector('h3').textContent===titel);
    const e=[...t.querySelectorAll(sel)].find(x=>x.textContent.trim()===text);e.click();return true},[titel,sel,text]);
  const punkte=()=>p.evaluate(()=>ZEIT.treffer.flat().length);
  ok(!(await p.$('#cKb circle.hit')),'Keine unsichtbaren Trefferkreise mehr – der nächste Punkt wird gerechnet');
  const vorher=await punkte();
  await inTafel('Blattsaft','.chip','Calcium');await p.waitForTimeout(350);
  ok(await punkte()>vorher,'Calcium dazu (in der Kopfzeile des Blattsafts): mehr Punkte ('+vorher+' → '+await punkte()+')');
  /* Zeigen auf einen Stoff hebt seine Reihen hervor – abgewählt bleibt nichts blass */
  await p.hover('#cKb .tafel .wahl .chip:text-is("Calcium")');await p.waitForTimeout(300);
  const hebt=await p.$eval('#cKb .tafeln',e=>e.classList.contains('hebt'));
  await p.click('#cKb .tafel .wahl .chip:text-is("Calcium")');await p.waitForTimeout(350);
  ok(hebt&&!(await p.$eval('#cKb .tafeln',e=>e.classList.contains('hebt'))),'Zeigen auf «Calcium» hebt es hervor; abgewählt sind die übrigen Reihen wieder voll');
  await p.click('#cKb .tafel .wahl .chip:text-is("Calcium")');await p.waitForTimeout(350);
  await p.mouse.move(5,5);
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
  /* «Punkte verbinden» bei den Nährstoffen jeder Grafik */
  const verbinden=await p.$$eval('#cKb .tafel .wahl label.verbinden input',es=>es.map(e=>e.dataset.ziel));
  ok(verbinden.join('|')==='blatt|wasser','«Punkte verbinden» steht bei den Nährstoffen – im Blattsaft und im Giesswasser');
  const linien=()=>p.$$eval('#cKb .tafel:not(.km)',ts=>ts.map(t=>t.querySelectorAll('polyline').length));
  await p.check('#cKb [data-aend="linienUm"][data-ziel="blatt"]');await p.waitForTimeout(300);
  let l1=await linien();
  ok(l1[0]>0&&l1[1]===0,'Im Blattsaft angehakt: nur dort Linien je Reihe ('+l1.join(' / ')+')');
  await p.check('#cKb [data-aend="linienUm"][data-ziel="wasser"]');await p.waitForTimeout(300);
  l1=await linien();
  ok(l1[0]>0&&l1[1]>0,'Im Giesswasser dazu: auch dort ('+l1.join(' / ')+')');
  await p.uncheck('#cKb [data-aend="linienUm"][data-ziel="blatt"]');await p.uncheck('#cKb [data-aend="linienUm"][data-ziel="wasser"]');await p.waitForTimeout(300);
  ok((await linien()).every(n=>n===0),'… und wieder ohne');
  ok(/Stellen zuordnen · 4 offen/.test(await p.$eval('#cKb [data-tun="stellen"]',e=>e.textContent)),'Im Kopf des Giesswassers: «Stellen zuordnen · 4 offen»');

  console.log('\n── Zeigen und Klicken ──');
  /* Wo ein Punkt auf dem Bildschirm liegt – aus der Trefferliste der Grafik */
  const lage=(box,nr,i)=>p.evaluate(([box,nr,i])=>{const l=ZEIT.treffer[nr],t=l[i<0?l.length+i:i];
    const s=document.querySelector(`${box} svg.spur[data-spur="${nr}"]`),r=s.getBoundingClientRect(),k=r.width/ZEIT.W;
    return {x:r.left+t.cx*k,y:r.top+t.cy*k}},[box,nr,i]);
  await p.$eval('#cKb',e=>e.scrollIntoView({block:'start'}));await p.waitForTimeout(150);
  const pt=await lage('#cKb',0,-1);
  await p.mouse.move(pt.x+7,pt.y-4);await p.waitForTimeout(200);
  const kasten=await p.$eval('.tipp',e=>({an:e.classList.contains('an'),t:e.innerText}));
  ok(kasten.an&&/Messwert/.test(kasten.t)&&/Optimum \(Labor\)/.test(kasten.t),'Neben einen Punkt zeigen (8 px daneben): das Kästchen mit Wert und Optimum');
  const ring=await p.$eval('#cKb svg.spur[data-spur="0"] .ring',e=>+e.getAttribute('cx'));
  ok(ring>0,'Ein Ring markiert den Punkt, auf den sich das Kästchen bezieht');
  const zeiger=await p.$$eval('#cKb .zeiger',zs=>zs.map(z=>z.getAttribute('x1')).filter(x=>+x>0));
  ok(zeiger.length>=4&&zeiger.every(x=>x===zeiger[0]),'Der Zeiger steht in allen Grafiken und Zeilen am selben Tag ('+zeiger.length+')');
  ok(await p.$eval('#cKb svg.spur[data-spur="0"] .zeigerDatum',e=>e.getAttribute('visibility')!=='hidden'&&/\d\d\.\d\d\./.test(e.textContent)),'Unten an der Achse das Datum unter dem Zeiger');
  await p.mouse.click(pt.x+7,pt.y-4);await p.waitForTimeout(350);
  ok(/^Blattsaft · Satz/.test(await p.$eval('#dlgTitel',e=>e.textContent)),'Klick neben den Punkt öffnet den Bericht');
  await p.click('#dlgFoot button:text-is("Schliessen")');
  await p.mouse.move(5,5);await p.waitForTimeout(150);
  ok(!(await p.$eval('.tipp',e=>e.classList.contains('an'))),'Maus weg: das Kästchen verschwindet');

  console.log('\n── Was zusammengehört: die Tageslinie ──');
  {
  /* Wo ein Punkt eines bestimmten Tages liegt */
  const lageTag=(box,nr,datum,bed)=>p.evaluate(([box,nr,t,bed])=>{const l=ZEIT.treffer[nr],f=bed?new Function('e','return '+bed):()=>true;
    const e=l.find(x=>Math.abs(x.t-t)<1&&f(x));if(!e)return null;
    const s=document.querySelector(`${box} svg.spur[data-spur="${nr}"]`);s.scrollIntoView({block:'center'});const r=s.getBoundingClientRect(),k=r.width/ZEIT.W;
    return {x:r.left+e.cx*k,y:r.top+e.cy*k}},[box,nr,+new Date(datum),bed||null]);
  const tagLinien=box=>p.$$eval(box+' .zeiger',zs=>zs.map(z=>({x:z.getAttribute('x1'),d:z.getAttribute('stroke-dasharray'),o:z.getAttribute('opacity')})));
  const schilder=box=>p.$$eval(box+' svg.spur .zeigerDatum',gs=>gs.map(g=>g.getAttribute('visibility')==='visible'?g.textContent:''));
  const paare=box=>p.$$eval(box+' svg.spur .paare',gs=>gs.map(g=>g.children.length));
  await p.mouse.move(5,5);
  let pt=await lageTag('#cKb',0,'2026-08-18');
  await p.mouse.move(pt.x+6,pt.y-3);await p.waitForTimeout(250);
  let li=await tagLinien('#cKb');
  ok(li.length>=4&&li.every(l=>l.x===li[0].x&&+l.x>0&&l.d==='4 3'),'Zeigen auf Blattsaft 18.08.: eine gestrichelte Linie an diesem Tag – in beiden Grafiken und durch das Kulturmanagement ('+li.length+')');
  let sch=await schilder('#cKb');
  ok(sch.length===2&&sch.every(t=>/^Di 18\.08\.$/.test(t)),'In jeder Grafik ein Datumsschild: '+sch.join(' | '));
  ok((await paare('#cKb'))[1]>=1,'Im Giesswasser ist der Punkt desselben Tages beringt – er gehört dazu');
  await p.mouse.move(pt.x+23,pt.y-3);await p.waitForTimeout(250);
  ok((await tagLinien('#cKb')).every(l=>l.d==='4 3'),'Ein paar Pixel weiter (23 px) bleibt die Linie eingerastet – nichts springt');
  pt=await lageTag('#cKb',0,'2026-07-14');
  await p.mouse.move(pt.x+5,pt.y+3);await p.waitForTimeout(250);
  sch=await schilder('#cKb');
  ok(/^Di 14\.07\.$/.test(sch[0])&&/^Di 14\.07\. · keine Probe$/.test(sch[1])&&(await paare('#cKb'))[1]===0,'Blattsaft 14.07.: im Giesswasser «Di 14.07. · keine Probe», kein Ring');
  const sv0=await (await p.$('#cKb svg.spur')).boundingBox();
  await p.mouse.move(sv0.x+sv0.width*0.42,sv0.y+30);await p.waitForTimeout(250);
  li=await tagLinien('#cKb');
  ok(li.every(l=>l.d==null&&l.o==='.3')&&(await paare('#cKb')).every(n=>n===0),'Ohne Punkt in der Nähe: die blasse, durchgezogene Linie – keine Ringe');
  /* Ein Ereignis im Kulturmanagement ist ein Zeitpunkt */
  const kt=await (await p.$('#cKb circle.kmTag')).boundingBox();
  await p.mouse.move(kt.x+kt.width/2,kt.y+kt.height/2);await p.waitForTimeout(250);
  li=await tagLinien('#cKb');sch=await schilder('#cKb');
  ok(li.every(l=>l.d==='4 3'&&l.x===li[0].x)&&sch.every(t=>t)&&(await p.$$eval('#cKb .kmBand',rs=>rs.every(r=>+r.getAttribute('width')===0))),'Zeigen auf ein Ereignis: dieselbe Tageslinie, Schilder in jeder Grafik ('+sch.join(' | ')+')');
  await p.mouse.move(5,5);await p.waitForTimeout(150);
  /* Nitrat unter der Nachweisgrenze */
  await p.click('#cKb .tafel .wahl .chip:text-is("Nitrat") >> nth=-1');await p.waitForTimeout(350);
  const ng=await p.evaluate(()=>{for(const [nr,l] of ZEIT.treffer.entries()){const e=l.find(x=>x.ng);if(e){const s=document.querySelector(`#cKb svg.spur[data-spur="${nr}"]`);s.scrollIntoView({block:'center'});const r=s.getBoundingClientRect(),k=r.width/ZEIT.W;
    const achse=+s.querySelector('line[stroke="#B9C4B4"]').getAttribute('y1');return {x:r.left+e.cx*k,y:r.top+e.cy*k,cy:e.cy,achse}}}return null});
  ok(!!ng&&Math.abs(ng.cy-ng.achse)<0.01,'Nitrat «< 0,3» steht auf der x-Achse bei 0');
  await p.mouse.move(ng.x+4,ng.y-4);await p.waitForTimeout(250);
  const ngT=await p.$eval('.tipp',e=>e.classList.contains('an')?e.innerText:'');
  ok(/Messwert: < 0[.,]\d/.test(ngT)&&/hohl bei 0/.test(ngT),'Das Kästchen nennt den Laborwert «< …» – und dass der Punkt hohl bei 0 steht');
  ok(/unter der Nachweisgrenze · bei 0/.test(await p.$eval('#cKb',e=>e.innerText)),'Der Kopf des Giesswassers erklärt die hohlen Punkte');
  await p.click('#cKb .tafel .wahl .chip:text-is("Nitrat") >> nth=-1');await p.waitForTimeout(350);
  await p.mouse.move(5,5);
  /* Der Bericht: was am selben Tag beprobt wurde, und zurück in die Grafik */
  pt=await lageTag('#cKb',0,'2026-08-18');
  await p.mouse.click(pt.x+6,pt.y-3);await p.waitForTimeout(350);
  const amTag=await p.$eval('#dlgBody .amTag',e=>e.innerText.replace(/\s+/g,' '));
  ok(/Am selben Tag:/.test(amTag)&&/Giesswasser · Reservoir Vorne/.test(amTag)&&/Im Verlauf zeigen/.test(amTag),'Im Bericht: «Am selben Tag: Giesswasser · Reservoir Vorne» und «Im Verlauf zeigen»');
  await p.click('#dlgBody .amTag button:has-text("Giesswasser")');await p.waitForTimeout(350);
  ok(/^Giesswasser · Reservoir Vorne · 18\.08\.2026$/.test(await p.$eval('#dlgTitel',e=>e.textContent)),'Ein Klick öffnet die Wasserprobe desselben Tages');
  await p.click('#dlgBody [data-tun="imVerlauf"]');await p.waitForTimeout(400);
  li=await tagLinien('#cKb');
  ok(!(await p.$eval('#dlg',d=>d.open))&&li.every(l=>l.d==='4 3'&&l.x===li[0].x),'«Im Verlauf zeigen»: die Tageslinie steht auf dem 18.08.');
  const svF=await (await p.$('#cKb svg.spur')).boundingBox();
  await p.mouse.move(svF.x+svF.width*0.4,svF.y+25);await p.waitForTimeout(250);
  ok((await tagLinien('#cKb')).every(l=>l.d==='4 3'),'… und bleibt stehen, wenn die Maus ins Leere fährt');
  await p.mouse.click(svF.x+svF.width*0.4,svF.y+25);await p.waitForTimeout(250);
  ok((await tagLinien('#cKb')).every(l=>l.d==null),'Ein Klick ins Leere gibt sie frei');
  await p.mouse.move(5,5);
  }

  console.log('\n── Zoomen ──');
  const zeitraum=()=>p.$eval('#cKb .zzText',e=>e.textContent);
  const tage=async()=>{const m=/· (\d+) Tage/.exec(await zeitraum());return m?+m[1]:null};
  const gesperrt=sel=>p.$eval(sel,e=>e.getAttribute('aria-disabled')==='true');
  const z0=await zeitraum();
  ok(await gesperrt('#cKb [data-tun="zoomAus"]')&&await p.$eval('#cKb [data-tun="zeitVorgabe"][data-v="alles"]',e=>e.classList.contains('on'))&&await p.$eval('#cKb .rollleiste',e=>e.classList.contains('voll')),'Zu Beginn: alles sichtbar, «−» gesperrt, der Rollbalken blass und voll ('+z0+')');
  await p.click('#cKb [data-tun="zoomAus"]',{force:true});await p.waitForTimeout(150);
  ok(await zeitraum()===z0,'Das gesperrte «−» tut nichts');
  await p.evaluate(()=>window.scrollTo(0,0));await p.waitForTimeout(100);
  const svg1=await (await p.$('#cKb svg.spur')).boundingBox();
  await p.mouse.move(svg1.x+svg1.width*0.6,svg1.y+80);
  const yR=await p.evaluate(()=>window.scrollY);
  for(let i=0;i<3;i++){await p.mouse.wheel(0,200);await p.waitForTimeout(80)}
  await p.waitForTimeout(250);
  ok(await zeitraum()===z0&&(await p.evaluate(()=>window.scrollY))>yR,'Das Mausrad allein scrollt die Seite – es zoomt nicht');
  await p.evaluate(()=>window.scrollTo(0,0));await p.waitForTimeout(150);
  await p.mouse.move(svg1.x+svg1.width*0.6,svg1.y+80);
  await p.keyboard.down('Control');for(let i=0;i<3;i++){await p.mouse.wheel(0,-150);await p.waitForTimeout(60)}await p.keyboard.up('Control');
  await p.waitForTimeout(300);
  const z1=await zeitraum();
  ok(z1!==z0&&(await p.evaluate(()=>window.scrollY))===0,'Strg + Rad zoomt – und die Seite bleibt, wo sie ist ('+z1+')');
  await p.click('#cKb [data-tun="zeitVorgabe"][data-v="alles"]');await p.waitForTimeout(250);
  ok(await zeitraum()===z0,'«alles» zeigt wieder alles');
  /* Nicht gezoomt: Ziehen in der Grafik verschiebt nichts – und wer neben
     einem Punkt loslässt, bekommt keinen Bericht. */
  await p.evaluate(()=>window.scrollTo(0,0));await p.waitForTimeout(100);
  const ziel0=await lage('#cKb',0,-1);
  await p.mouse.move(ziel0.x-150,ziel0.y);await p.mouse.down();
  await p.mouse.move(ziel0.x+4,ziel0.y,{steps:8});await p.mouse.up();await p.waitForTimeout(250);
  ok(await zeitraum()===z0&&!(await p.$eval('#dlg',d=>d.open)),'Ziehen ohne Zoom verschiebt nichts – und neben einem Punkt losgelassen öffnet es nichts');
  /* Gedrückt, senkrecht aus der Grafik hinaus und dort losgelassen: danach
     klebt nichts am Zeiger. */
  await p.click('#cKb [data-tun="zoomEin"]');await p.waitForTimeout(250);
  const zKleb=await zeitraum(),rb=await (await p.$('#cKb .rollleiste')).boundingBox(),sv=await (await p.$('#cKb svg.spur')).boundingBox();
  await p.mouse.move(sv.x+sv.width*0.5,sv.y+sv.height-30);await p.mouse.down();
  await p.mouse.move(sv.x+sv.width*0.5+1,rb.y+rb.height/2,{steps:4});await p.mouse.up();
  await p.mouse.move(sv.x+sv.width*0.2,sv.y+60,{steps:8});await p.waitForTimeout(250);
  ok(await zeitraum()===zKleb,'Ausserhalb losgelassen: ohne gedrückte Taste verschiebt sich nichts');
  await p.click('#cKb [data-tun="zeitVorgabe"][data-v="alles"]');await p.waitForTimeout(250);
  const ganz=await tage();
  await p.click('#cKb [data-tun="zoomEin"]');await p.waitForTimeout(250);
  const t1=await tage();
  await p.click('#cKb [data-tun="zoomEin"]');await p.waitForTimeout(250);
  const t2=await tage();
  ok([180,90,42,21].includes(t1)&&[90,42,21,14].includes(t2)&&t2<t1&&t1<ganz,'«+» springt auf runde Zeiträume ('+ganz+' → '+t1+' → '+t2+' Tage)');
  ok(!(await gesperrt('#cKb [data-tun="zoomAus"]'))&&!(await p.$eval('#cKb .rollleiste',e=>e.classList.contains('voll'))),'Gezoomt: «−» frei, der Rollbalken dunkel');
  const daumen=()=>p.$eval('#cKb .rbDaumen',e=>({l:parseFloat(e.style.left),w:parseFloat(e.style.width),B:e.parentNode.clientWidth}));
  const d1=await daumen();
  ok(Math.abs(d1.w/d1.B-t2/ganz)<0.03&&d1.l+d1.w>d1.B-2,'Der Daumen ist so breit wie der Ausschnitt und steht rechts – das Neueste bleibt im Bild ('+(100*d1.w/d1.B).toFixed(0)+' %)');
  const zb=await (await p.$('#cKb .rbDaumen')).boundingBox();
  await p.mouse.move(zb.x+zb.width/2,zb.y+zb.height/2);await p.mouse.down();
  await p.mouse.move(zb.x+zb.width/2-120,zb.y+zb.height/2,{steps:6});
  const etikett=await p.$eval('#cKb .rbEtikett',e=>getComputedStyle(e).display!=='none'&&e.textContent);
  await p.mouse.up();await p.waitForTimeout(250);
  const z3=await zeitraum(),d2=await daumen();
  ok(z3!==z0&&Math.abs(d2.w-d1.w)<0.5&&d2.l<d1.l,'Den Daumen ziehen verschiebt den Ausschnitt, gleich lang ('+z3+')');
  ok(!!etikett&&/Tage/.test(etikett),'Beim Ziehen zeigt ein Schild den Zeitraum ('+etikett+')');
  await p.mouse.move(zb.x+zb.width/2-120,zb.y+zb.height/2);await p.mouse.down();await p.mouse.move(zb.x-1000,zb.y+zb.height/2,{steps:6});await p.mouse.up();await p.waitForTimeout(200);
  ok((await daumen()).l<0.5,'Ganz nach links gezogen: der Ausschnitt bleibt am Anfang stehen');
  const vorPfeil=await zeitraum();
  await p.click('#cKb .rbPfeil.r');await p.waitForTimeout(200);
  ok(await zeitraum()!==vorPfeil&&(await daumen()).l>0,'Der Pfeil rechts schiebt ein Stück weiter');
  const sp=await (await p.$('#cKb .rbSpur')).boundingBox();
  const vorSpur=(await daumen()).l;
  await p.mouse.click(sp.x+sp.width-4,sp.y+sp.height/2);await p.waitForTimeout(200);
  ok((await daumen()).l>vorSpur+5,'Klick in die Bahn rechts vom Daumen: eine Seite weiter');
  const svg2=await (await p.$('#cKb svg.spur')).boundingBox();
  const zv=await zeitraum(),vorZ=await p.evaluate(()=>({x0:ZEIT.x0,L:ZEIT.x1-ZEIT.x0,P:ZEIT.W-ZEIT.ml-ZEIT.mr,W:ZEIT.W}));
  await p.mouse.move(svg2.x+svg2.width*0.4,svg2.y+100);await p.mouse.down();
  await p.mouse.move(svg2.x+svg2.width*0.4+120,svg2.y+100,{steps:8});await p.mouse.up();await p.waitForTimeout(300);
  const nachZ=await p.evaluate(()=>ZEIT.x0),soll=-120*(vorZ.W/svg2.width)/vorZ.P*vorZ.L;
  ok(await zeitraum()!==zv&&!(await p.$eval('#dlg',d=>d.open)),'Gezoomt in der Grafik ziehen verschiebt beide zugleich – ohne etwas zu öffnen');
  ok(Math.abs((nachZ-vorZ.x0)-soll)<Math.abs(soll)*0.1,'… und genau so weit, wie man zieht: 120 px = '+(soll/864e5).toFixed(1)+' Tage ('+((nachZ-vorZ.x0)/864e5).toFixed(1)+')');
  const marken=await p.$$eval('#cKb .tafel:not(.km)',(ts,re)=>ts.map(t=>[...t.querySelectorAll('svg text')].filter(x=>new RegExp(re).test(x.textContent)).map(x=>x.textContent).join(' ')),DAT.source);
  ok(marken.length===2&&marken[0]===marken[1],'Beide Achsen zeigen dieselben Daten ('+marken[0].slice(0,40)+' …)');
  /* Strg + Rad am kürzesten Ausschnitt: nichts verschiebt sich */
  for(let i=0;i<6&&!(await gesperrt('#cKb [data-tun="zoomEin"]'));i++){await p.click('#cKb [data-tun="zoomEin"]');await p.waitForTimeout(150)}
  const amMin=await zeitraum(),svg3=await (await p.$('#cKb svg.spur')).boundingBox();
  await p.mouse.move(svg3.x+svg3.width-30,svg3.y+80);
  await p.keyboard.down('Control');for(let i=0;i<3;i++){await p.mouse.wheel(0,-150);await p.waitForTimeout(60)}await p.keyboard.up('Control');
  await p.waitForTimeout(250);
  ok(await zeitraum()===amMin,'Am kürzesten Ausschnitt: Strg + Rad hinein verschiebt nichts ('+amMin+')');
  /* Ein Klick in die Grafik nimmt der Seite Bild↓ nicht weg */
  await p.evaluate(()=>window.scrollTo(0,0));await p.waitForTimeout(100);
  const kopfG=await (await p.$('#cKb .tafel .tafelKopf h3')).boundingBox();
  await p.mouse.click(kopfG.x+2,kopfG.y+2);await p.keyboard.press('PageDown');await p.waitForTimeout(300);
  ok((await p.evaluate(()=>window.scrollY))>100&&await zeitraum()===amMin,'Nach einem Mausklick in die Grafiken blättert Bild↓ die Seite – die Zeit bleibt');
  await p.evaluate(()=>window.scrollTo(0,0));await p.waitForTimeout(100);
  /* Tastatur in den Grafiken */
  await p.focus('#cKb .tafeln');
  const vorTaste=await zeitraum();
  await p.keyboard.press('ArrowRight');await p.waitForTimeout(200);
  if(await zeitraum()===vorTaste){await p.keyboard.press('ArrowLeft');await p.waitForTimeout(200)}
  ok(await zeitraum()!==vorTaste,'Pfeiltaste in den Grafiken verschiebt');
  await p.keyboard.press('0');await p.waitForTimeout(200);
  ok(await zeitraum()===z0,'«0» zeigt wieder alles');
  await p.keyboard.press('+');await p.waitForTimeout(200);
  ok(await tage()===t1,'«+» auf der Tastatur zoomt wie der Knopf');
  for(let i=0;i<6&&!(await gesperrt('#cKb [data-tun="zoomAus"]'));i++){await p.click('#cKb [data-tun="zoomAus"]');await p.waitForTimeout(150)}
  ok(await zeitraum()===z0&&await gesperrt('#cKb [data-tun="zoomAus"]'),'«−» bis alles wieder zu sehen ist');
  /* Unten am Bildrand, solange man in den Grafiken ist */
  await p.setViewportSize({width:1280,height:640});await p.evaluate(()=>window.scrollTo(0,120));await p.waitForTimeout(400);
  const leiste=await (await p.$('#cKb .rollleiste')).boundingBox();
  const gwUnten=await p.$eval('#cKb .tafeln',e=>e.getBoundingClientRect().bottom);
  ok(Math.abs(leiste.y+leiste.height-640)<2&&gwUnten>640,'Der Rollbalken klebt am unteren Bildrand, solange die Grafiken weitergehen ('+Math.round(leiste.y)+' px)');
  await p.setViewportSize({width:1280,height:1000});await p.evaluate(()=>window.scrollTo(0,0));await p.waitForTimeout(400);

  console.log('\n── Kulturmanagement ──');
  const km=await p.$eval('#cKb .tafel.km',e=>e.innerText);
  ok(/^Kulturmanagement\s*\n\s*＋ Massnahme eintragen/.test(km),'Gleich unter der Überschrift: «＋ Massnahme eintragen»');
  ok(/▸ Ereignisse \(1\)/.test(km)&&!(await p.$('#cKb .kmZeilen2[data-gruppe="typen"]')),'Die Ereignisse sind eingeklappt – eine Zeile mit Punkten');
  ok(!(await p.$('#cKb .kmZ[data-k="m|biovin"]')),'Biovin steht in diesem Reiter nicht');
  const kmZeilen=()=>p.$$eval('#cKb .kmZeilen2[data-gruppe="balken"] > .kmZ',zs=>zs.map(z=>z.querySelector('.kmTitel').textContent));
  const kz=await kmZeilen();
  ok(kz.length>=1&&new Set(kz).size===kz.length,'Eine Zeile je Mittel, links der Name ('+kz.join(', ')+')');
  await p.click('#cKb button[data-tun="kmEreignisse"]');await p.waitForTimeout(250);
  ok((await p.$$eval('#cKb .kmZeilen2[data-gruppe="typen"] .kmTitel',es=>es.map(e=>e.textContent))).some(t=>/Substrat/.test(t))&&/▾ Ereignisse/.test(await p.$eval('#cKb .tafel.km',e=>e.innerText)),'Ein Klick klappt sie auf – eine Zeile je Art');
  await p.click('#cKb button[data-tun="kmEreignisse"]');await p.waitForTimeout(250);

  console.log('\n── ＋ Massnahme und Balken ──');
  await p.click('#view button:text-is("＋ Massnahme eintragen")');await p.waitForTimeout(250);
  await p.fill('#mnName','Schattierung');await p.fill('#mnVon','2026-09-15');
  await p.click('#dlgFoot button:text-is("Eintragen")');await p.waitForTimeout(400);
  const zeileText=k=>p.$eval(`#cKb .kmZ[data-k="${k}"]`,z=>z.querySelector('.kmTitel').textContent+' | '+[...z.querySelectorAll('g.spb text')].map(t=>t.textContent).join(' '));
  ok(/^Schattierung \| seit 15\.09\./.test(await zeileText('n|Schattierung')),'Eine neue Massnahme steht sofort da: Name links, im Balken nur das Datum');
  await p.$eval('#cKb .kmZ[data-k="n|Schattierung"] g.spb',g=>g.dispatchEvent(new MouseEvent('click',{bubbles:true})));await p.waitForTimeout(300);
  ok(await p.$eval('#dlgTitel',e=>e.textContent)==='Schattierung','Klick auf den Balken öffnet sie zum Ändern');
  await p.click('#dlgFoot button:text-is("Abbrechen")').catch(()=>p.evaluate(()=>el('dlg').close()));await p.waitForTimeout(200);
  /* Ein Balken ist ein Zeitraum: Band mit gestrichelten Kanten über alles */
  const sb=await (await p.$('#cKb .kmZ[data-k="n|Schattierung"] g.spb rect')).boundingBox();
  await p.mouse.move(sb.x+sb.width/2,sb.y+sb.height/2);await p.waitForTimeout(250);
  const band=await p.evaluate(()=>({b:[...document.querySelectorAll('#cKb .kmBand')].filter(r=>+r.getAttribute('width')>0).length,
    km:[...document.querySelectorAll('#cKb .kmZ .kmBand')].filter(r=>+r.getAttribute('width')>0).length,
    l:[...document.querySelectorAll('#cKb .kmRand.l')].filter(r=>+r.getAttribute('x1')>0).length,
    r:[...document.querySelectorAll('#cKb .kmRand.r')].filter(r=>+r.getAttribute('x1')>0).length,
    z:[...document.querySelectorAll('#cKb .zeiger')].filter(z=>+z.getAttribute('x1')>0).length}));
  ok(band.b>2&&band.km>0&&band.l===band.b&&band.r===0&&band.z===0,'Zeigen auf einen laufenden Balken: sein Zeitraum als Band in allen Grafiken und Zeilen, links gestrichelt begrenzt, rechts offen (läuft noch) – keine Tageslinie');
  await p.mouse.move(5,5);await p.waitForTimeout(150);
  await p.$eval('#cKb .kmZ[data-k="n|Schattierung"] g.spb',g=>g.dispatchEvent(new MouseEvent('click',{bubbles:true})));await p.waitForTimeout(300);
  await p.click('#spLaeuft');await p.fill('#spBis','2026-09-30');
  await p.click('#dlgFoot button:text-is("Speichern")');await p.waitForTimeout(400);
  ok(/15\.09\.–30\.09\./.test(await zeileText('n|Schattierung')),'Ende gesetzt ('+await zeileText('n|Schattierung')+')');
  await p.click('#view button:text-is("＋ Massnahme eintragen")');await p.waitForTimeout(250);
  await p.selectOption('#mnWas','t|Gerätekalibrierung');
  ok(await p.$eval('#mnDauerBox',e=>e.hidden)&&await p.$eval('#mnNameBox',e=>e.hidden),'Ein Ereignis braucht weder Namen noch Dauer – die Felder verschwinden');
  await p.fill('#mnVon','2026-09-20');await p.fill('#mnNotiz','pH-Sonde neu');
  await p.click('#dlgFoot button:text-is("Eintragen")');await p.waitForTimeout(400);
  ok(await p.evaluate(()=>db.ereignisse.some(e=>e.typ==='Gerätekalibrierung'&&e.datum==='2026-09-20'&&e.notiz==='pH-Sonde neu')),'Die Kalibrierung ist eingetragen');
  ok((await p.$$eval('#cKb .kmZeilen2[data-gruppe="typen"] .kmTitel',es=>es.map(e=>e.textContent))).some(t=>/kalibrierung/i.test(t)),'… und gleich zu sehen: die Ereignisse klappen dafür auf');

  console.log('\n── Reihenfolge ziehen ──');
  /* In der Tafel: den Namen der zweiten Zeile über die erste ziehen */
  const vorZug=await kmZeilen();
  const n2=await (await p.$$('#cKb .kmZeilen2[data-gruppe="balken"] > .kmZ .kmZName'))[1].boundingBox();
  await p.mouse.move(n2.x+40,n2.y+n2.height/2);await p.mouse.down();
  await p.mouse.move(n2.x+40,n2.y+n2.height/2-12,{steps:4});
  ok(await p.$('#cKb .kmZeilen2.ordnet .kmZ.zieht')!==null,'Beim Ziehen hängt die Zeile am Zeiger');
  await p.mouse.move(n2.x+40,n2.y-n2.height,{steps:6});await p.mouse.up();await p.waitForTimeout(350);
  const nachZug=await kmZeilen();
  ok(nachZug[0]===vorZug[1]&&nachZug[1]===vorZug[0],'Wie bei einer Warteschlange: «'+vorZug[1]+'» steht jetzt zuoberst');
  ok(!(await p.$eval('#dlg',d=>d.open)),'Nach dem Ziehen öffnet sich kein Dialog');
  await p.click(`#cKb .kmZ[data-k="n|Schattierung"] .kmTitel`);await p.waitForTimeout(300);
  ok(await p.$eval('#dlgTitel',e=>e.textContent)==='Kulturmanagement · Zeilen'&&await p.$('#dlgBody .kmZeile[data-k="n|Schattierung"].blink')!==null,'Klick auf einen Namen: «Zeilen verwalten» mit dieser Zeile hervorgehoben');
  const dlgZeilen=()=>p.$$eval('#dlgBody .kmZeilen[data-gruppe="balken"] .kmZeile .kmName strong',es=>es.map(e=>e.textContent));
  const zeilen2=await dlgZeilen();
  const typen2=await p.$$eval('#dlgBody .kmZeilen[data-gruppe="typen"] .kmName strong',es=>es.map(e=>e.textContent));
  ok(zeilen2.includes('Schattierung')&&typen2.some(t=>/kalibrierung/i.test(t))&&zeilen2.includes('Biorga')&&!zeilen2.includes('Biovin'),'Im Dialog: jede Zeile einzeln ('+zeilen2.join(', ')+' · '+typen2.join(', ')+')');
  ok(!(await p.$('#dlgBody button[data-r]')),'Keine ↑ ↓ mehr – geordnet wird am Griff');
  /* Im Dialog: am Griff der letzten Zeile ganz nach oben ziehen */
  const dritte=zeilen2[zeilen2.length-1];
  const g3=await (await p.$$('#dlgBody .kmZeilen[data-gruppe="balken"] .kmGriff'))[zeilen2.length-1].boundingBox();
  const g1=await (await p.$$('#dlgBody .kmZeilen[data-gruppe="balken"] .kmGriff'))[0].boundingBox();
  await p.mouse.move(g3.x+g3.width/2,g3.y+g3.height/2);await p.mouse.down();
  await p.mouse.move(g3.x+g3.width/2,g1.y-4,{steps:10});await p.mouse.up();await p.waitForTimeout(350);
  ok((await dlgZeilen())[0]===dritte,'Am Griff ziehen: «'+dritte+'» steht im Dialog zuoberst');
  ok((await kmZeilen())[0]===dritte,'Die Tafel folgt sofort der neuen Reihenfolge');
  /* Mit der Tastatur am Griff */
  await p.focus('#dlgBody .kmZeilen[data-gruppe="balken"] .kmGriff');await p.keyboard.press('ArrowDown');await p.waitForTimeout(250);
  ok((await dlgZeilen())[1]===dritte,'Griff anwählen, Pfeil runter: eine Zeile tiefer');
  await p.uncheck('#dlgBody [data-aend="kmAn"][data-k="n|Schattierung"]');await p.waitForTimeout(300);
  ok(/zeigen/.test(await p.$eval('#dlgBody .kmZeile.aus',e=>e.innerText)),'Ausgeblendete Zeilen stehen blass im Dialog');
  await p.click('#dlgFoot button:text-is("Fertig")');await p.waitForTimeout(200);
  ok(!(await p.$('#cKb .kmZ[data-k="n|Schattierung"]'))&&/1 ausgeblendet/.test(await p.$eval('#cKb .tafel.km',e=>e.innerText)),'Schattierung ausgeblendet – oben steht «1 ausgeblendet»');
  await p.screenshot({path:shots+'/kombi.png',fullPage:true});

  console.log('\n── pH, EC & O₂ ──');
  await p.click('#nav button:text-is("pH, EC & O₂")');await p.waitForTimeout(400);
  const tk=await p.$eval('#view',e=>e.innerText);
  ok(/Alle Messungen als Liste \(3\)/.test(tk)&&!(await p.$eval('#tkListe details',e=>e.open)),'Die Liste der Messungen – eingeklappt');
  const tkKopf=(await p.$$eval('#cTank .tafelKopf h3',es=>es.map(e=>e.textContent))).join('|');
  ok(/^pH\|Kulturmanagement\|EC/.test(tkKopf),'Das Kulturmanagement steht gleich unter dem pH ('+tkKopf.replace(/\|/g,' · ')+')');
  const tkStellen=await p.evaluate(()=>new Set(db.messungen.map(m=>m.stelle)).size);
  ok(tkStellen>1?await p.$('#cTank .zeitzeile .zzLinks .seg')!==null:await p.$eval('#cTank .zzLinks',e=>e.innerHTML==='')&&await p.$('#cTank .zzText')!==null,'Die Wahl der Stelle steht in der Zeitzeile, wenn es mehr als eine gibt ('+tkStellen+')');
  ok(/Punkte: jede Messung|Punkt = Mittel/.test(await p.$eval('#cTank .dichteInfo',e=>e.textContent)),'Im Kopf des pH steht, was ein Punkt ist');
  const vg=await p.$$eval('#cTank [data-tun="zeitVorgabe"]',es=>es.map(e=>e.dataset.v));
  if(vg.length>1){
    const v=vg[vg.length-1];
    await p.focus(`#cTank [data-tun="zeitVorgabe"][data-v="${v}"]`);await p.keyboard.press('Enter');await p.waitForTimeout(300);
    ok(await p.evaluate(v=>document.activeElement&&document.activeElement.dataset.v===v&&document.activeElement.classList.contains('on'),v),'Fester Zeitraum mit der Tastatur: der Fokus bleibt auf dem Knopf');
    await p.click('#cTank [data-tun="zeitVorgabe"][data-v="alles"]');await p.waitForTimeout(250);
  }
  ok(await p.$('#cTank .kmZ[data-k="m|biovin"]')!==null||!(await p.evaluate(()=>kmListe('tank').some(z=>z.key==='m|biovin'))),'Biovin steht hier, sofern gegeben');
  await p.click('#tkListe summary');await p.waitForTimeout(200);
  await p.click('#view button[data-tun="messungWeg"]');await p.waitForTimeout(300);
  ok(/Alle Messungen als Liste \(2\)/.test(await p.$eval('#view',e=>e.innerText))&&await p.$eval('#tkListe details',e=>e.open),'Entfernen (mit Rückfrage) – die Liste bleibt dabei offen');

  console.log('\n── Einträge Mobile App ──');
  await p.evaluate(()=>{db.messungen.push({id:'mx',datum:'2026-10-04',zeit:'07:45',stelle:'Reservoir vorne',ph:6.1,ec:1.31,wer:'MK',quelle:'erfassen'});render()});
  await p.click('#nav button:text-is("Einträge Mobile App")');await p.waitForTimeout(300);
  const ma=await p.$eval('#view',e=>e.innerText);
  ok(/MK/.test(ma)&&/pH 6.1/.test(ma),'Die Messung vom Handy steht in der Liste');
  ok(!/\bMaske\b/.test(ma)&&await p.$eval('#erfassenLink',e=>e.textContent.trim())==='Mobile App ↗','Überall «Mobile App» statt «Maske» – auch der Link oben rechts');

  console.log('\n── Stellen zuordnen ──');
  await p.click('#nav button:text-is("Blattsaft & Giesswasser")');await p.waitForTimeout(400);
  await p.click('#cKb [data-tun="stellen"]');await p.waitForTimeout(300);
  await p.click('#dlgBody button:text-is("Vorschläge übernehmen")');await p.waitForTimeout(400);
  await p.click('#dlgFoot button:text-is("Fertig")');await p.waitForTimeout(400);
  ok(await p.$eval('#cKb [data-tun="stellen"]',e=>e.textContent.trim())==='Stellen zuordnen','Beim Giesswasser zugeordnet: der Knopf zeigt nichts Offenes mehr');
  const legende=await p.$eval('#cKb .tafelKopf .zeichen',e=>e.innerText.replace(/\s+/g,' ').trim());
  ok(legende==='vorne hinten','In der Kopfzeile des Giesswassers nur noch die zwei Reservoirs: '+legende);
  await p.click('#nav button:text-is("Einstellungen")');await p.waitForTimeout(300);
  ok(/alle zugeordnet/.test(await p.$eval('#view',e=>e.innerText)),'Auch die Einstellungen sagen: alle zugeordnet');

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

  console.log('\n── Handy mit Fingern ──');
  {
    const ctx=await b.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true,deviceScaleFactor:2});
    const h=await ctx.newPage();
    h.on('pageerror',e=>stoerung.push('pageerror (Handy): '+e.message));
    h.on('dialog',d=>d.accept());
    await h.goto('file://'+path);await h.waitForTimeout(1200);
    await h.setInputFiles('#fileJson',daten);await h.waitForTimeout(900);
    if(await h.$eval('#dlg',d=>d.open))await h.click('#dlgFoot button.primary');
    await h.waitForTimeout(300);
    const cdp=await ctx.newCDPSession(h);
    const tp=(id,x,y)=>({x,y,id,radiusX:4,radiusY:4,force:1});
    const L=()=>h.evaluate(()=>ZEIT.x1-ZEIT.x0),X0=()=>h.evaluate(()=>ZEIT.x0);
    await h.$eval('#cKb svg.spur',e=>e.scrollIntoView({block:'center'}));await h.waitForTimeout(200);
    const r=await (await h.$('#cKb svg.spur')).boundingBox();
    const cy=r.y+r.height*0.45,cx=r.x+r.width*0.6;
    const L0=await L();
    /* Zwei Finger auseinander */
    await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[tp(1,cx-20,cy)]});
    await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[tp(1,cx-20,cy),tp(2,cx+20,cy)]});
    for(let i=1;i<=8;i++){await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[tp(1,cx-20-i*8,cy),tp(2,cx+20+i*8,cy)]});await h.waitForTimeout(30)}
    await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[tp(2,cx+84,cy)]});
    await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
    await h.waitForTimeout(300);
    const L1=await L();
    ok(L1<L0*0.8,'Zwei Finger auseinander zoomen hinein ('+(L0/864e5).toFixed(0)+' → '+(L1/864e5).toFixed(0)+' Tage)');
    /* Danach ein Finger seitwärts: verschieben, nicht zoomen */
    const x0a=await X0();
    await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[tp(3,cx-60,cy)]});
    for(let i=1;i<=8;i++){await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[tp(3,cx-60+i*12,cy)]});await h.waitForTimeout(30)}
    await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
    await h.waitForTimeout(300);
    ok(Math.abs((await L())-L1)<L1*0.01&&(await X0())<x0a,'Danach wischt ein Finger seitwärts: verschoben, gleich lang');
    /* Tippen auf einen Namen im Kulturmanagement: «Zeilen verwalten» */
    const nm=await (await h.$('#cKb .kmZ .kmTitel')).boundingBox();
    await h.touchscreen.tap(nm.x+nm.width/2,nm.y+nm.height/2);await h.waitForTimeout(400);
    ok(await h.$eval('#dlg',d=>d.open)&&await h.$eval('#dlgTitel',e=>e.textContent)==='Kulturmanagement · Zeilen','Ein Tippen auf den Namen einer Zeile öffnet «Zeilen verwalten»');
    await h.evaluate(()=>el('dlg').close());await h.waitForTimeout(200);
    /* Erstes Tippen zeigt den Tag in allen Grafiken, das zweite öffnet */
    await h.evaluate(()=>AKTION.zeitVorgabe({v:'alles'}));await h.waitForTimeout(250);
    const hp=await h.evaluate(()=>{const e=ZEIT.treffer[0].find(x=>Math.abs(x.t-+new Date('2026-08-18'))<1);const s=document.querySelector('#cKb svg.spur[data-spur="0"]');s.scrollIntoView({block:'center'});
      const r=s.getBoundingClientRect(),k=r.width/ZEIT.W;return {x:r.left+e.cx*k,y:r.top+e.cy*k}});
    await h.waitForTimeout(200);
    await h.touchscreen.tap(hp.x+4,hp.y);await h.waitForTimeout(350);
    const hl=await h.$$eval('#cKb .zeiger',zs=>zs.map(z=>z.getAttribute('stroke-dasharray')));
    ok(!(await h.$eval('#dlg',d=>d.open))&&hl.every(d=>d==='4 3')&&await h.$eval('.tipp',e=>e.classList.contains('an')),'Am Handy: das erste Tippen zeigt die Tageslinie in allen Grafiken und das Kästchen – es öffnet nichts');
    ok(/18\.08\./.test(await h.$eval('#ansage',e=>e.textContent)),'Für Bildschirmleser: was es an dem Tag gibt ('+await h.$eval('#ansage',e=>e.textContent)+')');
    await h.evaluate(()=>window.scrollBy(0,80));await h.waitForTimeout(250);
    ok(!(await h.$eval('.tipp',e=>e.classList.contains('an')))&&(await h.$$eval('#cKb .zeiger',zs=>zs.every(z=>z.getAttribute('stroke-dasharray')==='4 3'))),'Beim Scrollen geht das Kästchen weg – die Tageslinie bleibt, man sieht sie auch in der anderen Grafik');
    const hp2=await h.evaluate(()=>{const e=ZEIT.treffer[0].find(x=>Math.abs(x.t-+new Date('2026-08-18'))<1);const s=document.querySelector('#cKb svg.spur[data-spur="0"]');
      const r=s.getBoundingClientRect(),k=r.width/ZEIT.W;return {x:r.left+e.cx*k,y:r.top+e.cy*k}});
    await h.touchscreen.tap(hp2.x+4,hp2.y);await h.waitForTimeout(300);
    await h.touchscreen.tap(hp2.x+4,hp2.y);await h.waitForTimeout(400);
    ok(await h.$eval('#dlg',d=>d.open)&&/^Blattsaft/.test(await h.$eval('#dlgTitel',e=>e.textContent)),'Nochmals tippen öffnet den Bericht');
    await h.evaluate(()=>el('dlg').close());await h.waitForTimeout(200);
    /* Der eingeklappte Tagespunkt: erst zeigen, dann aufklappen */
    await h.$eval('#cKb circle.kmTag',e=>e.scrollIntoView({block:'center'}));await h.waitForTimeout(200);
    const kp=await (await h.$('#cKb circle.kmTag')).boundingBox();
    await h.touchscreen.tap(kp.x+kp.width/2,kp.y+kp.height/2);await h.waitForTimeout(350);
    ok(!!(await h.$('#cKb circle.kmTag'))&&(await h.$$eval('#cKb .zeiger',zs=>zs.every(z=>z.getAttribute('stroke-dasharray')==='4 3'))),'Ein Ereignis-Punkt: das erste Tippen zeigt seinen Tag, klappt aber nicht auf');
    await h.touchscreen.tap(kp.x+kp.width/2,kp.y+kp.height/2);await h.waitForTimeout(350);
    ok(/▾ Ereignisse/.test(await h.$eval('#cKb .tafel.km',e=>e.innerText)),'Das zweite Tippen klappt die Ereignisse auf');
    await ctx.close();
  }

  console.log('\n── Ergebnis ──');
  if(stoerung.length){fehler+=stoerung.length;stoerung.forEach(x=>console.log('  ✗',x))}
  console.log(fehler?`  ${fehler} FEHLER`:'  ✓ Die App tut, was sie soll.');
  console.log('  Bildschirmfotos:',shots);
  await b.close();
  process.exit(fehler?1:0);
})().catch(e=>{console.error('ABBRUCH',e);process.exit(1)});
