import AbstractEditRoute from 'hospitalrun/routes/abstract-edit-route';
import Ember from 'ember';
export default AbstractEditRoute.extend({
  editTitle: 'Edit Invoice',
  modelName: 'invoice',
  newTitle: 'New Invoice',
  invoicing: Ember.inject.service(),

  actions: {
    deleteCharge(model) {
      this.controller.send('deleteCharge', model);
    },

    deleteLineItem(model) {
      this.controller.send('deleteLineItem', model);
    },

    removePayment(model) {
      this.controller.send('removePayment', model);
    }
  },

  afterModel(model) {
    let invoicing = this.get('invoicing');
    let lineItems = model.get('lineItems');
    let visit = model.get('visit');
    if (!Ember.isEmpty(lineItems) && !Ember.isEmpty(visit)) {
      return invoicing.reloadItems(lineItems)
        .then(() => invoicing.regenerateItems(model, visit))
        .catch((err) => console.warn(err));
    }
    return invoicing.reloadItems(lineItems);
  },

  getNewData() {
    return Ember.RSVP.resolve({
      billDate: new Date(),
      status: 'Draft'
    });
  },

  setupController(controller, model) {
    model.set('originalPaymentProfileId', model.get('paymentProfile.id'));
    this._super(controller, model);
    let lineItems = model.get('lineItems');
    let promises = [];
    lineItems.forEach(function(lineItem) {
      lineItem.get('details').forEach(function(detail) {
        let pricingItem = detail.get('pricingItem');
        if (!Ember.isEmpty(pricingItem)) {
          promises.push(pricingItem.reload());
        }
      });
    });
  }
});
