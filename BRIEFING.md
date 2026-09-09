# Briefing: Basilikum-Nährstofftool

**Für eine KI, die neu auf dieses Projekt kommt.** Lies diese Datei ganz,
bevor du `basilikum.html` öffnest, und ändere nichts, bevor du Abschnitt 9
gelesen hast. Sie ersetzt kein Codelesen, aber sie erspart dir, die Absichten
hinter dem Code zu erraten — und mehrere davon sind nicht offensichtlich.

Stand: September 2026 · Schema 7 · rund 385 KB, 5300 Zeilen, eine Datei.

---

## 1 · Was das ist, in drei Sätzen

`basilikum.html` ist ein einzelnes, eigenständiges HTML-Dokument, das
Laboranalysen eines Gartenbaubetriebs einliest, sie fachlich auswertet und die
Ergebnisse so darstellt, dass ein Betriebsleiter ohne Erklärung damit arbeiten
kann. Es gibt keinen Server, keinen Build, keine Datenbank: Daten werden als
JSON-Datei heruntergeladen und wieder hochgeladen. Die einzige externe
Abhängigkeiten sind pdf.js und SheetJS von einem CDN; fallen sie aus,
funktioniert alles ausser dem PDF- beziehungsweise Excel-Import weiter (CSV
liest die App ohne jede Bibliothek).

---

## 2 · Wer das benutzt und wofür

Ein Demeter-zertifizierter Bio-Gartenbaubetrieb (Imhof Bio, Schwerzenbach,
Schweiz) produziert **Topfbasilikum** auf Ebbe-und-Flut-Tischen im Gewächshaus.
Kein Schnittbasilikum — die Pflanzen werden im Topf verkauft.

**Zwei Nutzer, beide am PC:** der Anwender (Agronom) und sein Chef. Der Chef
soll die Auswertungen ohne Erklärung verstehen. Das ist eine harte
Designvorgabe, kein Nice-to-have: jede Kennzahl muss sich in einem Satz
erklären, und jede Annahme muss sichtbar als Annahme gekennzeichnet sein.

**Kulturdaten, die den Code prägen:**

- Kulturzeit rund 6–8 Wochen im Sommer, 9–11 im Winter
- Etwa 8 Sätze laufen gleichzeitig
- Sätze heissen z. B. `28-478`. Die erste Zahl ist die **Aussaat-Kalenderwoche**,
  die zweite eine Chargennummer ohne Bedeutung. Aus der KW wird das Aussaatdatum
  geschätzt, wenn keins eingetragen ist.
- Verschiedene Tische, aber **ein gemeinsamer Giesswasserkreislauf**. Im
  Ebbe-Flut-System fliesst nichts ab: was hineinkommt, reichert sich an. Das
  ist der Grund, warum Natrium und Chlorid eine eigene Regel haben und warum
  Anreicherung der wahrscheinlichere Fehler ist als Mangel.
- Substratwechsel überlappen: alte Sätze laufen im alten Substrat aus, während
  neue schon im neuen stehen.

**Was der Betrieb wissen will, in dieser Reihenfolge:**

1. **Was bewirken unsere Managemententscheidungen?** Wir haben die Düngung
   geändert oder ein neues Substrat gekauft — was ist danach passiert? Das ist
   die Leitfrage, alles andere ist nachgeordnet.
2. **Nähern wir uns über die Zeit dem Optimum?** Aktuell weit davon entfernt:
   an der letzten echten Probe lagen 4 von 11 Kernnährstoffen im Sollbereich.
3. **Was passiert mit einer Pflanze während ihrer Kulturzeit?** Bisher nicht
   messbar, weil noch kein Satz zweimal beprobt wurde. Soll sich ändern — der
   Reiter Planer existiert genau dafür.

**Demeter-Randbedingung, die das Design prägt:** Spurenelemente lassen sich
nicht frei zudüngen. Ein Befund „Zink zu tief" ist deshalb oft nicht direkt
behebbar; die App muss den *Weg* über pH, Wurzelgesundheit und Verfügbarkeit
mitdenken statt eine Dosierung zu empfehlen. Sie empfiehlt grundsätzlich keine
Dosierungen (siehe Abschnitt 9).

---

## 3 · Was für Daten hineingehen

Drei Berichtsformate werden aus PDF gelesen, dazu Handeingabe:

| Quelle | Labor | Was drin steht | Einheiten |
|---|---|---|---|
| **Blattsaft** | NovaCropControl | 23 Parameter, typisch je eine Jung- und eine Altblattprobe, mit laborseitigem Sollbereich je Parameter | ppm, ausser Zucker %, EC mS/cm, pH und K/Ca ohne |
| **Substrat** | Labor Ins | Reserven (P₂O₅, K₂O, Mg, Ca), sofort verfügbare Anteile, Spurenelemente, pH, Salz, Nmin | mg/l, Salz g/l |
| **Giesswasser** | NovaCropControl | 21 Parameter, teils als Einzelbericht, teils als Sammelbericht mit Historie | **Makro mmol/l, Mikro µmol/l** — nicht mg/l |
| **Tankmessungen** | eigene Excel-Datei | pH und EC je Reservoir, Wurzel-EC je Satz, **Bemerkungsspalte** | mS/cm, pH |
| **Fotos** | Kamera | Schadbilder, verkleinert als JPEG in derselben Sicherungsdatei | – |

Die Bemerkungsspalte der Excel-Datei ist der wertvollste Teil des Imports: sie
enthält den grössten Teil der Betriebsgeschichte und wird zu Logbuchvorschlägen
(`bemerkungLesen`). Drei Regeln darin sind teuer erkauft und dürfen nicht
verloren gehen: «Wasser **ohne** Dünger» ist keine Düngergabe, ein benanntes
Produkt schlägt ein allgemeines Wort («Düngerzugabe (3kg Epsotop»), und ein
Mittel ohne Menge ist meist Erzählung («vor Säurezugabe») und wird zur Notiz.

Wichtige Eigenheiten, die im Parser abgebildet sind:

- **Der Wasserbericht ist eine gedrehte Tabelle.** Zeilenweises Rekonstruieren
  verliert Werte. `parseGiess` arbeitet deshalb **koordinatenbasiert**:
  y bestimmt die Parameterzeile, x die Spalte. `pdfPunkte()` liefert je
  Textstück `{x,y,s}`.
- **Sammelberichte enthalten mehrere Proben** (aktuelle plus Historie). Sie
  werden beim Einlesen in einzelne Proben mit eigenem Datum und eigener
  Probennummer zerlegt und über die Probennummer dedupliziert.
- **Proben vom selben Tag sind normal** — verschiedene Entnahmestellen. Sie
  müssen unterscheidbar bleiben; das ist der Grund für Farbe und Form je
  Entnahmestelle und für die Namen in jedem Tooltip.
- **Nachweisgrenzen** (`<0,05`) werden als `{wert:0.05, unter:true}` geführt
  und **nie bewertet**. Eine Zahl daraus zu machen wäre erfunden.
- **`<0,50 - <0,50`** ist keine Spanne, sondern eine Nachweisgrenze. Aluminium
  hat genau diesen Fall.
- **Spaltenmarker ¹ ²** stehen im NCC-PDF auf eigenen Zeilen. `putz()` leert
  **nur** Zeilen, die ausschliesslich aus einem Marker bestehen — sonst würde
  ein Messwert von genau 1 oder 2 verschwinden. Das war ein echter Bug.

---

## 4 · Das Datenmodell

Ein einziges globales Objekt `db`. `leer()` definiert die Form:

```js
{schema:7, version:0, gespeichert:null,
 analysen:[],      // jede Probe eine Zeile: typ, datum, satz, blattalter,
                   // zustand, werte{}, optima{}, stelle, laborId, kultur, quelle,
                   // herkunft ('ruecklauf'|'zulauf'|'tank'|'unbekannt'),
                   // symptom ('symptomatisch'|'gesund'|'unbekannt'), gewaschen
 ereignisse:[],    // Logbuch: typ, datum, mittel, menge, einheit, stelle,
                   // jeReservoir, felder{}, geltung, saetze[], quelle
 messungen:[],     // pH/EC am Tank: datum, stelle, ph, ec, ecFrisch, temp,
                   // notiz, quelle ('hand' | 'excel')
 fotos:[],         // id, datum, titel, notiz, satz, etage, analyseId,
                   // herkunftDatum, breite, hoehe, daten (Data-URL, JPEG)
 produkte:{},      // Stammdaten: name, form, dichte, gehalt{Element:%}, quelle
 rundgaenge:[],    // wöchentliche Bonitur, Schadbilder in Stufen 0–3
 saetze:{},        // je Satz: eingetragenes Aussaatdatum, Notizen
 eigeneOptima:{},  // eigene Sollbereiche, schlagen die des Labors — je Grenze
 plan:{zielwochen:[2,4,6], begleitet:[], geplant:[]},   // geplant: +typ, +analyseId
 einst:{verlagerung:1.3, kMg:8, kCa:3, nh4no3:0.5, toleranz:5,
        dauerSommer:7, dauerWinter:10, systemLiter:19200,
        kern:[…], schaeden:[…], gwRicht:{}}}
```

**Mengen im Logbuch sind Zahlen mit fester Einheit je Art**, nicht Freitext.
Das ist der Grund, warum die Soll-Ist-Bilanz überhaupt rechnen kann. Bei
flüssigen Produkten ist die Einheit Liter, bei festen Kilogramm — abgeleitet
aus `produkte[x].form`. **`jeReservoir` wird in der Anzeige nie stillschweigend
verdoppelt** («15 l je Reservoir (zusammen 30 l)»); nur die Bilanz rechnet mit
dem Doppelten und sagt das ausdrücklich.

**Fotos liegen als Data-URL in derselben JSON-Datei.** Leitplanke 2 lässt
weder Ordnerzugriff noch Browserspeicher zu, also bleibt nur das. Deshalb wird
beim Einlesen auf 1400 px und JPEG-Güte 0,72 verkleinert, und die Grösse der
Sicherungsdatei steht im Reiter Fotos — ab 40 MB mit Warnung.

**Zentrale abgeleitete Einheit: die Erhebung.** `erhebungen()` gruppiert
Analysen nach `satz|datum|zustand` — eine Jung- und eine Altblattprobe desselben
Tages sind **eine** Erhebung mit zwei Proben. Fast alle Auswertungen arbeiten auf
Erhebungen, nicht auf Analysen. `e.proben` ist `{jung, alt, misch}`, `e.bew` die
Bewertung je Nährstoff, `e.index` die Kennzahl, `e.alter` das Kulturalter.

**Schema 7 (neu).** Drei Felder je Analyse und ein neuer Wasserparameter:

- `herkunft` — eine Wasserprobe aus dem **Rücklauf** misst nicht dasselbe wie
  eine aus dem Zulauf. Vorher stand nirgends, welche von beiden es war, und
  jede Bilanz tat so, als sei es der Zulauf. Migration setzt `'unbekannt'`,
  **nicht** geraten.
- `symptom` und `gewaschen` — ob die Probe von auffälligen oder gesunden
  Pflanzen stammt, und ob das Blatt gewaschen war. Ungewaschenes Blatt
  erklärt Aluminium und Silizium aus Substratstaub, nicht aus der Wurzel.
- `gw_NO2` (Nitrit, mmol/l) — der **Trennversuch** zwischen «Nitrifikation
  gestört» und «Ammonium wird laufend nachgeliefert». Ohne ihn bleibt die
  Ursache der Ammoniumlage unentscheidbar.
- `einst.systemLiter` wird von 20 000 auf **19 200 l** berichtigt (2 × 9 600).
  Die Migration sagt das in ihrem Bericht.

**Persistenz: die Datei schreibt sich selbst.** Beim Sichern entsteht *eine*
HTML-Datei — dasselbe Werkzeug, mit dem ganzen Bestand darin. Wer sie bekommt,
öffnet sie doppelt und arbeitet weiter; es gibt keine zweite Datei und keinen
Hochladeschritt. Der Mechanismus ist bewusst klein gehalten:

```html
<script type="application/json" id="datenblock">null</script>
```

- `seiteMerken()` nimmt beim Start ein Abbild von `document.documentElement`
  — **als Allererstes**, vor jedem Zeichnen und vor allem, was von aussen
  nachgeladen wird, und **nachdem** der Datenblock geleert wurde. Beides ist
  nötig: sonst stünde entweder der halb aufgebaute Bildschirm im Abbild, oder
  jede Sicherung trüge den vorigen Bestand ein zweites Mal mit sich und die
  Datei wüchse bei jedem Speichern.
- `seiteMitDaten()` setzt `JSON.stringify(db)` in den Block. Jedes `<` wird zu
  `\u003c` — im JSON dasselbe Zeichen, aber ein `</script>` in einem
  Logbucheintrag kann die Datei nicht mehr zerreissen.
- `datenAusText()` liest beides: eine reine JSON-Datei und eine gesicherte
  HTML. Aus der HTML kommt **nur** der Datenblock, nie fremder Programmcode.
- `sichernJson()` bleibt als zweiter Weg (Reiter Einstellungen) — zum
  Archivieren und für andere Programme.

Warum ein Selbstabbild und nicht Nachlesen der eigenen Datei: aus einer lokal
geöffneten Seite darf keine Datei gelesen werden — `fetch` auf `file://` ist in
Firefox seit Jahren gesperrt —, und ein Server ist ausdrücklich nicht
gewünscht. Zwei Folgen, die in der Oberfläche stehen: wer die Datei bekommt,
hat *alles* (auch die Fotos), und die Datei friert den Stand des Werkzeugs ein
— beim Versionswechsel öffnet man die neue Fassung und lädt die alte Datei
über «Datei öffnen».

`migriere(roh)` hebt alte Dateien an und meldet in einem Dialog, was es geändert
hat — auch bei den eingebetteten Daten beim Start. Der Speicherschritt bleibt
bewusst manuell, und localStorage ist weiterhin ausgeschlossen (Abschnitt 9).

---

## 5 · Die Fachlogik, die man kennen muss

Das ist der Teil, der nicht aus dem Code allein hervorgeht.

### Phloemmobilität entscheidet, welches Blatt zählt

`MOBIL` ordnet jedem Nährstoff `mobil`, `teilmobil` oder `immobil` zu.
`massgebliche(e,k)` wählt daraus das entscheidende Blatt:

- **mobil** (NO₃, K, Mg, P, Cl, Na, Mo) → **Altblatt**. Bei Knappheit räumt die
  Pflanze das alte Blatt aus, um die Spitze zu versorgen. Ein volles Jungblatt
  sagt dann nichts.
- **immobil** (Fe, Ca, B, Si) → **Jungblatt**. Dorthin kommt der Nachschub nicht
  an; das Altblatt bleibt voll, auch wenn längst Mangel herrscht.
- **teilmobil** (S, Zn, Cu, Mn) → **beide**, versorgt nur wenn beide stimmen.

### Die Bewertung ist absichtlich asymmetrisch

`bewerte(e)`:

- **Mangel** wird **nur am massgeblichen Blatt** festgestellt.
- **Überschuss** zählt **an jedem Blatt**.

Begründung: ein Nährstoff, der irgendwo über dem Optimum liegt, ist im
Überschuss, egal wo er sich staut — und im geschlossenen Umlaufsystem ist
Anreicherung der wahrscheinlichere Fehler. Diese Asymmetrie ist eine bewusste
Entscheidung, kein Versehen. Wer sie ändert, ändert die Kernaussage der App.

### Fünf Stufen statt drei

`status(v,o,unter)` liefert `tief | randtief | ok | randhoch | hoch`. Die
Randstufen fangen Messrauschen ab (Toleranz `db.einst.toleranz`, Vorgabe 5 %),
damit 0,79 gegen eine Untergrenze von 0,80 kein Alarmbefund wird. `istOk()` gilt
für `ok`, `randtief`, `randhoch`.

### Die Lage-Skala 0–3

`lage(v,o)` bildet jeden Messwert auf eine einheitenfreie Skala ab:
`[0,1]` unter dem Sollbereich, `[1,2]` im Sollbereich, `[2,3]` darüber. Nur so
lassen sich Nährstoffe verschiedener Einheiten in einem Diagramm zeigen.
**Achtung:** die Skala ist begrenzt und nicht symmetrisch — siehe Befund C in
`BEFUNDE-STATISTIK.md`.

### Die Kennzahl

`indexVon(bew)`: Anteil der Kernnährstoffe im Sollbereich. Jeder gleich
gewichtet, jeder am Blatt, an dem er aussagekräftig ist. Nicht bewertbare
Nährstoffe fallen aus dem Nenner. **Der Nenner schwankt deshalb zwischen
Erhebungen** — ein bekannter, dokumentierter Mangel (Befund N).

`KERN_VORGABE` = NO₃, K, Ca, Mg, P, S, Fe, Mn, Zn, B, Cu — elf Stück, in den
Einstellungen änderbar. **Na und Cl sind absichtlich nicht drin:** sie werden
nie zugedüngt, „zu tief" ist der Normalfall. Früher erzeugte die App daraus die
Empfehlung „Zufuhr von Natrium erhöhen" — ein Fehler, der zeigt, warum die
Ballast-Sonderbehandlung existiert.

### Das Regelwerk

`befunde(e)` erzeugt aus einer Erhebung Klartextbefunde, acht Regelgruppen:

| | Regel |
|---|---|
| R1 | Stickstoff als Leitbefund |
| R2 | Ammonium verdrängt Kalium |
| R3 | Stickstoffform (NH₄/NO₃-Verhältnis) |
| R4 | Kationenverhältnisse, einmal je Erhebung |
| R5 | Mangan und Substrat-pH |
| R6 | Ballastionen (nur „zu hoch") |
| R7 | Weiches Gewebe — ausdrücklich als Hypothese gekennzeichnet |
| R8 | Einzelbefunde je Nährstoff, inklusive Verlagerungsmuster |

Grundsätze, die eingehalten werden müssen:

- Je Nährstoff entsteht **höchstens ein** Befund. Verknüpfende Regeln
  unterdrücken die Einzelbefunde, die sie erklären.
- Verhältnisregeln laufen einmal je Erhebung, nicht je Blattalter — ein
  Kationen-Ungleichgewicht ist eine Eigenschaft der Nährlösung.
- **Jede gesetzte Schwelle steht im Feld `regel:`** und ist in den Einstellungen
  änderbar. Das ist eine Leitplanke, keine Stilfrage.

---

## 6 · Aufbau des Codes

Eine Datei, drei Blöcke: ein `<style>`, das Markup-Gerüst, ein `<script>`. Der
Skriptteil ist durchnummeriert:

| | Abschnitt | Inhalt |
|---|---|---|
| 1 | Werkzeug | `esc`, `nz`, `fmt`, `toNum`, `AKTION` |
| 2 | Fachwissen | `NAME`, `EINH`, `MOBIL`, `HAUPT`, `BALLAST`, `EVTYPEN`, `SCHAEDEN` |
| 3 | Parser | `parseNCC`, `parseIns`, `parseGiess`, `parseAuto`, `pdfPunkte` |
| 4 | Datenmodell | `leer`, `migriere`, `erhebungen`, `bewerte`, `bilanz`, `alter` |
| 5 | Regeln | `befunde` — die acht Regelgruppen |
| 6 | Diagramme | `chartPunkte`, `chartStapel`, `chartIndex`, `chartProfil`, `chartSaetze`, Tooltip |
| 7 | Gerüst | `render`, `diagFrisch`, Ereignisverdrahtung, Dialog |
| 8–17 | je ein Reiter | `vLage`, `vAnalysen`, `vVerlauf`, `vNaehr`, … |
| 17 | Sichern und Laden | Download, Upload, Migration |
| 18 | Verdrahtung | Dateieingaben, Drag-and-drop, Resize, Start |

### Zwei Muster, die durchgehalten werden müssen

**1 · Kein einziges `onclick` im Markup.** Alle Klickziele laufen über
`data-tun="name"` plus Einträge in der Ablage `AKTION`. Zwei delegierte
Beobachter am Dokument lesen `data-tun` (Klick) und `data-aend` (Änderung).
Grund: früher wurden Aufrufe als Zeichenketten zusammengesetzt, und ein
Apostroph in einem Logbuchtitel zerlegte den Aufruf. Baue nichts mit `onclick`
nach.

**2 · Diagramme zeichnen sich selbst neu, nicht die Seite.** `render()` merkt
sich die Scrollposition und springt nur beim Reiterwechsel nach oben. Eine
Ansicht meldet über `DIAG = {teile:[[id,fn],…], zeichnen, klick}` an, welche
Teile zum Diagramm gehören; `diagFrisch()` baut nur diese neu. Fällt etwas aus,
wird auf `render()` zurückgefallen.

> **Fallstrick, der schon einmal zugeschlagen hat:** alles, was von der Auswahl
> abhängt — Farben, Einheiten, Skala, Begründungstexte — muss **innerhalb** der
> neu aufgerufenen Funktion bestimmt werden, nicht im äusseren
> Gültigkeitsbereich der Ansicht. Sonst zeigt das Diagramm nach einer Änderung
> noch die Werte der vorigen Auswahl. Dafür gibt es in `vNaehr`, `vGiess` und
> `vVerlauf` je eine Funktion `nsAb()`, `gwAb()` bzw. `vlAb()`. Dieser Fehler
> ist im Projekt **dreimal** gemacht worden — beim dritten Mal hat ihn die
> Browserprüfung gefunden, nicht der Blick auf den Code.

**3 · `diagFrisch()` stellt die Scrollposition wieder her.** Zwischen dem
Ersetzen der Bedienelemente und dem Zeichnen ist die Seite kurz um die Höhe des
Diagramms kürzer. Der Browser begrenzt die Scrollposition dann auf das neue
Seitenende und holt sie **nicht** zurück, wenn die Seite wieder wächst. Wer
unten stand, landete oben — dieselbe Wirkung wie ein Seitensprung, andere
Ursache.

### `chartStapel` — mehrere Spuren, eine Zeitachse

Für den Reiter Verlauf. `chartStapel(box, {spuren, von, bis, ereignisse, fotos,
aufKlick})`; jede Spur ist `{titel, serien, yTyp:'lage'|'wert', band, bandLabel,
yLabel, hoehe, leerText}`. Vier Entscheidungen, die nicht wieder aufgeweicht
werden sollten:

- **Jede Spur hat ihre eigene y-Achse, eine einzige Zeitachse steht ganz
  unten.** Das ist der ganze Zweck: derselbe Tag ist überall derselbe x-Wert.
- **Die y-Achse folgt den Messwerten, nicht dem Richtwert.** Ein Richtwert von
  20 µmol/l gegen gemessene 3 würde die Auflösung dorthin ziehen, wo nichts
  steht. Das Band wird stattdessen auf die sichtbare Fläche beschnitten und
  trägt dann den Zusatz «(reicht über den Ausschnitt hinaus)».
- **Serien werden nach Einheit *und* Grössenordnung gruppiert**
  (`wasserSpuren`). µmol/l und pH haben sich einmal eine Achse geteilt — sie
  lagen zufällig in derselben Grössenordnung, sahen plausibel aus und waren
  falsch. Dieselbe Einheit reicht aber nicht: Ammonium bei 4 mmol/l und Nitrit
  bei 0,02 mmol/l gehören ebenfalls getrennt, sonst ist Nitrit eine Linie auf
  null. Es gilt derselbe Faktor 25 wie im Reiter Nährstoffe. Zusammengehalten
  wird dabei **nach Parameter**, nicht nach Einzelreihe: Nitrat vorne und
  Nitrat hinten gehören auf dieselbe Achse, auch wenn die eine Entnahmestelle
  dreimal so hoch liegt. Mehr als drei Wasserspuren werden zusammengelegt —
  und das steht dann als Hinweis über dem Diagramm.
- **Eine Grösse, die im Wasser nie gemessen wurde, bekommt trotzdem eine
  Spur** — eine leere, die sagt warum. Verschwände sie stillschweigend, sähe
  die Frage beantwortet aus, obwohl die halbe Antwort fehlt.

**Die Farbe koppelt oben und unten.** `vlAb()` bildet die Farben über die
*entdoppelten* Schlüssel aus Blatt und Wasser: Nitrat im Blatt und Nitrat im
Wasser ist derselbe Stoff und trägt dieselbe Farbe. Ohne das Entdoppeln
verbraucht `farbenFuer` für den zweiten Eintrag eine Ersatzfarbe und die
Wunschfarbe geht verloren. Die Form bleibt für Blattetage bzw. Entnahmestelle
reserviert.

**Die fünf Fragen sind Startpunkte, keine Grenze.** Ein Klick auf einen
Nährstoff oder eine Wassergrösse schaltet über `vlEigen()` auf `vlPaar='eigen'`
und übernimmt dabei die bisherige Auswahl — die Voreinstellung selbst wird nie
verändert. Bei eigener Auswahl steht **keine** vorformulierte Erwartung da; die
Anwendung behauptet nichts, was sie nicht weiss (Leitplanke 5). Nie gemessene
Wassergrössen bleiben wählbar und sind als «nie» markiert: eine Lücke zu
verstecken wäre schlechter, als sie zu zeigen.

Ziehen verschiebt, Rad zoomt, Doppelklick setzt zurück (`stapelBedienung`).
Der Zustand des Ziehens liegt **ausserhalb** der Funktion: jede Verschiebung
zeichnet neu und ersetzt dabei die Ereignisbehandler. Läge er in deren
Umgebung, wäre das Ziehen nach dem ersten Bildpunkt zu Ende. Und ein voller
Neuaufbau erfolgt erst beim Loslassen — sonst könnte gar kein Doppelklick mehr
entstehen, weil sein erstes Ziel zwischendurch aus dem Dokument verschwände.

### Die Diagrammregeln

1. Kein Sprung — Regler bauen nur das Diagramm neu.
2. Farbe und Form tragen je eine Information. Mehrere Nährstoffe: Farbe =
   Nährstoff, Form = Blatt. Ein einziger: dann übernimmt die Farbe das
   Blattalter, damit sie nicht leer läuft.
3. Eine gemeinsame Messwert-Achse gibt es nur bei gleicher Einheit **und**
   gleicher Grössenordnung (Faktor ≤ 25). Sonst wechselt die App sichtbar auf
   die Lage 0–3 und begründet das mit den konkreten Zahlen.
4. **Punkte sind die Messung, eine Linie ist eine Behauptung.** Vorgabe: nur
   Punkte. Linien zuschaltbar, standardmässig nur innerhalb eines Satzes.
5. Sofortiges Infokästchen am Zeiger (`data-tipp`) statt des `<title>`-Tooltips,
   der erst nach rund einer Sekunde erscheint.
6. Klick auf einen Punkt öffnet die ganze Erhebung.
7. Die Legende ist ein Bedienelement.
8. Zusammenstellungen statt Klickerei.
9. Einstellungen überleben das Neuzeichnen.
10. Leere Zustände erklären, was fehlt.

Dazu die **Fotospur**: `chartPunkte` nimmt `fotos:[{datum,x,anzahl,tipp}]` und
zeichnet je Tag ein Kamerasymbol in einer eigenen Zeile unter der
Messwertfläche — nie in ihr, sonst verdeckt es Messpunkte. Nur auf einer
Datumsachse.

---

## 7 · Die elf Reiter

| Reiter | Beantwortet |
|---|---|
| **Überblick** | Kennzahlen · Nährstofflage über die Zeit · **Rangliste der Mängel** · **Eingangsbilanz** · Befunde je Satz · was chronisch daneben liegt |
| **Analysen** | PDFs einlesen, Kontrolldialog vor der Übernahme, alle Proben, Handeingabe |
| **Verlauf** | **Blattsaft und Giesswasser auf einer gemeinsamen Zeitachse** — fünf benannte Fragen als Startpunkt, darunter jeder Nährstoff und jede Wassergrösse einzeln wählbar |
| **Nährstoffe** | Ein oder mehrere Nährstoffe über Zeit oder Kulturwoche, mit Tabellen darunter |
| **Substrat** | Angebot im Substrat gegen Aufnahme im Blatt |
| **Giesswasser** | Verlauf je Parameter und Entnahmestelle, Richtwerte, **Soll-Ist-Bilanz**, der Kreislauf selbst, Excel-Import |
| **Logbuch** | Schnellerfassung in einer Zeile, Zeitstrahl nach Monaten, nach Art filterbar, «wieder so» zum Duplizieren, **«Wirkung prüfen» je Eintrag** |
| **Fotos** | Galerie je Tag; jedes Foto erscheint als Kamerasymbol unter den Zeitdiagrammen |
| **Rundgang** | Wöchentliche Bonitur, Schadbilder in Stufen 0–3 |
| **Planer** | Geplante Proben von Hand; die automatischen Vorschläge stehen zugeklappt darunter |
| **Sätze & Einstellungen** | Aussaatdaten, eigene Optima, alle Schwellen, Kernnährstoffe |

Der **Kontrolldialog** vor der Übernahme ist wichtig: nichts wandert
ungeprüft in den Bestand. Werte, die mehr als das
Sechsfache der Sollgrenze erreichen, werden markiert — aber als „ungewöhnlich, bitte prüfen", nicht als Fehler.
Eine frühere, strengere Schwelle hat einen echten Messwert als unplausibel
gemeldet.

---

## 8 · Was bekannt kaputt oder schwach ist

`BEFUNDE-STATISTIK.md` enthält eine vollständige statistische Prüfung:
19 Befunde, **keiner davon behoben**, weil dafür Entscheidungen des Nutzers
nötig sind. Die wichtigsten:

- **Kompositionelle Daten (A).** Blattsaftwerte sind Konzentrationen. Eine
  Verschiebung des Wassergehalts verschiebt *alle* Werte gemeinsam. Absolute
  Bewertungen sind dagegen nicht robust; Verhältnisbefunde sind es.
- **Die Kennzahl (B).** Gleichgewichtung aller Nährstoffe widerspricht dem
  Minimumgesetz. Der limitierende Nährstoff gehört nach vorn, nicht der Anteil.
- **Der Nenner schwankt (N).** Zwei Balken mit „50 %" können 5 von 10 oder
  4 von 8 bedeuten.
- **Keine Schätzung der Streuung.** Das ist die wichtigste Lücke im ganzen
  Projekt: ohne `s` lässt sich nie sagen, ob eine Veränderung echt ist. Ein
  **einziger** Versuch löst das — bei der nächsten Beprobung drei Proben statt
  einer: eine homogenisierte in drei Teile (analytische Streuung) plus zwei
  getrennte Sammelproben (Probenahme-Streuung). Kosten: zwei zusätzliche
  Analysen, einmalig. Ohne diesen Versuch bleibt die Wirkungsanalyse (jetzt
  ein Dialog am Logbucheintrag) dauerhaft qualitativ.
- **Rückwirkende Neubewertung (M).** Ändert der Nutzer eine Schwelle, ändern
  sich auch alte Befunde, ohne Vermerk.

**Fünf Entscheidungen liegen dem Nutzer vor** (`BEFUNDE-STATISTIK.md` §5) und
sind **noch nicht beantwortet**: was die Kennzahl sein soll · absolut oder
normiert · rückwirkend neu rechnen oder festschreiben · **wie weit der Umbau
der Datenstruktur gehen soll** · wie viele Replikate Standard werden. Frag
danach, bevor du Grosses am Datenmodell änderst.

---

## 9 · Leitplanken — daran nicht rütteln

Diese Punkte stammen vom Nutzer, nicht aus einer Stilvorliebe. Sie gelten
weiter, auch wenn du eine bessere Lösung siehst — dann sag es, bevor du es tust.

1. **Eine einzige HTML-Datei bleibt das Lieferformat.** Kein Build, kein
   Bundler, keine Modulaufteilung.
2. **Kein localStorage, kein Ordnerzugriff, kein Automatismus beim Speichern.**
   Der bewusste Speicherschritt ist gewünscht. Seit September sichert die
   Anwendung sich selbst als HTML mit den Daten darin (Abschnitt 4) — das
   ändert nichts an dieser Leitplanke: gespeichert wird weiterhin nur auf
   Knopfdruck, und es entsteht weiterhin jedes Mal eine neue Datei.
3. **Firefox muss funktionieren.** Verwende nichts, was Firefox nicht seit
   Jahren unterstützt.
4. **Sprache: Deutsch, Schweizer Rechtschreibung (ss statt ß).** Keine
   englischen Bezeichner in der Oberfläche. *Einzige Ausnahme, im Code
   kommentiert:* zwei Reguläre Ausdrücke müssen „Gießwasser" mit ß im
   Laborbericht treffen.
5. **Keine erfundene Sicherheit.** Bestehende Vorbehaltshinweise nicht
   wegoptimieren. Jede gesetzte Annahme trägt sichtbar das Etikett „Annahme"
   und eine Herkunftsangabe.
6. **Regeln legen ihre Schwelle offen** (Feld `regel:`) und sind einstellbar.
7. **Ausdrücklich zurückgestellt, nicht ungefragt bauen:** die
   Dünger-Dosierungsrechnung (auch nicht der Säurebedarf gegen
   Hydrogencarbonat), die Nützlingserfassung, altersabhängige
   Optimum-Bereiche, jede behauptete Kausalität zwischen Nährstofflage und
   Schädlingsbefall, Bildanalyse und automatische Symptomerkennung. Der
   Giesswasser-Parser war ebenfalls zurückgestellt und ist inzwischen **auf
   ausdrücklichen Wunsch gebaut**. Die Soll-Ist-Bilanz beschreibt, was war —
   sie empfiehlt nichts.
8. **Frag nach, bevor du das Datenmodell umbaust.** Ein Schemawechsel braucht
   einen Migrationspfad und einen Hinweis an den Nutzer, was sich geändert hat.

---

## 10 · Prüfen

Es gibt kein Testframework, absichtlich. Stattdessen eigenständige Skripte in
`pruefung/`. Ablauf:

```bash
# 1 · Skript aus der HTML-Datei ziehen (pruefung/app.js ist gitignoriert)
python3 -c "
import io,re
h=io.open('basilikum.html',encoding='utf-8').read()
io.open('pruefung/app.js','w',encoding='utf-8').write(re.findall(r'<script>(.*?)</script>',h,re.S)[-1])"
node --check pruefung/app.js

# 2 · Fachliche Regressionsprüfungen (430 Einzelprüfungen, ohne Browser)
for f in n1 n2 n3 n4 n5 g1 f1 l1 x1 b1 v1 d1; do node pruefung/$f.js; done

# 3 · Im echten Browser
CHROME=/pfad/zu/chromium NODE_PATH=… PDFJS=…/pdfjs-dist/build \
  BILDER=…/bilder TAB=…/tab \
  node pruefung/browser.js          # elf Reiter, Dialoge, Diagramme, Escaping,
                                    # Fotos, CSV-Import, Logbuch, Planer
PDF=…/probe.pdf  node pruefung/upload.js     # echtes Blattsaft-PDF
GW=…/gw          node pruefung/gwupload.js   # drei echte Wasserberichte
BILDER=…/bilder  node pruefung/rundreise.js  # sichern, Datei öffnen, weiterarbeiten
```

| Datei | Zweck |
|---|---|
| `harness.js` | DOM-Ersatz für node; schneidet den Selbstaufruf ab, gibt die App-Funktionen zurück |
| `n1`–`n5` | Regressionsprüfungen zu den 23 Befunden des ersten Audits |
| `g1` | Wasserparser gegen die drei echten Berichte |
| `f1` | Fotos: Migration, Fotospur, Escaping, Grössenwarnung |
| `l1` | Logbuch: Umstellung auf strukturierte Mengen, Umbenennungen |
| `x1` | Tabellenimport: Datumsformate, doppelte Zeilen, Bemerkungen |
| `b1` | Soll-Ist-Bilanz: Umrechnung, Zeitfenster, Verweigerung bei Lücken, Verdünnung |
| `v1` | Reiter Verlauf: Schema 7, gemeinsame Zeitachse, getrennte Achsen, freie Auswahl, Farbkopplung, Rangliste, Eingangsbilanz, Jung gegen Alt |
| `d1` | Selbstsicherung: Einsetzen und Herauslesen des Datenblocks, Skript-Ende im Text, zweimal sichern |
| `s1`–`s4` | Belege zum Statistikbericht, ohne Bestanden/Durchgefallen |
| `browser.js` | Chromium: alle Reiter, Diagrammbedienung, Ziehen/Zoomen im Verlauf, Offline-Verhalten, Escaping |
| `upload.js`, `gwupload.js` | echte PDFs, ganzer Weg von der Datei zur Auswertung |
| `rundreise.js` | Chromium: erfassen → als HTML sichern → die gesicherte Datei frisch öffnen → weiterarbeiten |

**Wichtig:** `pruefung/app.js` wird aus `basilikum.html` erzeugt und ist
gitignoriert. Wer die HTML-Datei ändert und die Prüfungen laufen lässt, ohne
neu zu extrahieren, prüft die alte Fassung. Das ist mir schon passiert.

**Nicht automatisch geprüft:** Firefox — in der Entwicklungsumgebung steht nur
Chromium zur Verfügung.

---

## 11 · Die übrigen Dokumente

| Datei | Inhalt |
|---|---|
| `UEBERGABE.md` | die ursprüngliche Übergabe, historisch |
| `BEFUNDE.md` | erstes Audit, 23 Befunde, alle gegen das echte PDF geprüft |
| `BEFUNDE-STATISTIK.md` | statistische Prüfung des Datenmodells, 19 Befunde, 5 offene Entscheidungen — **das wichtigste Dokument für die Weiterarbeit** |
| `UMBAU.md` | was der Neubau geändert hat, inklusive der Nachträge zu Giesswasser und Diagrammen |
| `AUFTRAG-ERWEITERUNG.md` | der Auftrag für Fotos, Logbuch, Excel-Import, Bilanz und Planer — umgesetzt |
| `PROMPT-DATENMODELL.md` | Auftrag für die statistische Prüfung |
| `ENTWURF-KREISLAUF.md` | Entwurf zum Problembriefing: was am Briefing falsch ist, das Datenmodell Schema 7, welche Reiter wegfallen — **vier Fragen darin sind offen** |
| `pruefung/LIESMICH.md` | wie die Prüfungen aufgebaut sind |

---

## 12 · Wenn du hier weiterarbeitest

**Reihenfolge:** diese Datei → Abschnitt 9 noch einmal → `BEFUNDE-STATISTIK.md`
§3 und §5 → dann `basilikum.html`, am besten Abschnitt für Abschnitt.

**Arbeitsweise, die sich bewährt hat:** erst berichten, dann ändern. Der Nutzer
will wissen, was gefunden wurde, bevor etwas umgebaut wird — besonders bei
allem, was die Fachlogik oder das Datenmodell berührt.

**Was du nicht aus dem Code lernst und deshalb hier steht:** dass die
Asymmetrie zwischen Mangel und Überschuss Absicht ist. Dass Na und Cl aus der
Kennzahl genommen wurden, weil sonst Unsinn empfohlen wird. Dass die
Vorbehaltshinweise fachlich notwendig sind und nicht wegoptimiert werden
dürfen. Dass die App bewusst nichts dosiert. Und dass der Chef mitliest — jede
Zahl muss sich in einem Satz erklären lassen.

Aus der Erweiterung dazugekommen: dass `jeReservoir` in der Anzeige nie
verdoppelt wird, aber in der Bilanz schon — und dass beides ausgesprochen wird.
Dass die Bilanz bei Logbuchlücken die Zahlen verdeckt, statt sie zu zeigen.
Dass die drei Zuordnungsregeln in `bemerkungLesen` je einen echten Fehler
behoben haben. Und dass die Fotos in der JSON-Datei liegen, weil Leitplanke 2
keinen anderen Ort erlaubt — nicht, weil es die beste Lösung wäre.
