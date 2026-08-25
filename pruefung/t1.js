const A=require('./harness.js');
const ok=(b,t)=>console.log((b?'  BESTÄTIGT  ':'  nicht repro')+' · '+t);

// --- Parser: synthetische NCC-Seite im Format, das der Parser erwartet ---
const seite=[
 'NovaCropControl Pflanzensaft-Probe',
 'Probendatum: 12-05-2025',
 'Anbau: Basilikum 19-434',
 'Lage/Grundstück: Gewaechshaus 3',
 'Hinweise Bestand teilweise gelb Parameter',
 'Pflanzenteil: 1 Blatt (Jung) 2 Blatt (Alt)',
 'Zucker 1,10 0,20 - 0,40',
 '0,90',
 'pH 6,10 5,80 - 6,40',
 '6,00',
 'EC 2,10 4,00 - 6,00',
 '1,90',
 'K - Kalium 4200 4500 - 6000',
 '3900',
 'Ca - Kalzium 1200 1600 - 2600',
 '1500',
 'Mg - Magnesium 320 400 - 700',
 '250',
 'Na - Natrium 210 0 - 300',
 '260',
 'NH4 - Ammonium 40 5 - 40',
 '35',
 'NO3 - Nitrat 42 2010 - 4000',
 '38',
 'N - Gesamt Stickstoff 900 3000 - 5000',
 '850',
 'Cl - Chlorid 900 0 - 1200',
 '1100',
 'S - Schwefel 300 400 - 900',
 '280',
 'P - Phosphor 500 700 - 1400',
 '460',
 'Si - Silizium 12 20 - 60',
 '11',
 'Fe - Eisen 2 3,00 - 8,00',
 '1,80',
 'Mn - Mangan 9,50 1,00 - 4,00',
 '8,00',
 'Zn - Zink 12,00 15,00 - 40,00',
 '10,00',
 'B - Bor 25,00 30,00 - 60,00',
 '22,00',
 'Cu - Kupfer 1 2,00 - 6,00',
 '0,90',
 'Mo - Molybdän 0,40 0,20 - 0,90',
 '0,25',
 'Al - Aluminium <0,50 <0,50 - <0,50',
 '<0,50'
];
const r=A.parseNCC([seite]);
console.log('\n=== Parser NovaCropControl ===');
console.log('Proben:',r.proben.length,'| Satz:',r.proben[0].satz,'| Datum:',r.proben[0].datum,
            '| Blattalter:',r.proben.map(p=>p.blattalter).join('/'),'| Zustand:',r.proben[0].zustand);
console.log('Parameter jung:',Object.keys(r.proben[0].werte).length,' alt:',Object.keys(r.proben[1].werte).length);
console.log('Hinweise:',r.hinweise);

console.log('\n=== 5.3 · optima wird geteilt ===');
ok(r.proben[0].optima===r.proben[1].optima,'proben[0].optima IST dasselbe Objekt wie proben[1].optima');
r.proben[0].optima.K=[9999,9999];
ok(r.proben[1].optima.K[0]===9999,'Änderung an Probe 1 schlägt auf Probe 2 durch (K jetzt '+r.proben[1].optima.K[0]+')');
r.proben[0].optima.K=[4500,6000];

console.log('\n=== 5.3 · Aluminium-Optimum [0,5 · 0,5] ===');
console.log('gelesenes Al-Optimum:',JSON.stringify(r.proben[0].optima.Al));
const al=0.5;
console.log('status(0,5,[0,5;0,5]) =',A.status(al,[0.5,0.5]),' → zaehlt als "im Optimum"');
console.log('lage(0,5,[0,5;0,5])   =',A.lage(al,[0.5,0.5]),' → Band "ueber Optimum"');
ok(A.status(al,[0.5,0.5])==='ok'&&A.lage(al,[0.5,0.5])>2,'status() und lage() widersprechen sich beim selben Wert');

console.log('\n=== NEU · putz() loescht Messwerte, die genau 1 oder 2 sind ===');
console.log("putz('Cu - Kupfer 1 2,00 - 6,00') → ",JSON.stringify(A.putz('Cu - Kupfer 1 2,00 - 6,00')));
console.log("putz('Fe - Eisen 2 3,00 - 8,00')  → ",JSON.stringify(A.putz('Fe - Eisen 2 3,00 - 8,00')));
console.log('gelesener Cu-Wert jung:',r.proben[0].werte.Cu?.wert,'(im Text stand 1)');
console.log('gelesener Fe-Wert jung:',r.proben[0].werte.Fe?.wert,'(im Text stand 2)');
ok(r.proben[0].werte.Cu?.wert!==1,'Cu = 1 wurde vom Parser verschluckt bzw. verfaelscht');
ok(r.proben[0].werte.Fe?.wert!==2,'Fe = 2 wurde vom Parser verschluckt bzw. verfaelscht');

console.log('\n=== 5.1 · limit-Feld ===');
console.log('Al jung:',JSON.stringify(r.proben[0].werte.Al));
ok(r.proben[0].werte.Al&&r.proben[0].werte.Al.limit===true,'limit:true wird erfasst (Anzeige folgt spaeter im Test 2)');
