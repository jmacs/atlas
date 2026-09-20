import {PageHeader} from '../../ui/Page.tsx';
import {CinefileLayout} from './CinefileLayout.tsx';
import {CinefileMovieTiles, type CinefileMovie} from './CinefileMovie.tsx';
import {CinefileSearchForm} from './CinefileSearchForm.tsx';

type CinefileTmdbSearchPageProps = {
  query?: string;
  results?: CinefileMovie[];
  status: 'empty' | 'error' | 'form' | 'results';
};

export function CinefileTmdbSearchPage({query, results = [], status}: CinefileTmdbSearchPageProps) {
  const isResultsPage = status !== 'form';
  return (
    <CinefileLayout
      title={isResultsPage ? 'Movie DB results' : 'Search Movie DB'}
      scripts={['/scripts/apps/cinefile/search-form.js']}
    >
      {isResultsPage ? null : (
        <PageHeader title="Search Movie DB" description="Find movies beyond your collection." />
      )}
      <CinefileSearchForm action="/cinefile/tmdb-search/results" query={query} />
      <TmdbSearchContent query={query ?? ''} results={results} status={status} />
    </CinefileLayout>
  );
}

type TmdbSearchContentProps = {
  query: string;
  results: CinefileMovie[];
  status: CinefileTmdbSearchPageProps['status'];
};

function TmdbSearchContent({query, results, status}: TmdbSearchContentProps) {
  if (status === 'form') {
    return null;
  }
  if (status === 'error') {
    return (
      <p class="type-body mt-6 text-danger">Movie DB search is unavailable. Please try again.</p>
    );
  }
  if (status === 'empty') {
    return <p class="type-body mt-6 text-muted">0 matches for “{query}”</p>;
  }
  return (
    <section class="mt-6">
      <p class="type-body mb-4 text-muted">
        {results.length} {results.length === 1 ? 'match' : 'matches'} for “{query}”
      </p>
      <CinefileMovieTiles movies={results} />
    </section>
  );
}
