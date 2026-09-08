import {Page} from '../../ui/Page.tsx';

export function NotFound() {
  return (
    <Page title="Page not found">
      <p>The page you requested could not be found.</p>
      <p>
        <a href="/">Return home</a>
      </p>
    </Page>
  );
}
