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
    const p=spawn(process.execPath,[path.join(__dirname,'..','server.js')],{env:(()=>{const e=Object.assign({},process.env,{PORT:String(PORT),DATEN:daten});
      for(const k of ['ADMIN_PASSWORT','HINTEN_PASSWORT','MASKE_PASSWORT'])delete e[k];return e})(),stdio:['ignore','pipe','pipe']});
    let out='';p.stdout.on('data',d=>{out+=d;if(/läuft auf Port/.test(out))res(p)});p.stderr.on('data',d=>out+=d);
    setTimeout(()=>rej(new Error('Server startet nicht: '+out)),5000);
  });
}
const warten=ms=>new Promise(r=>setTimeout(r,ms));

(async()=>{
  const server=await starten();
  const b=await chromium.launch(process.env.CHROME?{executablePath:process.env.CHROME,args:['--no-sandbox']}:{});
  const ctx=await b.newContext({viewport:{width:1280,height:1000}});   /* ohne Passwort – so wird er betrieben */
  const p=await ctx.newPage();
  const stoerung=[];
  p.on('pageerror',e=>stoerung.push('pageerror: '+e.message));
  p.on('console',m=>{const t=m.text();if(m.type()==='error'&&!/Failed to load resource|net::ERR_/.test(t))stoerung.push('console: '+t)});

  /* «＋ Massnahme eintragen» im Reiter Blattsaft & Giesswasser */
  const massnahme=async(was,name,von,dauer)=>{
    await p.click('#view button:text-is("＋ Massnahme eintragen")');await p.waitForTimeout(250);
    await p.selectOption('#mnWas',was);
    if(name)await p.fill('#mnName',name);
    await p.fill('#mnVon',von);
    if(dauer&&await p.$eval('#mnDauerBox',e=>!e.hidden))await p.selectOption('#mnDauer',dauer);
    await p.click('#dlgFoot button:text-is("Eintragen")');await p.waitForTimeout(300);
  };

  console.log('════ Leerer Server ════');
  await p.goto(B+'/');await p.waitForTimeout(1500);
  const stand0=await p.$eval('#stand',e=>e.textContent);
  console.log('   Stand:',stand0);
  ok(/online/.test(stand0),'Die Seite merkt, dass sie vom Server kommt');
  ok(await p.$eval('#erfassenLink',e=>!e.hidden&&e.getAttribute('href')==='/maske'&&e.textContent.trim()==='Mobile App ↗'),'Der Link «Mobile App ↗» erscheint («/maske»)');
  ok(await p.$eval('#knopfQr',e=>!e.hidden),'Der QR-Code zur Mobile App steht oben');
  ok(!/Anmeldung/.test(await p.$eval('body',e=>e.textContent))&&/Basilikum/.test(await p.title()),'Direkt das Dashboard – kein Login');
  ok(await p.$eval('#knopfSichern',e=>e.hidden)&&await p.$eval('#knopfOeffnen',e=>e.hidden),
     'Keine Knöpfe zum Sichern oder Öffnen – online ist es eine Webseite');
  const toasts0=await p.$$eval('.toast',es=>es.map(e=>e.textContent));
  ok(toasts0.some(t=>/Server ist noch leer/.test(t)),'Und sagt, dass der Bestand auf dem Server noch leer ist');

  console.log('\n════ Sicherung einspielen, laufend sichern ════');
  await p.click('#nav button:text-is("Einstellungen")');await p.waitForTimeout(400);
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
  await p.click('#nav button:text-is("Blattsaft & Giesswasser")');await p.waitForTimeout(500);
  await massnahme('neu','Schattierung','2026-09-20','laeuft');
  await p.waitForTimeout(2500);
  srv=await ruf('/api/bestand',{headers:ADMIN});
  ok(srv.json.version===v1+1&&srv.json.db.beigabeZeiten.some(z=>z.name==='Schattierung'&&z.von==='2026-09-20'&&z.bis===null),'«＋ Massnahme»: «Schattierung» ist 2,5 s später auf dem Server – Version '+srv.json.version);
  ok(await p.$eval('#cKb .kmZ[data-k="n|Schattierung"]',z=>z.querySelector('.kmTitel').textContent==='Schattierung'&&[...z.querySelectorAll('g.spb text')].some(t=>t.textContent==='seit 20.09.')),'… und steht als eigene Zeile im Kulturmanagement');

  console.log('\n════ Gleichzeitig: hinten trägt ein, während hier etwas offen ist ════');
  /* Hier eine Aenderung, die noch nicht hochgegangen ist … */
  await p.evaluate(()=>{ONLINE.laeuft=true});
  await massnahme('t|Umpumpen',null,'2026-09-24');
  /* … und derweil kommt vom Handy eine Messung (Version springt) */
  const m=await ruf('/api/messung',{method:'POST',headers:HINTEN,body:{datum:'2026-09-26',zeit:'07:30',stelle:'Reservoir vorne',ph:6.2,ec:1.7,o2:7.1,temp:20,wer:'MK'}});
  ok(m.status===200,'Die Messung vom Handy ist angenommen (Version '+m.json.version+')');
  await p.evaluate(()=>{ONLINE.laeuft=false;sichernOnline()});await p.waitForTimeout(2000);
  srv=await ruf('/api/bestand',{headers:ADMIN});
  const hatMess=srv.json.db.messungen.some(x=>x.wer==='MK'&&x.o2===7.1),hatUmp=srv.json.db.ereignisse.some(e=>e.typ==='Umpumpen'&&e.datum==='2026-09-24');
  ok(hatMess&&hatUmp,'Beides ist da: die Messung vom Handy UND das Umpumpen von hier – nichts überschrieben');
  const stand2=await p.$eval('#stand',e=>e.textContent);
  ok(/online · gesichert/.test(stand2),'Der Stand ist wieder «gesichert»: '+stand2);
  const dbSeite=await p.evaluate(()=>({m:db.messungen.filter(x=>x.wer==='MK').length,v:ONLINE.version}));
  ok(dbSeite.m===1&&dbSeite.v===srv.json.version,'Die Seite hat die fremde Messung übernommen und trägt die aktuelle Version');

  console.log('\n════ Auffrischen ohne eigene Änderung ════');
  await ruf('/api/messung',{method:'POST',headers:HINTEN,body:{datum:'2026-09-26',zeit:'07:40',stelle:'Reservoir hinten',ph:6.4,ec:1.8,wer:'AB'}});
  await ruf('/api/ereignis',{method:'POST',headers:HINTEN,body:{datum:'2026-09-26',zeit:'07:50',typ:'Säurezugabe',mittel:'schwefelsaeure25',menge:0.5,einheit:'l',stelle:'hinten',wer:'AB'}});
  await p.click('#nav button:text-is("pH, EC & O₂")');await p.waitForTimeout(400);
  /* die Abfrage laeuft alle 30 s – hier direkt anstossen */
  await p.evaluate(()=>onlineAbfragen());await p.waitForTimeout(800);
  await p.click('#tkListe summary');await p.waitForTimeout(200);
  const tk=await p.$eval('#view',e=>e.innerText);
  ok(/AB/.test(tk)&&/6.4/.test(tk),'Die Messung von «AB» steht ohne Neuladen in der Liste am Tank');
  const toasts=await p.$$eval('.toast',es=>es.map(e=>e.textContent));
  ok(toasts.some(t=>/Aufgefrischt/.test(t)),'Mit dem Hinweis, dass aufgefrischt wurde');
  const spuren=await p.$$eval('#cTank .tafelKopf h3',es=>es.map(e=>e.textContent).filter(t=>/^(pH|EC|Sauerstoff)$/.test(t)));
  console.log('   Grafiken:',spuren.join(' | '));
  ok(spuren.join('|')==='pH|EC|Sauerstoff','Drei Grafiken: pH, EC, Sauerstoff – jede mit eigener Achse');
  ok(!/Sättigung/.test(tk),'Keine Sättigungsgrenze, keine Deutung');
  await p.screenshot({path:shots+'/online-tank.png',fullPage:false});
  await p.click('#nav button:text-is("Einträge Mobile App")');await p.waitForTimeout(400);
  const me=await p.$eval('#view',e=>e.innerText);
  ok(/MK/.test(me)&&/AB/.test(me)&&/Säurezugabe/.test(me)&&/Schwefelsäure 25 % · 0.5 l/.test(me),'Unter «Einträge Mobile App»: beide Messungen und die Säure, mit Namen');
  await p.screenshot({path:shots+'/online-maske.png',fullPage:false});

  console.log('\n════ Kopie herunterladen ════');
  await p.click('#nav button:text-is("Einstellungen")');await p.waitForTimeout(400);
  const dl=p.waitForEvent('download');
  await p.click('#view button:text-is("Kopie herunterladen")');
  const d=await dl;const ziel=path.join(shots,d.suggestedFilename());await d.saveAs(ziel);
  const text=fs.readFileSync(ziel,'utf8');
  ok(/^<!doctype html>/.test(text)&&/"wer":"MK"/.test(text)&&/"name":"Schattierung"/.test(text),'Die Kopie ist die ganze Seite mit dem aktuellen Bestand – auch der Messung vom Handy und der Schattierung');
  ok(text.indexOf('id="erfassenLink" href="/maske" target="_blank" rel="noopener" hidden')>0,'Und trägt das unberührte Gerüst: vom Ordner geöffnet läuft sie im Datei-Modus');

  console.log('\n════ Persönliche Ansicht ════');
  await p.click('#nav button:text-is("Blattsaft & Giesswasser")');await p.waitForTimeout(500);
  await p.click('#cKb .tafel:first-of-type .chip:text-is("Magnesium")');await p.waitForTimeout(400);
  await p.check('#cKb [data-aend="linienUm"][data-ziel="wasser"]');await p.waitForTimeout(300);
  await p.click('#nav button:text-is("Einstellungen")');await p.waitForTimeout(300);
  await p.reload();await p.waitForTimeout(1500);
  ok((await p.$eval('#nav button.active',e=>e.textContent))==='Blattsaft & Giesswasser','Nach dem Neuladen beginnt die Seite immer bei Blattsaft & Giesswasser – auch wenn zuletzt ein anderer Reiter offen war');
  ok(await p.$eval('#cKb .tafel:first-of-type .chip:text-is("Magnesium")',e=>e.classList.contains('on')),'Die Auswahl bleibt – persönliche Ansicht auf diesem Gerät');
  ok(await p.$eval('#cKb [data-aend="linienUm"][data-ziel="wasser"]',e=>e.checked)&&!(await p.$eval('#cKb [data-aend="linienUm"][data-ziel="blatt"]',e=>e.checked)),'«Punkte verbinden» bleibt je Grafik gemerkt');

  console.log('\n════ Ältere Daten vom Server: der Hinweis nur einmal ════');
  /* Ein Stand im alten Format liegt auf dem Server – mit einem Eintrag, den
     der Umbau entfernt. */
  srv=await ruf('/api/bestand',{headers:ADMIN});
  const alt=srv.json.db;alt.schema=11;
  alt.ereignisse.push({id:'alt-ps',datum:'2026-08-01',zeit:null,typ:'Säurezugabe',mittel:'phosphorsaeure',menge:1,einheit:'l',wer:null});
  const put=await ruf('/api/bestand',{method:'PUT',headers:ADMIN,body:{basisVersion:srv.json.version,db:alt}});
  ok(put.status===200,'Der alte Stand liegt auf dem Server (Version '+put.json.version+')');
  await p.reload();await p.waitForTimeout(1800);
  ok(await p.$eval('#dlg',d=>d.open)&&await p.$eval('#dlgTitel',e=>e.textContent)==='Ältere Daten übernommen'&&/1 Einträge zu einem Mittel/.test(await p.$eval('#dlgBody',e=>e.innerText)),'Beim ersten Öffnen: «Ältere Daten übernommen» mit dem, was angepasst wurde');
  await p.waitForTimeout(2500);
  srv=await ruf('/api/bestand',{headers:ADMIN});
  ok(srv.json.db.schema===12&&!srv.json.db.ereignisse.some(e=>e.id==='alt-ps'),'Der umgebaute Stand geht gleich zurück auf den Server (Schema '+srv.json.db.schema+')');
  await p.click('#dlgFoot button:text-is("Verstanden")');await p.waitForTimeout(300);
  ok(!(await p.$eval('#dlg',d=>d.open)),'«Verstanden» schliesst ihn');
  await p.reload();await p.waitForTimeout(1800);
  ok(!(await p.$eval('#dlg',d=>d.open)),'Beim nächsten Öffnen kommt er nicht wieder');
  /* Derselbe Hinweis auf einem anderen Gerät, das ihn schon bestätigt hat:
     auch wenn der Server noch einmal den alten Stand hätte. */
  srv=await ruf('/api/bestand',{headers:ADMIN});
  const alt2=srv.json.db;alt2.schema=11;
  alt2.ereignisse.push({id:'alt-ps',datum:'2026-08-01',zeit:null,typ:'Säurezugabe',mittel:'phosphorsaeure',menge:1,einheit:'l',wer:null});
  await ruf('/api/bestand',{method:'PUT',headers:ADMIN,body:{basisVersion:srv.json.version,db:alt2}});
  await p.reload();await p.waitForTimeout(1800);
  ok(!(await p.$eval('#dlg',d=>d.open)),'Ein bereits bestätigter Hinweis erscheint auf diesem Gerät nicht noch einmal');
  await p.waitForTimeout(2500);

  console.log('\n════ Server weg ════');
  await p.route('**/api/**',r=>r.abort('connectionfailed'));
  await massnahme('neu','Klima umgestellt','2026-09-25','laeuft');
  await p.waitForTimeout(2500);
  const standF=await p.$eval('#stand',e=>e.textContent);
  console.log('   Stand:',standF);
  ok(/nicht erreichbar/.test(standF),'Ohne Server: «nicht erreichbar – Änderungen warten», nichts geht verloren');
  await p.unroute('**/api/**');
  await p.evaluate(()=>sichernOnline());await p.waitForTimeout(1500);
  srv=await ruf('/api/bestand',{headers:ADMIN});
  ok(srv.json.db.beigabeZeiten.some(z=>z.name==='Klima umgestellt'),'Sobald der Server da ist, geht es raus – von selbst beim nächsten Versuch');
  ok(/online · gesichert/.test(await p.$eval('#stand',e=>e.textContent)),'Und der Stand ist wieder grün');

  console.log('\n════ Ergebnis ════');
  if(stoerung.length){fehler+=stoerung.length;stoerung.forEach(x=>console.log('  ✗',x))}
  console.log(fehler?`  ${fehler} FEHLER`:'  ✓ Online tut, was es soll.');
  await b.close();server.kill('SIGTERM');
  process.exit(fehler?1:0);
})().catch(e=>{console.error('ABBRUCH',e);process.exit(1)});
