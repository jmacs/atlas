import {PageHeader} from '../../ui/Page.tsx';
import {CinefileLayout} from './CinefileLayout.tsx';
import {CinefileMovieTiles, type CinefileMovie} from './CinefileMovie.tsx';
import {CinefileSearchForm} from './CinefileSearchForm.tsx';

type CinefileSearchPageProps = {
  query?: string;
  resultCount?: number;
  results?: CinefileMovie[];
  status: 'empty' | 'form' | 'results' | 'unavailable';
};

export function CinefileSearchPage({
  query,
  resultCount = 0,
  results = [],
  status,
}: CinefileSearchPageProps) {
  const isResultsPage = status !== 'form';
  return (
    <CinefileLayout
      title={isResultsPage ? 'Search results' : 'Search movies'}
      scripts={['/scripts/apps/cinefile/search-form.js']}
    >
      {isResultsPage ? null : (
        <PageHeader title="Search movies" description="Find a title in your collection." />
      )}
      <CinefileSearchForm action="/cinefile/search/results" query={query} />
      <SearchContent
        query={query ?? ''}
        resultCount={resultCount}
        results={results}
        status={status}
      />
    </CinefileLayout>
  );
}

type SearchContentProps = {
  query: string;
  resultCount: number;
  results: CinefileMovie[];
  status: CinefileSearchPageProps['status'];
};

function SearchContent({query, resultCount, results, status}: SearchContentProps) {
  if (status === 'form') {
    return null;
  }
  if (status === 'unavailable') {
    return <p class="type-body mt-6 text-danger">Your catalog is unavailable. Try again later.</p>;
  }
  if (status === 'empty') {
    return (
      <section class="mt-6">
        <p class="type-body text-foreground">“{query}” is not in your catalog.</p>
        <a
          class="type-control mt-4 inline-flex h-10 items-center rounded-md bg-accent px-4 text-accent-foreground transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          href={`/cinefile/tmdb-search/results?q=${encodeURIComponent(query)}`}
        >
          Search Movie DB
        </a>
      </section>
    );
  }
  return (
    <section class="mt-6">
      <p class="type-body mb-4 text-muted">
        {resultCount} {resultCount === 1 ? 'match' : 'matches'} for “{query}”
      </p>
      <CinefileMovieTiles movies={results} />
    </section>
  );
}
