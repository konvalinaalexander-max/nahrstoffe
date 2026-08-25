const A=require('./harness.js');
let fehler=0;
const ok=(b,t)=>{if(!b)fehler++;console.log((b?'  ✓ ':'  ✗ FEHLER ')+t)};
const r=A.parseNCC(require('./seiten.json'));
const db=A.leer();
db.analysen=r.proben.map((p,i)=>Object.assign({id:'p'+i,typ:'blattsaft',labor:r.labor},p));
db.saetze={'28-478':{}};
A.setDb(db);
const e=A.erhebungen()[0];
const f=A.befunde(e);

console.log('════ Regelwerk an den ECHTEN Werten (Satz 28-478, 18.08.2026) ════');
console.log('Kennzahl:',e.index.ok,'von',e.index.n,'=',Math.round(e.index.anteil*100)+' %',
            '· Kernnaehrstoffe:',A.kern().length);
console.log('\n──── Befunde ────');
f.forEach((x,i)=>{
  console.log('\n'+(i+1)+'. ['+x.schwere.toUpperCase()+'] '+x.titel+'   (Ausmass '+Math.round((x.ausmass||0)*100)+'%)');
  x.belege.forEach(b=>console.log('     · '+b));
  console.log('     TUN: '+x.tun);
});

console.log('\n──── Prüfungen ────');
ok(!f.some(x=>/Zufuhr von Natrium|Zufuhr von Chlorid/.test(x.tun)),
   'Kein Vorschlag mehr, Natrium oder Chlorid zu duengen');
ok(!f.some(x=>x.param==='Na'),'Natrium 4 ppm unter 22 erzeugt keinen Mangelbefund mehr');
ok(A.kern().indexOf('Na')<0&&A.kern().indexOf('Cl')<0,'Na und Cl sind nicht in der Kennzahl');
ok(A.kern().indexOf('N_gesamt')<0,'Keine Stickstoff-Dublette in der Kennzahl');
const idxK=f.findIndex(x=>x.param==='K');
console.log('   Kalium steht an Stelle',idxK+1,'von',f.length);
ok(idxK>=0&&idxK<3,'Der Kaliumbefund steht unter den ersten drei und ist im Ueberblick sichtbar');
const nh4k=f.find(x=>x.id==='nh4k:K');
ok(!!nh4k,'Die neue Regel «Ammoniumueberschuss bremst die Kaliumaufnahme» greift');

const cu=f.find(x=>x.param==='Cu');
console.log('   Kupfer jung 0,29 / alt 0,18 bei Optimum ab 0,30 · jung/alt = 1,61');
ok(!!cu,'Kupfer faellt nicht mehr durch das Regelwerk: "'+(cu?cu.titel:'KEIN BEFUND')+'"');

ok(f.some(x=>x.param==='Mg'&&/über Optimum/.test(x.titel)),'Magnesium 52 % ueber dem Optimum wird gemeldet (frueher stumm)');
ok(f.some(x=>x.param==='S'&&/über Optimum/.test(x.titel)),'Schwefel ueber dem Optimum wird gemeldet (frueher stumm)');

const bor=f.find(x=>x.param==='B');
console.log('   Bor jung 0,79 bei Untergrenze 0,80 →',bor?bor.schwere+' / '+bor.titel:'kein eigener Alarmbefund');
ok(!bor||bor.schwere==='info','Bor bei 99 % der Untergrenze ist kein Befund der Stufe «hoch» mehr');
const randb=f.find(x=>x.art==='rand');
ok(!!randb,'Randlagen werden gebuendelt gemeldet: '+(randb?randb.titel:'–'));

const dop=f.map(x=>x.param).filter(Boolean);
const mehrfach=dop.filter((x,i)=>dop.indexOf(x)!==i);
console.log('   Naehrstoffe mit mehr als einem Befund:',mehrfach.length?[...new Set(mehrfach)].join(', '):'keine');
ok(!mehrfach.length,'Je Naehrstoff hoechstens ein Befund');
ok(!f.some(x=>/\(jung\)|\(alt\)|\(Mischprobe\)/.test(x.titel)),'Keine Verhaeltnisbefunde mehr je Blattalter');

console.log('\n──── Mischprobe ────');
const dm=A.leer();
dm.analysen=[{id:'m1',typ:'blattsaft',datum:'2026-08-18',satz:'28-478',blattalter:'misch',zustand:null,
  werte:{Mn:{wert:9.5},K:{wert:5000},Ca:{wert:2000},Mg:{wert:500},NO3:{wert:3000}},
  optima:{Mn:[1,4],K:[4500,6000],Ca:[1600,2600],Mg:[400,700],NO3:[2010,4000]}}];
dm.saetze={'28-478':{}};A.setDb(dm);
const fm=A.befunde(A.erhebungen()[0]);
console.log('   Mn 9,5 bei Optimum bis 4,0 (Mischprobe) →',fm.map(x=>x.titel).join(' | ')||'KEINE');
ok(fm.some(x=>x.param==='Mn'),'Die Mangan-Regel greift jetzt auch bei einer Mischprobe');

console.log('\n──── Molybdaen-Verlagerung ────');
const dmo=A.leer();
const O={Mo:[0.2,0.9],K:[4500,6000],Ca:[1600,2600],Mg:[400,700]};
dmo.analysen=[
 {id:'j',typ:'blattsaft',datum:'2026-08-18',satz:'28-478',blattalter:'jung',zustand:null,werte:{Mo:{wert:0.30},K:{wert:5000},Ca:{wert:2000},Mg:{wert:500}},optima:JSON.parse(JSON.stringify(O))},
 {id:'a',typ:'blattsaft',datum:'2026-08-18',satz:'28-478',blattalter:'alt',zustand:null,werte:{Mo:{wert:0.15},K:{wert:5000},Ca:{wert:2000},Mg:{wert:500}},optima:JSON.parse(JSON.stringify(O))}];
dmo.saetze={'28-478':{}};
dmo.einst.kern=['Mo','K','Ca','Mg'];A.setDb(dmo);
const fmo=A.befunde(A.erhebungen()[0]);
console.log('   Mo jung 0,30 / alt 0,15 bei Optimum ab 0,20 →',fmo.map(x=>x.titel).join(' | ')||'KEINE');
ok(fmo.some(x=>x.param==='Mo'),'Molybdaen erzeugt jetzt einen Befund (frueher: keiner)');
ok(fmo.some(x=>x.param==='Mo'&&/ausgeräumt/.test(x.titel)),'Und zwar den richtigen: Verlagerung aus dem Altblatt');

process.exit(fehler?1:0);
