import type {AtlasApp} from '../core/host.tsx';
import {dashboardApp} from './dashboard/app.tsx';
import {designSystemApp} from './design-system/app.tsx';
import {jellyfinApp} from './jellyfin/app.tsx';

export const apps: AtlasApp[] = [
  // add apps here
  dashboardApp,
  designSystemApp,
  jellyfinApp,
];
