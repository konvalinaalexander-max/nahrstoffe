# Entwurf: die gekoppelte Ansicht — und was ich vorher sagen muss

Antwort auf `Problembriefing_fuer_Coding_KI.md`. **Nichts davon ist gebaut.**
Der Auftrag verlangt den Entwurf vor dem Bau, und er verlangt Widerspruch, wo
ich etwas für falsch halte. Beides steht hier.

Reihenfolge: erst der Widerspruch (§1–2), weil er den Entwurf beeinflusst, dann
der Entwurf (§3–6), dann was ich am Datenmodell brauche (§7) und was wegfällt
(§8).

---

## 1 · Zwei Befunde, die im Briefing fehlen — und die die Fragestellung ändern

Ich habe die vier Wasseranalysen nachgerechnet, die im Projekt liegen. Zwei
Dinge fallen dabei auf, die das Briefing nicht nennt.

### 1.1 Kalium und Phosphor werden überhaupt nicht gedüngt

Das steht in der Tabelle des Briefings selbst, wird aber nirgends verbunden:

| Mittel | liefert |
|---|---|
| Biovin 9N | N, Fe, Mn, Zn, Cu — **kein P, kein K** |
| Epsotop | Mg, S |
| Phosphorsäure | **P** |
| Zitronensäure | nichts |
| Halades PE | nichts |

**Kalium hat keine einzige Quelle** ausser dem Frischwasser (0,3–0,5 mmol/l) und
der Grunddüngung im Ballen. Bei 4–5 cm Ballen und drei bis vier Fluten täglich
ist die Grunddüngung nach wenigen Tagen ausgewaschen. Dass Kalium in 25 von 28
Proben zu tief liegt, ist damit **keine Beobachtung, die einer Erklärung
bedarf** — es ist die zwangsläufige Folge davon, dass kein Kalium zugegeben
wird.

Das macht die Erklärung in §3 des Briefings — Magnesium füllt die Lücke, die
Kalium hinterlässt — überflüssig. Sie ist nicht falsch, aber sie erklärt ein
Rätsel, das keines ist.

**Und der Phosphor hat gerade seine einzige Quelle verloren.** Bis August kam P
ausschliesslich aus der Phosphorsäure — im Wasser 1,47 und 2,81 mmol/l, das
sind 45 bis 87 mg P/l, sehr viel für Giesswasser. Seit September wird
Zitronensäure verwendet, die kein P enthält.

> **Prüfbare Vorhersage:** Blatt-Phosphor muss ab September fallen. Er lag
> bisher mit 380–520 ppm im Sollbereich (360–530) — aber nur, weil die
> pH-Korrektur ihn mitlieferte. Wenn die nächste Blattsaftprobe P unter 360
> zeigt, ist das kein neues Problem, sondern die Rechnung für den Säurewechsel.

Das ist die erste Ansicht, die ich bauen würde, und sie ist billig: **eine
Eingangsbilanz — welches Element hat überhaupt eine Quelle.** Sie fällt aus den
Produktstammdaten heraus, die schon da sind.

### 1.2 Für den 6.8.-Befund gibt es eine zweite, mindestens gleich starke Erklärung

Das Briefing nennt den Vergleich der beiden Reservoirs am 6.8. den *wichtigsten
Einzelbefund* und schliesst: die Nitrifikation wird vom Desinfektionsmittel
unterdrückt. Das ist plausibel. Aber die beiden Reservoirs unterschieden sich an
diesem Tag **in mehr als nur dem Desinfektionsmittel**:

| 6.8. | pH | NH₄ mmol/l | **freies NH₃** | NO₃-N |
|---|---|---|---|---|
| hinten, ohne H₂O₂ | 7,4 | 2,62 | **0,62 mg/l** | 19,6 mg/l |
| vorne, mit H₂O₂ | 7,9 | 3,55 | **2,59 mg/l** | < 4,2 mg/l |

Freies Ammoniak (NH₃, nicht NH₄⁺) ist der klassische Hemmstoff der
Nitritoxidierer. Die Schwelle liegt nach Anthonisen bei 0,1–1,0 mg/l. **Das
vordere Reservoir liegt mit 2,6 mg/l weit darüber, das hintere mit 0,62 mg/l am
Rand.** Der Unterschied im freien Ammoniak ist Faktor 4,2 — allein aus dem
halben pH-Punkt Unterschied.

Es gibt also zwei Kandidaten, und der Datensatz kann sie nicht trennen:

- **A ·** Die Peressigsäure tötet die Nitrifikanten.
- **B ·** Der höhere pH im vorderen Reservoir hemmt sie über freies Ammoniak.

Beide sagen dasselbe Ergebnis voraus. n = 1. **Die Anwendung darf «wird
unterdrückt» nicht als Befund zeigen, sondern als zwei konkurrierende
Hypothesen mit dem Trennversuch daneben.**

Der Trennversuch ist billig und steht schon in §5 des Briefings als Datenlücke:
**Nitrit messen.** Wenn Hypothese B stimmt, staut sich Nitrit — die
Ammoniumoxidierer arbeiten, die Nitritoxidierer sind gehemmt. Wenn A stimmt,
fehlt beides und es gibt weder Nitrit noch Nitrat. Ein Teststreifen entscheidet
das in fünf Minuten und ist die wertvollste einzelne Messung, die der Betrieb
gerade machen kann.

Nebenbei: Peressigsäure zerfällt binnen Stunden zu Essigsäure und Sauerstoff.
Ihre direkte biozide Wirkung ist kurz — aber die Essigsäure bleibt als leicht
abbaubarer Kohlenstoff zurück und füttert heterotrophe Bakterien, die den
Nitrifikanten Sauerstoff und Platz wegnehmen. Wirkung A wäre also eher indirekt
und länger anhaltend, als sie klingt.

---

## 2 · Vier Stellen, an denen ich dem Briefing widerspreche

### 2.1 «Nitrat-N 2,1 mg/l» ist kein Messwert

Das Labor hat `<0,3 mmol/l` berichtet — eine Nachweisgrenze. 2,1 ist genau die
Hälfte davon, also ein eingesetzter Ersatzwert. Der ehrliche Wert ist
**«< 4,2 mg N/l»**. Am Schluss ändert das nichts (19,6 gegen < 4,2 bleibt ein
Faktor > 4,7), aber die App darf diese Ersetzung nicht machen — das ist
Leitplanke 8, und sie gilt gerade hier, wo die Zahl trägt.

### 2.2 Die K/Mg-Korrelation ist wahrscheinlich ein Rechenartefakt

Das Briefing sagt selbst: «Die Kationensumme im Saft bleibt fast konstant, nur
die Zusammensetzung kippt.» **Wenn die Summe konstant ist, müssen zwei ihrer
Bestandteile negativ korrelieren — rein arithmetisch.** Eine Korrelation von
−0,64 ist unter dieser Bedingung kein Hinweis auf einen Mechanismus, sondern
das, was Aitchison den Schliessungseffekt nennt (siehe auch
`BEFUNDE-STATISTIK.md` §A, wo dasselbe Problem schon steht).

Dazu die Stichprobe: bei sechs Zeitpunkten ist r = −0,64 nicht signifikant
(p ≈ 0,17). Bei 28 Proben wäre es signifikant, aber die 28 stammen aus
verschiedenen Sätzen unterschiedlichen Alters — der Alterseffekt ist nicht
herausgerechnet.

**Folge für den Entwurf:** Eine Korrelationsansicht baue ich zuletzt und
kleinstmöglich, mit n und Vertrauensbereich, und mit einem stehenden Hinweis,
dass zwischen zwei Kationen im Saft eine negative Korrelation zu erwarten ist,
auch wenn nichts dahintersteckt. Lieber baue ich ein **Streudiagramm zweier
Parameter mit der Zeit als Farbe** — das zeigt dasselbe, ohne die falsche
Genauigkeit einer einzelnen Zahl.

### 2.3 Fe, Mn und Al fallen gemeinsam — das spricht eher für Verschmutzung als für den Wurzelraum

Aluminium ist kein Nährstoff. Basilikum nimmt es nicht auf. Ein Blattsaftwert
von 0,6–2,6 ppm gegen ein Optimum von «< 0,5» ist deshalb zuerst ein Verdacht
auf **Substratstaub auf dem Blatt**, nicht auf Aufnahme.

In der einen Probe, die mir vollständig vorliegt, ist das Muster deutlich:

| | Jungblatt | Altblatt |
|---|---|---|
| Aluminium | 1,03 | **1,42** |
| Silizium | 31,5 | **47,2** |

Beide sind im **älteren** Blatt höher — genau das, was man erwartet, wenn sich
Staub über die Zeit auf der Blattfläche sammelt. Eine Fe/Al-Korrelation von 0,97
ist die klassische Signatur einer gemeinsamen partikulären Verunreinigung.

Wenn das stimmt, ist die Lesart «der Ballen wird über die Saison weniger sauer»
nicht gestützt — dann sagt die Reihe etwas über die Sauberkeit der Probenahme,
nicht über den Wurzelraum. **Prüfbar:** Beim nächsten Mal eine Probe gewaschen
und eine ungewaschen einsenden. Kostet eine Analyse.

### 2.4 «0,8 % kommen an» überzeichnet den Verlust

Die Zahl teilt kumulativ Dosiertes durch das Systemvolumen und ignoriert, dass
wöchentlich 7 500 bis 33 000 l von 19 200 l ersetzt werden. Bei 33 000 l
Austausch ist der Inhalt in weniger als einer Woche fast vollständig getauscht.
Die erwartete Konzentration ist also deutlich niedriger als die kumulative
Rechnung.

Die Richtung stimmt trotzdem: selbst grosszügig verdünnungskorrigiert bleibt es
bei einstelligen Prozenten. Aber die Zahl gehört mit ihrer Annahme angeschrieben.
Die gebaute Soll-Ist-Bilanz sagt das bereits; ich würde eine zweite Spalte
ergänzen, **verdünnungskorrigiert, sichtbar als Modell markiert.**

### 2.5 Die Symptomdifferenz ist weniger eindeutig, als sie dasteht

Die Ausschlussliste in §4 ist grundsätzlich richtig, aber:

- **Magnesiummangel wird über den Blattsaftwert ausgeschlossen.** Interveinale
  Chlorose durch Mg beginnt am **Altblatt**, die durch Fe und Zn am
  **Jungblatt**. Das Briefing sagt nicht, auf welcher Blattetage die Streifen
  sitzen. **Das ist der billigste Trennversuch überhaupt** — ein Blick, und
  Mg ist raus oder drin.
- Die beschriebene Geometrie — Adern dunkelgrün, breiter grüner Saum, nur ein
  dünner Streifen in der Mitte hell, 80 % grün — ist ein **frühes Stadium**. Die
  klassische Eisenchlorose ist ein feines grünes Netz auf hellem Grund über
  fast die ganze Spreite. Zinkmangel bei Basilikum zeigt sich meist **zuerst
  über gestauchte Internodien und kleine Blätter**, erst danach über Chlorose.
  Die Beschreibung passt zu keinem der beiden lehrbuchmässig.
- Nicht ausgeschlossen sind: beginnender **Schwefelmangel**, **Spinnmilben**
  (Saugstellen sehen interveinal aus) und **Virus-Mosaik**.

**Folge für den Entwurf:** Genau dafür ist der Reiter Fotos mit dem Feld
`etage` gebaut. Die Anwendung soll die Frage «welche Etage?» stellen, nicht
beantworten.

### 2.6 Die Kulturdauer widerspricht dem bisherigen Briefing

`Problembriefing` §1 sagt **4 Wochen**. `BRIEFING.md` §2 und `db.einst`
sagen **6–8 Wochen im Sommer, 9–11 im Winter**.

Das ist kein Detail: Die Kulturdauer geht in jede Altersangabe, in den Planer
und in jede «Woche X»-Beschriftung ein. **Ich ändere das nicht, bevor du es
bestätigst.** Ebenso das Systemvolumen: 2 × 9 600 = 19 200 l statt der bisher
hinterlegten 20 000 l.

---

## 3 · Der Entwurf: ein Reiter «Verlauf», drei Spuren, eine Zeitachse

### Aufbau

```
┌─ Werkzeugleiste ────────────────────────────────────────────┐
│  Voreinstellung: [Stickstoffform] [Kommt Eisen an?] [Zink]  │
│                  [Kalium] [pH und was er ausfällt]          │
│  Achse: [Datum ▾]   Skala: [Lage 0–3 | Messwert]            │
│  ── ein Satz, was hier zu sehen ist und was ihn widerlegt ──│
├─ PFLANZE  (Blattsaft) ──────────────────────────────────────┤
│  Sollbereich als grünes Band, Punkte, Farbe = Nährstoff,    │
│  Form = Blattetage. Eigene y-Achse.                         │
├─ WASSER  (Analysen + Tankmessungen) ────────────────────────┤
│  Laboranalysen gross, Tank-pH/EC klein und grau,            │
│  Richtwertband. Eigene y-Achse in der Einheit des Labors.   │
├─ EREIGNISSE ────────────────────────────────────────────────┤
│  Logbuchmarker · Fotospur · Säure-, Dünger-, Wasserzugaben  │
└─ eine gemeinsame Zeitachse ─────────────────────────────────┘
```

Drei Spuren statt zwei, weil die Ereignisse zu beiden gehören und sie sonst
zweimal gezeichnet werden müssten.

### Die drei Fragen, die der Auftrag stellt — meine Antworten

**Einheiten: ich rechne nicht um, und das ist eine inhaltliche Entscheidung.**

Blattsaft-ppm und Wasser-mmol/l messen verschiedene Dinge: Konzentration im
ausgepressten Saft gegen Konzentration in der Lösung. Zwischen ihnen steht die
Wurzel, das Substrat und der Transpirationsstrom. Eine Umrechnung würde eine
Massenbilanz suggerieren, die es nicht gibt.

Stattdessen:

- **Vorgabe:** oben die Lage 0–3 (Anteil des Sollbereichs), unten die
  Labor-Einheit mit Richtwertband. Das ist ehrlich: die Pflanze hat einen
  Sollbereich, das Wasser meist nicht — eine gemeinsame Normierung würde für
  das Wasser eine Norm erfinden.
- **Bei genau einem Nährstoff** schalten beide Spuren auf Messwerte um. Dann,
  und nur dann, blende ich die Umrechnung mg/l als Nebenzeile ein.

**Datendichte: ich strecke das Wasser nicht, ich fülle es mit dem, was oft gemessen wird.**

4 Laboranalysen sehen leer aus. Aber die Excel-Datei liefert **pH und EC am Tank
in hoher Dichte** — und pH ist der Treiber der ganzen Geschichte. Die Wasserspur
bekommt deshalb zwei Ebenen: Laborpunkte gross, Tankmessungen klein und grau.
Damit ist sie dort dicht, wo es zählt.

Zwischen Laboranalysen wird **nicht interpoliert**. Stattdessen eine blasse
Schraffur: die Leere soll als Abwesenheit lesbar sein, nicht als Null.

**Paare: fünf benannte Fragen statt 22 × 21 Kombinationen.**

| Voreinstellung | Pflanze | Wasser | Was man sieht |
|---|---|---|---|
| **Stickstoffform** | NO₃, NH₄ | NO₃, NH₄, pH | Der Kernbefund: viel N, falsche Form |
| **Kommt das Eisen an?** | Fe | Fe + dosiert als Referenzlinie | Die Lücke zwischen Dosierung und Ankunft |
| **Kommt das Zink an?** | Zn | Zn + dosiert | dasselbe für Zink |
| **Kalium** | K | K, NH₄ | K wird nicht gedüngt, NH₄ konkurriert zusätzlich |
| **pH und was er ausfällt** | Fe, Zn, Mn | pH, HCO₃ | Die gemeinsame Ursache |

Jede Voreinstellung trägt **einen Satz, was zu sehen sein sollte — und einen,
was die Erwartung widerlegen würde.** Das ist der Unterschied zwischen einem
Diagramm und einer Untersuchung.

### Bedienung

- **Zoomen und Verschieben** wirken auf alle drei Spuren: ein gemeinsamer
  x-Bereich im `DIAG`-Zustand, Ziehen verschiebt, Rad zoomt, Doppelklick setzt
  zurück. Darunter ein schmaler Übersichtsstreifen mit dem gewählten Ausschnitt.
- **Ein Zeiger, drei Spuren:** eine Senkrechte in allen dreien, ein
  Infokästchen, das zusammenfasst, was zu dieser Zeit in jeder Spur steht.
- Alles Übrige folgt den zehn Diagrammregeln, die schon gelten.

---

## 4 · Die übrigen Ansichten, nach Nutzen geordnet

| | Ansicht | Beantwortet | Aufwand |
|---|---|---|---|
| 1 | **Eingangsbilanz** — welches Element hat überhaupt eine Quelle | §1.1 · sofort sichtbar, dass K und P fehlen | klein |
| 2 | **Mängel-Rangliste** — alle Parameter nach Schwere, mit Verlauf und n | Frage 1 | klein |
| 3 | **Gekoppelte Ansicht** (oben) | Fragen 4 und 5 | gross |
| 4 | **Jung/Alt-Ansicht** — Verhältnis je Nährstoff | Frage 3: trennt Mg vom Fe/Zn | klein, Rechnung existiert |
| 5 | **Soll-Ist mit Verdünnungsspalte** | Frage 5 | klein, Erweiterung |
| 6 | **Streudiagramm zweier Parameter, Zeit als Farbe** | Frage 2, mit Vorbehalt | mittel |

Ich würde **1, 2 und 4 zuerst bauen** — zusammen ein Tag Arbeit, und sie
beantworten die Fragen 1 und 3 fast vollständig. Die gekoppelte Ansicht ist die
grösste Investition und beantwortet Fragen, für die die Datendichte gerade erst
ausreicht.

Eine **Korrelationsmatrix baue ich nicht.** Begründung in §2.2.

---

## 5 · Was die Anwendung nicht leisten kann

Fünf Messungen bewegen mehr als jede Ansicht. Sie kosten zusammen unter 300
Franken und beantworten Fragen, die keine Software aus den vorhandenen Daten
herausholen kann:

1. **Nitrit im Wasser.** Teststreifen. Trennt Hypothese A von B (§1.2).
2. **Ein Foto mit Blattetage.** Kostenlos. Trennt Magnesium von Eisen/Zink (§2.5).
3. **Symptomatisch gegen gesund am selben Tag.** Zwei Analysen. Der Vergleich,
   den es in 28 Proben nicht gibt.
4. **Eine Wasserprobe frisch angesetzt**, nicht aus dem Rücklauf. Macht aus der
   Soll-Ist-Rechnung eine Messung.
5. **Eine Rohwasseranalyse.** Sagt, was das Frischwasser mitbringt — die Bilanz
   muss das heute annehmen.

Dazu weiterhin die Empfehlung aus `BEFUNDE-STATISTIK.md` §4: einmalig drei
Proben statt einer, um die Streuung zu kennen. Ohne sie bleibt jede Aussage über
Veränderung qualitativ.

---

## 6 · Was ich am Datenmodell brauche — Schema 7, alles additiv

```js
gw_NO2                     // Nitrit als Wasserparameter. Ohne Feld keine Messung.
analyse.herkunft           // 'ruecklauf' | 'frisch angesetzt' | 'rohwasser' | 'unbekannt'
analyse.symptom            // 'symptomatisch' | 'gesund' | 'unbekannt'
analyse.gewaschen          // true | false | null   — für §2.3
einst.systemLiter          // 20000 → 19200
einst.dauerSommer          // 7 → 4 ?  offen, siehe §2.6
```

Migration: alle neuen Felder auf `unbekannt` beziehungsweise `null`, bestehende
Daten unverändert, Meldung im Dialog. Der Zoom-Zustand ist Bedienzustand und
gehört nicht in die Datei.

`herkunft` und `symptom` sind die wichtigsten: **§5 des Briefings nennt beide
Lücken, aber die App kann sie heute nicht einmal aufzeichnen, wenn der Betrieb
sie schliesst.**

---

## 7 · Welche Reiter wegfallen

Heute elf. Mein Vorschlag: **acht.**

| Reiter | Vorschlag |
|---|---|
| **Nährstoffe** + **Giesswasser** | **zusammenlegen** zu «Verlauf»: gekoppeltes Diagramm oben, beide Detailteile als aufklappbare Blöcke darunter |
| **Wirkung** | **entfällt.** Vorher/Nachher um ein Ereignis leistet die gekoppelte Ansicht mit Ereignismarkern und Zoom besser, und der Reiter war immer qualitativ |
| **Rundgang** | **Vorschlag: in Fotos aufgehen lassen.** Ein Foto mit Etage und Schweregrad ist derselbe Datensatz, nur brauchbarer als eine 0–3-Zahl ohne Bild. **Das ist Datenverlust und braucht deine Zustimmung** — ich mache es nicht von mir aus |
| Überblick | bleibt, führt neu mit der Mängel-Rangliste statt mit der Kennzahl |
| Analysen, Substrat, Logbuch, Fotos, Planer, Sätze | bleiben |

---

## 8 · Was ich als Nächstes täte

**Bevor ich irgendetwas baue, brauche ich von dir vier Antworten:**

1. **Kulturdauer 4 Wochen oder 6–8?** (§2.6) — betrifft jede Altersangabe.
2. **Rundgang auflösen?** (§7) — betrifft bestehende Daten.
3. **Reihenfolge:** die drei kleinen Ansichten zuerst (Eingangsbilanz,
   Rangliste, Jung/Alt), oder gleich die gekoppelte Ansicht?
4. **Widersprichst du einem der Punkte in §2?** Besonders §2.3 — wenn Aluminium
   Verschmutzung ist, fällt ein Teil der Argumentation des Briefings weg.

Meine Empfehlung: **1, 2 und 4 aus §4 zuerst.** Sie sind an einem Tag gebaut,
zeigen sofort, dass Kalium und Phosphor keine Quelle haben, und beantworten die
Etagenfrage. Die gekoppelte Ansicht danach — sie ist die richtige Idee, aber sie
zeigt ihren Wert erst, wenn mehr als vier Wasseranalysen darin stehen.
