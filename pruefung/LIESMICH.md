# Prüfumgebung

Kein Testframework – eigenständige Skripte, damit kein Befund unbemerkt
zurückfällt. Jedes endet mit Exitcode 1, sobald eine Prüfung fehlschlägt.

## Benutzung

```bash
# 1 · Skript aus dem HTML holen und auf Syntax prüfen (app.js ist gitignoriert)
python3 -c "
import re,io
h=io.open('basilikum.html',encoding='utf-8').read()
io.open('pruefung/app.js','w',encoding='utf-8').write(re.findall(r'<script>(.*?)</script>',h,re.S)[-1])"
node --check pruefung/app.js

# 2 · Logikprüfungen (kein Netz, kein Browser; 664 Einzelprüfungen)
for t in n1 g1 n4 x1 d1 st1 o1 z1 k1 server1; do node pruefung/$t.js; done

# 3 · Browser (Chromium und playwright; im NODE_PATH ausserdem
#     pdfjs-dist@3.11.174 für die PDFs, jsqr und pngjs für den QR-Code)
node pruefung/browser.js     # die fünf Reiter, Bericht, Import, Grafiken, Zeigen, Zoom, Rollbalken, Kulturmanagement ziehen, Handybreite
node pruefung/upload.js      # Blattsaft-PDF hochladen bis zum Bericht – mit echtem pdf.js
node pruefung/gwupload.js    # drei Wasserberichte auf einmal
node pruefung/rundreise.js   # erfassen → als HTML sichern → frisch öffnen → weiterarbeiten
node pruefung/tank.js        # Mobile App gegen den echten server.js (offen)
node pruefung/online.js      # Dashboard vom Server: laufend sichern, Konflikt, Auffrischen, Hinweis nur einmal
node pruefung/paket.js       # der erste Tag online: Sicherung, Paket, Balken, QR, Handy, Neustart

# 4 · Taugen die nachgebauten PDFs? (pdfjs-dist im NODE_PATH)
node pruefung/pdfbau-pruefen.js
```

`upload.js` und `gwupload.js` nehmen eigene PDFs (`PDF=…`, `GW=ordner`), ohne
sie die nachgebauten aus `pdfbau.js`. pdf.js wird aus der lokalen
Installation umgeleitet (`PDFJS=…/pdfjs-dist/build`, sonst über
`require.resolve`), damit alles ohne Netz läuft.

## Was die einzelnen Dateien prüfen

| Datei | Inhalt |
|---|---|
| `harness.js` | DOM-Ersatz: `document.getElementById` liefert ein Objekt mit `innerHTML`, `value`, `classList` …, der Selbstaufruf am Ende wird abgeschnitten, die Funktionen werden zurückgegeben. `setDb`, `setTab`, `setKombi`, `setKmAus`, `setKmOffen`, `setZeit`, `setLinien` setzen Zustand, `getZeit` (Ausschnitt, Trefferliste, aktive Vorgabe)/`getKm`/`getLinien` lesen ihn, `nachRenderRun()` löst den Diagrammaufbau aus. |
| `n1.js` | Parser gegen den echten Blattsaftbericht · Nachweisgrenzen · getrennte Optima je Probe · `putz()` · `optimum()` zeigt nur das Labor · `lage()` |
| `g1.js` | Wasserparser gegen die echten Berichte (Historie in Proben zerlegt, gleiche Tage unterscheidbar, Einheiten) · das Giesswasser-Fenster im Reiter Blattsaft & Giesswasser · Migration alter Handeingaben |
| `n4.js` | Migration einer Sicherung im Format 3 (alles bleibt, auch was nicht mehr gezeigt wird) · Rundlauf sichern und laden · die fünf Reiter in ihrer Reihenfolge, Start immer bei Blattsaft & Giesswasser · der Bericht: Werte und Optimum, **keine Deutung** · Entfernen |
| `x1.js` | Tabellenimport: Datumsformate, doppelte Zeilen, Bemerkungen – die echten Blätter April–September (`fixtures/tank-2026.tsv`) und der Praxisbericht (`fixtures/praxis-2026.tsv`) Zeile für Zeile, daraus die Balken je Mittel |
| `d1.js` | Selbstsicherung als HTML: Einsetzen und Herauslesen des Datenblocks, Skript-Ende im Text, zweimal sichern |
| `st1.js` | Entnahmestellen zuordnen, gegen die vier echten Wasserberichte; Wirkung auf das Diagramm, Einstellungen, Escaping |
| `o1.js` | Felder für Sauerstoff und Namen · Messungen zu Stellen · `vereinigen` zweier Stände · seit wann ein Mittel gegeben wird · Stand in der Kopfzeile |
| `z1.js` | Uhrzeit (Normalform, Achse mit Stunden bis 4 Tage, Verteilung, Import) · das Datenpaket mit jedem Entscheid, Aktivieren/Ergänzen/Entfernen · eine Zeile je Mittel (Magnesium Mai und Juli in einer Zeile), ein- und ausblenden · Balken von Hand · Beschriftung nur mit Datum, nie überlappend · Ereignisse als Marken · **Phosphorsäure: als hätte es sie nie gegeben** (Paket, Kennungen, Bereinigung beim Laden, Import, `vereinigen`) |
| `k1.js` | ＋ Massnahme eintragen (eigene, Mittel, Ereignis) · eigene Massnahme ändern und löschen · Einträge entfernen · die Grafiken und das Kulturmanagement dazwischen · pH, EC & O₂ · Einträge der Mobile App · persönliche Ansicht (ohne Reiter) · keine Spur der alten Auswertung · **Kulturmanagement:** Biovin nur im Tank-Reiter, Ereignisse eingeklappt, Ziehen (`kmVerschieben`, Biovin behält seinen Platz), löschen · **Zoomen:** Stufenleiter −/+, rechter Rand bleibt, feste Zeiträume, Grenzen, runde y-Achse · **Zeigen:** nächster Punkt aus der Trefferliste · **Verdichtung:** Stufen jede Messung / halber Tag / Tag mit Spiel, ohne Uhrzeit nie im halben Tag, Klick zeigt die Woche · **«Ältere Daten übernommen» nur einmal** |
| `server1.js` | `server.js` als eigener Prozess: offen ohne Passwort, nur Dashboard geschützt, beide Passwörter; `/maske`, noindex, Anhängen mit Prüfung, Uhrzeit, 409, Sicherungskopien, Neustart |
| `browser.js` | Chromium: fünf Reiter leer und gefüllt (Blattsaft & Giesswasser zuerst), Bericht, Kontrolldialog, Blattsaft · Kulturmanagement · Giesswasser mit eigener Datumsachse, − und + oben rechts, «Punkte verbinden» je Grafik, «Stellen zuordnen» beim Giesswasser, Zeigen neben einen Punkt (Ring, Zeiger, Datum), Klicken, Zoomen (Rad allein scrollt, Strg + Rad, Stufen, Rollbalken: Daumen, Pfeil, Bahn; Ziehen nur gezoomt, Tastatur, Rollbalken klebt unten), Ereignisse ein- und ausklappen, ＋ Massnahme, Reihenfolge ziehen in Tafel und Dialog, Tastatur am Griff, ausblenden, pH, EC & O₂ mit eingeklappter Liste, Einträge Mobile App, Escaping, Handybreite |
| `upload.js` | Chromium: Blattsaft-PDF über `#filePdf` mit echtem pdf.js → Kontrolldialog → Bericht → Liste → dasselbe PDF noch einmal → Diagramm |
| `gwupload.js` | Chromium: drei Wasserberichte auf einmal → vier Proben → Liste → Bericht mit Einheiten → Diagramm mit Stellen |
| `rundreise.js` | Chromium: ＋ Massnahme mit heiklem Text → Stellen zuordnen → als HTML sichern → die Datei frisch öffnen → alles da, nichts ausgeführt → weiterarbeiten |
| `tank.js` | Chromium im Handy-Format gegen `server.js` – die Mobile App (`erfassen.html`): Name statt Login, Uhrzeit, messen, Beigabe, Nachfrage bei grossem Sprung, Netz weg, Warteschlange, kein Link ins Dashboard |
| `online.js` | Chromium gegen `server.js`: Dashboard ohne Login, «Mobile App ↗», ＋ Massnahme sichert laufend, Gleichzeitigkeit, Auffrischen, Einträge der Mobile App, Kopie herunterladen, persönliche Ansicht (Start immer bei Blattsaft & Giesswasser, «Punkte verbinden» gemerkt), **ein alter Stand auf dem Server: «Ältere Daten übernommen» einmal, gleich zurückgeschrieben, nach «Verstanden» nie wieder**, Server weg |
| `paket.js` | Chromium: leerer Server → Sicherung einspielen → Paket aktivieren → Tank: Kulturmanagement unter dem pH, eine Zeile je Mittel, Verdichtung je Tag/halben Tag, Klick auf den Tagespunkt, Stunden auf der Achse, aufklappbare Marken → Balken von Hand → QR-Code zurückgelesen und gedruckt → Handy mit Namen → Einträge Mobile App → Neustart |
| `pdfbau.js` | baut aus `seiten.json` und `giesswasser.json` schlichte PDFs (Helvetica, WinAnsi), jedes Textstück an seinem Ort |
| `pdfbau-pruefen.js` | belegt, dass pdf.js aus den nachgebauten PDFs dieselben Zeilen und der Parser dieselben Werte liest wie aus den echten |

Die Suiten der vollen Fassung (Regelwerk `n2`, `n3`, `n5`, Statistik `s1`–`s4`,
Bilanz `b1`, Verlauf `v1`, Fotos `f1`, Logbuch `l1`) prüften, was es seit dem
5. Oktober nicht mehr gibt. Sie liegen im Git-Verlauf (Commit `7274630`).

## Fixtures

`seiten.json` ist die von `pdfSeiten()` erzeugte Zeilenstruktur der echten
Blattsaftanalyse (Satz 28-478, Probendatum 18.08.2026), erzeugt mit
`seiten.js` und derselben pdf.js-Version 3.11.174, die die App lädt.

`giesswasser.json` enthält beide Darstellungen (Zeilen und Koordinaten) der
vier echten Wasserberichte. Der Wasserparser arbeitet über Koordinaten, weil
die Tabelle im Bericht um 90 Grad gedreht ist.

`testdaten.json` ist eine Sicherungsdatei im Format 4: zwei Blattsaftberichte,
eine Substrat- und fünf Giesswasserproben, zwei Einträge, drei Messungen,
ein Rundgang. Grundlage der Browserprüfungen.

`fixtures/tank-2026.tsv` und `fixtures/praxis-2026.tsv` sind die echten
Tabellen April–September und der Praxisbericht vom 31.08.–10.09.
