# Die Webseite online stellen – Schritt für Schritt

Diese Anleitung geht davon aus, dass du noch nie einen Server aufgesetzt
hast. Sie nimmt den einfachsten Weg: **Railway**, ein Dienst, der aus dem
GitHub-Repository automatisch die Webseite baut und laufen lässt. Kein
Terminal, keine Kommandozeile, nur Klicks im Browser. Etwa 20 Minuten.

Was am Ende steht:

| Adresse | Was dort ist | Wer |
|---|---|---|
| `https://…railway.app` (später z. B. `https://basilikum.xy.ch`) | das Dashboard, sofort, ohne Login | Büro, Chef |
| dieselbe Adresse mit **`/maske`** am Ende | die Eingabemaske fürs Handy: nur den Namen eintippen, dann messen und Beigaben eintragen | hinten am Tank, per QR-Code |

Die Maske hat **keinen Link** zum Dashboard. Es gibt **kein Passwort**.

Was es kostet: Railway rechnet nach Verbrauch; für diese kleine Anwendung
sind das nach dem Probeguthaben rund **fünf Dollar im Monat** (Hobby-Plan).
Preise ändern sich – auf railway.com unter «Pricing» nachsehen.

> **Ohne Passwort heisst:** Wer die Adresse kennt, kann alles sehen und
> ändern. Die Railway-Adresse ist lang und nicht zu erraten, Suchmaschinen
> werden ausdrücklich ausgesperrt, und der Server legt bei jeder Änderung
> eine Sicherungskopie an. Wer später doch ein Passwort fürs Dashboard will:
> Teil J – ein Eintrag bei Railway, keine Programmänderung.

---

## Bevor du anfängst

Du brauchst nur zwei Dinge:

1. Dein **GitHub-Konto** (dasselbe, in dem das Repository
   `konvalinaalexander-max/nahrstoffe` liegt).
2. Falls vorhanden: deine **letzte gesicherte Datei** aus dem Büro
   (`basilikum_….html` oder `.json`) – darin stecken die Analysen.

Alles, was gebaut wurde, liegt auf dem Zweig **`claude/new-session-0ege9e`**.
Railway kann von jedem Zweig bauen – wir wählen ihn in Teil C aus. Du musst
nichts zusammenführen.

---

## Teil A · Konto bei Railway

1. Öffne **https://railway.com** im Browser.
2. Klicke oben rechts auf **Login**, dann **Login with GitHub**.
3. GitHub fragt, ob Railway auf dein Konto zugreifen darf → **Authorize**.
4. Railway zeigt einmalig eine Startseite. Du bist jetzt drin.

> Railway startet mit einem Probeguthaben. Irgendwann fragt es nach einer
> Kreditkarte für den Hobby-Plan. Das ist der Moment, in dem du dich
> entscheidest, ob die Seite bleibt.

---

## Teil B · Das Projekt anlegen

1. Klicke auf **New Project** (grosser Knopf, oder oben rechts «+ New»).
2. Wähle **Deploy from GitHub repo**.
3. Beim ersten Mal: **Configure GitHub App** → GitHub öffnet sich → wähle
   **Only select repositories** → suche `nahrstoffe` → **Install & Authorize**.
   Zurück bei Railway steht das Repository jetzt in der Liste.
4. Klicke auf **konvalinaalexander-max/nahrstoffe**.
5. Railway legt einen Dienst («Service») an und beginnt sofort zu bauen –
   noch vom falschen Zweig. Das macht nichts; weiter mit Teil C.

---

## Teil C · Den richtigen Zweig wählen

1. Klicke auf den Dienst (das Kästchen mit dem Namen `nahrstoffe`).
2. Reiter **Settings**.
3. Abschnitt **Source** → bei **Branch** steht `main`. Klicke darauf und
   wähle **`claude/new-session-0ege9e`**.
4. Railway baut jetzt neu. Es findet die Datei `Dockerfile` von selbst.

**Variablen braucht es keine.** Railway setzt `PORT` (8080) selbst, und der
Speicherort `/daten` steht schon im Dockerfile.

---

## Teil D · Die Festplatte («Volume») – der wichtigste Schritt

Ohne Volume speichert der Server in den Container, und der wird bei jedem
Neustart frisch aufgesetzt. **Dann wären alle Daten weg.** Also:

1. Zurück zur Projektübersicht (die Fläche mit dem Dienst-Kästchen).
2. **Rechtsklick auf die leere Fläche** → **Volume**
   (oder Tastenkürzel **⌘K** / **Strg+K** → «Volume» tippen).
3. Railway fragt, an welchen Dienst das Volume gehängt wird → **nahrstoffe**.
4. Beim **Mount Path** eintragen: **`/daten`** – genau so, mit Schrägstrich,
   klein geschrieben.
5. Bestätigen. Railway startet den Dienst neu.

Prüfen: das Volume erscheint als eigenes kleines Kästchen, verbunden mit dem
Dienst. Und im Log (Teil F) steht die Zeile
`Volume erkannt: /daten – der Bestand überlebt Neustarts.`

---

## Teil E · Die Adresse

1. Dienst anklicken → **Settings** → Abschnitt **Networking** →
   **Public Networking**.
2. Klicke **Generate Domain**.
3. Fragt Railway nach dem Port: **8080**.
4. Es erscheint eine Adresse wie `nahrstoffe-production-a1b2.up.railway.app`.
   Das ist die Webseite. HTTPS ist automatisch dabei.

Eine eigene Adresse wie `basilikum.xy.ch` kommt später dazu (Teil K). Druck
den QR-Code erst, wenn die Adresse steht, die bleiben soll.

---

## Teil F · Warten, bis es läuft

1. Reiter **Deployments**. Der oberste Eintrag springt nach ein, zwei
   Minuten auf **Active** (grün).
2. Klick darauf → **View Logs**. Dort stehen drei Zeilen:
   ```
   Basilikum läuft auf Port 8080 · Bestand: /daten/bestand.json · Version 0
   Dashboard «/»: offen, ohne Passwort · Maske «/maske»: offen, ohne Passwort
   Volume erkannt: /daten – der Bestand überlebt Neustarts.
   ```
3. Steht statt der dritten Zeile **«ACHTUNG: Kein Volume angehängt»** oder
   **«Das Volume hängt unter …»** → zurück zu Teil D, Mount Path genau `/daten`.
4. Steht **Failed**: klick darauf, die letzten Zeilen im Log sagen, woran es
   liegt. Unten in der Tabelle «Wenn etwas nicht geht» stehen die Fälle.

---

## Teil G · Zum ersten Mal öffnen – Daten hinein

1. Öffne die Adresse aus Teil E. Das Dashboard erscheint **sofort**, ohne
   Login. Oben rechts steht *online · gesichert*.
2. **Zuerst die alte Sicherung** (falls du eine hast):
   Reiter **Einstellungen** → Karte «Daten» →
   **Sicherung einspielen** → deine letzte Datei wählen. Ein paar Sekunden
   später steht oben rechts *gesichert hh:mm*.
3. **Dann die vorbereiteten Daten:** Im Reiter **Blattsaft & Giesswasser**
   (oder **pH & EC am Tank**) steht ein grüner
   Hinweis *«Bereit zum Aktivieren: Reservoir April bis September 2026»*
   → **Ansehen und aktivieren**. Der Dialog zeigt, was hineinkommt (149
   Messungen bis zum 30. September, 76 Gaben und Ereignisse), welche Balken danach unter den Diagrammen
   stehen und was dabei entschieden wurde. → **Aktivieren**.
   Die App springt in den Reiter **pH & EC am Tank**; alles ist eingetragen und
   gesichert.

   > Die Reihenfolge zählt: «Sicherung einspielen» **ersetzt** den ganzen
   > Bestand. Wer es andersherum gemacht hat: Einstellungen →
   > «Vorbereitete Daten» → Ansehen → **Aktivieren** (oder «Fehlende
   > ergänzen»). Nichts wird doppelt eingetragen.

4. Reiter **Einstellungen** → Karte «Entnahmestellen» → **Stellen zuordnen**,
   falls dort Bezeichnungen als «noch nicht zugeordnet» stehen (das Labor
   schreibt die Stellen jedes Mal anders). Die Zuordnung gilt ab jetzt für
   alle.

---

## Teil H · Die Maske am Tank – per QR-Code

1. Im Dashboard oben rechts: **QR-Code** → **Drucken**. Es kommt ein Blatt
   mit grossem Code und der Adresse. Ausdrucken, am Tank aufhängen
   (am besten in einer Klarsichtmappe).
   *Alternativ:* **Als Bild speichern** und das Bild verschicken.
2. Am Handy: Kamera auf den Code → die Maske öffnet sich.
3. Die Maske fragt nur: **Wer misst?** → Namen oder Kürzel eintippen →
   **Weiter**. Kein Passwort. Der Name gilt eine Stunde, danach fragt sie
   wieder – so trägt jeder Eintrag einen Namen.
4. **Zum Startbildschirm hinzufügen**, damit es wie eine App aussieht:
   - iPhone (Safari): Teilen-Symbol (Viereck mit Pfeil) → **Zum Home-Bildschirm**.
   - Android (Chrome): Menü (drei Punkte) → **Zum Startbildschirm hinzufügen**.
5. Eine Probemessung eintragen. Uhrzeit und Datum setzt das Handy selbst.
   Im Dashboard erscheint sie innerhalb einer halben Minute im Reiter
   **Einträge Maske** (und im Reiter **pH & EC am Tank**), mit Namen und
   Uhrzeit.

Die Maske hat keinen Link ins Dashboard. Wer am Handy `/maske` aus der
Adresse löscht, käme hin – das ist so gewollt und macht in der Praxis
niemand.

---

## Teil I · Was du danach wissen musst

**Es gibt keinen Speichern-Knopf.** Was eingetragen ist, ist eingetragen –
für alle. Oben rechts steht immer der Stand. Steht dort *«nicht erreichbar –
Änderungen warten»*, ist der Server gerade nicht da; die Änderungen bleiben
im Browserfenster und gehen raus, sobald er wieder antwortet. Das Fenster
dann nicht schliessen.

**Persönliche Ansicht bleibt persönlich.** Welche Werte du anzeigst,
welche Balken in welcher Reihenfolge (über «Zeilen ordnen und ausblenden»),
ob die Ereignisse aufgeklappt sind, welcher Reiter offen ist –
das merkt sich nur dein Browser. Einträge, Massnahmen, Stellen und
Zeiträume gelten für alle.

**Sicherungskopien** macht der Server selbst, bei jeder Änderung, im Volume
unter `/daten/sicherungen` (die letzten 30 und eine pro Tag für 90 Tage).
Zusätzlich ab und zu **Kopie herunterladen** (Einstellungen) und die
Datei ablegen – sie ist die ganze Anwendung mit allen Daten, vom Ordner aus
doppelt klickbar.

**Aktualisieren:** Eine neue Fassung kommt in dasselbe Repository, auf
denselben Zweig. Railway baut sie von selbst; der Bestand liegt im Volume und
bleibt.

---

## Teil J · Später doch ein Passwort (freiwillig)

Dienst → Reiter **Variables** → **+ New Variable**:

| Name | Wirkung |
|---|---|
| `ADMIN_PASSWORT` | Das Dashboard fragt nach Benutzer **`admin`** und diesem Passwort. Die Maske bleibt offen. |
| `MASKE_PASSWORT` | Auch die Maske fragt – Benutzer **`hinten`**. Muss anders sein als das Admin-Passwort. |

Railway startet neu, das Log sagt, was gilt. Variable löschen = wieder offen.

---

## Teil K · Eigene Adresse, z. B. `basilikum.xy.ch`

1. Railway: Dienst → **Settings** → **Networking** → **Custom Domain** →
   `basilikum.xy.ch` eintragen, Port **8080**.
2. Railway zeigt einen **CNAME**-Eintrag (und eventuell einen TXT-Eintrag zur
   Bestätigung). Beide bei deinem Domain-Anbieter anlegen (dort, wo `xy.ch`
   verwaltet wird: «DNS-Einträge»).
3. Ein paar Minuten bis eine Stunde warten; Railway holt das Zertifikat
   selbst. Danach: Dashboard unter `https://basilikum.xy.ch`, Maske unter
   `https://basilikum.xy.ch/maske`.
4. **Den QR-Code jetzt neu drucken** – der alte zeigt auf die Railway-Adresse.
   (Die funktioniert zwar weiter, aber eine Adresse ist übersichtlicher.)

Direkt `xy.ch` ohne Vorsatz geht nur, wenn der Anbieter «CNAME Flattening»
oder «ALIAS» kann (z. B. Cloudflare). Ein Vorsatz wie `basilikum.` ist der
sichere Weg.

---

## Wenn etwas nicht geht

| Was du siehst | Woran es liegt | Was zu tun ist |
|---|---|---|
| Bau «Failed», im Log *VOLUME … is not supported* | ein altes Dockerfile | Teil C: Zweig `claude/new-session-0ege9e` gewählt? Dort ist es behoben |
| Seite: *Application failed to respond* | Port stimmt nicht | Settings → Networking: Port **8080**; unter Variables kein anderes `PORT` |
| Log: *ACHTUNG: Kein Volume angehängt* | Volume fehlt | Teil D |
| Log: *Das Volume hängt unter …* | falscher Mount Path | Volume anklicken → Mount Path genau `/daten` |
| Nach einem Neustart ist alles leer | Volume fehlte beim Eintragen | Teil D, dann Sicherung einspielen und Paket aktivieren (Teil G) |
| Kein grüner Hinweis zum Aktivieren | Paket schon aktiv oder «Nicht verwenden» gewählt | Einstellungen → «Vorbereitete Daten» |
| QR-Code erscheint nicht, stattdessen die Adresse als Text | die QR-Bibliothek (von cdnjs) ist gesperrt | Seite neu laden; sonst die Adresse abtippen |
| Handy: Punkt oben links orange, «wartet auf Netz» | kein Empfang hinten | nichts tun – geht beim nächsten Öffnen raus |
| Dashboard: *nicht erreichbar – Änderungen warten* | Server neu gestartet oder Netz weg | Fenster offen lassen; sobald der Server da ist, geht es raus |
| Nach dem Öffnen: «Bestand vom Server geladen» und eine Liste von Anpassungen | eine ältere Sicherung wurde eingespielt | einmal lesen, «Verstanden» – die App hat das Format angehoben |
| *401* oder Frage nach Benutzername | ein Passwort ist gesetzt (Teil J) | Benutzer `admin` bzw. `hinten`; oder die Variable löschen |

---

## Die beiden anderen Wege (falls Railway nicht passt)

**Render.com** funktioniert fast gleich (Web Service → Docker → **Disk** mit
Mount Path `/daten`). Persistente Disks gibt es dort erst im bezahlten Plan.

**Eigener Server** (Hetzner, Infomaniak …): rund vier Euro im Monat, dafür
SSH. Mit Docker:
```
docker build -t basilikum .
docker run -d --restart unless-stopped -p 8080:8080 -v basilikum-daten:/daten basilikum
```
davor Caddy als HTTPS-Proxy. Wenn ihr diesen Weg wollt, sag Bescheid – dann
schreibe ich ihn genauso Schritt für Schritt auf.
