import type {Child} from 'hono/jsx';

type CoreLayoutProps = {
  children: Child;
};

export function CoreLayout({children}: CoreLayoutProps) {
  return (
    <div class="min-h-dvh bg-background text-foreground">
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
      <main class="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-8 lg:px-8">{children}</main>
    </div>
  );
}
