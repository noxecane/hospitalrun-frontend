import Ember from 'ember';

const {
  Service,
  RSVP,
  inject
} = Ember;

export default Service.extend({
  store: inject.service(),

  _createNewSequence(store) {
    let newSequence = store.push(store.normalize('sequence', {
      id: 'invoice',
      value: 0
    }));
    return RSVP.resolve(newSequence);
  },

  _findSequence(store) {
    return store.find('sequence', 'invoice');
  },

  _generateInvoiceId(sequence) {
    sequence.incrementProperty('value', 1);
    let currentCount = sequence.get('value');
    return sequence.save().then(function() {
      return 'inv' + (currentCount < 100000 ? `00000${currentCount}`.slice(-5) : currentCount);
    });
  },

  _newInvoice(store, invoiceId, patient, visit) {
    let invoice = store.createRecord('invoice', {
      patient: patient,
      visit: visit,
      id: invoiceId,
      billDate: new Date(),
      status: 'Draft'
    });
    return invoice.save();
  },

  createInvoice(patient, visit) {
    let store = this.get('store');
    let newInvoice = function(invoiceId) {
      return this._newInvoice(store, invoiceId, patient, visit);
    };
    let newSequence = function() {
      return this._createNewSequence(store);
    };

    return this._findSequence(store)
      .catch(newSequence.bind(this))
      .then(this._generateInvoiceId)
      .then(newInvoice.bind(this));
  },

  deleteInvoice(invoice) {
    invoice.set('archived', true);
    return invoice.save().then(function() {
      invoice.unloadRecord();
    });
  }

});
