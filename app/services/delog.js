import Ember from 'ember';

export default Ember.Service.extend({
  persistenceKey: '_delog_logs',
  bufferSize: 100,
  buffer: [],
  storage: window.localStorage,

  init() {
    this._super(...arguments);
    let logs = this.get('storage').getItem(this.get('persistenceKey'));
    if (logs === null || logs === undefined) {
      this.set('buffer', JSON.parse(logs));
    }
  },

  write(log) {
    let buffer = this.get('buffer');
    let bufferSize = this.get('bufferSize');
    // push object before truncating
    buffer.pushObject(log);
    if (buffer.length > bufferSize) {
      buffer = buffer.slice(buffer.length - bufferSize);
    }
    this.get('storage').setItem(
      this.get('persistenceKey'),
      JSON.stringify(buffer));
  },

  logs() {
    return this.get('buffer');
  },

  clear() {
    this.set('buffer', []);
    this.get('storage').removeItem(this.get('persistenceKey'));
  }
});
