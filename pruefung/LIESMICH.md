# Prüfumgebung

Kein Testframework, wie in der Übergabe beschrieben — nur der dort skizzierte
Weg, als Skripte festgehalten, damit Befunde nachvollziehbar bleiben.

## Benutzung

```bash
# 1 · Skript aus dem HTML holen und auf Syntax prüfen
python3 -c "
import re,io
h=io.open('basilikum.html',encoding='utf-8').read()
io.open('pruefung/app.js','w',encoding='utf-8').write(re.findall(r'<script>(.*?)</script>',h,re.S)[-1])"
node --check pruefung/app.js

# 2 · Prüfungen laufen lassen
cd pruefung && for t in t1 t2 t3 t4 t5 t6; do node $t.js; done
```

`harness.js` baut den DOM-Ersatz (`document.getElementById` liefert ein Objekt
mit `innerHTML`, `value`, `classList` …), schneidet die Selbstaufruf-Funktion
am Ende ab und gibt die Funktionen des Skripts zurück. `setDb(...)` setzt die
globale Datenbank, `nachRenderRun()` löst den Diagrammaufbau aus.

## Was die einzelnen Dateien prüfen

| Datei | Inhalt |
|---|---|
| `t1.js` | Parser NovaCropControl, `putz()`, geteiltes `optima`, Aluminium-Spanne |
| `t2.js` | `KERN`, `index()` gegen `bilanz()`, `leitProbe`, Erhebungen grün/gelb, Na- und Cl-Regel |
| `t3.js` | Doppelbefunde, Molybdän-Lücke, Mischproben, `eigeneOptima`, Substrat-Etiketten |
| `t4.js` | Alle zehn Reiter leer und gefüllt, KPI-Kachel, verschwundene Sätze |
| `t5.js` | Apostroph im onclick, Zeitachse `chartIndex`, Altersdrift |
| `t6.js` | Reiter Wirkung: Blattalter und fremde Rundgänge, `bezugFuer` |
| `t7.js` | Parser gegen die echte Datei: alle 23 Parameter, Werte, Optima |
| `t8.js` | Regelwerk an den echten Werten — was die App tatsächlich ausgibt |
| `t9.js` | `putz()` am echten Layout, Kupferlücke, stumme Überschreitungen |
| `t10.js` | Wirkung der offenen Entscheidungen auf die Kennzahl |

`app.js` wird erzeugt und ist nicht eingecheckt.

## Echte Datei

`seiten.json` ist die von `pdfSeiten()` erzeugte Zeilenstruktur der echten
Blattsaftanalyse (Satz 28-478, Probendatum 18.08.2026). Sie ist das Fixture
für `t7`–`t10` und macht die Parserprüfung ohne das PDF reproduzierbar.

Erzeugt mit `seiten.js`, das `pdfSeiten()` aus `basilikum.html` Zeile 303
unverändert nachbaut — mit derselben pdf.js-Version 3.11.174, die die App
lädt. Das ist genauer als `pdftotext -layout`, weil es dieselbe Bibliothek
und dieselbe y-Koordinaten-Rekonstruktion benutzt.

```bash
npm install pdfjs-dist@3.11.174
node pruefung/seiten.js pfad/zur/analyse.pdf     # schreibt seiten.json
```

Für ein neues Laborlayout — Substrat, Giesswasser — denselben Weg gehen und
ein zweites Fixture ablegen, statt gegen Annahmen zu testen.
