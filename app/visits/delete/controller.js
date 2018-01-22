import AbstractDeleteController from 'hospitalrun/controllers/abstract-delete-controller';
import Ember from 'ember';
export default AbstractDeleteController.extend({
  title: 'Delete Visit',
  invoicing: Ember.inject.service(),

  afterDeleteAction: function() {
    let deleteFromPatient = this.get('model.deleteFromPatient');
    if (deleteFromPatient) {
      return 'visitDeleted';
    } else {
      return 'closeModal';
    }
  }.property('model.deleteFromPatient'),

  actions: {
    delete() {
      let invoicing = this.get('invoicing');
      this.get('model.invoice')
        .then(invoicing.deleteInvoice)
        .then(this._super.bind(this));
    }
  }
});
