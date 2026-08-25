/* Verdachtsliste A · B · C — kompositionelle Daten, Kennzahl, Transformationen */
const A=require('./harness.js');
const r=A.parseNCC(require('./seiten.json'));
const basis=()=>{const d=A.leer();
  d.analysen=r.proben.map((p,i)=>Object.assign({id:'p'+i,typ:'blattsaft',labor:r.labor},JSON.parse(JSON.stringify(p))));
  d.saetze={'28-478':{}};A.setDb(d);return d};
const P=(t)=>console.log('\n'+t+'\n'+'─'.repeat(t.length));

console.log('══════════════════════════════════════════════════════════');
console.log(' A · Kompositionelle Daten');
console.log('══════════════════════════════════════════════════════════');

P('A1 · Wie stark haengt die Bewertung am Wassergehalt?');
console.log('Alle Konzentrationen gemeinsam skalieren simuliert einen anderen');
console.log('Wassergehalt der Pflanze – Tageszeit, Zeit seit der Flutung, Lichtsumme.');
console.log('Die Versorgung aendert sich dabei NICHT.\n');
console.log('Faktor   Kennzahl   Befunde   Naehrstoffe mit geaenderter Bewertung');
const ref=(()=>{basis();const e=A.erhebungen()[0];
  return {idx:e.index,st:Object.fromEntries(A.kern().map(k=>[k,e.bew[k]&&!e.bew[k].fehlt?(e.bew[k].ok?'ok':e.bew[k].st):'–']))}})();
for(const f of [0.70,0.80,0.90,1.00,1.10,1.25,1.40]){
  const d=basis();
  d.analysen.forEach(a=>{for(const k in a.werte)if(k!=='pH'&&k!=='K/Ca')a.werte[k].wert*=f});
  A.setDb(d);
  const e=A.erhebungen()[0],f2=A.befunde(e);
  const geaendert=A.kern().filter(k=>{const b=e.bew[k];
    const jetzt=b&&!b.fehlt?(b.ok?'ok':b.st):'–';return jetzt!==ref.st[k]});
  console.log(('×'+f.toFixed(2)).padEnd(9)+
    (Math.round(e.index.anteil*100)+' %').padEnd(11)+
    String(f2.length).padEnd(10)+
    (geaendert.length?geaendert.length+': '+geaendert.map(k=>A.NAME[k]).join(', '):'keine'));
}

P('A2 · Verhaeltnisse sind gegenueber derselben Skalierung invariant');
const d0=basis();
const p0=d0.analysen[0];
const vh=(a,b,p)=>(p.werte[a].wert/p.werte[b].wert);
console.log('Faktor   K/Mg    K/Ca    NH4/NO3   Ionensumme');
for(const f of [0.7,1.0,1.4]){
  const d=basis();
  d.analysen.forEach(a=>{for(const k in a.werte)if(k!=='pH'&&k!=='K/Ca')a.werte[k].wert*=f});
  const p=d.analysen[0];
  const ionen=['K','Ca','Mg','Na','NH4','NO3','Cl','S','P'].reduce((s,k)=>s+(p.werte[k]?p.werte[k].wert:0),0);
  console.log(('×'+f.toFixed(2)).padEnd(9)+vh('K','Mg',p).toFixed(3).padEnd(8)+vh('K','Ca',p).toFixed(3).padEnd(8)+
    vh('NH4','NO3',p).toFixed(3).padEnd(10)+Math.round(ionen));
}
console.log('\n→ Die drei Verhaeltnisse bleiben exakt gleich, die Ionensumme nicht.');
console.log('  Genau das ist der Grund, warum die Uebergabe Verhaeltnisse als robuster bezeichnet.');

P('A3 · Traegt der Saft-EC als Normierungsgroesse?');
basis();
const j=r.proben[0].werte,a=r.proben[1].werte;
const ionenVon=w=>['K','Ca','Mg','Na','NH4','NO3','Cl','S','P'].reduce((s,k)=>s+(w[k]?w[k].wert:0),0);
console.log('           EC (mS/cm)   Ionensumme (ppm)   Summe/EC');
console.log('jung       '+String(j.EC.wert).padEnd(13)+String(Math.round(ionenVon(j))).padEnd(19)+Math.round(ionenVon(j)/j.EC.wert));
console.log('alt        '+String(a.EC.wert).padEnd(13)+String(Math.round(ionenVon(a))).padEnd(19)+Math.round(ionenVon(a)/a.EC.wert));
console.log('\n→ Das Verhaeltnis Summe/EC ist zwischen den beiden Blattaltern aehnlich.');
console.log('  Mit EINER Erhebung laesst sich daraus nichts schaetzen – aber die Groesse');
console.log('  existiert und waere der Kandidat fuer eine Normierung.');
console.log('  BELEGBAR erst ab mehreren Erhebungen. Vorher waere jede Normierung geraten.');

console.log('\n══════════════════════════════════════════════════════════');
console.log(' B · Die Kennzahl');
console.log('══════════════════════════════════════════════════════════');

P('B1 · Binarisierung: zwei sehr verschiedene Lagen, dieselbe Zahl');
function bauen(werte){
  const d=A.leer();
  const O={NO3:[2010,3530],K:[3975,4800],Ca:[810,1275],Mg:[310,430],P:[360,530],S:[170,230],
           Fe:[0.8,1.6],Mn:[3,7],Zn:[1.6,2.25],B:[0.8,2.6],Cu:[0.3,0.5]};
  const mk=bl=>({id:'x'+bl,typ:'blattsaft',datum:'2026-08-18',satz:'28-478',blattalter:bl,zustand:null,
    werte:Object.fromEntries(Object.entries(werte).map(([k,v])=>[k,{wert:v}])),optima:JSON.parse(JSON.stringify(O))});
  d.analysen=[mk('jung'),mk('alt')];d.saetze={'28-478':{}};A.setDb(d);
  return A.erhebungen()[0];
}
const O={NO3:[2010,3530],K:[3975,4800],Ca:[810,1275],Mg:[310,430],P:[360,530],S:[170,230],
         Fe:[0.8,1.6],Mn:[3,7],Zn:[1.6,2.25],B:[0.8,2.6],Cu:[0.3,0.5]};
const knapp={},katastrophal={};
Object.entries(O).forEach(([k,v],i)=>{
  knapp[k]=i<5?v[0]*0.93:v[0]*1.1;           // 5 Naehrstoffe knapp darunter
  katastrophal[k]=i<5?v[0]*0.05:v[0]*1.1;    // dieselben 5 fast leer
});
const eA=bauen(knapp),eB=bauen(katastrophal);
console.log('Lage A – fuenf Naehrstoffe bei 93 % der Untergrenze:');
console.log('   Kennzahl',Math.round(eA.index.anteil*100)+' %','('+eA.index.ok+' von '+eA.index.n+')');
console.log('Lage B – dieselben fuenf bei 5 % der Untergrenze:');
console.log('   Kennzahl',Math.round(eB.index.anteil*100)+' %','('+eB.index.ok+' von '+eB.index.n+')');
console.log('\n→ Identische Kennzahl bei voellig verschiedener agronomischer Lage.');
console.log('  Die Zahl kann diese beiden Zustaende nicht unterscheiden.');

P('B2 · Gleichgewichtung gegen das Minimumgesetz');
basis();
const e=A.erhebungen()[0];
const lagen=A.kern().map(k=>{const b=e.bew[k];if(!b||b.fehlt)return null;
  const mass=(b.mass||b.werte).filter(w=>w.st!=null);
  const l=mass.map(w=>A.lage(w.wert,w.opt)).filter(x=>x!=null);
  return l.length?{k,lage:Math.min.apply(null,l),ab:A.abstand(Math.min.apply(null,l))}:null}).filter(Boolean);
lagen.sort((x,y)=>y.ab-x.ab);
console.log('Naehrstoff        Lage 0–3   Abstand zum Optimum');
lagen.forEach(x=>console.log((A.NAME[x.k]||x.k).padEnd(18)+x.lage.toFixed(2).padEnd(11)+x.ab.toFixed(2)));
const mittelAb=lagen.reduce((s,x)=>s+x.ab,0)/lagen.length;
console.log('\nMittelwert des Abstands   '+mittelAb.toFixed(2));
console.log('Maximum   (limitierend)   '+lagen[0].ab.toFixed(2)+'   → '+(A.NAME[lagen[0].k]));
console.log('\n→ Der Mittelwert sagt "'+(mittelAb<0.5?'maessig daneben':'deutlich daneben')+'". Das Minimumgesetz sagt:');
console.log('  '+A.NAME[lagen[0].k]+' limitiert, alles andere ist nachgeordnet.');
console.log('  Die App zeigt den Mittelwert und nennt den limitierenden Faktor nirgends.');

P('B3 · Unsicherheit der Kennzahl');
function wilson(k,n,z){z=z||1.96;const p=k/n,d=1+z*z/n;
  const m=(p+z*z/(2*n))/d,h=z*Math.sqrt(p*(1-p)/n+z*z/(4*n*n))/d;
  return [Math.max(0,m-h),Math.min(1,m+h)]}
basis();const er=A.erhebungen()[0];
const w=wilson(er.index.ok,er.index.n);
console.log('Angezeigt:  '+Math.round(er.index.anteil*100)+' %   ('+er.index.ok+' von '+er.index.n+')');
console.log('Wilson-95 %-Intervall:  '+Math.round(w[0]*100)+' % bis '+Math.round(w[1]*100)+' %');
console.log('Breite:  '+Math.round((w[1]-w[0])*100)+' Prozentpunkte');
console.log('\n→ Die Kennzahl wird als Punktzahl angezeigt und im Diagramm ueber die Zeit');
console.log('  verbunden. Bei dieser Breite ist jede Bewegung unter rund 50 Punkten');
console.log('  nicht von Zufall zu unterscheiden.');
console.log('  ANMERKUNG: Das Wilson-Intervall setzt unabhaengige Ziehungen voraus.');
console.log('  Naehrstoffe sind korreliert – das echte Intervall ist eher noch breiter.');
console.log('  Es taugt hier als Groessenordnung, nicht als exakte Angabe.');

console.log('\n══════════════════════════════════════════════════════════');
console.log(' C · lage() und ausmass()');
console.log('══════════════════════════════════════════════════════════');

P('C1 · lage() bedeutet je nach Optimum-Form etwas anderes');
const faelle=[['[lo,hi] = [100,200]',[100,200]],['[null,hi] = Nachweisgrenze <50',[null,50]],['[lo,null] = nur Untergrenze 100',[100,null]]];
console.log('Optimum-Form                      v=0.5·lo   v=lo    Mitte   v=hi   v=2·hi');
for(const [txt,o] of faelle){
  const lo=o[0]==null?0:o[0],hi=o[1]==null?lo*2:o[1];
  const pts=[lo?lo*0.5:hi*0.25,lo||hi*0.5,(lo+hi)/2,hi,hi*2];
  console.log(txt.padEnd(34)+pts.map(v=>{const l=A.lage(v,o);return l==null?'–':l.toFixed(2)}).map(s=>s.padEnd(9)).join(''));
}
console.log('\n→ Bei [lo,null] liefert lage() fuer JEDEN Wert ab lo denselben Wert 1,50.');
console.log('  Die Skala ist dort nicht mehr monoton informativ.');

P('C2 · Der Mittelwert von lage() ist bedeutungslos');
console.log('Zwei Erhebungen: einmal 0,20 (fast leer), einmal 2,80 (starker Ueberschuss)');
console.log('Mittelwert: '+((0.2+2.8)/2).toFixed(2)+'  → wird als "Mitte des Optimums" gelesen');
console.log('Tatsaechlich war der Naehrstoff NIE im Optimum.');
console.log('\nDiese Mittelung passiert in bilanz().mittel und wird im Ueberblick');
console.log('als Balken "mittlere Lage" angezeigt.');

P('C3 · ausmass() ist asymmetrisch');
console.log('Optimum [100,200]');
console.log('Wert    Richtung        ausmass()   log2(v/Grenze)');
for(const [v,txt] of [[50,'halbiert (unter)'],[25,'geviertelt'],[400,'verdoppelt (ueber)'],[800,'vervierfacht']]){
  const am=A.ausmass(v,[100,200]);
  const grenze=v<100?100:200;
  console.log(String(v).padEnd(8)+txt.padEnd(16)+am.toFixed(2).padEnd(12)+Math.abs(Math.log2(v/grenze)).toFixed(2));
}
console.log('\n→ Eine Halbierung ergibt 0,50 – eine Verdopplung 1,00. Gleiche biologische');
console.log('  Veraenderung, doppelte Zahl. ausmass() steuert die Sortierung der Befunde,');
console.log('  Ueberschuesse werden dadurch systematisch nach oben sortiert.');
console.log('  Ein logarithmisches Mass waere symmetrisch (rechte Spalte).');
