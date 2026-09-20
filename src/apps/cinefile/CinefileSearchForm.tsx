import {Search, X} from '@lucide/icons';

import {Input} from '../../ui/Forms.tsx';
import {Button} from '../../ui/Button.tsx';
import {Icon} from '../../ui/Icon.tsx';

type CinefileSearchFormProps = {
  action: string;
  query?: string;
};

export function CinefileSearchForm({action, query = ''}: CinefileSearchFormProps) {
  return (
    <form class="flex gap-2" action={action} method="get" data-cinefile-search>
      <div class="relative min-w-0 flex-1">
        <Input
          id="movie"
          name="q"
          type="search"
          value={query}
          class="pr-10"
          autocomplete="off"
          aria-label="Movie title"
          data-search-input
        />
        <button
          class="absolute inset-y-0 right-0 grid w-10 place-items-center text-muted transition hover:text-foreground focus-visible:outline-2 focus-visible:outline-accent"
          type="button"
          aria-label="Clear search"
          data-search-clear
        >
          <Icon icon={X} size={18} />
        </button>
      </div>
      <Button type="submit" aria-label="Search movies">
        <Icon icon={Search} size={18} />
        <span class="hidden sm:inline">Search</span>
      </Button>
    </form>
  );
}
