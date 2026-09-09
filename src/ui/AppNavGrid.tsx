import {ArrowRight} from '@lucide/icons';

import type {AppNavItem} from './AppLayout.tsx';
import {Icon} from './Icon.tsx';

type AppNavGridProps = {
  navigation: readonly AppNavItem[];
  label?: string;
};

export function AppNavGrid({navigation, label = 'Explore this app'}: AppNavGridProps) {
  const visibleItems = navigation.filter((item) => !item.hidden);
  return (
    <nav aria-label={label}>
      <ul class="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {visibleItems.map((item) => (
          <li class="flex">
            <a
              href={item.href}
              class="group flex w-full flex-col rounded-card border border-border bg-surface p-6 shadow-sm transition-colors hover:border-accent/60 hover:bg-surface-raised focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
            >
              <div class="mb-6 flex items-center justify-between gap-4" aria-hidden="true">
                {item.icon ? (
                  <span class="grid size-11 place-items-center rounded-lg bg-accent/10 text-accent">
                    <Icon icon={item.icon} size={22} />
                  </span>
                ) : null}
                <Icon
                  icon={ArrowRight}
                  size={20}
                  class="ml-auto text-muted transition-colors group-hover:text-accent group-focus-visible:text-accent"
                />
              </div>
              <h2 class="type-heading-3 text-foreground">{item.label}</h2>
              {item.description ? (
                <p class="type-body-small mt-2 text-muted">{item.description}</p>
              ) : null}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
