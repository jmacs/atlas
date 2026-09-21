import {Check, Clock, CloudOff, ImageOff, Minus, Plus, Star, Trash2} from '@lucide/icons';

import {formatDate} from '#lib/utils/dates.ts';
import {Alert} from '../../ui/Alert.tsx';
import {Badge} from '../../ui/Badge.tsx';
import {Button} from '../../ui/Button.tsx';
import {Icon} from '../../ui/Icon.tsx';

export type CinefileMovie = {
  href: string;
  id: string;
  isInCatalog?: boolean;
  posterUrl?: string;
  requestedAt?: string;
  title: string;
  year?: number;
};

type CinefileMovieTilesProps = {
  movies: CinefileMovie[];
};

export function CinefileMovieTiles({movies}: CinefileMovieTilesProps) {
  return (
    <ul class="grid grid-cols-2 gap-4 sm:grid-cols-3">
      {movies.map((movie) => (
        <li key={movie.id}>
          <a
            class="group flex h-full flex-col overflow-hidden rounded-card border border-border bg-surface shadow-sm transition hover:border-accent/60 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
            href={movie.href}
          >
            <MoviePoster movie={movie} />
            <span class="block flex-1 p-3">
              <span class="type-heading-3 block truncate text-foreground">{movie.title}</span>
              {movie.year === undefined ? null : (
                <span class="type-body-small mt-1 block text-muted">{movie.year}</span>
              )}
              {movie.requestedAt === undefined ? null : (
                <time class="type-body-small mt-1 block text-muted" dateTime={movie.requestedAt}>
                  Requested {formatDate(movie.requestedAt)}
                </time>
              )}
            </span>
          </a>
        </li>
      ))}
    </ul>
  );
}

type MoviePosterProps = {
  movie: CinefileMovie;
};

function MoviePoster({movie}: MoviePosterProps) {
  return (
    <span class="relative block aspect-[2/3] w-full shrink-0 overflow-hidden bg-surface-raised">
      {movie.posterUrl !== undefined ? (
        <>
          <PosterLoadingPlaceholder />
          <img class="absolute inset-0 size-full object-cover" src={movie.posterUrl} alt="" />
        </>
      ) : (
        <span class="grid size-full place-items-center text-muted" aria-hidden="true">
          <Icon icon={ImageOff} size={28} />
        </span>
      )}
      {movie.isInCatalog ? (
        <span
          aria-label="In catalog"
          class="absolute top-2 right-2 grid size-7 place-items-center rounded-full bg-accent text-accent-foreground shadow-sm"
        >
          <Icon icon={Check} size={16} />
        </span>
      ) : null}
    </span>
  );
}

function PosterLoadingPlaceholder() {
  return (
    <span class="absolute inset-0 motion-safe:animate-pulse" aria-hidden="true">
      <span class="absolute inset-x-5 top-5 h-3/5 rounded-lg bg-border/50" />
      <span class="absolute inset-x-5 bottom-12 h-3 rounded-full bg-border" />
      <span class="absolute bottom-6 left-5 h-2.5 w-2/5 rounded-full bg-border/70" />
    </span>
  );
}

type CinefileMoviePageProps = {
  movie: CinefileMovieDetails;
};

export function CinefileMoviePage({movie}: CinefileMoviePageProps) {
  const runtime =
    movie.runtimeMinutes === undefined ? undefined : formatRuntime(movie.runtimeMinutes);
  const rating = movie.rating === undefined ? undefined : movie.rating.toFixed(1);
  return (
    <>
      {movie.detailSource === 'catalog' ? (
        <Alert class="mb-6" variant="warning">
          TMDB details are unavailable. Showing the information saved in your catalog.
        </Alert>
      ) : null}
      <article>
        <div class="relative min-h-52 overflow-hidden rounded-card bg-surface sm:aspect-[16/7]">
          {movie.backdropUrl === undefined ? null : (
            <img class="absolute inset-0 size-full object-cover" src={movie.backdropUrl} alt="" />
          )}
          <div class="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />
        </div>

        <div class="relative -mt-20 px-4 sm:-mt-28 sm:px-8">
          <div class="grid items-end gap-7 sm:grid-cols-[12rem_minmax(0,1fr)]">
            <MovieDetailPoster movie={movie} />
            <header class="min-w-0 pb-1">
              <CatalogStatus status={movie.catalogStatus} />
              <h1 class="type-display mt-4 text-foreground">{movie.title}</h1>
              {movie.tagline === undefined ? null : (
                <p class="type-body mt-2 italic text-muted">{movie.tagline}</p>
              )}
              <div class="type-body-small mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 text-muted">
                {movie.year === undefined ? null : <span>{movie.year}</span>}
                {runtime === undefined ? null : (
                  <span class="inline-flex items-center gap-1.5">
                    <Icon icon={Clock} size={15} aria-hidden="true" />
                    {runtime}
                  </span>
                )}
                {rating === undefined ? null : (
                  <span class="inline-flex items-center gap-1.5" aria-label={`${rating} out of 10`}>
                    <Icon class="text-accent" icon={Star} size={15} aria-hidden="true" />
                    {rating}
                  </span>
                )}
              </div>
            </header>
          </div>

          <div class="mt-8 grid gap-8 border-t border-border/80 py-8 sm:ml-[14rem]">
            {movie.overview === undefined ? null : (
              <section aria-labelledby="movie-overview-heading">
                <h2 id="movie-overview-heading" class="type-label text-muted">
                  Overview
                </h2>
                <p class="type-body mt-3 max-w-2xl text-foreground">{movie.overview}</p>
              </section>
            )}
            {movie.genres.length === 0 ? null : (
              <ul class="flex flex-wrap gap-2" aria-label="Genres">
                {movie.genres.map((genre) => (
                  <li>
                    <Badge variant="neutral">{genre}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        {movie.catalogStatus === 'not-included' && movie.request !== undefined ? (
          <MovieRequestAction {...movie.request} />
        ) : null}
      </article>
    </>
  );
}

export type CatalogStatus = 'included' | 'not-included' | 'unavailable';

export type CinefileMovieDetails = {
  backdropUrl?: string;
  catalogStatus: CatalogStatus;
  detailSource: 'catalog' | 'tmdb';
  genres: string[];
  overview?: string;
  posterUrl?: string;
  rating?: number;
  runtimeMinutes?: number;
  tagline?: string;
  title: string;
  request?: MovieRequestState;
  year?: number;
};

export type MovieRequestStatus = 'not-requested' | 'requested' | 'unavailable';

type MovieRequestState = {
  status: MovieRequestStatus;
  tmdbId: number;
};

type MovieRequestActionProps = MovieRequestState & {
  oob?: boolean;
};

export function MovieRequestAction({oob = false, status, tmdbId}: MovieRequestActionProps) {
  if (status === 'unavailable') {
    return null;
  }
  const isRequested = status === 'requested';
  const method = isRequested
    ? {'hx-delete': `/cinefile/movies/tmdb/${tmdbId}/request`}
    : {
        'hx-post': `/cinefile/movies/tmdb/${tmdbId}/request`,
      };
  return (
    <section
      id="movie-request-action"
      class="mt-8 border-t border-border/80 pt-8"
      hx-swap-oob={oob ? 'outerHTML' : undefined}
      aria-label="Movie request"
    >
      <form {...method} hx-swap="none">
        <Button
          class="h-auto w-full justify-start rounded-card p-5 text-left sm:p-6"
          type="submit"
          variant={isRequested ? 'danger' : 'primary'}
          isLoading="htmx"
        >
          <Icon icon={isRequested ? Trash2 : Plus} size={24} />
          <span class="min-w-0">
            <span class="type-heading-3 block">
              {isRequested ? 'Remove from request queue' : 'Get this movie'}
            </span>
            <span class="type-body-small mt-1 block opacity-80">
              {isRequested
                ? 'Cancel your request to add this movie to Jellyfin.'
                : 'Request that this movie be added to your Jellyfin catalog.'}
            </span>
          </span>
        </Button>
      </form>
    </section>
  );
}

type MovieDetailPosterProps = {
  movie: CinefileMovieDetails;
};

function MovieDetailPoster({movie}: MovieDetailPosterProps) {
  if (movie.posterUrl !== undefined) {
    return (
      <div class="mx-auto aspect-[2/3] w-48 overflow-hidden rounded-card border border-border bg-surface shadow-xl shadow-shadow/40 sm:mx-0 sm:w-full">
        <img
          class="size-full object-cover"
          src={movie.posterUrl}
          alt={`Poster for ${movie.title}`}
        />
      </div>
    );
  }
  return (
    <div
      class="mx-auto grid aspect-[2/3] w-48 place-items-center rounded-card border border-border bg-surface-raised text-muted shadow-xl shadow-shadow/40 sm:mx-0 sm:w-full"
      aria-label="Poster unavailable"
    >
      <Icon icon={ImageOff} size={32} aria-hidden="true" />
    </div>
  );
}

type CatalogStatusProps = {
  status: CatalogStatus;
};

function CatalogStatus({status}: CatalogStatusProps) {
  if (status === 'included') {
    return (
      <Badge class="gap-1.5" variant="accent">
        <Icon icon={Check} size={13} aria-hidden="true" />
        In your catalog
      </Badge>
    );
  }
  if (status === 'not-included') {
    return (
      <Badge class="gap-1.5" variant="neutral">
        <Icon icon={Minus} size={13} aria-hidden="true" />
        Not in your catalog
      </Badge>
    );
  }
  return (
    <Badge class="gap-1.5" variant="neutral">
      <Icon icon={CloudOff} size={13} aria-hidden="true" />
      Catalog unavailable
    </Badge>
  );
}

function formatRuntime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (hours === 0) {
    return `${remainingMinutes}m`;
  }
  return remainingMinutes === 0 ? `${hours}h` : `${hours}h ${remainingMinutes}m`;
}
