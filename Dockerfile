FROM node:24-bookworm-slim AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY database ./database
COPY server ./server
COPY tsconfig.json tsconfig.build.json ./
COPY worker ./worker

RUN npm run build

FROM node:24-bookworm-slim

WORKDIR /app
ENV NODE_ENV=production
ENV ATLAS_APPDATA_DIR=/appdata

COPY package.json package-lock.json ./
RUN npm ci --omit=dev \
  && mkdir /appdata \
  && chown node:node /appdata

COPY --from=build /app/dist ./dist
COPY database ./database
COPY public ./public
COPY worker ./worker

USER node
EXPOSE 3000
VOLUME ["/appdata"]
CMD ["node", "dist/server/main.js"]
