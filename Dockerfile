# Etapa 1 — Build do frontend
FROM node:18 AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Etapa 2 — Copiar o build para volume compartilhado
FROM alpine:3.18
WORKDIR /app
COPY --from=build /app/dist ./dist
CMD ["sh", "-c", "cp -r /app/dist/* /srv/sistema-setasc/frontend/dist/ || true && tail -f /dev/null"]
