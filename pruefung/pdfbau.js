/* Baut aus Text und Koordinaten ein schlichtes PDF – für die Prüfung des
   Hochladens, wenn keine echten Laborberichte zur Hand sind.

   Die Vorlagen sind die eingecheckten Fixtures: seiten.json (die Zeilen des
   echten Blattsaftberichts, wie pdf.js sie liest) und giesswasser.json (jedes
   Textstück der echten Wasserberichte mit seinen Koordinaten). Jedes Stück
   wird an seine Stelle gesetzt, in Helvetica mit WinAnsi-Kodierung. pdf.js
   liest daraus dieselben Zeilen und Koordinaten wie aus dem Original – das
   prüft pruefung/pdfbau-pruefen.js.                                        */
const ANSI={'€':0x80,'‚':0x82,'„':0x84,'…':0x85,'‘':0x91,'’':0x92,'“':0x93,'”':0x94,'–':0x96,'—':0x97,'μ':0xB5};
function kodiert(s){
  let t='';
  for(const c of String(s)){
    let n=ANSI[c]!=null?ANSI[c]:c.charCodeAt(0);
    if(n>255)n=0x3F;                                       /* ausserhalb von WinAnsi: «?» */
    const z=String.fromCharCode(n);
    t+=(z==='('||z===')'||z==='\\')?'\\'+z:z;
  }
  return t;
}
/* seiten: [[{x,y,s}]] – je Seite die Textstücke mit Grundlinie in PDF-Punkten. */
function pdfAusStuecken(seiten,o){
  o=o||{};
  const breite=o.breite||595,hoehe=o.hoehe||842,schrift=o.schrift||6.5;
  const objekte=[];
  const neu=inhalt=>{objekte.push(inhalt);return objekte.length};
  const katalog=neu(null),seitenObj=neu(null);
  const font=neu('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>');
  const kinder=[];
  for(const seite of seiten){
    let strom='';
    for(const st of seite)strom+=`BT /F1 ${schrift} Tf 1 0 0 1 ${(+st.x).toFixed(2)} ${(+st.y).toFixed(2)} Tm (${kodiert(st.s)}) Tj ET\n`;
    const inhalt=neu(`<< /Length ${Buffer.byteLength(strom,'latin1')} >>\nstream\n${strom}endstream`);
    kinder.push(neu(`<< /Type /Page /Parent ${seitenObj} 0 R /MediaBox [0 0 ${breite} ${hoehe}] /Resources << /Font << /F1 ${font} 0 R >> >> /Contents ${inhalt} 0 R >>`));
  }
  objekte[katalog-1]=`<< /Type /Catalog /Pages ${seitenObj} 0 R >>`;
  objekte[seitenObj-1]=`<< /Type /Pages /Kids [${kinder.map(k=>k+' 0 R').join(' ')}] /Count ${kinder.length} >>`;
  let pdf='%PDF-1.4\n%\xE2\xE3\xCF\xD3\n';
  const lage=[];
  objekte.forEach((inhalt,i)=>{lage.push(Buffer.byteLength(pdf,'latin1'));pdf+=`${i+1} 0 obj\n${inhalt}\nendobj\n`});
  const xref=Buffer.byteLength(pdf,'latin1');
  pdf+=`xref\n0 ${objekte.length+1}\n0000000000 65535 f \n`+lage.map(n=>String(n).padStart(10,'0')+' 00000 n \n').join('');
  pdf+=`trailer\n<< /Size ${objekte.length+1} /Root ${katalog} 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return Buffer.from(pdf,'latin1');
}
/* Ein Blattsaftbericht aus seinen Zeilen: Zeile für Zeile untereinander, auf
   einer breiten Seite, damit auch der lange Haftungssatz ganz draufpasst. */
const blattsaftPdf=zeilenJeSeite=>pdfAusStuecken(zeilenJeSeite.map(z=>z.map((s,i)=>({x:36,y:810-i*7.2,s}))),{breite:1000});
/* Ein Wasserbericht aus seinen Textstücken, jedes an seinem Ort. */
const wasserPdf=punkteJeSeite=>pdfAusStuecken(punkteJeSeite,{schrift:6});
module.exports={pdfAusStuecken,blattsaftPdf,wasserPdf};
