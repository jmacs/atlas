import type {Catalog, CatalogCollection, CatalogMovie} from './catalog.ts';

export type CollectionMovieEdge = {movieId: string; collectionId: string};
export type CatalogView = {
  listMovies(): CatalogMovie[];
  getMovie(id: string): CatalogMovie | undefined;
  listCollections(): CatalogCollection[];
  getCollection(id: string): CatalogCollection | undefined;
  getMovieIdsInCollection(collectionId: string): readonly string[];
  listCollectionMovieEdges(): CollectionMovieEdge[];
};

export function createCatalogView(catalog: Catalog): CatalogView {
  const movies = [...catalog.movies];
  const collections = [...catalog.collections];
  const moviesById = new Map(movies.map((movie) => [movie.id, movie]));
  const collectionsById = new Map(collections.map((collection) => [collection.id, collection]));
  const movieIdsByCollectionId = new Map(
    collections.map((collection) => [
      collection.id,
      [...(catalog.collectionMovieIds[collection.id] ?? [])],
    ]),
  );
  const edges = collections.flatMap((collection) =>
    (movieIdsByCollectionId.get(collection.id) ?? []).map((movieId) => ({
      collectionId: collection.id,
      movieId,
    })),
  );
  return {
    listMovies: () => movies,
    getMovie: (id) => moviesById.get(id),
    listCollections: () => collections,
    getCollection: (id) => collectionsById.get(id),
    getMovieIdsInCollection: (id) => movieIdsByCollectionId.get(id) ?? [],
    listCollectionMovieEdges: () => edges,
  };
}
