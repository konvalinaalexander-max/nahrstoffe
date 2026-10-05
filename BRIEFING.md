# Briefing: Basilikum-Nährstofftool

**Für eine KI, die neu auf dieses Projekt kommt.** Lies diese Datei ganz,
bevor du `basilikum.html` öffnest, und ändere nichts, bevor du Abschnitt 8
gelesen hast. Sie ersetzt kein Codelesen, aber sie erspart dir, die Absichten
hinter dem Code zu erraten.

Stand: 5. Oktober 2026 · Schema 11 · die **schlanke Fassung**: rund 250 KB,
3700 Zeilen, fünf Reiter – plus `erfassen.html` (Eingabemaske fürs Handy,
online unter `/maske`) und `server.js` (online, ohne Passwort). Hosting:
`ONLINE.md`, Konzept: `KONZEPT-ONLINE.md` (Entscheid 16).

> **Die volle Fassung** mit Regelwerk, Befunden, Kennzahl «im Optimum»,
> Planer, Rundgang, Fotos, Logbuch und Soll-Ist-Bilanz liegt im Git-Verlauf:
> Commit `7274630` (dort auch das ausführliche Briefing). Am 5. Oktober hat
> der Betrieb entschieden: **«es soll mir keine Tipps und Analysen bieten –
> sondern einfach angenehm visualisieren.»** Das ist jetzt die Leitplanke.

---

## 1 · Was das ist

`basilikum.html` ist eine einzige, eigenständige HTML-Datei. Sie liest die
Laborberichte von NovaCropControl (Blattsaft und Giesswasser) aus PDF ein und
stellt sie dar – zusammen mit den Messungen am Tank (pH, EC, Sauerstoff) und
dem Kulturmanagement (was wann in den Tank kam, was sonst geändert wurde).
**Sie bewertet nicht, sie empfiehlt nichts.** Sie zeigt die Werte und das
Optimum, das im Laborbericht steht.

Zwei Betriebsarten, dieselbe Datei: vom Ordner geöffnet (Datei-Modus, mit
«Sichern» als eine HTML-Datei samt Daten) oder vom Server (`server.js`,
laufend gesichert, mit Handy-Maske). Externe Abhängigkeiten: pdf.js und
SheetJS vom CDN – fallen sie aus, geht alles ausser dem Einlesen von PDF
bzw. Excel (CSV liest die App ohne Bibliothek).

## 2 · Wer das benutzt

Imhof Bio, Schwerzenbach (Demeter), Topfbasilikum auf Ebbe-und-Flut-Tischen,
zwei Reservoirs (vorne, hinten) in einem gemeinsamen Kreislauf. Im Büro der
Agronom und sein Chef am PC; hinten am Tank die Mitarbeitenden mit dem Handy
(`/maske`, per QR-Code). Sätze heissen z. B. `28-478` (Aussaat-KW, Charge).

## 3 · Die fünf Reiter

| Reiter | Was er zeigt |
|---|---|
| **Analysen** | Oben PDFs hochladen (Ablegen oder «Dateien wählen»), darunter alle Berichte, neueste zuerst, filterbar nach Art. Jung- und Altblatt eines Berichts sind **eine** Zeile. Klick → der Bericht im Pop-up: jeder Wert mit dem Optimum des Labors als Band, gruppiert wie das Laborblatt, Wasser mit Einheit des Labors und daneben mg/l, der Wortlaut des PDFs aufklappbar. «Werte bearbeiten», «Entfernen». **Keine Befunde, keine Bewertungsfarben.** |
| **Blattsaft & Giesswasser** | Oben: Blattsaft-Werte anklicken → Blatt (beide/jung/alt), Linien, Anzeige (Messwert / Lage im Optimum) → Giesswasser-Werte anklicken. Darunter **zwei Fenster** auf einer Zeitachse (Blattsaft, Giesswasser), darunter die Balken des **Kulturmanagements**, darunter «＋ Massnahme eintragen» und «Balken ein- und ausblenden». Zeigen → Kästchen, Klick → Bericht. |
| **pH & EC am Tank** | Die Messungen am Tank (Excel, Handy, Datenpaket) – nicht die Laborwerte: Spuren pH, EC (Ring: frisch angesetzt), Sauerstoff; Stelle, Zeitraum, Linien; dieselben Balken; darunter die Liste aller Messungen mit Herkunft; «Excel oder CSV einlesen». |
| **Einträge Maske** | Alles, was über die Handy-Seite kam (Messungen und Beigaben), als Liste mit Name, Uhrzeit, Werten. Visualisierung folgt später. |
| **Einstellungen** | Maske/QR-Code (online), Entnahmestellen zuordnen, vorbereitete Daten (Datenpaket), Daten (sichern, öffnen, Kopie, JSON). |

Weggefallen gegenüber der vollen Fassung: Überblick, Verlauf mit den fünf
Fragen, Nährstoffe, Substrat, Giesswasser-Karten mit Richtwerten,
Soll-Ist-Bilanz, Logbuch, Fotos, Rundgang, Planer, Sätze, eigene Optima,
Schwellen, Kernnährstoffe, «Wesentlich». **Ihre Daten bleiben im Bestand**
(`migriere` behält jedes Feld) – diese Fassung zeigt sie nur nicht.

## 4 · Daten und Parser

| Quelle | Was | Einheiten |
|---|---|---|
| Blattsaft (NovaCropControl) | 23 Parameter, meist je eine Jung- und Altblattprobe, mit Optimum je Parameter | ppm; Zucker %, EC mS/cm, pH und K/Ca ohne |
| Giesswasser (NovaCropControl) | 21 Parameter, Einzel- oder Sammelbericht mit Historie | **Makro mmol/l, Mikro µmol/l** – nicht mg/l |
| Tank (Excel/CSV, Handy, Datenpaket) | pH, EC, EC frisch, O₂, Temperatur je Stelle, mit Uhrzeit; Bemerkungen → Gaben und Ereignisse | |
| Substrat (Labor Ins) | wird weiterhin gelesen und gelistet, sonst nicht dargestellt | |

Was im Parser teuer gelernt ist und bleiben muss:

- **Der Wasserbericht ist eine gedrehte Tabelle** – `parseGiess` arbeitet mit
  Koordinaten (`pdfPunkte`): y = Parameter, x = Spalte. Sammelberichte werden
  in einzelne Proben zerlegt, über die Probennummer entdoppelt.
- **Nachweisgrenzen** (`<0,05`) sind `{wert, unter:true}` – angezeigt mit «<»,
  nie als Punkt gezeichnet. **`<0,50 - <0,50`** ist eine Nachweisgrenze, keine
  Spanne.
- **Spaltenmarker ¹ ²** stehen im NCC-PDF auf eigenen Zeilen; `putz()` leert
  nur Zeilen, die ausschliesslich aus einem Marker bestehen.
- **Der Kontrolldialog** vor der Übernahme: nichts wandert ungeprüft in den
  Bestand. Unter jedem Feld das Optimum des Labors; ein Wert über dem
  Sechsfachen der oberen Grenze wird rot umrandet («ungewöhnlich – bitte
  prüfen», fängt verrutschte Kommas, nicht echte Extremwerte).
- **Tabellenimport** (`tabBlatt`, `bemerkungLesen`): Spalten über die
  Kopfzeile, Kürzel des Betriebs (ET/EPT, KS, Zn, HA, PS, ZS, H2SO4, RV/RH,
  MKBoden = EM), Liter ab 500 sind Wasser, «Wasser ohne Dünger» ist keine
  Gabe, pH ausserhalb 3–10 rot markiert, «Tanks neu gefüllt» ist ein
  Neuansatz. Geprüft Zeile für Zeile an `pruefung/fixtures/*.tsv`.

## 5 · Das Datenmodell (Schema 11)

```js
{schema:11, version, gespeichert,
 analysen:[],      // je Probe: typ, datum, satz, blattalter, zustand, stelle,
                   // laborId, kultur, werte{k:{wert,unter}}, optima{k:[lo,hi]}, quelle{datei,text}
 ereignisse:[],    // Gaben und Ereignisse: typ, datum, zeit, mittel, menge, einheit,
                   // jeReservoir, stelle, felder{}, notiz, wer, quelle ('hand'|'excel'|'paket'|'erfassen')
 messungen:[],     // am Tank: datum, zeit, stelle, ph, ec, ecFrisch, o2, o2sat, temp, wer, notiz, quelle
 beigabeZeiten:[], // Zeiträume von Hand: {id, mittel|name, von, bis|null, notiz, gesetzt}
 produkte:{},      // die Mittel: name, form, einheit (die Maske bietet sie an)
 stellen:{gruppen:[{id,name}], zu:{<Bezeichnung>:<id|null>}},
 pakete:{},        // welches Datenpaket aktiv/abgelehnt ist
 einst:{}}         // frühere Einstellungen bleiben hier unangetastet
```

- **Bericht** = die Proben eines Blattsaftberichts: `berichtSchluessel` =
  Satz | Datum | Kulturbild. Wasser: jede Probe ihr eigener Bericht.
- **Optimum** = `optimum(a,k)`, genau das des Labors. Eigene Optima früherer
  Fassungen wirken nicht mehr. `lage(v,o)` (0–3) nur für die Anzeige «Lage im
  Optimum», damit verschiedene Nährstoffe in ein Fenster passen.
- **Uhrzeit** «HH:MM» oder `null` – nie geraten. `zeitpunkt()` legt sie auf
  die Zeitachse; mehrere Messungen ohne Uhrzeit am selben Tag verteilt
  `messLage()` zwischen 6 und 20 Uhr und das Kästchen sagt es.
- **Entnahmestellen**: das Labor schreibt jede Stelle anders. Zugeordnet wird
  von Hand (Einstellungen → Stellen zuordnen); `stellenVorschlag` schlägt nur
  vor. `zu[bez]` = id (gehört dazu), `null` (ausdrücklich keine – keine Reihe,
  bleibt im Bestand), fehlt (offen – eigene Reihe). `null` muss die Sicherung
  überleben.
- **Datenpaket** `PAKET_RES26` (Abschnitt 12b): Reservoir-Tabelle April–
  September und Säurebericht, von Hand gelesen, mit den Entscheiden des
  Betriebs (A = Halades, MKBoden = EM, pH 1,36 und die Zeile ohne Datum weg).
  Fassung 2: 149 Messungen, 82 Gaben und Ereignisse, 3 laufende Zeiträume.
  Feste Kennungen – **nie ändern**, sonst steht nach zweimal Aktivieren alles
  doppelt. `z1.js` hält jeden Entscheid fest.
- **Migration**: `migriere()` hebt alte Dateien, behält jedes unbekannte Feld
  und meldet nur, was Werte verändert (Nachweisgrenzen, Substratnamen,
  Wassereinheiten, Mengen aus Freitext).

## 6 · Kulturmanagement (Abschnitt 9)

Die Balken unter beiden Diagramm-Reitern, in drei Arten von Zeilen
(`kmListe`, `kmBalken`):

1. **Je Mittel** (Biovin, Magnesium, Kalisulfat, Zink, Säuren, Halades, EM …):
   aus den Gaben, von der ersten bis zur letzten, eine Lücke über 28 Tage
   trennt; «läuft» (Spitze, bis heute), solange die letzte Gabe keine 28 Tage
   her ist **und** seither kein «Tank neu angesetzt» kam. Ein **Zeitraum von
   Hand** (`beigabeZeiten` mit `mittel`, Klick auf den Balken) nimmt die Gaben
   in sich auf, die in ihn fallen; Gaben ausserhalb bilden ihre eigenen
   Balken – keine Gabe verschwindet. «Wieder automatisch» löscht ihn.
2. **Eigene Massnahmen** (`beigabeZeiten` mit `name`): Schattierung, neues
   Substrat, Klima … – nur von Hand, über «＋ Massnahme eintragen».
3. **Ereignisse ohne Mittel** (Tank neu angesetzt, Umpumpen, Kalibrierung,
   Wasserzugabe, Notiz …): Marken, eine Zeile je Art, links benannt; mehrere
   am selben Tag eine Marke mit Zahl. Klick → die Einträge, einzeln
   entfernbar.

«＋ Massnahme eintragen»: Was (neue Massnahme · eigene · Mittel · Ereignis an
einem Tag), Beginn, Dauer (läuft noch · bis · nur dieser Tag), Notiz. Ein
Mittel, dessen Zeitraum schon in einem Balken liegt, bleibt unverändert
(mit Hinweis); sonst entsteht ein Zeitraum von Hand, vereinigt mit den
Balken desselben Mittels, die er berührt (`mittelZeitraumDazu`).
«Balken ein- und ausblenden» ist persönlich (`kmAus`, localStorage).

Das frühere Logbuch ist darin aufgegangen; seine Einträge sind dieselben
`ereignisse`.

## 7 · Aufbau des Codes

Eine Datei: `<style>`, Gerüst, ein `<script>`, durchnummeriert:

| | Abschnitt | Inhalt |
|---|---|---|
| 1 | Werkzeug | `esc`, `nz`, `fmt`, `toNum`, Uhrzeit (`zeitNorm`, `zeitpunkt`, `chrono`, `messLage`), `AKTION` |
| 2 | Fachwissen | `NAME`, `EINH`, `einheit`, `inMgL`, `EVTYPEN` |
| 3 | Parser | `parseNCC`, `parseIns`, `parseGiess`, `parseAuto`, `pdfSeiten`, `pdfPunkte` |
| 4 | Datenmodell | `PRODUKTE_VORGABE`, `leer`, `migriere`, `optimum`, `optText`, `lage` |
| 5 | Diagramme | Kästchen, `marke`, `chartStapel`, Zeitachse, Zoom, `spannenZeilen`, `spannenSvg`, `tippBau` |
| 6 | Gerüst | Verdrahtung `data-tun`/`data-aend`, `TABS`, `render`, `diagFrisch`, `dialog`, `toast` |
| 7 | Analysen | Liste, `berichte`, `detail`, `wertMitOptimum`, `einlesen`, `pruefdialog` |
| 8 | Blattsaft & Giesswasser | `vKombi`, `farbenFuer`, `spurGruppen`, Entnahmestellen (`stelleVon`, `stellenDialog` …) |
| 9 | Kulturmanagement | Balken, Marken, Dialoge, «＋ Massnahme», ein-/ausblenden |
| 10 | pH & EC am Tank | `vTank`, `messStelle`; 10b Tabellenimport |
| 11 | Einträge Maske | `vMaske` |
| 12 | Einstellungen | `vEinst`; 12b Vorbereitete Daten (`PAKET_RES26`) |
| 13 | Sichern und Laden | Selbstabbild, `seiteMitDaten`, `datenAusText`, `laden` |
| 14 | Persönliche Ansicht | `ansichtMerken`/`ansichtLaden` |
| 15 | QR-Code | `qrLaden` (cdnjs mit Prüfsumme), `qrSvg`, Drucken |
| 16 | Online | `onlineStart`, `sichernOnline`, `vereinigen`, `onlineAbfragen` |
| 17 | Verdrahtung | Dateien, Ablegen, Fenstergrösse, Start |

Muster, die durchgehalten werden müssen:

1. **Kein `onclick` im Markup.** Klickziele über `data-tun="name"` →
   `AKTION.name(dataset, ev, el)`, Änderungen über `data-aend`.
2. **Diagramme zeichnen sich selbst neu, nicht die Seite.** Eine Ansicht
   meldet `DIAG={teile:[[id,fn]], zeichnen, klick}`; `diagFrisch()` baut nur
   diese Teile und stellt die Scrollposition wieder her. Alles, was von der
   Auswahl abhängt, wird **innerhalb** von `zeichnen`/`kopf` bestimmt – nicht
   im äusseren Gültigkeitsbereich der Ansicht (dieser Fehler ist früher
   dreimal passiert).
3. **`chartStapel`**: jede Spur eigene y-Achse, eine Zeitachse ganz unten.
   Spuren nach Einheit *und* Grössenordnung (Faktor 25), derselbe Stoff an zwei
   Stellen auf derselben Achse, höchstens drei Spuren je Fenster. Die Achse
   folgt den Messwerten; das Band des Optimums wird beschnitten, nicht
   umgekehrt. Eine Spur mit `kopf` beginnt ein Fenster.
4. **Farbe = Stoff, Form = Blatt (oben) bzw. Stelle (unten).** Nitrat oben und
   Nitrat unten tragen dieselbe Farbe (`farbenFuer` über die entdoppelten
   Schlüssel). Die Zeichen stehen in der Bedienung als Erklärung.
5. **Punkte sind die Messung, eine Linie ist eine Behauptung** – Linien nur
   zuschaltbar, nur innerhalb einer Reihe.
6. **Sofortiges Kästchen** (`data-tipp`) statt `<title>`; Text immer über
   `esc`/`tippBau`.

## 8 · Leitplanken – daran nicht rütteln

1. **Keine Tipps, keine Analysen** (Entscheid vom 5. Oktober): keine Befunde,
   keine Bewertungsfarben, keine Empfehlungen, keine vorformulierten Fragen,
   keine Richtwerte. Gezeigt werden Werte, das Optimum des Labors und was
   im Betrieb geschah. Wer etwas Auswertendes bauen will: erst fragen.
2. **Eine HTML-Datei** für das Dashboard, dazu `erfassen.html` und
   `server.js` – je eine Datei, ohne Build und ohne Abhängigkeiten. Vom Ordner
   geöffnet läuft das Dashboard wie immer.
3. **Bestand nie im Browserspeicher.** localStorage nur für die persönliche
   Ansicht (Dashboard) und Name/Warteschlange (Maske). Im Datei-Modus wird
   bewusst von Hand gesichert; online laufend.
4. **Online ohne Passwort** (Entscheid vom 30. September). Die Maske fragt nur
   den Namen und hat keinen Link ins Dashboard. Passwörter lassen sich über
   Umgebungsvariablen wieder einschalten (`ONLINE.md`).
5. **Firefox muss funktionieren.**
6. **Deutsch, Schweizer Rechtschreibung (ss).** Einzige Ausnahme im Code
   kommentiert: der Laborbericht schreibt «Gießwasser».
7. **Nichts erfinden.** Keine geratene Uhrzeit, keine geschätzte Menge, keine
   Zahl aus einer Nachweisgrenze. Annahmen tragen das Wort «Annahme».
8. **Frag, bevor du das Datenmodell umbaust.** Neue Felder freiwillig, alte
   bleiben erhalten; ein Schemawechsel braucht einen Migrationspfad.

## 9 · Prüfen

Kein Testframework, absichtlich – eigenständige Skripte in `pruefung/`
(Übersicht: `pruefung/LIESMICH.md`).

```bash
# Skript aus der HTML ziehen (pruefung/app.js ist gitignoriert)
python3 -c "
import io,re
h=io.open('basilikum.html',encoding='utf-8').read()
io.open('pruefung/app.js','w',encoding='utf-8').write(re.findall(r'<script>(.*?)</script>',h,re.S)[-1])"
node --check pruefung/app.js

# ohne Browser (590 Einzelprüfungen)
for t in n1 g1 n4 x1 d1 st1 o1 z1 k1 server1; do node pruefung/$t.js; done

# im Browser (Chromium + playwright; NODE_PATH mit pdfjs-dist@3.11.174, jsqr, pngjs)
node pruefung/browser.js   node pruefung/upload.js   node pruefung/gwupload.js
node pruefung/rundreise.js node pruefung/tank.js     node pruefung/online.js
node pruefung/paket.js
```

`upload.js` und `gwupload.js` brauchen keine echten PDFs mehr: `pdfbau.js`
baut die echten Berichte aus den Fixtures nach (Text bzw. jedes Textstück an
seiner Koordinate), und `pdfbau-pruefen.js` belegt, dass pdf.js daraus
dieselben Werte liest wie aus den Originalen.

**Wichtig:** wer `basilikum.html` ändert, extrahiert `app.js` neu – sonst
prüft er die alte Fassung. Firefox wird nicht automatisch geprüft.

## 10 · Die übrigen Dokumente

| Datei | Inhalt |
|---|---|
| `ONLINE.md` | Schritt für Schritt online stellen (Railway, eigener Server) |
| `KONZEPT-ONLINE.md` | Konzept online und die Entscheide 1–16 |
| `pruefung/LIESMICH.md` | die Prüfungen |
| `UEBERGABE.md`, `BEFUNDE.md`, `BEFUNDE-STATISTIK.md`, `UMBAU.md`, `AUFTRAG-ERWEITERUNG.md`, `PROMPT-DATENMODELL.md`, `ENTWURF-KREISLAUF.md` | **historisch** – sie beschreiben die volle Fassung mit Regelwerk und Statistik (Commit `7274630`) |
