import {Button} from '../../ui/Button.tsx';
import {InputField} from '../../ui/Forms.tsx';
import {PageHeader} from '../../ui/Page.tsx';
import {CinefileLayout} from './CinefileLayout.tsx';

export function CinefileSearchPage() {
  return (
    <CinefileLayout title="Search movies">
      <PageHeader
        title="Search movies"
        description="Movie search and collection checks are coming next."
      />
      <form class="max-w-xl space-y-5" action="/cinefile/search" method="get">
        <InputField id="movie" name="q" label="Movie title" type="search" autocomplete="off" />
        <Button type="submit">Search</Button>
      </form>
    </CinefileLayout>
  );
}
