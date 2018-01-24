import AbstractEditRoute from 'hospitalrun/routes/abstract-edit-route';
import { IMAGING_PRICING_TYPE } from 'hospitalrun/pricing/edit/controller';
import Ember from 'ember';
export default AbstractEditRoute.extend({
  editTitle: 'Edit Pricing Item',
  modelName: 'pricing',
  newTitle: 'New Pricing Item',

  actions: {
    deleteOverride(overrideToDelete) {
      this.controller.send('deleteOverride', overrideToDelete);
    }
  },

  getNewData(params) {
    let newCategory = params.pricing_id.substr(3);
    if (Ember.isEmpty(newCategory)) {
      newCategory = 'Imaging';
    }
    return Ember.RSVP.resolve({
      category: newCategory,
      pricingType: IMAGING_PRICING_TYPE
    });
  },

  model(params) {
    let idParam = this.get('idParam');
    if (!Ember.isEmpty(idParam) && params[idParam].indexOf('new') === 0) {
      return this._createNewRecord(params);
    } else {
      return this._super(params);
    }
  }

});
