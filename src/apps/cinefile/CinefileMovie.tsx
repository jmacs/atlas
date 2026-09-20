import {ImageOff} from '@lucide/icons';

import {Icon} from '../../ui/Icon.tsx';

export type CinefileMovie = {
  href: string;
  id: string;
  posterUrl?: string;
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
            class="group block overflow-hidden rounded-card border border-border bg-surface shadow-sm transition hover:border-accent/60 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
            href={movie.href}
          >
            <MoviePoster movie={movie} />
            <span class="block p-3">
              <span class="type-heading-3 block truncate text-foreground">{movie.title}</span>
              {movie.year === undefined ? null : (
                <span class="type-body-small mt-1 block text-muted">{movie.year}</span>
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
  if (movie.posterUrl !== undefined) {
    return (
      <img
        class="aspect-[2/3] w-full bg-surface-raised object-cover"
        src={movie.posterUrl}
        alt=""
      />
    );
  }
  return (
    <span
      class="grid aspect-[2/3] w-full place-items-center bg-surface-raised text-muted"
      aria-hidden="true"
    >
      <Icon icon={ImageOff} size={28} />
    </span>
  );
}

type CinefileMoviePageProps = {
  movie: CinefileMovie;
};

export function CinefileMoviePage({movie}: CinefileMoviePageProps) {
  return (
    <section class="mx-auto max-w-md text-center">
      <MoviePoster movie={movie} />
      <h1 class="type-heading-1 mt-6 text-foreground">{movie.title}</h1>
      {movie.year === undefined ? null : <p class="type-body mt-2 text-muted">{movie.year}</p>}
      <p class="type-body mt-6 text-muted">Movie details are coming soon.</p>
    </section>
  );
}
