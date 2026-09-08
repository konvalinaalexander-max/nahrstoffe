const A=require('./harness.js');
let fehler=0;
const ok=(b,t)=>{if(!b)fehler++;console.log((b?'  ✓ ':'  ✗ FEHLER ')+t)};
const r=A.parseNCC(require('./seiten.json'));

console.log('════ 17 · NEU: Angebot gegen Aufnahme ════');
function bau(sub){
  const d=A.leer();
  d.analysen=r.proben.map((p,i)=>Object.assign({id:'p'+i,typ:'blattsaft',labor:r.labor},JSON.parse(JSON.stringify(p))));
  d.analysen.push(Object.assign({id:'s1',typ:'substrat',labor:'Labor Ins AG',datum:'2026-08-14',satz:'28-478',
    tiefe:5,blattalter:null,zustand:null,optima:{}},{werte:sub}));
  d.saetze={'28-478':{}};A.setDb(d);return d;
}
/* Fall A: im Substrat ist Kalium reichlich, im Blattsaft fehlt es → Aufnahmeproblem */
bau({sub_pH:{wert:5.2},sub_Nmin:{wert:22},sof_K2O:{wert:210},sof_Mg:{wert:95},sof_Ca:{wert:260}});
let h=A.vSubstrat();
console.log('   K sofort 210 (Richtwert 80–250) bei Blattsaft-Kalium 1040 von 3975');
ok(/Aufnahmeproblem/.test(h),'Wird als Aufnahmeproblem eingeordnet: «mehr desselben Düngers wirkt hier kaum»');
ok(/Ammonium konkurriert mit Kalium/.test(h),'Mit dem passenden agronomischen Hinweis');
console.log('   Nmin 22 (Richtwert 50–150) bei Nitrat 36 von 2010');
ok(/Es fehlt am Angebot, nicht an der Aufnahme/.test(h),'Stickstoff wird dagegen als Angebotsproblem eingeordnet');
ok(/Unter pH 5,5 wird Mangan stark verfügbar/.test(h),'Der Substrat-pH 5,2 erklärt das hohe Mangan');

/* Fall B: im Substrat ist auch Kalium knapp → Angebotsproblem */
bau({sub_pH:{wert:6.2},sub_Nmin:{wert:20},sof_K2O:{wert:40},sof_Mg:{wert:95},sof_Ca:{wert:260}});
h=A.vSubstrat();
const kAbschnitt=h.slice(h.indexOf('Kalium:'),h.indexOf('Kalium:')+240);
console.log('   K sofort 40 (Richtwert 80–250) bei Blattsaft-Kalium 1040 →',kAbschnitt.replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').slice(0,110));
ok(/Beides ist tief/.test(kAbschnitt),'Bei knappem Angebot UND knapper Aufnahme: «Zudüngen wirkt hier»');
ok(/Annahme/.test(h),'Die Substrat-Richtwerte sind als Annahme gekennzeichnet');
ok(/Labor Ins liefert zu Substratproben (keine|<strong>keine)/.test(h)||/keine<\/strong> Optimum-Bereiche|keine Optimum-Bereiche/.test(h),
   'Und es steht dabei, dass das Labor keine Optima liefert');

console.log('\n════ 18 · NEU: Vergleichsgruppe im Reiter Wirkung ════');
const d=A.leer();
const O={K:[3975,4800],Ca:[810,1275],Mg:[310,430],NO3:[2010,3530],P:[360,530],S:[170,230],
         Fe:[0.8,1.6],Mn:[3,7],Zn:[1.6,2.25],B:[0.8,2.6],Cu:[0.3,0.5]};
const mk=(satz,datum,bl,fak)=>({id:satz+datum+bl,typ:'blattsaft',datum,satz,blattalter:bl,zustand:null,
  werte:Object.fromEntries(Object.entries(O).map(([k,v])=>[k,{wert:v[0]*fak}])),
  optima:JSON.parse(JSON.stringify(O))});
d.analysen=[
  mk('28-478','2026-08-20','jung',1.1),mk('28-478','2026-08-20','alt',1.1),   // betroffen, gut
  mk('30-500','2026-08-22','jung',0.5),mk('30-500','2026-08-22','alt',0.5)];  // nicht betroffen, schlecht
d.saetze={'28-478':{},'30-500':{}};
d.ereignisse=[{id:'e1',datum:'2026-08-10',typ:'Neues Substrat / Grunddüngung',titel:'Ökohum neu',
  felder:{substrat:'Ökohum'},geltung:'saetze',saetze:['28-478']}];
A.setDb(d);
/* Die Wirkungsanalyse ist vom eigenen Reiter in einen Dialog am
   Logbucheintrag gewandert – die Vergleichsgruppe ist dabei erhalten. */
A.AKTION.wirkung({id:'e1'});
const hw=global.document.getElementById('dlgBody').innerHTML;
ok(/Vergleichsgruppe/.test(hw),'Der Abschnitt Vergleichsgruppe erscheint');
ok(/Betroffen \(28-478\)/.test(hw),'Die betroffenen Sätze werden benannt');
ok(/Nicht betroffen/.test(hw),'Die Kontrollgruppe ebenso');
const m=hw.match(/Prozentpunkte zugunsten der (\w+)/);
console.log('   Unterschied:',(hw.match(/(-?\d+) Prozentpunkte zugunsten der \w+/)||[])[0]);
ok(/Prozentpunkte zugunsten/.test(hw),'Der Unterschied wird beziffert');
ok(/noch kein Beweis/.test(hw),'Und ausdrücklich nicht als Beweis ausgegeben');

console.log('\n════ 19 · NEU: Vorschlag, die Vergleichsgruppe zu vervollständigen ════');
/* Relativ zu heute, sonst laeuft dieser Test mit dem Kalender ab: ein Satz
   mit festem Aussaatdatum ist irgendwann nicht mehr «laufend». */
const tagVor=n=>{const d=new Date();d.setUTCDate(d.getUTCDate()-n);return d.toISOString().slice(0,10)};
const d2=A.leer();
d2.analysen=[mk('28-478',tagVor(18),'jung',1.1)];
d2.saetze={'28-478':{aussaat:tagVor(28)},'30-500':{aussaat:tagVor(21)}};
d2.ereignisse=[{id:'e1',datum:tagVor(28),typ:'Neues Substrat / Grunddüngung',titel:'Ökohum neu',
  felder:{},geltung:'saetze',saetze:['28-478']}];
A.setDb(d2);
const v=A.vorschlaege();
console.log('   Vorschläge:',v.map(x=>x.art+' · '+x.titel).join('\n                '));
ok(v.some(x=>x.art==='gruppe'),'Die App schlägt vor, den unbetroffenen Satz als Vergleichsgruppe zu beproben');

console.log('\n════ 20 · Wiederkehrende Befunde ════');
const d3=A.leer();
d3.analysen=[
  mk('28-478','2026-06-01','jung',0.4),mk('28-478','2026-06-01','alt',0.4),
  mk('28-478','2026-07-01','jung',0.4),mk('28-478','2026-07-01','alt',0.4),
  mk('30-500','2026-08-01','jung',0.4),mk('30-500','2026-08-01','alt',0.4)];
d3.saetze={'28-478':{},'30-500':{}};A.setDb(d3);
const wk=A.wiederkehrend();
console.log('   ',wk.slice(0,4).map(x=>x.n+'x '+x.titel).join(' | '));
ok(wk.length>0,'Befunde, die mehrfach auftraten, werden gesammelt');
ok(wk[0].n===3,'Und richtig gezählt (3 Erhebungen mit demselben Muster)');
ok(/Was immer wieder auftritt/.test(A.vLage()),'Sie erscheinen im Überblick');

process.exit(fehler?1:0);
