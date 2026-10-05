/* Der erste Tag online, so wie ihn die Anleitung beschreibt: leerer Server,
   alte Sicherung einspielen, das vorbereitete Datenpaket aktivieren, neu
   laden, am Handy messen. Echter Server, echter Browser.
   Aufruf:  CHROME=… NODE_PATH=… node pruefung/paket.js                    */
const {chromium}=require('playwright');
const {spawn}=require('child_process');
const fs=require('fs'),path=require('path'),os=require('os');
let fehler=0;
const ok=(b,t)=>{if(!b)fehler++;console.log((b?'  ✓ ':'  ✗ FEHLER ')+t)};
const daten=fs.mkdtempSync(path.join(os.tmpdir(),'basilikum-paket-'));
const PORT=21000+Math.floor(Math.random()*1000);
const B='http://127.0.0.1:'+PORT;
const shots=process.env.SHOTS||path.join(os.tmpdir(),'basilikum-paket-shots');
fs.mkdirSync(shots,{recursive:true});
const auth=(u,p)=>({Authorization:'Basic '+Buffer.from(u+':'+p).toString('base64')});
const ADMIN=auth('admin','a');
const ruf=async pfad=>{const r=await fetch(B+pfad,{headers:ADMIN});return {status:r.status,json:await r.json().catch(()=>null)}};
function starten(){
  return new Promise((res,rej)=>{
    const p=spawn(process.execPath,[path.join(__dirname,'..','server.js')],{env:(()=>{const e=Object.assign({},process.env,{PORT:String(PORT),DATEN:daten});
      for(const k of ['ADMIN_PASSWORT','HINTEN_PASSWORT','MASKE_PASSWORT'])delete e[k];return e})(),stdio:['ignore','pipe','pipe']});
    let out='';p.stdout.on('data',d=>{out+=d;if(/läuft auf Port/.test(out))res(p)});p.stderr.on('data',d=>out+=d);
    setTimeout(()=>rej(new Error('Server startet nicht: '+out)),5000);
  });
}
const bandTexte=p=>p.$$eval('#cTank text',es=>es.map(e=>e.textContent));

(async()=>{
  let server=await starten();
  const b=await chromium.launch(process.env.CHROME?{executablePath:process.env.CHROME,args:['--no-sandbox']}:{});
  const ctx=await b.newContext({viewport:{width:1280,height:1000}});
  const p=await ctx.newPage();
  const stoerung=[];
  p.on('pageerror',e=>stoerung.push('pageerror: '+e.message));
  p.on('console',m=>{const t=m.text();if(m.type()==='error'&&!/Failed to load resource|net::ERR_/.test(t))stoerung.push('console: '+t)});
  p.on('dialog',d=>d.accept());

  console.log('════ Leerer Server: der Hinweis ════');
  /* Die QR-Bibliothek kommt im Betrieb von cdnjs; hier aus der lokalen Kopie,
     damit die Prüfung ohne Netz läuft – dieselbe Datei, dieselbe Prüfsumme. */
  const qrDatei=process.env.QRJS||path.join(process.env.NODE_PATH||'','..','qrcode.min.js');
  if(fs.existsSync(qrDatei))await ctx.route('**/qrcode-generator/**',r=>r.fulfill({path:qrDatei,contentType:'application/javascript',headers:{'Access-Control-Allow-Origin':'*'}}));
  await p.goto(B+'/');await p.waitForTimeout(1500);
  ok(await p.$eval('#nav button.active',e=>e.textContent)==='Blattsaft & Giesswasser','Die Seite öffnet mit dem Reiter Blattsaft & Giesswasser');
  ok(/Bereit zum Aktivieren/.test(await p.$eval('#view',e=>e.textContent)),'Dort steht: Reservoir April bis September bereit zum Aktivieren');

  console.log('\n════ Zuerst die alte Sicherung, dann das Paket ════');
  await p.click('#nav button:text-is("Einstellungen")');await p.waitForTimeout(400);
  ok(/Vorbereitete Daten/.test(await p.$eval('#view',e=>e.textContent))&&/nicht aktiv/.test(await p.$eval('#view',e=>e.textContent)),'Einstellungen: Karte «Vorbereitete Daten», nicht aktiv');
  await p.setInputFiles('#fileJson',path.join(__dirname,'testdaten.json'));await p.waitForTimeout(3000);
  let srv=await ruf('/api/bestand');
  ok(srv.json.db.analysen.length===10,'Die Sicherung ist auf dem Server (10 Analysen)');
  await p.click('#nav button:text-is("Blattsaft & Giesswasser")');await p.waitForTimeout(300);
  ok(await p.$('.paketHinweis')!==null,'Der Hinweis steht nach dem Einspielen weiter da');
  await p.click('.paketHinweis button:text-is("Ansehen und aktivieren")');await p.waitForTimeout(400);
  const titel=await p.$eval('#dlgTitel',e=>e.textContent);
  const inhalt=await p.$eval('#dlg',e=>e.textContent);
  ok(/Reservoir April bis September 2026/.test(titel),'Der Dialog: '+titel);
  ok(/Balken je Mittel/.test(inhalt)&&/EM/.test(inhalt)&&/Halades/.test(inhalt),'Er zeigt die Balken, die danach entstehen – auch EM und Halades');
  ok(/«A» steht für HA/.test(inhalt)&&/Tippfehler/.test(inhalt)&&/Versehen/.test(inhalt),'Und was entschieden wurde (A = Halades, pH 1,36, Zeile ohne Datum)');
  ok(!/Versuch/.test(inhalt),'Nirgends «Versuch»');
  await p.screenshot({path:shots+'/paket-dialog.png'});
  await p.click('#dlg button:text-is("Aktivieren")');await p.waitForTimeout(600);
  ok(await p.$eval('#nav button.active',e=>e.textContent)==='pH & EC am Tank','Nach dem Aktivieren: Reiter pH & EC am Tank');
  await p.waitForTimeout(2500);
  ok(/online · gesichert/.test(await p.$eval('#stand',e=>e.textContent)),'Von selbst gesichert – kein Knopf');
  srv=await ruf('/api/bestand');
  const sdb=srv.json.db;
  ok(sdb.messungen.filter(m=>m.paket==='reservoir-2026').length===149&&sdb.ereignisse.filter(e=>e.paket==='reservoir-2026').length===82,'Auf dem Server: 149 Messungen und 82 Gaben und Ereignisse aus dem Paket');
  ok(sdb.analysen.length===10&&sdb.pakete&&sdb.pakete['reservoir-2026'].aktiviert,'Die Analysen sind noch da, das Paket als aktiv vermerkt');

  console.log('\n════ Am Tank: Balken, Uhrzeit, Schalter ════');
  let t=await bandTexte(p);
  ok(t.includes('Zitronensäure 31.08.–09.09.')&&t.some(x=>/^EM seit 17\.09\./.test(x))&&t.includes('Halades PE 06.08.–19.08.'),'Unter der Zeitachse: Zitronensäure bis 09.09., EM seit 17.09., Halades 06.–19.08.');
  ok(t.includes('Biovin 28.07.–26.08.')&&t.includes('Phosphorsäure 21.07.–25.08.'),'… Biovin ab 28.07., Phosphorsäure bis 25.08.');
  const tipps=await p.$$eval('#cTank .hit',es=>es.map(e=>e.getAttribute('data-tipp')||''));
  ok(tipps.some(x=>/Uhrzeit/.test(x)&&/09:00/.test(x)),'Ein Punkt vom 9.9. nennt seine Uhrzeit');
  ok(tipps.some(x=>/nicht erfasst/.test(x)),'Mehrere Messungen ohne Uhrzeit sagen, dass sie fehlt');
  ok(tipps.some(x=>/Beleg/.test(x)&&/Zeile/.test(x)),'Jeder Punkt nennt seinen Beleg (Tabellenzeile)');
  ok(t.includes('Neuansatz')&&t.includes('Wasserzugabe')&&t.includes('Kalibrierung'),'Darunter die Ereignisse als Marken, eine Zeile je Art');
  const umschalten=async key=>{await p.click('#view button:text-is("Balken ein- und ausblenden")');await p.waitForTimeout(250);
    await p.click(`#dlgBody [data-tun="kmAn"][data-k="${key}"]`);await p.waitForTimeout(300);await p.click('#dlgFoot button:text-is("Fertig")');await p.waitForTimeout(200)};
  await umschalten('m|em');
  t=await bandTexte(p);
  ok(!t.some(x=>/^EM /.test(x))&&t.some(x=>/^Biovin/.test(x)),'«Balken ein- und ausblenden»: EM aus, der Rest bleibt');
  ok((await p.$$eval('#view table tbody tr',es=>es.length))===149+3,'Darunter die Liste: alle 152 Messungen');
  await p.screenshot({path:shots+'/paket-tank.png',fullPage:false});
  await p.$eval('#cTank',e=>e.scrollIntoView({block:'start'}));await p.waitForTimeout(200);
  await p.screenshot({path:shots+'/paket-tank-diagramm.png',clip:await p.$eval('#cTank',e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height}})});
  await p.reload();await p.waitForTimeout(1800);
  t=await bandTexte(p);
  ok(!t.some(x=>/^EM /.test(x)),'Nach dem Neuladen bleibt EM ausgeblendet – persönliche Ansicht');
  await umschalten('m|em');
  ok((await bandTexte(p)).some(x=>/^EM /.test(x)),'Ein Klick, und EM ist wieder da');
  await p.click('#tkKopf button[data-tun="tkZeit"][data-v="7"]');await p.waitForTimeout(400);
  const achse=await p.$$eval('#cTank text',es=>es.map(e=>e.textContent).filter(x=>/^\d\d\.\d\d\.$/.test(x)));
  ok(achse.length>=6,'«1 Woche»: die Achse zeigt Tage ('+achse.slice(0,4).join(' ')+' …)');

  console.log('\n════ Blattsaft & Giesswasser: Marken und Balken von Hand ════');
  await p.click('#nav button:text-is("Blattsaft & Giesswasser")');await p.waitForTimeout(700);
  const kb=await p.$eval('#cKb',e=>({texte:[...e.querySelectorAll('text')].map(t=>t.textContent),marken:e.querySelectorAll('g.spb circle').length}));
  ok(kb.texte.includes('Blattsaft')&&kb.texte.includes('Giesswasser')&&kb.texte.includes('Kulturmanagement'),'Zwei Fenster, darunter das Kulturmanagement');
  ok(kb.marken>5,'Die Ereignisse als Marken: '+kb.marken);
  await p.$eval('#cKb',e=>e.scrollIntoView({block:'center'}));await p.waitForTimeout(200);
  const mk=await p.$$('#cKb g.spb');
  let tipp='';
  for(const g of mk.reverse()){if(await g.$('circle')){await g.hover();await p.waitForTimeout(250);tipp=await p.$eval('.tipp',e=>e.classList.contains('an')?e.textContent:'');break}}
  ok(/·/.test(tipp)&&/\d\d\.\d\d\.2026/.test(tipp),'Zeigen auf eine Marke: das Kästchen nennt Art, Tag und Einträge');
  await p.mouse.move(5,5);await p.waitForTimeout(200);
  await p.screenshot({path:shots+'/paket-kombi.png',fullPage:true});
  const baender=()=>p.$$eval('#cKb [data-tun="spanne"] text',es=>es.map(e=>e.textContent));
  ok((await baender()).includes('Magnesium seit 28.07.')&&(await baender()).includes('Kalisulfat seit 26.08.'),'Magnesium, Kalisulfat und Zink laufen bis heute');
  await p.$$eval('#cKb [data-tun="spanne"]',es=>{const g=es.find(e=>/Magnesium seit/.test(e.textContent));g.dispatchEvent(new MouseEvent('click',{bubbles:true}))});
  await p.waitForTimeout(400);
  ok(/Zeitraum des Balkens/.test(await p.$eval('#dlg',e=>e.textContent))&&await p.$eval('#spLaeuft',e=>e.checked)&&await p.$eval('#spBis',e=>e.disabled),'Klick auf den Balken: Beginn, Ende und «wird weiterhin gegeben» (angekreuzt)');
  await p.screenshot({path:shots+'/paket-balken-dialog.png'});
  await p.click('#spLaeuft');await p.fill('#spBis','2026-09-20');
  await p.click('#dlg button:text-is("Zeitraum speichern")');await p.waitForTimeout(500);
  ok((await baender()).includes('Magnesium 28.07.–20.09.'),'Ende gesetzt: Magnesium 28.07.–20.09.');
  await p.waitForTimeout(2300);
  srv=await ruf('/api/bestand');
  const z=(srv.json.db.beigabeZeiten||[]).filter(x=>x.mittel==='epsotop');
  ok(z.length===1&&z[0].bis==='2026-09-20','Auf dem Server gespeichert – gilt für alle');
  await p.$$eval('#cKb [data-tun="spanne"]',es=>{const g=es.find(e=>/Magnesium 28\.07/.test(e.textContent));g.dispatchEvent(new MouseEvent('click',{bubbles:true}))});
  await p.waitForTimeout(400);
  await p.click('#spLaeuft');
  await p.click('#dlg button:text-is("Zeitraum speichern")');await p.waitForTimeout(500);
  ok((await baender()).includes('Magnesium seit 28.07.'),'Wieder «wird weiterhin gegeben»: Magnesium seit 28.07.');
  ok(!/Bereit zum Aktivieren/.test(await p.$eval('#view',e=>e.textContent)),'Kein Hinweis mehr – das Paket ist aktiv');

  console.log('\n════ QR-Code zur Maske ════');
  ok(await p.$eval('#knopfQr',e=>!e.hidden)&&await p.$eval('#erfassenLink',e=>!e.hidden&&e.getAttribute('href')==='/maske'),'Oben rechts: «Maske ↗» und «QR-Code»');
  await p.click('#knopfQr');await p.waitForTimeout(800);
  const qrSvg=await p.$('#qrBild svg');
  ok(!!qrSvg,'Der QR-Code erscheint');
  if(qrSvg){
    const png=await (await p.$('#qrBild')).screenshot();
    let gelesen=null;
    try{const {PNG}=require('pngjs'),jsQR=require('jsqr');const bild=PNG.sync.read(png);const q=jsQR(new Uint8ClampedArray(bild.data),bild.width,bild.height);gelesen=q&&q.data}catch(e){gelesen='(Leser fehlt: '+e.message+')'}
    ok(gelesen===B+'/maske','Zurückgelesen ergibt der Code genau die Maske: '+gelesen);
    await p.screenshot({path:shots+'/paket-qr.png'});
    /* Drucken: nur das Blatt mit dem Code. window.print wird hier abgefangen,
       der Browser zeigt die Druckansicht. */
    await p.evaluate(()=>{window.__gedruckt=0;window.print=()=>{window.__gedruckt++}});
    await p.click('#dlg button:text-is("Drucken")');await p.waitForTimeout(300);
    ok(await p.evaluate(()=>window.__gedruckt)===1,'«Drucken» öffnet den Druck');
    await p.emulateMedia({media:'print'});
    const sicht=await p.evaluate(()=>({blatt:!!document.getElementById('qrDruck')&&getComputedStyle(document.getElementById('qrDruck')).display!=='none',
      kopf:getComputedStyle(document.querySelector('header')).display,dlg:getComputedStyle(document.getElementById('dlg')).display,
      text:(document.getElementById('qrDruck')||{}).textContent||''}));
    ok(sicht.blatt&&sicht.kopf==='none'&&sicht.dlg==='none','Gedruckt wird nur das Blatt mit dem Code – kein Dashboard, kein Dialog');
    ok(sicht.text.includes(B+'/maske')&&/Namen eintippen/.test(sicht.text),'Auf dem Blatt: Titel, Code, Adresse, «Scannen, Namen eintippen, eintragen»');
    await p.screenshot({path:shots+'/paket-druck.png'});
    await p.emulateMedia({media:'screen'});
    await p.evaluate(()=>window.dispatchEvent(new Event('afterprint')));await p.waitForTimeout(200);
    ok(!(await p.$('#qrDruck')),'Nach dem Druck ist das Blatt wieder weg');
  }
  await p.click('#dlg button:text-is("Schliessen")');

  console.log('\n════ Hinten am Handy ════');
  const hctx=await b.newContext({viewport:{width:390,height:844}});
  const h=await hctx.newPage();
  await h.goto(B+'/maske');await h.waitForTimeout(1200);
  await h.fill('#schrankeWer','Marco');await h.click('#schranke button:text-is("Weiter")');await h.waitForTimeout(300);
  await h.click('#mStelle button:text-is("vorne")');
  await h.fill('#mPh','7,2');await h.fill('#mEc','1,3');await h.fill('#mO2','6,1');
  await h.click('button:text-is("Messung eintragen")');await h.waitForTimeout(800);
  ok(/Eingetragen/.test(await h.$eval('#mMeld',e=>e.textContent)),'Die Messung ist angenommen');
  await h.screenshot({path:shots+'/paket-handy.png'});
  srv=await ruf('/api/bestand');
  const neu=srv.json.db.messungen.filter(m=>m.quelle==='erfassen');
  ok(neu.length===1&&/^\d\d:\d\d$/.test(neu[0].zeit||''),'Auf dem Server mit Uhrzeit: '+(neu[0]&&neu[0].zeit));
  await p.click('#nav button:text-is("Einträge Maske")');await p.reload();await p.waitForTimeout(1800);
  const zeilen=await p.$$eval('#view table tr',es=>es.map(e=>e.textContent));
  ok(neu[0].wer==='Marco','Der Name bleibt, wie getippt: '+neu[0].wer);
  ok(zeilen.length===2&&zeilen.some(z=>z.includes(neu[0].zeit)&&/Marco/.test(z)&&/pH 7.2/.test(z)),'Im Büro unter «Einträge Maske»: die Messung vom Handy mit Uhrzeit und Namen');
  await p.screenshot({path:shots+'/paket-maske.png'});

  console.log('\n════ Server neu gestartet ════');
  server.kill('SIGTERM');await new Promise(r=>setTimeout(r,500));
  server=await starten();
  await p.reload();await p.waitForTimeout(1800);
  srv=await ruf('/api/bestand');
  ok(srv.json.db.messungen.length===149+3+1,'Alles noch da: Paket, Sicherung, Handy ('+srv.json.db.messungen.length+' Messungen)');
  await p.click('#nav button:text-is("Blattsaft & Giesswasser")');await p.waitForTimeout(400);
  ok(await p.$('.paketHinweis')===null,'Und kein Hinweis zum Aktivieren mehr');

  ok(!stoerung.length,'Keine Fehlermeldung im Browser'+(stoerung.length?': '+stoerung.join(' | '):''));
  await b.close();server.kill('SIGTERM');
  console.log('\n════ Ergebnis ════');
  console.log(fehler?`  ${fehler} FEHLER`:'  ✓ Der erste Tag online funktioniert.');
  process.exit(fehler?1:0);
})().catch(e=>{console.error('ABBRUCH',e);process.exit(1)});
