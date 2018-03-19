import AbstractIndexRoute from 'hospitalrun/routes/abstract-index-route';
import Ember from 'ember';
export default AbstractIndexRoute.extend({
  pageTitle: 'Inventory Reports',
  moduleName: 'invoices',

  // No model for reports; data gets retrieved when report is run.
  model() {
    return Ember.RSVP.resolve(Ember.Object.create({}));
  },

  setupController(controller, model) {
    this._super(controller, model);
    let currentController = this.controllerFor(this.get('moduleName'));
    currentController.set('subActions', null);
  }
});
