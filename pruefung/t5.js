const A=require('./harness.js');
const ok=(b,t)=>console.log((b?'  BESTÄTIGT  ':'  nicht repro')+' · '+t);
const heute=new Date().toISOString().slice(0,10);
const plus=(d,t)=>{const x=new Date(d);x.setUTCDate(x.getUTCDate()+t);return x.toISOString().slice(0,10)};
const OPT={K:[4500,6000],Ca:[1600,2600],Mg:[400,700],NO3:[2010,4000]};
const mk=(satz,datum,bl,w)=>({id:satz+datum+bl,typ:'blattsaft',datum,satz,blattalter:bl,zustand:null,
  werte:Object.fromEntries(Object.entries(w).map(([k,v])=>[k,{wert:v}])),optima:JSON.parse(JSON.stringify(OPT))});
const j={K:4200,Ca:1200,Mg:320,NO3:42};

const d=A.leer();
const aussaat=plus(heute,-28);
d.analysen=[mk('19-434',plus(heute,-21),'jung',j)];
d.saetze={'19-434':{aussaat}};
d.ereignisse=[{id:'e1',datum:plus(heute,-14),typ:'Düngerwechsel',titel:"Peter's Mischung",felder:{},geltung:'alle',saetze:[]}];
A.setDb(d);
console.log('heute:',heute,'· Aussaat:',aussaat,'· Ereignis:',d.ereignisse[0].datum);
console.log('Vorschläge:',A.vorschlaege().map(v=>v.art+': '+v.titel));
const hp=A.vPlaner();
const btns=hp.match(/onclick="planUebernehmen\([^"]*"/g)||[];
btns.forEach(b=>console.log('  Attribut:',b));
const kaputt=btns.find(x=>/&#39;/.test(x));
ok(!!kaputt,'Ein Apostroph aus dem Logbuchtitel landet als &#39; im onclick — der Browser dekodiert ihn zurück zu \' und bricht den JS-String auf');

console.log('\n=== NEU · Reihenfolge in umschalten(): render() läuft vor aend() ===');
const src=require('fs').readFileSync(__dirname+'/app.js','utf8');
const zeile=src.split('\n').find(l=>/umschalten\(db\.plan\.begleitet/.test(l));
console.log('  '+zeile.trim().slice(0,140));
ok(/umschalten\([^)]*\);aend\(\)/.test(zeile),
   'umschalten() rendert, erst danach setzt aend() dirty=true → «ungesicherte Änderungen» erscheint erst beim nächsten Rendern');

console.log('\n=== NEU · chartIndex spannt die Zeitachse über ALLE Logbuchdaten ===');
const d2=A.leer();
d2.analysen=[mk('19-434','2025-05-12','jung',j),mk('19-434','2025-06-12','jung',j)];
d2.saetze={'19-434':{aussaat:'2025-04-01'}};
d2.ereignisse=[{id:'e9',datum:'2019-01-01',typ:'Sonstiges',titel:'Altlast',felder:{},geltung:'alle',saetze:[]}];
A.setDb(d2);
const box={clientWidth:900,innerHTML:''};
A.chartIndex(box,A.erhebungen());
const xs=[...box.innerHTML.matchAll(/<rect x="([\d.-]+)"/g)].map(m=>+m[1]);
console.log('  Balken-x-Positionen bei einem Logbucheintrag von 2019:',xs.map(x=>x.toFixed(0)).join(', '),'(Breite 900)');
ok(xs.length>0&&Math.min(...xs)>800,'Ein einzelner alter Logbucheintrag drückt alle Messbalken an den rechten Rand');

console.log('\n=== NEU · ausKW verschiebt rückwirkend jedes Alter, wenn eine ältere Analyse nachkommt ===');
const d3=A.leer();
d3.analysen=[mk('19-434','2025-06-01','jung',j)];d3.saetze={'19-434':{}};A.setDb(d3);
const v1=A.alter(d3.analysen[0]);
console.log('  vorher :',v1.aussaat,'→ Woche',v1.woche);
d3.analysen.unshift(mk('19-434','2025-05-01','jung',j));A.setDb(d3);
const v2=A.alter(d3.analysen[1]);
console.log('  nachher:',v2.aussaat,'→ Woche',v2.woche,'  (dieselbe Probe vom 01.06.)');
ok(v1.woche!==v2.woche||v1.aussaat!==v2.aussaat,'Das Nachtragen einer älteren Analyse ändert rückwirkend das Alter aller Proben des Satzes');
