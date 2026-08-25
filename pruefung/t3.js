const A=require('./harness.js');
const ok=(b,t)=>console.log((b?'  BESTÄTIGT  ':'  nicht repro')+' · '+t);
const OPT={K:[4500,6000],Ca:[1600,2600],Mg:[400,700],Mo:[0.2,0.9],NO3:[2010,4000],
  N_gesamt:[3000,5000],P:[700,1400],S:[400,900],Zucker:[0.2,0.4],EC:[4,6],NH4:[5,40],Mn:[1,4]};
const mk=(bl,w,o)=>({id:'x'+bl,typ:'blattsaft',datum:'2025-05-12',satz:'19-434',blattalter:bl,zustand:null,
  werte:Object.fromEntries(Object.entries(w).map(([k,v])=>[k,{wert:v}])),optima:JSON.parse(JSON.stringify(o||OPT))});
const setze=(j,a,o)=>{const d=A.leer();d.analysen=[mk('jung',j,o),mk('alt',a,o)];d.saetze={'19-434':{}};A.setDb(d);
  return A.befunde(A.erhebungen()[0])};

console.log('=== NEU · dieselbe Störung wird pro Blattalter erneut gemeldet ===');
let f=setze({K:5000,Mg:300,Ca:1200,NO3:3000},{K:4800,Mg:290,Ca:1150,NO3:2900});
f.forEach(x=>console.log('  →',x.titel));
const kmg=f.filter(x=>/Magnesium wird durch Kalium/.test(x.titel));
const kca=f.filter(x=>/Calciumaufnahme durch Kalium/.test(x.titel));
ok(kmg.length>1,'K/Mg-Befund erscheint '+kmg.length+'× (einmal je Blattalter) für dasselbe Phänomen');
ok(kca.length>1,'K/Ca-Befund erscheint '+kca.length+'× für dasselbe Phänomen');

console.log('\n=== NEU · phloemmobile Nährstoffe ohne Verlagerungsregel fallen durch ===');
// Mo: alt unter Optimum, jung/alt = 2,0 → klares Verlagerungsmuster
f=setze({Mo:0.30,K:5000,Ca:2000,Mg:500},{Mo:0.15,K:5000,Ca:2000,Mg:500});
console.log('  Mo jung 0,30 · Mo alt 0,15 (Optimum ab 0,20) · Verhältnis 2,0');
console.log('  Befunde:',f.length?f.map(x=>x.titel).join(' | '):'KEINE');
ok(!f.some(x=>x.param==='Mo'),'Zu Molybdän entsteht kein einziger Befund, obwohl MOBIL.Mo = "'+A.MOBIL.Mo+'"');
console.log('  Die Verlagerungsregel deckt nur ab:  K, Mg, P, NO3, N_gesamt, S');
console.log('  MOBIL kennt als mobil:              ',Object.keys(A.MOBIL).filter(k=>A.MOBIL[k]==='mobil').join(', '));

console.log('\n=== NEU · Regeln greifen bei einer Mischprobe nicht ===');
const d=A.leer();
d.analysen=[mk('misch',{Mn:9.5,K:5000,Ca:2000,Mg:500,NO3:3000})];d.saetze={'19-434':{}};A.setDb(d);
const fm=A.befunde(A.erhebungen()[0]);
console.log('  Mn 9,5 bei Optimum bis 4,0 · Befunde:',fm.length?fm.map(x=>x.titel).join(' | '):'KEINE');
ok(!fm.some(x=>x.param==='Mn'),'Mangan-Regel liest nur w(j,...) und schweigt bei einer Mischprobe');

console.log('\n=== NEU · eigeneOptima mit nur einer Grenze wirft die Laborgrenze weg ===');
const d2=A.leer();
d2.analysen=[mk('jung',{K:4200},{K:[4500,6000]})];
d2.eigeneOptima={K:[null,5200]};      // Anwender trägt NUR eine Obergrenze ein
d2.saetze={'19-434':{}};A.setDb(d2);
const a0=d2.analysen[0];
console.log('  Labor-Optimum K:',JSON.stringify(a0.optima.K));
console.log('  eigener Eintrag:',JSON.stringify(d2.eigeneOptima.K));
console.log('  wirksames Optimum optVon():',JSON.stringify(A.optVon(a0,'K')));
console.log('  status(4200) =',A.status(4200,A.optVon(a0,'K')),' — vorher wäre es "tief" gewesen');
ok(A.optVon(a0,'K')[0]===null,'Die Labor-Untergrenze 4500 verschwindet lautlos, K gilt plötzlich als im Optimum');

console.log('\n=== NEU · Substratwerte werden mit Blattsaft-Bezeichnungen und -Einheiten angezeigt ===');
console.log('  NAME.pH  =',JSON.stringify(A.NAME.pH),' → im Substratbericht steht so "pH (Saft)"');
console.log('  einheit("Mn") =',A.einheit('Mn'),' → Substrat-Mangan wird als ppm beschriftet');
ok(A.NAME.pH==='pH (Saft)','Substrat-pH trägt die Blattsaft-Bezeichnung');
const d3=A.leer();
d3.analysen=[{id:'s1',typ:'substrat',datum:'2025-05-10',satz:'19-434',blattalter:null,zustand:null,
  werte:{pH:{wert:5.2},Mn:{wert:12}},optima:{}}];
d3.eigeneOptima={Mn:[1,4]};   // eigener Blattsaft-Zielbereich
A.setDb(d3);
console.log('  optVon(Substratprobe,"Mn") =',JSON.stringify(A.optVon(d3.analysen[0],'Mn')));
ok(A.optVon(d3.analysen[0],'Mn')!=null,'Ein eigener Blattsaft-Zielbereich wird auf die Substratprobe angewendet');
