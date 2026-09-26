import type {AppNavigationItem} from '../ui/AppLayout.tsx';
import {
  Clapperboard,
  Film,
  FolderInput,
  LibraryBig,
  ListRestart,
  Palette,
  ScrollText,
  Shapes,
  Terminal,
  Type,
} from '@lucide/icons';

export const navigation: readonly AppNavigationItem[] = [
  {href: '/', label: 'Dashboard', hidden: true},
  {
    href: '/atlas',
    label: 'Atlas',
    icon: ScrollText,
    description: 'Browse Atlas tools and diagnostic information.',
    children: [
      {
        href: '/atlas/log-viewer',
        label: 'Log Viewer',
        icon: ScrollText,
        description: 'Inspect Atlas logs.',
      },
    ],
  },
  {
    href: '/actions',
    label: 'Actions',
    icon: Terminal,
    description: 'Track queued work and review results and logs.',
  },
  {
    href: '/jellyfin',
    label: 'Jellyfin',
    icon: Clapperboard,
    description: 'Manage and explore your Jellyfin server.',
    children: [
      {
        href: '/jellyfin/catalog',
        label: 'Catalog',
        icon: LibraryBig,
        description: 'Browse cached Jellyfin collections and movies.',
      },
      {
        href: '/jellyfin/collection-manager',
        label: 'Manage Collection',
        icon: FolderInput,
        description: 'Select movies and add them to a Jellyfin collection.',
      },
      {
        href: '/jellyfin/collection-updaters',
        label: 'Collection Updaters',
        icon: ListRestart,
        description: 'Build ordered rules for Jellyfin collections.',
      },
    ],
  },
  {
    href: '/cinefile',
    label: 'Cinefile',
    icon: Film,
    description: 'Find movies, check your collection, and keep a watchlist for later.',
  },
  {
    href: '/cinefile-admin',
    label: 'Cinefile Admin',
    icon: Clapperboard,
    description: 'Review and action media requests from Cinefile.',
    children: [
      {
        href: '/cinefile-admin/requests',
        label: 'Media Requests',
        icon: ListRestart,
        description: 'Review movies and TV series waiting to be added to the collection.',
      },
    ],
  },
  {
    href: '/design-system',
    label: 'Design system',
    icon: Shapes,
    description: 'Build, document, and test the Atlas interface.',
    children: [
      {
        href: '/design-system/components',
        label: 'Components',
        icon: Shapes,
        description:
          'Explore buttons, forms, tables, and the building blocks of the Atlas interface.',
      },
      {
        href: '/design-system/typography',
        label: 'Typography',
        icon: Type,
        description: 'Find the right type styles for headings, body text, labels, and controls.',
      },
      {
        href: '/design-system/colors',
        label: 'Color palettes',
        icon: Palette,
        description:
          'Explore the palettes and semantic colors that give Atlas its visual identity.',
      },
    ],
  },
];

export function getNavigationChildren(parentHref: string) {
  const nav = navigation.find((nav) => nav.href === parentHref);
  return nav?.children ?? [];
}
