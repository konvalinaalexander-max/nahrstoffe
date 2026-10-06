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
  A.setKmAus(new Set(['m|halades']));
  plus('m|halades','2026-09-05','tag','','');
  ok(!A.getKmAus().has('m|halades')&&T().includes('Halades PE 05.09.'),'Ein ausgeblendetes Mittel wird beim Eintragen wieder eingeblendet – sonst sähe man nicht, was man getan hat');
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
  ok(/data-tun="kbStoff" data-k="K"/.test(svg)&&/data-tun="kbWass" data-k="gw_K"/.test(svg),'Jede Grafik hat ihre Auswahl in der eigenen Kopfzeile – zum Anklicken');
  ok(svg.indexOf('data-tun="kbStoff"')<svg.indexOf('>Giesswasser<')&&svg.indexOf('data-tun="kbWass"')>svg.indexOf('>Giesswasser<'),'Die Nährstoffe des Blattsafts über seiner Grafik, die des Wassers über der seinen');
  ok(!/data-k="Mo"/.test(svg),'Zur Wahl steht nur, was je gemessen wurde (Molybdän lag immer unter der Nachweisgrenze)');
  ok(/data-tun="kbEtage"/.test(svg)&&/data-tun="kbSkala"/.test(svg),'Blatt und Anzeige in der Kopfzeile des Blattsafts');
  ok(/data-aend="linienUm" data-ziel="blatt"/.test(svg)&&/data-aend="linienUm" data-ziel="wasser"/.test(svg)&&
     svg.indexOf('data-ziel="blatt"')<svg.indexOf('>Giesswasser<')&&svg.indexOf('data-ziel="wasser"')>svg.indexOf('>Giesswasser<'),'«Punkte verbinden» bei den Nährstoffen – je Grafik ein eigener Schalter');
  ok(!/Frage|Erwartung|widerlegen|Stickstoffform|eigene Auswahl/.test(h+svg),'Keine vorformulierten Fragen');
  ok(/>Blattsaft</.test(svg)&&/>Giesswasser</.test(svg)&&/>Kulturmanagement</.test(svg)&&/Noch keine Massnahme eingetragen/.test(svg),'Zwei Grafiken und das Kulturmanagement – auch leer, damit man etwas eintragen kann');
  ok(svg.indexOf('>Blattsaft<')<svg.indexOf('>Kulturmanagement<')&&svg.indexOf('>Kulturmanagement<')<svg.indexOf('>Giesswasser<'),'Blattsaft oben, dann das Kulturmanagement, dann das Giesswasser – nah bei beiden');
  const kmTeil=svg.slice(svg.indexOf('>Kulturmanagement<'));
  ok(kmTeil.indexOf('data-tun="massnahmeNeu"')>=0&&kmTeil.indexOf('data-tun="massnahmeNeu"')<kmTeil.indexOf('<svg'),'Gleich unter der Überschrift «Kulturmanagement» der Knopf «＋ Massnahme eintragen»');
  const spuren=svg.split('<svg class="zb spur"').slice(1);
  const achsen=spuren.filter(s=>/>(Jul|Aug|Sep) 26</.test(s)||/>\d\d\.\d\d\.</.test(s)).length;
  ok(spuren.length===2&&achsen===2,'Blattsaft und Giesswasser: je eine eigene Grafik mit eigener Datumsachse ('+spuren.length+' / '+achsen+')');
  ok(svg.indexOf('class="zeitzeile"')<svg.indexOf('>Blattsaft<')&&/data-tun="zoomAus"[^>]*>−<\/button><button data-tun="zoomEin"/.test(svg),'Oben die Zeitzeile mit − und + ganz rechts');
  ok(/class="rollleiste"/.test(svg)&&/class="rbDaumen"/.test(svg)&&!/zlGriff|zlMonate|zlFenster/.test(svg),'Unten ein schlichter Rollbalken – ohne Griffe, ohne Monatsnamen');
  const F=A.farbenFuer(['K']);
  ok((svg.match(new RegExp('fill="'+F.K+'"','g'))||[]).length===6,'Kalium oben (4 Proben) und unten (2) in derselben Farbe');
  ok(!/class="hit"/.test(svg),'Keine unsichtbaren Trefferkreise mehr – Zeigen sucht den nächsten Punkt');
  const tipps=A.getZeit().ZEIT.treffer.flat().map(t=>t.tipp);
  ok(tipps.length===6&&tipps.every(t=>/Anklicken öffnet den Bericht/.test(t)),'Jeder Punkt hat sein Kästchen und öffnet den Bericht');
  ok(tipps.some(t=>/Optimum \(Labor\)/.test(t)&&/Kulturbild/.test(t)&&/junges Blatt/.test(t)),'Kästchen: Wert, Optimum, Blatt, Kulturbild');
  A.getDiag().klick('a2');
  ok($('dlgTitel').textContent==='Blattsaft · Satz 28-478 · 18.08.2026','Ein Klick auf einen Punkt öffnet den Bericht');
  A.setKombi({etage:'alt'});A.vKombi();A.nachRenderRun();
  ok(A.getZeit().ZEIT.treffer.flat().length===4,'Nur altes Blatt: zwei Punkte oben, zwei unten');
  A.setKombi({etage:'beide',blatt:['K','Ca','Fe']});A.vKombi();A.nachRenderRun();
  const t2=[...$('cKb').innerHTML.matchAll(/font-weight="600" fill="#141D17">([^<]*)</g)].map(m=>m[1]);
  ok(t2.includes('Eisen')&&t2.some(t=>/Kalium/.test(t)&&/Calcium/.test(t)),'Kalium und Calcium teilen eine Achse, Eisen bekommt seine eigene ('+t2.join(' | ')+')');
  ok(/>Optimum \(Labor\)<\/text>/.test($('cKb').innerHTML),'Eisen allein in seiner Spur: das Optimum des Labors als Band');
  const ticks=[...$('cKb').innerHTML.matchAll(/font-family="JetBrains Mono,monospace">([^<]*)</g)].map(m=>+m[1].replace(/['’]/g,''));
  ok(ticks.length>4&&ticks.every(v=>[1,2,2.5,5].some(s=>{const m=Math.pow(10,Math.floor(Math.log10(Math.abs(v)||1)));return v===0||Math.abs(v/m/s-Math.round(v/m/s))<1e-6||Math.abs(v/(m/10)/s-Math.round(v/(m/10)/s))<1e-6})),'Runde Werte an der y-Achse ('+ticks.join(' ')+')');
  A.setKombi({skala:'lage'});A.vKombi();A.nachRenderRun();
  const s3=$('cKb').innerHTML;
  ok(/>Optimum</.test(s3)&&/>darunter</.test(s3)&&/>darüber</.test(s3)&&/Lage im Optimum des Labors/.test(s3),'Anzeige «Lage im Optimum»: ein Fenster, darunter – Optimum – darüber');
  A.setKombi({skala:'wert'});A.setLinien(['blatt']);A.vKombi();A.nachRenderRun();
  {const s=$('cKb').innerHTML,gw=s.indexOf('>Giesswasser<');
   ok(/<polyline/.test(s.slice(0,gw))&&!/<polyline/.test(s.slice(gw)),'«Punkte verbinden» beim Blattsaft verbindet nur dort');}
  A.setLinien([]);
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
  ok(/<h3>pH<\/h3>/.test(svg)&&/<h3>EC<\/h3>/.test(svg)&&/<h3>Sauerstoff<\/h3>/.test(svg),'Drei Grafiken: pH, EC, Sauerstoff');
  ok((svg.match(/<svg class="zb spur"/g)||[]).length===3,'Jede mit eigener Datumsachse');
  ok(svg.indexOf('<h3>pH</h3>')<svg.indexOf('>Kulturmanagement<')&&svg.indexOf('>Kulturmanagement<')<svg.indexOf('<h3>EC</h3>'),'Das Kulturmanagement gleich unter pH, vor EC');
  {const zz=svg.slice(svg.indexOf('class="zeitzeile"'),svg.indexOf('class="tafeln"'));
   ok(/data-tun="tkStelle" data-v="Reservoir vorne"/.test(zz)&&/data-tun="zeitVorgabe" data-v="7"/.test(zz)&&/data-tun="zoomEin"/.test(zz),'Oben in einer Zeile: links die Stelle, rechts Zeitraum und − +');}
  ok(['ph','ec','o2'].every(k=>new RegExp('data-aend="linienUm" data-ziel="'+k+'"').test(svg)),'«Punkte verbinden» im Kopf von pH, EC und Sauerstoff, je eigens');
  ok(/Alle Messungen als Liste \(4\)/.test(h)&&/<details class="aufklapp">/.test(h)&&(h.match(/data-tun="messungWeg"/g)||[]).length===4,'Darunter die Liste aller Messungen – eingeklappt');
  ok(h.indexOf('04.10.2026')<h.indexOf('30.09.2026')&&h.indexOf('30.09.2026')<h.indexOf('01.07.2026'),'Neueste zuerst');
  ok(/>Mobile App</.test(h)&&/>Paket</.test(h)&&/>Excel</.test(h),'Die Herkunft steht dabei');
  ok(/title="Tabelle, Zeile 9"/.test(h),'Der Beleg aus dem Paket als Hinweis');
  ok(!/Sättigung|Annahme|Kachel|Trend/.test(h+svg),'Keine Grenzen, keine Kacheln, keine Deutung');
  A.AKTION.tkStelle({v:'Reservoir hinten'});
  const h2=A.vTank();
  ok(/Liste \(1\)/.test(h2),'Nur hinten: eine Messung');
  A.AKTION.tkStelle({v:'alle'});
  A.AKTION.messungWeg({id:'m4'});
  ok(A.getDb().messungen.length===3,'Entfernen');
  A.setDb(A.leer());
  ok(/Noch keine Messung am Tank/.test(A.vTank())&&/tabWaehlen/.test(A.vTank()),'Ohne Messungen: Hinweis mit Excel-Import');
}

console.log('\n════ Kulturmanagement: Biovin, Ereignisse, Reihenfolge, Löschen ════');
{
  A.setDb(A.leer());A.AKTION.paketAn({id:'reservoir-2026'});A.setKmAus(new Set());A.setKmOffen(false);A.setTab('kombi');A.setZeit(null,null);
  ok(!A.kmListe('kombi').some(z=>z.key==='m|biovin')&&A.kmListe('tank').some(z=>z.key==='m|biovin'),'Biovin steht im Reiter Blattsaft & Giesswasser nicht, im Reiter pH, EC & O₂ schon');
  ok(A.getDb().ereignisse.filter(e=>e.mittel==='biovin').length===12,'Die zwölf Biovin-Gaben selbst bleiben im Bestand');
  const kd=A.kmDaten('kombi');
  ok(!kd.zeilen.some(z=>z.key==='m|biovin')&&kd.zeilen.every(z=>z.spannen.every(s=>!s.marke)),'Von Haus aus: Balken ohne Biovin, die Ereignisse für sich');
  ok(['Wasserzugabe','Tank neu angesetzt','Umpumpen','Gerätekalibrierung','Notiz'].every(t=>kd.typen.some(z=>z.name===t)),'Die Ereignisse: '+kd.typen.map(z=>z.name).join(', '));
  const box=$('kmProbe');A.zeitBild(box,{tafeln:[],km:kd,kmNach:-1});
  ok(/▸ Ereignisse \(\d\)/.test(box.innerHTML)&&!/class="kmTitel">Tank neu angesetzt</.test(box.innerHTML),'Eingeklappt: eine Zeile «▸ Ereignisse» mit Punkten statt einer Zeile je Art');
  A.AKTION.kmBearbeiten();
  ok(/Biovin steht in diesem Reiter nicht/.test($('dlgBody').innerHTML)&&!/>Biovin</.test($('dlgBody').innerHTML),'«Zeilen verwalten»: Biovin fehlt hier – mit einem Satz, warum');
  A.AKTION.kmEreignisse();
  ok(A.getKm().offen,'Ein Klick klappt die Ereignisse auf');
  A.zeitBild(box,{tafeln:[],km:A.kmDaten('kombi'),kmNach:-1});
  ok(/▾ Ereignisse/.test(box.innerHTML)&&/class="kmTitel">Tank neu angesetzt</.test(box.innerHTML),'… dann steht jede Art in ihrer Zeile');
  A.AKTION.kmEreignisse();
  ok(!A.getKm().offen,'Und wieder zu');
  ok(/data-tun="massnahmeNeu"/.test(box.innerHTML)&&box.innerHTML.indexOf('>Kulturmanagement<')<box.innerHTML.indexOf('data-tun="massnahmeNeu"')&&box.innerHTML.indexOf('data-tun="massnahmeNeu"')<box.innerHTML.indexOf('class="kmZ'),'«＋ Massnahme eintragen» direkt unter der Überschrift, vor den Zeilen');

  A.setTab('tank');
  const vor=A.kmListe('tank').filter(z=>z.art!=='typ').map(z=>z.key);
  ok(A.kmVerschieben(vor[1],0)===true,'Ziehen und Ablegen: die zweite Zeile ganz nach oben');
  const nach=A.kmListe('tank').filter(z=>z.art!=='typ').map(z=>z.key);
  ok(nach[0]===vor[1]&&nach[1]===vor[0]&&nach.length===vor.length,'… sie steht jetzt oben, die übrigen rücken nach ('+vor[1]+')');
  ok(A.kmBalken('tank').filter(b=>!b.marke)[0].zeile===vor[1],'Die Balken folgen der neuen Reihenfolge');
  A.kmVerschieben(vor[1],vor.length+5);
  ok(A.kmListe('tank').filter(z=>z.art!=='typ').slice(-1)[0].key===vor[1],'Über das Ende hinaus: sie landet zuunterst');
  A.AKTION.kmSchieben({k:vor[1],r:'-1'});
  ok(A.kmListe('tank').filter(z=>z.art!=='typ').slice(-2)[0].key===vor[1],'Mit der Tastatur (Pfeil hoch am Griff) um einen Platz');
  const typen=A.kmListe('tank').filter(z=>z.art==='typ').map(z=>z.key);
  A.kmVerschieben(typen[typen.length-1],0);
  const typen2=A.kmListe('tank').filter(z=>z.art==='typ').map(z=>z.key);
  ok(typen2[0]===typen[typen.length-1]&&A.kmListe('tank')[0].art!=='typ','Ereignisse ordnen sich unter sich – sie rutschen nie zwischen die Balken');
  A.setTab('kombi');
  const k0=A.kmListe('kombi').filter(z=>z.art!=='typ').map(z=>z.key);
  A.kmVerschieben(k0[2],1);
  const k1=A.kmListe('kombi').filter(z=>z.art!=='typ').map(z=>z.key);
  ok(k1[1]===k0[2]&&k1[2]===k0[1],'Im Reiter ohne Biovin zählt nur, was sichtbar ist');
  const voll=A.kmListe('tank').map(z=>z.key);
  ok(voll.includes('m|biovin')&&A.getKm().reihe.includes('m|biovin'),'… und Biovin behält im anderen Reiter seinen Platz');
  {
    const speicher={};global.localStorage={getItem:k=>speicher[k]??null,setItem:(k,v)=>{speicher[k]=String(v)}};
    A.ansichtMerken();
    const a=JSON.parse(speicher['basilikum.ansicht']);
    ok(Array.isArray(a.kmReihe)&&a.kmReihe.indexOf(k0[2])<a.kmReihe.indexOf(k0[1])&&a.kmEreignisseOffen===false&&a.tab===undefined,'Reihenfolge und Klappzustand werden auf diesem Gerät gemerkt – der Reiter nicht');
    delete global.localStorage;
  }

  A.setTab('tank');
  const hal=A.getDb().ereignisse.filter(e=>e.mittel==='halades').length;
  global.confirm=()=>false;
  A.AKTION.kmLoeschen({k:'m|halades'});
  ok(A.getDb().ereignisse.filter(e=>e.mittel==='halades').length===hal,'«löschen» ohne Bestätigung: nichts passiert');
  global.confirm=()=>true;
  A.AKTION.kmLoeschen({k:'m|halades'});
  ok(hal===5&&!A.getDb().ereignisse.some(e=>e.mittel==='halades')&&!A.kmListe('tank').some(z=>z.key==='m|halades'),'«löschen» bei Halades: alle fünf Gaben weg, die Zeile auch');
  A.AKTION.kmLoeschen({k:'m|epsotop'});
  ok(!A.getDb().ereignisse.some(e=>e.mittel==='epsotop')&&!A.beigabeHand(x=>x.mittel==='epsotop').length,'… bei Magnesium auch der festgelegte Zeitraum');
  A.AKTION.kmLoeschen({k:'t|Umpumpen'});
  ok(!A.getDb().ereignisse.some(e=>e.typ==='Umpumpen')&&A.getDb().ereignisse.some(e=>e.typ==='Wasserzugabe'),'… bei einem Ereignis: alle Einträge dieser Art, die übrigen bleiben');
  A.getDb().beigabeZeiten.push({id:'s1',name:'Schattierung',von:'2026-09-01',bis:null},{id:'s2',name:'Schattierung',von:'2026-07-01',bis:'2026-07-10'});
  A.AKTION.kmLoeschen({k:'n|Schattierung'});
  ok(!A.beigabeHand(x=>x.name==='Schattierung').length&&A.beigabeHand(x=>x.mittel==='kali').length===1,'… bei einer eigenen Massnahme: beide Zeiträume, nichts sonst');
  A.setKmOffen(false);
  plus('t|Umpumpen','2026-10-01','tag','','');
  ok(A.getKm().offen&&A.kmDaten('tank').typen.some(z=>z.key==='t|Umpumpen'&&z.spannen.length),'Wer ein Ereignis einträgt, sieht es gleich: die Ereignisse klappen auf');
  A.setKmAus(new Set(['m|kali']));
  const kb=$('kmProbe2');A.zeitBild(kb,{tafeln:[],km:A.kmDaten('tank'),kmNach:-1});
  ok(/data-tun="kmBearbeiten">1 ausgeblendet</.test(kb.innerHTML),'Ist etwas ausgeblendet, steht es da – «1 ausgeblendet» öffnet die Verwaltung');
  A.setKmAus(new Set());
}

console.log('\n════ Zoomen: − und + oben, Stufen, Grenzen ════');
{
  const d=A.leer();
  for(let t=0;t<150;t++){const dt=new Date(Date.UTC(2026,4,1)+t*864e5).toISOString().slice(0,10);d.messungen.push({id:'d'+t,datum:dt,zeit:'08:00',stelle:'vorne',ph:6.5,ec:1,quelle:'excel'})}
  ['07:00','09:00','11:00','13:00','15:00','17:00'].forEach((z,i)=>d.messungen.push({id:'s'+i,datum:'2026-09-20',zeit:z,stelle:'vorne',ph:5.8+i*0.1,ec:1.2,quelle:'erfassen'}));
  A.setDb(d);A.setTab('tank');A.setZeit(null,null);A.vTank();A.nachRenderRun();
  let Z=A.getZeit();
  const tage=()=>Math.round((Z.koBis-Z.koVon)/864e5*100)/100;
  ok(Z.koVon===null&&Z.ZEIT&&Z.ZEIT.x0===Z.ZEIT.g0&&Z.ZEIT.x1===Z.ZEIT.g1&&Z.wahl==='alles','Zu Beginn ist alles sichtbar, «alles» hervorgehoben');
  A.AKTION.zoomEin();Z=A.getZeit();
  ok(tage()===90&&Z.koBis===Z.ZEIT.g1&&Z.wahl==='90','«+» springt auf die nächste Stufe: 3 Monate, das Neueste bleibt rechts im Bild');
  const stufen=[];for(let i=0;i<12;i++){A.AKTION.zoomEin();Z=A.getZeit();stufen.push(tage())}
  ok(stufen.slice(0,8).join(' ')==='42 21 14 7 3 1 0.5 0.25'&&stufen[11]===0.25,'Weiter: 6 Wochen, 3 Wochen, 2 Wochen, 1 Woche, 3 Tage, 1 Tag, 12 Stunden, 6 Stunden – dann ist Schluss ('+stufen.join(' ')+')');
  ok(/data-tun="zoomEin"[^>]*aria-disabled="true"/.test($('cTank').innerHTML),'Am Ende ist «+» gedimmt');
  const zurueck=[];for(let i=0;i<12;i++){A.AKTION.zoomAus();Z=A.getZeit();zurueck.push(Z.koVon===null?'alles':tage())}
  ok(zurueck.slice(0,9).join(' ')==='0.5 1 3 7 14 21 42 90 alles','«−» geht dieselben Stufen zurück bis «alles» ('+zurueck.slice(0,9).join(' ')+')');
  ok(/data-tun="zoomAus"[^>]*aria-disabled="true"/.test($('cTank').innerHTML),'Bei «alles» ist «−» gedimmt');
  A.AKTION.zeitVorgabe({v:'7'});Z=A.getZeit();
  ok(Z.wahl==='7'&&tage()===7&&Z.koBis>=Z.ZEIT.letzte,'«1 Woche»: die letzten sieben Tage bis zur jüngsten Messung');
  const mitte=Z.ZEIT.g0+50*864e5;A.setZeit(mitte-7*864e5,mitte+7*864e5);A.getDiag().zeichnen();
  A.AKTION.zoomEin();Z=A.getZeit();
  ok(tage()===7&&Math.abs((Z.koVon+Z.koBis)/2-mitte)<1e3,'Mitten in den Daten zoomt «+» um die Mitte');
  A.setZeit(Z.ZEIT.g0-50*864e5,Z.ZEIT.g0-40*864e5);A.getDiag().zeichnen();Z=A.getZeit();
  ok(Z.koVon===Z.ZEIT.g0&&tage()===10,'Ein Ausschnitt vor dem ersten Wert wird an den Anfang geschoben – man verliert sich nicht');
  A.AKTION.zeitVorgabe({v:'alles'});
  ok(A.getZeit().koVon===null,'«alles»');
  const s=$('cTank').innerHTML;
  ok(/data-tun="zeitVorgabe" data-v="alles"/.test(s)&&/data-tun="zeitVorgabe" data-v="90"/.test(s)&&/data-tun="zeitVorgabe" data-v="42"/.test(s)&&/data-tun="zeitVorgabe" data-v="7"/.test(s),'Feste Zeiträume: alles, 3 Monate, 6 Wochen, 1 Woche');
  ok((s.match(/class="zeiger"/g)||[]).length>=2&&(s.match(/class="zeigerDatum"/g)||[]).length===2&&(s.match(/class="ring"/g)||[]).length===2,'Jede Grafik hat Zeiger, Datumsschild und Ring für den nächsten Punkt');
  ok(/23\.04\.|\d\d\.\d\d\. – \d\d\.\d\d\.2026 · \d+ Tage/.test(s),'Oben steht der Zeitraum mit seiner Länge');
  ok(A.bereichText(Date.UTC(2026,8,24,6),Date.UTC(2026,8,26,18))==='24.09. 06:00 – 26.09. 18:00 · 2½ Tage'&&A.bereichText(Date.UTC(2026,8,24,6),Date.UTC(2026,8,24,18))==='24.09. 06:00 – 18:00 · 12 Stunden','Kurze Zeiträume mit Uhrzeit');
  /* Der nächste Punkt – man muss ihn nicht genau treffen */
  A.AKTION.zeitVorgabe({v:'7'});
  const l=A.getZeit().ZEIT.treffer[0],p=l[Math.floor(l.length/2)];
  ok(A.naechsterPunkt(0,p.cx+12,p.cy+5,20)===p&&A.naechsterPunkt(0,p.cx,p.cy+40,20)===null,'Zeigen 13 px neben einem Punkt trifft ihn, 40 px daneben nicht');
  A.AKTION.zeitVorgabe({v:'alles'});
  /* Ausschnitt je Reiter, nur in dieser Sitzung */
  A.AKTION.zeitVorgabe({v:'7'});
  A.setTab('kombi');A.render();A.setTab('tank');A.render();A.nachRenderRun();
  ok(Math.round((A.getZeit().koBis-A.getZeit().koVon)/864e5)===7,'Zum anderen Reiter und zurück: der Ausschnitt ist noch da');
  A.AKTION.zeitVorgabe({v:'alles'});
}

console.log('\n════ Viele Messungen am Tag: Stufen statt Haufen ════');
{
  ok(A.verdichtStufe(40,null)==='einzeln'&&A.verdichtStufe(20,null)==='halb'&&A.verdichtStufe(8,null)==='tag','Ab 30 Bildpunkten je Tag jede Messung, ab 14 je halber Tag, darunter je Tag');
  ok(A.verdichtStufe(28,'einzeln')==='einzeln'&&A.verdichtStufe(26,'einzeln')==='halb'&&A.verdichtStufe(13,'halb')==='halb'&&A.verdichtStufe(12,'halb')==='tag'&&A.verdichtStufe(13,'einzeln')==='halb',
     'Zurück zur gröberen Stufe erst unter 90 % – beim Zoomen flackert nichts');
  A.setZeit(null,null);A.vTank();A.nachRenderRun();
  let s=$('cTank').innerHTML,Z=A.getZeit();
  ok(Z.ZEIT.stufe==='tag'&&/Punkt = Mittel je Tag/.test(s),'Alles im Blick: je Tag ein Punkt – der Kopf von pH sagt es');
  const tag=+new Date('2026-09-20');
  const blk=Z.ZEIT.treffer[0].find(t=>t.block!=null&&Math.floor(t.block/864e5)*864e5===tag);
  ok(!!blk,'Der 20.09. mit sieben Messungen ist ein Punkt – anklickbar');
  const tipp=blk?blk.tipp.replace(/<[^>]+>/g,' ').replace(/\s+/g,' '):'';
  ok(/Messungen: 7 \(07:00 bis 17:00\)/.test(tipp)&&/tiefster Wert: 5.8/.test(tipp)&&/höchster Wert: 6.5/.test(tipp)&&/Mittelwert: 6.1/.test(tipp)&&/So 20\.09\.2026/.test(tipp),'Das Kästchen: Tag, Anzahl mit Uhrzeiten, Mittelwert, tiefster und höchster Wert ('+tipp.trim()+')');
  ok(Z.ZEIT.treffer.flat().length===300,'Je Tag ein Punkt: 150 Tage, pH und EC – 300');
  ok((s.match(/stroke-width="3" stroke-linecap="round" opacity=".3"/g)||[]).length===2,'Nur der Tag mit mehreren Messungen hat einen Strich (pH und EC)');
  A.AKTION.zeitVorgabe({v:'42'});s=$('cTank').innerHTML;Z=A.getZeit();
  const am20=Z.ZEIT.treffer[0].filter(t=>(t.block!=null?Math.floor(t.block/864e5)*864e5:null)===tag||/20\.09\.2026/.test(t.tipp));
  ok(Z.ZEIT.stufe==='halb'&&am20.length===2&&/Punkt = Mittel je halben Tag/.test(s),'6 Wochen: der 20.09. als Vormittag und Nachmittag – zwei Punkte statt einem');
  ok(/00–12 Uhr/.test(am20.map(t=>t.tipp).join(' '))&&/12–24 Uhr/.test(am20.map(t=>t.tipp).join(' ')),'… im Kästchen mit dem halben Tag');
  A.AKTION.zoomTag({x:String(blk.block)});s=$('cTank').innerHTML;Z=A.getZeit();
  const L=(Z.koBis-Z.koVon)/864e5,drin=A.getDb().messungen.filter(m=>{const x=+new Date(m.datum)+(+m.zeit.slice(0,2))*36e5;return x>=Z.koVon&&x<=Z.koBis}).length;
  ok(Math.round(L)===7&&Z.ZEIT.stufe==='einzeln'&&Z.ZEIT.treffer[0].length===drin&&/Punkte: jede Messung/.test(s),'Anklicken: eine Woche um den Punkt, jede Messung einzeln ('+drin+')');
  A.AKTION.zeitVorgabe({v:'alles'});
  /* Ohne Uhrzeit: nie in einen halben Tag einsortiert */
  const d2=A.getDb();['a','b','c'].forEach((k,i)=>d2.messungen.push({id:'u'+k,datum:'2026-09-10',stelle:'vorne',ph:6+i*0.2,ec:1,quelle:'excel'}));
  A.vTank();A.nachRenderRun();A.AKTION.zeitVorgabe({v:'42'});Z=A.getZeit();
  const u=Z.ZEIT.treffer[0].filter(t=>/10\.09\.2026/.test(t.tipp));
  ok(u.length===2&&u.some(t=>/als Tag zusammengefasst/.test(t.tipp)),'Messungen ohne Uhrzeit bilden ihren eigenen Punkt für den Tag – keine erfundene Tageszeit');
  A.AKTION.zeitVorgabe({v:'alles'});
}

console.log('\n════ Einträge der Mobile App ════');
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
  ok(/Noch nichts aus der Mobile App/.test(A.vMaske()),'Ohne Einträge: ein Hinweis');
}

console.log('\n════ Persönliche Ansicht ════');
{
  const speicher={};global.localStorage={getItem:k=>speicher[k]??null,setItem:(k,v)=>{speicher[k]=String(v)}};
  A.setTab('tank');A.setKombi({blatt:['K','Fe'],wasser:['gw_NO3'],etage:'jung',skala:'lage'});A.setKmAus(new Set(['m|em']));
  A.ansichtMerken();
  A.setTab('analysen');A.setKombi({blatt:['NO3'],wasser:[],etage:'beide',skala:'wert'});A.setKmAus(new Set());
  A.ansichtLaden();
  const k=A.getKombi();
  ok(k.blatt.join()==='K,Fe'&&k.wasser.join()==='gw_NO3'&&k.etage==='jung'&&k.skala==='lage'&&A.getKmAus().has('m|em'),'Auswahl und ausgeblendete Balken überstehen das Neuladen');
  ok(A.getTab()==='analysen'&&!/"tab"/.test(speicher['basilikum.ansicht']),'Der Reiter nicht – die Seite öffnet immer mit Blattsaft & Giesswasser');
  speicher['basilikum.ansicht']=JSON.stringify({tab:'giess',kbEtage:'quer',kbBlatt:'kaputt'});
  A.setTab('kombi');A.ansichtLaden();
  ok(A.getTab()==='kombi'&&A.getKombi().etage==='jung','Ein alter Reiter («giess») und Unsinn werden ignoriert');
  delete global.localStorage;
}

console.log('\n════ «Ältere Daten übernommen»: einmal und nicht wieder ════');
{
  const speicher={};global.localStorage={getItem:k=>speicher[k]??null,setItem:(k,v)=>{speicher[k]=String(v)}};
  const k=A.hinweisSchluessel(['5 Einträge zu einem Mittel, das nicht mehr geführt wird, sind entfernt.']);
  ok(!A.hinweisGesehen(k),'Zuerst: noch nicht gesehen');
  A.AKTION.hinweisVerstanden({k});
  ok(A.hinweisGesehen(k),'«Verstanden» merkt ihn sich auf diesem Gerät');
  ok(A.hinweisSchluessel(['5 Einträge zu einem Mittel, das nicht mehr geführt wird, sind entfernt.'])===k&&A.hinweisSchluessel(['etwas anderes'])!==k,'Derselbe Wortlaut kommt nicht wieder – ein neuer schon');
  global.localStorage={getItem(){throw new Error('gesperrt')},setItem(){throw new Error('gesperrt')}};
  ok(A.hinweisGesehen(k)===false,'Ist der Speicher gesperrt, läuft alles weiter – der Hinweis darf dann erneut kommen');
  delete global.localStorage;
}

console.log('\n════ Aus der Prüfung: Achse, Rundung, Ziehen, gleiche Namen ════');
{
  /* Stunden auf einem schmalen Handy: das Datum (Mitternacht) bleibt stehen */
  const x0=+new Date('2026-10-04T04:00:00Z'),x1=x0+2.5*864e5,P=232,X=v=>(v-x0)/(x1-x0)*P;
  const m=A.markenDuenn(A.zeitMarken(x0,x1),X).map(t=>t.text);
  ok(m.some(t=>/^\d\d\.\d\d\.$/.test(t))&&m.length>=3,'2½ Tage auf 232 px: unter den Stunden steht das Datum ('+m.join(' ')+')');
  const x0b=x0+3*36e5,Xb=v=>(v-x0b)/(x1-x0)*P;
  const mb=A.markenDuenn(A.zeitMarken(x0b,x0b+(x1-x0)),Xb).filter(t=>t.x>=x0b&&t.x<=x1).map(t=>t.x);
  const ma=A.markenDuenn(A.zeitMarken(x0,x1),X).filter(t=>t.x>=x0b&&t.x<=x1).map(t=>t.x);
  ok(ma.join()===mb.join(),'Um drei Stunden verschoben: dieselben Marken – beim Ziehen springt nichts');
  const t0=+new Date('2026-09-03T00:00:00Z'),L=12*864e5;
  const tage=a=>A.markenDuenn(A.zeitMarken(a,a+L),v=>(v-a)/L*700).map(t=>t.x);
  const a1=tage(t0),a2=tage(t0+864e5);
  ok(a1.filter(x=>x>=t0+864e5).every(x=>a2.includes(x))&&a2.filter(x=>x<=t0+L).every(x=>a1.includes(x)),'Tage im Zweierschritt: ein Tag weiter – dieselben Daten, nicht abwechselnd gerade und ungerade');
  /* Kurz vor Mitternacht */
  const z=s=>+new Date(s);
  ok(A.bereichText(z('2026-10-04T23:55:00Z'),z('2026-10-05T23:55:00Z'))==='05.10. 00:00 – 06.10. 00:00 · 1 Tag','23:55 wird auf 00:00 des nächsten Tages gerundet – samt Datum');
  ok(/^05\.10\. 20:00 – 06\.10\. 02:00 · 6 Stunden$/.test(A.bereichText(z('2026-10-05T20:00:00Z'),z('2026-10-06T02:00:00Z'))),'Unter einem Tag über Mitternacht: das Enddatum steht dabei');
  /* Ziehen in der Tafel, wenn eine Zeile ausgeblendet ist */
  A.setDb(A.leer());A.setKmAus(new Set());
  for(const n of ['Aa','Bb','Cc','Dd'])plus('neu','2026-09-0'+(1+['Aa','Bb','Cc','Dd'].indexOf(n)),'laeuft','','',n);
  A.setTab('kombi');
  A.kmOrdnen(['n|Aa','n|Dd','n|Bb','n|Cc']);
  A.setKmAus(new Set(['n|Dd']));
  const sicht=['n|Aa','n|Bb','n|Cc'];
  A.kmVerschieben('n|Aa',1,sicht);
  const reihe=A.kmListe().filter(x=>x.art==='eigen').map(x=>x.key);
  ok(reihe.filter(k=>sicht.includes(k)).join(' ')==='n|Bb n|Aa n|Cc'&&reihe[1]==='n|Dd','Aa unter Bb gezogen, Dd ausgeblendet: zu sehen ist Bb, Aa, Cc – Dd bleibt auf seinem Platz ('+reihe.join(' ')+')');
  A.setKmAus(new Set());
  /* Gleicher Name, anders geschrieben: dieselbe Zeile */
  plus('neu','2026-05-01','tag','','','  aa ');
  ok(A.kmListe().filter(x=>x.art==='eigen'&&/^aa$/i.test(x.name)).length===1&&A.beigabeHand(h=>h.name==='Aa').length===2,'«aa» im Mai landet in der Zeile «Aa» – nicht in einer zweiten');
  /* Klick auf den Tagespunkt auf einem schmalen Handy */
  const d=A.leer();for(let i=0;i<60;i++){const t=new Date(Date.UTC(2026,6,1)+i*864e5).toISOString().slice(0,10);
    for(const h of ['07:00','12:00','17:00'])d.messungen.push({id:'m'+i+h,datum:t,zeit:h,stelle:'vorne',ph:6+(i%5)*0.1,ec:1.2,quelle:'excel'})}
  A.setDb(d);A.setTab('tank');A.setZeit(null,null);
  $('cTank').clientWidth=300;A.vTank();A.nachRenderRun();
  let Z=A.getZeit();const blk=Z.ZEIT.treffer[0].find(t=>t.block!=null);
  A.AKTION.zoomTag({x:String(blk.block)});Z=A.getZeit();
  ok(Z.ZEIT.stufe==='einzeln','Auf 300 px Breite: Anklicken eines Tagespunkts zeigt jede Messung ('+((Z.koBis-Z.koVon)/864e5).toFixed(1)+' Tage)');
  A.AKTION.zeitVorgabe({v:'alles'});delete $('cTank').clientWidth;
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
