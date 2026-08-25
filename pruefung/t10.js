const A=require('./harness.js');
const r=A.parseNCC(require('./seiten.json'));
const j=r.proben[0],a=r.proben[1],O=j.optima;
const st=(p,k)=>{const v=p.werte[k]?.wert,o=O[k];return (v==null||!o)?null:A.status(v,o)};

const VOR=['NO3','K','Ca','Mg','P','S','Fe','Mn','Zn','B','Cu'];   // Vorschlag, 11 Positionen
const zeig=(name,keys,modus)=>{
  let n=0,ok=0,detail=[];
  for(const k of keys){
    if(modus==='beide'){
      for(const [l,p] of [['jung',j],['alt',a]]){const s=st(p,k);if(!s)continue;n++;if(s==='ok')ok++;}
    }else{
      const m=A.MOBIL[k];
      const p = m==='mobil' ? a : m==='immobil' ? j : null;   // mobil→Altblatt, immobil→Jungblatt
      if(p){const s=st(p,k);if(s){n++;if(s==='ok')ok++;detail.push(k+':'+(m==='mobil'?'alt':'jung')+'='+s)}}
      else{const s1=st(j,k),s2=st(a,k);if(s1||s2){n++;if(s1==='ok'&&s2==='ok')ok++;detail.push(k+':beide='+(s1==='ok'&&s2==='ok'?'ok':'daneben'))}}
    }
  }
  console.log(name.padEnd(46)+String(ok).padStart(2)+' von '+String(n).padStart(2)+'  =  '+String(Math.round(ok/n*100)).padStart(3)+' %');
  return detail;
};
console.log('════ Wie sich die Kennzahl "im Optimum" durch die Entscheidungen ändert ════');
console.log('   Satz 28-478, echte Werte vom 18.08.2026\n');
zeig('heute  · KERN 15, jung und alt gezählt',A.KERN,'beide');
zeig('Frage 1 · KERN 11 ohne N-Dublette/Na/Cl/Si',VOR,'beide');
const d=zeig('Frage 1+3 · KERN 11, Blatt nach Mobilität',VOR,'mobil');
console.log('\n   Blattwahl im dritten Fall:');
d.forEach(x=>console.log('     '+x));
console.log('\n   Die Zahl steigt, weil zwei Ballastionen und eine Stickstoff-Dublette');
console.log('   herausfallen, die alle als "daneben" gezählt haben.');
console.log('   Die Aussage wird dadurch nicht besser, sondern ehrlicher: von 11 fachlich');
console.log('   steuerbaren Nährstoffen liegen 3 bis 4 im Sollbereich.');
