import {Page} from '../../ui/Page.tsx';

export function ErrorPage() {
  return (
    <Page title="Something went wrong">
      <p>An unexpected error occurred. Please try again.</p>
      <p>
        <a href="/">Return home</a>
      </p>
    </Page>
  );
}
