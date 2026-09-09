import {open as openFile} from 'node:fs';
import {mkdir} from 'node:fs/promises';
import {join} from 'node:path';
import pino from 'pino';
import {CONFIG} from '#lib/config.ts';
import {validateActionId} from './contracts.ts';

export type ActionLogger = pino.Logger;

export type ActionLog = {
  logger: ActionLogger;
  close: () => Promise<void>;
};

function openExclusive(path: string): Promise<number> {
  return new Promise((resolve, reject) => {
    openFile(path, 'ax', (error, descriptor) => {
      if (error) {
        reject(error);
      } else {
        resolve(descriptor);
      }
    });
  });
}

export function actionLogPath(actionId: string) {
  validateActionId(actionId);
  return join(CONFIG.paths.logs, 'actions', `${actionId}.jsonl`);
}

export async function createActionLogger(actionId: string): Promise<ActionLog> {
  const path = actionLogPath(actionId);
  await mkdir(join(CONFIG.paths.logs, 'actions'), {recursive: true});
  const dest = await openExclusive(path);
  const destination = pino.destination({dest, sync: true});
  const logger = pino(
    {
      base: {actionId},
      formatters: {level: (label) => ({level: label})},
      messageKey: 'message',
      timestamp: createTimestampJson,
    },
    destination,
  );

  return {
    logger,
    close: () =>
      new Promise((resolve, reject) => {
        destination.once('finish', resolve);
        destination.once('error', reject);
        destination.end();
      }),
  };
}

function createTimestampJson() {
  return `,"timestamp":"${new Date().toISOString()}"`;
}
