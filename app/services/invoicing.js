import Ember from 'ember';
import moment from 'moment';
import uuid from 'npm:uuid';

const {
  Service,
  RSVP,
  inject
} = Ember;

function flatten(arr) {
  let newArr = [];
  arr.forEach((ar) => newArr.push(...ar));
  return newArr;
}

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
    return sequence.save().then(() =>
      'inv' + (currentCount < 100000 ? `00000${currentCount}`.slice(-5) : currentCount));
  },

  _newInvoice(store, invoiceId, patient, visit) {
    let invoice = store.createRecord('invoice', {
      patient,
      visit,
      id: invoiceId,
      billDate: new Date(),
      status: 'Draft'
    });
    return invoice.save();
  },

  _resolveProps(modelGroups, prop) {
    let props = [];
    modelGroups.forEach((models) => {
      if (!Ember.isEmpty(models)) {
        models.forEach((model) => {
          let children = model.get(prop);
          if (!Ember.isEmpty(children)) {
            children.forEach((child) => props.push(child.reload()));
          }
        });
      }
    });
    return props;
  },

  _itemGroups(visit) {
    if (!Ember.isEmpty(visit)) {
      return [
        visit.get('imaging'),
        visit.get('labs'),
        visit.get('medication'),
        visit.get('procedures')
      ];
    }
    return [];
  },

  _itemTypes: {
    'Pharmacy': 'pharmacy',
    'X-ray/Lab/Supplies': 'supplies',
    'Ward Items': 'items',
    'Room/Accomodation': 'room',
    'Physical Therapy': 'therapy',
    'Others/Misc': 'others'
  },

  _cleanItem(lineItem) {
    let details = lineItem.get('details');
    details.toArray().forEach((x) => details.removeObject(x));
  },

  _roomDetails(store, visit, lineItem) {
    let startDate = visit.get('startDate');
    let endDate = visit.get('endDate');

    if (!Ember.isEmpty(endDate) && !Ember.isEmpty(startDate)) {
      let isNewItem = false;
      let stayDays = moment(endDate).diff(moment(startDate), 'days');
      if (stayDays > 1) {
        if (Ember.isEmpty(lineItem)) {
          isNewItem = true;
          lineItem = store.createRecord('billing-line-item', {
            id: uuid.v4(),
            category: 'Hospital Charges',
            name: 'Room/Accomodation'
          });
        }
        lineItem.get('details').addObject(store.createRecord('line-item-detail', {
          id: uuid.v4(),
          name: 'Days',
          quantity: stayDays
        }));

        // tell coordinator is there were no rooms before
        if (isNewItem) {
          return lineItem;
        }
      }
    }
  },

  _createDefaultLineItems(store, lineItems) {
    let objects = Object.keys(this._itemTypes)
      .map((lineItemName) => {
        return store.createRecord('billing-line-item', {
          id: uuid.v4(),
          name: lineItemName,
          category: 'Hospital Charges'
        });
      });
    lineItems.addObjects(objects);
  },

  _pharmacyCharge(store, charge, name) {
    return charge.getMedicationDetails(name).then((details) => {
      return store.createRecord('line-item-detail', {
        id: uuid.v4(),
        name: details.name,
        quantity: charge.get('quantity'),
        price: details.price,
        department: 'Pharmacy',
        expenseAccount: this.get('pharmacyExpenseAccount')
      });
    });
  },

  _pharmacyDetails(store, medication, procedures, lineItem) {
    let promises = medication
      .map((med) => this._pharmacyCharge(store, med, 'inventoryItem'))
      .concat(procedures.map((proc) =>
        proc.get('charges')
          .filter((charge) => !!charge.get('medicationCharge'))
          .map((med) => this._pharmacyCharge(store, med, 'medication'))));
    return RSVP.all(promises)
      .then((medCharges) => lineItem.get('details').addObjects(medCharges));
  },

  _procedureDetials(store, procedures, lineItem) {
    let details = procedures
      .map((proc) => proc.get('charges')
        .filter((charge) => !charge.get('medicationCharge'))
        .map((med) => this._supplyCharge(store, med, 'O.R')));
    lineItem.get('details').addObjects(details);
  },

  _wardDetails(store, visit, lineItem) {
    let details = visit
      .get('charges')
      .map((charge) => this._supplyCharge(store, charge, 'Ward'));
    lineItem.get('details').addObjects(details);
  },

  _supplyDetails(store, supplies, lineItem, type) {
    let details = [];
    let supplyType = `${type.toLowerCase()}Type`;
    supplies.forEach((supply) => {
      if (!Ember.isEmpty(supply.get(supplyType))) {
        details.push(this._supplyCharge(store, Ember.Object.create({
          pricingItem: supply.get(supplyType),
          quantity: 1
        }), type));
      }
      details.push(...supply.get('charges')
        .map((charge) => this._supplyCharge(store, charge, type)));
    });
    lineItem.get('details').addObjects(details);
  },

  _supplyCharge(store, charge, department) {
    return store.createRecord('line-item-detail', {
      id: uuid.v4(),
      name: charge.get('pricingItem.name'),
      expenseAccount: charge.get('pricingItem.expenseAccount'),
      quantity: charge.get('quantity'),
      price: charge.get('pricingItem.price'),
      department,
      pricingItem: charge.get('pricingItem')
    });
  },

  itemMap(lineItems) {
    let map = {};
    lineItems.forEach((lineItem) => {
      let lineItemKey = this._itemTypes[lineItem.get('name')];
      map[lineItemKey] = lineItem;
    });
    return map;
  },

  invoiceInvariant(visitChildren) {
    let charges = this._resolveProps(visitChildren, 'charges');
    if (!Ember.isEmpty(charges)) {
      return RSVP.all(charges)
        .then((charges) => RSVP.all(this._resolveProps(charges, 'pricingItem')));
    } else {
      return RSVP.resolve();
    }
  },

  reloadItems(lineItems) {
    return RSVP.all(lineItems.map((li) => li.reload()))
      .then((items) => RSVP.all(
        flatten(
          items.map((item) => item.get('details')
            .map((detail) => detail.reload())))))
      .catch((err) => console.warn(err));
  },

  saveItems(lineItems) {
    let promises = [];
    lineItems.forEach((lineItem) => {
      lineItem.get('details').forEach((detail) => promises.push(detail.save()));
      promises.push(lineItem.save());
    });
    return RSVP.all(promises);
  },

  regenerateItems(invoice, visit) {
    let store = this.get('store');
    let lineItems = invoice.get('lineItems');
    let itemMap = this.itemMap(lineItems);
    return RSVP.all(this._itemGroups(visit)).then((itemGroups) =>
      this.invoiceInvariant(itemGroups).then(() => {
        let [imaging, labs, medication, procedures] = itemGroups;

        let _temp = this._roomDetails(store, visit, itemMap.room);
        if (_temp) {
          lineItems.addObject(_temp);
        }

        this._cleanItem(itemMap.pharmacy);
        this._cleanItem(itemMap.supplies);
        this._cleanItem(itemMap.items);

        this._pharmacyDetails(store, medication, procedures, itemMap.pharmacy);
        this._procedureDetials(store, procedures, itemMap.supplies);
        this._supplyDetails(store, labs, itemMap.supplies, 'Lab');
        this._supplyDetails(store, imaging, itemMap.supplies, 'Imaging');
        this._wardDetails(store, visit, itemMap.items);
        return this.saveItems(lineItems).then(() => invoice.save());
      }));
  },

  createInvoice(patient, visit) {
    let store = this.get('store');
    let defaultItems = (invoice) => {
      this._createDefaultLineItems(store, invoice.get('lineItems'));
      return invoice;
    };

    return this._findSequence(store)
      .catch(() => this._createNewSequence(store))
      .then(this._generateInvoiceId)
      .then((invoiceId) => this._newInvoice(store, invoiceId, patient, visit))
      .then(defaultItems);
  },

  deleteInvoice(invoice) {
    if (!Ember.isEmpty(invoice)) {
      invoice.set('archived', true);
      return invoice.save().then(function() {
        invoice.unloadRecord();
      });
    }
    console.warn('no invoice');
    return RSVP.resolve();
  }

});
