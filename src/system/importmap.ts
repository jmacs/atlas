export type ImportMapModule = {
  import: string;
  module: `/${string}`;
  entry?: string;
};

export function generateImportMap(modules: readonly ImportMapModule[]) {
  const imports: Record<string, string> = {};
  for (const source of modules) {
    if (source.entry) {
      imports[source.import] = `${source.module}/${source.entry}`;
    }
    imports[`${source.import}/`] = `${source.module}/`;
  }
  return JSON.stringify({imports});
}
