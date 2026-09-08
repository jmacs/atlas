import type {Child} from 'hono/jsx';

import {Document} from './Document.tsx';

type PageProps = {
  children: Child;
  title: string;
};

export function Page({children, title}: PageProps) {
  return (
    <Document title={title}>
      <div class="min-h-dvh bg-background text-foreground">
        <PageChromeHeader />
        <main class="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">{children}</main>
      </div>
    </Document>
  );
}

type PageHeaderProps = {
  description?: string;
  title: string;
};

export function PageHeader({description, title}: PageHeaderProps) {
  return (
    <header class="mb-10 max-w-2xl">
      <h1 class="type-heading-1 sm:type-display">{title}</h1>
      {description ? <p class="type-body mt-3 text-muted">{description}</p> : null}
    </header>
  );
}

function PageChromeHeader() {
  return (
    <header class="border-b border-border/80">
      <div class="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <a class="type-brand" href="/">
          ATLAS
        </a>
        <form method="post" action="/logout">
          <button
            class="type-control rounded-md px-3 py-2 text-muted transition hover:bg-surface hover:text-foreground focus-visible:outline-2 focus-visible:outline-accent"
            type="submit"
          >
            Sign out
          </button>
        </form>
      </div>
    </header>
  );
}
