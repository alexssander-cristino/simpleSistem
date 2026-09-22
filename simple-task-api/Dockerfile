# ---- Stage 1: build (instala dependências, incluindo as de compilação nativa) ----
FROM node:20-alpine AS build
WORKDIR /app
RUN apk add --no-cache python3 make g++
COPY package*.json ./
RUN npm ci --omit=dev

# ---- Stage 2: runtime (imagem final, enxuta) ----
FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV DB_PATH=/app/data/data.sqlite

COPY --from=build /app/node_modules ./node_modules
COPY package*.json ./
COPY src ./src

RUN mkdir -p /app/data && chown -R node:node /app
USER node

EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO- http://localhost:3000/health || exit 1

CMD ["node", "src/server.js"]
