import {Compass} from '@lucide/icons';
import {Button} from './Button.tsx';
import {Icon} from './Icon.tsx';
import {Typeahead} from './Typeahead.tsx';

type QuickNavProps = {class?: string};

export function QuickNav({class: className}: QuickNavProps) {
  return (
    <atlas-quick-nav class={className}>
      <Typeahead
        name="navigation"
        label="Quick navigation"
        source="/global/navigation"
        trigger={
          <Button
            data-trigger
            variant="ghost"
            aria-label="Quick navigation"
            aria-haspopup="dialog"
            aria-expanded="false"
            aria-keyshortcuts="Meta+k Control+k"
          >
            <Icon icon={Compass} size={16} />
            <kbd data-shortcut class="type-caption">
              Ctrl K
            </kbd>
          </Button>
        }
      />
    </atlas-quick-nav>
  );
}
