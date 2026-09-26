# Basilikum · Server. Ein Abbild ohne Abhängigkeiten: Node, die zwei Seiten,
# server.js. Der Bestand liegt unter /daten – dort gehört ein Volume hin,
# sonst ist er beim nächsten Neustart des Containers weg.
FROM node:22-alpine
WORKDIR /app
COPY server.js basilikum.html erfassen.html ./
ENV PORT=8080 DATEN=/daten
VOLUME ["/daten"]
EXPOSE 8080
HEALTHCHECK --interval=60s --timeout=5s CMD wget -qO- http://127.0.0.1:8080/gesund || exit 1
CMD ["node","server.js"]
