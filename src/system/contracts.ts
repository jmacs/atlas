import type {Hono} from 'hono';
import type {ActionScheduler} from '#lib/actions/scheduling.ts';
import type {ActionSubmitter} from '#lib/actions/submission.ts';

export type AtlasEnv = {
  Variables: {
    actions: ActionSubmitter;
    scheduler: Pick<ActionScheduler, 'cleanup'>;
  };
};

export type AtlasApp = {
  id: string;
  mountPath: `/${string}`;
  app: Hono<AtlasEnv>;
};
