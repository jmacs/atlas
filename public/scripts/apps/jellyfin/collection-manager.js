import Alpine from 'alpinejs';

Alpine.data('collectionManager', () => ({
  collection: null,
  movies: [],

  init() {
    this.collection = this.selectedItems(this.$refs.collectionPicker)[0] ?? null;
    this.movies = this.selectedItems(this.$refs.moviePicker);
  },

  selectedItems(picker) {
    try {
      const items = JSON.parse(picker?.dataset.selected ?? '[]');
      return Array.isArray(items) ? items : [];
    } catch {
      return [];
    }
  },

  movieCountLabel() {
    return `Selected movies (${this.movies.length})`;
  },

  removeMovie(movieId) {
    this.movies = this.movies.filter((movie) => movie.value !== movieId);
  },
}));

Alpine.start();
