import {defineAction, failAction, type ActionLogger} from '#lib/actions/definition.ts';
import {CONFIG} from '#lib/config.ts';
import {createCatalogStore} from '../catalog.ts';
import {
  runCollectionUpdaters,
  validateJellyfinCollectionUpdatersPayload,
  type CollectionUpdaterRunProgress,
  type JellyfinCollectionUpdatersPayload,
} from '../collection-updater-execution.ts';
import {createCollectionUpdaterLibrary} from '../collection-updaters.ts';
import {createJellyfinGateway} from './jellyfin-gateway.ts';

async function executeCollectionUpdaters(
  _payload: JellyfinCollectionUpdatersPayload,
  logger: ActionLogger,
) {
  logger.info('Collection Updater action started');
  const saved = await createCollectionUpdaterLibrary().list();
  const updaters = saved
    .filter((updater) => updater.enabled)
    .map(({collectionId, conditions}) => ({collectionId, conditions}));
  logger.info({updaterCount: updaters.length}, 'Loaded enabled Collection Updaters');

  const result = await runCollectionUpdaters({
    gateway: createJellyfinGateway({
      server: CONFIG.JELLYFIN_SERVER,
      apiKey: CONFIG.JELLYFIN_API_KEY,
    }),
    store: createCatalogStore(),
    updaters,
    report: (progress) => logProgress(logger, progress),
  });
  if (result.status === 'failed') {
    logger.error(result, 'Collection Updater action failed');
    failAction(new Error(result.failure.message), result);
  }
  logger.info(result, 'Collection Updater action completed');
  return result;
}

function logProgress(logger: ActionLogger, progress: CollectionUpdaterRunProgress) {
  switch (progress.phase) {
    case 'initial_refresh':
      if (progress.progress.phase === 'collections') {
        logger.info(progress, 'Refreshing catalog before planning');
      }
      return;
    case 'planning':
      logger.info(progress, 'Planned Collection Updater changes');
      return;
    case 'updating':
      logger.info(progress, 'Updating Jellyfin collection');
      return;
    case 'final_refresh':
      if (progress.progress.phase === 'collections') {
        logger.info(progress, 'Refreshing catalog after changes');
      }
  }
}

export const runAction = defineAction(
  validateJellyfinCollectionUpdatersPayload,
  executeCollectionUpdaters,
);
