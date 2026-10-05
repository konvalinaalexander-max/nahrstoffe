/* Lesen pdf.js und die Parser aus den nachgebauten PDFs dasselbe wie aus
   den echten Berichten? Erst dann taugen sie für die Upload-Prüfung.
   Aufruf:  NODE_PATH=…/node_modules node pruefung/pdfbau-pruefen.js
   (braucht pdfjs-dist@3.11.174)                                           */
/* Die Prüfumgebung ersetzt URL und Blob durch Attrappen – pdf.js braucht die echten. */
const echt={URL:global.URL,Blob:global.Blob,fetch:global.fetch};
const A=require('./harness.js');
Object.assign(global,echt);
const {blattsaftPdf,wasserPdf}=require('./pdfbau.js');
const pdfjsLib=require('pdfjs-dist/legacy/build/pdf.js');
pdfjsLib.GlobalWorkerOptions.workerSrc=require.resolve('pdfjs-dist/legacy/build/pdf.worker.js');
let fehler=0;
const ok=(b,t)=>{if(!b)fehler++;console.log((b?'  ✓ ':'  ✗ FEHLER ')+t)};
/* Dieselben zwei Lesarten wie in basilikum.html (pdfSeiten, pdfPunkte). */
async function lesen(buf){
  const doc=await pdfjsLib.getDocument({data:new Uint8Array(buf)}).promise,seiten=[],punkte=[];
  for(let p=1;p<=doc.numPages;p++){
    const c=await(await doc.getPage(p)).getTextContent(),b=new Map();
    for(const it of c.items){
      if(!it.str||!it.str.trim())continue;
      const y=Math.round(it.transform[5]*2)/2;
      if(!b.has(y))b.set(y,[]);
      b.get(y).push({x:it.transform[4],s:it.str});
    }
    seiten.push([...b.keys()].sort((a,z)=>z-a).map(y=>b.get(y).sort((a,z)=>a.x-z.x).map(o=>o.s).join(' ').replace(/\s+/g,' ')));
    punkte.push(c.items.filter(i=>i.str&&i.str.trim()).map(i=>({x:Math.round(i.transform[4]*10)/10,y:Math.round(i.transform[5]*10)/10,s:i.str.trim()})));
  }
  return {seiten,punkte};
}
const ohneText=r=>JSON.stringify(r.proben);
(async()=>{
  console.log('════ Blattsaft ════');
  const seiten=require('./seiten.json');
  const l=await lesen(blattsaftPdf(seiten));
  ok(JSON.stringify(l.seiten)===JSON.stringify(seiten),'pdf.js liest dieselben '+seiten[0].length+' Zeilen');
  const r=A.parseAuto(l.seiten,l.punkte);
  ok(r.typ==='blattsaft'&&ohneText(r)===ohneText(A.parseNCC(seiten)),'Der Parser liest dieselben zwei Proben mit allen Werten und Optima');
  console.log('\n════ Giesswasser ════');
  const FIX=require('./giesswasser.json');
  for(const n of Object.keys(FIX)){
    const w=await lesen(wasserPdf(FIX[n].punkte));
    const ist=A.parseAuto(w.seiten,w.punkte),soll=A.parseGiess(FIX[n].seiten,FIX[n].punkte);
    ok(ist.typ==='giesswasser'&&ohneText(ist)===ohneText(soll),n+': '+ist.proben.length+' Probe(n), Stelle «'+(ist.proben[0]||{}).stelle+'», alle Werte gleich');
  }
  console.log(fehler?`\n  ${fehler} FEHLER`:'\n  ✓ Die nachgebauten PDFs lesen sich wie die echten.');
  process.exit(fehler?1:0);
})().catch(e=>{console.error(e);process.exit(1)});
