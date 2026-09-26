# Konzept: die Anwendung geht online

Stand 26. September 2026. Auslöser: Messungen sollen hinten am Tank per Handy
eingetragen werden, Laboranalysen sollen für alle sofort sichtbar sein, und
das Beprobungsschema ändert sich auf zwei Einsendungen pro Monat mit
Satzpaaren. Das Dokument sagt, was gebaut wird, was sich dadurch an den
bisherigen Leitplanken ändert, und was noch zu entscheiden ist.

---

## 1 · Was sich grundsätzlich ändert

Bisher: **eine Datei, ein Mensch, ein bewusster Speicherschritt.** Die Datei
wandert per Mail oder Ordner. Zwei Leute, die gleichzeitig arbeiten, haben
zwei Stände.

Neu: **ein gemeinsamer Bestand auf einem Server, mehrere Menschen, zwei
Rollen.** Was eingetragen ist, sehen alle. Die Datei bleibt als Kopie zum
Mitnehmen – aber sie ist nicht mehr der Ort, wo die Wahrheit liegt.

Das berührt zwei Leitplanken aus `BRIEFING.md` §9, und zwar bewusst:

| Leitplanke | bisher | neu |
|---|---|---|
| 1 · eine HTML-Datei | das ganze Werkzeug | **bleibt für die Admin-Ansicht**; dazu kommen eine zweite kleine Seite fürs Handy und ein kleiner Server. Ohne Server – doppelt geklickt vom Ordner – funktioniert die Admin-Datei weiterhin genau wie heute. |
| 2 · kein Automatismus beim Speichern | Speichern nur auf Knopfdruck | **online wird laufend gespeichert.** Wenn zwei Leute denselben Bestand haben, ist der ungesicherte Stand in einem Browserfenster genau das, was verloren geht. Der Knopf «Sichern» bleibt als *Kopie herunterladen*. |

Alles andere bleibt: kein localStorage als Datenablage, Firefox, Deutsch,
kein `onclick`, keine erfundene Sicherheit, keine Dosierempfehlung.

---

## 2 · Die Teile

```
                     ┌──────────────────────────────┐
   Admin (Büro)  ──▶ │  basilikum.html   (wie heute) │──┐
                     └──────────────────────────────┘  │   PUT /api/bestand
                                                       │   POST /api/messung
                     ┌──────────────────────────────┐  │   POST /api/ereignis
   Arbeiter (Tank) ─▶│  erfassen.html    (Handy)     │──┤
                     └──────────────────────────────┘  │
                                                       ▼
                                   ┌──────────────────────────────┐
                                   │  server.js  (eine Datei,     │
                                   │  ohne Abhängigkeiten)        │
                                   │  · Zugang: zwei Passwörter   │
                                   │  · daten/bestand.json        │
                                   │  · Sicherungen, rotierend    │
                                   └──────────────────────────────┘
```

**`server.js`** — eine Datei, reines Node ohne `npm install`. Liefert die zwei
Seiten aus, hält den Bestand als JSON-Datei, schreibt bei jeder Änderung eine
datierte Sicherungskopie, und kennt zwei Rollen:

| Rolle | Passwort | darf |
|---|---|---|
| `admin` | `ADMIN_PASSWORT` | alles: Bestand lesen und schreiben, beide Seiten |
| `hinten` | `HINTEN_PASSWORT` | Messungen und Beigaben eintragen, den Kontext dafür lesen (Stellen, Produkte, letzte Werte) – **nicht** den ganzen Bestand |

Der Browser fragt das Passwort einmal ab und merkt es sich. Kein
Benutzerkonto je Person – aber jeder Eintrag trägt ein Kürzel, damit man
sieht, wer gemessen hat.

**`erfassen.html`** — die Handy-Seite. Ein Bildschirm, keine Reiter:
Datum, Stelle (vorne/hinten, aus den zugeordneten Stellen), pH, EC, **O₂**,
Temperatur, Kürzel. Darunter «Beigabe»: Produkt antippen (Biovin, Epsotop,
Zitronensäure …), Menge, je Reservoir, Notiz. Abschicken, Bestätigung mit
dem Eintrag und den letzten Werten daneben («gestern pH 6,1»). Bricht das
Netz weg, wartet der Eintrag in einer Warteschlange und geht beim nächsten
Öffnen raus – hinten im Gewächshaus ist der Empfang nicht Sache der App.

**`basilikum.html`** — merkt beim Start selbst, ob ein Server da ist:

- **vom Ordner geöffnet** → alles wie bisher, Datei-Modus.
- **vom Server geladen** → Bestand vom Server, Änderungen gehen nach kurzem
  Warten (1,5 s Ruhe) automatisch hoch, oben rechts steht der Stand:
  *gesichert 14:32* · *wird gesichert…* · *nicht erreichbar – 3 Änderungen
  warten*. Alle 30 s wird nachgesehen, ob jemand anders etwas eingetragen
  hat; wenn ja und hier nichts offen ist, wird stillschweigend aufgefrischt.

---

## 3 · Gleichzeitigkeit – wer gewinnt?

Die Frage, die bei «online» alles entscheidet, und die Antwort ist klein:

- **Messungen und Beigaben werden angehängt, nie ersetzt.** Zwei Leute können
  gleichzeitig eintragen, es kollidiert nichts.
- **Alles andere** (Analysen, Optima, Einstellungen, Sätze, Zuordnungen)
  speichert der Admin als Ganzes, mit der Versionsnummer, die er geladen hat.
  Stimmt sie noch, wird geschrieben. Stimmt sie nicht – jemand anders war
  schneller –, holt die App den neuen Stand, vereinigt die Listen nach
  Kennung und schreibt noch einmal. Das ist in der Praxis unsichtbar.
- **Was dabei verloren gehen kann:** hat A etwas gelöscht, während B
  gleichzeitig denselben Bestand speicherte, kommt das Gelöschte zurück. Die
  App sagt das dann («1 Eintrag wieder da, weil gleichzeitig gespeichert
  wurde»). Selten, und ehrlicher als stilles Überschreiben.

---

## 4 · Neu im Datenmodell (Schema 9)

```js
messungen[]: { …, o2: 7.4, o2sat: 82, wer: 'MK', quelle: 'erfassen' }
ereignisse[]: { …, wer: 'MK', quelle: 'erfassen' }
```

- **`o2`** Sauerstoff in mg/l, **`o2sat`** Sättigung in % (falls das Gerät sie
  liefert; sonst rechnet die App sie aus Temperatur und Tabelle – gekennzeichnet
  als Annahme mit Quelle: Löslichkeitstabelle für Süsswasser auf Meereshöhe).
  Schwerzenbach liegt auf 440 m; das drückt die Sättigungsgrenze um rund 5 %,
  auch das steht dabei.
- **`wer`** Kürzel, **`quelle: 'erfassen'`** für alles von der Handy-Seite.

Migration wie immer: alte Einträge bekommen `null`, nichts wird geraten.

---

## 5 · Das neue Beprobungsschema: Satzpaare

Alle zwei Wochen zwei Proben: **ein Satz in Kulturwoche 2, einer in
Kulturwoche 4.** Zwei Wochen später ist der Woche-2-Satz in Woche 4 und der
nächste kommt in Woche 2 dazu:

```
Einsendung   KW 40        KW 42        KW 44        KW 46
Woche 2      Satz 31      Satz 33      Satz 35      Satz 37
Woche 4      Satz 29      Satz 31      Satz 33      Satz 35
```

Was das hergibt – und was bisher nicht zu haben war:

1. **Je Satz ein Paar Woche 2 → Woche 4.** Die Veränderung *innerhalb*
   eines Bestands, bei gleichem Substrat, gleichem Wasser.
2. **Alle Woche-2-Proben untereinander, alle Woche-4-Proben untereinander.**
   Vergleich über die Saison bei *gleichem Alter* – das nimmt das Alter als
   Störgrösse heraus, genau das, was `BEFUNDE-STATISTIK.md` als grösste
   Schwäche benennt.

**In der Oberfläche:**

- **Reiter Planer → Karte «Satzpaare».** Eine Matrix: Zeilen = Sätze,
  Spalten = Woche 2 und Woche 4. Jede Zelle: Probe da (mit Kennzahl und
  Farbe), geplant, überfällig, oder leer. Ein Klick öffnet die Erhebung.
  Darunter die **nächste Einsendung**: Datum und die beiden Sätze, die dann
  in Woche 2 und 4 stehen – ausgerechnet aus den Aussaatdaten. Ein Knopf
  legt beide als geplante Proben an.
- **Reiter Nährstoffe → Achse «Kulturwoche»** gibt es schon; neu kommt eine
  Ansicht **«Woche 2 gegen Woche 4»**: je Nährstoff ein Paar Punkte pro Satz,
  verbunden – fällt Kalium zwischen Woche 2 und 4 bei *jedem* Satz? Das ist
  eine Linie, die etwas behaupten darf, weil beide Enden derselbe Bestand sind.

Die Zielwochen stehen in den Einstellungen (heute 2, 4, 6). Die Satzpaare
nehmen die ersten beiden. Wer bei 2, 4, 6 bleibt, bekommt trotzdem die
Paar-Ansicht für 2 und 4.

---

## 6 · pH, EC und Sauerstoff: wie das angenehm aussieht

Drei Grössen, drei Skalen, ein Tank. Heute stehen pH und EC auf *einer*
Achse – das ist die Ausnahme, die `BRIEFING.md` selbst als schwach nennt.

Neu, im Reiter Giesswasser, Karte **«Am Tank»**:

- **Drei Spuren übereinander**, gemeinsame Zeitachse – dieselbe
  `chartStapel`, die der Reiter Verlauf schon hat. pH · EC · O₂, jede mit
  eigener Achse, Form = Stelle (vorne/hinten), gemeinsamer Zeiger, Ziehen
  und Zoomen wie gewohnt.
- **Drei Kacheln darüber**: letzter Wert je Grösse, daneben in klein der
  Wert von vor 7 Tagen und ein Pfeil. Kein Ampelurteil – es gibt keinen
  vereinbarten Sollbereich für den Rücklauf-pH, und die App erfindet keinen.
  Was es gibt, steht als Band mit Etikett «Annahme» und Quelle: für O₂ die
  Sättigungsgrenze bei der gemessenen Temperatur.
- **Beigaben als Marken** auf der Zeitachse, wie heute die Logbucheinträge
  im Verlauf – so sieht man, ob der pH nach der Säuregabe fällt und wie
  lange er unten bleibt.
- **Filter**: Stelle (beide/vorne/hinten), Zeitraum, Linien je Reihe.

Für die **Beigaben** im Admin: der Zeitstrahl des Logbuchs bekommt einen
Filter «von der Erfassung» und zeigt das Kürzel. Nichts Neues zu lernen.

---

## 7 · Was ein professionelles UI hier heisst – und was nicht

Was die Oberfläche können soll:

- **Fortschreitende Enthüllung.** Zuerst die drei Kacheln und das Diagramm.
  Tabellen, Rohwerte, Vorbehalte darunter, aufklappbar. Nichts blinkt.
- **Jede Zahl ist anfassbar.** Zeiger drauf → Infokästchen sofort, mit
  Datum, Stelle, Kürzel, Notiz. Klick → der ganze Eintrag. Das gibt es
  schon; es gilt auch für alles Neue.
- **Filter ohne Seitensprung**, wie überall: die Zeichnung erneuert sich,
  die Seite steht.
- **Der Stand ist immer sichtbar.** Oben rechts: gesichert wann, von wem
  zuletzt etwas kam, ob etwas wartet.
- **Fehler sagen, was zu tun ist**, nicht nur, dass etwas schief ging.
- **Auf dem Handy: eine Aufgabe, ein Bildschirm, grosse Ziele.** Zahlenfeld
  mit Dezimaltastatur, das letzte Ergebnis zum Vergleich, Abschicken mit
  Bestätigung, fertig in zwanzig Sekunden.

Was bewusst nicht:

- keine Echtzeit-Push, kein WebSocket – alle 30 s nachsehen genügt bei
  einem Tank.
- keine Benutzerkonten je Person – zwei Rollen und ein Kürzel.
- keine Diagramme auf der Handy-Seite – wer auswerten will, nimmt den
  grossen Bildschirm.

---

## 8 · Hosting – wo das laufen soll

Gebraucht wird wenig: Node läuft, eine Festplatte, HTTPS. Drei Wege,
Reihenfolge nach Aufwand:

1. **Railway** (oder ähnlich: Render, Fly). Repo verbinden, «Volume»
   anlegen, zwei Passwörter als Umgebungsvariablen, Domain kommt mit. Rund
   fünf Dollar im Monat – Stand nachprüfen. *Mein Vorschlag für den Anfang.*
2. **Ein kleiner Server** (Hetzner o. ä., rund vier Euro): mehr Kontrolle,
   dafür SSH und ein Reverse-Proxy für HTTPS. Derselbe `server.js`.
3. **Ein Rechner im Betrieb**, nur im eigenen Netz. Kein HTTPS nötig, kein
   Zugriff von unterwegs.

Die genaue Anleitung steht in `ONLINE.md`, sobald der Server fertig ist.

---

## 9 · Entschieden (26. September, abends)

1. **Laufend speichern, keine Knöpfe.** Online ist es eine Webseite: was
   eingetragen ist, gilt. Sicherung einspielen und Kopie herunterladen
   stehen unter «Sätze & Einstellungen», nicht in der Kopfzeile.
2. **Geteilt gegen persönlich.** Alles, was den Bestand betrifft
   (Zuordnung der Stellen, Einstellungen, Sätze, Produkte, Daten), gilt für
   alle. Was nur die Ansicht betrifft (welche Nährstoffe gezeigt werden,
   welcher Reiter offen ist, Wesentlich oder Alles), merkt sich nur der
   eigene Browser.
3. **O₂-Gerät** misst mg/l, nur im Reservoir vorne. Die Handy-Seite zeigt das
   Feld nur bei «vorne»; die Sättigungsgrenze rechnet die App selbst.
4. **Kürzel** wird jedes Mal verlangt und gilt eine Stunde. Danach fragt die
   Handy-Seite wieder, ausnahmslos – jeder Eintrag trägt einen Namen.
5. **Zielwochen 2 und 4, Kulturdauer 4 Wochen** (Winter 6). Alle zwei
   Wochen ein Satz in Woche 2 und einer in Woche 4; dazwischen wird ein Satz
   ausgelassen. Bestehende Bestände werden beim Laden auf diese Werte
   gehoben und sagen es.
6. **Beigaben in drei Reitern:** Säure (heute nur Schwefelsäure 25 %, Liter
   vorne und hinten getrennt), Düngen (Wasser vorne/hinten, Biovin in
   Litern, Magnesium, Kali, Zink in Gramm), nur Wasser (vorne/hinten).
7. **Für den Chef:** Beigabe-Bänder unter jedem Zeitdiagramm – *seit wann*
   Magnesium, Kali, Zink dazukommen, gekoppelt an die gewählten Nährstoffe,
   mit Kästchen und Klick auf die Liste der Gaben. Dazu der Schalter
   **Wesentlich / Alles** in der Reiterleiste: Wesentlich lässt nur das
   Diagramm mit seiner Nährstoffauswahl stehen.
8. **Transparenz:** jede Analyse zeigt im Detail «der Bericht im Wortlaut» –
   den Text, den die App aus dem PDF gelesen hat. Jede Zahl lässt sich dort
   nachlesen; kein PDF muss aufbewahrt werden.

9. **Balken je Mittel, keine Versuchs-Etiketten** (Nachtrag vom Abend).
   Die Balken erzählen je Mittel: Halades vom 6. bis 19. August und dann
   nicht mehr, Phosphorsäure bis 25. August, Zitronensäure Ende August,
   Schwefelsäure seit 16. September, Magnesium seit Mai, Kali und Zink seit
   26. August. Der Zitronensäure-Versuch vom September wird nicht als
   Versuch ausgewiesen – es sind Messungen und Gaben wie alle anderen. Die
   Mengen stehen im Kästchen, für den Admin; der Chef sieht den Balken.
10. **Die Tabelle April–September** liegt als Fixture im Repository und
    wird beim Import Zeile für Zeile geprüft (siehe `BRIEFING.md`,
    Tabellenimport). Was darin nicht eindeutig ist, bleibt eine Notiz mit
    Nachfrage: «1.4l A» am 18. August, «MKBoden» am 17. September.
