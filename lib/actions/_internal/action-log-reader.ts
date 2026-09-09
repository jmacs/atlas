import {open, type FileHandle} from 'node:fs/promises';
import {StringDecoder} from 'node:string_decoder';
import {actionLogPath} from './logger.ts';

export type ActionLogRead = {
  records: unknown[];
  warning: string | null;
  hasData: boolean;
};

export function createActionLogReader(actionId: string) {
  let file: FileHandle | undefined;
  let offset = 0;
  let pending = '';
  let warning: string | null = null;
  const decoder = new StringDecoder('utf8');
  const buffer = Buffer.alloc(16_384);

  return {
    async read(): Promise<ActionLogRead> {
      if (warning) {
        return {records: [], warning, hasData: false};
      }
      try {
        if (!file) {
          try {
            file = await open(actionLogPath(actionId), 'r');
          } catch (error) {
            if (!(error instanceof Error && 'code' in error && error.code === 'ENOENT')) {
              throw error;
            }
          }
        }
        if (!file) {
          return {records: [], warning: null, hasData: false};
        }
        const {bytesRead} = await file.read(buffer, 0, buffer.length, offset);
        if (!bytesRead) {
          return {records: [], warning: null, hasData: false};
        }
        offset += bytesRead;
        pending += decoder.write(buffer.subarray(0, bytesRead));
        const records: unknown[] = [];
        let newline;
        while ((newline = pending.indexOf('\n')) !== -1) {
          const line = pending.slice(0, newline);
          pending = pending.slice(newline + 1);
          records.push(JSON.parse(line));
        }
        if (pending.length > 1_048_576) {
          throw new Error('Action log line exceeds 1 MiB');
        }
        return {records, warning: null, hasData: true};
      } catch (error) {
        warning = `Could not read action logs: ${error instanceof Error ? error.message : String(error)}`;
        return {records: [], warning, hasData: false};
      }
    },
    finish() {
      if (!warning) {
        pending += decoder.end();
        if (pending) {
          warning = 'The action log ended with an incomplete line.';
        }
      }
      return warning;
    },
    async close() {
      await file?.close();
    },
  };
}

export type ActionLogReader = ReturnType<typeof createActionLogReader>;
