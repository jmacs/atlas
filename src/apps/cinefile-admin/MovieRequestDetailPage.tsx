import type {MovieRequest} from '#lib/cinefile/movie-requests.ts';
import type {MovieDbMovieDetails} from '#lib/movie-db/movie-details.ts';
import {formatDate} from '#lib/utils/dates.ts';
import {ArrowLeft, Check, Clock, ImageOff, Search, Star} from '@lucide/icons';

import {Alert} from '../../ui/Alert.tsx';
import {Badge} from '../../ui/Badge.tsx';
import {Button, buttonClassNames} from '../../ui/Button.tsx';
import {DescriptionList, DescriptionListItem} from '../../ui/DescriptionList.tsx';
import {Icon} from '../../ui/Icon.tsx';
import {CinefileAdminLayout} from './CinefileAdminLayout.tsx';

type MovieRequestDetailPageProps = {
  movie?: MovieDbMovieDetails;
  request: MovieRequest;
};

export function MovieRequestDetailPage({movie, request}: MovieRequestDetailPageProps) {
  const title = movie?.title ?? request.title;
  const year = movie?.year ?? request.year ?? undefined;
  const posterPath = movie?.posterPath ?? request.posterPath ?? undefined;
  const runtime =
    movie?.runtimeMinutes === undefined ? undefined : formatRuntime(movie.runtimeMinutes);
  const rating = movie?.rating === undefined ? undefined : movie.rating.toFixed(1);
  return (
    <CinefileAdminLayout activePath="/cinefile-admin/requests" title={title}>
      <a href="/cinefile-admin/requests" class={buttonClassNames('ghost', 'sm', '-ml-3 mb-6')}>
        <Icon icon={ArrowLeft} size={16} aria-hidden="true" />
        All requests
      </a>
      {movie === undefined ? (
        <Alert class="mb-6" variant="warning">
          TMDB movie details are unavailable. Showing the information saved with the request.
        </Alert>
      ) : null}
      <article>
        <div class="grid items-start gap-8 sm:grid-cols-[10rem_minmax(0,1fr)] lg:grid-cols-[12rem_minmax(0,1fr)]">
          <MoviePoster posterPath={posterPath} title={title} />

          <div class="min-w-0">
            <header class="relative isolate overflow-hidden rounded-card bg-surface p-6">
              {movie?.backdropPath === undefined ? null : (
                <img
                  class="absolute inset-0 -z-20 size-full object-cover"
                  src={`https://image.tmdb.org/t/p/w1280${movie.backdropPath}`}
                  alt=""
                />
              )}
              <div class="absolute inset-0 -z-10 bg-gradient-to-r from-background via-background/90 to-background/40" />
              <Badge class="gap-1.5" variant="accent">
                <Icon icon={Check} size={13} aria-hidden="true" />
                Requested
              </Badge>
              <h1 class="type-display mt-4 text-foreground">{title}</h1>
              {movie?.tagline === undefined ? null : (
                <p class="type-body mt-2 italic text-muted">{movie.tagline}</p>
              )}
              <div class="type-body-small mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 text-muted">
                {year === undefined ? null : <span>{year}</span>}
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

            <div class="mt-8 grid gap-8 border-t border-border/80 py-8">
              {movie?.overview === undefined ? null : (
                <section aria-labelledby="movie-overview-heading">
                  <h2 id="movie-overview-heading" class="type-label text-muted">
                    Overview
                  </h2>
                  <p class="type-body mt-3 max-w-2xl text-foreground">{movie.overview}</p>
                </section>
              )}
              {movie === undefined || movie.genres.length === 0 ? null : (
                <ul class="flex flex-wrap gap-2" aria-label="Genres">
                  {movie.genres.map((genre) => (
                    <li key={genre}>
                      <Badge variant="neutral">{genre}</Badge>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <section
              class="border-t border-border/80 pt-8"
              aria-labelledby="request-details-heading"
            >
              <h2 id="request-details-heading" class="type-heading-2">
                Request details
              </h2>
              <DescriptionList class="mt-5 gap-5 rounded-card border border-border/70 bg-surface/50 p-5 md:grid-cols-3">
                <DescriptionListItem label="Requested">
                  {formatDate(request.requestedAt)}
                </DescriptionListItem>
                <DescriptionListItem label="TMDB ID">{request.tmdbId}</DescriptionListItem>
                <DescriptionListItem label="Request ID">
                  <span class="break-all">{request.id}</span>
                </DescriptionListItem>
              </DescriptionList>
            </section>

            <section
              class="mt-8 flex flex-wrap gap-3 border-t border-border/80 pt-8"
              aria-label="Request actions"
            >
              <Button>
                <Icon icon={Check} size={18} aria-hidden="true" />
                Mark request as complete
              </Button>
              <Button variant="secondary">
                <Icon icon={Search} size={18} aria-hidden="true" />
                Search
              </Button>
            </section>
          </div>
        </div>
      </article>
    </CinefileAdminLayout>
  );
}

type MoviePosterProps = {
  posterPath?: string;
  title: string;
};

function MoviePoster({posterPath, title}: MoviePosterProps) {
  if (posterPath !== undefined) {
    return (
      <div class="mx-auto aspect-[2/3] w-40 overflow-hidden rounded-card border border-border bg-surface shadow-xl shadow-shadow/40 sm:mx-0 sm:w-full">
        <img
          class="size-full object-cover"
          src={`https://image.tmdb.org/t/p/w500${posterPath}`}
          alt={`Poster for ${title}`}
        />
      </div>
    );
  }
  return (
    <div
      class="mx-auto grid aspect-[2/3] w-40 place-items-center rounded-card border border-border bg-surface-raised text-muted shadow-xl shadow-shadow/40 sm:mx-0 sm:w-full"
      aria-label="Poster unavailable"
    >
      <Icon icon={ImageOff} size={32} aria-hidden="true" />
    </div>
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
