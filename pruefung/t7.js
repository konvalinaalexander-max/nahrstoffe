const A=require('./harness.js');
const seiten=require('./seiten.json');
const r=A.parseNCC(seiten);
console.log('════ parseNCC gegen die echte Datei ════');
console.log('Labor  :',r.labor);
console.log('Typ    :',r.typ);
console.log('Proben :',r.proben.length);
console.log('Hinweise:',r.hinweise.length?r.hinweise:'keine');
r.proben.forEach((p,i)=>{
  console.log('\n── Probe '+(i+1)+' ──');
  console.log('  LaborId   :',p.laborId);
  console.log('  Datum     :',p.datum);
  console.log('  Satz      :',p.satz);
  console.log('  Kultur    :',JSON.stringify(p.kultur));
  console.log('  Blattalter:',p.blattalter,'·',p.blattalterBeleg);
  console.log('  Zustand   :',p.zustand);
  console.log('  Parameter :',Object.keys(p.werte).length,'von 23');
});
const fehlt=A.NCC.map(x=>x[1]).filter(k=>!(k in r.proben[0].werte));
console.log('\nNicht gelesen bei Probe 1:',fehlt.length?fehlt:'– keine –');
const fehlt2=A.NCC.map(x=>x[1]).filter(k=>!(k in r.proben[1].werte));
console.log('Nicht gelesen bei Probe 2:',fehlt2.length?fehlt2:'– keine –');

console.log('\n════ Werte und Optima, wie die App sie sieht ════');
const soll={Zucker:[1.1,0.5],pH:[5.8,5.8],EC:[9.7,8.5],K:[1040,1418],Ca:[814,766],'K/Ca':[1.28,1.85],
 Mg:[654,314],Na:[4,13],NH4:[178,85],NO3:[36,263],N_aus_NO3:[8,59],N_gesamt:[1466,807],Cl:[2706,1811],
 S:[377,327],P:[520,380],Si:[31.5,47.2],Fe:[1.06,1.22],Mn:[7.08,10.54],Zn:[0.64,0.57],B:[0.79,1.05],
 Cu:[0.29,0.18],Mo:[0.05,0.05],Al:[1.03,1.42]};
const sollOpt={Zucker:[0.2,0.4],pH:[6.1,6.2],EC:[12.5,13.6],K:[3975,4800],Ca:[810,1275],Mg:[310,430],
 Na:[22,44],NH4:[25,55],NO3:[2010,3530],N_aus_NO3:[454,797],N_gesamt:[830,1270],Cl:[750,1775],S:[170,230],
 P:[360,530],Si:[25.6,37.3],Fe:[0.8,1.6],Mn:[3,7],Zn:[1.6,2.25],B:[0.8,2.6],Cu:[0.3,0.5],Mo:[null,0.05],Al:[0.5,0.5]};
let fehler=0;
console.log('Param      jung      alt       Optimum          Kontrolle');
for(const [k,[sj,sa]] of Object.entries(soll)){
  const gj=r.proben[0].werte[k]?.wert, ga=r.proben[1].werte[k]?.wert;
  const go=r.proben[0].optima[k], so=sollOpt[k];
  const okJ=gj===sj, okA=ga===sa;
  const okO=!so?!go:(go&&go[0]===so[0]&&go[1]===so[1]);
  if(!okJ||!okA||!okO)fehler++;
  console.log(
    k.padEnd(10),
    String(gj??'—').padEnd(9),String(ga??'—').padEnd(9),
    (go?JSON.stringify(go):'—').padEnd(16),
    (okJ?'':'JUNG≠'+sj+' ')+(okA?'':'ALT≠'+sa+' ')+(okO?'':'OPT≠'+JSON.stringify(so))+(okJ&&okA&&okO?'ok':''));
}
console.log('\nAbweichungen gegenüber dem PDF:',fehler);
console.log('limit-Markierungen:',Object.entries(r.proben[0].werte).filter(([,v])=>v.limit).map(([k])=>k).join(', ')||'keine');
