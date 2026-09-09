import {House, SearchX} from '@lucide/icons';

import {buttonClassNames} from '../ui/Button.tsx';
import {Document} from '../ui/Document.tsx';
import {Icon} from '../ui/Icon.tsx';
import {CoreLayout} from './CoreLayout.tsx';

export function NotFoundPage() {
  return (
    <Document title="Page not found">
      <CoreLayout>
        <section
          class="relative isolate flex min-h-[calc(100dvh-10rem)] items-center justify-center overflow-hidden rounded-card border border-border/80 bg-surface/40 px-5 py-16 text-center shadow-2xl shadow-shadow/10 sm:px-8"
          aria-labelledby="not-found-title"
        >
          <div
            class="absolute left-1/2 top-0 -z-10 h-80 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent/10 blur-3xl"
            aria-hidden="true"
          />
          <div
            class="absolute bottom-0 right-0 -z-10 h-64 w-64 translate-x-1/3 translate-y-1/3 rounded-full bg-surface-raised/60 blur-3xl"
            aria-hidden="true"
          />

          <div class="max-w-xl">
            <div
              class="mx-auto mb-6 grid size-14 place-items-center rounded-2xl border border-accent/30 bg-accent/10 text-accent shadow-lg shadow-shadow/20"
              aria-hidden="true"
            >
              <Icon icon={SearchX} size={28} />
            </div>

            <p class="type-label mb-3 text-accent">Error 404</p>
            <h1 id="not-found-title" class="type-heading-1 text-foreground sm:type-display">
              This page is off the map
            </h1>
            <p class="type-body mx-auto mt-4 max-w-md text-muted">
              The address may be incorrect, or the page may have moved. Head back to Atlas and pick
              up where you left off.
            </p>

            <div class="mt-8 flex justify-center">
              <a class={buttonClassNames('primary')} href="/">
                <Icon icon={House} size={18} />
                Return home
              </a>
            </div>
          </div>
        </section>
      </CoreLayout>
    </Document>
  );
}
