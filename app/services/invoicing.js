import Ember from 'ember';

const {
  Service,
  inject
} = Ember;

export default Service.extend({
  store: inject.service(),

  _generateId() {
    let store = this.get('store');
    return store.find('sequence', 'invoice').then(function(sequence) {
      let invoiceId = 'inv';
      let sequenceValue;
      sequence.incrementProperty('value', 1);
      sequenceValue = sequence.get('value');
      if (sequenceValue < 100000) {
        invoiceId += String(`00000${sequenceValue}`).slice(-5);
      } else {
        invoiceId += sequenceValue;
      }
      return sequence.save().then(function() {
        return invoiceId;
      });
    });
  },

  createInvoice(patient, visit) {
    return this._generateId().then(function(id) {
      let store = this.get('store');
      return store.createRecord('invoice', {
        patient,
        visit,
        id,
        billDate: new Date(),
        status: 'Draft'
      }).save();
    }.bind(this));
  },

  deleteInvoice(invoice) {
    invoice.set('archived', true);
    return invoice.save().then(function() {
      invoice.unloadRecord();
    });
  }

});
