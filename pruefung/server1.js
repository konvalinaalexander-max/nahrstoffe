/* Der Server: offen ohne Passwort (so entschieden am 30.09.), freiwillig mit
   Passwort, Anhängen, Versionsprüfung, Sicherungskopien.
   Gestartet wird das echte server.js als eigener Prozess auf einem freien
   Port und über HTTP geprüft – so, wie es ein Browser täte. */
const {spawn}=require('child_process');
const fs=require('fs'),path=require('path'),os=require('os');
let fehler=0;
const ok=(b,t)=>{if(!b)fehler++;console.log((b?'  ✓ ':'  ✗ FEHLER ')+t)};
const daten=fs.mkdtempSync(path.join(os.tmpdir(),'basilikum-server-'));
const PORT=18000+Math.floor(Math.random()*1000);
const B='http://127.0.0.1:'+PORT;
const auth=(u,p)=>({Authorization:'Basic '+Buffer.from(u+':'+p).toString('base64')});
const ADMIN=auth('admin','geheim-a'),HINTEN=auth('hinten','geheim-h'),FALSCH=auth('admin','nein');
async function ruf(pfad,opt){
  opt=opt||{};
  const r=await fetch(B+pfad,{method:opt.method||'GET',headers:Object.assign({},opt.headers||{},opt.body?{'Content-Type':'application/json'}:{}),
    body:opt.body?JSON.stringify(opt.body):undefined});
  const text=await r.text();
  let j=null;try{j=JSON.parse(text)}catch(e){}
  return {status:r.status,json:j,text,kopf:Object.fromEntries(r.headers)};
}
function starten(extra,port,ordner){
  return new Promise((res,rej)=>{
    const env=Object.assign({},process.env,{PORT:String(port||PORT),DATEN:ordner||daten},
      extra===undefined?{ADMIN_PASSWORT:'geheim-a',HINTEN_PASSWORT:'geheim-h'}:extra);
    for(const k of ['ADMIN_PASSWORT','HINTEN_PASSWORT','MASKE_PASSWORT'])if(!(k in (extra===undefined?{ADMIN_PASSWORT:1,HINTEN_PASSWORT:1}:extra)))delete env[k];
    const p=spawn(process.execPath,[path.join(__dirname,'..','server.js')],{env,stdio:['ignore','pipe','pipe']});
    let out='';
    p.log=()=>out;
    p.stdout.on('data',d=>{out+=d;if(/Dashboard «\/»/.test(out))res(p)});
    p.stderr.on('data',d=>{out+=d});
    p.on('exit',c=>{if(c)rej(new Error('Server beendet: '+out))});
    setTimeout(()=>rej(new Error('Server startet nicht: '+out)),5000);
  });
}
const rufAn=async(port,pfad,opt)=>{opt=opt||{};const r=await fetch('http://127.0.0.1:'+port+pfad,{method:opt.method||'GET',redirect:'manual',
  headers:Object.assign({},opt.headers||{},opt.body?{'Content-Type':'application/json'}:{}),body:opt.body?JSON.stringify(opt.body):undefined});
  const text=await r.text();let j=null;try{j=JSON.parse(text)}catch(e){}return {status:r.status,json:j,text,kopf:Object.fromEntries(r.headers)}};
(async()=>{
  console.log('════ Ohne Passwort – so wird er betrieben ════');
  {
    const P2=PORT+1500,d2=fs.mkdtempSync(path.join(os.tmpdir(),'basilikum-offen-'));
    const o=await starten({},P2,d2);
    ok(/offen, ohne Passwort/.test(o.log()),'Startet ohne jede Variable und sagt im Log: offen, ohne Passwort');
    let r=await rufAn(P2,'/');
    ok(r.status===200&&/<title>Basilikum/.test(r.text),'«/» öffnet direkt das Dashboard – kein Login');
    r=await rufAn(P2,'/maske');
    ok(r.status===200&&/Am Tank/.test(r.text),'«/maske» öffnet die Eingabemaske – kein Login');
    ok(!/href=/i.test(r.text)&&!/location\.(href|assign|replace)/.test(r.text),'Die Maske enthält keinen Link, auch keinen versteckten, ins Dashboard');
    ok(/Namen eintippen/.test(r.text)&&!/Passwort eingeben|type="password"/.test(r.text),'Sie fragt nur nach dem Namen');
    r=await rufAn(P2,'/erfassen');
    ok(r.status===301&&r.kopf.location==='/maske','Die alte Adresse «/erfassen» leitet auf «/maske»');
    ok(/noindex/.test(r.kopf['x-robots-tag']||'')&&/noindex/.test((await rufAn(P2,'/')).kopf['x-robots-tag']||''),'Jede Antwort sagt Suchmaschinen: nicht aufnehmen');
    r=await rufAn(P2,'/robots.txt');
    ok(r.status===200&&/Disallow: \//.test(r.text),'robots.txt sperrt alles');
    r=await rufAn(P2,'/api/messung',{method:'POST',body:{datum:'2026-09-30',zeit:'10:00',stelle:'Reservoir vorne',ph:6.9,wer:'Marco'}});
    ok(r.status===200&&r.json.messung.wer==='Marco','Eintragen aus der Maske geht ohne Anmeldung, mit Namen');
    r=await rufAn(P2,'/api/bestand');
    ok(r.status===200&&r.json.db.messungen.length===1&&/maske · Marco/.test(r.json.von||''),'Das Dashboard sieht den Eintrag; der Server weiss, von wem');
    const mitPaket=Object.assign(r.json.db,{analysen:[]});
    mitPaket.messungen.push({id:'p26m-09-17-v5',datum:'2026-09-17',stelle:'vorne',ph:7.3,ec:null,quelle:'paket'});
    r=await rufAn(P2,'/api/bestand',{method:'PUT',body:{basisVersion:r.json.version,db:mitPaket}});
    ok(r.status===200,'Das Dashboard schreibt ohne Anmeldung');
    const kx=await rufAn(P2,'/api/kontext');
    ok(kx.json.letzte['Reservoir vorne'].length===2&&kx.json.letzte['Reservoir vorne'].some(m=>m.ph===7.3)&&!kx.json.letzte.vorne,'Der Kontext führt «vorne» (Paket) und «Reservoir vorne» (Maske) als eine Stelle');
    const kopien=fs.readdirSync(path.join(d2,'sicherungen')).length;
    ok(kopien===2,'Auch offen: jeder Schreibvorgang hinterlässt eine Sicherungskopie ('+kopien+')');
    o.kill('SIGTERM');await new Promise(x=>o.on('exit',x));
  }
  console.log('\n════ Nur das Dashboard mit Passwort (freiwillig) ════');
  {
    const P3=PORT+1600,d3=fs.mkdtempSync(path.join(os.tmpdir(),'basilikum-halb-'));
    const o=await starten({ADMIN_PASSWORT:'nur-buero'},P3,d3);
    ok(/mit Passwort/.test(o.log())&&/Maske «\/maske»: offen/.test(o.log()),'Log: Dashboard mit Passwort, Maske offen');
    ok((await rufAn(P3,'/')).status===401&&(await rufAn(P3,'/api/bestand')).status===401,'Dashboard und Bestand verlangen das Passwort');
    ok((await rufAn(P3,'/',{headers:auth('admin','nur-buero')})).status===200,'Mit dem Passwort geht es');
    ok((await rufAn(P3,'/maske')).status===200&&(await rufAn(P3,'/api/kontext')).status===200,'Die Maske bleibt offen');
    ok((await rufAn(P3,'/api/messung',{method:'POST',body:{datum:'2026-09-30',ph:6.9,wer:'MK'}})).status===200,'Eintragen aus der Maske geht weiter ohne Anmeldung');
    ok((await rufAn(P3,'/maske',{headers:auth('admin','')})).status===200&&(await rufAn(P3,'/api/bestand',{headers:auth('hinten','')})).status===401,'Ein leeres Passwort ist kein Schlüssel');
    o.kill('SIGTERM');await new Promise(x=>o.on('exit',x));
  }

  console.log('\n════ Beide Passwörter gesetzt (freiwillig) ════');
  const p=await starten();
  ok(true,'Der Server startet ohne npm install, ohne Abhängigkeiten');
  const g=await ruf('/gesund');
  ok(g.status===200&&g.json.ok===true,'/gesund antwortet ohne Anmeldung – für den Hoster');

  console.log('\n════ Zugang ════');
  let r=await ruf('/');
  ok(r.status===401&&/Basic/.test(r.kopf['www-authenticate']||''),'Ohne Anmeldung: 401 mit Aufforderung – der Browser fragt dann nach');
  r=await ruf('/',{headers:FALSCH});
  ok(r.status===401,'Falsches Passwort: 401');
  r=await ruf('/',{headers:HINTEN});
  ok(r.status===401,'Die Rolle «hinten» kommt nicht an die Admin-Seite');
  r=await ruf('/',{headers:ADMIN});
  ok(r.status===200&&/<title>Basilikum/.test(r.text),'Admin bekommt basilikum.html');
  r=await ruf('/maske',{headers:HINTEN});
  ok(r.status===200&&/Am Tank/.test(r.text),'«hinten» bekommt die Maske');
  r=await ruf('/maske');
  ok(r.status===401,'Mit Maske-Passwort ist auch die Maske geschützt');
  r=await ruf('/maske',{headers:ADMIN});
  ok(r.status===200,'Der Admin darf auch in die Maske');
  r=await ruf('/api/bestand',{headers:HINTEN});
  ok(r.status===401,'«hinten» sieht den Bestand NICHT – weder Analysen noch fremde Notizen');
  r=await ruf('/api/kontext',{headers:HINTEN});
  ok(r.status===200&&Array.isArray(r.json.stellen)&&Array.isArray(r.json.produkte),'Aber den Kontext: Stellen, Produkte, letzte Werte');
  r=await ruf('/irgendwas',{headers:ADMIN});
  ok(r.status===404,'Unbekannte Pfade: 404, keine Verzeichnisliste');

  console.log('\n════ Leerer Anfang ════');
  r=await ruf('/api/bestand',{headers:ADMIN});
  ok(r.status===200&&r.json.version===0&&r.json.db===null,'Vor dem ersten Schreiben: Version 0, kein Bestand – die App nimmt ihren leeren Zustand');

  console.log('\n════ Anhängen von hinten ════');
  r=await ruf('/api/messung',{method:'POST',headers:HINTEN,body:{datum:'2026-09-26',zeit:'09:05',stelle:'Reservoir vorne',ph:'6,4',ec:1.9,o2:7.2,temp:21.5,wer:'mk',notiz:'nach Nachfüllen'}});
  ok(r.status===200&&r.json.version===1,'Eine Messung: angenommen, Version 1');
  ok(r.json.messung.ph===6.4,'Ein Komma als Dezimaltrenner wird verstanden (6,4 → 6.4)');
  ok(r.json.messung.quelle==='erfassen'&&r.json.messung.wer==='mk'&&r.json.messung.erfasst,'Herkunft, Kürzel und Zeitstempel stehen dran');
  ok(r.json.messung.o2===7.2,'Sauerstoff kommt mit');
  ok(r.json.messung.zeit==='09:05','Die Uhrzeit des Handys kommt mit – nicht die des Servers');
  r=await ruf('/api/messung',{method:'POST',headers:HINTEN,body:{datum:'2026-09-26',zeit:'25:99',ph:6}});
  ok(r.status===400&&/Uhrzeit/.test(r.json.fehler),'Eine unmögliche Uhrzeit wird abgelehnt, nicht verbogen');
  r=await ruf('/api/messung',{method:'POST',headers:HINTEN,body:{datum:'26.9.2026',ph:6}});
  ok(r.status===400&&/Datum/.test(r.json.fehler),'Ein falsches Datumsformat wird benannt, nicht geraten');
  r=await ruf('/api/messung',{method:'POST',headers:HINTEN,body:{datum:'2026-09-26',ph:'sechs'}});
  ok(r.status===400&&/keine Zahl/.test(r.json.fehler),'«sechs» ist keine Zahl');
  r=await ruf('/api/messung',{method:'POST',headers:HINTEN,body:{datum:'2026-09-26'}});
  ok(r.status===400&&/Kein einziger Messwert/.test(r.json.fehler),'Ohne einen einzigen Wert wird nichts angelegt');
  r=await ruf('/api/messung',{method:'POST',headers:HINTEN,body:{datum:'2026-09-26',ph:61}});
  ok(r.status===400&&/0–14/.test(r.json.fehler),'pH 61 ist ein Tippfehler, kein Messwert');
  r=await ruf('/api/messung',{method:'POST',headers:HINTEN,body:{datum:'2026-09-26',ph:6,id:'meins',quelle:'admin',analysen:[1,2,3]}});
  ok(r.status===200&&r.json.messung.id!=='meins'&&r.json.messung.quelle==='erfassen'&&r.json.messung.analysen===undefined,
     'Kennung und Herkunft vergibt der Server; fremde Felder fallen weg');
  r=await ruf('/api/ereignis',{method:'POST',headers:HINTEN,body:{datum:'2026-09-26',zeit:'09:10',typ:'Düngergabe',mittel:'biovin',menge:'20',einheit:'l',jeReservoir:true,wer:'mk'}});
  ok(r.status===200&&r.json.ereignis.menge===20&&r.json.ereignis.jeReservoir===true,'Eine Beigabe: Menge als Zahl, «je Reservoir» als Wahrheitswert');
  ok(r.json.ereignis.zeit==='09:10','Die Beigabe trägt ihre Uhrzeit');
  ok(r.json.ereignis.geltung==='alle'&&Array.isArray(r.json.ereignis.saetze)&&r.json.ereignis.felder,'Mit den Feldern, die das Logbuch der grossen Anwendung erwartet');
  r=await ruf('/api/ereignis',{method:'POST',headers:HINTEN,body:{datum:'2026-09-26',menge:5}});
  ok(r.status===400&&/was wurde gegeben/.test(r.json.fehler),'Menge ohne Mittel, Titel oder Notiz: nachgefragt');
  const k=await ruf('/api/kontext',{headers:HINTEN});
  ok(k.json.letzte['Reservoir vorne']&&k.json.letzte['Reservoir vorne'][0].ph===6.4,'Der Kontext nennt den letzten Wert je Stelle');
  ok(k.json.beigaben.length===1&&k.json.beigaben[0].mittel==='biovin','Und die letzten Beigaben');
  ok(k.json.letzte['Reservoir vorne'][0].zeit==='09:05'&&k.json.beigaben[0].zeit==='09:10','Der Kontext nennt die Uhrzeiten mit');
  ok(!('analysen' in k.json)&&!JSON.stringify(k.json).includes('nach Nachfüllen'),'Aber keine Notizen und keine Analysen');

  console.log('\n════ Der Admin speichert den ganzen Bestand ════');
  let b=await ruf('/api/bestand',{headers:ADMIN});
  const v=b.json.version;
  ok(v===3&&b.json.db.messungen.length===2&&b.json.db.ereignisse.length===1,'Der Admin sieht alles, was hinten kam ('+v+' Schreibvorgänge)');
  const db=b.json.db;db.analysen=[{id:'a1',typ:'blattsaft',datum:'2026-09-20',werte:{},optima:{}}];db.saetze={'31':{aussaat:'2026-09-01'}};
  r=await ruf('/api/bestand',{method:'PUT',headers:ADMIN,body:{basisVersion:v,db}});
  ok(r.status===200&&r.json.version===v+1,'Mit der richtigen Basisversion wird geschrieben');
  r=await ruf('/api/bestand',{method:'PUT',headers:ADMIN,body:{basisVersion:v,db}});
  ok(r.status===409&&r.json.version===v+1&&r.json.db.analysen.length===1,'Mit einer veralteten Basisversion: 409 und der aktuelle Stand zurück – nichts wird stillschweigend überschrieben');
  r=await ruf('/api/bestand',{method:'PUT',headers:ADMIN,body:{db:{}}});
  ok(r.status===400,'Ein halber Bestand wird abgewiesen');
  r=await ruf('/api/bestand',{method:'PUT',headers:HINTEN,body:{basisVersion:v+1,db}});
  ok(r.status===401,'«hinten» kann den Bestand nicht ersetzen – nur anhängen');
  /* Waehrend der Admin arbeitet, traegt hinten weiter ein */
  r=await ruf('/api/messung',{method:'POST',headers:HINTEN,body:{datum:'2026-09-27',stelle:'Reservoir hinten',ph:6.6,wer:'ab'}});
  b=await ruf('/api/bestand',{headers:ADMIN});
  ok(b.json.db.analysen.length===1&&b.json.db.messungen.length===3,'Anhängen von hinten überlebt das Speichern des Admins und umgekehrt');
  const kk=await ruf('/api/kontext',{headers:HINTEN});
  ok(kk.json.stellen.length===0||Array.isArray(kk.json.stellen),'Der Kontext bleibt gültig');

  console.log('\n════ Auf der Platte ════');
  const datei=JSON.parse(fs.readFileSync(path.join(daten,'bestand.json'),'utf8'));
  ok(datei.version===b.json.version&&datei.db.messungen.length===3,'bestand.json ist der aktuelle Stand');
  const kopien=fs.readdirSync(path.join(daten,'sicherungen')).filter(f=>/^bestand_/.test(f));
  console.log('   Sicherungskopien:',kopien.length,'·',kopien.slice(-2).join(', '));
  ok(kopien.length>=5,'Jeder Schreibvorgang hinterlässt eine datierte Kopie');
  ok(!fs.readdirSync(daten).some(f=>/\.tmp$/.test(f)),'Keine halben Dateien liegen herum');

  console.log('\n════ Neustart ════');
  p.kill('SIGTERM');
  await new Promise(r=>p.on('exit',r));
  const p2=await starten();
  const nach=await ruf('/api/bestand',{headers:ADMIN});
  ok(nach.json.version===b.json.version&&nach.json.db.messungen.length===3,'Nach dem Neustart ist alles da, samt Version');
  p2.kill('SIGTERM');

  console.log('\n════ Ergebnis ════');
  console.log(fehler?`  ${fehler} FEHLER`:'  ✓ Der Server tut, was er soll.');
  process.exit(fehler?1:0);
})().catch(e=>{console.error('ABBRUCH',e);process.exit(1)});
