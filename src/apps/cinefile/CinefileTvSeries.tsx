import {Check, Clock, CloudOff, ImageOff, Minus, Plus, Star, Trash2} from '@lucide/icons';

import {Badge} from '../../ui/Badge.tsx';
import {Button} from '../../ui/Button.tsx';
import {Icon} from '../../ui/Icon.tsx';
import type {CatalogStatus, MovieRequestStatus} from './CinefileMovie.tsx';

export type CinefileTvSeriesDetails = {
  backdropUrl?: string;
  catalogStatus: CatalogStatus;
  episodeRuntimeMinutes?: number;
  genres: string[];
  numberOfEpisodes: number;
  numberOfSeasons: number;
  overview?: string;
  posterUrl?: string;
  rating?: number;
  request?: TvSeriesRequestState;
  tagline?: string;
  title: string;
  year?: number;
};

type TvSeriesRequestState = {
  status: MovieRequestStatus;
  tmdbId: number;
};

type CinefileTvSeriesPageProps = {
  series: CinefileTvSeriesDetails;
};

export function CinefileTvSeriesPage({series}: CinefileTvSeriesPageProps) {
  const runtime =
    series.episodeRuntimeMinutes === undefined
      ? undefined
      : formatRuntime(series.episodeRuntimeMinutes);
  const rating = series.rating === undefined ? undefined : series.rating.toFixed(1);
  return (
    <article>
      <div class="relative min-h-52 overflow-hidden rounded-card bg-surface sm:aspect-[16/7]">
        {series.backdropUrl === undefined ? null : (
          <img class="absolute inset-0 size-full object-cover" src={series.backdropUrl} alt="" />
        )}
        <div class="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />
      </div>

      <div class="relative -mt-20 px-4 sm:-mt-28 sm:px-8">
        <div class="grid items-end gap-7 sm:grid-cols-[12rem_minmax(0,1fr)]">
          <TvSeriesPoster series={series} />
          <header class="min-w-0 pb-1">
            <TvCatalogStatus status={series.catalogStatus} />
            <h1 class="type-display mt-4 text-foreground">{series.title}</h1>
            {series.tagline === undefined ? null : (
              <p class="type-body mt-2 italic text-muted">{series.tagline}</p>
            )}
            <div class="type-body-small mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 text-muted">
              {series.year === undefined ? null : <span>{series.year}</span>}
              <span>
                {series.numberOfSeasons} {series.numberOfSeasons === 1 ? 'season' : 'seasons'}
              </span>
              <span>
                {series.numberOfEpisodes} {series.numberOfEpisodes === 1 ? 'episode' : 'episodes'}
              </span>
              {runtime === undefined ? null : (
                <span class="inline-flex items-center gap-1.5">
                  <Icon icon={Clock} size={15} aria-hidden="true" />
                  {runtime} per episode
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
          {series.overview === undefined ? null : (
            <section aria-labelledby="tv-overview-heading">
              <h2 id="tv-overview-heading" class="type-label text-muted">
                Overview
              </h2>
              <p class="type-body mt-3 max-w-2xl text-foreground">{series.overview}</p>
            </section>
          )}
          {series.genres.length === 0 ? null : (
            <ul class="flex flex-wrap gap-2" aria-label="Genres">
              {series.genres.map((genre) => (
                <li key={genre}>
                  <Badge variant="neutral">{genre}</Badge>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      {series.catalogStatus === 'not-included' && series.request !== undefined ? (
        <TvSeriesRequestAction {...series.request} />
      ) : null}
    </article>
  );
}

type TvSeriesRequestActionProps = TvSeriesRequestState & {oob?: boolean};

export function TvSeriesRequestAction({oob = false, status, tmdbId}: TvSeriesRequestActionProps) {
  if (status === 'unavailable') {
    return null;
  }
  const isRequested = status === 'requested';
  const method = isRequested
    ? {'hx-delete': `/cinefile/tvseries/tmdb/${tmdbId}/request`}
    : {'hx-post': `/cinefile/tvseries/tmdb/${tmdbId}/request`};
  return (
    <section
      id="tvseries-request-action"
      class="mt-8 border-t border-border/80 pt-8"
      hx-swap-oob={oob ? 'outerHTML' : undefined}
      aria-label="TV series request"
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
              {isRequested ? 'Remove from request queue' : 'Get this TV series'}
            </span>
            <span class="type-body-small mt-1 block opacity-80">
              {isRequested
                ? 'Cancel your request to add this TV series to Jellyfin.'
                : 'Request that this TV series be added to your Jellyfin catalog.'}
            </span>
          </span>
        </Button>
      </form>
    </section>
  );
}

type TvSeriesPosterProps = {series: CinefileTvSeriesDetails};

function TvSeriesPoster({series}: TvSeriesPosterProps) {
  if (series.posterUrl !== undefined) {
    return (
      <div class="mx-auto aspect-[2/3] w-48 overflow-hidden rounded-card border border-border bg-surface shadow-xl shadow-shadow/40 sm:mx-0 sm:w-full">
        <img
          class="size-full object-cover"
          src={series.posterUrl}
          alt={`Poster for ${series.title}`}
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

type TvCatalogStatusProps = {status: CatalogStatus};

function TvCatalogStatus({status}: TvCatalogStatusProps) {
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
