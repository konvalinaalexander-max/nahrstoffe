/* Drei Wasserberichte auf einmal hochladen und ansehen, in Chromium mit echtem
   pdf.js. Ohne eigene PDFs werden die echten Berichte aus
   pruefung/giesswasser.json nachgebaut (pruefung/pdfbau.js).
   Aufruf:  CHROME=… NODE_PATH=…/node_modules [GW=ordner] node pruefung/gwupload.js
   (GW: Ordner mit vorne-zwei.pdf, hinten-ohne.pdf, vorne-mit.pdf)          */
const {chromium}=require('playwright');
const fs=require('fs'),path=require('path'),os=require('os');
const APP=path.resolve(__dirname,'..','basilikum.html');
const PDFJS=process.env.PDFJS||path.dirname(require.resolve('pdfjs-dist/build/pdf.min.js'));
const shots=process.env.SHOTS||path.join(os.tmpdir(),'basilikum-gw');
fs.mkdirSync(shots,{recursive:true});
let GW=process.env.GW;
if(!GW){
  GW=fs.mkdtempSync(path.join(os.tmpdir(),'basilikum-gw-pdf-'));
  const FIX=require('./giesswasser.json'),{wasserPdf}=require('./pdfbau.js');
  for(const [n,d] of [['vorneZwei','vorne-zwei'],['hintenOhne','hinten-ohne'],['vorneMit','vorne-mit']])
    fs.writeFileSync(path.join(GW,d+'.pdf'),wasserPdf(FIX[n].punkte));
}
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

  console.log('── Drei Wasserberichte auf einmal ──');
  await p.click('#nav button:text-is("Analysen")');await p.waitForTimeout(300);
  await p.setInputFiles('#filePdf',[GW+'/vorne-zwei.pdf',GW+'/hinten-ohne.pdf',GW+'/vorne-mit.pdf']);
  await p.waitForTimeout(5000);
  const titel=await p.$eval('#dlgTitel',e=>e.textContent);
  console.log('  Kontrolldialog:',titel);
  ok(/4 Proben/.test(titel),'Vier Proben erkannt: drei Berichte, einer davon mit Historie');
  const stellen=await p.$$eval('#dlgBody input[data-f="stelle"]',es=>es.map(e=>e.value));
  console.log('  Entnahmestellen:',stellen.join(' | '));
  ok(stellen.length===4&&stellen.every(x=>x),'Jede Probe hat ihre Entnahmestelle, automatisch gefüllt');
  const daten=await p.$$eval('#dlgBody input[data-f="datum"]',es=>es.map(e=>e.value));
  ok(daten.filter(d=>d==='2026-08-06').length===2,'Zwei Proben tragen dasselbe Datum');
  ok(!(await p.$('#dlgBody select[data-f="blattalter"]')),'Wasser fragt nicht nach dem Blatt');
  await p.screenshot({path:shots+'/1-kontrolle.png'});

  console.log('\n── Übernehmen ──');
  await p.click('#dlgFoot button:text-is("Übernehmen")');await p.waitForTimeout(900);
  ok(!(await p.$eval('#dlg',e=>e.open)),'Mehrere Berichte: kein Pop-up danach, die Liste zeigt sie');
  const liste=await p.$$eval('#view table tbody tr',e=>e.map(x=>x.innerText.replace(/\s+/g,' ')));
  ok(liste.length===4&&liste.every(z=>/Giesswasser/.test(z)),'Vier Zeilen in der Liste');
  ok(liste.filter(z=>/06\.08\.2026/.test(z)).length===2&&/Hinter, Ohne H2O2/.test(liste.join())&&/Vorne, mitt H2O2/.test(liste.join()),'Die zwei vom selben Tag mit ihren Stellen');

  console.log('\n── Eine Wasserprobe im Bericht ──');
  await p.click('#view table tbody tr:has-text("Hinter, Ohne H2O2")');await p.waitForTimeout(400);
  const det=await p.$eval('#dlgBody',e=>e.innerText);
  console.log('  Titel:',await p.$eval('#dlgTitel',e=>e.textContent));
  ok(/mmol\/l/.test(det)&&/µmol\/l/.test(det),'Die Einheiten des Labors: mmol/l und µmol/l');
  ok(/239.2 mg\/l/.test(det),'Daneben der Wert in mg/l (Hydrogencarbonat 3,92 mmol/l = 239,2 mg/l)');
  await p.screenshot({path:shots+'/2-probe.png'});
  await p.click('#dlgFoot button:text-is("Schliessen")');await p.waitForTimeout(300);

  console.log('\n── Im Diagramm ──');
  await p.click('#nav button:text-is("Blattsaft & Giesswasser")');await p.waitForTimeout(500);
  await p.click('#cKb .chip:text-is("Hydrogencarbonat")');await p.waitForTimeout(400);
  const legende=await p.$eval('#cKb .tafelKopf .zeichen',e=>e.innerText.replace(/\s+/g,' ').trim());
  console.log('  Stellen:',legende);
  ok(/Vorne/.test(legende)&&/Hinter, Ohne H2O2/.test(legende)&&/Vorne, mitt H2O2/.test(legende),'Alle drei Stellen mit ihrem Zeichen über dem Diagramm');
  const tipps=await p.evaluate(()=>ZEIT.treffer.flat().map(t=>t.tipp.replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim()));
  ok(tipps.length>=8,'Kalium und Hydrogencarbonat: '+tipps.length+' Punkte');
  ok(tipps.some(t=>/Stelle: Hinter, Ohne H2O2/.test(t)),'Das Kästchen nennt die Stelle');
  await p.$eval('#cKb',e=>e.scrollIntoView({block:'center'}));await p.waitForTimeout(150);
  /* Neben den letzten Punkt der Giesswasser-Grafik zeigen */
  const pt=await p.evaluate(()=>{const nr=ZEIT.treffer.length-1,l=ZEIT.treffer[nr],t=l[l.length-1];
    const s=document.querySelector(`#cKb svg.spur[data-spur="${nr}"]`),r=s.getBoundingClientRect(),k=r.width/ZEIT.W;
    return {x:r.left+t.cx*k,y:r.top+t.cy*k}});
  await p.mouse.move(pt.x-6,pt.y+5);await p.waitForTimeout(200);
  const kasten=await p.$eval('.tipp',e=>({an:e.classList.contains('an'),t:e.innerText}));
  ok(kasten.an&&/Stelle/.test(kasten.t),'Das Kästchen erscheint sofort beim Zeigen');
  await p.screenshot({path:shots+'/3-diagramm.png',fullPage:true});
  ok(/Stellen zuordnen · 3 offen/.test(await p.$eval('#cKb [data-tun="stellen"]',e=>e.textContent)),'Beim Giesswasser: «Stellen zuordnen · 3 offen»');
  await p.click('#nav button:text-is("Einstellungen")');await p.waitForTimeout(300);
  ok(/3 Bezeichnungen auf den Berichten – 3 noch nicht zugeordnet/.test(await p.$eval('#view',e=>e.innerText)),'Unter Einstellungen: drei Bezeichnungen, noch offen');

  console.log('\n── Ergebnis ──');
  if(fehler.length){console.log('  FEHLER:');fehler.forEach(f=>console.log('   ·',f))}
  else console.log('  ✓ Die drei Wasserberichte werden vollständig eingelesen und dargestellt.');
  console.log('  Bildschirmfotos:',shots);
  await b.close();
  process.exit(fehler.length?1:0);
})().catch(e=>{console.error('ABBRUCH',e);process.exit(1)});
