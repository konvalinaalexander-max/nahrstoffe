const A=require('./harness.js');
let fehler=0;
const ok=(b,t)=>{if(!b)fehler++;console.log((b?'  ✓ ':'  ✗ FEHLER ')+t)};
const TABS=['vLage','vAnalysen','vNaehr','vWirkung','vSubstrat','vLogbuch','vRund','vPlaner','vSaetze'];
function alleReiter(label){
  const bad=[];
  for(const t of TABS){
    try{const h=A[t]();A.nachRenderRun();
      const m=(h.match(/undefined|NaN|\[object Object\]/g)||[]);
      if(m.length)bad.push(t+' → '+m.join(','));
    }catch(e){bad.push(t+' WIRFT: '+e.message)}
  }
  ok(!bad.length,label+(bad.length?' → '+bad.join(' | '):' – alle neun Reiter sauber'));
}

console.log('════ 7 · Alle Reiter rendern ════');
A.setDb(A.leer());alleReiter('leere Datenbank');

const r=A.parseNCC(require('./seiten.json'));
const d=A.leer();
d.analysen=r.proben.map((p,i)=>Object.assign({id:'p'+i,typ:'blattsaft',labor:r.labor},p));
d.analysen.push({id:'s1',typ:'substrat',labor:'Labor Ins AG',datum:'2026-08-14',satz:'28-478',tiefe:5,
  blattalter:null,zustand:'grün',parzelle:'28-478 grün 5cm',
  werte:{sub_pH:{wert:5.2},sub_Nmin:{wert:22},sub_Salz:{wert:1.4},sof_K2O:{wert:180},sof_Mg:{wert:95},sof_Ca:{wert:260},sub_Mn:{wert:14}},optima:{}});
d.analysen.push({id:'g1',typ:'giesswasser',datum:'2026-08-01',satz:null,blattalter:null,zustand:null,
  werte:{gw_pH:{wert:7.4},gw_EC:{wert:0.6},gw_Na:{wert:18},gw_Cl:{wert:26},gw_Ca:{wert:88},gw_HCO3:{wert:290}},optima:{}});
d.saetze={'28-478':{substrat:'Ökohum neu',tisch:'Tisch 3'}};
d.ereignisse=[{id:'e1',datum:'2026-08-05',typ:'Düngerwechsel',titel:"Peter's Mischung",felder:{neu:'Biorga'},geltung:'saetze',saetze:['28-478']}];
d.messungen=[{id:'m1',datum:'2026-08-10',ph:6.2,ec:1.4,ecFrisch:2.1,temp:23.5,notiz:null}];
d.rundgaenge=[{id:'r1',datum:'2026-08-12',satz:'28-478',kultur:'blass',notiz:null,
  eintraege:[{schaden:'mehltau',stufe:1},{schaden:'trauermuecken',stufe:2}]}];
A.setDb(d);alleReiter('gefüllte Datenbank');

console.log('\n════ 8 · Behoben: Sätze ohne Aussaatdatum verschwinden nicht mehr ════');
const d2=A.leer();
d2.analysen=[{id:'x',typ:'blattsaft',datum:'2026-05-12',satz:'Tisch-Nord',blattalter:'jung',zustand:null,
  werte:{K:{wert:4200}},optima:{K:[4500,6000]}}];
d2.saetze={'Tisch-Nord':{}};A.setDb(d2);
console.log('   alleSaetze():',JSON.stringify(A.alleSaetze()),'· saetzeListe():',JSON.stringify(A.saetzeListe().map(s=>s.id)));
ok(A.saetzeListe().length===1,'Ein Satz ohne ableitbares Aussaatdatum bleibt in der Liste');
const hs=A.vSaetze();
ok(!/Noch keine Sätze/.test(hs)&&/Tisch-Nord/.test(hs),'Er erscheint im Reiter «Sätze», wo man das Datum nachtragen kann');
ok(/fehlt/.test(hs),'Und ist als «fehlt» markiert');

console.log('\n════ 9 · Behoben: Apostroph im Logbuchtitel ════');
A.setDb(d);
const hp=A.vPlaner();
ok(hp.indexOf('&#39;s Mischung')<0||hp.indexOf("planUebernehmen")<0,'Keine zusammengesetzten onclick-Aufrufe mehr');
ok(/data-tun="planAus" data-i="\d+"/.test(hp)||!/vorschlag/.test(hp),'Vorschläge werden über einen Index angesprochen, nicht über Text');
ok(hp.indexOf('onclick=')<0,'Der Planer enthält kein einziges onclick-Attribut');
const alleHtml=TABS.map(t=>{try{return A[t]()}catch(e){return ''}}).join('');
ok(alleHtml.indexOf('onclick=')<0,'Keine der neun Ansichten erzeugt onclick-Attribute');

console.log('\n════ 10 · Behoben: KPI vergleicht nicht mehr verschiedene Sätze ════');
const d3=A.leer();
const mk=(satz,datum,bl,w)=>({id:satz+datum+bl,typ:'blattsaft',datum,satz,blattalter:bl,zustand:null,
  werte:Object.fromEntries(Object.entries(w).map(([k,v])=>[k,{wert:v}])),
  optima:{K:[4500,6000],Ca:[1600,2600],Mg:[400,700],NO3:[2010,4000],P:[700,1400],S:[400,900],
          Fe:[3,8],Mn:[1,4],Zn:[15,40],B:[30,60],Cu:[2,6]}});
const wv={K:4200,Ca:1200,Mg:320,NO3:42,P:500,S:300,Fe:2.5,Mn:9.5,Zn:12,B:25,Cu:1.5};
d3.analysen=[mk('19-434','2026-05-12','jung',wv),mk('19-434','2026-05-12','alt',wv),
             mk('23-501','2026-06-20','jung',wv),mk('23-501','2026-06-20','alt',wv)];
d3.saetze={'19-434':{},'23-501':{}};A.setDb(d3);
const hl=A.vLage();
ok(/kein Verlauf/.test(hl),'Die Kachel sagt ausdrücklich, dass zwei verschiedene Sätze kein Verlauf sind');
ok(!/Punkte gegenüber/.test(hl),'Und behauptet keine Punktedifferenz');
d3.analysen.push(mk('23-501','2026-07-20','jung',wv),mk('23-501','2026-07-20','alt',wv));
A.setDb(d3);
const hl2=A.vLage();
ok(/Punkte gegenüber der vorigen Erhebung desselben Satzes/.test(hl2),'Bei zwei Erhebungen desselben Satzes wird die Differenz gezeigt');

console.log('\n════ 11 · Behoben: Zeitachse des Index-Diagramms ════');
const d4=A.leer();
d4.analysen=[mk('19-434','2026-05-12','jung',wv),mk('19-434','2026-06-12','jung',wv)];
d4.saetze={'19-434':{}};
d4.ereignisse=[{id:'e9',datum:'2019-01-01',typ:'Sonstiges',titel:'Altlast',felder:{},geltung:'alle',saetze:[]}];
A.setDb(d4);
const box={clientWidth:900,innerHTML:''};
A.chartIndex(box,A.erhebungen());
const xs=[...box.innerHTML.matchAll(/<rect x="([\d.-]+)"/g)].map(m=>+m[1]);
console.log('   Balken-x bei einem Eintrag von 2019:',xs.map(x=>x.toFixed(0)).join(', '),'(Breite 900)');
ok(xs.length>0&&Math.min(...xs)<300,'Ein alter Logbucheintrag staucht das Diagramm nicht mehr');
ok(/Eintrag davor/.test(box.innerHTML),'Stattdessen wird am Rand vermerkt, dass Einträge ausserhalb liegen');

console.log('\n════ 12 · Erhebungen am selben Tag (grün und gelb) ════');
const d5=A.leer();
d5.analysen=[Object.assign(mk('19-434','2026-05-12','jung',wv),{id:'a',zustand:'grün'}),
             Object.assign(mk('19-434','2026-05-12','jung',wv),{id:'b',zustand:'gelb'})];
d5.saetze={'19-434':{}};A.setDb(d5);
const box2={clientWidth:900,innerHTML:''};
A.chartIndex(box2,A.erhebungen());
const xs2=[...box2.innerHTML.matchAll(/<rect x="([\d.-]+)"/g)].map(m=>+m[1]);
console.log('   zwei Balken am selben Datum bei x =',xs2.map(x=>x.toFixed(0)).join(', '));
ok(xs2.length===2&&Math.abs(xs2[0]-xs2[1])>4,'Grün und gelb desselben Tages überlagern sich nicht mehr');

process.exit(fehler?1:0);
