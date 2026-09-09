import {globalApp} from './global/app.tsx';
import {dashboardApp} from './dashboard/app.tsx';
import {designSystemApp} from './design-system/app.tsx';
import {jellyfinApp} from './jellyfin/app.tsx';
import {actionsApp} from './actions/app.tsx';
import type {AtlasApp} from '../system/contracts.ts';

export const apps: AtlasApp[] = [
  // add apps here
  globalApp,
  dashboardApp,
  designSystemApp,
  jellyfinApp,
  actionsApp,
];
