import {existsSync} from 'node:fs';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';

function findRuntimeRoot(moduleUrl: string) {
  let directory = dirname(fileURLToPath(moduleUrl));

  while (!existsSync(join(directory, 'package.json'))) {
    const parent = dirname(directory);
    if (parent === directory) {
      throw new Error(`Could not find the Atlas runtime root from ${moduleUrl}`);
    }
    directory = parent;
  }

  return directory;
}

const runtimeRoot = findRuntimeRoot(import.meta.url);

export const PATHS = {
  runtime: runtimeRoot,
  database: join(runtimeRoot, 'database', 'atlas.sqlite'),
  actions: join(runtimeRoot, 'actions'),
};


