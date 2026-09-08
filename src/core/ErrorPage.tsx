import {Page} from '../ui/Page.tsx';

export function ErrorPage() {
  return (
    <Page title="Something went wrong">
      <p class="type-body">An unexpected error occurred. Please try again.</p>
      <p class="type-body">
        <a class="type-control" href="/">
          Return home
        </a>
      </p>
    </Page>
  );
}
