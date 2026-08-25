# Auftrag: Datenmodell und Statistik von Grund auf richtig machen

Du übernimmst ein Werkzeug zur Auswertung von Blattsaftanalysen für einen
Demeter-Gartenbaubetrieb (Topfbasilikum, Ebbe-und-Flut, gemeinsamer
Giesswasserkreislauf). Es funktioniert, die Regeln sind agronomisch geprüft,
die Oberfläche ist stabil. **Was nicht geprüft ist, ist die Statistik und die
Datenstruktur darunter.** Genau das ist dein Auftrag.

## Lies zuerst, in dieser Reihenfolge

1. `UEBERGABE.md` — Betrieb, Datenlage, Leitplanken, agronomischer Rahmen
2. `BEFUNDE.md` — das Audit der Vorgängerfassung, 23 Befunde
3. `UMBAU.md` — was im Neubau geändert wurde und welche Entscheidungen getroffen sind
4. `basilikum.html` — vollständig, besonders die Abschnitte 2, 4 und 5
5. `pruefung/LIESMICH.md` und die Skripte `n1`–`n5`, `browser.js`

Der Prüfstand läuft ohne Netz. `pruefung/seiten.json` ist eine echte
NovaCropControl-Analyse, `pruefung/testdaten.json` eine vollständige Sicherung.

---

## Die harte Randbedingung, die alles bestimmt

Es existieren **rund sechs Blattsaftanalysen aus einem halben Jahr**. Kein Satz
wurde je zweimal beprobt. Alle Bestände waren bei der Probenahme unterschiedlich
alt. Kulturalter, Jahreszeit, Satz und Management sind **vollständig
konfundiert**.

Bei dieser Datenlage ist die richtige Data-Science-Antwort **nicht**, ein
Modell zu schätzen. Sie ist:

1. eine Datenstruktur, die die richtige Auswertung später **möglich** macht,
2. Verfahren, die bei kleinem n überhaupt gültig sind (Verhältnisse innerhalb
   einer Probe, kompositionelle Transformationen, verteilungsfreie Masse),
3. **quantitativ** zu sagen, was sich mit dieser Datenlage nicht sagen lässt —
   nicht nur in Prosa, sondern als Zahl,
4. ein Beprobungsdesign, das künftig auswertbare Daten erzeugt.

**Ausdrücklich verboten:** p-Werte, Konfidenzintervalle, Regressionen,
Hauptkomponenten, Clustering oder Machine Learning auf sechs Proben
auszugeben, als wären sie belastbar. Wenn ein Verfahren erst ab n=30 trägt,
baust du es entweder gar nicht oder du baust es mit einer Sperre, die es bis
dahin abschaltet und stattdessen anzeigt, wie viele Erhebungen noch fehlen.
Der Anwender hat mehrfach betont, dass ihm agronomische Redlichkeit wichtiger
ist als hübsche Auswertungen. Halte dich daran.

---

## Verdachtsliste

Das sind **Hypothesen, keine Befunde**. Verifiziere jede einzelne am Code und
an den echten Daten, bevor du etwas änderst. Verwirf, was nicht stimmt, und
ergänze, was fehlt. Ich erwarte, dass du mindestens fünf Punkte findest, die
hier nicht stehen.

### A · Kompositionelle Daten — vermutlich der grösste Fehler

Blattsaftwerte sind Konzentrationen im Pressaft. Sie hängen **alle gemeinsam**
am Wassergehalt der Pflanze: Tageszeit, Zeit seit der letzten Flutung,
Lichtsumme, Zeit seit dem Schnitt verschieben jeden Absolutwert, ohne dass sich
die Versorgung geändert hat. Die Übergabe sagt das selbst.

Die App rechnet ihre Kennzahl trotzdem über Absolutwerte und nutzt Verhältnisse
nur an drei Stellen (K/Mg, K/Ca, NH4/NO3).

Prüfe: Ist das ein Fall für kompositionelle Datenanalyse (Aitchison, CLR/ILR)?
Lässt sich der Saft-EC oder die Ionensumme als Normierungsgrösse nutzen? Was
ändert sich an den Befunden, wenn du normierte statt absoluter Werte
verwendest? Rechne es an den echten Daten durch und zeig den Unterschied.

### B · Die Kennzahl «Anteil im Optimum» ist mehrfach fragwürdig

- Sie **binarisiert** einen kontinuierlichen Messwert und wirft dabei
  Information weg. Ein Wert knapp unter der Grenze zählt wie einer bei 2 % des
  Solls. Die 5-%-Toleranz mildert das nur ab.
- Sie **gewichtet elf Nährstoffe gleich**. Das widerspricht dem Liebigschen
  Minimumgesetz: der limitierende Faktor bestimmt den Ertrag, nicht der
  Durchschnitt. Ein Mittelwert verwischt genau das, was interessiert.
- Sie hat **keine Unsicherheit**. «45 %» aus elf Positionen — das
  Binomial-Intervall wäre grob ±30 Prozentpunkte. Die Zahl steht da, als wäre
  sie präzise.

Prüfe Alternativen: eine kontinuierliche Desirability-Funktion, ein
Minimum-basierter Index neben dem Mittelwert, eine Anzeige des limitierenden
Nährstoffs. Entscheide begründet und mach die Entscheidung in der Oberfläche
sichtbar.

### C · `lage()` und `ausmass()` sind willkürliche Transformationen

`lage()` bildet auf 0–3 ab, mit unterschiedlicher Bedeutung je nachdem, ob das
Optimum `[lo,hi]`, `[null,hi]` oder `[lo,null]` ist. Dieser Wert wird
**gemittelt** (`bilanz().mittel`). Der Mittelwert einer solchen Skala hat keine
definierte Bedeutung.

`ausmass()` ist die relative Abweichung `(lo-v)/lo`. Sie ist asymmetrisch: eine
Halbierung ergibt 0,5, eine Verdopplung 1,0. Für Konzentrationen wäre ein
logarithmisches Mass richtig. Das steuert die Sortierung der Befunde.

### D · Messunsicherheit ist nirgends modelliert

Blattsaftanalysen haben analytische **und** Probenahmevarianz, und die ist bei
Spurenelementen deutlich grösser als bei Kalium. Die App behandelt alle
Parameter mit derselben pauschalen 5-%-Toleranz.

Ohne eine Schätzung der Varianz ist jeder Vorher-Nachher-Vergleich ohne
Massstab. Kläre: Gibt NovaCropControl Wiederholpräzisionen an? Lassen sie sich
aus den eigenen Daten schätzen (dafür bräuchte es Replikate — siehe F)? Und
wenn nichts davon: Was ist die ehrlichste Behandlung?

### E · Werte unter der Nachweisgrenze sind linksseitig zensierte Daten

Aktuell werden sie ausgeschlossen. Das ist besser als sie als Zahl zu
behandeln, verzerrt aber die Kennzahl nach oben, weil systematisch die tiefen
Werte fehlen. Prüfe die etablierten Verfahren (Substitution, ROS, Kaplan-Meier,
Maximum-Likelihood) und was davon bei n=6 vertretbar ist.

### F · Es gibt kein Konzept für Replikate — und keine Probenahme-Entität

Eine «Erhebung» wird über den Schlüssel `satz|datum|zustand`
**rekonstruiert**, statt explizit modelliert zu werden. Das ist ein Hack. Er
bricht, sobald zwei Proben am selben Tag aus verschiedenen Tischen oder von
verschiedenen Stellen kommen — und genau das bräuchte es für jede
Varianzschätzung.

Entwirf eine saubere Struktur. Mein Vorschlag als Ausgangspunkt, nicht als
Vorgabe:

```
probe        id · datum · uhrzeit · satz · tisch · position · blattalter ·
             kulturbild · tiefe (Substrat) · replikat · stunden_seit_flutung ·
             tage_seit_schnitt · substrattemperatur
messung      probe_id · parameter · wert · einheit · unter_nachweisgrenze ·
             methode · labor · labor_probennummer
referenz     parameter · lo · hi · quelle · gueltig_ab · einheit
```

Die Kovariaten in `probe` sind genau die Störgrössen, die die Übergabe in
Abschnitt 6 nennt. Ohne sie in der Struktur ist eine spätere Korrektur
unmöglich — auch wenn sie heute leer bleiben.

Weitere Strukturprobleme, die du prüfen sollst:

- `analysen[]` ist eine flache Liste mit typabhängigen Feldern. Das erzeugt
  `if(typ==='substrat')`-Verzweigungen quer durch den Code.
- **Optimum-Bereiche liegen redundant in jeder einzelnen Probe.** Sie gehören
  in eine Referenztabelle mit Gültigkeitszeitraum und Quelle. Diese Redundanz
  war die Ursache des Bugs mit dem geteilten Objekt (siehe `BEFUNDE.md` 1.3).
- **Einheiten werden aus dem Schlüsselnamen abgeleitet**, nicht mitgeführt. Bei
  einem Laborwechsel bricht das still.
- Keine Provenienz je Messwert: wer hat wann korrigiert?
- Keine Plausibilitätsprüfung: ein Tippfehler beim manuellen Erfassen (4200
  statt 420) fällt nicht auf.

### G · Der Reiter «Wirkung» macht Inferenz ohne Inferenz

Er vergleicht einen Punkt mit einem Punkt, zeigt Balken und warnt in Prosa
(«Indiz, kein Beweis»). Er sagt aber nicht, **wie gross** eine Änderung sein
müsste, um überhaupt von der normalen Schwankung unterscheidbar zu sein.

Bau das um: eine kleinste erkennbare Differenz aus der geschätzten
Messunsicherheit, und die Aussage «eine Änderung unter X % ist mit eurer
Datenlage nicht von Rauschen zu trennen». Wenn die Varianz nicht schätzbar ist,
sag genau das und benenne, was es dafür bräuchte.

### H · Confounding wird benannt, aber nicht quantifiziert

Kulturalter, Jahreszeit, Satz und Management sind vollständig verschränkt. Die
App listet Vorbehalte in Prosa auf. Besser wäre, die Verschränkung **zu
zeigen**: welche Kontraste sind mit dem vorhandenen Design überhaupt
identifizierbar, welche nicht. Eine kleine Design-Matrix oder eine
Kreuztabelle Satz × Alter × Ereignis leistet das und ist bei n=6 lesbar.

Der Kulturaltereffekt selbst — Nährstoffkonzentrationen verdünnen sich mit dem
Wachstum — ist nirgends geschätzt und wird nirgends herausgerechnet. Sieh vor,
dass es später möglich wird, und sag, ab wie vielen mehrfach beprobten Sätzen.

### I · Die Substratanbindung klassifiziert gegen erfundene Schwellen

`RICHT_VORGABE` sind gesetzte Annahmen (als solche gekennzeichnet), und das
Zeitfenster von ±28 Tagen ist eine Ad-hoc-Regel ohne Modell. Ehrlicher wäre,
die Beziehung Substratwert ↔ Blattwert aus den eigenen Daten zu schätzen,
sobald genug da sind, und bis dahin die Paare nur nebeneinanderzustellen, ohne
Verdikt.

### J · Kleinere statistische Unsauberkeiten

- `wiederkehrend()` zählt Befunde **ohne Nenner** («3×» — von wie vielen?) und
  addiert über verschiedene Sätze hinweg: Pseudoreplikation.
- Das Index-Diagramm zieht eine **Linie** zwischen Punkten verschiedener Sätze
  und suggeriert damit Kontinuität, die es nicht gibt.
- `bilanz()` mittelt über Erhebungen unterschiedlicher Sätze und Alter, als
  wären sie austauschbar.
- Keine Ausreissererkennung.

---

## Was am Ende dastehen soll

1. **Eine Datenstruktur, die trägt** — mit expliziter Probenahme-Entität,
   Kovariaten, getrennter Referenztabelle, mitgeführten Einheiten und
   Provenienz. Sie soll auch dann noch richtig sein, wenn in drei Jahren 200
   Analysen drin liegen.
2. **Auswertungen, die bei n=6 gültig sind** — und für alles andere eine
   sichtbare Sperre mit der Angabe, wie viele Erhebungen noch fehlen.
3. **Eine Seite «Was können wir mit diesen Daten sagen und was nicht»**, die
   das quantifiziert statt es zu umschreiben. Das ist die wertvollste neue
   Ansicht, die du bauen kannst.
4. **Ein Beprobungsdesign im Planer**, das aus der Statistik folgt: Replikate,
   gepaarte Beprobung desselben Satzes, Kontrollgruppen, feste Uhrzeit und
   fester Abstand zur Flutung. Mit der Begründung, was jede Massnahme
   auswertbar macht.

---

## Leitplanken — nicht verhandelbar

- **Eine einzige HTML-Datei** bleibt das Lieferformat. Kein Build, kein
  Bundler, keine Modulaufteilung, keine neuen Abhängigkeiten ausser pdf.js.
  Wenn du Statistik brauchst, schreibst du sie selbst und kommentierst die
  Formel.
- Kein localStorage, kein Ordnerzugriff, kein Automatismus beim Speichern.
- **Firefox muss funktionieren.**
- Deutsch, Schweizer Rechtschreibung (**ss statt ß**), keine englischen
  Bezeichner in der Oberfläche.
- Jede gesetzte Schwelle und jede Annahme bleibt im Feld `regel:` bzw. als
  «Annahme» gekennzeichnet und in den Einstellungen änderbar.
- **Schemawechsel brauchen einen Migrationspfad.** `db.schema` ist 4. Beim
  Öffnen einer älteren Datei migrierst du automatisch und zeigst im Dialog,
  was angepasst wurde. Die alte Datei des Anwenders bleibt unverändert liegen.
  Diese Umstellung wird gross — der Migrationspfad ist deshalb Teil der
  Aufgabe, nicht eine Fussnote.
- Dünger-Dosierungsrechnung, Giesswasser-Parser und Nützlingserfassung bleiben
  zurückgestellt. Bau sie nicht ungefragt.

---

## Vorgehen

**Erst berichten, dann ändern.** Arbeite in dieser Reihenfolge:

1. Code und Daten lesen, die Verdachtsliste oben **einzeln verifizieren**.
   Rechne jede Hypothese an den echten Daten durch — `pruefung/seiten.json`
   und `pruefung/testdaten.json` liegen bereit. Was du nicht reproduzieren
   kannst, ist keine Schwachstelle.
2. Weitersuchen. Die Liste ist nicht abschliessend.
3. **Berichten**: Was stimmt, was nicht, was du gefunden hast, was du
   vorschlägst — mit dem Unterschied, den jede Änderung an den echten Zahlen
   macht. Wo eine Entscheidung fachlich ist und nicht technisch, leg sie mir
   vor, statt sie stillschweigend zu treffen.
4. Erst danach umbauen, in der Reihenfolge Schaden pro Aufwand.

**Prüfpflicht.** Es gibt kein Testframework; der Weg ist in
`pruefung/LIESMICH.md` beschrieben und funktioniert. Für jede Änderung gilt:

- eine Prüfung in `pruefung/`, die fehlschlägt, wenn die Änderung zurückfällt
- alle Reiter rendern, mit leerer und mit gefüllter Datenbank
- Parser weiterhin fehlerfrei gegen `seiten.json` (23 von 23 Parametern)
- Migration aus Schema 4 mit `testdaten.json` verlustfrei
- Browsertest (`pruefung/browser.js`) grün

Und für jede Änderung erklärst du, **warum sie statistisch oder agronomisch
richtig ist** — nicht nur, dass sie den Code aufräumt.
