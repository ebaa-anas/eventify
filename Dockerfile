# build stage: install all deps, generate the prisma client, compile TS
FROM node:24-slim AS build
WORKDIR /app
COPY package*.json prisma.config.ts ./
COPY prisma ./prisma
RUN npm ci
COPY . .
RUN npx prisma generate && npm run build

# runtime stage: prod deps only, non-root user, direct node so signals work
FROM node:24-slim
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=build /app/dist ./dist
COPY --from=build /app/src/generated ./src/generated
USER node
EXPOSE 3000
CMD ["node", "dist/server.js"]# build stage: install all deps and generate the prisma client
FROM node:24-slim AS build
WORKDIR /app
COPY package*.json prisma.config.ts ./
COPY prisma ./prisma
RUN npm ci
COPY . .
RUN npx prisma generate

# runtime stage: prod deps only, non-root user
# no dist/ step here - Node 24 runs TypeScript files directly (type stripping)
FROM node:24-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=build /app/src ./src
COPY --from=build /app/prisma.config.ts ./
COPY start.sh ./
USER node
EXPOSE 3000
CMD ["node", "src/server.ts"]