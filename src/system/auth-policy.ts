export function isPublicPath(
  requestPath: string,
  publicMountPaths: readonly `/${string}`[],
): boolean {
  return publicMountPaths.some(
    (mountPath) =>
      mountPath === '/' || requestPath === mountPath || requestPath.startsWith(`${mountPath}/`),
  );
}
