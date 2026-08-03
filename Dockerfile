# syntax=docker/dockerfile:1

FROM node:20-bookworm-slim AS frontend-build
WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

FROM node:20-bookworm-slim AS backend-dependencies
WORKDIR /app/backend
COPY backend/package.json backend/package-lock.json ./
COPY backend/prisma ./prisma
RUN npm ci && npx prisma generate && npm prune --omit=dev

FROM node:20-bookworm-slim AS runtime
ENV NODE_ENV=production
ENV PORT=3333
WORKDIR /app

COPY --from=backend-dependencies --chown=node:node /app/backend/node_modules ./backend/node_modules
COPY --chown=node:node backend/package.json ./backend/package.json
COPY --chown=node:node backend/prisma ./backend/prisma
COPY --chown=node:node backend/src ./backend/src
COPY --from=frontend-build --chown=node:node /app/frontend/dist ./frontend/dist

USER node
EXPOSE 3333
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3333/health').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"

CMD ["node", "backend/src/server.js"]
