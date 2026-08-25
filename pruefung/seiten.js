/* Reproduziert pdfSeiten() aus basilikum.html Zeile 303 exakt. */
const fs=require('fs');
const pdfjsLib=require('pdfjs-dist/legacy/build/pdf.js');
pdfjsLib.GlobalWorkerOptions.workerSrc=require.resolve('pdfjs-dist/legacy/build/pdf.worker.js');

async function pdfSeiten(buf){
  const doc=await pdfjsLib.getDocument({data:buf}).promise,out=[];
  for(let p=1;p<=doc.numPages;p++){
    const c=await(await doc.getPage(p)).getTextContent(),b=new Map();
    for(const it of c.items){
      if(!it.str||!it.str.trim())continue;
      const y=Math.round(it.transform[5]*2)/2;
      if(!b.has(y))b.set(y,[]);
      b.get(y).push({x:it.transform[4],s:it.str});
    }
    out.push([...b.keys()].sort((a,z)=>z-a).map(y=>b.get(y).sort((a,z)=>a.x-z.x).map(o=>o.s).join(' ').replace(/\s+/g,' ')));
  }
  return out;
}
(async()=>{
  const seiten=await pdfSeiten(new Uint8Array(fs.readFileSync(process.argv[2])));
  fs.writeFileSync(__dirname+'/seiten.json',JSON.stringify(seiten,null,1));
  console.log('Seiten:',seiten.length);
  seiten.forEach((s,i)=>{
    console.log('\n════════ SEITE '+(i+1)+' · '+s.length+' Zeilen ════════');
    s.forEach((l,n)=>console.log(String(n).padStart(3)+' │ '+l));
  });
})();
