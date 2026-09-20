import {Search} from '@lucide/icons';
import type {Child} from 'hono/jsx';

import {Document} from '../../ui/Document.tsx';
import {Icon} from '../../ui/Icon.tsx';

type CinefileLayoutProps = {
  children: Child;
  scripts?: string[];
  title: string;
};

export function CinefileLayout({children, scripts, title}: CinefileLayoutProps) {
  return (
    <Document title={`${title} · Cinefile`} scripts={scripts}>
      <div class="min-h-dvh bg-background text-foreground">
        <header class="border-b border-border/80 bg-background/90">
          <div class="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 sm:px-6 lg:px-8">
            <a class="type-brand text-foreground" href="/cinefile">
              CINEFILE
            </a>
            <a
              class="type-control inline-flex items-center gap-2 rounded-md px-3 py-2 text-muted transition hover:bg-surface hover:text-foreground focus-visible:outline-2 focus-visible:outline-accent"
              href="/cinefile/search"
            >
              <Icon icon={Search} size={16} />
              Search
            </a>
          </div>
        </header>
        <main class="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">{children}</main>
      </div>
    </Document>
  );
}
