/* Die Admin-Seite vom Server: laden, laufend sichern, Gleichzeitigkeit,
   Auffrischen, Kopie herunterladen. Echter Server, echter Browser.
   Aufruf:  CHROME=… NODE_PATH=… node pruefung/online.js                    */
const {chromium}=require('playwright');
const {spawn}=require('child_process');
const fs=require('fs'),path=require('path'),os=require('os');
let fehler=0;
const ok=(b,t)=>{if(!b)fehler++;console.log((b?'  ✓ ':'  ✗ FEHLER ')+t)};
const daten=fs.mkdtempSync(path.join(os.tmpdir(),'basilikum-online-'));
const PORT=20000+Math.floor(Math.random()*1000);
const B='http://127.0.0.1:'+PORT;
const shots=process.env.SHOTS||path.join(os.tmpdir(),'basilikum-online-shots');
fs.mkdirSync(shots,{recursive:true});
const auth=(u,p)=>({Authorization:'Basic '+Buffer.from(u+':'+p).toString('base64')});
const ADMIN=auth('admin','a'),HINTEN=auth('hinten','h');
const ruf=async(pfad,opt)=>{opt=opt||{};const r=await fetch(B+pfad,{method:opt.method||'GET',headers:Object.assign({},opt.headers||{},opt.body?{'Content-Type':'application/json'}:{}),body:opt.body?JSON.stringify(opt.body):undefined});let j=null;try{j=await r.json()}catch(e){}return {status:r.status,json:j}};
function starten(){
  return new Promise((res,rej)=>{
    const p=spawn(process.execPath,[path.join(__dirname,'..','server.js')],{env:Object.assign({},process.env,
      {PORT:String(PORT),DATEN:daten,ADMIN_PASSWORT:'a',HINTEN_PASSWORT:'h'}),stdio:['ignore','pipe','pipe']});
    let out='';p.stdout.on('data',d=>{out+=d;if(/läuft auf Port/.test(out))res(p)});p.stderr.on('data',d=>out+=d);
    setTimeout(()=>rej(new Error('Server startet nicht: '+out)),5000);
  });
}
const warten=ms=>new Promise(r=>setTimeout(r,ms));

(async()=>{
  const server=await starten();
  const b=await chromium.launch(process.env.CHROME?{executablePath:process.env.CHROME,args:['--no-sandbox']}:{});
  const ctx=await b.newContext({viewport:{width:1280,height:1000},httpCredentials:{username:'admin',password:'a'}});
  const p=await ctx.newPage();
  const stoerung=[];
  p.on('pageerror',e=>stoerung.push('pageerror: '+e.message));
  p.on('console',m=>{const t=m.text();if(m.type()==='error'&&!/Failed to load resource|net::ERR_/.test(t))stoerung.push('console: '+t)});

  console.log('════ Leerer Server ════');
  await p.goto(B+'/');await p.waitForTimeout(1500);
  const stand0=await p.$eval('#stand',e=>e.textContent);
  console.log('   Stand:',stand0);
  ok(/online/.test(stand0),'Die Seite merkt, dass sie vom Server kommt');
  ok(await p.$eval('#erfassenLink',e=>!e.hidden),'Der Link zur Handy-Seite erscheint');
  ok(await p.$eval('#knopfKopie',e=>e.hidden)&&await p.$eval('#knopfSichern',e=>e.hidden)&&await p.$eval('#knopfOeffnen',e=>e.hidden),
     'Keine Knöpfe zum Sichern oder Öffnen – online ist es eine Webseite');
  const toasts0=await p.$$eval('.toast',es=>es.map(e=>e.textContent));
  ok(toasts0.some(t=>/Server ist noch leer/.test(t)),'Und sagt, dass der Bestand auf dem Server noch leer ist');

  console.log('\n════ Sicherung einspielen, laufend sichern ════');
  await p.click('#nav button:text-is("Sätze & Einstellungen")');await p.waitForTimeout(400);
  ok(!!(await p.$('#view button:text-is("Sicherung einspielen")')),'«Sicherung einspielen» steht unter Einstellungen');
  await p.setInputFiles('#fileJson',path.join(__dirname,'testdaten.json'));await p.waitForTimeout(600);
  const standW=await p.$eval('#stand',e=>e.textContent);
  console.log('   Stand gleich danach:',standW);
  ok(/gleich gesichert|wird gesichert/.test(standW),'Nach dem Einlesen: «wird gleich gesichert» – ohne Knopf');
  await p.waitForTimeout(2500);
  const stand1=await p.$eval('#stand',e=>e.textContent);
  console.log('   Stand 2,5 s später:',stand1);
  ok(/online · gesichert/.test(stand1),'Nach kurzer Ruhe ist es gesichert');
  let srv=await ruf('/api/bestand',{headers:ADMIN});
  ok(srv.json.version>=1&&srv.json.db.analysen.length===10,'Der Server hat den Bestand: '+srv.json.db.analysen.length+' Analysen, Version '+srv.json.version);
  const v1=srv.json.version;

  /* Eine Aenderung in der Oberflaeche geht von selbst hoch */
  await p.click('#nav button:text-is("Logbuch")');await p.waitForTimeout(400);
  await p.click('#view button:text-is("Biovin")');await p.waitForTimeout(200);
  await p.fill('#lbForm [data-f="menge"]','20');
  await p.click('#lbForm button:text-is("Eintragen")');await p.waitForTimeout(400);
  await p.waitForTimeout(2500);
  srv=await ruf('/api/bestand',{headers:ADMIN});
  ok(srv.json.version===v1+1&&srv.json.db.ereignisse.some(e=>e.mittel==='biovin'&&e.menge===20),'Ein Logbucheintrag ist 2,5 s später auf dem Server – Version '+srv.json.version);

  console.log('\n════ Gleichzeitig: hinten trägt ein, während hier etwas offen ist ════');
  /* Hier eine Aenderung, die noch nicht hochgegangen ist … */
  await p.click('#view button:text-is("Epsotop")');await p.waitForTimeout(200);
  await p.fill('#lbForm [data-f="menge"]','3');
  /* … und derweil kommt vom Handy eine Messung (Version springt) */
  const m=await ruf('/api/messung',{method:'POST',headers:HINTEN,body:{datum:'2026-09-26',stelle:'Reservoir vorne',ph:6.2,ec:1.7,o2:7.1,temp:20,wer:'MK'}});
  ok(m.status===200,'Die Messung vom Handy ist angenommen (Version '+m.json.version+')');
  await p.click('#lbForm button:text-is("Eintragen")');await p.waitForTimeout(3000);
  srv=await ruf('/api/bestand',{headers:ADMIN});
  const hatMess=srv.json.db.messungen.some(x=>x.wer==='MK'&&x.o2===7.1),hatEps=srv.json.db.ereignisse.some(e=>e.mittel==='epsotop'&&e.menge===3);
  ok(hatMess&&hatEps,'Beides ist da: die Messung vom Handy UND der Eintrag von hier – nichts überschrieben');
  const stand2=await p.$eval('#stand',e=>e.textContent);
  ok(/online · gesichert/.test(stand2),'Der Stand ist wieder «gesichert»: '+stand2);
  const dbSeite=await p.evaluate(()=>({m:db.messungen.filter(x=>x.wer==='MK').length,v:ONLINE.version}));
  ok(dbSeite.m===1&&dbSeite.v===srv.json.version,'Die Seite hat die fremde Messung übernommen und trägt die aktuelle Version');

  console.log('\n════ Auffrischen ohne eigene Änderung ════');
  await ruf('/api/messung',{method:'POST',headers:HINTEN,body:{datum:'2026-09-26',stelle:'Reservoir hinten',ph:6.4,ec:1.8,wer:'AB'}});
  await p.click('#nav button:text-is("Giesswasser")');await p.waitForTimeout(400);
  /* die Abfrage laeuft alle 30 s – hier direkt anstossen */
  await p.evaluate(()=>onlineAbfragen());await p.waitForTimeout(800);
  const gw=await p.$eval('#view',e=>e.innerText);
  ok(/AB/.test(gw)&&/6.4|6,4/.test(gw),'Die Messung von «AB» steht ohne Neuladen im Reiter Giesswasser');
  const toasts=await p.$$eval('.toast',es=>es.map(e=>e.textContent));
  ok(toasts.some(t=>/Aufgefrischt/.test(t)),'Mit dem Hinweis, dass aufgefrischt wurde');
  const tank=await p.$eval('#tkKarte',e=>e.innerText);
  ok(/Am Tank/.test(tank)&&/Sauerstoff/.test(tank)&&/7.1|7,1/.test(tank),'Die Karte «Am Tank» zeigt den Sauerstoff vom Handy');
  const spuren=await p.$$eval('#cTank text',es=>es.map(e=>e.textContent).filter(t=>/^(pH im|EC im|Sauerstoff$)/.test(t)));
  console.log('   Spuren:',spuren.join(' | '));
  ok(spuren.length===3,'Drei Spuren: pH, EC, Sauerstoff – jede mit eigener Achse');
  ok(/Sättigungsgrenze/.test(tank),'Die Sättigungsgrenze steht als Annahme dabei');
  await (await p.$('#tkKarte')).scrollIntoViewIfNeeded();await p.waitForTimeout(300);
  await p.screenshot({path:shots+'/online-tank.png',fullPage:false});

  console.log('\n════ Kopie herunterladen ════');
  await p.click('#nav button:text-is("Sätze & Einstellungen")');await p.waitForTimeout(400);
  const dl=p.waitForEvent('download');
  await p.click('#view button:text-is("Kopie herunterladen")');
  const d=await dl;const ziel=path.join(shots,d.suggestedFilename());await d.saveAs(ziel);
  const text=fs.readFileSync(ziel,'utf8');
  ok(/^<!doctype html>/.test(text)&&/"wer":"MK"/.test(text),'Die Kopie ist die ganze Seite mit dem aktuellen Bestand – auch der Messung vom Handy');
  ok(text.indexOf('id="erfassenLink" href="/erfassen" hidden')>0,'Und trägt das unberührte Gerüst: vom Ordner geöffnet läuft sie im Datei-Modus');

  console.log('\n════ Satzpaare ════');
  await p.click('#nav button:text-is("Planer")');await p.waitForTimeout(500);
  const pl=await p.$eval('#view',e=>e.innerText);
  ok(/Satzpaare · Woche 2 und Woche 4/.test(pl),'Die Karte «Satzpaare» steht im Planer');
  await p.screenshot({path:shots+'/online-planer.png',fullPage:false});

  console.log('\n════ Beigabe-Bänder und Wesentlich ════');
  await p.click('#nav button:text-is("Nährstoffe")');await p.waitForTimeout(500);
  await p.$eval('#nsKarte .chip.stoff:text-is("Magnesium")',e=>e.click());await p.waitForTimeout(450);
  const baender=await p.$$eval('#cNs [data-tun="spanne"] text',es=>es.map(e=>e.textContent));
  console.log('   Bänder:',baender.join(' | '));
  ok(baender.some(t=>/Magnesium seit|Magnesium \d/.test(t)),'Magnesium gewählt → das Band «Magnesium seit …» erscheint unter dem Diagramm');
  await p.$eval('#cNs [data-tun="spanne"]',e=>e.dispatchEvent(new MouseEvent('click',{bubbles:true})));await p.waitForTimeout(400);
  const bd=await p.$eval('#dlgTitel',e=>e.textContent);
  ok(/Magnesium beigegeben/.test(bd),'Klick auf das Band öffnet die Liste der Gaben: '+bd);
  await p.click('#dlgFoot button:text-is("Schliessen")');await p.waitForTimeout(200);
  const vorW=await p.$$eval('#view > *',es=>es.filter(e=>getComputedStyle(e).display!=='none').length);
  await p.click('#nav button:text-is("Wesentlich")');await p.waitForTimeout(500);
  const nachW=await p.$$eval('#view > *',es=>es.filter(e=>getComputedStyle(e).display!=='none').length);
  ok(nachW===1&&vorW>1,'«Wesentlich» lässt nur die Diagrammkarte stehen ('+vorW+' → '+nachW+')');
  ok(await p.$eval('#cNs svg',e=>!!e),'Das Diagramm selbst bleibt');
  await p.screenshot({path:shots+'/online-wesentlich.png',fullPage:false});
  await p.click('#nav button:text-is("Alles")');await p.waitForTimeout(400);
  ok((await p.$$eval('#view > *',es=>es.filter(e=>getComputedStyle(e).display!=='none').length))===vorW,'«Alles» bringt alles zurück');
  await p.reload();await p.waitForTimeout(1500);
  ok((await p.$eval('#nav button.active',e=>e.textContent))==='Nährstoffe','Nach dem Neuladen ist der Reiter noch derselbe – persönliche Ansicht auf diesem Gerät');
  ok(await p.$eval('#nsKarte .chip.stoff:text-is("Magnesium")',e=>e.classList.contains('on')),'Und die Nährstoffauswahl auch');

  console.log('\n════ Server weg ════');
  await p.route('**/api/**',r=>r.abort('connectionfailed'));
  await p.click('#nav button:text-is("Logbuch")');await p.waitForTimeout(400);
  await p.click('#view button:text-is("Biovin")');await p.fill('#lbForm [data-f="menge"]','15');
  await p.click('#lbForm button:text-is("Eintragen")');await p.waitForTimeout(2500);
  const standF=await p.$eval('#stand',e=>e.textContent);
  console.log('   Stand:',standF);
  ok(/nicht erreichbar/.test(standF),'Ohne Server: «nicht erreichbar – Änderungen warten», nichts geht verloren');
  await p.unroute('**/api/**');
  await p.evaluate(()=>sichernOnline());await p.waitForTimeout(1500);
  srv=await ruf('/api/bestand',{headers:ADMIN});
  ok(srv.json.db.ereignisse.some(e=>e.mittel==='biovin'&&e.menge===15),'Sobald der Server da ist, geht es raus – von selbst beim nächsten Versuch');
  ok(/online · gesichert/.test(await p.$eval('#stand',e=>e.textContent)),'Und der Stand ist wieder grün');

  console.log('\n════ Ergebnis ════');
  if(stoerung.length){fehler+=stoerung.length;stoerung.forEach(x=>console.log('  ✗',x))}
  console.log(fehler?`  ${fehler} FEHLER`:'  ✓ Online tut, was es soll.');
  await b.close();server.kill('SIGTERM');
  process.exit(fehler?1:0);
})().catch(e=>{console.error('ABBRUCH',e);process.exit(1)});
