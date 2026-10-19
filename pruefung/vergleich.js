/* Reiter «Living Herbs vs Topfbasilikum» in Chromium: die fünf Berichte
   übernehmen (Kontrolldialog mit Zusatz), Kacheln je Nährstoff, eine Probe
   zeigen (Maus, Tastatur, Finger), Bericht öffnen und zurück, Zeilen ein-
   und ausblenden, nicht im Verlauf, Handybreite.
   Aufruf:  CHROME=… NODE_PATH=… node pruefung/vergleich.js                 */
const {chromium}=require('playwright');
const path=require('path').resolve(__dirname,'..','basilikum.html');
const daten=__dirname+'/testdaten.json';
const shots=(process.env.SHOTS||require('os').tmpdir()+'/basilikum-shots');
require('fs').mkdirSync(shots,{recursive:true});
let fehler=0;
const ok=(b,t)=>{if(!b)fehler++;console.log((b?'  ✓ ':'  ✗ FEHLER ')+t)};
const kaputt=t=>/undefined|NaN|\[object Object\]|liess sich nicht aufbauen/.test(t);

(async()=>{
  const b=await chromium.launch(process.env.CHROME?{executablePath:process.env.CHROME,args:['--no-sandbox']}:{});
  const stoerung=[];
  const wache=p=>{p.on('console',m=>{const t=m.text();if(m.type()==='error'&&!/Failed to load resource|net::ERR_/.test(t))stoerung.push('console: '+t)});
    p.on('pageerror',e=>stoerung.push('pageerror: '+e.message));p.on('dialog',d=>d.accept())};
  const p=await b.newPage({viewport:{width:1280,height:1000}});wache(p);
  await p.goto('file://'+path);await p.waitForTimeout(1200);
  await p.setInputFiles('#fileJson',daten);await p.waitForTimeout(900);
  if(await p.$eval('#dlg',d=>d.open))await p.click('#dlgFoot button.primary');
  const vorher=await p.evaluate(()=>db.analysen.length);

  console.log('── Der Reiter, noch ohne Berichte ──');
  await p.click('#nav button:text-is("Living Herbs vs Topfbasilikum")');await p.waitForTimeout(300);
  let txt=await p.$eval('#view',e=>e.innerText);
  ok(!kaputt(txt),'Sauber aufgebaut');
  ok((await p.$$('#cVgP .vgZeile')).length===5,'Fünf Zeilen wie im Mail');
  ok(/Von Elaine/.test(txt)&&/Pendant/.test(txt)&&/Mangelsymptome/.test(txt)&&/Mangelblättern/.test(txt)&&/schön grün/.test(txt),'Die Beschreibungen aus dem Mail');
  ok((txt.match(/Bericht fehlt/g)||[]).length===5,'Jede Zeile: «Bericht fehlt»');

  console.log('\n── Übernehmen über den Kontrolldialog ──');
  await p.click('#cVgP button:text-is("Die 5 Berichte übernehmen")');await p.waitForTimeout(400);
  ok(await p.$eval('#dlg',d=>d.open)&&(await p.$$('#dlgBody [data-warn]')).length===8,'Kontrolldialog mit acht Proben');
  const zus=await p.$$eval('#dlgBody input[data-f="zusatz"]',es=>es.map(e=>e.value));
  ok(zus.filter(Boolean).join()==='Nur Mangel'&&zus.length===8,'Feld «Zusatz laut Bericht»: nur bei der Mangelprobe gefüllt');
  const nrn=(await p.$$eval('#dlgBody [data-vg]',es=>es.map(e=>(e.querySelector('.vgNr')||{}).textContent||'-'))).sort().join('');
  ok(nrn==='11223345','Jede Probe sagt, zu welcher Zeile sie gehört ('+nrn+')');
  /* Ohne Zusatz wäre die Mangelprobe von 08-441 alt nicht zu unterscheiden */
  const iM=zus.indexOf('Nur Mangel');
  await p.fill(`#dlgBody input[data-f="zusatz"][data-i="${iM}"]`,'');await p.dispatchEvent(`#dlgBody input[data-f="zusatz"][data-i="${iM}"]`,'change');await p.waitForTimeout(200);
  ok(/dieselbe Kennzeichnung/.test(await p.$eval(`[data-warn="${iM}"]`,e=>e.innerText)),'Zusatz geleert: «Zwei Proben in diesem Import tragen dieselbe Kennzeichnung»');
  ok(/Zeile 3/.test(await p.$eval(`[data-vg="${iM}"]`,e=>e.innerText)),'… und sie gehörte dann zu Zeile 3');
  await p.fill(`#dlgBody input[data-f="zusatz"][data-i="${iM}"]`,'Nur Mangel');await p.dispatchEvent(`#dlgBody input[data-f="zusatz"][data-i="${iM}"]`,'change');await p.waitForTimeout(200);
  ok(!(await p.$eval(`[data-warn="${iM}"]`,e=>e.innerText))&&/Zeile 4/.test(await p.$eval(`[data-vg="${iM}"]`,e=>e.innerText)),'Wieder «Nur Mangel»: keine Warnung, Zeile 4');
  await p.click('#btnUeber');await p.waitForTimeout(500);
  ok(await p.evaluate(()=>db.analysen.length)===vorher+8,'Acht Proben übernommen');
  ok(await p.$eval('#nav button.active',e=>e.textContent)==='Living Herbs vs Topfbasilikum','Man bleibt im Vergleich');
  txt=await p.$eval('#view',e=>e.innerText);
  ok(!/Bericht fehlt/.test(txt)&&!kaputt(txt),'Alle Zeilen haben ihren Bericht');
  const kach=await p.$$eval('#cVgK .vgKachel',es=>es.map(e=>e.dataset.k));
  ok(kach.length>=1&&(await p.$$('#cVgK .vgKachel:first-child g.vgB')).length===8,'Kacheln je Nährstoff ('+kach.join(', ')+'), je acht Balken');
  await p.screenshot({path:shots+'/vergleich.png',fullPage:true});

  console.log('\n── Eine Probe zeigen ──');
  await p.hover('#cVgK .vgKachel:first-child g.vgB[data-nr="4"]');await p.waitForTimeout(250);
  ok(await p.$eval('#cVgK',e=>e.getAttribute('data-zeigt'))==='4'&&await p.$eval('#cVgP',e=>e.getAttribute('data-zeigt'))==='4','Maus auf einem Balken von ④: die Probe ist in allen Kacheln und in ihrer Zeile hinterlegt');
  const op=await p.$$eval('#cVgK .vgKachel:last-child g.vgB',es=>es.map(e=>e.dataset.nr+':'+getComputedStyle(e).opacity));
  ok(op.filter(x=>x.startsWith('4:')).every(x=>x==='4:1')&&op.filter(x=>!x.startsWith('4:')).every(x=>+x.split(':')[1]<1),'Auch in der letzten Kachel: ④ voll, die anderen zurückgenommen');
  ok(await p.$eval('#cVgP .vgZeile[data-nr="4"]',e=>getComputedStyle(e).backgroundColor!=='rgba(0, 0, 0, 0)'),'Die Zeile ④ ist hinterlegt');
  const tipp=await p.$eval('.tipp',e=>e.classList.contains('an')?e.innerText:'');
  ok(/08-441 · Nur Mangel/.test(tipp)&&/laut Labor/.test(tipp),'Das Kästchen nennt Probe, Zusatz und Blatt');
  await p.hover('#cVgP .vgZeile[data-nr="2"] .vgText');await p.waitForTimeout(200);
  ok(await p.$eval('#cVgK',e=>e.getAttribute('data-zeigt'))==='2','Maus auf Zeile ②: die Balken von ② sind hervorgehoben');
  await p.mouse.move(5,5);await p.waitForTimeout(200);
  ok(await p.$eval('#cVgK',e=>e.getAttribute('data-zeigt'))===null,'Maus weg: nichts mehr hervorgehoben');

  console.log('\n── Klick, Bericht, zurück ──');
  await p.click('#cVgK .vgKachel:first-child g.vgB[data-nr="4"]');await p.waitForTimeout(400);
  ok(await p.$eval('#dlg',d=>d.open)&&/Nur Mangel/.test(await p.$eval('#dlgTitel',e=>e.textContent)),'Ein Klick öffnet den Bericht ('+await p.$eval('#dlgTitel',e=>e.textContent)+')');
  ok(!!(await p.$('#dlgBody button[data-tun="imVergleich"]'))&&!(await p.$('#dlgBody button[data-tun="imVerlauf"]')),'Im Bericht: «Im Vergleich zeigen», kein «Im Verlauf zeigen»');
  await p.evaluate(()=>{el('dlg').close();tab='analysen';render()});await p.waitForTimeout(250);
  const an=await p.$eval('#view',e=>e.innerText);
  ok(/Nur Mangel/.test(an)&&(an.match(/Vergleich/g)||[]).length>=5,'Analysen: Zusatz und «Vergleich» stehen in der Liste');
  await p.click('#view tr:has-text("Nur Mangel")');await p.waitForTimeout(350);
  await p.click('#dlgBody button[data-tun="imVergleich"]');await p.waitForTimeout(400);
  ok(await p.$eval('#nav button.active',e=>e.textContent)==='Living Herbs vs Topfbasilikum'&&await p.$eval('#cVgK',e=>e.getAttribute('data-zeigt'))==='4','«Im Vergleich zeigen» führt hin und hebt ④ hervor');

  console.log('\n── Zeilen ein- und ausblenden ──');
  await p.click('#cVgP .vgZeile[data-nr="3"] .vgText');await p.waitForTimeout(250);
  ok((await p.$$('#cVgK .vgKachel:first-child g.vgB')).length===6&&await p.$eval('#cVgP .vgZeile[data-nr="3"]',e=>e.getAttribute('aria-pressed'))==='false','Zeile ③ angeklickt: ihre zwei Balken sind weg');
  await p.focus('#cVgP .vgZeile[data-nr="3"]');await p.keyboard.press('Enter');await p.waitForTimeout(250);
  ok((await p.$$('#cVgK .vgKachel:first-child g.vgB')).length===8,'Mit der Tastatur (Enter) wieder eingeblendet');
  ok(await p.evaluate(()=>document.activeElement&&document.activeElement.dataset.nr)==='3','Der Fokus bleibt auf der Zeile');
  await p.click('#cVgP button:text-is("keine")');await p.waitForTimeout(200);
  ok(/Keine Probe eingeschaltet/.test(await p.$eval('#cVgK',e=>e.innerText)),'«keine»: die Grafik sagt, was zu tun ist');
  await p.click('#cVgP button:text-is("alle")');await p.waitForTimeout(200);
  await p.click('#cVgK .chip:has-text("Kupfer")');await p.waitForTimeout(200);
  ok(/Kupfer/.test(await p.$eval('#cVgK .vgKachel:last-child',e=>e.innerText))&&/unter der Nachweisgrenze/.test(await p.$eval('#cVgK .vgLegende',e=>e.innerText)),'Kupfer dazu: eine weitere Kachel, die Mangelprobe hohl bei 0');
  const vorlieben=await p.evaluate(()=>JSON.parse(localStorage.getItem('basilikum.ansicht')).vgStoffe);
  ok(Array.isArray(vorlieben)&&vorlieben.includes('Cu'),'Die Auswahl merkt sich dieses Gerät');
  await p.click('#cVgK .seg button:has-text("Lage im Optimum")');await p.waitForTimeout(200);
  ok(/Opt\./.test(await p.$eval('#cVgK .vgKachel',e=>e.innerHTML))&&!kaputt(await p.$eval('#cVgK',e=>e.innerText)),'Lage im Optimum: Zonen statt Messwert');
  await p.click('#cVgK .seg button:has-text("Messwert")');await p.waitForTimeout(150);

  console.log('\n── Nicht im Verlauf ──');
  await p.click('#nav button:text-is("Blattsaft & Giesswasser")');await p.waitForTimeout(400);
  const vgHin=await p.$('#cKb button.vgHin');
  ok(!!vgHin&&/8 Vergleichsproben vom 09\.04\.2026/.test(await vgHin.innerText()),'Im Blattsaft-Kopf: «8 Vergleichsproben vom 09.04.2026 ›»');
  ok(await p.evaluate(()=>!ZEIT.treffer.flat().some(t=>Math.abs(t.t-+new Date('2026-04-09'))<864e5)),'Kein Punkt vom 09.04. im Verlauf');
  await vgHin.click();await p.waitForTimeout(300);
  ok(await p.$eval('#nav button.active',e=>e.textContent)==='Living Herbs vs Topfbasilikum','Der Hinweis führt zum Vergleich');
  await p.check('#cVgP input[data-aend="vgImVerlauf"]');await p.waitForTimeout(250);
  await p.click('#nav button:text-is("Blattsaft & Giesswasser")');await p.waitForTimeout(400);
  ok(!(await p.$('#cKb button.vgHin'))&&await p.evaluate(()=>ZEIT.treffer.flat().some(t=>Math.abs(t.t-+new Date('2026-04-09'))<864e5)),'«auch im Verlauf zeigen»: die Proben stehen auch dort');
  ok(await p.evaluate(()=>db.vergleiche.length===1&&db.vergleiche[0].imVerlauf===true),'… und das gilt für alle (im Bestand)');

  console.log('\n── Handy ──');
  {
    const ctx=await b.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true,deviceScaleFactor:2});
    const h=await ctx.newPage();wache(h);
    await h.goto('file://'+path);await h.waitForTimeout(1000);
    await h.evaluate(()=>{tab='vergleich';render()});await h.waitForTimeout(250);
    const r=await h.$eval('#nav button.active',e=>{const a=e.getBoundingClientRect(),n=e.parentNode.getBoundingClientRect();return a.left>=n.left-1&&a.right<=n.right+1});
    ok(r,'Der aktive Reiter ist in der Leiste ganz zu sehen');
    await h.tap('#cVgP button:text-is("Die 5 Berichte übernehmen")');await h.waitForTimeout(400);
    await h.tap('#btnUeber');await h.waitForTimeout(500);
    ok(await h.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1),'Kein waagrechtes Scrollen der Seite');
    ok(await h.$$eval('#cVgK .vgKachel',es=>es.every(e=>e.getBoundingClientRect().right<=window.innerWidth)),'Die Kacheln passen in die Breite, eine unter der anderen');
    const g=await h.$('#cVgK .vgKachel:first-child g.vgB[data-nr="2"]');
    await g.scrollIntoViewIfNeeded();await h.waitForTimeout(200);
    const bb=await g.boundingBox();
    await h.touchscreen.tap(bb.x+bb.width/2,bb.y+bb.height-14);await h.waitForTimeout(350);
    ok(!(await h.$eval('#dlg',d=>d.open))&&await h.$eval('#cVgK',e=>e.getAttribute('data-zeigt'))==='2'&&await h.$eval('.tipp',e=>e.classList.contains('an')),'Erstes Tippen: Probe ② hervorgehoben, Kästchen da – nichts geöffnet');
    ok(/Nochmals tippen/.test(await h.$eval('.tipp',e=>e.innerText)),'Das Kästchen sagt: «Nochmals tippen öffnet den Bericht»');
    await h.touchscreen.tap(bb.x+bb.width/2,bb.y+bb.height-14);await h.waitForTimeout(400);
    ok(await h.$eval('#dlg',d=>d.open)&&/09-498/.test(await h.$eval('#dlgTitel',e=>e.textContent)),'Nochmals tippen öffnet den Bericht');
    await h.evaluate(()=>el('dlg').close());await h.waitForTimeout(200);
    await h.screenshot({path:shots+'/vergleich-handy.png',fullPage:true});
    await ctx.close();
  }

  console.log('\n── Ergebnis ──');
  if(stoerung.length){fehler+=stoerung.length;stoerung.forEach(x=>console.log('  ✗',x))}
  console.log(fehler?`  ${fehler} FEHLER`:'  ✓ Der Vergleich tut, was er soll.');
  await b.close();
  process.exit(fehler?1:0);
})().catch(e=>{console.error('ABBRUCH',e);process.exit(1)});
