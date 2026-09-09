import {rm} from 'node:fs/promises';
import {CONFIG} from '#lib/config.ts';
import {actionLogPath} from './logger.ts';
import type {ActionRepository} from './scheduler.db.ts';

const DEFAULT_BATCH_SIZE = 100;

export type ActionCleanupSummary = {
  logsDeleted: number;
  recordsDeleted: number;
};

type CleanupOptions = {
  repository: ActionRepository;
  now?: Date;
  batchSize?: number;
  removeLog?: (actionId: string) => Promise<void>;
};

export async function cleanupExpiredActions({
  repository,
  now = new Date(),
  batchSize = DEFAULT_BATCH_SIZE,
  removeLog = (actionId) => rm(actionLogPath(actionId), {force: true}),
}: CleanupOptions): Promise<ActionCleanupSummary> {
  if (!Number.isInteger(batchSize) || batchSize < 1) {
    throw new Error('Invalid cleanup batch size');
  }
  const cutoff = new Date(now.getTime() - CONFIG.ACTION_RETENTION_DAYS).toISOString();
  const summary: ActionCleanupSummary = {logsDeleted: 0, recordsDeleted: 0};

  while (true) {
    const expired = repository.listExpiredActions(cutoff, batchSize);
    if (!expired.length) {
      return summary;
    }
    for (const action of expired) {
      await removeLog(action.id);
      summary.logsDeleted += 1;
      summary.recordsDeleted += Number(repository.deleteAction(action.id));
    }
  }
}
