FROM node:24-bookworm-slim AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY lib ./lib
COPY fixtures ./fixtures
COPY public ./public
COPY src ./src
COPY tsconfig.json tsconfig.build.json ./

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

# Required external-service settings. Supply these at runtime, for example
# with `docker run -e JELLYFIN_SERVER -e JELLYFIN_API_KEY -e TMDB_TOKEN ...`.
ENV JELLYFIN_SERVER=
ENV JELLYFIN_API_KEY=
ENV TMDB_TOKEN=

COPY package.json package-lock.json ./
RUN npm ci --omit=dev \
  && mkdir -p /appdata /library/movies /library/books \
  && chown node:node /appdata

COPY --from=build /app/dist ./dist
COPY --from=build /app/public ./public
COPY lib ./lib
COPY fixtures ./fixtures

USER node
EXPOSE 3000
VOLUME ["/appdata", "/library/movies", "/library/books"]
CMD ["node", "dist/main.js"]
