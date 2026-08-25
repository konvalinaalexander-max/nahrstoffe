const A=require('./harness.js');
const seiten=require('./seiten.json');
const r=A.parseNCC(seiten);
const db=A.leer();
db.analysen=r.proben.map((p,i)=>({id:'p'+i,typ:'blattsaft',labor:r.labor,...p,
  optima:JSON.parse(JSON.stringify(p.optima))}));   // Kopie, sonst 1.3
db.saetze={'28-478':{}};
A.setDb(db);
const e=A.erhebungen()[0];

console.log('════ Was die App zu Satz 28-478 vom 18.08.2026 sagt ════');
console.log('Kulturalter:',e.alter.text);
console.log('Index      :',e.index.ok,'von',e.index.n,'=',Math.round(e.index.anteil*100)+' %');
console.log('\n──── Befunde ────');
const f=A.befunde(e);
f.forEach((x,i)=>{
  console.log('\n'+(i+1)+'. ['+x.schwere.toUpperCase()+'] '+x.titel);
  x.belege.forEach(b=>console.log('     · '+b));
  console.log('     TUN: '+x.tun);
  console.log('     Regel: '+x.regel);
});
console.log('\nAngezeigt werden im Überblick nur die ersten ZWEI:',f.slice(0,2).map(x=>x.titel));
console.log('Unter "weitere Befunde" verschwinden:',f.slice(2).map(x=>x.titel));
