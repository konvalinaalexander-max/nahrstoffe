const A=require('./harness.js');
const ok=(b,t)=>console.log((b?'  BESTÄTIGT  ':'  nicht repro')+' · '+t);
const TABS=['vLage','vAnalysen','vNaehr','vKultur','vWirkung','vPlaner','vLogbuch','vKreis','vRund','vSaetze'];

function renderAlle(label){
  const bad=[];
  for(const t of TABS){
    try{const h=A[t]();A.nachRenderRun();
      if(/undefined|NaN|\[object Object\]/.test(h))bad.push(t+' (Text: '+(h.match(/undefined|NaN|\[object Object\]/g)||[]).join(',')+')');
    }catch(e){bad.push(t+' WIRFT: '+e.message)}
  }
  console.log(' '+label+': '+(bad.length?'AUFFÄLLIG → '+bad.join(' | '):'alle zehn Reiter sauber'));
  return bad;
}

console.log('=== Reiter rendern · leere Datenbank ===');
A.setDb(A.leer());renderAlle('leer');

console.log('\n=== Reiter rendern · gefüllte Datenbank ===');
const OPT={K:[4500,6000],Ca:[1600,2600],Mg:[400,700],NO3:[2010,4000],N_gesamt:[3000,5000],
  P:[700,1400],S:[400,900],Fe:[3,8],Mn:[1,4],Zn:[15,40],B:[30,60],Cu:[2,6],Na:[0,300],Cl:[0,1200],Si:[20,60]};
const mk=(satz,datum,bl,w)=>({id:satz+datum+bl,typ:'blattsaft',labor:'NovaCropControl',datum,satz,blattalter:bl,
  zustand:null,werte:Object.fromEntries(Object.entries(w).map(([k,v])=>[k,{wert:v}])),optima:JSON.parse(JSON.stringify(OPT))});
const j={K:4200,Ca:1200,Mg:320,NO3:42,N_gesamt:900,P:500,S:300,Fe:2.5,Mn:9.5,Zn:12,B:25,Cu:1.5,Na:210,Cl:900,Si:12};
const al={K:3900,Ca:1500,Mg:250,NO3:38,N_gesamt:850,P:460,S:280,Fe:1.8,Mn:8,Zn:10,B:22,Cu:0.9,Na:260,Cl:1100,Si:11};
const d=A.leer();
d.analysen=[mk('19-434','2025-05-12','jung',j),mk('19-434','2025-05-12','alt',al),
            mk('23-501','2025-06-20','jung',j),mk('23-501','2025-06-20','alt',al),
            {id:'sub1',typ:'substrat',labor:'Labor Ins AG',datum:'2025-05-10',satz:'19-434',parzelle:'19-434 gelb',
             blattalter:null,zustand:'gelb',werte:{pH:{wert:5.2},Nmin:{wert:40},Salz:{wert:1.2},sof_K2O:{wert:120}},optima:{}}];
d.saetze={'19-434':{},'23-501':{substrat:'neu Ökohum'}};
d.ereignisse=[{id:'e1',datum:'2025-06-01',typ:'Düngerwechsel',titel:'Wechsel auf Biorga',felder:{},geltung:'alle',saetze:[]}];
d.messungen=[{id:'m1',datum:'2025-05-20',ph:6.2,ec:1.4,ecFrisch:2.1,notiz:null}];
d.rundgaenge=[{id:'r1',datum:'2025-05-15',satz:'alle',kultur:'blass',notiz:null,
  eintraege:[{schaden:'mehltau',stufe:1},{schaden:'trauermuecken',stufe:2}]}];
A.setDb(d);renderAlle('gefüllt');

console.log('\n=== NEU · Kennzahl "Punkte gegenüber davor" vergleicht Ungleiches ===');
const erh=A.erhebungen();
const m=A.vLage().match(/([+-]?\d+) Punkte gegenüber davor/);
console.log('  Erhebung 1:',erh[0].satz,erh[0].datum,'· Erhebung 2:',erh[1].satz,erh[1].datum);
console.log('  Kennzahl im Überblick:',m?m[1]+' Punkte':'—');
ok(erh[0].satz!==erh[1].satz,'Die Kennzahl stellt zwei verschiedene Sätze als Verlauf dar, ohne das zu sagen');

console.log('\n=== NEU · Sätze ohne ableitbares Aussaatdatum verschwinden ganz ===');
const d2=A.leer();
d2.analysen=[mk('Tisch-Nord','2025-05-12','jung',j)];
d2.saetze={'Tisch-Nord':{}};A.setDb(d2);
console.log('  alleSaetze():',JSON.stringify(A.alleSaetze()));
console.log('  saetzeListe():',JSON.stringify(A.saetzeListe().map(s=>s.id)));
ok(A.alleSaetze().length===1&&A.saetzeListe().length===0,
   'Der Satz existiert, taucht aber weder im Planer noch in der Satztabelle auf');
const hs=A.vSaetze();
ok(/Noch keine Sätze/.test(hs),'Reiter «Sätze» meldet «Noch keine Sätze», obwohl eine Analyse dazu erfasst ist');

console.log('\n=== NEU · Apostroph im Logbuchtitel zerlegt den onclick-Aufruf im Planer ===');
const d3=A.leer();
d3.analysen=[mk('19-434','2025-05-12','jung',j)];
d3.saetze={'19-434':{aussaat:'2025-04-01'}};
d3.ereignisse=[{id:'e1',datum:'2025-05-20',typ:'Düngerwechsel',titel:"Peter's Mischung",felder:{},geltung:'alle',saetze:[]}];
A.setDb(d3);
const hp=A.vPlaner();
const btn=(hp.match(/onclick="planUebernehmen\([^"]*"/g)||[]).find(x=>/Peter/.test(x));
console.log('  erzeugtes Attribut:',btn||'(keiner)');
ok(!!btn&&/&#39;/.test(btn),'esc() macht aus \' ein &#39;, der Browser dekodiert es zurück → JS-Syntaxfehler beim Klick');
