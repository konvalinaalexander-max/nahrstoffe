const A=require('./harness.js');
const ok=(b,t)=>console.log((b?'  BESTÄTIGT  ':'  nicht repro')+' · '+t);
const db=A.leer();

// realistische Werte nach Angaben aus der Übergabe
const OPT={Zucker:[0.2,0.4],pH:[5.8,6.4],EC:[4,6],K:[4500,6000],Ca:[1600,2600],Mg:[400,700],
 Na:[0,300],NH4:[5,40],NO3:[2010,4000],N_gesamt:[3000,5000],Cl:[0,1200],S:[400,900],P:[700,1400],
 Si:[20,60],Fe:[3,8],Mn:[1,4],Zn:[15,40],B:[30,60],Cu:[2,6],Mo:[0.2,0.9],Al:[0.5,0.5]};
const mk=(satz,datum,blattalter,zustand,w)=>({id:satz+datum+blattalter+(zustand||''),typ:'blattsaft',
  labor:'NovaCropControl',datum,satz,blattalter,zustand:zustand||null,
  werte:Object.fromEntries(Object.entries(w).map(([k,v])=>[k,{wert:v}])),
  optima:JSON.parse(JSON.stringify(OPT))});

const jung={Zucker:1.1,pH:6.1,EC:2.1,K:4200,Ca:1200,Mg:320,Na:210,NH4:40,NO3:42,N_gesamt:900,
  Cl:900,S:300,P:500,Si:12,Fe:2.5,Mn:9.5,Zn:12,B:25,Cu:1.5,Mo:0.4,Al:0.5};
const alt ={Zucker:0.9,pH:6.0,EC:1.9,K:3900,Ca:1500,Mg:250,Na:260,NH4:35,NO3:38,N_gesamt:850,
  Cl:1100,S:280,P:460,Si:11,Fe:1.8,Mn:8.0,Zn:10,B:22,Cu:0.9,Mo:0.25,Al:0.5};

db.analysen=[mk('19-434','2025-05-12','jung',null,jung),mk('19-434','2025-05-12','alt',null,alt)];
db.saetze={'19-434':{}};
A.setDb(db);

console.log('=== 5.3 · Doppelzählung im Optimum-Index ===');
console.log('KERN =',A.KERN.join(', '));
const nStick=A.KERN.filter(k=>['NO3','N_gesamt','N_aus_NO3'].includes(k)).length;
ok(nStick>1,'Stickstoff steht '+nStick+'× in KERN (NO3 und N_gesamt), Bor 1× → N zählt doppelt');
ok(A.KERN.includes('Na')&&A.KERN.includes('Cl'),'Na und Cl sind Ballastionen und stehen trotzdem in KERN');

console.log('\n=== NEU · index() zählt jung und alt beide, bilanz() nur das Leitblatt ===');
const e=A.erhebungen();
console.log('Erhebungen:',e.length,'| index n =',e[0].index.n,'ok =',e[0].index.ok,
            '→',Math.round(e[0].index.anteil*100)+' %');
const kernGemessen=A.KERN.filter(k=>jung[k]!=null).length;
console.log('Kernnährstoffe je Probe mit Optimum:',kernGemessen,'· Proben in der Erhebung:',e[0].liste.length);
ok(e[0].index.n===kernGemessen*2,'Nenner ist '+e[0].index.n+' = '+kernGemessen+'×2, jung und alt fliessen beide ein');
const b=A.bilanz();
ok(b[0].n===1,'bilanz() rechnet dagegen nur mit dem Leitblatt (n='+b[0].n+' je Nährstoff)');

console.log('\n=== NEU · leitProbe bevorzugt "jung" – mobile Mängel werden untergewichtet ===');
const bMg=b.find(x=>x.k==='Mg');
console.log('Mg jung',jung.Mg,'| Mg alt',alt.Mg,'| Optimum ab',OPT.Mg[0]);
console.log('bilanz() Mg:',bMg.ok,'von',bMg.n,'im Optimum, mittlere Lage',bMg.mittel.toFixed(2));
ok(A.leitProbe(e[0])===e[0].proben.jung,'leitProbe() nimmt immer das Jungblatt, auch bei phloemmobilen Nährstoffen');

console.log('\n=== 5.3 · erhebungen() trennt grün und gelb am selben Tag ===');
const db2=A.leer();
db2.analysen=[mk('19-434','2025-05-12','jung','grün',jung),mk('19-434','2025-05-12','alt','grün',alt),
              mk('19-434','2025-05-12','jung','gelb',jung),mk('19-434','2025-05-12','alt','gelb',alt)];
db2.saetze={'19-434':{}};A.setDb(db2);
const e2=A.erhebungen();
console.log('Erhebungen:',e2.length,'| Daten:',e2.map(x=>x.datum+'/'+x.zustand).join('  '));
ok(e2.length===2&&e2[0].datum===e2[1].datum,'zwei Erhebungen mit identischem Datum → Balken überlagern sich im Index-Diagramm');
A.setDb(db);

console.log('\n=== NEU · Regelwerk: Na und Cl erzeugen agronomisch falsche Empfehlungen ===');
const dbNa=A.leer();
const jungNa={...jung,Na:50,Cl:200};   // Na und Cl UNTER der Untergrenze
const altNa ={...alt, Na:40,Cl:180};
const OPT2={...OPT,Na:[100,300],Cl:[300,1200]};
const mk2=(bl,w)=>({id:'x'+bl,typ:'blattsaft',datum:'2025-05-12',satz:'19-434',blattalter:bl,zustand:null,
  werte:Object.fromEntries(Object.entries(w).map(([k,v])=>[k,{wert:v}])),optima:JSON.parse(JSON.stringify(OPT2))});
dbNa.analysen=[mk2('jung',jungNa),mk2('alt',altNa)];dbNa.saetze={'19-434':{}};
A.setDb(dbNa);
const f=A.befunde(A.erhebungen()[0]);
const fNa=f.filter(x=>x.param==='Na'||x.param==='Cl');
fNa.forEach(x=>console.log('  →',x.titel,'\n     TUN:',x.tun));
ok(fNa.some(x=>/Zufuhr von Natrium erh/.test(x.tun)),'Die App empfiehlt, Natrium zu düngen');
ok(fNa.some(x=>/Zufuhr von Chlorid erh/.test(x.tun)),'Die App empfiehlt, Chlorid zu düngen');
A.setDb(db);
