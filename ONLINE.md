# Die Anwendung online stellen

Was gebraucht wird: ein Ort, an dem Node läuft, eine Festplatte, die
Neustarts überlebt, und HTTPS. Das ist alles. Der Server ist eine Datei
(`server.js`) ohne Abhängigkeiten – es gibt kein `npm install`.

Drei Wege, geordnet nach Aufwand. **Für den Anfang: Weg 1.**

---

## Vorher, egal welcher Weg: zwei Passwörter

Der Server kennt zwei Rollen. Beide brauchen ein Passwort, und die beiden
müssen verschieden sein – sonst startet er nicht.

| Rolle | Umgebungsvariable | wer | Seite |
|---|---|---|---|
| `admin` | `ADMIN_PASSWORT` | Büro | `https://…/` |
| `hinten` | `HINTEN_PASSWORT` | am Tank | `https://…/erfassen` |

Der Browser fragt beim ersten Öffnen nach «Benutzername» und «Passwort»:
Benutzername ist `admin` bzw. `hinten`. Danach merkt er sich das. Auf dem
Handy hinten: die Seite öffnen, anmelden, «zum Startbildschirm hinzufügen» –
dann ist sie wie eine App.

Wähle lange Passwörter (drei, vier Wörter). Nach zwanzig Fehlversuchen von
derselben Adresse sperrt der Server zehn Minuten.

---

## Weg 1 · Railway (oder Render, Fly)

Ein Anbieter, der ein Git-Repository nimmt, daraus ein Abbild baut und es
mit einer Festplatte («Volume») laufen lässt. Rund fünf Dollar im Monat –
den aktuellen Stand nachprüfen.

1. **Konto** bei railway.app anlegen, mit GitHub verbinden.
2. **New Project → Deploy from GitHub repo** → dieses Repository wählen.
   Railway findet das `Dockerfile` und baut es.
3. **Variables** (Reiter des Dienstes): `ADMIN_PASSWORT` und
   `HINTEN_PASSWORT` eintragen. `PORT` setzt Railway selbst; `DATEN` steht
   im Dockerfile auf `/daten`.
4. **Volume** anlegen und an den Dienst hängen, Mount-Pfad **`/daten`**.
   Ohne Volume ist der Bestand beim nächsten Neustart weg – das ist der
   Schritt, der am häufigsten vergessen wird.
5. **Settings → Networking → Generate Domain.** Die Adresse ist dann etwa
   `basilikum-xyz.up.railway.app`, mit HTTPS.
6. Aufrufen, als `admin` anmelden, unter «Datei öffnen» die letzte
   Sicherung (`basilikum_….html` oder `.json`) einspielen. Fertig.

Render und Fly.io funktionieren gleich; die Begriffe heissen dort «Disk»
bzw. «Volume».

**Aktualisieren:** ein Push ins Repository baut neu. Der Bestand liegt im
Volume und bleibt.

---

## Weg 2 · Ein kleiner Server (Hetzner, Infomaniak, …)

Mehr Kontrolle, rund vier Euro im Monat, dafür SSH. Als Beispiel Ubuntu.

```bash
# Node 22
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs caddy

# die drei Dateien nach /opt/basilikum
sudo mkdir -p /opt/basilikum /var/lib/basilikum
sudo cp server.js basilikum.html erfassen.html /opt/basilikum/
```

Ein Dienst, der beim Hochfahren startet – `/etc/systemd/system/basilikum.service`:

```ini
[Unit]
Description=Basilikum
After=network.target

[Service]
WorkingDirectory=/opt/basilikum
Environment=PORT=8080
Environment=DATEN=/var/lib/basilikum
Environment=ADMIN_PASSWORT=hier-das-admin-passwort
Environment=HINTEN_PASSWORT=hier-das-andere
ExecStart=/usr/bin/node server.js
Restart=always
User=www-data

[Install]
WantedBy=multi-user.target
```

```bash
sudo chown -R www-data /var/lib/basilikum
sudo systemctl enable --now basilikum
```

HTTPS über Caddy, der die Zertifikate von selbst holt – `/etc/caddy/Caddyfile`:

```
basilikum.euer-betrieb.ch {
    reverse_proxy 127.0.0.1:8080
}
```

`sudo systemctl reload caddy`. Die Domain muss vorher auf die Adresse des
Servers zeigen (ein A-Eintrag beim Domain-Anbieter).

**Aktualisieren:** die drei Dateien ersetzen, `sudo systemctl restart basilikum`.

---

## Weg 3 · Nur im eigenen Netz

Ein Rechner im Betrieb, der durchläuft (auch ein Raspberry Pi):

```bash
ADMIN_PASSWORT=… HINTEN_PASSWORT=… node server.js
```

Erreichbar unter `http://<adresse-des-rechners>:8080`. Kein HTTPS, kein
Zugriff von unterwegs – dafür nichts zu mieten. Die Passwörter gehen dann
unverschlüsselt durchs eigene WLAN; für ein Betriebsnetz ist das vertretbar,
für öffentliches WLAN nicht.

---

## Was der Server tut und was er nicht tut

- **Bestand:** eine Datei `bestand.json` mit Versionsnummer, unter `DATEN`.
- **Sicherungen:** bei jeder Änderung eine datierte Kopie unter
  `DATEN/sicherungen/`. Behalten werden die letzten dreissig und je eine pro
  Tag der letzten neunzig Tage. Zurückspielen: die Kopie umbenennen in
  `bestand.json`, Server neu starten – oder im Büro über «Datei öffnen».
- **`/gesund`** antwortet ohne Anmeldung mit `{"ok":true}` – für den
  Hoster, damit er weiss, dass der Dienst lebt.
- **Nicht dabei:** Benutzerkonten je Person (zwei Rollen und ein Kürzel
  genügen bei eurer Grösse), automatische Sicherung *ausserhalb* des
  Servers (dafür ab und zu «Kopie herunterladen» im Büro und die Datei
  irgendwo ablegen), Zugriff für Dritte auf einzelne Sätze.

## Wenn etwas nicht geht

| Symptom | Ursache | Abhilfe |
|---|---|---|
| Der Dienst startet nicht, Log sagt «müssen gesetzt sein» | ein Passwort fehlt | beide Variablen setzen |
| «dürfen nicht gleich sein» | gleiche Passwörter | verschiedene wählen |
| Bestand nach Neustart leer | kein Volume / falscher Pfad | Volume auf `DATEN` (im Dockerfile `/daten`) |
| Handy sagt «keine Verbindung», Büro geht | Empfang hinten | die Einträge warten auf dem Gerät und gehen später raus |
| «nicht erreichbar – Änderungen warten» im Büro | Server weg | nichts tun; sobald er da ist, geht es auf «Jetzt sichern» oder von selbst raus |
| 429 «Zu viele Fehlversuche» | zwanzigmal falsches Passwort | zehn Minuten warten |
