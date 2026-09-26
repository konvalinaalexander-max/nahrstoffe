# Prüfumgebung

Kein Testframework, wie in der Übergabe beschrieben — der dort skizzierte Weg,
als Skripte festgehalten, damit kein Befund unbemerkt zurückfällt.

## Benutzung

```bash
# 1 · Skript aus dem HTML holen und auf Syntax prüfen
python3 -c "
import re,io
h=io.open('basilikum.html',encoding='utf-8').read()
io.open('pruefung/app.js','w',encoding='utf-8').write(re.findall(r'<script>(.*?)</script>',h,re.S)[-1])"
node --check pruefung/app.js

# 2 · Logikprüfungen (kein Netz nötig) – schlagen mit Exitcode 1 fehl
for t in n1 n2 n3 n4 n5 g1 f1 l1 x1 b1 v1 d1 st1 o1 server1; do node pruefung/$t.js; done

# 3 · Statistik-Nachweise (Belege für BEFUNDE-STATISTIK.md, kein Pass/Fail)
for t in s1 s2 s3 s4; do node pruefung/$t.js; done

# 4 · Browsertests (brauchen Chromium und playwright)
npm install playwright
node pruefung/browser.js                     # Datei-Modus, alle Reiter
BILDER=…/bilder node pruefung/rundreise.js   # sichern → Datei öffnen → weiterarbeiten
node pruefung/tank.js                        # Handy-Seite gegen den echten server.js
node pruefung/online.js                      # Admin-Seite vom Server: laufend sichern, Konflikt, Auffrischen

# 5 · Der Upload-Weg mit echten PDFs
npm install pdfjs-dist@3.11.174
PDF=pfad/zur/blattsaft.pdf PDFJS=node_modules/pdfjs-dist/build node pruefung/upload.js
GW=ordner/mit/wasserberichten PDFJS=node_modules/pdfjs-dist/build node pruefung/gwupload.js
```

Jedes Skript endet mit Exitcode 1, sobald eine Prüfung fehlschlägt.

## Was die einzelnen Dateien prüfen

| Datei | Inhalt |
|---|---|
| `harness.js` | DOM-Ersatz: `document.getElementById` liefert ein Objekt mit `innerHTML`, `value`, `classList` …, der Selbstaufruf am Ende wird abgeschnitten, die Funktionen werden zurückgegeben. `setDb(...)` setzt die Datenbank, `nachRenderRun()` löst den Diagrammaufbau aus. |
| `n1.js` | Parser gegen die echte Datei · Aluminium- und Molybdän-Nachweisgrenze · geteiltes `optima` · `putz()` · Jahressprung im Kulturalter · Mischung eigener und Labor-Grenzen |
| `n2.js` | Regelwerk an den echten Werten: keine Natrium-Empfehlung, Kalium sichtbar, Ammonium-Kalium-Regel, Kupfer- und Molybdänlücke, Überschussbefunde, Toleranz, keine Doppelbefunde, Mischproben |
| `n3.js` | Alle neun Reiter leer und gefüllt · Sätze ohne Aussaatdatum · kein `onclick` in der ganzen App · KPI-Vergleich · Zeitachse · grün und gelb am selben Tag |
| `n4.js` | Migration einer Sicherung im Format 3 · Rundlauf sichern und laden · Phantomdaten sichtbar · Nachweisgrenzen fliessen in keine Kennzahl |
| `n5.js` | Angebot gegen Aufnahme · Substrat-pH-Folgen · Vergleichsgruppe im Reiter Wirkung · Vorschlag zur Kontrollgruppe · wiederkehrende Befunde |
| `s1.js` | Statistik: kompositionelle Sensitivität, Binarisierung, Gleichgewichtung, Unsicherheit, `lage()` und `ausmass()` |
| `s2.js` | Statistik: Messunsicherheit, zensierte Werte, Datenstruktur (Typverzweigungen, Erhebungs-Rekonstruktion, Redundanz, Einheiten, Plausibilität) |
| `s3.js` | Statistik: Inferenz im Reiter Wirkung, Rang der Designmatrix, Substrat-Richtwerte, Kleinigkeiten |
| `s4.js` | Statistik: neun Befunde ausserhalb der Verdachtsliste (Referenzwechsel, Verhältnistoleranz, rückwirkende Bewertung, schwankender Nenner, Scheinpräzision beim Alter, fehlende Jahreszeit, Altblatt bei immobilen Nährstoffen, unbewertete Substratwerte, Tiefe) |
| `g1.js` | Giesswasser: der koordinatenbasierte Parser gegen alle drei echten Berichte, Historie in einzelne Proben zerlegt, Proben vom selben Tag unterscheidbar, Einheiten, der Reiter, die Migration |
| `upload.js` | Der Weg «PDF hochladen und verstehen» in Chromium: echtes PDF einlesen, Kontrolldialog, Übernehmen, die Erhebungsansicht, Reihenfolge im Überblick, Wiedereinstieg. pdf.js wird aus der lokalen Installation umgeleitet, damit der Test ohne Netz läuft |
| `f1.js` | Fotos: Migration, Fotospur, Escaping, Grössenwarnung |
| `l1.js` | Logbuch: strukturierte Mengen, Umbenennungen |
| `x1.js` | Tabellenimport: Datumsformate, doppelte Zeilen, Bemerkungen – und das echte Blatt April–September 2026 (`fixtures/tank-2026.tsv`) Zeile für Zeile |
| `b1.js` | Soll-Ist-Bilanz: Umrechnung, Zeitfenster, Verweigerung bei Lücken, Verdünnung |
| `v1.js` | Reiter Verlauf: Schema, gemeinsame Zeitachse, getrennte Achsen, freie Auswahl, Farbkopplung, Rangliste, Eingangsbilanz, Jung gegen Alt |
| `d1.js` | Selbstsicherung als HTML: Einsetzen und Herauslesen des Datenblocks, Skript-Ende im Text, zweimal sichern |
| `st1.js` | Entnahmestellen zuordnen, gegen die vier echten Wasserberichte |
| `o1.js` | Schema 9, Sauerstoff-Sättigungsgrenze, `vereinigen` zweier Stände, Satzpaare, Stand in der Kopfzeile |
| `server1.js` | `server.js` als eigener Prozess über HTTP: Rollen, Anhängen mit Prüfung, 409 bei veralteter Version, Sicherungskopien, Neustart |
| `browser.js` | Echte App in Chromium: elf Reiter leer und gefüllt, Datei laden, Detaildialog, Nährstoff- und Achsenwechsel, Verlauf mit Ziehen und Zoomen, Stellen zuordnen, Planer, Logbuch, Rundgang, Einstellungen, Offline-Verhalten, Escaping |
| `gwupload.js` | Drei echte Wasserberichte in Chromium einlesen, Proben vom selben Tag unterscheidbar |
| `rundreise.js` | Chromium: erfassen → Stellen zuordnen → als HTML sichern → die gesicherte Datei frisch öffnen → weiterarbeiten |
| `tank.js` | Chromium im Handy-Format gegen `server.js`: messen, Beigabe, Nachfrage bei grossem Sprung, Netz weg, Warteschlange, Netz da, Grenzen der Rolle |
| `online.js` | Chromium gegen `server.js`: Admin-Seite lädt vom Server, sichert laufend, vereinigt bei Gleichzeitigkeit, frischt auf, Kopie herunterladen, Server weg |

## Fixtures

`seiten.json` ist die von `pdfSeiten()` erzeugte Zeilenstruktur der echten
Blattsaftanalyse (Satz 28-478, Probendatum 18.08.2026). Sie macht die
Parserprüfung ohne das PDF reproduzierbar.

Erzeugt mit `seiten.js`, das `pdfSeiten()` aus `basilikum.html` unverändert
nachbaut — mit derselben pdf.js-Version 3.11.174, die die App lädt. Das ist
genauer als `pdftotext -layout`, weil es dieselbe Bibliothek und dieselbe
Rekonstruktion über die y-Koordinate benutzt.

```bash
npm install pdfjs-dist@3.11.174
node pruefung/seiten.js pfad/zur/analyse.pdf     # schreibt seiten.json
```

`giesswasser.json` enthält beide Darstellungen (Zeilen und Koordinaten) der drei
echten Wasserberichte. Der Wasserparser arbeitet über Koordinaten, weil die
Tabelle im Bericht um 90 Grad gedreht ist und die zeilenweise Rekonstruktion
dort Werte verliert – bei Kalium fehlte einer. Erzeugt mit `gwfix.js`
(im Arbeitsordner, nicht eingecheckt); der Weg steht in `seiten.js`.

`testdaten.json` ist eine vollständige Sicherungsdatei im Format 4, gebaut aus
der echten Analyse plus einer zweiten Erhebung, einer Substrat- und einer
Giesswasseranalyse, zwei Logbucheinträgen, drei Kreislaufmessungen und einem
Rundgang. Sie ist die Grundlage des Browsertests und eignet sich zum Ausprobieren.

Für ein neues Laborlayout — Substrat, Giesswasser — denselben Weg gehen und
ein zweites Fixture ablegen, statt gegen Annahmen zu testen.
