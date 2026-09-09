import {House, TriangleAlert} from '@lucide/icons';

import {buttonClassNames} from '../ui/Button.tsx';
import {Document} from '../ui/Document.tsx';
import {Icon} from '../ui/Icon.tsx';
import {CoreLayout} from './CoreLayout.tsx';

export function ErrorPage() {
  return (
    <Document title="Something went wrong">
      <CoreLayout>
        <section
          class="relative isolate flex min-h-[calc(100dvh-10rem)] items-center justify-center overflow-hidden rounded-card border border-border/80 bg-surface/40 px-5 py-16 text-center shadow-2xl shadow-shadow/10 sm:px-8"
          aria-labelledby="error-title"
        >
          <div
            class="absolute left-1/2 top-0 -z-10 h-80 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full bg-danger/10 blur-3xl"
            aria-hidden="true"
          />
          <div
            class="absolute bottom-0 right-0 -z-10 h-64 w-64 translate-x-1/3 translate-y-1/3 rounded-full bg-surface-raised/60 blur-3xl"
            aria-hidden="true"
          />

          <div class="max-w-xl">
            <div
              class="mx-auto mb-6 grid size-14 place-items-center rounded-2xl border border-danger/30 bg-danger/10 text-danger shadow-lg shadow-shadow/20"
              aria-hidden="true"
            >
              <Icon icon={TriangleAlert} size={28} />
            </div>

            <p class="type-label mb-3 text-danger">Error 500</p>
            <h1 id="error-title" class="type-heading-1 text-foreground sm:type-display">
              Something went wrong
            </h1>
            <p class="type-body mx-auto mt-4 max-w-md text-muted">
              Atlas ran into an unexpected problem. Try the request again, or return home if the
              problem continues.
            </p>

            <div class="mt-8 flex flex-col-reverse justify-center gap-3 sm:flex-row">
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
