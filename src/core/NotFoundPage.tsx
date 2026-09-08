import {Page} from '../ui/Page.tsx';

export function NotFoundPage() {
  return (
    <Page title="Page not found">
      <p class="type-body">The page you requested could not be found.</p>
      <p class="type-body">
        <a class="type-control" href="/">
          Return home
        </a>
      </p>
    </Page>
  );
}
