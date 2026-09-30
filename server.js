#!/usr/bin/env node
/* ══════════════════════════════════════════════════════════════════════════
   Basilikum · Server

   Eine Datei, reines Node, keine Abhängigkeiten – auf dem Host heisst die
   Installation «Node starten». Er tut vier Dinge:

     1. liefert die zwei Seiten aus: unter «/» das Dashboard
        (basilikum.html), unter «/maske» die Eingabemaske fürs Handy
        hinten am Tank (erfassen.html) – die Maske verlinkt nirgends hin,
     2. hält den Bestand als eine JSON-Datei mit Versionsnummer,
     3. schreibt bei jeder Änderung eine datierte Sicherungskopie,
     4. ist ohne Passwort offen – so entschieden am 30.09.2026. Wer später
        doch eines will, setzt es als Umgebungsvariable, ohne Codeänderung.

   Umgebungsvariablen (alle freiwillig):
     PORT              Standard 8080
     DATEN             Ordner für Bestand und Sicherungen, Standard ./daten
     ADMIN_PASSWORT    schützt Dashboard und ganzen Bestand (Benutzer «admin»)
     MASKE_PASSWORT    schützt die Maske (Benutzer «hinten»); der alte Name
                       HINTEN_PASSWORT gilt ebenso

   Start:  node server.js
   ══════════════════════════════════════════════════════════════════════════ */
'use strict';
const http=require('http'),fs=require('fs'),path=require('path'),crypto=require('crypto');

const PORT=+(process.env.PORT||8080);
const DATEN=path.resolve(process.env.DATEN||path.join(__dirname,'daten'));
const SICHERUNGEN=path.join(DATEN,'sicherungen');
const BESTAND=path.join(DATEN,'bestand.json');
const SEITEN={admin:path.join(__dirname,'basilikum.html'),hinten:path.join(__dirname,'erfassen.html')};
const KOERPER_MAX=60*1024*1024;            /* Fotos liegen als Data-URL im Bestand */
const PASS={admin:process.env.ADMIN_PASSWORT||'',hinten:process.env.MASKE_PASSWORT||process.env.HINTEN_PASSWORT||''};

if(PASS.admin&&PASS.hinten&&PASS.admin===PASS.hinten){
  console.error('Die beiden Passwörter dürfen nicht gleich sein – sonst gibt es nur eine Rolle.');
  process.exit(1);
}
fs.mkdirSync(SICHERUNGEN,{recursive:true});

/* ── Bestand ──────────────────────────────────────────────────────────────
   Eine Datei: {version, geaendert, von, db}. db ist null, solange nie etwas
   geschrieben wurde – die Admin-Seite nimmt dann ihren leeren Ausgangszustand.
   Gehalten wird alles im Speicher; die Datei ist die Wahrheit beim Neustart. */
let bestand={version:0,geaendert:null,von:null,db:null};
try{
  if(fs.existsSync(BESTAND)){
    bestand=JSON.parse(fs.readFileSync(BESTAND,'utf8'));
    if(typeof bestand.version!=='number')bestand.version=0;
  }
}catch(e){
  console.error('Der Bestand liess sich nicht lesen: '+e.message+'\nDie Datei wurde NICHT angerührt. Bitte prüfen: '+BESTAND);
  process.exit(1);
}

/* Schreiben ist atomar (erst Nebendatei, dann Umbenennen), damit ein Absturz
   mitten im Schreiben nie eine halbe Datei hinterlässt. Jeder Stand bekommt
   eine datierte Kopie; alte Kopien werden ausgedünnt, aber nie die letzten 30
   und nie die jeweils erste eines Tages der letzten 90 Tage. */
let schreibKette=Promise.resolve();
function speichern(von){
  bestand.version++;
  bestand.geaendert=new Date().toISOString();
  bestand.von=von;
  const text=JSON.stringify(bestand);
  const version=bestand.version;
  schreibKette=schreibKette.then(()=>new Promise((ok,nein)=>{
    const tmp=BESTAND+'.'+process.pid+'.tmp';
    fs.writeFile(tmp,text,err=>{
      if(err)return nein(err);
      fs.rename(tmp,BESTAND,err2=>{
        if(err2)return nein(err2);
        const stempel=bestand.geaendert.replace(/[:T]/g,'-').slice(0,16);
        fs.writeFile(path.join(SICHERUNGEN,`bestand_${stempel}_v${version}.json`),text,()=>{ausduennen();ok()});
      });
    });
  })).catch(err=>console.error('Schreiben fehlgeschlagen:',err.message));
  return schreibKette;
}
function ausduennen(){
  let dateien;
  try{dateien=fs.readdirSync(SICHERUNGEN).filter(f=>/^bestand_.*\.json$/.test(f)).sort()}catch(e){return}
  const behalten=new Set(dateien.slice(-30));
  const proTag=new Map();
  const grenze=Date.now()-90*864e5;
  for(const f of dateien){
    const tag=f.slice(8,18);                     /* bestand_JJJJ-MM-TT */
    if(+new Date(tag)<grenze)continue;
    if(!proTag.has(tag))proTag.set(tag,f);       /* die erste des Tages */
  }
  for(const f of proTag.values())behalten.add(f);
  for(const f of dateien)if(!behalten.has(f)){try{fs.unlinkSync(path.join(SICHERUNGEN,f))}catch(e){}}
}

/* ── Zugang ──────────────────────────────────────────────────────────────
   Ohne Passwort ist ein Bereich offen: wer die Adresse kennt, kommt hinein.
   Ist ein Passwort gesetzt, gilt HTTP Basic: der Browser fragt einmal und
   merkt sich die Antwort. Der Vergleich läuft in konstanter Zeit, und wer
   zu oft danebenliegt, wartet. */
const fehlversuche=new Map();
function gleich(a,b){
  const x=Buffer.from(String(a)),y=Buffer.from(String(b));
  if(x.length!==y.length){crypto.timingSafeEqual(x,x);return false}
  return crypto.timingSafeEqual(x,y);
}
function rolleVon(req){
  /* Ohne jedes Passwort gibt es nichts zu prüfen – und nichts zu sperren:
     ein Browser, der noch alte Zugangsdaten mitschickt, darf nicht als
     Fehlversuch zählen. */
  if(!PASS.admin&&!PASS.hinten)return null;
  const ip=req.socket.remoteAddress||'?';
  const sperre=fehlversuche.get(ip);
  if(sperre&&sperre.bis>Date.now())return 'gesperrt';
  const h=req.headers.authorization||'';
  if(!/^Basic /i.test(h))return null;
  let nutzer='',pw='';
  try{const t=Buffer.from(h.slice(6),'base64').toString('utf8');const i=t.indexOf(':');nutzer=t.slice(0,i);pw=t.slice(i+1)}catch(e){return null}
  /* Nur Rollen mit gesetztem Passwort – ein leeres Passwort ist kein Schlüssel. */
  for(const r of ['admin','hinten'])if(PASS[r]&&gleich(nutzer,r)&&gleich(pw,PASS[r])){fehlversuche.delete(ip);return r}
  const s=fehlversuche.get(ip)||{n:0,bis:0};
  s.n++;if(s.n>=20){s.bis=Date.now()+10*60*1000;s.n=0}
  fehlversuche.set(ip,s);
  return null;
}
/* Bereich «admin»: Dashboard und ganzer Bestand. Bereich «maske»: die
   Handy-Seite und das Wenige, das sie braucht. Ein Bereich ohne Passwort
   ist offen; das Admin-Passwort öffnet immer auch die Maske. */
const darf=(rolle,bereich)=>bereich==='admin'
  ? (!PASS.admin||rolle==='admin')
  : (!PASS.hinten||rolle==='hinten'||rolle==='admin');

/* ── Antworten ─────────────────────────────────────────────────────────── */
/* Keine Suchmaschine soll die Seiten aufnehmen – ohne Passwort ist die
   Adresse der einzige Schutz. */
const NOINDEX={'X-Robots-Tag':'noindex, nofollow, noarchive'};
function json(res,status,obj){
  const t=JSON.stringify(obj);
  res.writeHead(status,Object.assign({'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store',
    'X-Content-Type-Options':'nosniff'},NOINDEX));
  res.end(t);
}
function verlangen(res){
  res.writeHead(401,{'WWW-Authenticate':'Basic realm="Basilikum", charset="UTF-8"','Content-Type':'text/plain; charset=utf-8'});
  res.end('Anmeldung nötig.');
}
function seite(res,datei){
  fs.readFile(datei,(err,buf)=>{
    if(err){res.writeHead(404,{'Content-Type':'text/plain; charset=utf-8'});return res.end('Seite fehlt: '+path.basename(datei))}
    res.writeHead(200,Object.assign({'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-cache',
      'X-Content-Type-Options':'nosniff','Referrer-Policy':'same-origin'},NOINDEX));
    res.end(buf);
  });
}
function koerper(req){
  return new Promise((ok,nein)=>{
    const teile=[];let n=0;
    req.on('data',c=>{n+=c.length;if(n>KOERPER_MAX){nein(new Error('zu gross'));req.destroy()}else teile.push(c)});
    req.on('end',()=>{try{ok(teile.length?JSON.parse(Buffer.concat(teile).toString('utf8')):null)}catch(e){nein(new Error('kein gültiges JSON'))}});
    req.on('error',nein);
  });
}

/* ── Prüfen, was hinten hereinkommt ─────────────────────────────────────
   Die Handy-Seite darf anhängen, nicht ersetzen. Jeder Eintrag wird auf die
   erlaubten Felder beschnitten; Zahlen müssen Zahlen sein, Texte kurz. */
const uid=()=>Date.now().toString(36)+crypto.randomBytes(3).toString('hex');
const zahl=v=>(v===''||v==null)?null:(typeof v==='number'&&isFinite(v)?v:(isFinite(+String(v).replace(',','.'))?+String(v).replace(',','.'):undefined));
const text=(v,max)=>v==null?null:String(v).slice(0,max);
const datum=v=>/^\d{4}-\d{2}-\d{2}$/.test(String(v||''))&&!isNaN(+new Date(v))?String(v):undefined;
/* Uhrzeit «HH:MM» – die des Handys, nicht die des Servers (der läuft oft in
   UTC). Fehlt sie, bleibt sie leer; steht Unsinn da, wird abgelehnt. */
const uhr=v=>(v==null||v==='')?null:(/^([01]\d|2[0-3]):[0-5]\d$/.test(String(v))?String(v):undefined);

function pruefeMessung(m){
  if(!m||typeof m!=='object')return {fehler:'Kein Eintrag.'};
  const out={id:uid(),datum:datum(m.datum),zeit:uhr(m.zeit),stelle:text(m.stelle,60),
    ph:zahl(m.ph),ec:zahl(m.ec),ecFrisch:zahl(m.ecFrisch),temp:zahl(m.temp),o2:zahl(m.o2),o2sat:zahl(m.o2sat),
    notiz:text(m.notiz,500),wer:text(m.wer,20),quelle:'erfassen',erfasst:new Date().toISOString()};
  if(!out.datum)return {fehler:'Das Datum fehlt oder ist kein Datum (JJJJ-MM-TT).'};
  if(out.zeit===undefined)return {fehler:'Die Uhrzeit ist keine Uhrzeit (HH:MM).'};
  for(const k of ['ph','ec','ecFrisch','temp','o2','o2sat'])if(out[k]===undefined)return {fehler:`«${k}» ist keine Zahl.`};
  if(['ph','ec','ecFrisch','temp','o2','o2sat'].every(k=>out[k]==null))return {fehler:'Kein einziger Messwert.'};
  if(out.ph!=null&&(out.ph<0||out.ph>14))return {fehler:'pH ausserhalb 0–14.'};
  return {messung:out};
}
function pruefeEreignis(e){
  if(!e||typeof e!=='object')return {fehler:'Kein Eintrag.'};
  const out={id:uid(),datum:datum(e.datum),zeit:uhr(e.zeit),typ:text(e.typ,60)||'Düngergabe',titel:text(e.titel,120),
    mittel:text(e.mittel,40),menge:zahl(e.menge),einheit:text(e.einheit,10),jeReservoir:!!e.jeReservoir,
    stelle:text(e.stelle,40)||'beide',felder:{},geltung:'alle',saetze:[],
    notiz:text(e.notiz,500),wer:text(e.wer,20),quelle:'erfassen',erfasst:new Date().toISOString()};
  /* Wenige Zusatzfelder, kurz und als Text: «mit Dünger angesetzt» bei
     Wasser, Ziel-pH bei Säure. Alles andere fällt weg. */
  if(e.felder&&typeof e.felder==='object')for(const k of ['mitDuenger','zielPh','phVorher','phNachher','dosis'])
    if(e.felder[k]!=null)out.felder[k]=text(e.felder[k],20);
  if(!out.datum)return {fehler:'Das Datum fehlt oder ist kein Datum (JJJJ-MM-TT).'};
  if(out.zeit===undefined)return {fehler:'Die Uhrzeit ist keine Uhrzeit (HH:MM).'};
  if(out.menge===undefined)return {fehler:'Die Menge ist keine Zahl.'};
  /* Bei einer Düngung oder Säure muss dastehen, was gegeben wurde. Wasser
     und Tankarbeiten sagen es mit der Art selbst. */
  const brauchtMittel=/Dünger|Säure|Präparat|Desinfektion|Spurenelemente/i.test(out.typ);
  if(brauchtMittel&&!out.mittel&&!out.titel&&!out.notiz)return {fehler:'Weder Mittel noch Titel noch Notiz – was wurde gegeben?'};
  return {ereignis:out};
}
function dbSicher(){
  if(!bestand.db||typeof bestand.db!=='object')bestand.db={schema:9,analysen:[],ereignisse:[],messungen:[]};
  for(const k of ['messungen','ereignisse','analysen'])if(!Array.isArray(bestand.db[k]))bestand.db[k]=[];
  return bestand.db;
}

/* Was die Handy-Seite wissen muss – und nur das. Kein ganzer Bestand: die
   Rolle «hinten» sieht weder Analysen noch Logbuchnotizen anderer. */
function kontext(){
  /* Nur lesen: ein Kontext-Aufruf darf keinen Bestand anlegen. Sonst stünde
     nach dem ersten Blick vom Handy plötzlich ein leerer Bestand da, wo
     vorher «noch nichts» war. */
  const db=Object.assign({messungen:[],ereignisse:[]},bestand.db||{});
  if(!Array.isArray(db.messungen))db.messungen=[];
  if(!Array.isArray(db.ereignisse))db.ereignisse=[];
  const st=(db.stellen&&Array.isArray(db.stellen.gruppen))?db.stellen.gruppen.map(g=>({id:g.id,name:g.name})):[];
  const pr=db.produkte||{};
  /* Säuren sind im Logbuch eine eigene Art – die Handy-Seite muss das nicht
     wissen, sie bekommt es hier mitgeliefert. */
  const produkte=Object.keys(pr).map(id=>({id,name:pr[id].name||id,form:pr[id].form||'fluessig',
    einheit:pr[id].einheit||(pr[id].form==='fest'?'kg':'l'),typ:/saeure|säure/i.test(id+' '+(pr[id].name||''))?'Säurezugabe':'Düngergabe'}));
  /* «vorne» aus dem Tabellenimport oder dem Datenpaket ist dieselbe Stelle
     wie «Reservoir vorne» aus der Maske – der letzte Wert unter dem Feld
     soll beide kennen. */
  const namen=st.length?st.map(g=>g.name):['Reservoir vorne','Reservoir hinten'];
  const vorn=namen.find(n=>/vorn/i.test(n)),hint=namen.find(n=>/hint/i.test(n));
  const stelleVon=s=>{s=String(s||'');if(namen.includes(s))return s;
    if(/vorn|\brv\b/i.test(s)&&vorn)return vorn;if(/hint|\brh\b/i.test(s)&&hint)return hint;return s};
  const letzte={};
  const ms=db.messungen.filter(m=>m.datum).sort((a,b)=>b.datum.localeCompare(a.datum)||String(b.zeit||'').localeCompare(String(a.zeit||''))||String(b.erfasst||'').localeCompare(String(a.erfasst||'')));
  for(const m of ms){
    const s=stelleVon(m.stelle);
    if(!letzte[s])letzte[s]=[];
    if(letzte[s].length<3)letzte[s].push({datum:m.datum,zeit:m.zeit||null,ph:m.ph,ec:m.ec,o2:m.o2,temp:m.temp,wer:m.wer||null});
  }
  const beigaben=db.ereignisse.filter(e=>e.datum&&e.mittel).sort((a,b)=>b.datum.localeCompare(a.datum)||String(b.zeit||'').localeCompare(String(a.zeit||''))).slice(0,5)
    .map(e=>({datum:e.datum,zeit:e.zeit||null,stelle:e.stelle||'beide',mittel:e.mittel,menge:e.menge,einheit:e.einheit,jeReservoir:!!e.jeReservoir,wer:e.wer||null}));
  return {version:bestand.version,heute:new Date().toISOString().slice(0,10),stellen:st,produkte,letzte,beigaben};
}

/* ── Der Server ────────────────────────────────────────────────────────── */
const server=http.createServer(async(req,res)=>{
  const url=new URL(req.url,'http://x');
  const pfad=url.pathname;
  if(pfad==='/gesund')return json(res,200,{ok:true,version:bestand.version});
  if(pfad==='/robots.txt'){res.writeHead(200,Object.assign({'Content-Type':'text/plain; charset=utf-8'},NOINDEX));return res.end('User-agent: *\nDisallow: /\n')}

  const rolle=rolleVon(req);
  if(rolle==='gesperrt'){res.writeHead(429,{'Content-Type':'text/plain; charset=utf-8'});return res.end('Zu viele Fehlversuche – bitte zehn Minuten warten.')}

  try{
    /* Seiten */
    if(req.method==='GET'&&(pfad==='/'||pfad==='/basilikum.html')){
      if(!darf(rolle,'admin'))return verlangen(res);
      return seite(res,SEITEN.admin);
    }
    if(req.method==='GET'&&(pfad==='/maske'||pfad==='/maske/')){
      if(!darf(rolle,'maske'))return verlangen(res);
      return seite(res,SEITEN.hinten);
    }
    /* Die frühere Adresse der Handy-Seite – wer sie gespeichert hat, landet
       in der Maske. */
    if(req.method==='GET'&&(pfad==='/erfassen'||pfad==='/erfassen.html')){
      res.writeHead(301,Object.assign({Location:'/maske'},NOINDEX));return res.end();
    }
    /* Schnittstelle */
    if(pfad==='/api/version'&&req.method==='GET'){
      if(!darf(rolle,'maske'))return verlangen(res);
      return json(res,200,{version:bestand.version,geaendert:bestand.geaendert,von:bestand.von});
    }
    if(pfad==='/api/kontext'&&req.method==='GET'){
      if(!darf(rolle,'maske'))return verlangen(res);
      return json(res,200,kontext());
    }
    if(pfad==='/api/bestand'&&req.method==='GET'){
      if(!darf(rolle,'admin'))return verlangen(res);
      return json(res,200,{version:bestand.version,geaendert:bestand.geaendert,von:bestand.von,db:bestand.db});
    }
    if(pfad==='/api/bestand'&&req.method==='PUT'){
      if(!darf(rolle,'admin'))return verlangen(res);
      const b=await koerper(req);
      if(!b||typeof b!=='object'||!b.db||typeof b.db!=='object'||!Array.isArray(b.db.analysen))
        return json(res,400,{fehler:'Erwartet wird {basisVersion, db} mit einem vollständigen Bestand.'});
      /* Wer eine ältere Version geladen hat, bekommt den aktuellen Stand
         zurück und muss vereinigen – hier wird nichts stillschweigend
         überschrieben. */
      if(+b.basisVersion!==bestand.version)
        return json(res,409,{fehler:'Der Bestand hat sich inzwischen geändert.',version:bestand.version,geaendert:bestand.geaendert,von:bestand.von,db:bestand.db});
      bestand.db=b.db;
      await speichern('büro');
      return json(res,200,{version:bestand.version,geaendert:bestand.geaendert});
    }
    if(pfad==='/api/messung'&&req.method==='POST'){
      if(!darf(rolle,'maske'))return verlangen(res);
      const p=pruefeMessung(await koerper(req));
      if(p.fehler)return json(res,400,{fehler:p.fehler});
      dbSicher().messungen.push(p.messung);
      await speichern('maske'+(p.messung.wer?' · '+p.messung.wer:''));
      return json(res,200,{version:bestand.version,messung:p.messung});
    }
    if(pfad==='/api/ereignis'&&req.method==='POST'){
      if(!darf(rolle,'maske'))return verlangen(res);
      const p=pruefeEreignis(await koerper(req));
      if(p.fehler)return json(res,400,{fehler:p.fehler});
      dbSicher().ereignisse.push(p.ereignis);
      await speichern('maske'+(p.ereignis.wer?' · '+p.ereignis.wer:''));
      return json(res,200,{version:bestand.version,ereignis:p.ereignis});
    }
    res.writeHead(404,Object.assign({'Content-Type':'text/plain; charset=utf-8'},NOINDEX));
    res.end('Nicht gefunden.');
  }catch(err){
    const status=/zu gross/.test(err.message)?413:/JSON/.test(err.message)?400:500;
    json(res,status,{fehler:err.message});
  }
});

if(require.main===module)server.listen(PORT,()=>{
  console.log(`Basilikum läuft auf Port ${PORT} · Bestand: ${BESTAND} · Version ${bestand.version}`);
  console.log(`Dashboard «/»: ${PASS.admin?'mit Passwort':'offen, ohne Passwort'} · Maske «/maske»: ${PASS.hinten?'mit Passwort':(PASS.admin?'offen (nur das Dashboard ist geschützt)':'offen, ohne Passwort')}`);
  /* Auf Railway: ohne Volume unter /daten wäre der Bestand beim nächsten
     Neustart weg. Das steht dann gleich im Log, nicht erst, wenn es zu spät ist. */
  if(process.env.RAILWAY_PROJECT_ID){
    const vol=process.env.RAILWAY_VOLUME_MOUNT_PATH;
    if(!vol)console.log('ACHTUNG: Kein Volume angehängt. Ohne Volume ist der Bestand beim nächsten Neustart weg – ONLINE.md, Teil D.');
    else if(path.resolve(vol)!==DATEN)console.log(`ACHTUNG: Das Volume hängt unter ${vol}, der Bestand liegt aber unter ${DATEN}. Mount Path auf /daten stellen – ONLINE.md, Teil D.`);
    else console.log('Volume erkannt: '+vol+' – der Bestand überlebt Neustarts.');
  }
});
/* Beim Herunterfahren fertig schreiben, dann gehen. */
for(const sig of ['SIGINT','SIGTERM'])process.on(sig,()=>{schreibKette.then(()=>process.exit(0))});

module.exports={pruefeMessung,pruefeEreignis,kontext};
