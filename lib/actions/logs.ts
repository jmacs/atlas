import {readFile} from 'node:fs/promises';
import {actionLogPath} from './_internal/logger.ts';

/** Returns an action's raw JSON Lines log, when the worker has created it. */
export async function readActionLog(actionId: string): Promise<string | undefined> {
  try {
    return await readFile(actionLogPath(actionId), 'utf8');
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      return undefined;
    }
    throw error;
  }
}
