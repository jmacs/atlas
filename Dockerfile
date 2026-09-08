FROM node:24-bookworm-slim AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY config.ts ./config.ts
COPY database ./database
COPY src ./src
COPY public ./public
COPY tsconfig.json tsconfig.build.json ./
COPY actions ./actions

RUN npm run build

FROM node:24-bookworm-slim

WORKDIR /app
ENV NODE_ENV=production

# Durable application state. Bind-mount the Unraid appdata directory here.
ENV ATLAS_APPDATA_DIR=/appdata

# External libraries. Bind-mount these paths read-only; their contents are not
# application state and must never be modified by Atlas.
ENV ATLAS_MOVIES_DIR=/library/movies
ENV ATLAS_BOOKS_DIR=/library/books

COPY package.json package-lock.json ./
RUN npm ci --omit=dev \
  && mkdir -p /appdata /library/movies /library/books \
  && chown node:node /appdata

COPY --from=build /app/dist ./dist
COPY config.ts ./config.ts
COPY database ./database
COPY --from=build /app/public ./public
COPY actions ./actions

USER node
EXPOSE 3000
VOLUME ["/appdata", "/library/movies", "/library/books"]
CMD ["node", "dist/main.js"]
