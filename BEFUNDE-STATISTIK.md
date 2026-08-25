# Prüfbericht: Datenmodell und Statistik

Stand 25.08.2026 · geprüft gegen `basilikum.html` (Schema 4) und die echte
Blattsaftanalyse Satz 28-478 vom 18.08.2026

Vorgehen wie beauftragt: jede Hypothese aus `PROMPT-DATENMODELL.md` einzeln
am Code und an den echten Daten nachgerechnet. Belege in `pruefung/s1`–`s4`.

**Am Code ist nichts geändert** — ausser einer Zahl in `UMBAU.md` und in der
Berichtsseite, die falsch war (siehe ganz unten).

---

## Verdikt in einem Absatz

Alle zehn Punkte der Verdachtsliste sind **bestätigt**, einer davon deutlich
schärfer als vermutet. Dazu kommen **neun weitere**. Der schwerwiegendste ist
Punkt A: eine Verschiebung des Wassergehalts um ±30 %, allein durch die
Tageszeit erklärbar, bewegt die Hauptkennzahl von **0 % auf 36 %** und dreht
die Bewertung von bis zu fünf Nährstoffen — ohne dass sich an der Versorgung
irgendetwas geändert hätte.

Der zweitschwerwiegendste ist nicht statistisch, sondern strukturell: **eine
zweite Probe desselben Satzes am selben Tag überschreibt die erste lautlos.**
Genau solche Doppelproben sind aber die Voraussetzung für jede
Varianzschätzung — und damit für jede quantitative Aussage.

---

## 1 · Die Verdachtsliste, Punkt für Punkt

### A · Kompositionelle Daten — BESTÄTIGT, der grösste Fehler

Alle Konzentrationen gemeinsam skaliert (das simuliert einen anderen
Wassergehalt der Pflanze — Tageszeit, Zeit seit der Flutung, Lichtsumme):

```
Faktor   Kennzahl   Befunde   Nährstoffe mit gedrehter Bewertung
×0,70      0 %        13      5: Calcium, Magnesium, Phosphor, Eisen, Bor
×0,80      9 %        12      4: Calcium, Magnesium, Phosphor, Bor
×0,90     18 %        12      3: Calcium, Magnesium, Bor
×1,00     36 %         9      —
×1,10     27 %         9      1: Phosphor
×1,25     27 %         9      1: Phosphor
×1,40     18 %        10      2: Phosphor, Eisen
```

Die Versorgung ist in allen sieben Zeilen dieselbe. Die Kennzahl schwankt über
36 Prozentpunkte, die Zahl der Befunde zwischen 9 und 13.

Zum Vergleich, dieselbe Skalierung auf die Verhältnisse:

```
Faktor   K/Mg     K/Ca     NH4/NO3   Ionensumme
×0,70    1,590    1,278    4,944       4430
×1,00    1,590    1,278    4,944       6329
×1,40    1,590    1,278    4,944       8861
```

**Verhältnisse sind exakt invariant, Absolutwerte nicht.** Das ist der
mathematische Grund hinter dem Satz aus der Übergabe, Verhältnisse seien
robuster — und die App rechnet ihre Hauptkennzahl trotzdem über Absolutwerte.

**Zur Normierung:** Die Ionensumme geteilt durch den Saft-EC liegt bei Jung-
und Altblatt der echten Probe bei 652 und 633 — der Kandidat existiert also.
Aber mit **einer** Erhebung lässt sich daraus nichts schätzen. Eine Normierung
jetzt einzuführen wäre geraten, nicht belegt. Eine volle CLR/ILR-Transformation
bei n=6 erst recht.

### B · Die Kennzahl — BESTÄTIGT, alle drei Teile

**B1 · Binarisierung.** Zwei konstruierte Lagen, dieselbe Zahl:

```
fünf Nährstoffe bei 93 % der Untergrenze   →   55 %  (6 von 11)
dieselben fünf bei  5 % der Untergrenze    →   55 %  (6 von 11)
```

Die Kennzahl kann „knapp daneben" und „praktisch leer" nicht unterscheiden.

**B2 · Gleichgewichtung gegen das Minimumgesetz.** An den echten Werten:

```
Nitrat     Abstand 0,87   ← limitierend
Zink               0,64
Kalium             0,64
Schwefel           0,42
Kupfer             0,40
Bor · Mangan       0,01
Ca · Mg · P · Fe   0,00

Mittelwert 0,27      Maximum 0,87
```

Der Mittelwert sagt „mässig daneben". Das Minimumgesetz sagt: Nitrat
limitiert, alles andere ist nachgeordnet. **Die App nennt den limitierenden
Nährstoff an keiner Stelle.**

**B3 · Fehlende Unsicherheit.** 4 von 11 = 36 %. Das Wilson-Intervall dazu
reicht von **15 % bis 65 %** — 49 Prozentpunkte breit. Die Zahl steht als
Punktwert im Diagramm und wird über die Zeit verbunden.

*Einschränkung meiner eigenen Rechnung:* Wilson setzt unabhängige Ziehungen
voraus. Nährstoffe sind korreliert, das echte Intervall ist eher breiter. Als
Grössenordnung taugt es, als exakte Angabe nicht — und genau deshalb gehört
in die App eher ein ehrliches „diese Zahl ist auf ±25 Punkte genau" als ein
gerechnetes Intervall.

### C · `lage()` und `ausmass()` — BESTÄTIGT

```
Optimum-Form                     v=0,5·lo   v=lo   Mitte   v=hi   v=2·hi
[lo,hi] = [100,200]                0,50     1,00    1,50   2,00    3,00
[null,hi] = Nachweisgrenze <50     1,25     1,50    1,50   2,00    3,00
[lo,null] = nur Untergrenze 100    0,50     1,50    1,50   1,50    1,50
```

Bei `[lo,null]` liefert `lage()` für **jeden** Wert ab der Untergrenze
dieselbe 1,50 — die Skala ist dort nicht mehr informativ.

Und der Mittelwert dieser Skala hat keine Bedeutung: zwei Erhebungen mit 0,20
und 2,80 ergeben 1,50, was als „Mitte des Optimums" gelesen wird. Tatsächlich
war der Nährstoff nie im Optimum. Genau diese Mittelung steht im Überblick als
Balken „mittlere Lage".

`ausmass()` ist asymmetrisch:

```
Wert  Richtung          ausmass()   |log2(v/Grenze)|
 50   halbiert            0,50           1,00
 25   geviertelt          0,75           2,00
400   verdoppelt          1,00           1,00
800   vervierfacht        3,00           2,00
```

Halbierung 0,50, Verdopplung 1,00 — gleiche biologische Veränderung, doppelte
Zahl. `ausmass()` steuert die Sortierung der Befunde, Überschüsse werden
dadurch systematisch nach oben sortiert.

### D · Messunsicherheit — BESTÄTIGT und verschärft

Der NovaCropControl-Bericht enthält **keine einzige** Angabe zu Präzision,
Wiederholbarkeit oder Unsicherheit (im Volltext gesucht: keine Fundstelle).

Verschärfend: Die 5-%-Toleranz hängt an der **Optimumgrenze**, nicht an der
Messung. Was das bedeutet:

```
Parameter   Untergrenze   5 % davon   relativ zum Messwert
Nitrat        2010          100,5        279 %
Kalium        3975          198,8         19 %
Zink           1,60          0,080        12,5 %
Bor            0,80          0,040         5,1 %
Magnesium       310         15,5           2,4 %
```

Bei Nitrat sind 5 % der Untergrenze das **Dreifache des gemessenen Wertes**.
Dieselbe Zahl bedeutet je nach Parameter etwas völlig Verschiedenes. Die
Toleranz ist am falschen Bezugspunkt verankert.

### E · Zensierte Werte — BESTÄTIGT, in der Praxis aber klein

In der echten Datei betrifft es genau einen Parameter: Molybdän `<0,05`. Er
steht nicht in der Kennzahl, die Auswirkung ist heute null.

Die Richtung der Verzerrung ist bestätigt: Nimmt man Molybdän hypothetisch in
die Kennzahl auf, hebt der Ausschluss sie von 33 % auf 36 %. Es fällt ein
Nährstoff heraus, der mit Sicherheit **nicht** im Optimum liegt.

**Der Fix braucht keine Statistik.** Liegt die Nachweisgrenze selbst unter der
Optimum-Untergrenze, ist der Wert mit Sicherheit zu tief — dann zählt er als
Mangel. Liegt sie darüber, ist er nicht bewertbar. Das ist eine Fallunterscheidung,
keine Schätzung. ROS, Kaplan-Meier und Maximum-Likelihood sind bei n=6 nicht
anwendbar und auch nicht nötig.

### F · Datenstruktur — BESTÄTIGT, F2 schwerer als vermutet

**F2 ist der eigentliche Befund.** Zwei Proben, gleicher Satz, gleicher Tag,
gleiches Blattalter — etwa von zwei Tischen:

```
Erhebungen: 1 · Proben in der Erhebung: 2 · in proben.jung: b
```

Die zweite Probe überschreibt die erste in `e.proben.jung`. Die erste ist für
die gesamte Bewertung unsichtbar. **Es gibt kein Feld für Tisch, Position oder
Replikat.** Damit ist die einzige Datenform, aus der sich eine Varianz schätzen
liesse, im Modell gar nicht darstellbar.

Weiter bestätigt:

- **26 typabhängige Verzweigungen** (`typ==='blattsaft'` 17×, `'substrat'` 7×,
  `'giesswasser'` 2×) quer durch den Code.
- **Optima liegen redundant in jeder Probe**: 16 % der Sicherungsdatei, bei nur
  zwei verschiedenen Optimum-Sätzen auf sechs Analysen.
- **Einheiten werden aus dem Schlüsselnamen geraten.** Ein unbekannter
  Parameter bekommt lautlos „ppm".
- **Keine Plausibilitätsprüfung**: Kalium mit Tippfehler 104000 statt 1040 —
  das 25-Fache der Obergrenze — wird als gewöhnlicher Überschuss verbucht.
- **Keine Provenienz**: ein Messwert hat die Felder `wert` und `unter`. Wer
  wann was korrigiert hat, ist nicht rekonstruierbar.

### G · Wirkung ohne Massstab — BESTÄTIGT

Der Reiter meldet „7 Nährstoffe Richtung Optimum, 2 davon weg" und warnt in
Prosa. Eine Zahl, ab der eine Änderung überhaupt erkennbar wäre, existiert im
Quelltext nicht.

Sie ist auch nicht berechenbar: die kleinste erkennbare Differenz ist
`z · s · √(2/n)`, und `s` — die Streuung einer Einzelbestimmung — lässt sich
ohne Wiederholungen nicht schätzen. Im gesamten Bestand: **eine Probe je Satz,
Datum und Blattalter, null Wiederholungen.**

### H · Confounding — BESTÄTIGT

Designmatrix der beiden Erhebungen des Testbestands:

```
      Achsenabschnitt  Kulturalter  Monat  Ereignis 1  Ereignis 2
      1                1,1          7      0           0
      1                6,1          8      1           1

Rang: 2 von 5 Spalten bei 2 Beobachtungen
```

Kulturalter, Jahreszeit und beide Ereignisse bewegen sich exakt parallel.
Schätzbar sind höchstens zwei Parameter — selbst ein Modell mit
Achsenabschnitt und **einem** Effekt wäre überparametrisiert.

Im Quelltext: keine Designmatrix, keine Aliasstruktur, kein
Identifizierbarkeitsbegriff. Nur ein Prosa-Vorbehalt.

### I · Substrat-Richtwerte — BESTÄTIGT

Als Annahme gekennzeichnet — richtig. Aber **ohne jede Herkunftsangabe**.
Niemand kann prüfen, worauf `sub_Nmin: [50,150]` beruht. Diese Zahlen
entscheiden über die Einordnung „Angebotsproblem" gegen „Aufnahmeproblem" und
damit über die Handlungsempfehlung.

Das Zeitfenster von 28 Tagen ist ebenfalls ad hoc, ohne Begründung im Code
oder im Text.

### J · Kleinigkeiten — 4 von 4 BESTÄTIGT

- `wiederkehrend()` zeigt „2×" **ohne Nenner**. Bei zwei Erhebungen heisst das
  „immer", bei zwanzig „selten". Zusätzlich werden verschiedene Sätze addiert.
- Das Index-Diagramm zieht eine **Polyline** zwischen Erhebungen dreier
  verschiedener Sätze — verifiziert.
- `bilanz()` mittelt über Sätze und Alter. Darüber steht „vom Kulturalter
  unabhängig" — das gilt für den Anteil im Optimum, nicht für den daneben
  gezeigten gemittelten Lagewert.
- Keine Ausreissererkennung. *(Meine automatische Suche meldete hier
  fälschlich einen Treffer — sie fand das Wort „robust" im Fliesstext. Von
  Hand nachgeprüft: es gibt keine.)*

---

## 2 · Neun Befunde, die in der Verdachtsliste nicht standen

### K · Ein Wechsel der Laborreferenz fällt nicht auf

```
derselbe Messwert Kalium 4600:
   01.06.   Optimum [3975, 4800]   → im Optimum   Kennzahl 91 %
   01.08.   Optimum [3000, 4000]   → über Optimum Kennzahl 82 %
```

Neun Punkte Unterschied, allein weil das Labor seinen Referenzbereich revidiert
hat. Der Verlauf im Index-Diagramm mischt beide Bereiche ohne Hinweis. Labore
revidieren ihre Bereiche — das ist kein Ausnahmefall, und die App speichert
den Bereich pro Probe, merkt also gar nicht, dass er sich geändert hat.

### L · Verhältnisschwellen haben keine Toleranz, Optimumgrenzen schon

```
K/Mg = 7,99   →   kein Befund
K/Mg = 8,01   →   «Magnesium wird durch Kalium verdrängt»
```

Für Optimumgrenzen wurde eine 5-%-Toleranz eingeführt, genau um solche
Kippschalter zu vermeiden. Für die Verhältnisschwellen `verlagerung`, `kMg`,
`kCa` und `nh4no3` nicht. Dabei ist ein Quotient aus zwei fehlerbehafteten
Messungen **instabiler** als eine einzelne Messung, nicht stabiler.

### M · Die Bewertung der Vergangenheit ändert sich rückwirkend

```
Schwelle verlagerung 1,3   →   «Kalium: das Altblatt wird ausgeräumt»
Schwelle verlagerung 1,6   →   «Kalium unter Optimum»
```

Dieselbe drei Monate alte Analyse wird anders bewertet, sobald heute jemand an
einer Einstellung dreht. Für ein Werkzeug, dessen Leitfrage lautet „was haben
unsere Entscheidungen bewirkt", ist das ein Problem: der Stand, auf dem eine
Entscheidung beruhte, ist nicht mehr rekonstruierbar. Es gibt keine
Festschreibung und keinen Vermerk, mit welchen Einstellungen ein Befund
entstanden ist.

### N · Der Nenner der Kennzahl schwankt zwischen den Erhebungen

```
01.06.   10 von 11  =  91 %   (0 nicht bewertbar)
01.08.    2 von  3  =  67 %   (8 nicht bewertbar)
```

Beide Balken stehen gleichwertig im selben Diagramm und werden durch eine
Linie verbunden. Der Nenner steht nur im Tooltip. Anteile mit verschiedenen
Nennern als Zeitreihe zu zeichnen ist nicht zulässig — der zweite Wert beruht
auf drei Beobachtungen, der erste auf elf.

### O · Das Kulturalter wird präziser angezeigt als es ist

Die Kalenderwoche im Satznamen bestimmt einen **Montag**. Das tatsächliche
Aussaatdatum liegt irgendwo in dieser Woche.

```
Unsicherheit:  ±3,5 Tage  =  ±0,5 Wochen
Anzeige:       «Woche 6,1»  =  suggeriert ±0,05 Wochen
```

Zehnfach überzeichnete Genauigkeit. Das Alter geht in die Achse „Kulturwoche",
in den Planer und in jeden Vorbehaltstext ein.

### P · Die Jahreszeit ist nicht einmal als Variable vorhanden

Felder einer Probe: `laborId, datum, satz, kultur, blattalter, zustand, werte,
optima`. Keine Tageslänge, keine Strahlung, keine Aussentemperatur. Der Monat
wird **einmal** im ganzen Code benutzt — für die Vorgabe der Kulturdauer.

Für die Leitfrage „nähern wir uns über die Zeit dem Optimum" ist die Jahreszeit
der grösste Störfaktor überhaupt. Ohne sie im Datenmodell ist eine spätere
Korrektur unmöglich, auch mit noch so vielen Analysen.

### Q · Bei immobilen Nährstoffen fällt ein tiefes Altblatt lautlos heraus

An den echten Werten:

```
Calcium (immobil, beurteilt am Jungblatt)
   jung  814   im Optimum   ← massgeblich
   alt   766   zu tief      wird nicht bewertet
Gesamturteil: im Optimum
```

Das ist eine Folge meiner eigenen Entscheidung im Neubau — und sie ist an
dieser Stelle zu grob. Calcium wird eingelagert und nicht wieder abgezogen:
Das Altblatt ist das **Archiv der Vergangenheit**. Ein tiefes Altblatt bei
gutem Jungblatt heisst, dass die Versorgung früher schlechter war. Genau die
Art Information, nach der die Leitfrage fragt — und sie wird verworfen.

### R · Substratwerte sind grösstenteils überhaupt nicht bewertbar

Substratproben haben keine Optima, also keinen Status. Bewertet werden
ausschliesslich die vier Paare im Reiter „Substrat & Wasser". Unbewertet
bleiben: Salz, alle vier Reserven (P₂O₅, K₂O, Mg, Ca) und alle fünf
Spurenelemente im Substrat. Sie werden eingelesen, gespeichert, angezeigt —
und gehen in keine einzige Auswertung ein. Das ist derselbe Befund wie 5.2 im
ersten Audit, nur eine Ebene tiefer.

### S · Auch die zweite Substratprobe wird still verworfen

```
zwei Proben desselben Satzes:
   Nmin  2 cm:  80 mg/l
   Nmin  8 cm:  15 mg/l    ← dort sitzen die Wurzelspitzen
substratZu() wählt: die zeitlich nächste, ohne die Tiefe zu beachten
```

Die Entnahmetiefe wird erfasst — sie war eine Neuerung des Umbaus — aber bei
der Auswahl ignoriert. Der Salzgradient im Topf ist genau der Grund, warum die
Tiefe erfasst wird, und dann entscheidet der Zufall des Probendatums, welche
Welt gezeigt wird. Dasselbe strukturelle Problem wie F2.

---

## 3 · Rangfolge

Nach Schaden × Häufigkeit, nicht nach Reihenfolge im Bericht.

**Sofort und billig — kein Datenbedarf, keine Statistik:**

1. **B2 · Den limitierenden Nährstoff nennen.** Der grösste Gewinn im ganzen
   Bericht für den kleinsten Aufwand. Das Minimumgesetz ist die richtige
   Lesart, und die Zahl liegt bereits vor.
2. **N · Kennzahl nur zeigen, wenn der Nenner vergleichbar ist** — sonst
   Balken ausgrauen und den Nenner an die Achse schreiben.
3. **E · Nachweisgrenze als Mangel zählen**, wenn sie unter der Untergrenze
   liegt. Eine Fallunterscheidung.
4. **O · Alter ohne Nachkommastelle**, wenn es aus der KW abgeleitet ist.
5. **K · Referenzwechsel erkennen und markieren.**
6. **Q · Bei immobilen Nährstoffen das tiefe Altblatt als eigenen Hinweis**
   („Versorgung war früher schlechter"), statt es zu verwerfen.
7. **L · Toleranz auch auf die Verhältnisschwellen.**
8. **J1–J3 · Nenner bei wiederkehrenden Befunden, keine Linie zwischen
   verschiedenen Sätzen, Mittelwert der Lage entfernen.**
9. **I · Herkunftsfeld für jeden Richtwert.**
10. **F5 · Plausibilitätsprüfung beim Erfassen.**

**Mittel — braucht eine Entscheidung, aber keine neuen Daten:**

11. **A · Sensitivitätsanzeige statt Normierung.** Die Skalierungsrechnung aus
    A1 lässt sich in der App zeigen: „Diese Bewertung hält einer Verschiebung
    des Wassergehalts um ±10 % nicht stand." Das ist ehrlich, sofort machbar
    und braucht keine Schätzung. Die Verhältnisbefunde gehören gleichzeitig
    nach oben, weil sie invariant sind.
12. **C · `lage()` und `ausmass()` auf ein logarithmisches, symmetrisches
    Mass umstellen.** Ändert die Sortierung der Befunde.
13. **D · Toleranz am Messwert verankern**, nicht an der Grenze — und je
    Parameter einstellbar machen.
14. **B3 · Unsicherheit der Kennzahl anzeigen.**
15. **M · Vermerken, mit welchen Einstellungen ein Befund entstanden ist.**
16. **S · Substratproben nach Tiefe getrennt führen.**
17. **R · Die unbewerteten Substratwerte anbinden.**

**Gross — die Datenstruktur:**

18. **F · Umbau auf `probe` / `messung` / `referenz`** mit Kovariaten
    (Uhrzeit, Stunden seit Flutung, Tage seit Schnitt, Tisch, Position,
    Replikat, Tiefe), mitgeführten Einheiten, Provenienz und **P** (Jahreszeit
    als Grösse). Schema 5, mit Migration.
19. **G/H · Die Ansicht «Was können wir sagen und was nicht»** — Designmatrix,
    Identifizierbarkeit, kleinste erkennbare Differenz. Sinnvoll erst nach 18.

---

## 4 · Die wichtigste Empfehlung steht nicht im Code

Alles Quantitative in diesem Bericht scheitert an derselben Stelle: **es gibt
keine Schätzung für `s`**, die Streuung einer Einzelbestimmung. Ohne sie ist
keine Aussage darüber möglich, ob eine Veränderung echt ist.

Das lässt sich mit **einem einzigen Versuch** lösen:

> Bei der nächsten Beprobung eines Satzes drei Proben ziehen statt einer:
> eine homogenisierte Probe in drei Teile geteilt (das ergibt die
> **analytische** Streuung), und zusätzlich zwei getrennte Sammelproben aus
> demselben Bestand (das ergibt die **Probenahme**-Streuung, die erfahrungsgemäss
> die grössere ist).

Kosten: zwei zusätzliche Analysen, einmalig. Ertrag: Ab diesem Moment lässt
sich jede spätere Aussage quantifizieren — „diese Änderung ist grösser als das
Rauschen" statt „das ist ein Indiz, kein Beweis". Ohne diesen Versuch bleibt
der Reiter Wirkung dauerhaft qualitativ, egal wie viele Analysen noch dazukommen.

Das ist die Empfehlung mit dem mit Abstand besten Verhältnis von Aufwand zu
Ertrag im ganzen Projekt.

---

## 5 · Entscheidungen, die ich dir vorlege

**1 · Was soll die Kennzahl sein?**
Mein Vorschlag: den Anteil im Optimum **behalten** — ihr seid daran gewöhnt,
und der Chef liest ihn — aber die Überschrift wechseln lassen. Nach vorne
gehört der limitierende Nährstoff („Nitrat limitiert, bei 2 % der
Untergrenze"), der Anteil daneben als Nebenzahl mit Nenner und Unsicherheit.
Alternative wäre ein kontinuierlicher Desirability-Index — statistisch sauberer,
aber für den Chef nicht mehr lesbar. Ich rate davon ab.

**2 · Absolutwerte oder normierte Werte?**
Mein Vorschlag: Absolutwerte bleiben die Grundlage — das ist, was das Labor
liefert. Dazu eine **Sensitivitätsanzeige**, die sagt, wie stabil eine
Bewertung gegenüber einer Wassergehaltsverschiebung ist, und ein sichtbar
höherer Rang für die invarianten Verhältnisbefunde. Eine echte Normierung
(EC oder Ionensumme) erst, wenn genug Erhebungen da sind, um sie zu prüfen —
mein Vorschlag: ab zehn.

**3 · Rückwirkende Neubewertung oder Festschreibung?**
Mein Vorschlag: weiter neu rechnen (sonst veralten die Befunde), aber bei
jedem Befund vermerken, mit welchen Einstellungen er entstand, und warnen,
wenn eine Änderung historische Befunde dreht.

**4 · Wie weit soll der Umbau der Datenstruktur gehen — und wann?**
Das ist die eigentliche Frage. Der volle Umbau auf `probe`/`messung`/`referenz`
ist gross und berührt jede Funktion. Drei Wege:

- **(a) Jetzt vollständig.** Danach ist alles Weitere leicht. Ein grosser
  Schritt mit Migration von Schema 4 auf 5.
- **(b) Erst die zehn billigen Korrekturen**, Struktur später. Schneller
  sichtbarer Nutzen, aber die Punkte 18 und 19 bleiben blockiert.
- **(c) Nur die Kovariaten und die Probe-Entität jetzt** — also das Minimum,
  das künftige Auswertungen ermöglicht — den Rest später.

Ich rate zu **(c) plus die zehn billigen Korrekturen**: Die Probe-Entität mit
Replikat, Tisch und Tiefe muss stehen, bevor die nächste Beprobung stattfindet
(siehe Abschnitt 4), sonst geht die Gelegenheit für den Varianz-Versuch
verloren. Der Rest der Struktur kann warten.

**5 · Wie viele Replikate sollen künftig Standard sein?**
Mein Vorschlag: nach dem einmaligen Versuch aus Abschnitt 4 entscheiden. Zeigt
er eine kleine Streuung, genügt eine Probe je Erhebung. Zeigt er eine grosse,
sind zwei bis drei nötig, damit der Reiter Wirkung überhaupt je etwas aussagen
kann. Diese Entscheidung sollte auf der Zahl beruhen, nicht auf einer Annahme.

---

## Nachtrag: ein Fehler in meiner eigenen Dokumentation

Beim Nachrechnen ist mir aufgefallen, dass `UMBAU.md` und die Berichtsseite die
Kennzahl an der echten Probe mit **5 von 11 = 45 %** angeben. Richtig sind
**4 von 11 = 36 %**. Die 45 % stammten aus einem Prüflauf **vor** der
Überschuss-Korrektur (Magnesium zählt seither als Überschuss, weil das
Jungblatt 52 % über dem Optimum liegt). Beide Stellen sind korrigiert.
