# Briefing: Basilikum-Nährstofftool

**Für eine KI, die neu auf dieses Projekt kommt.** Lies diese Datei ganz,
bevor du `basilikum.html` öffnest, und ändere nichts, bevor du Abschnitt 8
gelesen hast. Sie ersetzt kein Codelesen, aber sie erspart dir, die Absichten
hinter dem Code zu erraten.

Stand: 5. Oktober 2026 (abends) · Schema 12 · die **schlanke Fassung**: rund
260 KB, 4000 Zeilen, fünf Reiter – plus `erfassen.html` (Eingabemaske fürs
Handy, online unter `/maske`) und `server.js` (online, ohne Passwort).
Hosting: `ONLINE.md`, Konzept: `KONZEPT-ONLINE.md` (Entscheide 16 und 17).

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
laufend gesichert, mit der Mobile App fürs Handy unter `/maske`). Externe Abhängigkeiten: pdf.js und
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
| **Blattsaft & Giesswasser** (öffnet **immer** zuerst) | **Zwei Grafiken mit je eigener Datumsachse**, gemeinsam gezoomt: Blattsaft (Kopfzeile: Blatt beide/jung/alt, Anzeige Messwert / Lage im Optimum; darunter die Nährstoffe und «Punkte verbinden»), **dazwischen das Kulturmanagement**, dann Giesswasser (Kopfzeile: Zeichen der Stellen, «Stellen zuordnen · n offen»; darunter die Stoffe und «Punkte verbinden»). **Biovin steht hier nicht** (nur Darstellung; die Gaben bleiben, im Tank-Reiter stehen sie). Oben die **Zeitzeile** mit − / + rechts, unten der **Rollbalken**. Zeigen → Kästchen, Klick → Bericht. |
| **pH, EC & O₂** | Die Messungen am Tank (Excel, Handy, Datenpaket) – nicht die Laborwerte: pH, **gleich darunter das Kulturmanagement** (mit Biovin), dann EC (Ring: frisch angesetzt) und Sauerstoff, je mit eigener Datumsachse, gemeinsam gezoomt; die Stelle links in der Zeitzeile; liegen die Messungen zu eng, wird **verdichtet** (Mittel je halben oder ganzen Tag mit Strich, siehe unten); darunter die Liste aller Messungen, **eingeklappt**, mit «Excel oder CSV einlesen». |
| **Einträge Mobile App** | Alles, was über die Handy-Seite (`/maske`) kam (Messungen und Beigaben), als Liste mit Name, Uhrzeit, Werten. Visualisierung folgt später. |
| **Analysen** | Oben PDFs hochladen (Ablegen oder «Dateien wählen»), darunter alle Berichte, neueste zuerst, filterbar nach Art. Jung- und Altblatt eines Berichts sind **eine** Zeile. Klick → der Bericht im Pop-up: jeder Wert mit dem Optimum des Labors als Band, gruppiert wie das Laborblatt, Wasser mit Einheit des Labors und daneben mg/l, der Wortlaut des PDFs aufklappbar. «Werte bearbeiten», «Entfernen». **Keine Befunde, keine Bewertungsfarben.** |
| **Einstellungen** | Mobile App/QR-Code (online), Entnahmestellen zuordnen, vorbereitete Daten (Datenpaket), Daten (sichern, öffnen, Kopie, JSON). |

Oben rechts der Link **«Mobile App ↗»** (online, führt auf `/maske`) und der
QR-Code. Der Hinweis **«Ältere Daten übernommen»** erscheint nur einmal: wer
«Verstanden» klickt (oder ihn schliesst), sieht ihn auf diesem Gerät nicht
wieder (`basilikum.gesehen` im localStorage, Schlüssel aus Schema und
Wortlaut); online geht der umgebaute Bestand ausserdem gleich zurück auf
den Server, sodass der Umbau beim nächsten Öffnen gar nicht mehr nötig ist.

Weggefallen gegenüber der vollen Fassung: Überblick, Verlauf mit den fünf
Fragen, Nährstoffe, Substrat, Giesswasser-Karten mit Richtwerten,
Soll-Ist-Bilanz, Logbuch, Fotos, Rundgang, Planer, Sätze, eigene Optima,
Schwellen, Kernnährstoffe, «Wesentlich». **Ihre Daten bleiben im Bestand**
(`migriere` behält jedes Feld) – diese Fassung zeigt sie nur nicht.

### Grafiken und Zoom (Abschnitt 5, `zeitBild`)

- **Getrennt, aber zusammen:** jede Grafik ein eigenes SVG mit eigener
  y-Achse (runde Teilung 1 / 2 / 2,5 / 5 × 10ⁿ) und **eigener
  Datumsachse**; gemeinsam ist der Ausschnitt (`koVon`/`koBis`, `ZEIT`),
  und ein feiner **Zeiger** steht in allen Grafiken und Kulturmanagement-
  Zeilen am selben Tag, unten an der Achse das Datum (bei kurzen
  Ausschnitten mit Uhrzeit). Jeder Reiter merkt sich seinen Ausschnitt,
  solange die Seite offen ist (`ZEIT_JE_TAB`).
- **Zeitzeile oben:** links (Tank) die Stelle, dann der Zeitraum als Text,
  feste Zeiträume (Tank: alles, 3 Monate, 6 Wochen, 1 Woche; Blattsaft:
  alles, 6 und 3 Monate – nur die, die kürzer als die Daten sind), **ganz
  rechts − und +**. Sie springen über eine Stufenleiter auf runde Zeiträume
  (`STUFEN_TAGE`; Tank bis 6 Stunden, Blattsaft bis 2 Wochen); liegt der
  rechte Rand am Ende der Daten, bleibt er dort.
- **Rollbalken unten**, wie der graue Balken im Browser, nur waagrecht – je
  nach System im Windows-Aussehen (graue Bahn, Pfeile) oder Mac-Aussehen
  (schmaler Daumen); am Handy ein breiter Daumen. Selbst gezeichnet, weil
  Firefox am Mac echte Rollbalken ausblendet. Daumen ziehen (ein Schild
  zeigt den Zeitraum), in die Bahn klicken = eine Seite weiter, Pfeile = ein
  Stück, Pfeiltasten auf der Bahn. Nicht gezoomt ist er blass und voll. Er
  klebt am unteren Bildrand, solange man in den Grafiken ist.
- **Das Mausrad zoomt nicht** – es scrollt die Seite. Gezoomt wird mit
  − / +, **Strg + Rad** (Mac: ⌘ + Rad oder zwei Finger), am Handy mit zwei
  Fingern. Seitwärts wischen oder Umschalt + Rad verschiebt. **In der
  Grafik ziehen verschiebt nur, wenn gezoomt ist** (sonst passiert nichts,
  und ein Klick bleibt ein Klick). Tastatur in den Grafiken: Pfeile
  verschieben, + / − zoomen, 0 zeigt alles, Esc schliesst das Kästchen.
- **Zeigen:** Es gibt keine unsichtbaren Trefferkreise mehr. Jede Grafik
  führt eine nach x sortierte Trefferliste (`ZEIT.treffer`); der nächste
  Punkt in 20 px (Finger 28 px) bekommt einen Ring und das Kästchen. Klick
  öffnet den Bericht bzw. die Messung. Am Handy zeigt das erste Tippen,
  das zweite öffnet.
- **«Punkte verbinden»** steht bei den Nährstoffen jeder Grafik und gilt je
  Grafik (`linienAn`: blatt, wasser, ph, ec, o2) – persönlich gemerkt.
- **Dichte Messungen** (nur Tank, `VERDICHT` = 30 bzw. 14 Bildpunkte je
  Tag, mit etwas Spiel, damit es an der Grenze nicht flackert): ab weniger
  als 30 px je Tag wird je **halben Tag** (00–12, 12–24 Uhr) ein Punkt
  (Mittelwert) mit Strich (tiefster bis höchster Wert), ab weniger als
  14 px je Tag je **ganzen Tag**. Messungen ohne Uhrzeit werden nie einem
  halben Tag zugeschlagen. Ein Fenster mit einer Messung bleibt ein
  gewöhnlicher Punkt. Was ein Punkt gerade ist, steht fest im Kopf der
  pH-Grafik; ein Klick auf einen verdichteten Punkt zeigt die Woche drum
  herum, mit jeder Messung. Bei 1060 px Breite heisst das: bis gut 5 Wochen
  jede Messung, bis gut 2½ Monate halbe Tage.

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
  Kopfzeile, Kürzel des Betriebs (ET/EPT, KS, Zn, HA, ZS, H2SO4, RV/RH,
  MKBoden = EM), Liter ab 500 sind Wasser, «Wasser ohne Dünger» ist keine
  Gabe, pH ausserhalb 3–10 rot markiert, «Tanks neu gefüllt» ist ein
  Neuansatz. Geprüft Zeile für Zeile an `pruefung/fixtures/*.tsv`.

## 5 · Das Datenmodell (Schema 12)

```js
{schema:12, version, gespeichert,
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
  Fassung 2: 149 Messungen, 76 Gaben und Ereignisse, 3 laufende Zeiträume.
  Feste Kennungen – **nie ändern**, sonst steht nach zweimal Aktivieren alles
  doppelt. Was aus dem Paket fällt, gibt seine Nummer nicht weiter
  (`frei(datum,n)`). `z1.js` hält jeden Entscheid fest.
- **Phosphorsäure gibt es nicht** (Entscheid vom 5. Oktober: «als hätte es
  das nie gegeben»): kein Produkt, kein Import-Kürzel, nichts im Paket.
  `bestandBereinigen()` (bei jedem Laden, Schema 12) entfernt jede Gabe und
  jeden Zeitraum dafür und gibt Paketeinträgen den heutigen Wortlaut;
  `vereinigen` holt sie auch aus einem älteren Server-Stand nicht zurück
  (`MITTEL_WEG`).
- **Migration**: `migriere()` hebt alte Dateien, behält jedes unbekannte Feld
  und meldet nur, was Werte verändert (Nachweisgrenzen, Substratnamen,
  Wassereinheiten, Mengen aus Freitext).

## 6 · Kulturmanagement (Abschnitt 9)

Ein Band **zwischen den Grafiken** (Blattsaft & Giesswasser: zwischen
Blattsaft und Giesswasser; Tank: gleich unter dem pH), auf derselben
Zeitachse: Überschrift, gleich darunter «＋ Massnahme eintragen» und
«Zeilen verwalten», dann **eine Zeile je Mittel bzw. Massnahme** – links
der Name, rechts die Balken. Magnesium im Mai und im Juli stehen in
derselben Zeile. Im Balken steht nur das Datum (passt es nicht hinein,
rechts daneben, sonst gar nicht; nie überlappend); feine Kerben zeigen die
einzelnen Gaben. Die Zeilen bleiben stehen, auch wenn im Ausschnitt nichts
läuft (Name dann blass) – beim Verschieben springt nichts. Zeigen auf einen
Balken hellt seinen Zeitraum in den Grafiken auf. Drei Arten von Zeilen
(`kmListe(ansicht)`, `kmBalken(ansicht)`, `kmDaten(ansicht)`, gezeichnet von
`kmTafel`):

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
   Wasserzugabe, Notiz …): **eingeklappt** – eine Zeile «▸ Ereignisse (n)»
   mit einem grauen Punkt je Tag, an dem etwas war. Aufgeklappt eine Zeile
   je Art; mehrere am selben Tag eine Marke mit Zahl. Klick → die Einträge,
   einzeln entfernbar. Wer ein Ereignis einträgt, bekommt sie aufgeklappt.

**Reihenfolge wie in einer Warteschlange:** eine Zeile am Namen (Maus) oder
am Griff ⋮⋮ (Maus und Finger) packen und ziehen; die übrigen weichen aus,
am Rand wird gerollt, Esc bricht ab. Dasselbe im Dialog «Zeilen verwalten»,
dort ausserdem mit der Tastatur (Griff anwählen, Pfeil hoch/runter), «zeigen»
und «löschen». Ein Klick auf einen Namen ohne zu ziehen öffnet den Dialog
mit dieser Zeile hervorgehoben. Geordnet wird innerhalb der Balken bzw. der
Ereignisse (`kmVerschieben`); Biovin, das im Reiter Blattsaft & Giesswasser
fehlt, behält dabei seinen Platz. Während gezogen wird, wartet jedes
Neuzeichnen (`kmZug.nachholen`).

«＋ Massnahme eintragen»: Was (neue Massnahme · eigene · Mittel · Ereignis an
einem Tag), Beginn, Dauer (läuft noch · bis · nur dieser Tag), Notiz. Ein
Mittel, dessen Zeitraum schon in einem Balken liegt, bleibt unverändert
(mit Hinweis); sonst entsteht ein Zeitraum von Hand, vereinigt mit den
Balken desselben Mittels, die er berührt (`mittelZeitraumDazu`).
Reihenfolge (`kmReihe`), Ausblenden (`kmAus`, oben «n ausgeblendet») und
Klappzustand (`kmEreignisseOffen`) sind persönlich (localStorage);
**löschen** nimmt die Einträge selbst weg – alle Gaben eines Mittels samt
Zeiträumen, alle Zeiträume einer Massnahme, alle Einträge eines
Ereignisses –, für alle, mit Rückfrage und Zahl. Biovin fehlt im Reiter
Blattsaft & Giesswasser fest (`KM_NICHT_IM_KOMBI`).

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
| 5 | Diagramme | Kästchen, `marke`, `zeitBild` (`spurSvg`, `kmTafel`, Zeitzeile, Rollbalken, `zeitSetzen`, `zoomStufe`, `zeitBedienung`, `naechsterPunkt`), `verdichtStufe`, `achsenSchritt`, `zeitMarken`, `tippBau` |
| 6 | Gerüst | Verdrahtung `data-tun`/`data-aend`, `TABS`, `render`, `diagFrisch`, `dialog`, `toast` |
| 7 | Analysen | Liste, `berichte`, `detail`, `wertMitOptimum`, `einlesen`, `pruefdialog` |
| 8 | Blattsaft & Giesswasser | `vKombi`, `farbenFuer`, `spurGruppen`, Entnahmestellen (`stelleVon`, `stellenDialog` …) |
| 9 | Kulturmanagement | Balken, Marken, Dialoge, «＋ Massnahme», Zeilen verwalten, Ziehen-und-Ablegen (`kmZug`, `kmVerschieben`), ausblenden, löschen |
| 10 | pH, EC & O₂ | `vTank`, `messStelle`; 10b Tabellenimport |
| 11 | Einträge Mobile App | `vMaske` |
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
3. **`zeitBild`**: Tafeln (`{kopf, neben, rechts, wahl, spuren}`), jede Spur
   ein eigenes SVG mit eigener y- und Datumsachse. Spuren nach Einheit *und*
   Grössenordnung (Faktor 25), derselbe Stoff an zwei Stellen auf derselben
   Achse, höchstens drei Spuren je Tafel. Die Achse folgt den Messwerten; das
   Band des Optimums wird beschnitten, nicht umgekehrt. Zeitzeile und
   Rollbalken werden einmal je Kasten gebaut und danach nur nachgeführt
   (`zeitzeileStellen`, `rollbalkenStellen`) – beim Ziehen dürfen sie nicht
   ersetzt werden, sonst verlieren sie den Zeiger und den Fokus. Während
   einer Bewegung bleiben die y-Achsen stehen (`ruhig`).
4. **Farbe = Stoff, Form = Blatt (oben) bzw. Stelle (unten).** Nitrat oben und
   Nitrat unten tragen dieselbe Farbe (`farbenFuer` über die entdoppelten
   Schlüssel). Die Zeichen stehen in der Bedienung als Erklärung.
5. **Punkte sind die Messung, eine Linie ist eine Behauptung** – Linien nur
   zuschaltbar, nur innerhalb einer Reihe.
6. **Sofortiges Kästchen** (`data-tipp`, in den Grafiken die Trefferliste)
   statt `<title>`; Text immer über `esc`/`tippBau`.

## 8 · Leitplanken – daran nicht rütteln

1. **Keine Tipps, keine Analysen** (Entscheid vom 5. Oktober): keine Befunde,
   keine Bewertungsfarben, keine Empfehlungen, keine vorformulierten Fragen,
   keine Richtwerte. Gezeigt werden Werte, das Optimum des Labors und was
   im Betrieb geschah. Wer etwas Auswertendes bauen will: erst fragen.
2. **Eine HTML-Datei** für das Dashboard, dazu `erfassen.html` und
   `server.js` – je eine Datei, ohne Build und ohne Abhängigkeiten. Vom Ordner
   geöffnet läuft das Dashboard wie immer.
3. **Bestand nie im Browserspeicher.** localStorage nur für die persönliche
   Ansicht (Dashboard) und Name/Warteschlange (Mobile App). Im Datei-Modus wird
   bewusst von Hand gesichert; online laufend.
4. **Online ohne Passwort** (Entscheid vom 30. September). Die Mobile App (`erfassen.html`) fragt nur
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

# ohne Browser (664 Einzelprüfungen)
for t in n1 g1 n4 x1 d1 st1 o1 z1 k1 server1; do node pruefung/$t.js; done

# im Browser (Chromium + playwright; NODE_PATH mit pdfjs-dist@3.11.174, jsqr, pngjs)
node pruefung/browser.js   node pruefung/upload.js   node pruefung/gwupload.js
node pruefung/rundreise.js node pruefung/tank.js     node pruefung/online.js
node pruefung/paket.js     node pruefung/pdfbau-pruefen.js
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
