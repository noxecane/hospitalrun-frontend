import AbstractReportController from 'hospitalrun/controllers/abstract-report-controller';
import Ember from 'ember';
import NumberFormat from 'hospitalrun/mixins/number-format';
import ModalHelper from 'hospitalrun/mixins/modal-helper';
import moment from 'moment';
import funk from 'hospitalrun/utils/funk';

const { computed, inject } = Ember;

export default AbstractReportController.extend(NumberFormat, ModalHelper, {
  database: inject.service(),
  invoicing: inject.service(),
  reportType: 'payments',
  startDate: new Date(),
  endDate: null,

  reportTypes: computed(function() {
    return [{
      name: 'Payments',
      value: 'payments'
    }, {
      name: 'Debt',
      value: 'debt'
    }];
  }),

  reportColumns: Ember.computed('reportType', function() {
    let i18n = this.get('i18n');
    return {
      name: {
        label: i18n.t('billing.reports.name'),
        include: true,
        property: 'name'
      },
      invoiceId: {
        label: i18n.t('labels.id'),
        include: true,
        property: 'invoiceId'
      },
      billDate: {
        label: i18n.t('billing.reports.billedDate'),
        include: true,
        property: 'billDate'
      },
      actual: {
        label: i18n.t('billing.reports.actual'),
        include: false,
        property: 'actual',
        format: '_numberFormat'
      },
      amount: {
        label: i18n.t('billing.reports.paid'),
        include: false,
        property: 'amount',
        format: '_numberFormat'
      },
      datePaid: {
        label: i18n.t('billing.reports.datePaid'),
        include: false,
        property: 'datePaid'
      },
      reasons: {
        label: i18n.t('billing.reports.reasons'),
        include: false,
        property: 'paymentReasons'
      },
      paymentMethod: {
        label: i18n.t('billing.labels.paymentMethod'),
        include: false,
        property: 'paymentMethod'
      },
      paymentInfo: {
        label: i18n.t('billing.labels.paymentInfo'),
        include: false,
        property: 'paymentInfo'
      },
      paymentType: {
        label: i18n.t('labels.type'),
        include: false,
        property: 'paymentType'
      },
      unpaid: {
        label: i18n.t('billing.reports.owing'),
        include: false,
        property: 'unpaid',
        format: '_numberFormat'
      }
    };
  }),

  includePayments: function() {
    let shouldInclude = this.get('reportType') === 'payments';
    if (shouldInclude) {
      this.set('reportColumns.amount.include', true);
      this.set('reportColumns.datePaid.include', true);
      this.set('reportColumns.reasons.include', true);
      this.set('reportColumns.paymentMethod.include', true);
      this.set('reportColumns.paymentInfo.include', true);
    }
    return shouldInclude;
  }.property('reportType'),

  includeDebt: function() {
    let shouldInclude = this.get('reportType') === 'debt';
    if (shouldInclude) {
      this.set('reportColumns.actual.include', true);
      this.set('reportColumns.amount.include', true);
      this.set('reportColumns.unpaid.include', true);
    }
    return shouldInclude;
  }.property('reportType'),

  _getStartTime() {
    let startDate = this.get('startDate');
    if (Ember.isEmpty(startDate)) {
      startDate = new Date();
    }
    return moment(startDate).startOf('day').toDate().getTime();
  },

  _getEndTime() {
    let endDate = this.get('endDate');
    let endTime = this.get('maxValue');
    if (!Ember.isEmpty(endDate)) {
      endTime = moment(endDate).endOf('day').toDate().getTime();
    }
    return endTime;
  },

  _queryDB(query, view) {
    let database = this.get('database');
    query.include_docs = true;
    return database.queryMainDB(query, view)
      .then((data) => data.rows.map((r) => r.doc))
      .catch((err) => this._showError(err, 'queryDB'));
  },

  _queryDBIds(query, view) {
    let database = this.get('database');
    query.include_docs = false;
    return database.queryMainDB(query, view)
      .then((data) => data.rows.map((r) => r.id.split('_')[2]))
      .catch((err) => this._showError(err, 'queryDB'));
  },

  _showError(err, sourceFn) {
    this._notifyReportError(`Error from ${sourceFn}: ${err}`);
  },

  _findInvoices(startTime, endTime) {
    return this._queryDB({
      startkey: [startTime, 'invoice'],
      endkey: [endTime, 'invoice_\uffff']
    }, 'invoice_by_bill_date');
  },

  _findInvoiceIds(startTime, endTime) {
    return this._queryDBIds({
      startkey: [startTime, 'invoice'],
      endkey: [endTime, 'invoice_\uffff']
    }, 'invoice_by_bill_date');
  },

  _addInvoiceRow(row, invoiceId) {
    this._addReportRow(row, false, null, {
      action: 'viewInvoice',
      model: invoiceId
    });
  },

  _reloadInvoices(invoices) {
    let invoicing = this.get('invoicing');
    let invoiceProms = invoices.map(
      (inv) => invoicing.reloadItems(inv.get('lineItems')));
    return Ember.RSVP.all(invoiceProms)
      .then(() => invoices, (err) => this._showError(err, '_reloadInvoices'));
  },

  _genPayments() {
    let startTime = this._getStartTime();
    let endTime = this._getEndTime();
    let i18n = this.get('i18n');
    this._findInvoiceIds(startTime, endTime).then((invoiceIds) => {
      this.store.findByIds('invoice', invoiceIds)
        .then(this._reloadInvoices.bind(this))
        .then((invoices) => {
          let grandTotal = 0;
          invoices.forEach((invoice) => {
            // main invoice
            let nameStop = invoice.get('patientInfo').indexOf('-');
            let patientName = invoice.get('patientInfo').slice(0, nameStop - 1);
            this._addInvoiceRow({
              name: patientName,
              invoiceId: invoice.get('id'),
              billDate: moment(invoice.get('billDate')).format('l')
            }, invoice.get('id'));

            // payments
            invoice.get('payments').forEach((payment) => {
              this._addReportRow({
                datePaid: moment(payment.get('datePaid')).format('l'),
                paymentReasons: payment.get('formattedReasons'),
                amount: payment.get('amount'),
                paymentType: payment.get('paymentType'),
                paymentMethod: payment.get('paymentMethod'),
                paymentInfo: payment.get('formattedPaymentInfo')
              }, invoice.get('id'));
            });

            // sub-total
            let paidTotal = invoice.get('paidTotal');

            grandTotal += paidTotal;
            this._addReportRow({
              amount: i18n.t('billing.reports.subtotal') + this._numberFormat(paidTotal)
            }, true);
          });

          // grandTotal row
          if (grandTotal !== 0) {
            this._addReportRow({
              amount: i18n.t('billing.reports.total') + this._numberFormat(grandTotal)
            }, true);
          }

          this._finishReport();
          this.closeProgressModal();
        })
        .catch((err) => {
          this._showError(err, '_genPayments');
        });
    });
  },

  _genDebt() {
    let startTime = this._getStartTime();
    let endTime = this._getEndTime();
    let i18n = this.get('i18n');
    this._findInvoiceIds(startTime, endTime).then((invoiceIds) => {
      this.store.findByIds('invoice', invoiceIds)
        .then(this._reloadInvoices.bind(this))
        .then((invoices) => {
          let grandTotal = 0;
          invoices
            .filter((inv) => inv.get('remainingBalance') !== 0)
            .forEach((invoice) => {
              let nameStop = invoice.get('patientInfo').indexOf('-');
              let patientName = invoice.get('patientInfo').slice(0, nameStop - 1);
              let paidTotal = invoice.get('paidTotal');
              this._addInvoiceRow({
                name: patientName,
                invoiceId: invoice.get('id'),
                billDate: moment(invoice.get('billDate')).format('l'),
                actual: invoice.get('finalPatientResponsibility'),
                amount: paidTotal,
                unpaid: invoice.get('remainingBalance')
              }, invoice.get('id'));

              grandTotal += paidTotal;
            });

          // grandTotal row
          if (grandTotal !== 0) {
            this._addReportRow({
              amount: i18n.t('billing.reports.total') + this._numberFormat(grandTotal)
            }, true);
          }

          this._finishReport();
          this.closeProgressModal();
        })
        .catch((err) => {
          this._showError(err, '_genPayments');
        });
    });
  },

  actions: {
    generateReport() {
      let reportType = this.get('reportType');
      let reportRows = this.get('reportRows');

      reportRows.clear();
      this.showProgressModal();

      if (!Ember.isEmpty(reportType)) {
        reportType = `_gen${funk.capitalize(reportType)}`;
        if (!Ember.isEmpty(reportType)) {
          this[reportType]();
        }
      }
    },

    viewInvoice(invoiceId) {
      this.transitionToRoute('invoices.edit', invoiceId);
    }
  }
});