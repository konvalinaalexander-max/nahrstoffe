# Auftrag: Erweiterung von `basilikum.html`

## Deine Rolle und die Ausgangslage

Du erweiterst ein bestehendes, produktiv genutztes Werkzeug. Lies zuerst
`BRIEFING.md` vollständig, dann `basilikum.html`. Ändere nichts, bevor du
Abschnitt 9 des Briefings (»Leitplanken«) gelesen hast.

Das Werkzeug wertet Laboranalysen eines Demeter-Gartenbaubetriebs aus
(Topfbasilikum, Ebbe-Flut, gemeinsamer Giesswasserkreislauf). Es ist eine
einzelne HTML-Datei, rund 3500 Zeilen, Schema 5.

**Der fachliche Anlass dieser Erweiterung:** Der Betrieb hat ein ungelöstes
Nährstoffproblem. In 28 Blattsaftproben lag Nitrat ausnahmslos weit unter dem
Sollbereich, Kalium in 21 von 24, Zink in 18 von 24. Parallel verschwinden rund
99 % der dosierten Spurenelemente zwischen Dosierung und Rücklaufmessung. Die
Ursachen werden derzeit anhand von Managementänderungen (Säurewechsel,
Belüftung, Düngerwechsel) untersucht. **Das Werkzeug muss deshalb vor allem
eines besser können: Managementänderungen sauber erfassen und ihre Wirkung
sichtbar machen.** Alles Weitere ist nachgeordnet.

---

## Leitplanken — gelten unverändert

Aus Abschnitt 9 des Briefings, hier nur zur Betonung:

1. **Eine einzige HTML-Datei.** Kein Build, kein Bundler, keine Module.
2. **Kein localStorage**, kein Automatismus beim Speichern. Der bewusste
   Speicherschritt bleibt.
3. **Firefox muss laufen.** Nichts verwenden, was Firefox nicht seit Jahren
   kann.
4. **Deutsch, Schweizer Rechtschreibung** (ss statt ß), keine englischen
   Bezeichner in der Oberfläche.
5. **Kein `onclick` im Markup.** Alles über `data-tun` plus `AKTION`.
6. **Diagramme zeichnen sich über `DIAG` selbst neu**, nicht die ganze Seite.
   Alles, was von der Auswahl abhängt, wird *innerhalb* der neu aufgerufenen
   Funktion bestimmt.
7. **Keine erfundene Sicherheit.** Jede Annahme trägt sichtbar das Etikett
   »Annahme« und eine Herkunftsangabe.
8. **Nachweisgrenzen** (`{wert, unter:true}`) werden nie bewertet.
9. **Weiterhin zurückgestellt:** Dünger-Dosierungsrechnung, Säurebedarfsrechnung
   gegen Hydrogencarbonat, altersabhängige Optimum-Bereiche, behauptete
   Kausalität zwischen Nährstofflage und Schädlingsbefall.

Der Schemawechsel auf **Schema 6** ist für diesen Auftrag ausdrücklich
freigegeben. `migriere()` muss alte Dateien anheben und im bestehenden Dialog
melden, was geändert wurde.

---

## A · Fotos (höchste Priorität)

Der Nutzer fotografiert wöchentlich Schadbilder. Diese Fotos sind derzeit
nirgends erfasst, obwohl sie der schnellste Weg sind, eine Managementänderung
mit einer sichtbaren Wirkung zu verbinden.

### Datenmodell

Neues Feld `fotos: []` im `db`-Objekt. Je Eintrag:

```js
{id, datum, titel, notiz, satz|null, blattetage|null,
 analyseId|null,          // optionale Bindung an eine Analyse
 daten}                   // Data-URL, JPEG, verkleinert
```

### Anforderungen

- **Upload über Dateiauswahl und Drag-and-drop**, mehrere Bilder gleichzeitig.
- **Verkleinern vor dem Speichern.** Ein Foto darf gespeichert höchstens rund
  300 KB belegen: längste Kante auf 1400 px begrenzen, als JPEG mit Qualität
  0,72 über ein `<canvas>` neu kodieren. Grund: die JSON-Datei muss handhabbar
  bleiben. Zeige dem Nutzer die aktuelle Gesamtgrösse der Sicherungsdatei und
  warne ab 40 MB.
- **Datum ist Pflicht.** Vorbelegen aus dem EXIF-Aufnahmedatum, wenn lesbar,
  sonst aus dem Dateidatum, sonst heute — und **sichtbar kennzeichnen, woher
  das Datum stammt**. Der Nutzer muss es korrigieren können.
- **Zwei Zuordnungswege**, beide gleichwertig:
  1. frei mit Datum (der Normalfall),
  2. an eine bestehende Analyse gebunden (`analyseId`), etwa das Foto des
     beprobten Blattes.
- Optional Satz und Blattetage, weil Symptome etagenabhängig zu deuten sind.

### Darstellung im Diagramm — der eigentliche Zweck

In **jeder Zeitachsen-Ansicht** (Überblick, Nährstoffe, Giesswasser) erscheint
unterhalb der Messwertfläche eine schmale **Fotospur**: je Foto ein kleines
Kamerasymbol an seiner Datumsposition.

- **Zeiger darüber** → das bestehende `data-tipp`-Kästchen zeigt Datum, Titel
  und ein Vorschaubild.
- **Klick** → Dialog mit dem Bild in voller Grösse, Notiz, und — falls
  vorhanden — Sprungmarken zur zugehörigen Erhebung und zu Logbucheinträgen
  desselben Tages.
- Mehrere Fotos am selben Tag werden zu **einem Symbol mit Anzahl** gebündelt;
  der Dialog blättert dann durch.

Die Fotospur ist über die Legende zuschaltbar und merkt sich ihren Zustand wie
die übrigen Diagrammeinstellungen (Diagrammregel 9).

**Nicht bauen:** keine Bildanalyse, keine automatische Symptomerkennung, keine
Miniaturbilder direkt in der Messwertfläche (sie würden die Punkte verdecken).

---

## B · Excel-Import der pH- und EC-Messungen

Der Betrieb führt seine Tankmessungen in einer Excel-Datei. Diese Daten
gehören in `messungen[]` und — das ist der wertvollere Teil — die
Bemerkungsspalte gehört als Vorschlag ins Logbuch.

### Aufbau der Datei

Ein Blatt **»pH/EC Reservoir«** mit einem Kopfblock (Reservoirmasse,
Dosierziel — beides überspringen) und darunter **zwei nebeneinanderstehenden
Tabellen**:

| Spalten A–F | Spalten G–L |
|---|---|
| Datum · EC vorne · EC hinten · pH vorne · pH hinten · Bemerkung | Datum · Satz · EC 1 Wurzel · EC 2 Wurzel · EC 3 Wurzel · Durchschnitt |

Ein weiteres Blatt **»pH Einstellen«** enthält Titrationsreihen: je Reservoir
Spalten pH · Säurezugabe (ml) · EC · Bemerkungen, am Ende eine Zeile
»Zugabe total«.

### Fallstricke, die der Parser beherrschen muss

- **Uneinheitliche Datumsformate** in derselben Spalte: `30.04.2026`, `10.6.`,
  `17.06`, `2.7`, `9.7.`, `21.07`, `4.8.` Das Jahr fehlt oft. Regel: fehlendes
  Jahr aus dem zuletzt vollständigen Datum übernehmen; springt der Monat
  zurück, Jahr erhöhen. Excel-Seriennummern ebenfalls akzeptieren.
- **Mehrere Zeilen mit demselben Datum** sind gültig und müssen erhalten
  bleiben — Beispiel 21.07.: eine Zeile »Morgens, vor Säurezugabe«, eine
  »Abends, nach Säurezugabe«. Die Bemerkung unterscheidet sie.
- **Leere Messwerte bei vorhandener Bemerkung** kommen vor (Zeilen, die nur
  eine Zugabe dokumentieren). Diese Zeilen erzeugen **keine** Messung, aber
  einen Logbuchvorschlag.
- **Dezimaltrennzeichen** Komma und Punkt gemischt.
- **Zwei Entnahmestellen** (»vorne«, »hinten«) werden zu zwei getrennten
  Messungen je Zeile.

### Bemerkungen zu Logbuchvorschlägen auswerten

Die Bemerkungsspalte enthält den grössten Teil der Betriebsgeschichte. Beispiele
aus den echten Daten:

```
über Wochenende Wasser ohne Dünger zudosiert ca 3000l
nach Säurezugabe (ca. 3l je Reservoir) und Düngerzugabe (3kg Epsotop + 5l Biovin je Reservoir)
danach, am 20.5. 15'000l (je Reservoir ca. 7500l) mit 0,1% Dünger Biovin zudosiert (15l)
im vorderen Reservoir 10l Dünger zudosiert (aus versehen mit 0,2%)
+ 10000l BioV-Wasser + 3kg ET
Dünger leer, neue Lieferung am 15.7. geplant
EC + pH-Gerät neu kalbriert! (war sehr falsch)
Zugabe 1.7l P-Säure --> alles nach hinten gepumpt
Reservoir vorne: 8000l BioV-Wasser + 2.5kg ET + 900ml Halades PE
```

Erkenne mit Regulären Ausdrücken **Menge + Einheit + Mittel** und schlage einen
Logbucheintrag vor. Zu erkennende Mittel samt gängiger Kurzformen:

| Mittel | Schreibweisen im Text | Ereignistyp |
|---|---|---|
| Biovin | `Biovin`, `BioV`, `BioV-Wasser`, `Dünger` | Düngergabe |
| Epsotop | `Epsotop`, `ET` | Düngergabe |
| Phosphorsäure | `P-Säure`, `Phosphorsäure` | pH-Korrektur |
| Zitronensäure | `Zitronensäure`, `Citro` | pH-Korrektur |
| Halades PE | `Halades`, `Halades PE` | Desinfektion |
| Wasser | `l Wasser`, `zudosiert`, `nachgefüllt` | Wasserzugabe |

Weitere Hinweise, die als Ereignis ohne Menge erfasst werden: Gerätekalibrierung,
»Dünger leer«, Umpumpen zwischen Reservoirs, Reservoir leer.

Achte auf **»je Reservoir«** — dann ist die Gesamtmenge das Doppelte. Erkenne
das, aber **rechne es nicht stillschweigend um**: zeige beide Zahlen im
Vorschlag und lass den Nutzer entscheiden.

### Kontrolldialog

Der Import läuft über denselben Kontrolldialog wie die PDFs: **nichts wandert
ungeprüft in den Bestand.** Zeige drei Blöcke — erkannte Messungen, erkannte
Wurzel-EC-Werte, vorgeschlagene Logbucheinträge — jeweils einzeln abwählbar und
im Feld korrigierbar. Nicht zugeordnete Bemerkungen werden als Ereignis vom Typ
»Notiz« mit dem Rohtext vorgeschlagen, damit nichts verloren geht.

### Bibliothek

SheetJS (`xlsx`) von einem CDN, nach demselben Muster wie pdf.js: **fällt das
CDN aus, muss alles andere weiterlaufen** und der Import eine verständliche
Meldung zeigen. CSV-Import als Rückfallweg ohne jede Abhängigkeit.

---

## C · Logbuch überarbeiten

Das Logbuch ist die Grundlage des Reiters »Wirkung« und damit der Leitfrage des
Betriebs. Es muss so bequem sein, dass es tatsächlich gepflegt wird.

- **Schnellerfassung oben**: Datum (vorbelegt heute), Typ, Menge, Einheit,
  Stelle (vorne / hinten / beide), Notiz — in einer Zeile, ein Klick zum
  Speichern. Häufige Kombinationen als Schaltflächen: »Biovin«, »Epsotop«,
  »Säure«, »Wasser nachgefüllt«, »Desinfektion«.
- **Mengenfelder je Typ**, nicht ein Freitextfeld für alles (bei einer
  pH-Korrektur keine Düngerfelder). Einheit fest je Typ, damit später
  gerechnet werden kann.
- **Zeitstrahl statt Liste.** Chronologisch, nach Typ filterbar, Mehrfachauswahl.
- **Wiederkehrendes duplizieren**: ein Klick auf einen bestehenden Eintrag
  erzeugt einen neuen mit heutigem Datum und denselben Werten.
- **Bearbeiten und Löschen** mit Rückfrage; Einträge aus dem Excel-Import
  tragen ein Herkunftsetikett (»aus Excel-Import«) und bleiben als solche
  erkennbar.
- **Fotos und Logbuch verknüpfen**: Ereignisse desselben Tages werden im
  Fotodialog angezeigt und umgekehrt.

---

## D · Planer vereinfachen

Der Reiter wird kaum genutzt — die Beprobung wird ausserhalb geplant. Baue ihn
auf das Nützliche zurück:

- **Eine Liste geplanter Proben** mit Datum, Typ (Blattsaft / Substrat /
  Giesswasser), Satz, Zweck, Status (offen / erledigt).
- **Manuelles Anlegen** als Hauptweg. Die automatischen Vorschläge bleiben,
  aber als zuschaltbarer Bereich unterhalb, nicht als Hauptinhalt.
- **Erledigte Proben** lassen sich mit einer eingelesenen Analyse verknüpfen.
- Kein weiterer Ausbau. Wenn dabei Code entfällt, ist das erwünscht.

---

## E · Neue Auswertung: Soll-Ist-Bilanz des Giesswassers

Das ist die inhaltlich wertvollste Ergänzung und der Grund, warum die
Logbuchdaten strukturiert vorliegen müssen.

Aus den Logbucheinträgen (Düngermenge, Systemvolumen) und hinterlegten
Produktzusammensetzungen lässt sich berechnen, **wieviel von jedem Element im
Giesswasser stehen müsste** — und das dem gemessenen Wert gegenüberstellen.

Ein neuer Bereich im Reiter »Giesswasser«, Tabelle je Element:
**dosiert (berechnet) · gemessen · Anteil in Prozent.**

Produktzusammensetzungen als **editierbare Stammdaten** unter »Sätze &
Einstellungen« hinterlegen, vorbelegt mit den bekannten Werten:

| Produkt | Gehalte |
|---|---|
| Biovin Bio-Kraftdünger 9N | 9 % N, Fe 0,22 %, Mn 0,10 %, Zn 0,19 %, Cu 0,13 %, Dichte 1,25 kg/l |
| Epsotop (Bittersalz) | 9,86 % Mg, 13,0 % S |

**Zwingende Vorbehalte, sichtbar in der Ansicht:**

- Die Rechnung gilt für eine **frisch angesetzte Lösung**. Der Rücklauf enthält
  zusätzlich Pflanzenaufnahme, Verdünnung und Verluste — die Differenz ist
  deshalb **kein reiner Verlust**, sondern eine Summe mehrerer Vorgänge.
- Ohne lückenlose Logbuchführung ist die Rechnung wertlos. Zeige an, welcher
  Anteil des Zeitraums durch Einträge abgedeckt ist, und **verweigere die
  Aussage bei Lücken**, statt eine falsche Zahl zu zeigen.
- Kennzeichne die ganze Auswertung als »Annahme« mit Herkunftsangabe (Leitplanke 5).

**Bewusst nicht bauen:** keine Empfehlung, wieviel zuzugeben wäre. Die
Dosierungsrechnung bleibt zurückgestellt (Leitplanke 7). Diese Auswertung
beschreibt nur, was war.

---

## Schema 6 — Migrationspfad

```js
{schema:6,
 fotos:[],                       // neu
 messungen:[…],                  // erweitert: quelle:'excel'|'hand', bemerkung
 ereignisse:[…],                 // erweitert: quelle, menge, einheit, stelle
 produkte:{},                    // neu: Stammdaten für die Soll-Ist-Bilanz
 …}
```

`migriere()` legt die neuen Felder leer an, lässt bestehende Daten unverändert
und meldet im Dialog: »Fotoablage angelegt«, »Produktstammdaten mit Vorgaben
angelegt«, »Messungen um Herkunftsfeld erweitert«.

---

## Prüfen

Nach dem Muster aus Abschnitt 10 des Briefings. Neue Prüfskripte:

- `pruefung/x1.js` — Excel-Parser: alle Datumsformate, doppelte Datumszeilen,
  leere Messwerte mit Bemerkung, »je Reservoir«, gemischte Dezimaltrennzeichen.
- `pruefung/f1.js` — Fotos: Verkleinerung greift, Grössenwarnung, Migration von
  Schema 5, Escaping von Titel und Notiz.
- `pruefung/b1.js` — Soll-Ist-Bilanz: korrekte Umrechnung, Verweigerung bei
  Lücken.
- `pruefung/browser.js` erweitern: Fotospur ein- und ausschalten, Fotodialog
  öffnen, Excel-Import über den Kontrolldialog.

Die bestehenden 134 Einzelprüfungen müssen weiterhin bestehen.

---

## Reihenfolge und Rückfragen

Baue in dieser Reihenfolge, jeder Schritt für sich lauffähig:
**A (Fotos) → C (Logbuch) → B (Excel) → E (Bilanz) → D (Planer).**

Der Nutzer braucht A und C am dringendsten; B liefert die Daten, die E
überhaupt erst möglich machen.

Wenn eine Anforderung mit einer Leitplanke kollidiert oder du eine bessere
Lösung siehst: **sag es, bevor du es baust.** Das gilt besonders für die
Fotospeicherung — sie vergrössert die Sicherungsdatei erheblich, und
Leitplanke 2 (keine automatische Speicherung, kein localStorage) bleibt
trotzdem bestehen.
