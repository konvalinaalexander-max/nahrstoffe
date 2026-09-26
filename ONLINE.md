# Die Webseite online stellen – Schritt für Schritt

Diese Anleitung geht davon aus, dass du noch nie einen Server aufgesetzt
hast. Sie nimmt den einfachsten Weg: **Railway**, ein Dienst, der aus dem
GitHub-Repository automatisch die Webseite baut und laufen lässt. Kein
Terminal, keine Kommandozeile, nur Klicks im Browser. Etwa 20 Minuten.

Was am Ende steht: eine Adresse wie `https://basilikum-xyz.up.railway.app`.
Büro öffnet `…/`, das Handy hinten öffnet `…/erfassen`. Beide fragen einmal
nach Benutzername und Passwort.

Was es kostet: Railway rechnet nach Verbrauch; für diese kleine Anwendung
sind das nach dem Probeguthaben rund **fünf Dollar im Monat** (Hobby-Plan).
Preise ändern sich – auf railway.app unter «Pricing» nachsehen.

---

## Bevor du anfängst – zwei Dinge vorbereiten

**1 · Zwei Passwörter ausdenken und irgendwo notieren.**
Eines fürs Büro (`admin`), eines für hinten am Tank (`hinten`). Sie müssen
verschieden sein. Nimm je drei, vier Wörter, zum Beispiel
`basilikum-tisch-vorne-2026` – lang ist wichtiger als kompliziert.

**2 · Der Code muss auf dem Hauptzweig liegen.**
Alles, was gebaut wurde, liegt im Repository `konvalinaalexander-max/nahrstoffe`
auf dem Zweig `claude/new-session-0ege9e`. Railway kann von jedem Zweig
bauen – wir wählen ihn unten einfach aus. Du musst nichts zusammenführen.

---

## Teil A · Konto bei Railway

1. Öffne **https://railway.app** im Browser.
2. Klicke oben rechts auf **Login**, dann **Login with GitHub**.
3. GitHub fragt, ob Railway auf dein Konto zugreifen darf → **Authorize**.
4. Railway zeigt einmalig eine Startseite («Welcome»). Du bist jetzt drin.

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
5. Railway legt einen Dienst («Service») an und beginnt sofort zu bauen.
   **Der erste Bau schlägt fehl – das ist richtig so.** Die Passwörter fehlen
   noch; der Server weigert sich ohne sie zu starten. Weiter mit Teil C.

---

## Teil C · Den richtigen Zweig wählen

1. Klicke auf den Dienst (das Kästchen mit dem Namen `nahrstoffe`).
2. Reiter **Settings**.
3. Abschnitt **Source** → bei **Branch** steht `main`. Klicke darauf und
   wähle **`claude/new-session-0ege9e`**.
4. Ebenfalls unter Settings, Abschnitt **Build**: bei **Builder** sollte
   **Dockerfile** stehen. Railway findet die Datei `Dockerfile` von selbst;
   falls dort «Nixpacks» steht, auf **Dockerfile** umstellen.

---

## Teil D · Die Passwörter eintragen

1. Reiter **Variables** des Dienstes.
2. Klicke **+ New Variable**.
   - Name: `ADMIN_PASSWORT` · Wert: dein Büro-Passwort → **Add**
3. Nochmals **+ New Variable**.
   - Name: `HINTEN_PASSWORT` · Wert: das Tank-Passwort → **Add**
4. Mehr braucht es nicht. `PORT` setzt Railway selbst, `DATEN` steht schon
   im Dockerfile.

Railway baut nach jeder Änderung neu (oben erscheint «Deploying…»). Warte
nicht darauf – zuerst Teil E, sonst ist der Bestand beim nächsten Neustart weg.

---

## Teil E · Die Festplatte («Volume») – der Schritt, der am häufigsten vergessen wird

Ohne Volume speichert der Server in den Container, und der wird bei jedem
Neustart frisch aufgesetzt. **Dann wären alle Daten weg.** Also:

1. Zurück zur Projektübersicht (die Fläche mit dem Dienst-Kästchen).
2. **Rechtsklick auf die leere Fläche** → **Volume** (oder oben «+ New» →
   **Volume**).
3. Railway fragt, an welchen Dienst das Volume gehängt wird → **nahrstoffe**.
4. Beim **Mount Path** eintragen: **`/daten`** – genau so, mit Schrägstrich,
   klein geschrieben.
5. **Add** / **Deploy**.

Prüfen: das Volume erscheint als eigenes kleines Kästchen, verbunden mit dem
Dienst. Klick darauf → «Mount path: /daten».

---

## Teil F · Die Adresse

1. Dienst anklicken → **Settings** → Abschnitt **Networking**.
2. Bei **Public Networking** auf **Generate Domain**.
3. Railway fragt nach dem Port → **8080** eintragen (falls es fragt).
4. Es erscheint eine Adresse wie `nahrstoffe-production-a1b2.up.railway.app`.
   Das ist die Webseite. HTTPS ist automatisch dabei.

> Später kann hier auch eine eigene Domain hinein (z. B.
> `basilikum.euer-betrieb.ch`) – dazu unten mehr. Für den Anfang reicht die
> Railway-Adresse.

---

## Teil G · Warten, bis es läuft

1. Reiter **Deployments**. Der oberste Eintrag sollte nach ein, zwei Minuten
   auf **Active** springen (grün).
2. Steht dort **Failed** oder **Crashed**: klicke darauf → **View Logs**.
   Die letzte Zeile sagt, was fehlt. Die zwei häufigsten Fälle:
   - «ADMIN_PASSWORT und HINTEN_PASSWORT müssen gesetzt sein» → Teil D.
   - «dürfen nicht gleich sein» → zwei verschiedene Passwörter.
   Nach dem Beheben unter Deployments **Redeploy**.
3. Läuft es, steht in den Logs:
   `Basilikum läuft auf Port 8080 · Bestand: /daten/bestand.json · Version 0`

---

## Teil H · Zum ersten Mal öffnen

1. Öffne die Adresse aus Teil F im Browser.
2. Der Browser fragt nach **Benutzername** und **Passwort**:
   Benutzername `admin`, Passwort das Büro-Passwort. Häkchen «merken», wenn
   es angeboten wird.
3. Die Anwendung öffnet sich leer und sagt: *«Verbunden. Der Bestand auf dem
   Server ist noch leer.»* Oben rechts steht *online · gesichert*.
4. **Bisherige Daten hineinholen:** Reiter **Sätze & Einstellungen** →
   ganz unten **Sicherung einspielen** → deine letzte gesicherte Datei wählen
   (`basilikum_….html` oder `.json`). Ein paar Sekunden später steht alles
   da, und oben rechts *gesichert hh:mm*. Fertig – das ist ab jetzt der
   gemeinsame Bestand.
5. Reiter **Giesswasser** → **Stellen zuordnen**, falls noch nicht geschehen.
   Die Zuordnung gilt ab jetzt für alle.

---

## Teil I · Das Handy hinten einrichten

1. Auf dem Handy den Browser öffnen und die Adresse eingeben, hinten mit
   **`/erfassen`**: `https://….up.railway.app/erfassen`
2. Benutzername `hinten`, Passwort das Tank-Passwort. «Merken» wählen.
3. Die Seite fragt nach dem **Kürzel** (zwei bis sechs Zeichen). Es gilt eine
   Stunde; danach fragt sie wieder – so trägt jeder Eintrag einen Namen.
4. **Zum Startbildschirm hinzufügen**, damit es wie eine App aussieht:
   - iPhone (Safari): Teilen-Symbol (Viereck mit Pfeil) → **Zum Home-Bildschirm**.
   - Android (Chrome): Menü (drei Punkte) → **Zum Startbildschirm hinzufügen**.
5. Eine Probemessung eintragen. Im Büro erscheint sie innerhalb einer halben
   Minute im Reiter Giesswasser (Karte «Am Tank»), mit Kürzel.

---

## Teil J · Was du danach wissen musst

**Es gibt keinen Speichern-Knopf mehr.** Was eingetragen ist, ist
eingetragen – für alle. Oben rechts steht immer der Stand. Steht dort
*«nicht erreichbar – Änderungen warten»*, ist der Server gerade nicht da;
die Änderungen bleiben im Browserfenster und gehen raus, sobald er wieder
antwortet. Das Fenster dann nicht schliessen.

**Persönliche Ansicht bleibt persönlich.** Welche Nährstoffe du dir gerade
anzeigst, welcher Reiter offen ist, ob «Wesentlich» oder «Alles» – das merkt
sich nur dein Browser. Die Zuordnung der Stellen, Einstellungen, Sätze,
Produkte gelten für alle.

**Sicherungskopien** macht der Server selbst, bei jeder Änderung, unter
`/daten/sicherungen`. Zusätzlich ab und zu **Kopie herunterladen** (Sätze &
Einstellungen) und die Datei irgendwo ablegen – sie ist die ganze Anwendung
mit allen Daten, vom Ordner aus doppelt klickbar.

**Aktualisieren:** wenn es eine neue Fassung gibt, wird sie in dasselbe
Repository geschoben. Railway baut sie von selbst; der Bestand liegt im
Volume und bleibt.

**Ein Passwort ändern:** Reiter Variables → Wert ändern → Railway startet
neu. Alle müssen sich dann neu anmelden.

---

## Wenn etwas nicht geht

| Was du siehst | Woran es liegt | Was zu tun ist |
|---|---|---|
| Deployment «Failed», Log: *müssen gesetzt sein* | Passwort-Variable fehlt | Teil D, dann Redeploy |
| Log: *dürfen nicht gleich sein* | beide Passwörter gleich | eines ändern |
| Seite lädt, aber nach einem Neustart ist alles leer | Volume fehlt oder falscher Pfad | Teil E: Mount Path genau `/daten` |
| Browser: *401* oder fragt dauernd nach dem Passwort | falscher Benutzername | `admin` bzw. `hinten`, klein geschrieben |
| *429 – Zu viele Fehlversuche* | zwanzigmal falsch getippt | zehn Minuten warten |
| Handy: Punkt oben links ist orange, «wartet auf Netz» | kein Empfang hinten | nichts tun – geht beim nächsten Öffnen raus |
| Büro: *nicht erreichbar – Änderungen warten* | Server neu gestartet oder Netz weg | Fenster offen lassen; sobald der Server da ist, geht es raus |
| Nach dem Öffnen steht «Bestand vom Server geladen» und eine Liste von Anpassungen | eine ältere Sicherung wurde eingespielt | einmal lesen, «Verstanden» – die App hat das Format angehoben |

---

## Eigene Domain (später, freiwillig)

1. Bei eurem Domain-Anbieter einen **CNAME**-Eintrag anlegen:
   `basilikum` → die Railway-Adresse (ohne `https://`).
2. Railway: Settings → Networking → **Custom Domain** → `basilikum.euer-betrieb.ch`.
3. Ein paar Minuten warten; Railway holt das Zertifikat selbst.

---

## Die beiden anderen Wege (falls Railway nicht passt)

**Render.com** funktioniert fast gleich (Web Service → Docker → Environment
für die Passwörter → **Disk** mit Mount Path `/daten`). Persistente Disks
gibt es dort erst im bezahlten Plan.

**Eigener Server** (Hetzner, Infomaniak …): rund vier Euro im Monat, dafür
SSH. Node 22 installieren, die drei Dateien `server.js`, `basilikum.html`,
`erfassen.html` nach `/opt/basilikum`, ein systemd-Dienst mit den zwei
Umgebungsvariablen, davor Caddy als HTTPS-Proxy. Wenn ihr diesen Weg wollt,
sag Bescheid – dann schreibe ich ihn genauso Schritt für Schritt auf.
