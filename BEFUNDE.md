# Audit `basilikum.html` — Befunde vor der ersten Änderung

Stand: 25.08.2026 · geprüft gegen `basilikum.html` (1620 Zeilen, Skript ab Zeile 141)

Vorgehen nach Abschnitt 7 der Übergabe: Skript extrahiert, `node --check`,
DOM-Ersatz gebaut, Funktionen einzeln aufgerufen. Alles unten mit **BESTÄTIGT**
ist reproduziert, nicht vermutet. Die Testdateien liegen in `pruefung/`.

**Noch nichts geändert** — Abschnitt 9 sagt „erst berichten, dann ändern".

---

## 0 · Was in Ordnung ist

Damit der Rest einzuordnen ist: Das Gerüst trägt. Alle zehn Reiter rendern
fehlerfrei, mit leerer und mit gefüllter Datenbank; kein `undefined`, kein
`NaN`, kein `[object Object]` rutscht in die Oberfläche. Die `lage`-Skala tut
genau das, was in der Übergabe steht — ein Nitratwert bei 2 % der Untergrenze
landet bei 0,02 und drückt keine Grafik platt. Die Vorbehalts-Hinweise sind
durchgehend vorhanden und sachlich richtig formuliert.

Die Fehler unten sitzen fast alle **in der Auswertungsschicht**, nicht im
Gerüst. Das ist die gute Nachricht: sie sind lokal behebbar.

---

## 1 · Stille Datenverfälschung — das hier zuerst

Diese vier Punkte erzeugen falsche Zahlen, die plausibel aussehen. Sie sind
schlimmer als eine fehlende Auswertung, weil man ihnen nicht ansieht, dass
sie falsch sind.

### 1.1 Ein Jahressprung im Kulturalter · `bezugFuer` Zeile 336, `ausKW` Zeile 324 — NEU

Die Übergabe (5.3) vermutet, das Nachtragen einer älteren Analyse „verschiebe"
das Aussaatdatum. Es verschiebt es nicht, es **kippt es um ein volles Jahr**.

```
Satz 19-434, nur Blattsaftprobe vom 10.05.2025
  → abgeleitete Aussaat 05.05.2025 → Woche 0,7          richtig

dieselbe Probe, nachdem eine Substratprobe vom 02.05.2025 dazukommt
  → abgeleitete Aussaat 06.05.2024 → Woche 52,7         BESTÄTIGT
```

Grund: `ausKW` sucht den KW-19-Montag, der **vor oder auf** dem Bezugsdatum
liegt. Ist das früheste Datum des Satzes auch nur drei Tage vor Beginn der
eigenen Kalenderwoche, greift der Zweig `bez.getUTCFullYear()-1`.

Zwei Verschärfungen, die in der Übergabe fehlen:

- `bezugFuer` filtert **nicht nach Typ**. Eine Substratprobe, die man vor dem
  Topfen zieht — genau das, was man beim Substratwechsel tun will —, liegt
  naturgemäss vor der Aussaat und löst den Sprung aus.
- Die Oberfläche warnt nicht. Sie schreibt „rund 52.7 Wochen" mit Tilde, und die
  Tilde bedeutet nur „geschätzt", nicht „unplausibel".

Das trifft den Reiter Kulturverlauf, jede Altersangabe, das Gantt im Planer
und alle drei Vorschlagsarten. **Höchste Priorität.**

### 1.2 `putz()` frisst Messwerte, die genau 1 oder 2 sind · Zeile 210 — NEU

`putz` entfernt alleinstehende „1" und „2", um die Spaltenmarker ¹ ² aus der
Kopfzeile zu bekommen. Das Muster `/(^|\s)[12](\s|$)/g` unterscheidet aber
nicht zwischen Marker und Messwert:

```
'Cu - Kupfer 1 2,00 - 6,00'  →  'Cu - Kupfer 2,00 - 6,00'
   Kupfer wird als 2,00 gelesen — der Untergrenze des Optimums.   BESTÄTIGT
'Fe - Eisen 2 3,00 - 8,00'   →  'Fe - Eisen 3,00 - 8,00'
   Eisen wird als 3,00 gelesen — ebenfalls die Untergrenze.       BESTÄTIGT
```

Der Wert wird nicht verworfen, sondern **durch die Optimum-Untergrenze
ersetzt**. Ein Kupfermangel wird damit zu „genau im Optimum".

**Ich fasse den Parser nicht an, bevor ich ein echtes PDF gesehen habe.** Ob
der Fall eintritt, hängt allein daran, ob NovaCropControl ganzzahlige Werte
ohne Nachkommastelle druckt („1" statt „1,0"). Bei Cu, Fe, Mo, Zn und B ist
das der plausible Bereich. Bitte schick mir ein Blattsaft-PDF oder die Ausgabe
von `pdftotext -layout`, dann prüfe ich es gegen die echte Datei und baue den
Marker-Abgleich so eng, dass er nur die Kopfzeile trifft.

### 1.3 `optima` ist ein geteiltes Objekt · Zeile 237 — BESTÄTIGT (5.3)

```js
const werte = teile.map(() => ({})), optima = {};   // ein Objekt
teile.forEach((t,k) => r.proben.push({ ..., optima }));  // für alle Proben
```

Test: `proben[0].optima === proben[1].optima` ist `true`. Ändert man das
Optimum an der Jungprobe, ändert es sich auch an der Altprobe. Nach dem
Speichern und Neuladen sind es getrennte Kopien — der Fehler tritt also nur in
der laufenden Sitzung auf und verschwindet nach dem Neuladen wieder. Genau
deshalb ist er schwer zu bemerken. Einzeiliger Fix.

### 1.4 Eine eigene Grenze löscht die andere Laborgrenze · `optVon` Zeile 367, `setOptimum` Zeile 1561 — NEU

`optVon` gibt `db.eigeneOptima[k]` **komplett** zurück, sobald der Eintrag
existiert. `setOptimum` legt den Eintrag aber schon an, wenn nur ein Feld
gefüllt ist.

```
Labor-Optimum Kalium        [4500, 6000]
eigene Obergrenze eingetragen  [null, 5200]
wirksames Optimum            [null, 5200]     ← Untergrenze 4500 ist weg
Kalium 4200:  vorher "zu tief"  →  jetzt "im Optimum"     BESTÄTIGT
```

Der Anwender trägt eine Obergrenze ein, weil er sie besser kennt — und schaltet
damit unbemerkt die Mangelerkennung für diesen Nährstoff ab. Die Tabelle in den
Einstellungen zeigt dann „eigener Wert", ohne zu sagen, dass eine Grenze fehlt.
Richtig wäre, je Grenze zu mischen: eigener Wert schlägt Laborwert, aber nur
dort, wo einer eingetragen ist.

---

## 2 · Agronomisch falsche Aussagen

### 2.1 Die App empfiehlt, Natrium und Chlorid zu düngen · `KERN` Zeile 172, Regel Zeile 448 — NEU

Das ist die Stelle, an der das Tool dem Chef etwas sagt, was fachlich nicht
haltbar ist. `Na` und `Cl` stehen in `KERN`, also läuft die Regel
„durchgehend unter Optimum" auch über sie, und weil `MOBIL.Na === 'mobil'`
ist, lautet der ausgegebene nächste Schritt:

```
→ Natrium durchgehend unter Optimum
   TUN: Zufuhr von Natrium erhöhen.                       BESTÄTIGT
→ Chlorid durchgehend unter Optimum
   TUN: Zufuhr von Chlorid erhöhen.                       BESTÄTIGT
```

Das ist nicht nur nutzlos, es ist die Umkehrung der richtigen Antwort. Die
App hat an anderer Stelle (Zeile 514) die korrekte Lesart — „Natrium und
Chlorid werden kaum aufgenommen und reichern sich im Umlauf an … den Tank
ablassen statt die Düngung zu reduzieren". Die beiden Regeln widersprechen
sich direkt.

Bei Ebbe-Flut mit gemeinsamem Kreislauf ist tiefes Na und Cl im Blattsaft das
**erwünschte** Ergebnis. Es gibt für beide keine Untergrenze, die man anstreben
würde. Sie gehören aus der Mangelregel heraus und aus `KERN` heraus — ihre
sinnvolle Auswertung ist die Anreicherungsrichtung über die Zeit, nicht der
Abstand zu einer Untergrenze.

### 2.2 Zwei verschiedene Definitionen von „im Optimum" nebeneinander · `index` Zeile 380 gegen `bilanz` Zeile 407 — NEU

Beide Kennzahlen heissen in der Oberfläche „im Optimum", rechnen aber
unterschiedlich:

| | zählt | Nenner im Test |
|---|---|---|
| `index()` (KPI, Index-Diagramm, Reiter Wirkung) | **alle** Proben der Erhebung | 30 = 15 Nährstoffe × jung und alt |
| `bilanz()` (Tabelle „chronisch daneben") | nur `leitProbe` | 1 je Nährstoff |

BESTÄTIGT. Praktische Folgen:

- Eine Erhebung mit jung + alt hat den doppelten Nenner einer Erhebung mit
  nur einer Mischprobe. Die Prozentzahlen im Index-Diagramm stehen
  nebeneinander, als wären sie dasselbe Mass.
- Im Reiter Wirkung wird „Anteil im Optimum vorher → nachher" verglichen —
  wenn eine der beiden Erhebungen nur ein Blattalter hat, vergleicht man
  zwei verschieden gebaute Zahlen.

Dazu die schon bekannte Doppelzählung: `KERN` enthält `NO3` **und**
`N_gesamt`, Stickstoff zählt also doppelt, Bor einfach (BESTÄTIGT). Mit `Na`
und `Cl` sind zusätzlich zwei Ballastionen drin. Von 15 Positionen sind damit
drei fachlich nicht zu rechtfertigen.

### 2.3 `leitProbe` nimmt immer das Jungblatt — und übersieht damit genau das Frühwarnzeichen · Zeile 400 — NEU

`leitProbe = jung || misch || alt`. Für **immobile** Nährstoffe (Ca, B, Fe,
Si) ist das richtig: dort zeigt das Jungblatt den Mangel zuerst. Für
**phloemmobile** (N, P, K, Mg, Mo) ist es genau verkehrt — die Pflanze räumt
das Altblatt aus, um die Spitze zu versorgen, also sieht das Jungblatt gut
aus, während die Versorgung schon nicht mehr reicht.

```
Mg jung 320 · Mg alt 250 · Optimum ab 400
bilanz() rechnet mit 320, mittlere Lage 0,80 — die 250 fliessen nirgends ein.
```

Die Tabelle „Welche Nährstoffe sind chronisch daneben?" ist die Auswertung,
die die Übergabe zu Recht als die derzeit belastbarste bezeichnet. Genau sie
unterschätzt mobile Mängel systematisch. Der saubere Weg wäre, je Nährstoff
nach `MOBIL` das aussagekräftige Blatt zu wählen — das Wissen dafür ist im
Code bereits hinterlegt und wird an dieser Stelle nur nicht benutzt.

### 2.4 Molybdän fällt komplett durch das Regelwerk · Zeile 462 — NEU

Die Verlagerungsregel läuft über `['K','Mg','P','NO3','N_gesamt','S']`.
`MOBIL` kennt als mobil aber: `NO3, N_gesamt, N_aus_NO3, K, Mg, P, Cl, Na, Mo`.

Für **Mo** heisst das: Die allgemeine Regel (Zeile 448) überspringt es, sobald
ein Verlagerungsmuster vorliegt (`vj/va > 1.3`) — und die Verlagerungsregel,
die den Fall auffangen soll, deckt Mo nicht ab.

```
Mo jung 0,30 · Mo alt 0,15 (Optimum ab 0,20) · Verhältnis 2,0
Befunde: KEINE                                             BESTÄTIGT
```

Ein lehrbuchmässiges Ausräumen des Altblattes erzeugt keinen einzigen Hinweis.
Bei Cl und Na ist die gleiche Lücke vorhanden, dort ist sie aber egal
(siehe 2.1). Mo ist der reale Fall — und bei organischer Düngung mit
Nitratreduktase-Bezug nicht belanglos.

### 2.5 Mehrere Regeln schweigen bei einer Mischprobe · Zeilen 474, 523 — NEU

Die Mangan-Regel liest `w(j,'Mn')`, die Regel „weiches Gewebe" liest ebenfalls
nur `j`. Kommt eine Probe als Mischprobe (der Parser sieht das ausdrücklich
vor, `blattalter: 'misch'`), sind beide still:

```
Mischprobe, Mn 9,5 bei Optimum bis 4,0
Befunde: KEINE                                             BESTÄTIGT
```

Der Rest des Regelwerks nutzt `ir = j || a || m` als Rückfall. Diese beiden
Regeln nicht. Das ist Unachtsamkeit, kein Konzept.

### 2.6 Dasselbe Phänomen wird bis zu dreimal gemeldet · Zeilen 448, 486 — NEU

Die Übergabe fragt in Abschnitt 9.4 danach. Antwort: ja.

```
Ca 1200/1150, Mg 300/290, K 5000/4800 · Optimum Ca ab 1600, Mg ab 400
→ Calcium durchgehend unter Optimum
→ Magnesium durchgehend unter Optimum
→ Magnesium wird durch Kalium verdrängt (jung)
→ Magnesium wird durch Kalium verdrängt (alt)
→ Calciumaufnahme durch Kalium gebremst (jung)
→ Calciumaufnahme durch Kalium gebremst (alt)              BESTÄTIGT
```

Sechs Befunde für zwei Störungen. Zwei Ursachen:

1. Die Verhältnisregeln (K/Mg, K/Ca, NH4/NO3) laufen in einer Schleife über
   `[jung, alt, misch]` und melden je Blattalter neu. Ein Kationen-Ungleich-
   gewicht ist aber eine Eigenschaft der Nährlösung, keine des Blattalters.
2. Die Verhältnisregeln prüfen `belegt` nicht, obwohl die allgemeine Regel
   den Nährstoff dort einträgt. Deshalb steht „Calcium durchgehend unter
   Optimum" neben „Calciumaufnahme durch Kalium gebremst".

Die zweite Meldung ist dabei die **bessere**: Sie nennt die Ursache. Sie sollte
die erste ersetzen, nicht ergänzen. Im Reiter Überblick werden nur die ersten
zwei Befunde angezeigt — durch die Dubletten kann die aussagekräftigere Regel
also unter „2 weitere Befunde" verschwinden.

### 2.7 Substratwerte tragen Blattsaft-Etiketten · `NAME` Zeile 161, `einheit` Zeile 169 — NEU

Der Substratbericht speichert `pH`, `Mn`, `Cu`, `Zn`, `Fe`, `B` unter denselben
Schlüsseln wie der Blattsaft. Folgen in der Detailansicht einer Substratprobe:

- `NAME.pH` ist `'pH (Saft)'` → der Substrat-pH wird als Saft-pH beschriftet.
- `einheit('Mn')` ist `'ppm'` → Substrat-Mangan wird in ppm beschriftet,
  obwohl Labor Ins in mg/l liefert.
- Schlimmer: `optVon` greift auch bei Substratproben. Trägt der Anwender einen
  eigenen **Blattsaft**-Zielbereich für Mangan ein, wird dieser auf den
  **Substrat**-Manganwert angewendet und die Probe entsprechend eingefärbt.
  BESTÄTIGT: `optVon(Substratprobe,'Mn')` liefert `[1,4]`.

### 2.8 Aluminium: `status` und `lage` widersprechen sich · Zeile 371 — BESTÄTIGT, präzisiert (5.3)

`<0,50 - <0,50` wird als `[0.5, 0.5]` gelesen. Die Übergabe vermutet, `lage()`
fange das ab. Es fängt es ab, aber **anders als `status()`**:

```
status(0.5, [0.5,0.5]) = 'ok'    → zählt als "im Optimum"
lage(0.5,   [0.5,0.5]) = 2.5     → Band "über Optimum"
```

Derselbe Wert ist in der Tabelle grün und im Diagramm im orangen Band. Al
steht nicht in `KERN`, der Index bleibt also verschont — aber im Reiter
Nährstoff ist Al wählbar, und dort wird der Widerspruch sichtbar. Der saubere
Ort für die Korrektur ist der Parser: eine Spanne, deren beide Grenzen aus
einem `<`-Wert stammen, ist eine Nachweisgrenze, kein Optimum.

### 2.9 Reiter Wirkung · Zeilen 1108, 1139 — BESTÄTIGT, erweitert (5.3)

Zwei getrennte Punkte:

- **Nur ein Blattalter wird verglichen.** `['jung','misch','alt'].find(...)`
  nimmt das erste vorhandene, praktisch immer `jung`. Test: Mg alt steigt von
  250 auf 600, Mg jung bleibt bei 320 — die Auswertung meldet „Blattalter
  jung" und die Erholung im Altblatt bleibt unsichtbar. BESTÄTIGT. Gerade bei
  mobilen Nährstoffen ist das Altblatt aber die Stelle, an der eine
  Düngungsänderung zuerst ankommt.
- **Rundgänge fremder Sätze werden mitgemittelt.** Ereignis gilt nur für Satz
  19-434; Rundgänge davor: 19-434 Stufe 1 und 99-999 Stufe 3 → ausgewiesener
  Mittelwert 2,0. BESTÄTIGT. Das Feld `rundgaenge[].satz` existiert und wird
  ignoriert.

---

## 3 · Anzeige und Bedienung

### 3.1 Sätze ohne ableitbares Aussaatdatum verschwinden vollständig — NEU

`saetzeListe()` endet mit `.filter(s => s.aussaat)` (Zeile 1183). Ein Satz,
dessen Name nicht mit einer Kalenderwoche beginnt und für den kein Aussaatdatum
eingetragen ist, fällt heraus — nicht nur aus dem Planer, sondern auch aus der
Tabelle im Reiter **Sätze**, also aus genau der Maske, in der man das fehlende
Aussaatdatum nachtragen würde.

```
alleSaetze():  ["Tisch-Nord"]
saetzeListe(): []
Reiter Sätze zeigt: "Noch keine Sätze."                    BESTÄTIGT
```

Eine Sackgasse: Der Satz ist erfasst, hat Analysen, ist aber nicht erreichbar.

### 3.2 Ein alter Logbucheintrag staucht das Index-Diagramm · Zeile 598 — NEU

`chartIndex` spannt die X-Achse über die Vereinigung von Erhebungen **und
allen** Logbuchdaten. Ein einziger Eintrag mit weit zurückliegendem Datum
drückt sämtliche Messbalken an den rechten Rand:

```
Balken-x bei einem Eintrag von 2019: 805, 815 (von 900 Breite)   BESTÄTIGT
```

Beim Nachtragen historischer Entscheidungen — was für die Leitfrage
naheliegend ist — wird das Hauptdiagramm unbrauchbar.

### 3.3 Ein Apostroph im Logbuchtitel zerlegt den Planer-Knopf · Zeile 1256 — NEU

```html
onclick="planUebernehmen('19-434','2026-08-28','Wirkung von «Peter&#39;s Mischung» …')"
```
BESTÄTIGT. `esc()` wandelt `'` in `&#39;`; der Browser dekodiert Attributwerte
**vor** dem JS-Parsen wieder zu `'`, der String bricht auf, der Knopf wirft
einen Syntaxfehler. `.replace(/'/g,'')` dahinter läuft ins Leere, weil zu dem
Zeitpunkt kein `'` mehr im String steht. Betrifft jeden frei eingegebenen
Titel — „Dosis auf 0,15 % (Bio's)" reicht.

### 3.4 „+X Punkte gegenüber davor" vergleicht verschiedene Sätze — NEU

Die KPI-Kachel im Überblick nimmt `erh[length-1]` und `erh[length-2]` ohne
Prüfung auf Satz oder Alter. Im Test: Erhebung 1 = Satz 19-434 vom 12.05.,
Erhebung 2 = Satz 23-501 vom 20.06. — die Kachel stellt das als Verlauf dar.
BESTÄTIGT. Das Index-Diagramm darunter benennt den Vorbehalt ausdrücklich; die
Kachel darüber nicht. Genau die Kachel liest der Chef zuerst.

Zusätzlich: Ist `iL` `null` und `iV` nicht, erscheint „NaN Punkte".

### 3.5 Phantomdaten — alle Punkte aus 5.1 BESTÄTIGT

| Feld | geschrieben | gelesen |
|---|---|---|
| `werte[].limit` | Z. 248, 254 | **nirgends** |
| `analysen[].parzelle` | Z. 289 | **nirgends** |
| `analysen[].kultur` | Z. 257 | **nirgends** |
| `vorschlaege()[].dringend` | Z. 1199, 1213, 1234 | **nirgends** |
| `rundgaenge[].kultur` | Z. 1505 | nur Liste, keine Auswertung |
| `saetze[].substrat` / `.duenger` | Z. 891 f., 1338 | nur Tabellenzelle Z. 1522 |
| `saetze[].notiz` | Z. 1338 | nur im eigenen Dialog — **NEU** |

Zu `limit` teile ich die agronomische Einschätzung der Übergabe: `<0,05` als
0,05 zu behandeln ist eine Erfindung. Bei Molybdän ist `<0,05` gegenüber einem
Optimum ab 0,20 ein *Befund* — er wird derzeit als Zahl geführt, die im
Diagramm einen Punkt setzt, als wäre sie gemessen.

### 3.6 Substratdaten liegen noch brächer als beschrieben — Ergänzung zu 5.2

Die Übergabe sagt, Substratanalysen würden „nur an einer einzigen Stelle"
verwendet. Präziser: verwendet wird **ausschliesslich `werte.pH`**, in der
Mangan-Regel (Z. 525). `res_P2O5`, `res_K2O`, `res_Mg`, `res_Ca`, `sof_P2O5`,
`sof_K2O`, `sof_Mg`, `sof_Ca`, `Salz` und `Nmin` kommen im gesamten Skript nur
in den Namens- und Einheitentabellen und im Parser vor — in **keiner einzigen**
Auswertung. Auch `typ === 'giesswasser'` und `typ === 'duenger'` sind als
Auswahl vorhanden und werden nirgends ausgewertet.

### 3.7 Kleinigkeiten

- `chartLinien(xTyp)` wird nur für die Randbreite bei identischen X-Werten
  benutzt (Z. 545). BESTÄTIGT — der Parameter verspricht mehr, als er hält.
- `umschalten(db.plan.begleitet, …); aend()` (Z. 1301): `umschalten` rendert,
  `aend()` läuft erst danach. „Ungesicherte Änderungen" erscheint deshalb erst
  beim nächsten Rendern.
- `befunde()` wird nur für die neueste Erhebung je Satz **und Kulturbild**
  aufgerufen (Z. 783, Schlüssel `satz|zustand`) — grün und gelb überleben
  beide. BESTÄTIGT im Übrigen: Historische Befunde sind nie sichtbar, obwohl
  gerade „welcher Befund kam wiederholt vor" bei sechs Analysen die
  belastbarere Frage wäre.
- `erhebungen()` trennt nach `satz|datum|zustand`; eine Grün- und eine
  Gelb-Probe desselben Tages ergeben zwei Erhebungen mit identischem Datum,
  deren Balken sich im Index-Diagramm überlagern. BESTÄTIGT.

---

## 4 · Fachliche Einschätzung des Regelwerks

Die Übergabe bittet ausdrücklich um eine Beurteilung, nicht um eine Liste.

**Was stimmt.** Die Mobilitätstabelle `MOBIL` ist korrekt: N, P, K, Mg, Cl, Na
und Mo sind phloemmobil, Ca, B, Fe und Si praktisch nicht, S, Zn, Cu und Mn
liegen dazwischen. Die daraus abgeleitete Kernaussage — Mangel im Jungblatt
bei intaktem Altblatt ist ein **Transport**-, kein Angebotsproblem, und die
Antwort heisst Klima und Bewässerung, nicht Dünger — ist richtig und in der
Regel bei Zeile 474 sauber umgesetzt, inklusive der Bedingung
`va < vj*0.9 → überspringen`. Das ist die beste Regel im Bestand.

Ebenfalls richtig: Saft-pH und Saft-EC werden nicht als Einzelbefunde
gemeldet, sondern nur als Bestätigung innerhalb der Nitratregel. Und die
Ammonium-Regel ist bei einem Demeter-Betrieb zu Recht dabei.

**Was fehlt.**

- Eine **Ammonium-Obergrenze unabhängig vom Nitrat**. Die Regel feuert nur bei
  `NH4/NO3 > 0,5` **und** gleichzeitig tiefem Nitrat. Ein Ammoniumschub bei
  ausreichendem Nitrat — der typische Fall nach einer organischen Kopfdüngung
  im warmen Gewächshaus — bleibt unbemerkt, obwohl genau dann die Konkurrenz
  zu K, Ca und Mg am stärksten ist.
- Die **Gegenrichtung** fehlt durchgehend. Es gibt Regeln für „zu tief" und
  eine für Na/Cl „zu hoch", aber keine für einen Überschuss bei K, Mg oder P.
  Bei einer Kreislaufanlage ist Anreicherung der wahrscheinlichere Fehler.
- **Zucker gegen Nitrat** ist derzeit nur ein Beleg innerhalb der Nitratregel.
  Er hätte als eigenständiger Wachstumsindikator mehr Gewicht verdient — das
  ist die Auswertung, die den Zustand „Pflanze assimiliert, kann aber nicht
  wachsen" direkt benennt, und in euren Daten ist genau das der Fall.

**Wo ich der Übergabe widerspreche.** Abschnitt 6.2 hält die Zucker-Deutung
für prüfenswert — zu Recht. Ich würde weitergehen: Ein Optimum von 0,2–0,4 %
Zucker bei gemessenen 1,1 % ist bei organischer Ernährung kein Fehlerbefund,
sondern der Normalzustand. NovaCropControl kalibriert gegen mineralisch
ernährte Bestände mit ständig verfügbarem Nitrat; dort ist Zucker niedrig,
weil er laufend in Wachstum umgesetzt wird. Ein Demeter-Bestand mit
Mineralisierungsnachschub liegt strukturell darüber. Der **Absolutwert** ist
darum wenig wert — die **Richtung über die Zeit** und das **Verhältnis zu
Nitrat** sind es. Ich würde Zucker nicht in eine Kennzahl „im Optimum"
aufnehmen (er steht korrekterweise nicht in `KERN`) und den Vorbehalt in der
Oberfläche benennen.

**Zu den gesetzten Schwellen** (`verlagerung: 1.3`, `kMg: 8`, `kCa: 3`): Die
Kennzeichnung als Annahme ist richtig und bleibt. Für Basilikum im Pflanzensaft
gibt es tatsächlich kaum Publiziertes; alles, was ich beitragen könnte, wäre
aus Trockensubstanz-Referenzen übertragen und damit keine bessere Grundlage
als die jetzigen Zahlen. Ich schlage vor, sie unverändert zu lassen und
stattdessen anzuzeigen, **wie oft** eine Schwelle in den eigenen Daten
überschritten wurde — dann kalibriert der Betrieb sie mit der Zeit selbst.

---

## 5 · Vorschlag für die Reihenfolge

Nach Schaden pro Aufwand, nicht nach Reihenfolge in diesem Bericht:

1. **1.1 Jahressprung im Kulturalter** — verfälscht die meisten Anzeigen,
   Fix ist klein: `bezugFuer` auf Blattsaft einschränken, `ausKW` mit
   Plausibilitätsprüfung (abgeleitete Aussaat darf nicht mehr als eine
   Kulturdauer vor der Probe liegen) und sichtbarer Warnung.
2. **1.3 geteiltes `optima`** — eine Zeile.
3. **1.4 Optimum-Grenzen einzeln mischen** — wenige Zeilen, verhindert eine
   stille Fehlberuhigung.
4. **2.1 Na und Cl aus der Mangelregel und aus `KERN`** — beseitigt eine
   fachlich falsche Empfehlung.
5. **2.2 `KERN` und die Index-Definition sauber festlegen** — Dublette `NO3`/
   `N_gesamt` auflösen, `index()` und `bilanz()` auf dieselbe Grundlage
   stellen. Hier will ich vorher deine Entscheidung (siehe unten).
6. **2.6 Dubletten im Regelwerk** — Verhältnisregeln einmal je Erhebung statt
   je Blattalter, und `belegt` konsequent prüfen.
7. **2.3 `leitProbe` nach Mobilität** — die grösste inhaltliche Verbesserung
   der belastbarsten Auswertung.
8. **3.1 verschwundene Sätze**, **3.3 Apostroph**, **3.2 Zeitachse** — kleine,
   klar begrenzte Korrekturen.
9. Erst danach: Phantomdaten auflösen (3.5) und die Substratanbindung
   Angebot-gegen-Aufnahme (3.6) — das ist Neubau und braucht eigenen Raum.

---

## 6 · Was ich von dir brauche

Vier Punkte, bei denen ich nicht selbst entscheiden will:

1. **Welche Nährstoffe gehören in die Kennzahl „im Optimum"?** Mein Vorschlag:
   `NO3, K, Ca, Mg, P, S, Fe, Mn, Zn, B, Cu` — also `N_gesamt` als Dublette
   raus (Nitrat ist der aussagekräftigere Sofortvorrat), `Na` und `Cl` als
   Ballastionen raus, `Si` raus, weil Basilikum kein Si-Akkumulator ist und
   der Wert nichts steuert. Das wären 11 gleichgewichtete Positionen. Trägt
   das fachlich für euch?
2. **Ein echtes Blattsaft-PDF** (oder `pdftotext -layout` davon), damit ich
   1.2 gegen die Datei statt gegen eine Annahme prüfen kann.
3. **`index()`: jung und alt oder nur ein Blatt?** Ich tendiere zu: je
   Nährstoff das nach `MOBIL` aussagekräftige Blatt, damit index und bilanz
   dieselbe Sprache sprechen. Das ändert die angezeigten Prozentzahlen
   gegenüber bisherigen Ständen — deshalb frage ich.
4. **Änderungen am Datenmodell** brauche ich laut Leitplanke ohnehin
   freigegeben. Aus diesem Bericht folgt keine zwingende Schemaänderung; 1.4
   und 2.7 lassen sich rein rechnend lösen. Sollte 3.5 (`limit` anzeigen und
   von Berechnungen ausnehmen) dazukommen, bliebe `db.schema` bei 3, weil das
   Feld bereits geschrieben wird.
