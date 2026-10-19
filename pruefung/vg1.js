/* Living Herbs vs Topfbasilikum: fünf Berichte vom 9. April 2026 – lesen,
   zuordnen, nicht im Verlauf, Balken je Nährstoff. */
const A=require('./harness.js');
let fehler=0;
const ok=(b,t)=>{if(!b)fehler++;console.log((b?'  ✓ ':'  ✗ FEHLER ')+t)};
const $=id=>document.getElementById(id);
const toasts=[];global.document.createElement=t=>{const e={className:'',textContent:'',remove(){},classList:{add(){},remove(){}}};toasts.push(e);return e};
const letzterToast=()=>(toasts[toasts.length-1]||{}).textContent||'';
const PDF=require('./seiten-vergleich.json');
const roh=(r,f)=>r.proben.map(p=>Object.assign({id:'x'+p.laborId,typ:r.typ,labor:r.labor,quelle:{datei:f,text:r.rohtext}},p));

console.log('════ Die fünf PDFs lesen ════');
const gelesen=[];
for(const f of Object.keys(PDF)){const r=A.parseAuto(PDF[f],null);gelesen.push(...roh(r,f))}
ok(gelesen.length===8,'Fünf PDFs, acht Proben (09-844, 09-498 und 08-441 je jung und alt, «Nur Mangel» und 10-228 je eine)');
ok(gelesen.every(p=>p.datum==='2026-04-09'&&p.typ==='blattsaft'),'Alle vom 09.04.2026, alle Blattsaft');
const kurz=gelesen.map(p=>p.satz+'/'+p.blattalter+(p.zusatz?'/'+p.zusatz:'')).sort().join(' ');
ok(kurz==='08-441/alt 08-441/alt/Nur Mangel 08-441/jung 09-498/alt 09-498/jung 09-844/alt 09-844/jung 10-228/jung',
  'Satz und Blatt wie im Bericht, «Nur Mangel» als Zusatz: '+kurz);
ok(gelesen.filter(p=>p.zusatz).length===1,'Nur die Mangelprobe trägt einen Zusatz – «Eichhof» ist die Adresse, kein Zusatz');
const mangel=gelesen.find(p=>p.zusatz);
ok(mangel.werte.Cu&&mangel.werte.Cu.unter&&mangel.werte.Cu.wert===0.1,'Kupfer der Mangelprobe: <0,1 (unter der Nachweisgrenze)');
ok(A.parseAuto(require('./seiten.json'),null).proben.every(p=>p.zusatz===null),'Der alte Bericht («Basilikum 28-478») bekommt keinen Zusatz');

console.log('\n════ Was in der App hinterlegt ist, ist genau das, was der Upload liest ════');
const V=A.VG_VORLAGE;
ok(V.proben.length===8&&V.zeilen.length===5,'Vorlage: fünf Zeilen, acht Proben');
const gleich=V.proben.every(v=>{const g=gelesen.find(p=>p.laborId===v.laborId);
  return g&&['datum','satz','zusatz','blattalter','zustand','kultur','anbau'].every(k=>g[k]===v[k])
    &&JSON.stringify(g.werte)===JSON.stringify(v.werte)&&JSON.stringify(g.optima)===JSON.stringify(v.optima)});
ok(gleich,'Werte, Optima, Satz, Blatt und Zusatz der Vorlage = Ergebnis von parseNCC');
ok(V.proben.every(v=>v.quelle&&v.quelle.text&&/Probendatum: 9-4-2026/.test(v.quelle.text)),'Jede Probe trägt den Bericht im Wortlaut');
ok(V.zeilen.map(z=>z.satz+(z.zusatz?'+':'')).join(' ')==='09-844 09-498 08-441 08-441+ 10-228','Zeilen in der Reihenfolge des Mails');
ok(V.zeilen.map(z=>z.gruppe).join(',')==='topf,lh,,,lh','Gruppen laut Mail: ① Topfbasilikum, ② und ⑤ Living Herbs, 08-441 offen');

console.log('\n════ Fünf Berichte, fünf Zeilen ════');
{
  const d=A.leer();d.analysen=JSON.parse(JSON.stringify(V.proben));A.setDb(d);
  const b=A.berichte();
  ok(b.length===5,'Acht Proben ergeben fünf Berichte – die Mangelprobe steht für sich');
  const m=b.find(x=>x.zusatz==='Nur Mangel');
  ok(m&&m.proben.length===1&&m.proben[0].blattalter==='alt','«Nur Mangel» ist ein eigener Bericht mit einem Blatt');
  ok(A.berichtTitel(m)==='Blattsaft · Satz 08-441 · Nur Mangel · 09.04.2026','Der Titel nennt den Zusatz');
  const n=V.zeilen.map(z=>A.vgProbenVon(z).map(a=>a.blattalter).join('+')).join(' ');
  ok(n==='jung+alt jung+alt jung+alt alt jung','Jede Zeile findet ihre Proben, jung vor alt: '+n);
  ok(A.vgZeileVon(m.proben[0]).nr===4&&A.vgZeileVon(b.find(x=>x.satz==='08-441'&&!x.zusatz).proben[0]).nr===3,'Zeile 3 und 4 auseinandergehalten');
  ok(A.vgZeileVon({typ:'blattsaft',satz:'08-441',datum:'2026-05-09',zusatz:null})===null,'Derselbe Satz an einem anderen Tag gehört nicht dazu');
  ok(A.vgZeileVon({typ:'giesswasser',satz:'09-844',datum:'2026-04-09'})===null,'Wasser gehört nicht dazu');
}

console.log('\n════ Nicht im Verlauf – ausser man will ════');
{
  const d=A.leer();d.analysen=JSON.parse(JSON.stringify(V.proben));A.setDb(d);
  ok(A.vgVerborgen().size===8,'Alle acht Vergleichsproben sind im Verlauf ausgeblendet');
  const h=A.vKombi();
  ok(/Noch keine Analysen im Verlauf/.test(h)&&/data-reiter="vergleich"/.test(h),'Nur Vergleichsproben: der Verlauf sagt, wo sie stehen');
  d.analysen.push({id:'b1',typ:'blattsaft',datum:'2026-08-18',satz:'28-478',blattalter:'jung',werte:{K:{wert:1040}},optima:{K:[3975,4800]}});
  A.setKombi({blatt:['K']});
  const h2=A.vKombi();A.nachRenderRun();
  const t=$('cKb').innerHTML;
  ok(/Vergleichsproben vom 09\.04\.2026/.test(t),'Im Kopf der Grafik Blattsaft der Weg zum Vergleich');
  ok(!/09\.04\.2026/.test(t.replace(/Vergleichsproben vom 09\.04\.2026/g,'')),'Kein Punkt vom 09.04. im Blattsaft');
  A.AKTION.vgImVerlauf({},{target:{checked:true}});
  ok(A.getDb().vergleiche.length===1&&A.getDb().vergleiche[0].imVerlauf===true&&!A.getDb().vergleiche[0].proben,'Eingeschaltet: der Vergleich steht im Bestand, ohne die Proben der Vorlage');
  ok(A.vgVerborgen().size===0,'… und die Proben stehen im Verlauf');
  A.vKombi();A.nachRenderRun();
  ok(!/Vergleichsproben vom/.test($('cKb').innerHTML),'… ohne den Hinweis');
  A.AKTION.vgImVerlauf({},{target:{checked:false}});
  ok(A.vgVerborgen().size===8,'Ausgeschaltet: wieder nur im Vergleich');
  void h2;
}

console.log('\n════ Der Reiter ════');
{
  A.setDb(A.leer());A.setVg({an:[1,2,3,4,5],stoffe:null,etage:'beide',skala:'wert'});A.resetKombi();
  let h=A.vVergleich();A.nachRenderRun();
  ok(/Die 5 Berichte übernehmen/.test(h)&&/Bericht fehlt/.test(h),'Leer: fünf Zeilen mit «Bericht fehlt» und dem Knopf zum Übernehmen');
  ok(/Von Elaine, zum Messzeitpunkt im Verkauf/.test(h)&&/schön grün/.test(h),'Die Beschreibungen aus dem Mail stehen da');
  ok(/sagt das Mail nicht/.test(h),'Dass das Mail bei 08-441 keine Gruppe nennt, steht da');
  ok(/Die 5 Berichte übernehmen/.test($('cVgK').innerHTML),'Auch die Grafik bietet das Übernehmen an');
  A.AKTION.vgVorlage();
  ok($('dlgBody').innerHTML.split('data-warn=').length-1===8,'Übernehmen öffnet den Kontrolldialog mit allen acht Proben');
  ok(A.getPruefZiel()==='vergleich','… mit dem Ziel «Vergleich»');
  ok(/data-f="zusatz"/.test($('dlgBody').innerHTML)&&/value="Nur Mangel"/.test($('dlgBody').innerHTML),'Im Kontrolldialog steht der Zusatz zum Ändern');
  A.setTab('analysen');
  A.AKTION.uebernehmen();
  ok(A.getDb().analysen.length===8,'Übernommen: acht Proben im Bestand');
  ok(A.getTab()==='vergleich','… und man bleibt im Vergleich');
  ok(/8 Proben übernommen\./.test(letzterToast()),'Meldung: '+letzterToast());
  A.AKTION.vgVorlage();
  ok(/schon übernommen/.test(letzterToast()),'Ein zweites Mal: nichts doppelt');

  h=A.vVergleich();A.nachRenderRun();
  const k=$('cVgK').innerHTML;
  ok(!/Bericht fehlt|Berichte übernehmen/.test(h),'Alle fünf Zeilen haben ihren Bericht');
  ok(!/undefined|NaN|\[object Object\]/.test(h+k),'Sauber gerendert');
  ok((k.match(/class="vgKachel"/g)||[]).length===3,'Ohne eigene Wahl: Kalium, Kalzium, Magnesium – drei Kacheln');
  ok((k.match(/<g class="vgB"/g)||[]).length===24,'Je Kachel acht Balken (2+2+2+1+1)');
  ok((k.match(/class="vgNrS"/g)||[]).length===15,'Je Kachel fünf Nummern unter den Gruppen');
  ok(k.includes('Optimum '+A.esc(A.optText([3975,4800]))),'Kopf der Kachel: Optimum laut Labor ('+A.optText([3975,4800])+')');
  ok(/class="vgOpt"/.test(k),'Das Optimum als Band');
  const kal=k.split('class="vgKachel"')[1];
  const ys=[...kal.matchAll(/<rect x="[\d.]+" y="([\d.]+)" width="[\d.]+" height="([\d.]+)" rx="2" fill="(#[0-9a-fA-F]{6})"( stroke)?/g)];
  ok(ys.length===8,'Kalium: acht Balken gezeichnet');
  ok(ys.filter(m=>m[4]).length===4&&new Set(ys.filter(m=>!m[4]).map(m=>m[3])).size===1,'Altes Blatt hell mit Rand (vier), junges voll in einer Farbe');
  ok(/data-tun="detail" data-id="lh26-202604171288"/.test(k),'Ein Balken öffnet seinen Bericht');

  A.setVg({stoffe:['Cu']});A.vgZeichnen();
  const cu=$('cVgK').innerHTML;
  const cuKachel=cu.split('class="vgKachel"')[1]||'';
  ok(cuKachel.includes('&lt;'+A.nz(0.1))&&/fill="#fff"/.test(cuKachel),'Kupfer der Mangelprobe: «<'+A.nz(0.1)+'» als hohle Marke bei 0');
  ok(/unter der Nachweisgrenze, bei 0/.test(cu),'Die Legende erklärt den hohlen Punkt');

  A.setVg({stoffe:['NO3']});A.vgZeichnen();
  const no3=$('cVgK').innerHTML;
  const mx=Math.max(...A.getDb().analysen.map(a=>a.werte.NO3.wert));
  ok(mx*3<2010?/↑ oberhalb/.test(no3):!/↑ oberhalb/.test(no3),'Nitrat: liegt das Optimum weit über allen Werten, steht es als Streifen oben (max '+mx+')');

  A.setVg({stoffe:['K/Ca'],skala:'lage'});A.vgZeichnen();
  ok(/kein Optimum des Labors/.test($('cVgK').innerHTML),'K/Ca hat kein Optimum – in «Lage» steht das so da');
  A.setVg({stoffe:['K','Mg'],skala:'wert',etage:'jung'});A.vgZeichnen();
  const j=$('cVgK').innerHTML;
  ok((j.match(/<g class="vgB"/g)||[]).length===8,'Nur junges Blatt: vier Balken je Kachel');
  ok(/In den übernommenen Proben steht kein junges Blatt/.test(j)&&!/eingeschickt/.test(j),'Die Mangelprobe hat kein junges Blatt – ein Strich mit Erklärung, nichts über die Einsendung');

  A.setVg({etage:'beide',stoffe:['K']});
  A.AKTION.vgProbe({nr:'3'});A.AKTION.vgProbe({nr:'4'});
  ok((($('cVgK').innerHTML).match(/<g class="vgB"/g)||[]).length===5,'Zeilen 3 und 4 ausgeschaltet: fünf Balken');
  ok(/aria-pressed="false"/.test($('cVgP').innerHTML),'Die Zeile zeigt, dass sie aus ist');
  A.AKTION.vgAlle({v:'aus'});
  ok(/Keine Probe eingeschaltet/.test($('cVgK').innerHTML),'Keine: die Grafik sagt, was zu tun ist');
  A.AKTION.vgAlle({v:'an'});
  ok(A.getVg().an.length===5,'Alle: wieder fünf');
  let viele=0;A.setVg({stoffe:[]});
  for(const s of ['K','Ca','Mg','Na','NH4','NO3','S','P','Fe'])A.AKTION.vgStoff({k:s});
  viele=A.getVg().stoffe.length;
  ok(viele===8&&/Höchstens 8/.test(letzterToast()),'Höchstens acht Nährstoffe auf einmal');
}

console.log('\n════ Beschreibung ändern ════');
{
  A.AKTION.vgBearb({nr:'3'});
  ok(/Starke Mangelsymptome/.test($('dlgBody').innerHTML)&&/nicht angegeben/.test($('dlgBody').innerHTML),'Der Dialog zeigt Text und Gruppe');
  $('vgText').value='Starke Mangelsymptome, überständig. Living Herbs.';
  A.AKTION.vgSpeichern({nr:'3'});
  const z=A.getDb().vergleiche[0].zeilen.find(x=>x.nr===3);
  ok(z.text==='Starke Mangelsymptome, überständig. Living Herbs.'&&z.beleg==='geändert','Gespeichert und als geändert vermerkt');
  ok(/\(geändert\)/.test(A.vgProbenHtml()),'Die Zeile sagt, dass der Text nicht mehr der aus dem Mail ist');
  ok(A.VG_VORLAGE.zeilen[2].text.startsWith('Starke Mangelsymptome, zum'),'Die Vorlage bleibt unverändert');
}

console.log('\n════ Bericht, Analysen, Sicherung ════');
{
  const b=A.berichtVon('lh26-202604171294');
  const t=A.amTagZeile(b);
  ok(/data-tun="imVergleich" data-nr="4"/.test(t)&&!/imVerlauf/.test(t),'Im Bericht: «Im Vergleich zeigen» statt «Im Verlauf zeigen»');
  ok(/Am selben Tag/.test(t),'… und die anderen Berichte vom selben Tag');
  A.AKTION.imVergleich({nr:'4'});
  ok(A.getTab()==='vergleich','«Im Vergleich zeigen» wechselt in den Reiter');
  const an=A.vAnalysen();
  ok(/Nur Mangel/.test(an)&&(an.match(/vgTag/g)||[]).length===5,'Analysen: Zusatz und «Vergleich» bei allen fünf');
  const d=A.getDb(),kopie=JSON.parse(JSON.stringify(d));
  const m=A.migriere(kopie);
  ok(m.db.vergleiche.length===1&&m.db.vergleiche[0].zeilen.length===5,'Gesichert und wieder geladen: der Vergleich bleibt');
  ok(JSON.stringify(m.db.analysen)===JSON.stringify(d.analysen),'… die Analysen unverändert');
  const f=A.vereinigen(JSON.parse(JSON.stringify(A.leer())),JSON.parse(JSON.stringify(d)));
  ok(f.db.vergleiche.length===1,'Gleichzeitig gespeichert: der Vergleich kommt aus dem anderen Stand dazu');
}

console.log('\n════ Ältere Daten: der Zusatz aus dem Wortlaut ════');
{
  const alt=JSON.parse(JSON.stringify(A.VG_VORLAGE.proben));
  for(const a of alt)delete a.zusatz;
  const m=A.migriere({schema:12,analysen:alt});
  ok(m.db.analysen.filter(a=>a.zusatz==='Nur Mangel').length===1&&m.db.analysen.filter(a=>'zusatz' in a).length===1,'Ohne Feld «zusatz»: aus dem Wortlaut nachgetragen, nur wo einer steht');
  ok(!m.notizen.length,'… stillschweigend, ohne Hinweis');
  const m2=A.migriere(JSON.parse(JSON.stringify(m.db)));
  ok(JSON.stringify(m2.db.analysen)===JSON.stringify(m.db.analysen),'Zweimal geladen: gleich');
  const ohne=A.migriere({schema:12,analysen:[{id:'h',typ:'blattsaft',satz:'08-441',datum:'2026-04-09',werte:{},optima:{}}]});
  ok(!('zusatz' in ohne.db.analysen[0]),'Ohne Wortlaut bleibt alles, wie es ist');
  const Z=A.zusatzAusText;
  ok(Z('Adresse: Eichhof Anbau: 08-441 Eichhof Nur Mangel','08-441')==='Nur Mangel','«08-441 Eichhof Nur Mangel» → «Nur Mangel»');
  ok(Z('Adresse: Eichhof Anbau: Basilikum 28-478','28-478')===null,'«Basilikum 28-478» → kein Zusatz');
  ok(Z('Adresse: Eichhof Anbau: 28-478 Eichhof gelb','28-478')===null,'Das Kulturbild («gelb») ist kein Zusatz, das steht schon als Kulturbild');
  ok(Z('Adresse: Eichhof Anbau: 08-441 Nur Mangel','09-844')===null,'Passt die Satznummer nicht, kein Zusatz');
  const vg=A.migriere({schema:12,analysen:[],vergleiche:[{id:'v',zeilen:[{nr:'2',satz:'09-498'},{nr:'x'},null]},{zeilen:[]},'quatsch']});
  ok(vg.db.vergleiche.length===1&&vg.db.vergleiche[0].zeilen.length===1&&vg.db.vergleiche[0].zeilen[0].nr===2,'Kaputte Vergleiche fallen weg, Nummern werden Zahlen');
  ok(A.leer().vergleiche.length===0&&A.leer().schema===12,'Neuer Bestand: leer, Schema bleibt 12');
  ok(A.heller('#336699',.5)==='#99b3cc'&&A.heller('nix',.5)==='nix','Hellere Farbe für das alte Blatt');
}

console.log('\n════ Aus der Prüfung ════');
{
  const V=A.VG_VORLAGE,nur=ids=>{const d=A.leer();d.analysen=JSON.parse(JSON.stringify(V.proben.filter(p=>ids.includes(p.laborId))));A.setDb(d)};
  const tipps=h=>[...h.matchAll(/data-tipp="([^"]*)"/g)].map(m=>m[1]);
  /* Platzhalter sagen nur, was die Daten hergeben */
  nur(['202604171288','202604171289']);A.setVg({an:[1,2,3,4,5],stoffe:['K'],etage:'beide',skala:'wert'});
  A.vVergleich();A.nachRenderRun();
  let t=tipps($('cVgK').innerHTML).join(' ');
  ok(/noch kein Bericht übernommen/.test(t)&&!/eingeschickt/.test(t),'Nur 09-844 übernommen: die anderen Proben «noch kein Bericht übernommen» – kein «nicht eingeschickt»');
  ok(!/<circle cx="[\d.]+" cy="141"/.test($('cVgK').innerHTML.split('class="vgNrS" data-nr="2"')[0].split('data-nr="2"').slice(1).join('')),'… und ohne Blattzeichen, das ein junges Blatt behauptet');
  /* Knopf: fehlt nur ein Blatt, bleibt «Fehlende Proben übernehmen» */
  nur(V.proben.map(p=>p.laborId).filter(x=>x!=='202604171289'));
  ok(/Fehlende Proben übernehmen \(1\)/.test(A.vgProbenHtml()),'Ein Blatt fehlt: «Fehlende Proben übernehmen (1)»');
  /* Lage ohne Optimum: kein grünes Band */
  nur(V.proben.map(p=>p.laborId));
  A.setVg({stoffe:['K/Ca'],skala:'lage'});A.vgZeichnen();
  ok(!/>Opt\.</.test($('cVgK').innerHTML)&&!/#E3F0E1/.test($('cVgK').innerHTML),'K/Ca in «Lage»: kein Optimum-Band, kein «Opt.»');
  /* Nachweisgrenze in «Lage»: dort, wo lage() sie hinlegt */
  const d=A.getDb(),mo=d.analysen.find(a=>a.laborId==='202604171290');mo.werte.Mo={wert:0.05,unter:true};
  A.setVg({stoffe:['Mo'],skala:'lage',an:[2]});A.vgZeichnen();
  const ring=$('cVgK').innerHTML.match(/<circle cx="[\d.]+" cy="([\d.]+)" r="4" fill="#fff"/);
  ok(ring&&Math.abs(+ring[1]-(14+(1-1/3)*118))<0.6,'Molybdän <0,05 bei Optimum «< 0,05»: hohl auf Lage 1, wie im Verlauf (cy '+(ring&&ring[1])+')');
  A.setVg({an:[1,2,3,4,5],skala:'wert',stoffe:['K']});
  /* Beschriftungen: eng → erst beim Zeigen, jeder zweite Platz höher */
  const sl=()=>V.zeilen.map(z=>({nr:z.nr,zeile:z,slots:A.vgProbenVon(z).map(a=>({a}))}));
  const eng=A.vgKachel('K','#A0442C',sl(),280,'wert'),breit=A.vgKachel('K','#A0442C',sl(),420,'wert');
  const ys=h=>[...h.matchAll(/class="vgWert( klein)?" data-nr="1" x="[\d.]+" y="([\d.]+)"/g)].map(m=>[!!m[1],+m[2]]);
  ok(ys(breit).every(x=>!x[0])&&ys(eng).every(x=>x[0]),'Breit: Werte stehen; schmal (280 px): erst beim Zeigen');
  ok(ys(eng).length===2&&Math.abs(ys(eng)[0][1]-ys(eng)[1][1])>=11,'Schmal: die zwei Werte einer Gruppe stehen 11 px auseinander – nichts überlappt ('+ys(eng).map(x=>x[1]).join(' / ')+')');
  /* Tabelle für Bildschirmleser */
  A.setVg({stoffe:['K']});A.vgZeichnen();
  ok(/<span class="sr">Probe 4, 08-441 Nur Mangel, <\/span>/.test($('cVgK').innerHTML),'Tabelle: Spaltenkopf nennt Probe, Satz und Zusatz für Bildschirmleser');
  ok(/<button type="button" class="chip stoff on" aria-pressed="true" data-tun="vgStoff" data-k="K"/.test($('cVgK').innerHTML),'Nährstoffe sind Knöpfe (Tastatur) mit aria-pressed');
  /* Zusatz im Verlauf, in «Am selben Tag», nur bei Blattsaft */
  A.AKTION.vgImVerlauf({},{target:{checked:true}});
  A.setKombi({blatt:['K']});A.vKombi();A.nachRenderRun();
  const tr=A.getZeit().ZEIT.treffer.flat().map(x=>x.tipp||x.html||'').join(' ');
  ok(/08-441 · Nur Mangel/.test(tr)||/08-441 · Nur Mangel/.test($('cKb').innerHTML),'Im Verlauf nennt das Kästchen den Zusatz – die zwei alten Blätter von 08-441 sind zu unterscheiden');
  A.AKTION.vgImVerlauf({},{target:{checked:false}});
  const knoepfe=[...A.amTagZeile(A.berichtVon('lh26-202604171288')).matchAll(/data-tun="detail"[^>]*>([^<]*)</g)].map(m=>m[1]);
  ok(new Set(knoepfe).size===knoepfe.length&&knoepfe.some(k=>/Nur Mangel/.test(k)),'«Am selben Tag»: jeder Knopf anders beschriftet ('+knoepfe.join(' | ')+')');
  A.pruefdialog([{id:'w9',typ:'giesswasser',datum:'2026-04-09',stelle:'Reservoir vorne',zusatz:'Nur Mangel',werte:{gw_K:{wert:1}},optima:{}}],false);
  A.AKTION.uebernehmen();
  const w9=A.getDb().analysen.find(a=>a.id==='w9');
  ok(w9&&!('zusatz' in w9)&&!/Nur Mangel/.test(A.berichtTitel(A.berichtVon('w9'))),'Auf Giesswasser umgestellt: der Zusatz fällt weg');
  ok(/Sie gehört|gehört zu keiner|übernommen\./.test(letzterToast())&&!/1 Probe übernommen\. Sie gehören/.test(letzterToast()),'Meldung in der Einzahl: '+letzterToast());
  A.pruefdialog([JSON.parse(JSON.stringify(V.proben[7]))].map(p=>Object.assign(p,{id:'x10'})),false);
  A.getDb().analysen=A.getDb().analysen.filter(a=>a.laborId!=='202604171295');
  A.AKTION.uebernehmen();
  ok(/1 Probe übernommen\. Sie gehört zum Vergleich/.test(letzterToast()),'Eine Probe des Vergleichs: «Sie gehört zum Vergleich …»');
  /* Verlauf: nur Vergleichsproben und Wasser → der Leertext sagt, wo sie stehen */
  const d2=A.leer();d2.analysen=JSON.parse(JSON.stringify(V.proben)).concat([{id:'g1',typ:'giesswasser',labor:'NovaCropControl',datum:'2026-09-01',stelle:'Basilikum RV',werte:{gw_K:{wert:0.7}},optima:{}}]);
  A.setDb(d2);A.setKombi({blatt:['K'],wasser:['gw_K']});A.vKombi();A.nachRenderRun();
  ok(/8 Vergleichsproben – im eigenen Reiter/.test($('cKb').innerHTML)&&!/Noch keine Blattsaftanalyse/.test($('cKb').innerHTML),'Verlauf mit nur Vergleichsproben: kein «Noch keine Blattsaftanalyse»');
  /* Zusatz: Wortlaut bleibt, nur ein allein stehendes Kulturbild fällt weg */
  ok(A.zusatzAusText('Adresse: Eichhof Anbau: 08-441 Eichhof Nur gelbe Blätter','08-441')==='Nur gelbe Blätter','«Nur gelbe Blätter» bleibt so, wie es im Bericht steht');
  ok(A.zusatzAusText('Adresse: Eichhof Anbau: 08-441 Eichhof grün','08-441')===null,'«Eichhof grün» → kein Zusatz (das ist das Kulturbild)');
}

console.log('\n════ Ergebnis ════');
console.log(fehler?`  ${fehler} FEHLER`:'  ✓ Alle Prüfungen bestanden.');
process.exit(fehler?1:0);
