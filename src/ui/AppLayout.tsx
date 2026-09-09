import type {Child} from 'hono/jsx';
import clsx from 'clsx';
import type {LucideIconData} from '@lucide/icons';

import {QuickNav} from './QuickNav.tsx';

import {ToastRegion} from './Toast.tsx';

export type AppNavItem = {
  href: string;
  label: string;
  icon?: LucideIconData;
  description?: string;
  hidden?: boolean;
};

export type AppNavigationItem = AppNavItem & {
  children?: readonly AppNavItem[];
};

type AppLayoutProps = {
  activePath: string;
  children: Child;
  appName: string;
  appHref: string;
  navigation: readonly AppNavigationItem[];
  notifications?: Child;
};

const navigationId = 'app-navigation';

export function AppLayout({
  activePath,
  children,
  appName,
  appHref,
  navigation,
  notifications,
}: AppLayoutProps) {
  return (
    <div class="min-h-dvh bg-background text-foreground">
      <AppHeader appName={appName} />

      <main class="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:pt-8 sm:pb-14 lg:px-8">{children}</main>

      <AppNavigation
        appName={appName}
        appHref={appHref}
        activePath={activePath}
        navigation={navigation}
      />
      <ToastRegion>{notifications}</ToastRegion>
    </div>
  );
}

type AppHeaderProps = {
  appName: string;
};

function AppHeader({appName}: AppHeaderProps) {
  return (
    <header class="sticky top-0 z-30 border-b border-border/80 bg-background/90 backdrop-blur">
      <div class="mx-auto flex h-14 max-w-7xl items-center gap-3 px-4 sm:px-6">
        <button
          type="button"
          class="group -ml-2 grid size-10 place-items-center rounded-md text-muted transition hover:bg-surface hover:text-foreground focus-visible:outline-2 focus-visible:outline-accent"
          aria-controls={navigationId}
          aria-label="Open navigation"
          popovertarget={navigationId}
        >
          <span class="flex w-4 flex-col gap-1" aria-hidden="true">
            <span class="h-px w-4 bg-current" />
            <span class="h-px w-4 bg-current" />
            <span class="h-px w-4 bg-current" />
          </span>
        </button>
        <a class="type-brand text-foreground" href="/">
          ATLAS
        </a>
        <span class="h-4 w-px bg-border" aria-hidden="true" />
        <span class="type-body-small truncate text-muted">{appName}</span>
        <QuickNav class="ml-auto shrink-0" />
      </div>
    </header>
  );
}

type AppNavigationProps = {
  appName: string;
  activePath: string;
  appHref: string;
  navigation: readonly AppNavigationItem[];
};

type NavigationLinkProps = {
  item: AppNavItem;
  activePath: string;
  isCurrentApp?: boolean;
};

function NavigationLink({item, activePath, isCurrentApp}: NavigationLinkProps) {
  const isActive = item.href === activePath;
  return (
    <a
      href={item.href}
      class={clsx(
        'type-control block rounded-md px-3 py-2 transition focus-visible:outline-2 focus-visible:outline-accent',
        isActive
          ? 'bg-accent/10 text-accent ring-1 ring-inset ring-accent/30'
          : 'text-muted hover:bg-surface-raised/70 hover:text-foreground',
        isCurrentApp && !isActive && 'text-foreground',
      )}
      aria-current={isActive ? 'page' : undefined}
    >
      {item.label}
    </a>
  );
}

function AppNavigation({appName, appHref, activePath, navigation}: AppNavigationProps) {
  const links = navigation.map((item) => {
    const isCurrentApp = item.href === appHref;
    const children = isCurrentApp ? item.children : undefined;
    const childLinks = children?.map((child) => (
      <li>
        <NavigationLink item={child} activePath={activePath} />
      </li>
    ));
    return (
      <li>
        <NavigationLink item={item} activePath={activePath} isCurrentApp={isCurrentApp} />
        {childLinks?.length ? (
          <ul
            class="my-1 ml-6 space-y-1 border-l border-border pl-2"
            aria-label={`${item.label} pages`}
          >
            {childLinks}
          </ul>
        ) : null}
      </li>
    );
  });

  return (
    <aside
      id={navigationId}
      popover="auto"
      class="fixed inset-y-0 left-0 m-0 h-dvh max-h-none w-72 max-w-[85vw] border-0 bg-transparent p-0 text-foreground backdrop:bg-overlay/65 backdrop:backdrop-blur-sm"
      aria-label={`${appName} navigation`}
    >
      <div class="flex h-full flex-col border-r border-border bg-surface shadow-2xl">
        <header class="flex h-14 items-center justify-between border-b border-border px-4">
          <div>
            <p class="type-brand-small text-foreground">Atlas</p>
            <p class="type-caption mt-0.5 text-muted">{appName}</p>
          </div>
          <button
            type="button"
            class="grid size-9 place-items-center rounded-md text-xl leading-none text-muted transition hover:bg-surface-raised hover:text-foreground focus-visible:outline-2 focus-visible:outline-accent"
            aria-label="Close navigation"
            popovertarget={navigationId}
            popovertargetaction="hide"
          >
            <span aria-hidden="true">×</span>
          </button>
        </header>

        <nav class="flex-1 overflow-y-auto p-3" aria-label="Apps">
          <ul class="space-y-1">{links}</ul>
        </nav>

        <footer class="border-t border-border p-3">
          <form method="post" action="/logout">
            <button
              type="submit"
              class="type-control mt-1 w-full rounded-md px-3 py-2 text-left text-muted transition hover:bg-surface-raised hover:text-foreground"
            >
              Sign out
            </button>
          </form>
        </footer>
      </div>
    </aside>
  );
}
