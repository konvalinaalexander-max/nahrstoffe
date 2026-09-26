/* Die Handy-Seite hinten am Tank, im echten Browser gegen den echten Server:
   anmelden, messen, Beigabe eintragen, Netz weg, Warteschlange, Netz da.
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
  schema:9,analysen:[],ereignisse:[],rundgaenge:[],fotos:[],saetze:{},eigeneOptima:{},
  messungen:[{id:'m0',datum:'2026-09-25',stelle:'Reservoir vorne',ph:6.1,ec:1.8,o2:7.9,temp:20,wer:'AK',quelle:'erfassen'}],
  stellen:{gruppen:[{id:'v',name:'Reservoir vorne'},{id:'h',name:'Reservoir hinten'}],zu:{}},
  produkte:{biovin:{name:'Biovin Bio-Kraftdünger 9N',form:'fluessig'},epsotop:{name:'Epsotop (Bittersalz)',form:'fest'},
    zitronensaeure:{name:'Zitronensäure',form:'fest'}},
  einst:{}}}));

function starten(){
  return new Promise((res,rej)=>{
    const p=spawn(process.execPath,[path.join(__dirname,'..','server.js')],{env:Object.assign({},process.env,
      {PORT:String(PORT),DATEN:daten,ADMIN_PASSWORT:'a',HINTEN_PASSWORT:'h'}),stdio:['ignore','pipe','pipe']});
    let out='';p.stdout.on('data',d=>{out+=d;if(/läuft auf Port/.test(out))res(p)});p.stderr.on('data',d=>out+=d);
    setTimeout(()=>rej(new Error('Server startet nicht: '+out)),5000);
  });
}
const auth=(u,p)=>({Authorization:'Basic '+Buffer.from(u+':'+p).toString('base64')});
const bestand=async()=>(await (await fetch(B+'/api/bestand',{headers:auth('admin','a')})).json()).db;

(async()=>{
  const server=await starten();
  const b=await chromium.launch(process.env.CHROME?{executablePath:process.env.CHROME,args:['--no-sandbox']}:{});
  const ctx=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:2,
    httpCredentials:{username:'hinten',password:'h'}});
  const p=await ctx.newPage();
  const stoerung=[];
  p.on('pageerror',e=>stoerung.push('pageerror: '+e.message));
  /* Erwartet und deshalb nicht gezählt: das fehlende Favicon, der absichtlich
     gekappte Aufruf im Abschnitt «Netz weg», die absichtliche 401-Probe. */
  p.on('console',m=>{const t=m.text();if(m.type()==='error'&&!/Failed to load resource|net::ERR_/.test(t))stoerung.push('console: '+t)});

  console.log('════ Öffnen ════');
  await p.goto(B+'/erfassen');await p.waitForTimeout(700);
  ok(/Am Tank/.test(await p.title()),'Die Seite öffnet mit den Zugangsdaten der Rolle «hinten»');
  const stellen=await p.$$eval('#mStelle button',es=>es.map(e=>e.textContent));
  console.log('   Stellen:',stellen.join(' | '));
  ok(stellen.length===2&&/vorne/.test(stellen[0]),'Die Stellen kommen aus dem Bestand: die zwei Reservoirs');
  const mittel=await p.$$eval('#bMittel .chip',es=>es.map(e=>e.textContent));
  console.log('   Mittel:',mittel.join(' | '));
  ok(mittel.length===4&&/Biovin/.test(mittel[0])&&/Anderes/.test(mittel[3]),'Die Produkte sind dieselben wie im Büro, plus «Anderes»');
  const letzt=await p.$eval('[data-letzt="ph"]',e=>e.textContent);
  console.log('   unter dem pH-Feld:',letzt);
  ok(/zuletzt 6.1|zuletzt 6,1/.test(letzt)&&/AK/.test(letzt),'Unter dem Feld steht der letzte Wert dieser Stelle – mit Datum und Kürzel');
  const ohne=await p.$eval('#bEinh',e=>e.textContent);
  ok(ohne==='l','Die Einheit folgt dem Produkt (Biovin: Liter)');
  await p.screenshot({path:shots+'/tank-leer.png'});

  console.log('\n════ Messung ════');
  await p.fill('#wer','mk');
  await p.fill('#mPh','6,3');await p.fill('#mEc','1.9');await p.fill('#mO2','7,4');await p.fill('#mTemp','21');
  await p.click('button:text-is("Messung eintragen")');await p.waitForTimeout(700);
  const m1=await p.$eval('#mMeld',e=>e.textContent);
  console.log('   Meldung:',m1);
  ok(/Eingetragen/.test(m1)&&/vorne/.test(m1),'Bestätigung nennt Stelle und Datum');
  let db=await bestand();
  const neu=db.messungen[db.messungen.length-1];
  ok(db.messungen.length===2&&neu.ph===6.3&&neu.ec===1.9&&neu.o2===7.4&&neu.temp===21,'Der Eintrag ist im gemeinsamen Bestand – mit Komma wie mit Punkt');
  ok(neu.wer==='MK'&&neu.quelle==='erfassen'&&neu.stelle==='Reservoir vorne','Mit Kürzel (gross geschrieben), Herkunft und Stelle');
  ok((await p.$eval('#mPh',e=>e.value))==='','Die Felder sind danach leer für die nächste Messung');
  const letzt2=await p.$eval('[data-letzt="ph"]',e=>e.textContent);
  ok(/6.3|6,3/.test(letzt2)&&/MK/.test(letzt2),'Und «zuletzt» zeigt schon den eigenen Wert');
  const liste=await p.$eval('#zuletzt',e=>e.innerText);
  ok(/pH 6.3|pH 6,3/.test(liste),'Der Eintrag steht in «Zuletzt»');

  /* Ein grosser Sprung wird nachgefragt, nicht verweigert */
  await p.fill('#mPh','8,4');
  await p.click('button:text-is("Messung eintragen")');await p.waitForTimeout(400);
  const frage=await p.$eval('#mMeld',e=>e.textContent);
  console.log('   Nachfrage:',frage);
  ok(/grosser Sprung/.test(frage),'pH 8,4 nach 6,3: die Seite fragt nach');
  db=await bestand();
  ok(db.messungen.length===2,'Und hat noch nichts gespeichert');
  await p.click('button:text-is("Messung eintragen")');await p.waitForTimeout(700);
  db=await bestand();
  ok(db.messungen.length===3&&db.messungen[2].ph===8.4,'Nochmals antippen bestätigt – der Wert ist gespeichert, so wie er gemessen wurde');

  /* Unsinn wird benannt */
  await p.fill('#mPh','sechs');
  await p.click('button:text-is("Messung eintragen")');await p.waitForTimeout(300);
  ok(/keine Zahl/.test(await p.$eval('#mMeld',e=>e.textContent)),'«sechs» ist keine Zahl – gesagt, nicht geraten');
  await p.fill('#mPh','');

  console.log('\n════ Beigabe ════');
  await p.click('#bMittel .chip:text-is("Epsotop")');await p.waitForTimeout(200);
  ok((await p.$eval('#bEinh',e=>e.textContent))==='kg','Epsotop ist fest: die Einheit springt auf kg');
  await p.fill('#bMenge','3');
  await p.click('#bStelle button:text-is("beide")');
  await p.check('#bJe');
  await p.fill('#bNotiz','wie immer');
  await p.click('button:text-is("Beigabe eintragen")');await p.waitForTimeout(700);
  const bm=await p.$eval('#bMeld',e=>e.textContent);
  console.log('   Meldung:',bm);
  ok(/Eingetragen/.test(bm)&&/3 kg je Reservoir/.test(bm),'Bestätigung nennt Produkt, Menge, Einheit und «je Reservoir»');
  db=await bestand();
  const ev=db.ereignisse[db.ereignisse.length-1];
  ok(db.ereignisse.length===1&&ev.mittel==='epsotop'&&ev.menge===3&&ev.einheit==='kg'&&ev.jeReservoir===true&&ev.typ==='Düngergabe',
     'Im Logbuch des Bestands: Düngergabe Epsotop 3 kg je Reservoir');
  ok(ev.wer==='MK'&&ev.quelle==='erfassen'&&ev.notiz==='wie immer','Mit Kürzel, Herkunft und Notiz');
  await p.click('#bMittel .chip:text-is("Zitronensäure")');await p.waitForTimeout(200);
  await p.fill('#bMenge','0,5');
  await p.click('button:text-is("Beigabe eintragen")');await p.waitForTimeout(700);
  db=await bestand();
  ok(db.ereignisse[1].typ==='Säurezugabe'&&db.ereignisse[1].menge===0.5,'Zitronensäure landet als «Säurezugabe», nicht als Düngergabe');
  await p.click('#bMittel .chip:text-is("Anderes")');
  await p.fill('#bMenge','1');await p.fill('#bNotiz','');
  await p.click('button:text-is("Beigabe eintragen")');await p.waitForTimeout(300);
  ok(/in die Notiz/.test(await p.$eval('#bMeld',e=>e.textContent)),'«Anderes» ohne Notiz: nachgefragt, was es war');
  await p.screenshot({path:shots+'/tank-eingetragen.png'});

  console.log('\n════ Netz weg ════');
  await p.route('**/api/**',r=>r.abort('connectionfailed'));
  await p.fill('#mPh','8,2');            /* nahe am zuletzt bestätigten 8,4 – keine Nachfrage */
  await p.click('button:text-is("Messung eintragen")');await p.waitForTimeout(700);
  const offline=await p.$eval('#mMeld',e=>e.textContent);
  console.log('   Meldung:',offline);
  ok(/wartet/.test(offline),'Ohne Netz: der Eintrag wartet, die Seite sagt es');
  ok(await p.$eval('#warte',e=>e.classList.contains('an')),'Die Warteschlange ist sichtbar');
  ok(/1 Eintrag wartet/.test(await p.$eval('#warteText',e=>e.textContent)),'Und zählt');
  ok(await p.$eval('#stand',e=>e.classList.contains('aus')),'Der Verbindungspunkt zeigt es an');
  db=await bestand();
  ok(db.messungen.length===3,'Auf dem Server ist noch nichts davon');
  /* Die Seite neu laden – die Warteschlange muss den Neustart überleben */
  await p.unroute('**/api/**');
  await p.route('**/api/messung',r=>r.abort('connectionfailed'));
  await p.reload();await p.waitForTimeout(800);
  ok(/1 Eintrag wartet/.test(await p.$eval('#warteText',e=>e.textContent)),'Die Warteschlange überlebt das Neuladen der Seite');
  ok((await p.$eval('#wer',e=>e.value))==='MK','Das Kürzel ebenso');

  console.log('\n════ Netz da ════');
  await p.unroute('**/api/messung');
  await p.click('#warte button:text-is("Erneut senden")');await p.waitForTimeout(800);
  ok(!(await p.$eval('#warte',e=>e.classList.contains('an'))),'«Erneut senden» leert die Warteschlange');
  db=await bestand();
  ok(db.messungen.length===4&&db.messungen[3].ph===8.2,'Der gewartete Eintrag ist jetzt im Bestand – unverändert');
  ok(/nachgesendet/.test(await p.$eval('#mMeld',e=>e.textContent)),'Und die Seite sagt, dass sie nachgesendet hat');
  ok(!(await p.$eval('#stand',e=>e.classList.contains('aus'))),'Der Verbindungspunkt ist wieder grün');

  console.log('\n════ Grenzen der Rolle ════');
  const r=await p.evaluate(async()=>{const x=await fetch('/api/bestand');return x.status});
  ok(r===401,'Auch aus der Seite heraus kommt «hinten» nicht an den Bestand');
  const roh=await p.$eval('body',e=>e.innerHTML);
  ok(!/Blattsaft|Analysen einlesen/.test(roh),'Die Seite enthält nichts vom Büro-Werkzeug');
  ok(!/<script src=|<link [^>]*href="http/.test(roh),'Sie lädt nichts von aussen – sofort da, auch bei schlechtem Empfang');

  console.log('\n════ Ergebnis ════');
  if(stoerung.length){fehler+=stoerung.length;stoerung.forEach(x=>console.log('  ✗',x))}
  console.log(fehler?`  ${fehler} FEHLER`:'  ✓ Die Handy-Seite tut, was sie soll.');
  console.log('  Screenshots:',shots);
  await b.close();server.kill('SIGTERM');
  process.exit(fehler?1:0);
})().catch(e=>{console.error('ABBRUCH',e);process.exit(1)});
