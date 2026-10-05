/* Die Eingabemaske («/maske») hinten am Tank, im echten Browser gegen den
   echten Server – offen, ohne Passwort, wie er betrieben wird:
   Namensschranke, messen (O₂ nur vorne), Säure · Düngen · nur Wasser,
   Netz weg, Warteschlange, Netz da, die Stunde ist um.
   Aufruf:  CHROME=… NODE_PATH=… node pruefung/tank.js                      */
const {chromium}=require('playwright');
const {spawn}=require('child_process');
const fs=require('fs'),path=require('path'),os=require('os');
let fehler=0;
const ok=(b,t)=>{if(!b)fehler++;console.log((b?'  ✓ ':'  ✗ FEHLER ')+t)};
const daten=fs.mkdtempSync(path.join(os.tmpdir(),'basilikum-tank-'));
const PORT=19000+Math.floor(Math.random()*1000);
const B='http://127.0.0.1:'+PORT;
const shots=process.env.SHOTS||path.join(os.tmpdir(),'basilikum-tank-shots');
fs.mkdirSync(shots,{recursive:true});

/* Ein Bestand mit zugeordneten Stellen und den Produkten der Anwendung –
   so, wie er nach der ersten Sitzung im Büro aussieht. */
fs.mkdirSync(path.join(daten,'sicherungen'),{recursive:true});
fs.writeFileSync(path.join(daten,'bestand.json'),JSON.stringify({version:3,geaendert:'2026-09-25T10:00:00Z',von:'admin',db:{
  schema:11,analysen:[],ereignisse:[],rundgaenge:[],fotos:[],saetze:{},eigeneOptima:{},
  messungen:[{id:'m0',datum:'2026-09-25',stelle:'Reservoir vorne',ph:6.1,ec:1.8,o2:7.9,temp:20,wer:'AK',quelle:'erfassen'}],
  stellen:{gruppen:[{id:'v',name:'Reservoir vorne'},{id:'h',name:'Reservoir hinten'}],zu:{}},
  produkte:{biovin:{name:'Biovin Bio-Kraftdünger 9N',form:'fluessig'},epsotop:{name:'Magnesium (Epsotop, Bittersalz)',form:'fest',einheit:'g'},
    kali:{name:'Kali',form:'fest',einheit:'g'},zink:{name:'Zink',form:'fest',einheit:'g'},
    schwefelsaeure25:{name:'Schwefelsäure 25 %',form:'fluessig',einheit:'l'}},
  einst:{}}}));

function starten(){
  return new Promise((res,rej)=>{
    const p=spawn(process.execPath,[path.join(__dirname,'..','server.js')],{env:(()=>{const e=Object.assign({},process.env,{PORT:String(PORT),DATEN:daten});
      for(const k of ['ADMIN_PASSWORT','HINTEN_PASSWORT','MASKE_PASSWORT'])delete e[k];return e})(),stdio:['ignore','pipe','pipe']});
    let out='';p.stdout.on('data',d=>{out+=d;if(/läuft auf Port/.test(out))res(p)});p.stderr.on('data',d=>out+=d);
    setTimeout(()=>rej(new Error('Server startet nicht: '+out)),5000);
  });
}
const auth=(u,p)=>({Authorization:'Basic '+Buffer.from(u+':'+p).toString('base64')});
const bestand=async()=>(await (await fetch(B+'/api/bestand',{headers:auth('admin','a')})).json()).db;

(async()=>{
  const server=await starten();
  const b=await chromium.launch(process.env.CHROME?{executablePath:process.env.CHROME,args:['--no-sandbox']}:{});
  const ctx=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:2});
  const p=await ctx.newPage();
  const stoerung=[];
  p.on('pageerror',e=>stoerung.push('pageerror: '+e.message));
  /* Erwartet und deshalb nicht gezählt: das fehlende Favicon, der absichtlich
     gekappte Aufruf im Abschnitt «Netz weg», die absichtliche 401-Probe. */
  p.on('console',m=>{const t=m.text();if(m.type()==='error'&&!/Failed to load resource|net::ERR_/.test(t))stoerung.push('console: '+t)});

  console.log('════ Wer misst? ════');
  await p.goto(B+'/maske');await p.waitForTimeout(700);
  ok(/Am Tank/.test(await p.title()),'«/maske» öffnet ohne Anmeldung, ohne Passwort');
  ok(!(await p.$eval('#schranke',e=>e.hidden)),'Zuerst die Schranke: ohne Kürzel geht nichts');
  await p.screenshot({path:shots+'/tank-schranke.png'});
  await p.fill('#schrankeWer','m');await p.click('#schranke button:text-is("Weiter")');await p.waitForTimeout(200);
  ok(!(await p.$eval('#schranke',e=>e.hidden)),'Ein Zeichen reicht nicht');
  await p.fill('#schrankeWer','mk');await p.click('#schranke button:text-is("Weiter")');await p.waitForTimeout(300);
  ok(await p.$eval('#schranke',e=>e.hidden),'Zwei Zeichen, dann ist die Schranke weg');
  ok((await p.$eval('#werAnzeige',e=>e.textContent))==='MK','Das Kürzel steht gross geschrieben im Kopf');
  ok(/bis \d\d:\d\d/.test(await p.$eval('#werBis',e=>e.textContent)),'Mit der Uhrzeit, bis wann es gilt');

  console.log('\n════ Messung ════');
  const stellen=await p.$$eval('#mStelle button',es=>es.map(e=>e.textContent));
  ok(stellen.length===2&&/vorne/.test(stellen[0]),'Die Stellen kommen aus dem Bestand: die zwei Reservoirs');
  ok(!(await p.$eval('#o2Zeile',e=>e.hidden)),'Vorne gibt es das Sauerstoff-Feld');
  await p.click('#mStelle button:text-is("hinten")');await p.waitForTimeout(200);
  ok(await p.$eval('#o2Zeile',e=>e.hidden),'Hinten nicht – das Gerät hängt vorne');
  await p.click('#mStelle button:text-is("vorne")');await p.waitForTimeout(200);
  const letzt=await p.$eval('[data-letzt="ph"]',e=>e.textContent);
  ok(/zuletzt 6.1|zuletzt 6,1/.test(letzt)&&/AK/.test(letzt),'Unter dem Feld steht der letzte Wert dieser Stelle – mit Datum und Kürzel');
  await p.fill('#mPh','6,3');await p.fill('#mEc','1.9');await p.fill('#mO2','7,4');await p.fill('#mTemp','21');
  await p.click('button:text-is("Messung eintragen")');await p.waitForTimeout(700);
  const m1=await p.$eval('#mMeld',e=>e.textContent);
  ok(/Eingetragen/.test(m1)&&/vorne/.test(m1),'Bestätigung nennt Stelle und Datum');
  let db=await bestand();
  const neu=db.messungen[db.messungen.length-1];
  ok(db.messungen.length===2&&neu.ph===6.3&&neu.ec===1.9&&neu.o2===7.4&&neu.temp===21,'Der Eintrag ist im gemeinsamen Bestand – mit Komma wie mit Punkt');
  ok(neu.wer==='MK'&&neu.quelle==='erfassen'&&neu.stelle==='Reservoir vorne','Mit Kürzel, Herkunft und Stelle');
  const uhrJetzt=await p.evaluate(()=>{const d=new Date();return d.getHours()*60+d.getMinutes()});
  ok(/^\d\d:\d\d$/.test(neu.zeit||'')&&Math.abs((+neu.zeit.slice(0,2)*60+ +neu.zeit.slice(3))-uhrJetzt)<=2,'Mit der Uhrzeit des Handys, von selbst: '+neu.zeit);
  ok(/läuft mit/.test(await p.$eval('#mZeitHinweis',e=>e.textContent)),'Das Uhrzeit-Feld sagt, dass es mitläuft');
  ok((await p.$eval('#mPh',e=>e.value))==='','Die Felder sind danach leer für die nächste Messung');
  await p.fill('#mPh','8,4');await p.fill('#mZeit','07:30');
  ok(/von Hand/.test(await p.$eval('#mZeitHinweis',e=>e.textContent)),'Von Hand gesetzt: das Feld läuft nicht mehr mit');
  await p.click('button:text-is("Messung eintragen")');await p.waitForTimeout(400);
  ok(/grosser Sprung/.test(await p.$eval('#mMeld',e=>e.textContent)),'pH 8,4 nach 6,3: die Seite fragt nach');
  db=await bestand();ok(db.messungen.length===2,'Und hat noch nichts gespeichert');
  await p.click('button:text-is("Messung eintragen")');await p.waitForTimeout(700);
  db=await bestand();ok(db.messungen.length===3&&db.messungen[2].ph===8.4,'Nochmals antippen bestätigt');
  ok(db.messungen[2].zeit==='07:30','Eine von Hand gesetzte Uhrzeit gilt (Nachtrag)');
  ok(/läuft mit/.test(await p.$eval('#mZeitHinweis',e=>e.textContent)),'Danach läuft das Feld wieder mit');
  await p.fill('#mPh','sechs');await p.click('button:text-is("Messung eintragen")');await p.waitForTimeout(300);
  ok(/keine Zahl/.test(await p.$eval('#mMeld',e=>e.textContent)),'«sechs» ist keine Zahl – gesagt, nicht geraten');
  await p.fill('#mPh','');

  console.log('\n════ Beigabe: Säure ════');
  await p.click('.reiter button:text-is("Säure")');await p.waitForTimeout(200);
  const saeuren=await p.$$eval('#sMittel option',es=>es.map(e=>e.textContent));
  ok(saeuren.length===1&&/Schwefelsäure 25/.test(saeuren[0]),'Zur Wahl steht genau die Säure aus den Stammdaten: '+saeuren[0]);
  await p.fill('#sVorne','1,5');await p.fill('#sHinten','1');await p.fill('#sNotiz','pH vorher 7,4');
  await p.click('button:text-is("Säure eintragen")');await p.waitForTimeout(900);
  const sm=await p.$eval('#bMeld',e=>e.textContent);
  ok(/Eingetragen/.test(sm)&&/1.5 l vorne|1,5 l vorne/.test(sm)&&/1 l hinten/.test(sm),'Bestätigung: '+sm.replace(/\n/g,' '));
  db=await bestand();
  const sae=db.ereignisse.filter(e=>e.typ==='Säurezugabe');
  ok(sae.length&&sae.every(e=>/^\d\d:\d\d$/.test(e.zeit||'')),'Beigaben tragen die Uhrzeit des Eintragens');
  ok(sae.length===2&&sae[0].stelle==='vorne'&&sae[0].menge===1.5&&sae[1].stelle==='hinten'&&sae[1].menge===1,'Zwei Einträge auf dem Server: vorne 1,5 l, hinten 1 l');
  ok(sae.every(e=>e.mittel==='schwefelsaeure25'&&e.einheit==='l'&&e.wer==='MK'&&e.notiz==='pH vorher 7,4'),'Beide mit Säure, Liter, Kürzel und Notiz');
  await p.screenshot({path:shots+'/tank-saeure.png'});

  console.log('\n════ Beigabe: Düngen ════');
  await p.click('.reiter button:text-is("Düngen")');await p.waitForTimeout(200);
  const gramm=await p.$$eval('#rDuengen .einh',es=>es.map(e=>e.textContent));
  ok(gramm.filter(x=>x==='Gramm').length===3,'Magnesium, Kali und Zink stehen in Gramm – ausgeschrieben, kein Auswahlfeld');
  await p.fill('#dWasserVorne','2000');await p.fill('#dWasserHinten','1500');await p.fill('#dBiovin','20');
  await p.fill('#dMg','500');await p.fill('#dKali','300');await p.fill('#dZink','20');
  await p.click('button:text-is("Düngung eintragen")');await p.waitForTimeout(1500);
  const dm=await p.$eval('#bMeld',e=>e.textContent);
  console.log('   ',dm.replace(/\n/g,' '));
  ok(/Eingetragen/.test(dm)&&/20 l Biovin/.test(dm)&&/500 g Magnesium/.test(dm),'Bestätigung nennt alles, was gegeben wurde');
  db=await bestand();
  const wz=db.ereignisse.filter(e=>e.typ==='Wasserzugabe');
  ok(wz.length===2&&wz.some(e=>e.stelle==='vorne'&&e.menge===2000)&&wz.some(e=>e.stelle==='hinten'&&e.menge===1500),'Wasser vorne und hinten getrennt');
  ok(wz.every(e=>e.felder&&e.felder.mitDuenger==='ja'),'Und als «mit Dünger angesetzt» gekennzeichnet');
  const bio=db.ereignisse.find(e=>e.typ==='Düngergabe'&&e.mittel==='biovin');
  ok(bio&&bio.menge===20&&bio.einheit==='l'&&bio.stelle==='beide','Biovin 20 l für beide');
  const zu=db.ereignisse.filter(e=>e.typ==='Zusatzdünger / Spurenelemente');
  ok(zu.length===3&&zu.every(e=>e.einheit==='g')&&zu.find(e=>e.mittel==='epsotop').menge===500&&zu.find(e=>e.mittel==='zink').menge===20,'Magnesium, Kali, Zink in Gramm, je ein Eintrag');
  await p.screenshot({path:shots+'/tank-duengen.png'});

  console.log('\n════ Beigabe: nur Wasser ════');
  await p.click('.reiter button:text-is("Nur Wasser")');await p.waitForTimeout(200);
  await p.click('button:text-is("Wasser eintragen")');await p.waitForTimeout(300);
  ok(/vorne oder hinten/.test(await p.$eval('#bMeld',e=>e.textContent)),'Ohne Menge: nachgefragt');
  await p.fill('#wHinten','800');
  await p.click('button:text-is("Wasser eintragen")');await p.waitForTimeout(800);
  db=await bestand();
  const nw=db.ereignisse.filter(e=>e.typ==='Wasserzugabe'&&e.felder&&e.felder.mitDuenger==='nein');
  ok(nw.length===1&&nw[0].stelle==='hinten'&&nw[0].menge===800,'Nur Wasser hinten 800 l, ohne Dünger');
  ok(/Zuletzt/.test(await p.$eval('body',e=>e.innerText))&&/nur Wasser: 800 l hinten/.test(await p.$eval('#zuletzt',e=>e.innerText)),'Steht in «Zuletzt»');

  console.log('\n════ Netz weg ════');
  await p.route('**/api/**',r=>r.abort('connectionfailed'));
  await p.fill('#wVorne','300');
  await p.click('button:text-is("Wasser eintragen")');await p.waitForTimeout(700);
  ok(/wartet/.test(await p.$eval('#bMeld',e=>e.textContent)),'Ohne Netz: der Eintrag wartet, die Seite sagt es');
  ok(await p.$eval('#warte',e=>e.classList.contains('an')),'Die Warteschlange ist sichtbar');
  ok(await p.$eval('#stand',e=>e.classList.contains('aus')),'Der Verbindungspunkt zeigt es an');
  await p.unroute('**/api/**');
  await p.route('**/api/ereignis',r=>r.abort('connectionfailed'));
  await p.reload();await p.waitForTimeout(800);
  ok(/1 Eintrag wartet/.test(await p.$eval('#warteText',e=>e.textContent)),'Die Warteschlange überlebt das Neuladen der Seite');
  ok(await p.$eval('#schranke',e=>e.hidden)&&(await p.$eval('#werAnzeige',e=>e.textContent))==='MK','Das Kürzel gilt nach dem Neuladen weiter – innerhalb der Stunde');

  console.log('\n════ Netz da ════');
  await p.unroute('**/api/ereignis');
  await p.click('#warte button:text-is("Erneut senden")');await p.waitForTimeout(800);
  ok(!(await p.$eval('#warte',e=>e.classList.contains('an'))),'«Erneut senden» leert die Warteschlange');
  db=await bestand();
  ok(db.ereignisse.some(e=>e.typ==='Wasserzugabe'&&e.stelle==='vorne'&&e.menge===300),'Der gewartete Eintrag ist jetzt im Bestand – unverändert');

  console.log('\n════ Die Stunde ist um ════');
  await p.evaluate(()=>{const w=JSON.parse(localStorage.getItem('tank.wer'));w.bis=Date.now()-1000;localStorage.setItem('tank.wer',JSON.stringify(w))});
  await p.fill('#mPh','6,5');   /* nah am letzten Wert (nach Uhrzeit: 6,3) – sonst fragt die Seite zu Recht nach */
  await p.click('button:text-is("Messung eintragen")');await p.waitForTimeout(400);
  ok(!(await p.$eval('#schranke',e=>e.hidden)),'Nach Ablauf der Stunde: erst wieder das Kürzel, dann der Eintrag');
  ok(/Stunde ist um/.test(await p.$eval('#schrankeMeld',e=>e.textContent)),'Mit dem Grund');
  db=await bestand();const vorher=db.messungen.length;
  await p.fill('#schrankeWer','ab');await p.click('#schranke button:text-is("Weiter")');await p.waitForTimeout(300);
  await p.click('button:text-is("Messung eintragen")');await p.waitForTimeout(700);
  db=await bestand();
  ok(db.messungen.length===vorher+1&&db.messungen[vorher].wer==='AB','Der Eintrag trägt jetzt das neue Kürzel');
  await p.click('header button:text-is("wechseln")');await p.waitForTimeout(200);
  ok(!(await p.$eval('#schranke',e=>e.hidden)),'«wechseln» im Kopf öffnet die Schranke sofort');

  console.log('\n════ Keine Tür ins Dashboard ════');
  ok((await p.$$('a[href]')).length===0,'Auf der Maske gibt es keinen einzigen Link – auch nicht ins Dashboard');
  const roh=await p.$eval('body',e=>e.innerHTML);
  ok(!/Blattsaft|Analysen einlesen/.test(roh),'Die Seite enthält nichts vom Büro-Werkzeug');
  ok(!/<script src=|<link [^>]*href="http/.test(roh),'Sie lädt nichts von aussen');

  console.log('\n════ Ergebnis ════');
  if(stoerung.length){fehler+=stoerung.length;stoerung.forEach(x=>console.log('  ✗',x))}
  console.log(fehler?`  ${fehler} FEHLER`:'  ✓ Die Handy-Seite tut, was sie soll.');
  console.log('  Screenshots:',shots);
  await b.close();server.kill('SIGTERM');
  process.exit(fehler?1:0);
})().catch(e=>{console.error('ABBRUCH',e);process.exit(1)});
