# Basilikum · Server. Ein Abbild ohne Abhängigkeiten: Node, die zwei Seiten,
# server.js. Der Bestand liegt unter /daten.
#
# Kein «VOLUME» hier: Railway lehnt die Anweisung ab und bricht den Bau ab.
# Das Volume wird in Railway angehängt (ONLINE.md, Teil D, Mount Path /daten);
# anderswo mit  docker run -v basilikum-daten:/daten …
FROM node:22-alpine
WORKDIR /app
COPY server.js basilikum.html erfassen.html ./
ENV PORT=8080 DATEN=/daten
EXPOSE 8080
CMD ["node","server.js"]
