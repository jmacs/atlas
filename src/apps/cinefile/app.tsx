import {Hono} from 'hono';

import {createCatalogStore} from '#lib/jellyfin/catalog.ts';
import {searchMovieDb} from '#lib/movie-db/movie-search.ts';
import type {AtlasApp, AtlasEnv} from '../../system/contracts.ts';
import {CinefileHomePage} from './CinefileHomePage.tsx';
import {CinefileMoviePage, type CinefileMovie} from './CinefileMovie.tsx';
import {CinefileSearchPage} from './CinefileSearchPage.tsx';
import {CinefileTmdbSearchPage} from './CinefileTmdbSearchPage.tsx';
import {CinefileLayout} from './CinefileLayout.tsx';

const app = new Hono<AtlasEnv>();

app.get('/', (c) => c.html(<CinefileHomePage />));
app.get('/search', (c) => c.html(<CinefileSearchPage status="form" />));

app.get('/search/results', async (c) => {
  const query = c.req.query('q')?.trim();
  if (!query) {
    return c.html(<CinefileSearchPage status="form" />);
  }

  const catalog = await createCatalogStore().read();
  if (catalog.kind !== 'ready') {
    return c.html(<CinefileSearchPage query={query} status="unavailable" />);
  }
  const normalizedQuery = query.toLocaleLowerCase();
  const matches = catalog.catalog.movies.filter((movie) =>
    movie.name.toLocaleLowerCase().includes(normalizedQuery),
  );
  const results = matches
    .slice(0, 10)
    .map((movie) => catalogMovie(movie.id, movie.name, movie.year));
  const status = matches.length === 0 ? 'empty' : 'results';
  return c.html(
    <CinefileSearchPage
      query={query}
      resultCount={matches.length}
      results={results}
      status={status}
    />,
  );
});

app.get('/movies/catalog/:movieId', async (c) => {
  const catalog = await createCatalogStore().read();
  const movie =
    catalog.kind === 'ready'
      ? catalog.catalog.movies.find((item) => item.id === c.req.param('movieId'))
      : undefined;
  if (!movie) {
    return c.notFound();
  }
  return c.html(
    <CinefileLayout title={movie.name}>
      <CinefileMoviePage movie={catalogMovie(movie.id, movie.name, movie.year)} />
    </CinefileLayout>,
  );
});

app.get('/tmdb-search', (c) => c.html(<CinefileTmdbSearchPage status="form" />));

app.get('/tmdb-search/results', async (c) => {
  const query = c.req.query('q')?.trim();
  if (!query) {
    return c.html(<CinefileTmdbSearchPage status="form" />);
  }
  try {
    const results = (await searchMovieDb(query)).map((movie) => movieDbMovie(movie));
    const status = results.length === 0 ? 'empty' : 'results';
    return c.html(<CinefileTmdbSearchPage query={query} results={results} status={status} />);
  } catch {
    return c.html(<CinefileTmdbSearchPage query={query} status="error" />, 502);
  }
});

app.get('/movies/tmdb/:movieId', (c) => {
  const title = c.req.query('title')?.trim() || 'Movie';
  const year = numericYear(c.req.query('year'));
  const movie: CinefileMovie = {href: c.req.path, id: c.req.param('movieId'), title, ...year};
  return c.html(
    <CinefileLayout title={movie.title}>
      <CinefileMoviePage movie={movie} />
    </CinefileLayout>,
  );
});

function catalogMovie(id: string, title: string, year?: number): CinefileMovie {
  return {href: `/cinefile/movies/catalog/${id}`, id, title, ...(year === undefined ? {} : {year})};
}

function movieDbMovie(movie: Awaited<ReturnType<typeof searchMovieDb>>[number]): CinefileMovie {
  const query = new URLSearchParams({title: movie.title});
  if (movie.year !== undefined) {
    query.set('year', String(movie.year));
  }
  return {
    href: `/cinefile/movies/tmdb/${movie.id}?${query}`,
    id: String(movie.id),
    ...(movie.posterPath === undefined
      ? {}
      : {posterUrl: `https://image.tmdb.org/t/p/w342${movie.posterPath}`}),
    title: movie.title,
    ...(movie.year === undefined ? {} : {year: movie.year}),
  };
}

function numericYear(value: string | undefined): {year?: number} {
  const year = Number(value);
  return Number.isInteger(year) ? {year} : {};
}

export const cinefileApp: AtlasApp = {
  id: 'cinefile',
  isPublic: true,
  mountPath: '/cinefile',
  app,
};
