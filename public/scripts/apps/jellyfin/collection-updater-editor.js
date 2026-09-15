import Alpine from 'alpinejs';
import {randomId} from '../../ids.js';

Alpine.data('collectionUpdaterEditor', () => ({
  catalog: null,
  editorDraft: null,
  editorErrors: {},
  editingUpdaterId: null,
  editorOpener: null,
  initiallyDirty: false,
  nextKey: 0,
  savedSerialization: '',
  updaters: [],

  init() {
    this.catalog = this.$refs.catalogAvailable.value === 'true';
    const updaters = this.readJson(this.$refs.updatersData, []);
    this.updaters = Array.isArray(updaters)
      ? updaters.map((updater) => this.normalizeUpdater(updater))
      : [];
    this.savedSerialization = this.serializedUpdaters();
    this.initiallyDirty = this.$root.dataset.initiallyDirty === 'true';
  },

  readJson(element, fallback) {
    try {
      return JSON.parse(element.textContent ?? '');
    } catch {
      return fallback;
    }
  },

  normalizeUpdater(updater) {
    return {
      id: typeof updater?.id === 'string' ? updater.id : '',
      enabled: updater?.enabled === true,
      collection: this.normalizeCollection(updater?.collection),
      conditions: Array.isArray(updater?.conditions)
        ? updater.conditions.map((condition) => this.normalizeCondition(condition))
        : [],
    };
  },

  normalizeCollection(collection) {
    return {
      id: typeof collection?.id === 'string' ? collection.id : '',
      title: typeof collection?.title === 'string' ? collection.title : '',
    };
  },

  normalizeCondition(condition) {
    return {
      field: typeof condition?.field === 'string' ? condition.field : '',
      operator: typeof condition?.operator === 'string' ? condition.operator : '',
      value: condition?.value,
      start: condition?.start,
      end: condition?.end,
      values: Array.isArray(condition?.values) ? [...condition.values] : [],
    };
  },

  draftCondition(condition) {
    return {
      key: this.nextKey++,
      field: condition.field,
      operator: condition.operator,
      value: condition.value === undefined ? '' : String(condition.value),
      start: condition.start === undefined ? '' : String(condition.start),
      end: condition.end === undefined ? '' : String(condition.end),
      values: Array.isArray(condition.values) ? condition.values.join(', ') : '',
    };
  },

  openNewUpdater(opener) {
    this.editingUpdaterId = null;
    this.editorErrors = {};
    this.editorOpener = opener;
    this.editorDraft = {
      id: randomId(),
      enabled: true,
      collection: {id: '', title: ''},
      conditions: [this.yearCondition()],
    };
    this.openEditorDialog();
  },

  openUpdater(id, opener) {
    const updater = this.updaters.find((entry) => entry.id === id);
    if (!updater) {
      return;
    }
    this.editingUpdaterId = id;
    this.editorErrors = {};
    this.editorOpener = opener;
    this.editorDraft = {
      id: updater.id,
      enabled: updater.enabled,
      collection: {...updater.collection},
      conditions: updater.conditions.map((condition) => this.draftCondition(condition)),
    };
    this.openEditorDialog();
  },

  openEditorDialog() {
    this.$nextTick(() => {
      if (!this.$refs.editorDialog.open) {
        this.$refs.editorDialog.showModal();
      }
    });
  },

  discardEditor() {
    const opener = this.editorOpener;
    this.editorDraft = null;
    this.editorErrors = {};
    this.editingUpdaterId = null;
    this.editorOpener = null;
    this.$nextTick(() => {
      if (opener?.isConnected) {
        opener.focus();
      }
    });
  },

  commitEditor() {
    if (!this.validateEditor()) {
      return;
    }
    const updater = this.normalizeUpdater(this.serializedDraft());
    if (this.editingUpdaterId === null) {
      this.updaters.push(updater);
    } else {
      const index = this.updaters.findIndex((entry) => entry.id === this.editingUpdaterId);
      if (index === -1) {
        this.editorErrors = {editor: 'The updater is no longer in the working document.'};
        return;
      }
      this.updaters[index] = updater;
    }
    this.$refs.editorDialog.close();
  },

  validateEditor() {
    const errors = {};
    const collectionId = this.editorDraft?.collection.id.trim() ?? '';
    if (!collectionId) {
      errors.collectionId = 'Choose a target collection.';
    }

    if (!this.editorDraft?.conditions.length) {
      errors.conditions = 'Add at least one condition.';
    }
    for (const condition of this.editorDraft?.conditions ?? []) {
      this.validateCondition(condition, errors);
    }
    this.editorErrors = errors;
    return Object.keys(errors).length === 0;
  },

  validateCondition(condition, errors) {
    const path = (property) => `conditions.${condition.key}.${property}`;
    if (condition.field === 'movie.year') {
      if (!['eq', 'lt', 'gt', 'lte', 'gte', 'between'].includes(condition.operator)) {
        errors[path('operator')] = 'Choose a release year operator.';
        return;
      }
      if (condition.operator === 'between') {
        const start = this.finiteNumber(condition.start);
        const end = this.finiteNumber(condition.end);
        if (start === null) {
          errors[path('start')] = 'Enter a finite start year.';
        }
        if (end === null) {
          errors[path('end')] = 'Enter a finite end year.';
        }
        if (start !== null && end !== null && start > end) {
          errors[path('end')] = 'End year must be greater than or equal to start year.';
        }
      } else if (this.finiteNumber(condition.value) === null) {
        errors[path('value')] = 'Enter a finite release year.';
      }
      return;
    }
    if (condition.field === 'movie.genres') {
      if (!['includes_any', 'includes_all'].includes(condition.operator)) {
        errors[path('operator')] = 'Choose a genre operator.';
      }
      if (!this.genreValues(condition.values).length) {
        errors[path('values')] = 'Enter at least one genre.';
      }
      return;
    }
    errors[path('field')] = 'Choose a supported field.';
  },

  editorErrorFor(property) {
    return this.editorErrors[property] ?? '';
  },

  editorConditionError(key, property) {
    return this.editorErrors[`conditions.${key}.${property}`] ?? '';
  },

  editorErrorMessages() {
    return [...new Set(Object.values(this.editorErrors))];
  },

  addCondition() {
    this.editorDraft?.conditions.push(this.yearCondition());
  },

  removeCondition(key) {
    if (this.editorDraft) {
      this.editorDraft.conditions = this.editorDraft.conditions.filter(
        (condition) => condition.key !== key,
      );
    }
  },

  moveCondition(key, offset) {
    const conditions = this.editorDraft?.conditions;
    const index = conditions?.findIndex((condition) => condition.key === key) ?? -1;
    const destination = index + offset;
    if (!conditions || index < 0 || destination < 0 || destination >= conditions.length) {
      return;
    }
    [conditions[index], conditions[destination]] = [conditions[destination], conditions[index]];
  },

  changeField(condition) {
    const key = condition.key;
    Object.assign(
      condition,
      condition.field === 'movie.genres'
        ? this.genreCondition('includes_any', key)
        : this.yearCondition('eq', key),
    );
  },

  changeOperator(condition) {
    const key = condition.key;
    if (condition.field === 'movie.genres') {
      Object.assign(condition, this.genreCondition(condition.operator, key));
    } else if (condition.operator === 'between') {
      Object.assign(condition, this.yearRangeCondition(key));
    } else {
      Object.assign(condition, this.yearCondition(condition.operator, key));
    }
  },

  yearCondition(operator = 'eq', key = this.nextKey++) {
    return {
      key,
      field: 'movie.year',
      operator,
      value: '0',
      start: '',
      end: '',
      values: '',
    };
  },

  yearRangeCondition(key = this.nextKey++) {
    return {
      key,
      field: 'movie.year',
      operator: 'between',
      value: '',
      start: '0',
      end: '0',
      values: '',
    };
  },

  genreCondition(operator = 'includes_any', key = this.nextKey++) {
    return {
      key,
      field: 'movie.genres',
      operator,
      value: '',
      start: '',
      end: '',
      values: '',
    };
  },

  removeUpdater(id) {
    this.updaters = this.updaters.filter((updater) => updater.id !== id);
  },

  moveUpdater(id, offset) {
    const index = this.updaters.findIndex((updater) => updater.id === id);
    const destination = index + offset;
    if (index < 0 || destination < 0 || destination >= this.updaters.length) {
      return;
    }
    [this.updaters[index], this.updaters[destination]] = [
      this.updaters[destination],
      this.updaters[index],
    ];
  },

  updaterCountLabel() {
    return `${this.updaters.length} ${this.updaters.length === 1 ? 'Updater' : 'Updaters'}`;
  },

  disabledCountLabel() {
    const count = this.updaters.filter((updater) => !updater.enabled).length;
    return `${count} disabled collection ${count === 1 ? 'updater' : 'updaters'}`;
  },

  targetName(updater) {
    return updater.collection.title || updater.collection.id;
  },

  typeaheadSelection(collection) {
    if (!collection?.id) {
      return '[]';
    }
    return JSON.stringify([{value: collection.id, name: collection.title, data: collection}]);
  },

  selectDraftCollection(items) {
    const collection = items[0]?.data;
    if (typeof collection?.id !== 'string' || typeof collection?.title !== 'string') {
      return;
    }
    this.editorDraft.collection = {id: collection.id, title: collection.title};
  },

  conditionSummary(condition) {
    if (condition.field === 'movie.genres') {
      const operator = condition.operator === 'includes_any' ? 'includes any' : 'includes all';
      const values = condition.values.map((value) => `“${value}”`).join(', ');
      return `Genre ${operator} ${values}`;
    }
    if (condition.operator === 'between') {
      return `Release year is between ${condition.start} and ${condition.end}`;
    }
    const operators = {
      eq: 'is',
      lt: 'is before',
      gt: 'is after',
      lte: 'is at most',
      gte: 'is at least',
    };
    return `Release year ${operators[condition.operator] ?? condition.operator} ${condition.value}`;
  },

  isDirty() {
    return this.initiallyDirty || this.serializedUpdaters() !== this.savedSerialization;
  },

  serializedUpdaters() {
    return JSON.stringify(
      this.updaters.map((updater) => ({
        id: updater.id,
        enabled: updater.enabled,
        collectionId: updater.collection.id,
        conditions: updater.conditions.map((condition) => this.serializedCondition(condition)),
      })),
    );
  },

  serializedDraft() {
    return {
      id: this.editorDraft.id,
      enabled: this.editorDraft.enabled,
      collection: {
        id: this.editorDraft.collection.id.trim(),
        title: this.editorDraft.collection.title,
      },
      conditions: this.editorDraft.conditions.map((condition) =>
        this.serializedDraftCondition(condition),
      ),
    };
  },

  serializedDraftCondition(condition) {
    if (condition.field === 'movie.genres') {
      return {
        field: condition.field,
        operator: condition.operator,
        values: this.genreValues(condition.values),
      };
    }
    if (condition.operator === 'between') {
      return {
        field: condition.field,
        operator: condition.operator,
        start: Number(condition.start),
        end: Number(condition.end),
      };
    }
    return {
      field: condition.field,
      operator: condition.operator,
      value: Number(condition.value),
    };
  },

  serializedCondition(condition) {
    if (condition.field === 'movie.genres') {
      return {
        field: condition.field,
        operator: condition.operator,
        values: [...condition.values],
      };
    }
    if (condition.operator === 'between') {
      return {
        field: condition.field,
        operator: condition.operator,
        start: condition.start,
        end: condition.end,
      };
    }
    return {
      field: condition.field,
      operator: condition.operator,
      value: condition.value,
    };
  },

  genreValues(value) {
    return value
      .split(',')
      .map((genre) => genre.trim())
      .filter(Boolean);
  },

  finiteNumber(value) {
    if (typeof value !== 'string' || !value.trim()) {
      return null;
    }
    const number = Number(value);
    return Number.isFinite(number) ? number : null;
  },
}));

Alpine.start();
