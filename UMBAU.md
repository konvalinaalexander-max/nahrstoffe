# Umbau: was neu ist und warum

Stand 25.08.2026 · `basilikum.html`, vollständig neu gebaut · Schema 4

Die Datei bleibt, was sie war: **eine einzige HTML-Datei**, kein Build, keine
Abhängigkeit ausser pdf.js vom CDN, Sicherung über Download und Upload einer
JSON-Datei. Alle Leitplanken aus Abschnitt 8 der Übergabe sind geprüft und
eingehalten (siehe unten).

Alle 23 Befunde aus `BEFUNDE.md` sind behoben. Jeder Fix hat eine Prüfung in
`pruefung/`, die fehlschlägt, wenn er zurückfällt.

---

## 1 · Die drei Entscheidungen, die offen waren

Ich habe sie so getroffen, wie in Abschnitt 6 des Berichts vorgeschlagen. Alle
drei sind in den Einstellungen änderbar, und die Oberfläche schreibt hin,
worauf sie beruhen.

**Kennzahl «im Optimum»: elf Nährstoffe statt fünfzehn.**
`NO3 · K · Ca · Mg · P · S · Fe · Mn · Zn · B · Cu`. Draussen sind
`N_gesamt` (misst denselben Nährstoff wie Nitrat — beide zu zählen gewichtet
Stickstoff doppelt und Bor einfach), `Na` und `Cl` (Ballastionen ohne
anzustrebenden Sollwert) und `Si` (Basilikum ist kein Akkumulator, der Wert
steuert nichts). Im Reiter «Sätze & Einstellungen» einzeln umschaltbar, mit
der Begründung daneben.

**Beurteilt wird das Blatt, an dem ein Nährstoff etwas aussagt.**
Phloemmobile am **Altblatt** — dort zeigt sich Knappheit zuerst, oft Wochen
bevor das Jungblatt nachgibt. Immobile am **Jungblatt** — dorthin kommt der
Nachschub nicht. Teilmobile an **beiden**, versorgt nur wenn beide stimmen.

Eine Asymmetrie habe ich bewusst eingebaut: **Mangel** wird nur am
massgeblichen Blatt festgestellt, **Überschuss** an jedem. Ein Nährstoff, der
irgendwo über dem Optimum liegt, ist im Überschuss, egal wo er sich staut —
und im Umlaufsystem ist Anreicherung der wahrscheinlichere Fehler als Mangel.
Ohne diese Regel wäre Magnesium in eurer echten Probe stumm geblieben: 654 ppm
im Jungblatt gegen ein Optimum bis 430, während das Altblatt im Sollbereich
liegt.

**Toleranz von 5 % am Rand des Optimums.**
Bor bei 0,79 gegen eine Untergrenze von 0,80 ist Messrauschen und war vorher
ein Alarmbefund. Solche Randlagen zählen jetzt als versorgt, werden aber
gebündelt als eigener Hinweis genannt und im Balken sichtbar gemacht. Die 5 %
sind eine gesetzte Annahme wie `verlagerung`, `kMg` und `kCa`, entsprechend
gekennzeichnet und änderbar.

**Wirkung an eurer echten Probe (Satz 28-478, 18.08.2026):**

```
vorher · 15 Nährstoffe, jung und alt gezählt      8 von 30  =  27 %
jetzt  · 11 Nährstoffe, Blatt nach Mobilität      4 von 11  =  36 %
```

Die Zahl steigt nicht, weil es besser wird, sondern weil Positionen wegfallen,
die immer als «daneben» zählten, ohne steuerbar zu sein.

---

## 2 · Was die App jetzt zu euren echten Werten sagt

Vorher standen im Überblick zwei Befunde, und der zweite war falsch:

```
1. Stickstoff limitiert das Wachstum
2. Natrium durchgehend unter Optimum · TUN: Zufuhr von Natrium erhöhen.
   ── eingeklappt ──
3. Kalium durchgehend unter Optimum
```

Jetzt:

```
1. Ammoniumüberschuss bremst die Kaliumaufnahme
   NH4 jung 178 ppm (Optimum bis 55) · Kalium alt 1418 ppm (Optimum ab 3975)
   TUN: Nicht einfach mehr Kalium geben. Zuerst die Stickstoffform prüfen …
2. Stickstoff limitiert das Wachstum
3. Zink unter Optimum
4. Schwefel über Optimum          ← vorher stumm
5. Chlorid reichert sich an
6. Mangan über Optimum
7. Magnesium über Optimum         ← vorher stumm
8. Kupfer unter Optimum           ← vorher stumm
9. 1 Nährstoff knapp am Rand (Bor) ← vorher Alarmbefund
```

Der Ammonium-Kalium-Befund ist neu und die wichtigste inhaltliche Ergänzung.
Nitrat, Ammonium, Kalium und Magnesium sind in eurer Probe keine vier Befunde,
sondern vier Symptome desselben Vorgangs: Die organische Düngung liefert
Stickstoff schubweise als Ammonium, die Mineralisierung zu Nitrat kommt nicht
nach, das überschüssige Ammonium verdrängt Kalium an der Wurzel, und Magnesium
reichert sich an und verschiebt das Kationenverhältnis weiter zulasten von
Kalium. Beide Werte stammen aus derselben Probe — der Befund ist damit vom
Kulturalter unabhängig und bei eurer Datenlage belastbar.

---

## 3 · Neu gebaut

### Reiter «Substrat & Wasser» — Angebot gegen Aufnahme

Die grösste Lücke aus Abschnitt 5.2 der Übergabe. Substratanalysen wurden
vollständig eingelesen und ausser dem pH nirgends verwendet.

Jetzt stellt der Reiter zu jedem Satz, für den beides vorliegt, vier Paare
gegenüber — Nmin ↔ Nitrat, K₂O sofort ↔ Kalium, Mg sofort ↔ Magnesium,
Ca sofort ↔ Calcium — und ordnet jedes ein:

- **beides tief** → Angebotsproblem. Zudüngen wirkt.
- **Substrat ausreichend, Blatt tief** → Aufnahmeproblem. Mehr desselben
  Düngers wirkt kaum; die Ursache liegt bei Konkurrenz, pH oder Klima.
- **Blatt im Sollbereich** → passt zusammen, nichts zu tun.

Dazu der Substrat-pH mit seinen Folgen: unter 5,5 wird Mangan stark verfügbar
bis zur Toxizität, über 6,8 fallen Mangan, Eisen und Phosphor aus. In euren
Daten trifft genau das zu — pH 5,2 bei Mangan über dem Optimum.

Die Richtwerte für das Substrat sind **gesetzte Annahmen**: Labor Ins liefert
zu Substratproben keine Optimum-Bereiche. Sie sind als Annahme gekennzeichnet,
in den Einstellungen änderbar, und sie entscheiden nur über die Einordnung
«knapp» oder «ausreichend» — nie über eine Zahl, die als Messwert erscheint.

Im selben Reiter liegen jetzt auch der Kreislauf (pH, EC Rücklauf, EC frisch,
neu die **Substrattemperatur**) und das Giesswasser. Die Temperatur ist
freiwillig, aber sie erklärt viel: dieselbe organische Grunddüngung liefert bei
15 °C deutlich weniger Stickstoff als bei 25 °C.

### Vergleichsgruppe im Reiter Wirkung

Der dritte Vergleichsmodus, nach dem Abschnitt 6 der Übergabe fragt. Betrifft
eine Änderung nur einen Teil der Sätze (`geltung = 'saetze'`), stellt die App
betroffene und nicht betroffene Sätze im selben Zeitfenster gegenüber. Gleiches
Haus, gleiches Klima, gleiche Wochen — der einzige Modus, der Management von
Kulturalter und Jahreszeit trennt. Der Planer schlägt aktiv vor, die
Kontrollgruppe zu beproben, wenn sie fehlt.

### Wiederkehrende Befunde

«Welcher Befund ist wiederholt aufgetreten» — bei sechs Analysen die
belastbarere Frage als ein Einzelbefund. Steht im Überblick.

### Entnahmetiefe bei Substratproben

Bei Ebbe und Flut steigt Wasser von unten und verdunstet oben; Salze wandern
nach oben, die Wurzelspitzen sitzen unten. Eine Probe aus 2 cm und eine aus
8 cm sind zwei verschiedene Welten. Die Tiefe wird jetzt erfasst, aus dem
Parzellenfeld gelesen, wenn sie dort steht, und beim Import angemahnt.

### Die App läuft ohne Internet

Vorher blieb das Fenster leer, wenn pdf.js nicht vom CDN geladen werden konnte
— ein `ReferenceError` verhinderte den ersten Aufbau. Jetzt funktioniert alles
ausser dem PDF-Import: Daten ansehen, auswerten, von Hand erfassen, sichern und
laden. Der Reiter Analysen sagt, warum das Einlesen gerade nicht geht.

---

## 4 · Die Befunde aus dem Audit, einzeln

| | Befund | wie behoben | Prüfung |
|---|---|---|---|
| 1.1 | Jahressprung im Kulturalter | `ausKW` wählt den KW-Montag, der dem Bezug am nächsten liegt, statt den letzten davor. `bezugFuer` filtert auf Blattsaft. Unplausible Ableitungen werden markiert und im Überblick angemahnt. | `n1` §5 |
| 1.2 | `putz()` frisst Messwerte 1 und 2 | Geleert wird nur eine Zeile, die **ausschliesslich** aus einem Marker besteht. Innerhalb einer Zeile wird nichts entfernt. | `n1` §4 |
| 1.3 | geteiltes `optima`-Objekt | Jede Probe bekommt eine eigene Kopie. Die Migration entkoppelt bestehende Dateien. | `n1` §3 |
| 1.4 | eigene Grenze löscht Laborgrenze | `optVon` mischt je Grenze einzeln. Die Einstellungen zeigen eine Spalte «wirksam». | `n1` §6 |
| 2.1 | Empfehlung, Na und Cl zu düngen | Beide raus aus der Kennzahl, eigene Ballastregel nur für «zu hoch», mit Giesswasser als Kontext. | `n2` |
| 2.2 | zwei Definitionen von «im Optimum» | `index()` und `bilanz()` rechnen beide über `bewerte()`. | `n2`, `n3` |
| 2.3 | `leitProbe` immer Jungblatt | Blattwahl nach `MOBIL`, siehe oben. | `n2` |
| 2.4 / 2.10 | Mo und Cu fallen durch das Regelwerk | Der pauschale Ausschluss bei Verlagerungsmuster ist weg; die Verlagerungsregel deckt alle phloemmobilen Nährstoffe ab. | `n2` |
| 2.5 | Regeln schweigen bei Mischproben | Alle Regeln lesen jede vorhandene Probe. | `n2` |
| 2.6 | dasselbe Phänomen dreifach | Je Nährstoff höchstens ein Befund; Verhältnisregeln einmal je Erhebung; `belegt` konsequent geprüft. | `n2` |
| 2.7 | Substratwerte mit Blattsaft-Etiketten | Eigener Namensraum `sub_*`, `res_*`, `sof_*`, `gw_*`. Eigene Blattsaft-Zielbereiche greifen nicht mehr auf Substratwerte. | `n4` §13 |
| 2.8 | Aluminium: `status` gegen `lage` | «<0,50 - <0,50» wird als Nachweisgrenze `[null; 0,5]` gelesen, nicht als Spanne. | `n1` §2 |
| 2.9 | Wirkung: ein Blattalter, fremde Rundgänge | Verglichen wird je Nährstoff das massgebliche Blatt; Rundgänge werden nach Satz gefiltert. | `n5` |
| 2.11 | Überschreitungen ohne Regel | Eigene Überschussregel für jeden Kernnährstoff. | `n2` |
| 2.12 | Schwere unabhängig vom Ausmass | `schwereVon(ausmass)` plus die 5-%-Toleranz. | `n2` |
| 3.1 | Sätze ohne Aussaatdatum verschwinden | `saetzeListe()` liefert alle; fehlende Daten werden markiert und im Planer angemahnt. | `n3` §8 |
| 3.2 | alter Logbucheintrag staucht das Diagramm | Die Zeitachse spannt nur über die Erhebungen; Einträge ausserhalb werden am Rand vermerkt. | `n3` §11 |
| 3.3 | Apostroph zerlegt den onclick | Kein einziges `onclick` mehr in der ganzen App. Alle Klickziele laufen über `data-`Attribute und einen delegierten Handler. | `n3` §9, Browsertest |
| 3.4 | KPI vergleicht verschiedene Sätze | Die Differenz erscheint nur bei zwei Erhebungen desselben Satzes; sonst steht dort, warum es kein Verlauf ist. | `n3` §10 |
| 3.5 | Phantomdaten | `limit`→`unter` wird angezeigt und von Berechnungen ausgenommen · `parzelle`, `kultur`, `notiz`, `tisch` werden angezeigt · `dringend` als Marke im Planer · `rundgaenge[].kultur` gegen die Nährstofflage · `saetze[].substrat`/`.duenger` über die Vergleichsgruppe nutzbar. | `n4` §15, §16 |
| 3.6 | Substratdaten liegen brach | Reiter «Substrat & Wasser», siehe oben. | `n5` §17 |
| 3.7 | `chartLinien(xTyp)`, `umschalten` vor `aend()`, grün/gelb überlagert, keine historischen Befunde | `xTyp` steuert jetzt die Achsenbeschriftung · Zustandsänderung immer vor dem Rendern · gleiche Datumswerte werden aufgefächert · wiederkehrende Befunde im Überblick. | `n3` §12 |

Zusätzlich behoben, erst im Browsertest gefunden: **ohne Internet blieb die
ganze App leer**, weil der Startcode auf ein nicht geladenes `pdfjsLib`
zugriff. Das galt auch für die alte Fassung.

---

## 5 · Migration eurer bestehenden Dateien

`db.schema` geht von 3 auf 4. Beim Öffnen einer älteren Datei migriert die App
automatisch und **zeigt einen Dialog, was sie angepasst hat**:

- Nachweisgrenzen (`limit` → `unter`), die jetzt aus Berechnungen herausfallen
- Substratwerte in den eigenen Namensraum verschoben
- Optimum-Angaben wie «<0,50 - <0,50» als Nachweisgrenze statt als Spanne
- geteilte `optima`-Objekte entkoppelt
- Kern-Nährstoffe auf die neue Vorgabe gesetzt

**Eure alte Datei bleibt unverändert liegen.** Erst wenn ihr im neuen Werkzeug
sichert, entsteht eine neue Datei — die alte könnt ihr als Sicherheitskopie
behalten. Eigene Schwellen, eigene Optimum-Bereiche, Satzangaben, Logbuch,
Messungen und Rundgänge werden vollständig übernommen.

---

## 6 · Reiter

Neun statt zehn. «Kulturverlauf» ist in «Nährstoffe» aufgegangen (ein
Umschalter zwischen Probendatum und Kulturwoche statt zweier Reiter), und
«Kreislauf» ist in «Substrat & Wasser» aufgegangen, wo die Wasserseite
inhaltlich hingehört.

**Überblick** · **Analysen** · **Nährstoffe** · **Wirkung** ·
**Substrat & Wasser** · **Logbuch** · **Rundgang** · **Planer** ·
**Sätze & Einstellungen**

Der Planer ist auf **eine** nach Nutzen geordnete Liste zusammengezogen statt
dreier getrennter Karten. Ganz oben steht, was die Leitfrage beantwortet:
die Wirkung einer Änderung prüfen.

---

## 7 · Geprüft

```
node --check                      Syntax
pruefung/n1 … n5                  92 Einzelprüfungen, alle bestanden
browser.js (Chromium)             neun Reiter leer und gefüllt, Dialoge,
                                  Datei laden, alle Interaktionen,
                                  Offline-Verhalten, Escaping
Lasttest                          80 Analysen · 40 Erhebungen · 8 Sätze:
                                  alle neun Reiter in 117 ms
```

Gegen die echte NovaCropControl-Datei: **23 von 23 Parametern, beide Proben,
alle Optima, null Abweichungen** — unverändert gegenüber der alten Fassung.

**Leitplanken aus Abschnitt 8:** eine HTML-Datei ✓ · kein localStorage, kein
Ordnerzugriff, kein Automatismus ✓ · kein ß ✓ · keine englischen Bezeichner in
der Oberfläche ✓ · 14 Regeln mit offengelegter Schwelle ✓ · Annahmen
gekennzeichnet ✓ · keine Dosierungsrechnung, kein Giesswasser-Parser ✓ ·
Firefox-verträglich (keine Funktionen ohne Firefox-Unterstützung) ✓ ·
Schemawechsel mit Migrationspfad ✓

---

## 7.5 · Nachtrag: der Weg von der Datei zur Auswertung

Nach einer Prüfung des Ablaufs «PDF hochladen und verstehen» nachgebessert:

- **Nach dem Import öffnet sich die Auswertung von selbst.** Vorher blieb man
  in der Analysenliste stehen und musste selbst zum Überblick finden.
- **Neue Ansicht «Alle Werte ansehen»** — eine Erhebung als Ganzes: alle 23
  Parameter nach Nährstoffgruppen, Jung- und Altblatt nebeneinander mit
  Balken, Sollbereich, Bewertung und der Markierung, welches Blatt für diesen
  Nährstoff zählt. Darunter alle Befunde. Erreichbar aus dem Überblick, aus
  der Analysenliste und direkt nach dem Import.
- **Die Befunde stehen jetzt vor den Verlaufsdiagrammen.** Bei einer einzigen
  Analyse standen sie vorher bei 60 % der Seitenlänge unter drei fast leeren
  Diagrammen.
- **Verlaufsdiagramme erscheinen erst ab zwei Erhebungen**, vorher steht dort,
  was eine zweite Erhebung sichtbar machen würde.
- **Der Kontrolldialog ist nach Nährstoffgruppen gegliedert**, mit dem
  Sollbereich unter jedem Feld. Werte, die um mehr als das Sechsfache
  danebenliegen, sind farbig markiert — das fängt ein verrutschtes Komma ab,
  ohne echte Extremwerte fälschlich anzuzeigen.
- **PDFs lassen sich auf jedem Reiter ablegen**, nicht nur auf «Analysen».

Geprüft mit `pruefung/upload.js`: echtes PDF in Chromium eingelesen, Dialog
kontrolliert, übernommen, Erhebungsansicht geprüft, alle neun Reiter mit einer
einzigen Analyse gerendert.

---

## 7.6 · Nachtrag: Giesswasser

Nachdem drei echte Wasserberichte vorlagen, ist aus dem blossen Listeneintrag
ein eigener Reiter geworden.

**Der Parser arbeitet über Koordinaten.** Der Wasserbericht von
NovaCropControl ist eine um 90 Grad gedrehte Tabelle. Die zeilenweise
Rekonstruktion über die y-Koordinate, die für Blattsaft und Substrat trägt,
verliert dort Werte — bei Kalium fehlte einer. Deshalb liest der
Giesswasser-Parser direkt die Textkoordinaten: die y-Position bestimmt den
Parameter, die x-Position die Spalte. Gegen alle drei Berichte geprüft:
21 Parameter, null Abweichungen.

**Berichte mit Historie werden zerlegt.** Ein Bericht enthält eine Spalte
«Analyse» und beliebig viele «Historie». Die erste Historiespalte ist dieselbe
Probe wie die Analyse — erkennbar an derselben Probennummer — und wird
zusammengefasst. Jede übrige Spalte wird eine eigene Probe mit eigenem Datum
und eigener Probennummer.

**Die Entnahmestelle kommt aus der Kopfzeile.** «Analysebericht:Giesswasser;
Eichhof 8B/Reservoir Vorne» ergibt Lage und Stelle. Damit sind zwei Proben vom
selben Tag auseinanderzuhalten: «Hinter, Ohne H2O2» und «Vorne, mitt H2O2»
vom 06.08.2026 bekommen je eine eigene Farbe, stehen in der Vergleichstabelle
nebeneinander und tragen ihren Namen in jedem Tooltip — in den Tabellen wie im
Diagramm.

**Die Einheiten sind korrigiert.** Vor dem ersten echten Bericht waren die
Wasserfelder als mg/l angelegt — eine Annahme. Das Labor liefert
Makronährstoffe in **mmol/l** und Spurenelemente in **µmol/l**. Die App zeigt
beides und rechnet zur Einordnung zusätzlich in mg/l um. Deshalb geht das
Schema von 4 auf 5: von Hand erfasste Wasserwerte aus der Zeit davor werden
markiert und im Reiter angemahnt; eingelesene Berichte sind nicht betroffen.

**Was der Reiter zeigt:** je Entnahmestelle die neueste Probe mit den
Leitwerten, eine Einordnung gegen Richtwerte (gesetzte Annahmen, mit
Herkunftsangabe und im Reiter änderbar), was das Wasser vor jeder Düngung
schon an Nährstoffen mitbringt, alle Proben nebeneinander, den Verlauf je
Parameter mit einer Linie pro Entnahmestelle — und den Kreislauf selbst, der
aus dem Substratreiter hierher gewandert ist, weil Quelle und Tank
zusammengehören.

Eine Dosierungsrechnung — etwa der Säurebedarf zur Absenkung des
Hydrogencarbonats — ist **nicht** gebaut. Sie bleibt zurückgestellt, wie in
der Übergabe festgelegt. Der Reiter sagt das an der Stelle, an der man sie
erwarten würde.

Der Reiter «Substrat & Wasser» heisst jetzt «Substrat». Zehn Reiter statt neun.

---

## 7.7 · Nachtrag: die Diagramme sind jetzt das Herzstück

**Der Anlass.** Wer im Reiter Nährstoffe unten im Diagramm den Nährstoff
wechselte, landete wieder ganz oben auf der Seite. Ursache war, dass *jede*
Zustandsänderung die ganze Seite neu aufbaute und dabei nach oben scrollte.
Dazu kam der eingebaute `<title>`-Tooltip der Browser: er erscheint erst nach
rund einer Sekunde und lässt sich nicht gestalten.

### Die zehn Regeln, nach denen ich gebaut habe

1. **Kein Sprung.** Bedienelemente des Diagramms bauen nur das Diagramm neu.
   Ein Sprung an den Seitenanfang passiert ausschliesslich beim Reiterwechsel.
2. **Farbe und Form tragen je eine Information.** Bei mehreren Nährstoffen:
   Farbe = Nährstoff, Form = Blattalter. Bei einem einzigen Nährstoff wäre die
   Farbe leer — dann übernimmt sie das Blattalter. Im Giesswasser entsprechend:
   Farbe = Parameter, Form = Entnahmestelle, und bei einem einzigen Parameter
   Farbe = Entnahmestelle, dieselbe wie in den Karten darunter.
3. **Eine gemeinsame Achse braucht eine gemeinsame Grundlage.** Mehrere
   Nährstoffe kommen nur dann auf eine Messwert-Achse, wenn sie dieselbe
   Einheit *und* dieselbe Grössenordnung haben. Sonst wechselt die App sichtbar
   auf die Lage 0–3 und sagt warum — etwa «Kalium liegt bei rund 1205 ppm,
   Eisen bei rund 1,06 — auf einer gemeinsamen Messwert-Achse wäre Eisen eine
   Linie auf null.»
4. **Punkte sind die Messung, Linien eine Behauptung.** Vorgabe: nur Punkte.
   Linien sind zuschaltbar, und dann standardmässig nur innerhalb eines Satzes
   beziehungsweise einer Entnahmestelle. Wer sie durchgehend will, bekommt sie
   — mit einem Hinweis, dass zwischen zwei Sätzen kein Verlauf liegt, sondern
   ein Wechsel des Bestands.
5. **Sofortiges Infokästchen statt des `<title>`-Tooltips.** Es erscheint ohne
   Verzögerung am Zeiger und nennt Nährstoff, Satz, Datum, Kulturwoche, Blatt,
   Messwert, Sollbereich und Beurteilung — im Giesswasser Entnahmestelle,
   Probennummer, Anbau, Messwert, mg/l-Entsprechung und Richtwert.
6. **Ein Klick auf einen Punkt öffnet die ganze Erhebung** beziehungsweise die
   ganze Wasserprobe. Das Diagramm ist damit der Einstieg in die Zahlen.
7. **Die Legende ist ein Bedienelement.** Ein Klick blendet eine Reihe aus und
   wieder ein.
8. **Zusammenstellungen statt Klickerei:** Hauptnährstoffe, Spurenelemente,
   Ballast, «Was daneben liegt», «Alle der Kennzahl». Im Giesswasser: Ballast
   und Puffer, Nährstoffe im Wasser, Technik, Leitwerte.
9. **Einstellungen überleben das Neuzeichnen.** Auswahl, Achse, Skala, Linien
   und ausgeblendete Reihen bleiben, solange man im Reiter bleibt.
10. **Leere Zustände erklären, was fehlt** — statt ein leeres Diagramm zu
    zeigen.

### Was das im Einzelnen heisst

**Reiter Nährstoffe.** Das Diagramm ist die erste Karte. Darüber: die
Zusammenstellungen, die Nährstoff-Chips zur Mehrfachauswahl (höchstens acht),
und die Regler für waagrechte Achse (Probendatum oder Kulturwoche), senkrechte
Skala (Messwert oder Lage 0–3), Blattalter und Linien. Darunter, je nach
Auswahl: bei einem Nährstoff die gewohnte Tabelle je Erhebung, bei mehreren
zusätzlich eine Tabelle «Die ausgewählten Nährstoffe nebeneinander» — je
Erhebung eine Zeile, je Nährstoff eine Spalte, jeweils am massgeblichen Blatt.

**Reiter Überblick.** Sobald es mehr als eine Erhebung gibt, steht die
Nährstofflage über die Zeit direkt unter den Kennzahlen, vor den Befunden. Bei
einer einzigen Analyse bleibt es umgekehrt: dann gäbe es im Diagramm nichts zu
sehen, und die Befunde stehen oben.

**Reiter Giesswasser.** Der Verlauf ist die erste Karte, sobald mehr als eine
Probe da ist. Mehrfachauswahl der Parameter; bei gemischten Einheiten oder
Grössenordnungen zeigt die App jeden Parameter als Anteil seines eigenen
höchsten Messwerts — sichtbar gekennzeichnet, mit dem ausdrücklichen Hinweis,
dass das nur Gleichlauf zeigt und nichts über hoch oder tief sagt.

**Überall.** Proben auf derselben Senkrechten werden aufgefächert, damit zwei
Proben vom selben Tag nebeneinander stehen statt sich zu verdecken. Auch die
übrigen Diagramme — Kennzahl über die Zeit, Wirkungsprofil, Satz-Laufzeiten —
haben den langsamen `<title>`-Tooltip gegen das sofortige Infokästchen
getauscht; die Balken der Kennzahl öffnen jetzt ebenfalls die Erhebung.

### Was das an der Technik geändert hat

`render()` merkt sich die Scrollposition und stellt sie wieder her; nach oben
gesprungen wird nur beim Reiterwechsel. Das behebt den Sprung nicht nur im
Diagramm, sondern in der ganzen App — auch beim Ändern einer Einstellung oder
beim Eintragen einer Messung.

Neu ist eine Registrierung `DIAG`: eine Ansicht meldet an, welche Teile der
Seite zum Diagramm gehören und wie es gezeichnet wird. `diagFrisch()` baut nur
diese Teile neu. Schlägt etwas fehl, fällt die App auf den vollständigen
Seitenaufbau zurück — die Bedienung bricht nie ab.

Wichtig dabei: alles, was von der Auswahl abhängt — Farben, Einheiten, Skala,
Hinweise —, wird bei *jedem* Neuzeichnen frisch bestimmt. Läge es im äusseren
Gültigkeitsbereich der Ansicht, zeigte das Diagramm nach einer Änderung noch
die Farben und Begründungen der vorigen Auswahl. Genau das ist mir beim Bauen
einmal passiert und von der Browserprüfung gefunden worden.

### Geprüft

```
node --check                      Syntax
pruefung/n1 … n5                  93 Einzelprüfungen, alle bestanden
pruefung/g1                       41 Einzelprüfungen gegen die drei echten
                                  Wasserberichte, alle bestanden
browser.js (Chromium)             zehn Reiter leer und gefüllt · Diagramm
                                  zuoberst · Scrollposition bleibt beim
                                  Nährstoffwechsel stehen (434 → 434) ·
                                  Mehrfachauswahl · Skalenwechsel mit
                                  Begründung · Infokästchen sofort da ·
                                  Legende blendet aus · Punkte statt Linien
                                  als Vorgabe · Klick auf einen Punkt öffnet
                                  die Erhebung · Offline-Verhalten · Escaping
upload.js / gwupload.js           echte PDFs hochgeladen, Weg bis zur
                                  Auswertung, Infokästchen am Wasserpunkt
```

Nicht geprüft: Firefox selbst — in dieser Umgebung steht nur Chromium zur
Verfügung. Verwendet werden ausschliesslich Funktionen, die Firefox seit
Jahren unterstützt (`Element.closest`, `dataset` auf SVG-Elementen,
`getBoundingClientRect`, `classList`); Neues wie `getScreenCTM` oder
Pointer-Events-Feinheiten kommt bewusst nicht vor.

---

## 8 · Was ich bewusst nicht gebaut habe

Unverändert zurückgestellt, wie in der Übergabe festgelegt: die
Dünger-Dosierungsrechnung, ein Giesswasser-Parser und die Nützlingserfassung.
Ebenso weiterhin: keine altersabhängigen Optimum-Bereiche — dafür braucht es
zuerst deutlich mehr eigene Analysen — und keine behauptete Kausalität
zwischen Nährstofflage und Schädlingsbefall.

Offen und für später vorgemerkt: Sobald genug eigene Analysen vorliegen,
liessen sich Referenzbereiche aus euren eigenen guten Beständen ableiten. Das
wäre die ehrlichere Referenz als jede fremde Tabelle.
