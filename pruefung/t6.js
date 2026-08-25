const A=require('./harness.js');
const ok=(b,t)=>console.log((b?'  BESTÄTIGT  ':'  nicht repro')+' · '+t);
const OPT={K:[4500,6000],Ca:[1600,2600],Mg:[400,700],NO3:[2010,4000]};
const mk=(satz,datum,bl,w)=>({id:satz+datum+bl,typ:'blattsaft',datum,satz,blattalter:bl,zustand:null,
  werte:Object.fromEntries(Object.entries(w).map(([k,v])=>[k,{wert:v}])),optima:JSON.parse(JSON.stringify(OPT))});
const j={K:4200,Ca:1200,Mg:320,NO3:42};

console.log('=== 5.3 · Reiter Wirkung mischt Ganzhaus- und Satz-Rundgänge ===');
const d=A.leer();
d.analysen=[mk('19-434','2025-05-01','jung',j),mk('19-434','2025-06-01','jung',j)];
d.saetze={'19-434':{aussaat:'2025-04-01'}};
d.ereignisse=[{id:'e1',datum:'2025-05-15',typ:'Düngerwechsel',titel:'Wechsel',felder:{},
  geltung:'saetze',saetze:['19-434']}];
d.rundgaenge=[
 {id:'r1',datum:'2025-05-05',satz:'19-434',kultur:null,notiz:null,eintraege:[{schaden:'mehltau',stufe:1}]},
 {id:'r2',datum:'2025-05-06',satz:'99-999',kultur:null,notiz:null,eintraege:[{schaden:'mehltau',stufe:3}]},
 {id:'r3',datum:'2025-05-20',satz:'19-434',kultur:null,notiz:null,eintraege:[{schaden:'mehltau',stufe:1}]}];
A.setDb(d);
const h=A.vWirkung();
const zeile=(h.match(/<tr><td>Falscher Mehltau<\/td>[\s\S]*?<\/tr>/)||[''])[0];
console.log('  Ereignis gilt nur für Satz 19-434.');
console.log('  Rundgänge davor: Satz 19-434 Stufe 1, Satz 99-999 Stufe 3');
console.log('  Tabellenzeile:',zeile.replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim());
ok(/2\.0/.test(zeile),'Mittelwert 2,0 = (1+3)/2 → der fremde Satz 99-999 wird mitgemittelt, obwohl das Ereignis nur 19-434 betrifft');

console.log('\n=== NEU · Wirkung vergleicht nur EIN Blattalter ===');
const d2=A.leer();
d2.analysen=[mk('19-434','2025-05-01','jung',j),mk('19-434','2025-05-01','alt',{...j,Mg:250}),
             mk('19-434','2025-06-01','jung',j),mk('19-434','2025-06-01','alt',{...j,Mg:600})];
d2.saetze={'19-434':{aussaat:'2025-04-01'}};
d2.ereignisse=[{id:'e1',datum:'2025-05-15',typ:'Düngerwechsel',titel:'Wechsel',felder:{},geltung:'alle',saetze:[]}];
A.setDb(d2);
const h2=A.vWirkung();
console.log('  Mg alt: 250 → 600 (deutliche Erholung im Altblatt), Mg jung unverändert 320');
console.log('  ausgewertetes Blattalter:',(h2.match(/Blattalter (\w+)/)||[])[1]);
ok(/Blattalter jung/.test(h2),'Nur das Jungblatt wird verglichen; die Erholung im Altblatt bleibt unsichtbar');

console.log('\n=== NEU · bezugFuer() zieht auch Substratproben heran ===');
const d3=A.leer();
d3.analysen=[mk('19-434','2025-05-10','jung',j)];
d3.saetze={'19-434':{}};A.setDb(d3);
console.log('  nur Blattsaft 10.05.  → Aussaat',A.aussaatVon('19-434').datum);
d3.analysen.push({id:'s1',typ:'substrat',datum:'2025-05-02',satz:'19-434',blattalter:null,zustand:null,
  werte:{pH:{wert:5.2}},optima:{}});
A.setDb(d3);
console.log('  + Substratprobe 02.05. → Aussaat',A.aussaatVon('19-434').datum);
ok(A.aussaatVon('19-434').datum.startsWith('2024'),
   'Eine Substratprobe vor dem Beginn der Namens-KW kippt das abgeleitete Aussaatdatum um ein ganzes Jahr zurück');
