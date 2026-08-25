const A=require('./harness.js');
const seiten=require('./seiten.json');
const ok=(b,t)=>console.log((b?'  BESTÄTIGT  ':'  nicht repro')+' · '+t);

console.log('════ 1.2 · putz() gegen das ECHTE Layout ════');
console.log('Das Labor druckt ganzzahlige ppm ohne Nachkommastelle:');
console.log('   Zeile 40:  "Na - Natrium ppm 4 22 - 44"      → Na jung = 4');
console.log('   Zeile 52:  "N aus Nitrat ppm 8 454 - 797"    → N-NO3 jung = 8');
console.log('Ein Wert von 1 oder 2 ist in diesem Format also normal.\n');

const orig=A.parseNCC(seiten);
console.log('unverändert     : Na jung =',orig.proben[0].werte.Na.wert,
            '· Na alt =',orig.proben[1].werte.Na.wert,
            '· Optimum =',JSON.stringify(orig.proben[0].optima.Na));

// Realistische Mutation: Na jung 4 → 2, Na alt 13 → 1
const mut=JSON.parse(JSON.stringify(seiten));
mut[0][40]='Na - Natrium ppm 2 22 - 44';
mut[0][42]='ppm 1';
const rm=A.parseNCC(mut);
console.log('Na jung 2, alt 1: Na jung =',rm.proben[0].werte.Na?.wert ?? '—',
            '· Na alt =',rm.proben[1].werte.Na?.wert ?? '—',
            '· Optimum =',JSON.stringify(rm.proben[0].optima.Na ?? null));
console.log('   im PDF steht  : Na jung = 2, Na alt = 1, Optimum 22 - 44');
ok(rm.proben[0].werte.Na?.wert===22,'Der Messwert 2 wird zu 22 — der Optimum-Untergrenze');
ok(rm.proben[0].optima.Na===undefined,'Das Optimum 22–44 geht zusätzlich ganz verloren');
ok(rm.proben[1].werte.Na===undefined,'Der Wert der Altprobe verschwindet ersatzlos');
console.log('\n   Folge: Natrium 2 ppm (stark unter Optimum) erscheint als 22 ppm ohne Optimum,');
console.log('   also unauffällig. Kein Hinweis, keine Warnung, keine Lücke in der Tabelle.');

console.log('\n════ Prüfung: verfälscht putz() DIESE Datei? ════');
const istParam=l=>A.NCC.some(x=>A.putz(l).trim().startsWith(x[0]));
let param=0;const sonst=[];
seiten[0].forEach((l,n)=>{
  const p=A.putz(l);
  if(p===l.replace(/\u00a0/g,' ').trimEnd())return;   // unveraendert
  if(/^\s*[12]\s*$/.test(l))return;                   // reine Markerzeile, so gewollt
  const z='   Zeile '+n+': '+JSON.stringify(l)+' -> '+JSON.stringify(p);
  if(istParam(l))param++; else sonst.push(z);
});
sonst.forEach(x=>console.log(x));
console.log(param
  ? '   '+param+' PARAMETERZEILE(N) VERFAELSCHT'
  : '   Keine Parameterzeile verfaelscht - diese Datei wird korrekt gelesen.');
console.log('   (Die Treffer oben sind Markerzeile und Fusszeile, keine Messwerte.)');

console.log('\n════ NEU · Kupfer fällt an den echten Werten komplett durch ════');
const db=A.leer();
db.analysen=orig.proben.map((p,i)=>({id:'p'+i,typ:'blattsaft',...p,optima:JSON.parse(JSON.stringify(p.optima))}));
db.saetze={'28-478':{}};A.setDb(db);
const f=A.befunde(A.erhebungen()[0]);
console.log('   Cu jung 0,29 · Cu alt 0,18 · Optimum ab 0,30 → beide unter Optimum');
console.log('   jung/alt = '+(0.29/0.18).toFixed(2)+' > Schwelle 1,3 → allgemeine Regel überspringt');
console.log('   Verlagerungsregel deckt ab: K, Mg, P, NO3, N_gesamt, S → Cu nicht dabei');
ok(!f.some(x=>x.param==='Cu'),'Zu Kupfer entsteht kein Befund, obwohl beide Blattalter unter dem Optimum liegen');

console.log('\n════ NEU · Überschreitungen ohne jede Regel ════');
const p0=db.analysen[0],p1=db.analysen[1];
const ueber=[];
for(const k of A.KERN.concat(['Zucker','NH4','N_aus_NO3'])){
  for(const [lbl,p] of [['jung',p0],['alt',p1]]){
    const v=p.werte[k]?.wert,o=p.optima[k];
    if(v!=null&&o&&A.status(v,o)==='hoch')ueber.push({k,lbl,v,o,gemeldet:f.some(x=>x.param===k)});
  }
}
ueber.forEach(u=>console.log('   '+(A.NAME[u.k]||u.k).padEnd(20)+u.lbl.padEnd(6)+String(u.v).padEnd(8)+
  'Optimum bis '+String(u.o[1]).padEnd(8)+(u.gemeldet?'gemeldet':'STUMM')));
const stumm=[...new Set(ueber.filter(u=>!u.gemeldet).map(u=>u.k))];
ok(stumm.length>0,'Für '+stumm.length+' Nährstoffe über dem Optimum gibt es keine Regel: '+stumm.join(', '));

console.log('\n════ NEU · Die Schwere richtet sich nicht nach dem Ausmass ════');
f.filter(x=>x.schwere==='hoch').forEach(x=>{
  const o=p0.optima[x.param],v=Math.min(...[p0,p1].map(p=>p.werte[x.param]?.wert).filter(v=>v!=null));
  if(o&&o[0])console.log('   '+(A.NAME[x.param]||x.param).padEnd(20)+
    'Gewicht '+String(x.gewicht).padEnd(5)+ (Math.round(v/o[0]*100)+' % der Untergrenze').padEnd(24)+x.titel.slice(0,42));
});
console.log('\n   Reihenfolge im Überblick: Natrium (Gewicht 82) steht VOR Kalium (74).');
ok(f.findIndex(x=>x.param==='Na')<f.findIndex(x=>x.param==='K'),
   'Der Ballastion-Fehlbefund verdrängt den wichtigsten echten Befund aus der Ansicht');
