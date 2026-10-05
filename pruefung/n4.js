const A=require('./harness.js');
let fehler=0;
const ok=(b,t)=>{if(!b)fehler++;console.log((b?'  ✓ ':'  ✗ FEHLER ')+t)};

console.log('════ Migration einer Sicherung im alten Format 3 ════');
/* So sah eine Datei der ersten Fassung aus: limit statt unter, Substratwerte im
   Blattsaft-Namensraum, Al-Optimum als Spanne [0,5;0,5], Logbuch mit Freitext. */
const alt3={schema:3,version:7,gespeichert:'2026-08-01T10:00:00.000Z',
  analysen:[
    {id:'a1',typ:'blattsaft',labor:'NovaCropControl',datum:'2026-08-18',satz:'28-478',blattalter:'jung',zustand:null,
     werte:{K:{wert:1040},Mo:{wert:0.05,limit:true},Al:{wert:1.03,limit:false},NO3:{wert:36},Ca:{wert:814}},
     optima:{K:[3975,4800],Mo:[null,0.05],Al:[0.5,0.5],NO3:[2010,3530],Ca:[810,1275]}},
    {id:'a2',typ:'substrat',labor:'Labor Ins AG',datum:'2026-08-14',satz:'28-478',blattalter:null,zustand:null,
     parzelle:'28-478 grün',
     werte:{pH:{wert:5.2},Nmin:{wert:22},Salz:{wert:1.4},Mn:{wert:14},sof_K2O:{wert:180}},optima:{}}],
  ereignisse:[{id:'e1',datum:'2026-08-05',typ:'Düngerwechsel',titel:'Biorga',felder:{},geltung:'alle',saetze:[]},
    {id:'e2',datum:'2026-08-07',typ:'pH-Korrektur',titel:'Säure',felder:{saeure:'zitronensaeure',menge:'2,5 l'},geltung:'alle',saetze:[]},
    {id:'e3',datum:'2026-08-08',typ:'Sonstiges',titel:'Notiz',felder:{text:'Pumpe getauscht'},geltung:'alle',saetze:[]}],
  messungen:[{id:'m1',datum:'2026-08-10',ph:6.2,ec:1.4,ecFrisch:2.1,notiz:null}],
  rundgaenge:[{id:'r1',datum:'2026-08-12',satz:'alle',kultur:'blass',notiz:null,eintraege:[{schaden:'mehltau',stufe:1}]}],
  saetze:{'28-478':{substrat:'Ökohum'}},
  eigeneOptima:{},
  plan:{zielwochen:[2,4,6],begleitet:[],geplant:[]},
  einst:{verlagerung:1.3,kMg:8,kCa:3,dauerSommer:7,dauerWinter:10,schaeden:['mehltau','botrytis']}};

const erg=A.migriere(JSON.parse(JSON.stringify(alt3)));
console.log('   von Format',erg.von,'nach',erg.db.schema);
erg.notizen.forEach(n=>console.log('   ·',n));
ok(erg.db.schema===12,'Schema auf 12 gehoben');
ok(erg.db.produkte&&erg.db.produkte.biovin&&erg.db.produkte.kali,'Die Mittel sind angelegt – die Handy-Seite bietet sie an');
ok(erg.db.analysen.length===2,'Beide Analysen übernommen');
ok(erg.db.ereignisse.length===3&&erg.db.messungen.length===1,'Einträge und Messungen übernommen');
ok(erg.db.rundgaenge.length===1&&erg.db.saetze['28-478'].substrat==='Ökohum'&&erg.db.einst.kMg===8,
  'Was diese Fassung nicht mehr zeigt (Rundgänge, Sätze, Einstellungen), bleibt unangetastet im Bestand');
const a1=erg.db.analysen[0],a2=erg.db.analysen[1];
ok(a1.werte.Mo.unter===true&&a1.werte.Mo.limit===undefined,'limit → unter umbenannt');
ok(a1.optima.Al[0]===null&&a1.optima.Al[1]===0.5,'Al-Optimum [0,5;0,5] als Nachweisgrenze korrigiert');
ok(a2.werte.sub_pH&&a2.werte.sub_pH.wert===5.2,'Substrat-pH nach sub_pH verschoben');
ok(a2.werte.sub_Mn&&!a2.werte.Mn,'Substrat-Mangan nach sub_Mn verschoben');
const e2=erg.db.ereignisse[1],e3=erg.db.ereignisse[2];
ok(e2.typ==='Säurezugabe'&&erg.db.ereignisse[2].typ==='Notiz','Alte Bezeichnungen umgestellt: pH-Korrektur → Säurezugabe, Sonstiges → Notiz');
ok(e2.mittel==='zitronensaeure'&&e2.menge===2.5&&e2.einheit==='l','Aus dem Freitext «2,5 l» wird eine Menge mit Einheit, das Mittel bleibt erhalten');
ok(e2.felder.menge==='2,5 l','Der ursprüngliche Text bleibt');
ok(e3.zeit===null&&erg.db.messungen[0].zeit===null&&erg.db.messungen[0].o2===null,'Uhrzeit und Sauerstoff sind leer – geraten wird nichts');
ok(erg.db.messungen[0].quelle==='hand'&&e2.quelle==='hand','Die Herkunft ist gesetzt');
ok(erg.notizen.length>=2,'Die Migration sagt, was sie angepasst hat');
ok(alt3.analysen[0].werte.Mo.limit===true,'Die eingelesene Datei selbst wird nicht verändert');

console.log('\n════ Sicherung schreiben und wieder laden ════');
const rund=JSON.parse(JSON.stringify(erg.db));
const erg2=A.migriere(rund);
ok(erg2.von===12&&!erg2.notizen.length,'Eine Datei im aktuellen Format wird ohne Umbau geladen');
ok(JSON.stringify(erg2.db.analysen)===JSON.stringify(erg.db.analysen),'Analysen bleiben beim Rundlauf identisch');
ok(JSON.stringify(erg2.db.ereignisse)===JSON.stringify(erg.db.ereignisse),'Einträge bleiben beim Rundlauf identisch');
A.setDb(erg2.db);
const bad=[];
for(const t of ['vAnalysen','vKombi','vTank','vMaske','vEinst']){
  try{const x=A[t]();A.nachRenderRun();if(/undefined|NaN|\[object Object\]/.test(x))bad.push(t)}
  catch(e){bad.push(t+' WIRFT '+e.message)}
}
ok(!bad.length,'Alle fünf Reiter rendern die geladene Datei sauber'+(bad.length?': '+bad.join(', '):''));
ok(A.TABS.map(t=>t[1]).join('|')==='Blattsaft & Giesswasser|Analysen|pH & EC am Tank|Einträge Maske|Einstellungen','Fünf Reiter, Blattsaft & Giesswasser zuerst');

console.log('\n════ Der Bericht: Werte, Optimum, sonst nichts ════');
const d=A.leer();
d.analysen=[
 {id:'b1',typ:'blattsaft',labor:'NovaCropControl',datum:'2026-08-18',satz:'28-478',blattalter:'jung',zustand:'grün',
  kultur:'Eichhof 8B',laborId:'202608201117',quelle:{datei:'NCC_28-478.pdf',text:'Pflanzensaft-Probe … Kalium 1040'},
  werte:{Mo:{wert:0.05,unter:true},K:{wert:1040},NH4:{wert:178}},optima:{Mo:[null,0.05],K:[3975,4800],NH4:[25,55]}},
 {id:'b2',typ:'blattsaft',labor:'NovaCropControl',datum:'2026-08-18',satz:'28-478',blattalter:'alt',zustand:'grün',
  kultur:'Eichhof 8B',laborId:'202608201118',quelle:{datei:'NCC_28-478.pdf',text:'Pflanzensaft-Probe … Kalium 1040'},
  werte:{K:{wert:1418},NH4:{wert:85}},optima:{K:[3975,4800],NH4:[25,55]}},
 {id:'g1',typ:'giesswasser',labor:'NovaCropControl',datum:'2026-09-01',stelle:'Basilikum RV',laborId:'202609040037',
  werte:{gw_K:{wert:0.7},gw_Fe:{wert:1.7},gw_Si:{wert:0.1,unter:true}},optima:{}}];
A.setDb(d);
const ber=A.berichte();
ok(ber.length===2,'Jung und Alt desselben Berichts sind EIN Bericht, die Wasserprobe ein zweiter');
ok(ber[0].typ==='giesswasser'&&ber[1].proben.map(p=>p.blattalter).join()==='jung,alt','Neueste zuerst, im Bericht erst jung, dann alt');
const liste=A.vAnalysen();
ok(/Analyse hochladen/.test(liste)&&/Dateien wählen/.test(liste),'Oben wird hochgeladen');
ok((liste.match(/data-tun="detail"/g)||[]).length===2,'Darunter eine Zeile je Bericht');
ok(/202608201117, 202608201118/.test(liste),'Mit beiden Probennummern');
A.AKTION.detail({id:'b2'});
const h=global.document.getElementById('dlgBody').innerHTML,titel=global.document.getElementById('dlgTitel').textContent;
console.log('   Titel:',titel);
ok(titel==='Blattsaft · Satz 28-478 · 18.08.2026','Titel: Art, Satz, Datum');
ok(/junges Blatt/.test(h)&&/altes Blatt/.test(h)&&/Optimum \(Labor\)/.test(h),'Jung und alt nebeneinander, dazu das Optimum des Labors');
ok(/&lt;0.05/.test(h),'Werte unter der Nachweisgrenze stehen mit «<»');
ok(/Eichhof 8B/.test(h)&&/NCC_28-478\.pdf/.test(h),'Herkunft und Datei stehen dabei');
ok(/Der Bericht im Wortlaut/.test(h),'Der Bericht im Wortlaut ist aufklappbar');
ok(/class="opt"/.test(h)&&/class="mk"/.test(h),'Wert und Optimum als Band');
const deutung=/Befund|zu tief|zu hoch|unter Optimum|über Optimum|knapp|Mangel|Überschuss|empfehl|Nächster Schritt|zählt|Regel/i;
ok(!deutung.test(h.replace(/<[^>]+>/g,' ')),'Keine Deutung: kein Befund, keine Bewertung, keine Empfehlung');
A.AKTION.detail({id:'g1'});
const hg=global.document.getElementById('dlgBody').innerHTML;
ok(/mmol\/l/.test(hg)&&/µmol\/l/.test(hg)&&/27.37 mg\/l/.test(hg),'Wasser: Einheit des Labors und daneben mg/l');
ok(!/Optimum/.test(hg.replace(/title="[^"]*"/g,'')),'Wasser: kein Optimum, das Labor gibt keines an');

console.log('\n════ Entfernen ════');
const echt=global.confirm;global.confirm=()=>true;
A.AKTION.loeschBericht({id:'b1'});
global.confirm=echt;
ok(A.getDb().analysen.length===1&&A.getDb().analysen[0].id==='g1','Entfernen nimmt den ganzen Bericht – jung und alt');

process.exit(fehler?1:0);
