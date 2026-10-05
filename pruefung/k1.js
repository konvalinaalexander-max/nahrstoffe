/* Die schlanke App: «＋ Massnahme eintragen», eigene Massnahmen, die zwei
   Fenster im Reiter Blattsaft & Giesswasser, pH & EC am Tank, die Einträge
   der Maske und die persönliche Ansicht. */
const A=require('./harness.js');
let fehler=0;
const ok=(b,t)=>{if(!b)fehler++;console.log((b?'  ✓ ':'  ✗ FEHLER ')+t)};
const $=id=>document.getElementById(id);
const tagVor=n=>{const d=new Date();d.setDate(d.getDate()-n);return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')};
const T=()=>A.kmBalken().filter(b=>!b.marke).map(b=>b.text);
const plus=(was,von,dauer,bis,notiz,name)=>{A.AKTION.massnahmeNeu();
  $('mnWas').value=was;$('mnVon').value=von;$('mnDauer').value=dauer;$('mnBis').value=bis||'';$('mnNotiz').value=notiz||'';$('mnName').value=name||'';
  A.AKTION.massnahmeSpeichern()};
const toasts=[];global.document.createElement=t=>{const e={className:'',textContent:'',remove(){},classList:{add(){},remove(){}}};toasts.push(e);return e};
const letzterToast=()=>(toasts[toasts.length-1]||{}).textContent||'';

console.log('════ ＋ Massnahme eintragen ════');
{
  A.setDb(A.leer());A.setKmAus(new Set());
  A.AKTION.massnahmeNeu();
  const h=$('dlgBody').innerHTML;
  ok(/Neue Massnahme …/.test(h)&&/optgroup label="Mittel in den Tank"/.test(h)&&/optgroup label="Ereignis an einem Tag"/.test(h),'Der Dialog bietet: neue Massnahme, Mittel, Ereignis an einem Tag');
  ok(/läuft noch/.test(h)&&/bis zu einem Datum/.test(h)&&/nur an diesem Tag/.test(h),'Dauer: läuft noch, bis zu einem Datum, nur an diesem Tag');
  plus('neu','2026-09-20','laeuft','','Netz halb zu','Schattierung');
  ok(T().includes('Schattierung seit 20.09.'),'Eine neue Massnahme wird ein Balken: «Schattierung seit 20.09.»');
  const s=A.beigabeHand(h=>h.name==='Schattierung')[0];
  ok(s&&s.bis===null&&s.notiz==='Netz halb zu'&&!s.mittel,'Im Bestand: Name, Beginn, läuft, Notiz – kein Mittel');
  plus('neu','2026-09-01','bis','2026-09-10','','  Klima   umgestellt ');
  ok(T().includes('Klima umgestellt 01.09.–10.09.'),'Mit Ende: «Klima umgestellt 01.09.–10.09.» – Leerzeichen bereinigt');
  plus('n|Schattierung','2026-07-01','tag','','');
  ok(T().filter(t=>/^Schattierung/.test(t)).length===2&&T().includes('Schattierung 01.07.'),'Eine bestehende Massnahme lässt sich wieder wählen – eine zweite Zeit, dieselbe Zeile');
  const L=A.kmListe();
  ok(L.filter(x=>x.art==='eigen').map(x=>x.name).join('|')==='Klima umgestellt|Schattierung','Eigene Massnahmen stehen als eigene Zeilen in der Liste');
  ok(A.eigeneFarbe('Schattierung')===A.eigeneFarbe('Schattierung')&&/^#[0-9A-F]{6}$/i.test(A.eigeneFarbe('x')),'Die Farbe folgt dem Namen – immer dieselbe');
  const vorher=A.getDb().beigabeZeiten.length;
  plus('neu','2026-09-01','laeuft','','','');
  ok(A.getDb().beigabeZeiten.length===vorher&&/Namen/.test(letzterToast()),'Ohne Namen: nichts eingetragen, mit Hinweis');
  plus('neu','2026-09-10','bis','2026-09-01','','Falsch');
  ok(A.getDb().beigabeZeiten.length===vorher&&/vor dem Beginn/.test(letzterToast()),'Ende vor Beginn: nichts eingetragen');
  plus('neu','','laeuft','','','Ohne Datum');
  ok(A.getDb().beigabeZeiten.length===vorher,'Ohne Beginn: nichts eingetragen');
  plus('t|Tank neu angesetzt','2026-09-28','laeuft','','frisch angesetzt');
  const ev=A.getDb().ereignisse.find(e=>e.typ==='Tank neu angesetzt');
  ok(ev&&ev.datum==='2026-09-28'&&ev.quelle==='hand'&&ev.notiz==='frisch angesetzt'&&!ev.mittel,'Ein Ereignis wird ein Eintrag an diesem Tag – die Dauer spielt keine Rolle');
  ok(A.kmBalken().some(b=>b.marke&&b.kennung==='t|Tank neu angesetzt|2026-09-28'),'… und erscheint als Marke');
}

console.log('\n════ ＋ mit einem Mittel ════');
{
  const d=A.leer();
  const gabe=(datum,mittel)=>({id:'g'+datum+mittel,datum,typ:'Zusatzdünger / Spurenelemente',mittel,menge:500,einheit:'g',stelle:'beide',felder:{},quelle:'hand'});
  d.ereignisse=[gabe('2026-06-01','kali'),gabe('2026-06-15','kali'),gabe(tagVor(5),'epsotop')];
  A.setDb(d);A.setKmAus(new Set());
  ok(T().includes('Kalisulfat 01.06.–15.06.'),'Ausgangslage: Kalisulfat 01.06.–15.06. aus den Gaben');
  plus('m|kali','2026-06-10','laeuft','','wieder jede Woche');
  ok(T().filter(t=>/^Kalisulfat/.test(t)).join('|')==='Kalisulfat seit 01.06.','Kalisulfat «läuft noch» ab 10.06.: der Balken wird EIN Balken seit 01.06. – die Gaben davor gehören dazu');
  ok(A.beigabeHand(h=>h.mittel==='kali').length===1&&A.beigabeHand(h=>h.mittel==='kali')[0].notiz==='wieder jede Woche','Ein Zeitraum von Hand, mit Notiz');
  const n=A.getDb().beigabeZeiten.length;
  plus('m|kali','2026-08-01','tag','','');
  ok(A.getDb().beigabeZeiten.length===n&&/schon im Balken/.test(letzterToast()),'Ein Tag, der schon im Balken liegt: nichts geändert, mit Hinweis');
  plus('m|epsotop',tagVor(2),'tag','','');
  ok(/schon im Balken/.test(letzterToast()),'Auch ein laufender Balken aus den Gaben deckt die letzten Tage');
  plus('m|zink','2026-09-02','bis','2026-09-04','');
  ok(T().includes('Zink 02.09.–04.09.'),'Ein Mittel ohne jede Gabe bekommt seinen Balken von Hand');
  A.setKmAus(new Set(['m|phosphorsaeure']));
  plus('m|phosphorsaeure','2026-09-05','tag','','');
  ok(!A.getKmAus().has('m|phosphorsaeure')&&T().includes('Phosphorsäure 05.09.'),'Ein ausgeblendetes Mittel wird beim Eintragen wieder eingeblendet – sonst sähe man nicht, was man getan hat');
}

console.log('\n════ Eigene Massnahme ändern und löschen ════');
{
  A.setDb(A.leer());
  A.getDb().beigabeZeiten.push({id:'s1',name:'Schattierung',von:'2026-09-20',bis:null,notiz:null});
  A.AKTION.spanne({id:'n|s1'});
  ok($('dlgTitel').textContent==='Schattierung'&&/spName/.test($('dlgBody').innerHTML)&&/eigeneWeg/.test($('dlgFoot').innerHTML),'Klick auf den Balken: Name, Beginn, Ende, Notiz – Speichern und Löschen');
  $('spName').value='Schattierung Ost';$('spVon').value='2026-09-21';$('spLaeuft').checked=false;$('spBis').value='2026-09-30';$('spNotiz').value='nur Ostseite';
  A.AKTION.eigeneSpeichern({id:'s1'});
  ok(T().includes('Schattierung Ost 21.09.–30.09.')&&A.getDb().beigabeZeiten[0].notiz==='nur Ostseite','Gespeichert: neuer Name, neue Zeit, Notiz');
  A.AKTION.eigeneWeg({id:'s1'});
  ok(!A.getDb().beigabeZeiten.length&&!T().length,'Gelöscht');
}

console.log('\n════ Einträge entfernen ════');
{
  const d=A.leer();
  d.ereignisse=[{id:'u1',datum:'2026-09-24',zeit:'08:30',typ:'Umpumpen',mittel:null,stelle:'beide',notiz:'gemischt',quelle:'paket'},
    {id:'u2',datum:'2026-09-24',zeit:'14:00',typ:'Umpumpen',mittel:null,stelle:'beide',notiz:null,quelle:'hand'}];
  A.setDb(d);
  A.AKTION.spanne({id:'t|Umpumpen|2026-09-24'});
  ok((($('dlgBody').innerHTML).match(/data-tun="evWeg"/g)||[]).length===2,'Die Marke zeigt beide Einträge des Tages');
  A.AKTION.evWeg({id:'u2'});
  ok(A.getDb().ereignisse.length===1&&A.getDb().ereignisse[0].id==='u1','Einer entfernt, der andere bleibt');
  ok(A.kmBalken().find(b=>b.marke).n===1,'Die Marke zählt jetzt einen');
}

console.log('\n════ Blattsaft & Giesswasser: zwei Fenster ════');
{
  const d=A.leer();
  const blatt=(id,datum,al,k,ca)=>({id,typ:'blattsaft',labor:'NovaCropControl',datum,satz:'28-478',blattalter:al,zustand:'grün',
    werte:{K:{wert:k},Ca:{wert:ca},Fe:{wert:1.1},Mo:{wert:0.05,unter:true}},optima:{K:[3975,4800],Ca:[810,1275],Fe:[0.8,1.6],Mo:[null,0.05]}});
  d.analysen=[blatt('j1','2026-07-14','jung',884,700),blatt('a1','2026-07-14','alt',1300,690),blatt('j2','2026-08-18','jung',1040,814),blatt('a2','2026-08-18','alt',1418,766),
    {id:'w1',typ:'giesswasser',labor:'NovaCropControl',datum:'2026-08-18',stelle:'Reservoir Vorne',werte:{gw_K:{wert:0.5},gw_Fe:{wert:0.4}},optima:{}},
    {id:'w2',typ:'giesswasser',labor:'NovaCropControl',datum:'2026-09-01',stelle:'Basilikum RV',werte:{gw_K:{wert:0.7},gw_Fe:{wert:1.7}},optima:{}}];
  A.setDb(d);
  A.setKombi({blatt:['K'],wasser:['gw_K'],etage:'beide',skala:'wert',linien:'keine'});
  const h=A.vKombi();A.nachRenderRun();
  const svg=$('cKb').innerHTML;
  ok(!/undefined|NaN|\[object Object\]/.test(h+svg),'Rendert sauber');
  ok(/data-tun="kbStoff" data-k="K"/.test(h)&&/data-tun="kbWass" data-k="gw_K"/.test(h),'Oben die Werte des Blattsafts, darunter die des Giesswassers – zum Anklicken');
  ok(!/data-k="Mo"/.test(h),'Zur Wahl steht nur, was je gemessen wurde (Molybdän lag immer unter der Nachweisgrenze)');
  ok(/data-tun="kbEtage"/.test(h)&&/data-tun="kbLinien"/.test(h)&&/data-tun="kbSkala"/.test(h),'Blatt, Linien und Anzeige');
  ok(!/Frage|Erwartung|widerlegen|Stickstoffform|eigene Auswahl/.test(h),'Keine vorformulierten Fragen');
  ok(/>Blattsaft</.test(svg)&&/>Giesswasser</.test(svg)&&/>Kulturmanagement</.test(svg)===false,'Zwei Fenster; ohne Einträge kein Kulturmanagement');
  ok(svg.indexOf('>Blattsaft<')<svg.indexOf('>Giesswasser<'),'Blattsaft oben, Giesswasser darunter');
  ok(/data-tun="massnahmeNeu"/.test(h),'Unter dem Diagramm der Knopf «＋ Massnahme eintragen»');
  const F=A.farbenFuer(['K']);
  ok((svg.match(new RegExp('fill="'+F.K+'"','g'))||[]).length===6,'Kalium oben (4 Proben) und unten (2) in derselben Farbe');
  ok(/Optimum \(Labor\)/.test(svg),'Ein Nährstoff allein in seiner Spur: das Optimum des Labors als Band');
  const tipps=[...svg.matchAll(/class="hit"[^>]*data-tipp="([^"]*)"/g)].map(m=>m[1]);
  ok(tipps.length===6&&tipps.every(t=>/Anklicken öffnet den Bericht/.test(t)),'Jeder Punkt hat sein Kästchen und öffnet den Bericht');
  ok(tipps.some(t=>/Optimum \(Labor\)/.test(t)&&/Kulturbild/.test(t)&&/junges Blatt/.test(t)),'Kästchen: Wert, Optimum, Blatt, Kulturbild');
  A.getDiag().klick('a2');
  ok($('dlgTitel').textContent==='Blattsaft · Satz 28-478 · 18.08.2026','Ein Klick auf einen Punkt öffnet den Bericht');
  A.setKombi({etage:'alt'});A.vKombi();A.nachRenderRun();
  ok(([...$('cKb').innerHTML.matchAll(/class="hit"/g)]).length===4,'Nur altes Blatt: zwei Punkte oben, zwei unten');
  A.setKombi({etage:'beide',blatt:['K','Ca','Fe']});A.vKombi();A.nachRenderRun();
  const t2=[...$('cKb').innerHTML.matchAll(/font-weight="600" fill="#141D17">([^<]*)</g)].map(m=>m[1]);
  ok(t2.includes('Eisen')&&t2.some(t=>/Kalium/.test(t)&&/Calcium/.test(t)),'Kalium und Calcium teilen eine Achse, Eisen bekommt seine eigene ('+t2.join(' | ')+')');
  A.setKombi({skala:'lage'});A.vKombi();A.nachRenderRun();
  const s3=$('cKb').innerHTML;
  ok(/>Optimum</.test(s3)&&/>darunter</.test(s3)&&/>darüber</.test(s3)&&/Lage im Optimum des Labors/.test(s3),'Anzeige «Lage im Optimum»: ein Fenster, darunter – Optimum – darüber');
  A.setKombi({skala:'wert',linien:'reihe'});A.vKombi();A.nachRenderRun();
  ok(/<polyline/.test($('cKb').innerHTML),'Linien je Reihe');
  A.setKombi({blatt:[],wasser:['gw_K'],linien:'keine'});
  const h4=A.vKombi();A.nachRenderRun();
  ok(/Kein Wert gewählt/.test($('cKb').innerHTML),'Nichts gewählt: das Fenster sagt es');
  A.AKTION.kbStoff({k:'Fe'});
  ok(A.getKombi().blatt.join()==='Fe','Ein Klick nimmt einen Wert dazu');
  A.AKTION.kbStoff({k:'Fe'});
  ok(A.getKombi().blatt.length===0,'… und wieder weg');
  ok(!/undefined/.test(h4),'Sauber auch ohne Auswahl');
  A.setDb(A.leer());
  ok(/Noch keine Analysen/.test(A.vKombi()),'Ohne Analysen: ein Hinweis mit dem Weg zu den Analysen');
  /* Erst nur Wasser, später Blattsaft: die Vorauswahl kommt trotzdem */
  A.resetKombi();
  const w=A.leer();w.analysen=[{id:'w1',typ:'giesswasser',datum:'2026-08-18',stelle:'Reservoir Vorne',werte:{gw_K:{wert:0.5}},optima:{}}];
  A.setDb(w);A.vKombi();
  ok(A.getKombi().blatt===null&&A.getKombi().wasser.join()==='gw_K','Nur Wasser: unten Kalium vorgewählt, oben noch nichts');
  w.analysen.push({id:'b1',typ:'blattsaft',datum:'2026-08-18',satz:'28-478',blattalter:'jung',werte:{K:{wert:1040},Ca:{wert:814}},optima:{K:[3975,4800]}});
  A.vKombi();
  ok(A.getKombi().blatt.join()==='K','Kommt der erste Blattsaft dazu, ist oben Kalium vorgewählt');
}

console.log('\n════ pH & EC am Tank ════');
{
  const d=A.leer();
  d.messungen=[{id:'m1',datum:'2026-09-30',zeit:'08:00',stelle:'vorne',ph:5.93,ec:1.3,o2:6,quelle:'paket',beleg:'Tabelle, Zeile 9'},
    {id:'m2',datum:'2026-09-30',zeit:'08:00',stelle:'hinten',ph:6.46,ec:1.3,quelle:'paket'},
    {id:'m3',datum:'2026-10-04',zeit:'07:45',stelle:'Reservoir vorne',ph:6.1,ec:1.31,o2:6.2,temp:19.5,wer:'MK',quelle:'erfassen'},
    {id:'m4',datum:'2026-07-01',stelle:'vorne',ph:6.8,ec:0.9,quelle:'excel'}];
  A.setDb(d);
  const h=A.vTank();A.nachRenderRun();
  const svg=$('cTank').innerHTML;
  ok(!/undefined|NaN|\[object Object\]/.test(h+svg),'Rendert sauber');
  ok(/>pH</.test(svg)&&/>EC</.test(svg)&&/>Sauerstoff</.test(svg),'Drei Spuren: pH, EC, Sauerstoff');
  ok(/data-tun="tkStelle" data-v="Reservoir vorne"/.test(h)&&/data-tun="tkZeit"/.test(h)&&/data-tun="tkLinien"/.test(h),'Stelle, Zeitraum, Linien');
  ok(/Messungen \(4\)/.test(h)&&(h.match(/data-tun="messungWeg"/g)||[]).length===4,'Darunter die Liste aller Messungen');
  ok(h.indexOf('04.10.2026')<h.indexOf('30.09.2026')&&h.indexOf('30.09.2026')<h.indexOf('01.07.2026'),'Neueste zuerst');
  ok(/>Maske</.test(h)&&/>Paket</.test(h)&&/>Excel</.test(h),'Die Herkunft steht dabei');
  ok(/title="Tabelle, Zeile 9"/.test(h),'Der Beleg aus dem Paket als Hinweis');
  ok(!/Sättigung|Annahme|Kachel|Trend/.test(h+svg),'Keine Grenzen, keine Kacheln, keine Deutung');
  A.AKTION.tkStelle({v:'Reservoir hinten'});
  const h2=A.vTank();
  ok(/Messungen \(1\)/.test(h2),'Nur hinten: eine Messung');
  A.AKTION.tkStelle({v:'alle'});
  A.AKTION.messungWeg({id:'m4'});
  ok(A.getDb().messungen.length===3,'Entfernen');
  A.setDb(A.leer());
  ok(/Noch keine Messung am Tank/.test(A.vTank())&&/tabWaehlen/.test(A.vTank()),'Ohne Messungen: Hinweis mit Excel-Import');
}

console.log('\n════ Einträge der Maske ════');
{
  const d=A.leer();
  d.messungen=[{id:'m1',datum:'2026-10-04',zeit:'07:45',stelle:'Reservoir vorne',ph:6.1,ec:1.31,o2:6.2,wer:'MK',notiz:'nach Regen',quelle:'erfassen',erfasst:'2026-10-04T05:46:00Z'},
    {id:'m2',datum:'2026-10-03',stelle:'vorne',ph:6.0,quelle:'excel'}];
  d.ereignisse=[{id:'e1',datum:'2026-10-04',zeit:'08:10',typ:'Säurezugabe',mittel:'schwefelsaeure25',menge:0.5,einheit:'l',stelle:'hinten',wer:'Marco',quelle:'erfassen',felder:{}},
    {id:'e2',datum:'2026-10-02',typ:'Notiz',quelle:'hand',felder:{text:'nicht aus der Maske'}}];
  A.setDb(d);
  const h=A.vMaske();
  ok(!/undefined|NaN/.test(h),'Rendert sauber');
  ok((h.match(/<tr title=/g)||[]).length===1&&(h.match(/data-tun="(messungWeg|evWeg)"/g)||[]).length===2,'Nur, was von der Maske kommt: eine Messung, eine Beigabe');
  ok(h.indexOf('08:10')<h.indexOf('07:45'),'Neueste zuerst');
  ok(/pH 6.1 · EC 1.31 mS\/cm · O₂ 6.2 mg\/l/.test(h)&&/Schwefelsäure 25 % · 0.5 l/.test(h)&&/Marco/.test(h)&&/nach Regen/.test(h),'Mit Name, Werten, Mittel, Menge und Notiz');
  A.AKTION.meFilter({v:'beigabe'});
  ok(!/07:45/.test(A.vMaske())&&/08:10/.test(A.vMaske()),'Filter: nur Beigaben');
  A.AKTION.meFilter({v:'alle'});
  A.setDb(A.leer());
  ok(/Noch nichts aus der Maske/.test(A.vMaske()),'Ohne Einträge: ein Hinweis');
}

console.log('\n════ Persönliche Ansicht ════');
{
  const speicher={};global.localStorage={getItem:k=>speicher[k]??null,setItem:(k,v)=>{speicher[k]=String(v)}};
  A.setTab('tank');A.setKombi({blatt:['K','Fe'],wasser:['gw_NO3'],etage:'jung',skala:'lage'});A.setKmAus(new Set(['m|em']));
  A.ansichtMerken();
  A.setTab('analysen');A.setKombi({blatt:['NO3'],wasser:[],etage:'beide',skala:'wert'});A.setKmAus(new Set());
  A.ansichtLaden();
  const k=A.getKombi();
  ok(A.getTab()==='tank'&&k.blatt.join()==='K,Fe'&&k.wasser.join()==='gw_NO3'&&k.etage==='jung'&&k.skala==='lage'&&A.getKmAus().has('m|em'),'Reiter, Auswahl und ausgeblendete Balken überstehen das Neuladen');
  speicher['basilikum.ansicht']=JSON.stringify({tab:'giess',kbEtage:'quer',kbBlatt:'kaputt'});
  A.setTab('kombi');A.ansichtLaden();
  ok(A.getTab()==='kombi'&&A.getKombi().etage==='jung','Ein alter Reiter («giess») und Unsinn werden ignoriert');
  delete global.localStorage;
}

console.log('\n════ Keine Spur der alten Auswertung ════');
{
  const src=require('fs').readFileSync(__dirname+'/app.js','utf8');
  for(const [re,t] of [[/function befunde\b/,'Regelwerk'],[/function erhebungen\b/,'Erhebungen und Kennzahl'],[/function vLogbuch\b/,'Logbuch'],
    [/function vFotos\b/,'Fotos'],[/function vRund\b/,'Rundgang'],[/function vPlaner\b/,'Planer'],[/function vSubstrat\b/,'Substrat'],[/PAARE_VOR/,'vorformulierte Fragen'],[/function bilanzGiess\b/,'Soll-Ist-Bilanz']])
    ok(!re.test(src),t+' ist weg');
}

console.log('\n════ Ergebnis ════');
console.log(fehler?`  ${fehler} FEHLER`:'  ✓ Alle Prüfungen bestanden.');
process.exit(fehler?1:0);
