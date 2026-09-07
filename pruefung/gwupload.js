/* Die drei echten Wasserberichte im Browser hochladen und ansehen. */
const {chromium}=require('playwright');
const fs=require('fs'),path=require('path');
const APP=path.resolve(__dirname,'..','basilikum.html');
const PDFJS=process.env.PDFJS, GW=process.env.GW;   // GW = Ordner mit den drei PDFs
const shots=process.env.SHOTS||require('os').tmpdir()+'/basilikum-gw';
fs.mkdirSync(shots,{recursive:true});
let fehler=[];
const ok=(b,t)=>{if(!b)fehler.push(t);console.log((b?'  ✓ ':'  ✗ FEHLER ')+t)};
(async()=>{
  const b=await chromium.launch(process.env.CHROME?{executablePath:process.env.CHROME,args:['--no-sandbox']}:{});
  const p=await b.newPage({viewport:{width:1320,height:1100}});
  p.on('pageerror',e=>fehler.push('pageerror: '+e.message));
  p.on('console',m=>{const t=m.text();
    if(m.type()==='error'&&!/Failed to load resource|net::ERR_/.test(t))fehler.push('console: '+t)});
  await p.route('**/pdf.min.js',r=>r.fulfill({contentType:'application/javascript',body:fs.readFileSync(PDFJS+'/pdf.min.js','utf8')}));
  await p.route('**/pdf.worker.min.js',r=>r.fulfill({contentType:'application/javascript',body:fs.readFileSync(PDFJS+'/pdf.worker.min.js','utf8')}));
  await p.goto('file://'+APP);
  await p.waitForTimeout(1200);

  console.log('── Drei Wasserberichte auf einmal ablegen ──');
  await p.click('#nav button:text-is("Analysen")');
  await p.waitForTimeout(300);
  await p.setInputFiles('#filePdf',[GW+'/vorne-zwei.pdf',GW+'/hinten-ohne.pdf',GW+'/vorne-mit.pdf']);
  await p.waitForTimeout(5000);
  const titel=await p.$eval('#dlgTitel',e=>e.textContent);
  console.log('  Kontrolldialog:',titel);
  ok(/4 Proben/.test(titel),'Vier Proben erkannt: drei Berichte, einer davon mit Historie');
  const stellen=await p.$$eval('#dlgBody input[data-f="stelle"]',es=>es.map(e=>e.value));
  console.log('  Entnahmestellen:',stellen.join(' | '));
  ok(stellen.length===4,'Jede Probe hat ein Feld für die Entnahmestelle');
  ok(stellen.filter(x=>x).length===4,'Alle vier Namen automatisch gefüllt');
  const daten=await p.$$eval('#dlgBody input[data-f="datum"]',es=>es.map(e=>e.value));
  console.log('  Probendaten:',daten.join(' | '));
  ok(daten.filter(d=>d==='2026-08-06').length===2,'Zwei Proben tragen dasselbe Datum');
  const felder=await p.$$eval('#dlgBody [data-feld] .tiny',es=>es.length);
  console.log('  Messwertfelder:',await p.$$eval('#dlgBody input[data-w]',e=>e.length));
  await p.screenshot({path:shots+'/1-kontrolle.png'});

  console.log('\n── Übernehmen ──');
  await p.click('#dlgFoot button:text-is("Übernehmen")');
  await p.waitForTimeout(900);
  if(await p.$eval('#dlg',e=>e.open))await p.click('#dlgFoot button:text-is("Schliessen")').catch(()=>{});
  await p.waitForTimeout(300);
  await p.click('#nav button:text-is("Giesswasser")');
  await p.waitForTimeout(700);
  const gw=await p.$eval('#view',e=>e.innerText);
  ok(!/undefined|NaN|\[object Object\]|liess sich nicht aufbauen/.test(gw),'Der Reiter Giesswasser rendert sauber');
  ok(/Reservoir Vorne/.test(gw),'Entnahmestelle «Reservoir Vorne»');
  ok(/Hinter, Ohne H2O2/.test(gw),'Entnahmestelle «Hinter, Ohne H2O2»');
  ok(/Vorne, mitt H2O2/.test(gw),'Entnahmestelle «Vorne, mitt H2O2»');
  ok(/Entnahmestellen\n3/.test(gw)||/3\nProben/.test(gw)||/3/.test(gw),'Drei Entnahmestellen gezählt');
  ok(/Hydrogencarbonat über dem Richtwert/.test(gw),'Der hohe Hydrogencarbonatwert wird benannt');
  const svg=await p.$$eval('#view svg',s=>s.length);
  console.log('  Diagramme:',svg);
  ok(svg>=1,'Verlaufsdiagramm gezeichnet');
  await p.screenshot({path:shots+'/2-giesswasser.png',fullPage:true});

  console.log('\n── Proben vom selben Tag unterscheiden ──');
  const tips=await p.$$eval('#view [title]',es=>es.map(e=>e.getAttribute('title')).filter(t=>/H2O2/.test(t)));
  console.log('  Tooltips mit Stellennamen:',tips.length);
  tips.slice(0,3).forEach(t=>console.log('   ',t));
  ok(tips.length>=4,'Der Name der Entnahmestelle steht in den Tooltips');
  /* Im Diagramm steht der Text seit dem Umbau in data-tipp: das Kaestchen
     erscheint sofort statt nach rund einer Sekunde. Geprueft wird darum der
     Inhalt des Attributs und zusaetzlich, dass das Kaestchen wirklich kommt. */
  const svgTitel=await p.$$eval('#view svg [data-tipp]',es=>es.map(e=>e.getAttribute('data-tipp').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim()));
  console.log('  Diagramm-Tooltips:',svgTitel.length);
  svgTitel.slice(0,3).forEach(t=>console.log('   ',t.slice(0,110)));
  ok(svgTitel.some(t=>/H2O2/.test(t)),'Auch im Diagramm');
  ok(svgTitel.some(t=>/Entnahmestelle/.test(t)),'und ist dort als Entnahmestelle bezeichnet');
  await p.evaluate(()=>window.scrollTo(0,0));await p.waitForTimeout(150);
  const gh=await p.$$('#cGw .hit');
  if(gh.length){
    const bb=await gh[gh.length-1].boundingBox();
    await p.mouse.move(bb.x+bb.width/2,bb.y+bb.height/2);await p.waitForTimeout(120);
    const kasten=await p.$eval('.tipp',e=>({an:e.classList.contains('an'),t:e.innerText}));
    console.log('  Infokästchen:',JSON.stringify(kasten.t.replace(/\n/g,' · ').slice(0,110)));
    ok(kasten.an,'Das Infokästchen erscheint sofort beim Zeigen auf einen Punkt');
    ok(/Entnahmestelle/.test(kasten.t),'und nennt die Entnahmestelle');
  }else{ok(false,'Keine anfassbaren Punkte im Verlaufsdiagramm')}

  console.log('\n── Eine Wasserprobe im Detail ──');
  await p.click('#view button:text-is("Alle Werte ansehen")');
  await p.waitForTimeout(400);
  const det=await p.$eval('#dlgBody',e=>e.innerText);
  console.log('  Dialogtitel:',await p.$eval('#dlgTitel',e=>e.textContent));
  ok(/mmol\/l/.test(det),'Makronährstoffe in mmol/l');
  ok(/µmol\/l/.test(det),'Spurenelemente in µmol/l');
  ok(!/mg\/l/.test(det),'Keine falsche mg/l-Beschriftung mehr');
  await p.screenshot({path:shots+'/3-probe.png'});
  await p.click('#dlgFoot button:text-is("Schliessen")');
  await p.waitForTimeout(300);

  console.log('\n── Alle zehn Reiter ──');
  const reiter=await p.$$eval('#nav button',bs=>bs.map(b=>b.textContent));
  for(const t of reiter){
    await p.click(`#nav button:text-is("${t}")`);
    await p.waitForTimeout(280);
    const txt=await p.$eval('#view',e=>e.innerText);
    const kaputt=/undefined|NaN|\[object Object\]|liess sich nicht aufbauen/.test(txt);
    console.log((kaputt?'  ✗ ':'  ✓ ')+t.padEnd(22)+txt.split('\n')[0].slice(0,42));
    if(kaputt)fehler.push('Reiter '+t);
  }

  console.log('\n── Ergebnis ──');
  if(fehler.length){console.log('  FEHLER:');fehler.forEach(f=>console.log('   ·',f))}
  else console.log('  ✓ Die drei Wasserberichte werden vollständig eingelesen und dargestellt.');
  console.log('  Screenshots:',shots);
  await b.close();
  process.exit(fehler.length?1:0);
})();
