# Übergabe: Basilikum-Blattsaft-Tool

Diese Datei ist die Einstiegsanleitung für die Weiterarbeit in Claude Code.
Die Anwendung ist `basilikum.html` — eine einzelne, eigenständige HTML-Datei
(rund 120 KB, kein Build, keine Abhängigkeiten ausser pdf.js vom CDN).

Lies zuerst diese Datei ganz, dann `basilikum.html`. Fang nicht an zu ändern,
bevor du Abschnitt 8 gelesen hast.

---

## 1 · Wer das benutzt und wofür

Ein Bio-Gartenbaubetrieb in Schwerzenbach (Imhof Bio, Demeter-zertifiziert)
produziert **Topfbasilikum** auf Ebbe-und-Flut-Tischen im Gewächshaus. Kein
Schnittbasilikum: die Pflanzen werden im Topf verkauft.

Zwei Nutzer, beide am PC: der Anwender (Agronom, ETH-Student) und sein Chef.
Der Chef soll die Auswertungen ohne Erklärung verstehen. Die Oberfläche ist
durchgehend deutsch (Schweizer Rechtschreibung: **ss statt ß**).

**Kulturdaten:**
- Kulturzeit rund 6–8 Wochen im Sommer, im Winter deutlich länger (9–11)
- Etwa 8 Sätze laufen gleichzeitig
- Sätze heissen z. B. `19-434`: die erste Zahl ist die **Aussaat-Kalenderwoche**,
  die zweite eine Chargennummer ohne inhaltliche Bedeutung
- Verschiedene Tische, aber **ein gemeinsamer Giesswasserkreislauf**
- Substratwechsel überlappen: alte Sätze laufen im alten Substrat aus,
  während neue schon im neuen stehen

**Was der Betrieb wissen will, in dieser Reihenfolge:**
1. **Was bewirken unsere Managemententscheidungen?** Wir haben die Düngung
   geändert / ein neues Substrat gekauft — was ist danach passiert? Das ist
   die Leitfrage, alles andere ist nachgeordnet.
2. **Nähern wir uns über die Zeit dem Optimum?** Ziel ist, alle Nährstoffe in
   den Sollbereich zu bringen. Aktuell weit davon entfernt.
3. **Was passiert mit einer Pflanze während ihrer Kulturzeit?** Bisher nicht
   messbar, weil kein Satz je zweimal beprobt wurde. Soll sich ändern.

**Demeter-Randbedingung, die das Design prägt:** Spurenelemente lassen sich
nicht einzeln zudosieren. Es werden ganze Dünger oder biologische Präparate
gegeben, die alles gleichzeitig verschieben. Darum ist die Frage nie „hat X
geholfen", sondern immer „was hat X sonst noch bewegt".

---

## 2 · Datenlage — und warum sie das Hauptproblem ist

Es existieren erst **rund 6 Blattsaftanalysen aus einem halben Jahr**. Alle
Sätze waren bei der Probenahme **unterschiedlich alt**. Kein Satz wurde je
zweimal beprobt.

Daraus folgt für jede Auswertung:

- Ein Vergleich zweier Erhebungen vermischt immer drei Effekte: das Management,
  das Kulturalter und die Jahreszeit. Das Tool muss das benennen, nicht
  verstecken.
- Auswertungen, die **vom Kulturalter unabhängig** sind (z. B. Verhältnisse
  innerhalb derselben Probe, oder Häufigkeiten über alle Erhebungen), sind
  derzeit die einzigen belastbaren. Sie sollen bevorzugt werden.
- Der Planer existiert genau deshalb: damit künftig vergleichbare Daten
  entstehen.

**Verhalte dich entsprechend ehrlich.** Wenn eine Auswertung mit dieser
Datenlage nichts aussagt, soll die App das sagen, statt eine Zahl zu zeigen,
die Sicherheit vortäuscht. Der Anwender hat mehrfach betont, dass ihm
agronomische Redlichkeit wichtiger ist als hübsche Grafiken.

---

## 3 · Die Labore und ihre Formate

**Blattsaft: NovaCropControl (Tilburg, NL).** Ein PDF enthält typischerweise
zwei Proben desselben Satzes: Jungblatt und Altblatt, als zwei Zahlenspalten
je Parameter. Kopfzeile `Pflanzenteil: ¹ Blatt (Jung)  ² Blatt (Alt)`.
23 Parameter, jeweils mit **Optimum-Bereich vom Labor**. Es kommt auch vor,
dass Jung und Alt in getrennten Dokumenten geliefert werden — der Parser muss
beides können.

**Substrat: Labor Ins AG (Kerzers).** Eine Seite pro Probe. Das Feld `Parzelle`
enthält den Satz und manchmal einen Zusatz `grün` oder `gelb` (Kulturbild).
Parameter in zwei Gruppen: „Reserven" (AAE10-Extrakt) und „sofort verfügbar"
(H2O-Extrakt), dazu Spurenelemente, Salz, Nmin, pH.

**Giesswasser:** die allererste Analyse existiert seit kurzem. Kein Muster
vorhanden, kein Parser. Manuelle Erfassung ist vorgesehen.

**Dünger:** noch nicht digitalisiert. Bewusst zurückgestellt.

Beide vorhandenen Parser sind gegen die echten PDFs getestet und funktionieren.
Wenn du sie anfasst, teste gegen echte Dateien, nicht gegen Annahmen.

---

## 4 · Architektur

Eine Datei, drei Teile: CSS im `<style>`, alles Übrige in einem einzigen
`<script>` am Ende. Kein Framework, kein Build. Rendering über
Template-Strings und `innerHTML`. Diagramme sind handgeschriebenes SVG.

Das Skript ist in nummerierte Abschnitte gegliedert (`/* ══════ 7 · Gerüst ══════ */`).
Behalte diese Gliederung bei.

**Zustand:** eine globale Variable `db`, Struktur in `leer()`. Persistenz
ausschliesslich über **Download/Upload einer JSON-Datei** — bewusst so, kein
Ordnerzugriff (der Anwender nutzt Firefox), kein localStorage. Der Speicherschritt
ist ausdrücklich gewollt, nicht automatisieren. Jede Sicherung erzeugt eine neue
Datei mit Zeitstempel, damit alte Stände erhalten bleiben.

**Zehn Reiter:** Überblick · Analysen · Nährstoff · Kulturverlauf · Wirkung ·
Planer · Logbuch · Kreislauf · Rundgang · Sätze & Einstellungen.

### Zentrale Funktionen, die du verstehen musst

| Funktion | Zweck |
|---|---|
| `parseNCC` / `parseIns` / `parseAuto` | PDF-Text → Proben |
| `pdfSeiten` | rekonstruiert Zeilen aus pdf.js-Textitems über die y-Koordinate |
| `ausKW(satz, bezug)` | Aussaatdatum aus der KW im Satznamen schätzen |
| `aussaatVon` / `kulturdauer` / `alter` | Kulturalter mit offengelegter Herleitung |
| `optVon(a, k)` | wirksames Optimum: eigener Wert schlägt Laborwert |
| `lage(v, opt)` | **Skala 0–3**: [0,1] unter Optimum, [1,2] im Optimum, [2,3] darüber |
| `index(proben)` | Anteil der Kernnährstoffe im Sollbereich |
| `erhebungen()` | Blattsaftproben zu Erhebungen bündeln (Satz + Datum + Kulturbild) |
| `bilanz()` | je Nährstoff: wie oft im Optimum, über alle Erhebungen |
| `befunde(e)` | Regelwerk → agronomische Befunde |
| `saetzeListe()` / `vorschlaege()` | Planer |

Die `lage`-Skala ist wichtig: sie ist **begrenzt**. Ein Nitratwert bei 2 % der
Untergrenze landet bei 0,02, nicht bei −1,3 wie bei einer naiven linearen
Normierung. Dadurch drückt kein Extremwert die Grafik platt. Falls du daran
etwas änderst, prüfe alle vier Aufrufstellen.

---

## 5 · Konkrete Befunde aus einem ersten Audit

Diese habe ich bereits gefunden. Sie sind nicht abschliessend — such weiter.

### 5.1 Phantomdaten: erfasst, aber nie verwendet

- **`limit`** (Zeilen ~108, ~114): der Parser merkt sich, ob ein Wert eine
  Nachweisgrenze war (`<0,05` bei Molybdän, `<0,50` bei Aluminium). Das Feld
  wird **nirgends** ausgewertet oder angezeigt. Agronomisch ist das relevant:
  ein `<0,05` als 0,05 zu behandeln ist eine Erfindung. Entweder anzeigen und
  von Berechnungen ausnehmen, oder das Feld entfernen.
- **`parzelle`** (Zeile ~149): aus dem Substratbericht gelesen, nie angezeigt.
- **`kultur`** (Zeile ~117): `Lage/Grundstück` bzw. `Anbau` aus dem
  NovaCropControl-PDF, nie angezeigt.
- **`dringend`** (Zeilen ~1059, ~1073, ~1094): im Planer berechnet, nie
  gerendert. Vorschläge werden nicht nach Dringlichkeit hervorgehoben.
- **`rundgaenge[].kultur`** („Kulturbild allgemein"): wird erfasst und in der
  Liste angezeigt, fliesst aber in keine Auswertung.
- **`saetze[].substrat` und `.duenger`**: erfassbar, in der Satztabelle
  sichtbar, aber **nirgends zur Gruppierung oder zum Vergleich verwendet** —
  obwohl der Betrieb ausdrücklich Sätze mit altem gegen neues Substrat
  vergleichen will. Das ist die grösste ungenutzte Chance im Datenmodell.

### 5.2 Substrat- und Giesswasserdaten liegen brach

Substratanalysen werden vollständig eingelesen (pH, Nmin, Salz, Reserven,
sofort verfügbare Nährstoffe, Spurenelemente), aber **nur an einer einzigen
Stelle** verwendet: in der Mangan-Regel als pH-Kontext (Zeile ~385). Alles
Übrige ist tote Datenlast.

Das ist agronomisch die auffälligste Lücke. Beispiel aus den echten Daten:
Substrat-pH 5,2 („stark sauer"), gleichzeitig Mangan im Blattsaft über dem
Optimum — ein Lehrbuchzusammenhang, den das Tool nur zufällig streift.
Ebenso: Nmin im Substrat gegen Nitrat im Blattsaft, K₂O sofort verfügbar
gegen Kalium im Blattsaft. Das sind Angebot-gegen-Aufnahme-Paare und der
direkteste Weg zur Frage „liegt es am Angebot oder an der Aufnahme".

Giesswasseranalysen werden nur als Liste gezeigt, nie ausgewertet.

### 5.3 Vermutete Logikfehler

- **Doppelzählung im Optimum-Index:** `KERN` enthält `NO3` **und** `N_gesamt`.
  Stickstoff zählt damit doppelt, Bor einfach. Zusätzlich sind `Na` und `Cl`
  in `KERN` — das sind Ballastionen, kein Nährstoffziel. Ob sie in eine Kennzahl
  „im Optimum" gehören, ist eine Entscheidung, die begründet werden muss.
  (Der Anwender hat sich für Gleichgewichtung entschieden — aber Gleichgewichtung
  von *sinnvoll ausgewählten* Parametern, nicht von Dubletten.)
- **`erhebungen()` gruppiert nach `satz|datum|zustand`.** Eine Grün- und eine
  Gelb-Probe desselben Satzes am selben Tag werden dadurch zu zwei Erhebungen
  mit identischem Datum. Im Index-Diagramm überlagern sich die Balken. Prüfe,
  ob die Trennung nach Kulturbild an dieser Stelle richtig ist, oder ob
  grün/gelb eine dritte Dimension neben jung/alt sein sollte.
- **`befunde()` wird nur für die jeweils neueste Erhebung je Satz aufgerufen**
  (Zeile ~646). Historische Befunde sind nie sichtbar, obwohl sie berechnet
  werden könnten. Damit fehlt auch die Frage „welcher Befund ist wiederholt
  aufgetreten" — die bei dieser Datenlage wertvoller wäre als ein Einzelbefund.
- **`chartLinien` nimmt `xTyp` entgegen, benutzt es aber nur für die
  Randbreite** bei identischen X-Werten. Der Parameter suggeriert mehr, als er
  tut.
- **`optima` wird zwischen Jung- und Altprobe als dasselbe Objekt geteilt**
  (Zeile ~119). Nach dem Laden aus JSON sind es getrennte Kopien, in der
  laufenden Sitzung nicht. Bearbeitet jemand eine Probe, ändert sich auch die
  andere.
- **Rundgänge haben ein Feld `satz`**, die Auswertung im Reiter Wirkung
  (Zeilen ~999–1000) ignoriert es und mischt Ganzhaus- mit Satzeinträgen.
- **`ausKW` nimmt als Bezug das früheste Analysedatum des Satzes.** Wird
  später eine ältere Analyse desselben Satzes nachgetragen, verschiebt sich
  rückwirkend das abgeleitete Aussaatdatum und damit jede Altersangabe. Prüfe,
  ob das gewollt ist, und ob eine Warnung nötig wäre.
- **`Al`-Optimum wird als `<0,50 - <0,50` gelesen** → `[0.5, 0.5]`, also
  Untergrenze gleich Obergrenze. `lage()` fängt das ab, aber prüfe, ob das
  überall sauber durchläuft.
- Prüfe die Rechenwege bei **fehlenden Werten** durchgängig: `null`, `0` und
  „nicht gemessen" werden an einigen Stellen möglicherweise gleich behandelt.

### 5.4 Was ich bewusst nicht gebaut habe

- Keine Dosierungsrechnung (Dünger-% × Analyse → mg N/l). Der Anwender will
  das später, aber erst wenn die Blattsaftseite steht.
- Keine altersabhängigen Optimum-Bereiche. Nur globale eigene Werte, die die
  Laborwerte überschreiben.
- Kein Zusammenhang zwischen Nährstoffen und Schädlingsbefall in der Übersicht.
  Ausdrücklicher Wunsch: der Rundgang bleibt als Reiter, aber es wird keine
  Kausalität behauptet.

---

## 6 · Der agronomische Auftrag

Das ist der Teil, für den du wirklich nachdenken sollst. Die Fragen unten sind
keine Aufgabenliste zum Abarbeiten, sondern der Denkrahmen.

### Was steckt in einer Blattsaftanalyse überhaupt drin?

Eine Blattsaftanalyse misst die **gelöste, gerade verfügbare** Nährstofffraktion
im Pressaft — nicht den Gesamtgehalt wie eine Trockensubstanzanalyse. Sie
reagiert darum schnell, aber auch empfindlich auf den Wassergehalt der Pflanze:
Tageszeit, Zeit seit der letzten Flutung, Lichtsumme und Zeit seit dem Schnitt
verschieben die Absolutwerte, ohne dass sich die Versorgung geändert hat.

**Konsequenz:** Verhältnisse innerhalb derselben Probe sind robuster als
Absolutwerte. Das Tool nutzt das bereits (jung/alt, K/Mg, K/Ca, NH4/NO3),
aber vermutlich nicht konsequent genug. Denk darüber nach, welche weiteren
Verhältnisse tragfähig wären.

### Die Information, die im Datensatz steckt und noch nicht gehoben ist

1. **Jung gegen alt ist eine Zeitmaschine.** Das Altblatt zeigt die Versorgung
   der Vergangenheit, das Jungblatt die der Gegenwart. Bei phloemmobilen
   Elementen (N, P, K, Mg, Cl, Mo) räumt die Pflanze bei Knappheit das alte
   Blatt aus — ein steigendes Verhältnis jung/alt ist Frühwarnung. Bei
   immobilen (Ca, B, Fe, Si) gibt es keine Umverteilung; ein Defizit im
   Jungblatt bei intaktem Altblatt ist ein **Transportproblem**, kein
   Angebotsproblem, und die richtige Antwort ist Klima und Bewässerung, nicht
   Dünger. Das ist im Regelwerk angelegt — prüfe, ob es agronomisch sauber
   und vollständig ist.
2. **Zucker gegen Nitrat ist ein Wachstumsindikator.** Hoher Zucker bei leerem
   Nitrat heisst: die Pflanze assimiliert, kann die Assimilate aber nicht in
   Wachstum umsetzen. In den echten Daten ist genau das der Fall (Zucker 1,1 %
   gegen ein Optimum von 0,2–0,4 %, Nitrat 42 ppm gegen ein Optimum ab 2010).
   Prüfe diese Interpretation kritisch — auch, ob die Labor-Optima für Zucker
   in einem organischen System überhaupt sinnvoll sind.
3. **Saft-pH und Saft-EC sind Summenparameter**, keine eigenständigen Probleme.
   Ein tiefer Saft-EC bestätigt eine breite Unterversorgung. Sie sollten als
   Bestätigung gelesen werden, nicht als Einzelbefund — im Tool teilweise so
   umgesetzt.
4. **Ammonium gegen Nitrat** zeigt die Stickstoffform. Organische Dünger liefern
   Ammonium schubweise; Ammonium konkurriert mit K, Ca und Mg und versauert die
   Wurzelzone. Bei einem Demeter-Betrieb ist das kein Randthema.
5. **Natrium und Chlorid im Umlaufsystem.** Ebbe und Flut heisst Kreislauf; was
   die Pflanze nicht aufnimmt, reichert sich an. Steigender EC bei gleicher
   Düngung ist Ballast, nicht Nährstoff — und die richtige Reaktion (Tank
   ablassen) ist das Gegenteil der falschen (weniger düngen).
6. **Salzgradient im Topf.** Bei Ebbe-Flut steigt Wasser von unten und
   verdunstet oben; Salze wandern nach oben, die Wurzelspitzen sitzen unten.
   Eine Substratprobe aus 2 cm und eine aus 8 cm Tiefe sind zwei verschiedene
   Welten. Das Tool erfasst die Entnahmetiefe **nicht**. Überleg, ob es das
   sollte.
7. **Mineralisierung ist temperaturabhängig.** Dieselbe organische Grunddüngung
   liefert bei 15 °C und bei 25 °C völlig unterschiedlich viel Stickstoff.
   Ohne Temperaturkontext sind Winter- und Sommeranalysen nur bedingt
   vergleichbar. Es gibt aktuell kein Temperaturfeld.

### Die schwierigste Frage: Was ist mit was vergleichbar?

Der Anwender hat selbst darauf hingewiesen und ringt damit. Der aktuelle Stand
trennt zwei Achsen (Kalenderdatum für Managementwirkung, Kulturwoche für
Pflanzenentwicklung). Prüfe, ob diese Trennung konsequent durchgehalten ist
und ob es Stellen gibt, an denen die App unbemerkt Ungleiches vergleicht.

Denk auch darüber nach, ob es einen dritten, ehrlicheren Vergleichsmodus gibt.
Ein Kandidat: **Änderungen, die nur einen Teil der Sätze betreffen** (etwa ein
neues Substrat) erzeugen im selben Haus, unter demselben Klima, eine echte
Vergleichsgruppe. Das Datenmodell kann das bereits abbilden (`ereignis.geltung
= 'saetze'`), der Reiter Wirkung zeigt es aber nur rudimentär.

### Zu den Optimum-Bereichen

Die NovaCropControl-Werte sind für schnellwachsende Kulturen in mineralischer
Ernährung kalibriert. Ein organisch gedüngtes System erreicht sie fast nie,
weil der Stickstoff über Mineralisierung nachkommt statt gelöst bereitzustehen.
Der Anwender weiss das und zweifelt, hat aber keine Alternative.

Für Basilikum im **Pflanzensaft** gibt es kaum publizierte Referenzwerte; was
existiert, bezieht sich meist auf Trockensubstanz und lässt sich nicht
übertragen. Die Schwellen im Regelwerk (`verlagerung: 1.3`, `kMg: 8`,
`kCa: 3`) sind **gesetzte Annahmen**, keine Literaturwerte. Sie sind in den
Einstellungen editierbar und in der Oberfläche als Annahme gekennzeichnet.
**Behalte diese Kennzeichnung bei.** Wenn du Schwellen änderst oder ergänzt,
kennzeichne sie ebenso und schreib dazu, worauf sie beruhen.

Ein Gedanke für später: Sobald genug eigene Analysen vorliegen, liessen sich
Referenzbereiche aus den eigenen guten Beständen ableiten. Das wäre die
ehrlichere Referenz als jede fremde Tabelle.

---

## 7 · Wie du testen sollst

Es gibt kein Testframework. Bewährt hat sich:

```bash
# Skript aus dem HTML extrahieren
python3 -c "
import re,io
h=io.open('basilikum.html',encoding='utf-8').read()
io.open('app.js','w',encoding='utf-8').write(re.findall(r'<script>(.*?)</script>',h,re.S)[-1])"
node --check app.js
```

Für Logiktests: einen minimalen DOM-Ersatz bauen (`document.getElementById`
gibt ein Objekt mit `innerHTML`, `value`, `classList` usw. zurück), das Skript
per `eval` laden, die Selbstaufruf-Funktion am Ende abschneiden, dann einzelne
Funktionen aufrufen. So habe ich alle zehn Reiter und die Diagramme auf
Laufzeitfehler geprüft. Für Parsertests braucht es echte PDFs — `pdftotext
-layout` erzeugt Text, der sich in Seiten (`\f`) und Zeilen zerlegen lässt
und dem entspricht, was `pdfSeiten` liefert.

**Teste nach jeder grösseren Änderung mindestens:** alle Reiter rendern ohne
Fehler, mit leerer Datenbank und mit gefüllter; Sicherungsdatei schreiben und
wieder laden; Import einer echten PDF-Datei.

---

## 8 · Leitplanken

Bitte halte dich daran, das ist alles bewusst so entschieden:

- **Eine einzige HTML-Datei bleibt das Lieferformat.** Kein Build, kein
  Bundler, keine Modulaufteilung. Der Anwender lädt eine Datei herunter und
  öffnet sie.
- **Kein localStorage, kein Ordnerzugriff, kein Automatismus beim Speichern.**
  Der bewusste Speicherschritt ist gewünscht.
- **Firefox muss funktionieren.**
- **Sprache: Deutsch, Schweizer Rechtschreibung (ss statt ß).** Keine
  englischen Bezeichner in der Oberfläche.
- **Keine erfundene Sicherheit.** Wo eine Aussage mit der aktuellen Datenlage
  nicht tragfähig ist, sagt die App das. Bestehende Vorbehalts-Hinweise nicht
  wegoptimieren.
- **Regeln legen ihre Schwelle offen** (`regel:`-Feld). Beibehalten.
- **Der Fokus liegt auf Blattsaft.** Dünger-Dosierungsrechnung, Giesswasser-
  Parser und Nützlingserfassung sind ausdrücklich zurückgestellt. Bau sie nicht
  ungefragt.
- **Frag nach, bevor du das Datenmodell umbaust.** Es gibt bereits gesicherte
  JSON-Dateien beim Anwender; ein Schemawechsel braucht einen Migrationspfad
  (`db.schema` ist aktuell 3).

---

## 9 · Vorschlag für die Reihenfolge

1. Code vollständig lesen, eigenes Audit machen, Abschnitt 5 verifizieren und
   ergänzen. Erst berichten, dann ändern.
2. Phantomdaten auflösen: jedes erfasste Feld entweder verwenden oder entfernen.
3. Die Substratdaten agronomisch anbinden — Angebot gegen Aufnahme.
4. Das Regelwerk fachlich prüfen: Sind die Regeln richtig? Fehlen welche?
   Widersprechen sich welche? Werden Befunde doppelt gemeldet, die dasselbe
   Phänomen beschreiben?
5. Den Optimum-Index sauber definieren (Dubletten, Ballastionen, Gewichtung).
6. Erst danach neue Funktionen.

Bei allem gilt: erklär, **warum** eine Änderung agronomisch richtig ist, nicht
nur, dass sie den Code aufräumt.
