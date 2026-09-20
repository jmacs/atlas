import {copyFile, mkdir, rm, writeFile} from 'node:fs/promises';
import {join} from 'node:path';

type ArchiveAndClearApplicationLogProps = {
  archiveDirectory: string;
  logPath: string;
  timestamp?: number;
};

export async function archiveAndClearApplicationLog({
  archiveDirectory,
  logPath,
  timestamp = Date.now(),
}: ArchiveAndClearApplicationLogProps) {
  await mkdir(archiveDirectory, {recursive: true});

  const archivePath = join(archiveDirectory, `atlas.${timestamp}.log`);
  let archived = true;
  try {
    await copyFile(logPath, archivePath);
  } catch (error) {
    if (!isMissingFile(error)) {
      throw error;
    }
    archived = false;
  }

  await rm(logPath, {force: true});
  await writeFile(logPath, '');

  return {archivePath, archived};
}

function isMissingFile(error: unknown) {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === 'ENOENT';
}
