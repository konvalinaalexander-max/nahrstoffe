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

# 2 · Logikprüfungen (kein Netz nötig)
for t in n1 n2 n3 n4 n5; do node pruefung/$t.js; done

# 3 · Browsertest (braucht Chromium und playwright)
npm install playwright
node pruefung/browser.js
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
| `browser.js` | Echte App in Chromium: neun Reiter leer und gefüllt, Datei laden, Detaildialog, Nährstoff- und Achsenwechsel, Planer, Logbuch mit Apostroph und spitzen Klammern, Rundgang, Einstellungen, Offline-Verhalten, Escaping |

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

`testdaten.json` ist eine vollständige Sicherungsdatei im Format 4, gebaut aus
der echten Analyse plus einer zweiten Erhebung, einer Substrat- und einer
Giesswasseranalyse, zwei Logbucheinträgen, drei Kreislaufmessungen und einem
Rundgang. Sie ist die Grundlage des Browsertests und eignet sich zum Ausprobieren.

Für ein neues Laborlayout — Substrat, Giesswasser — denselben Weg gehen und
ein zweites Fixture ablegen, statt gegen Annahmen zu testen.
