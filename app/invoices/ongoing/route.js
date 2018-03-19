import AbstractIndexRoute from 'hospitalrun/routes/abstract-index-route';
export default AbstractIndexRoute.extend({
  modelName: 'invoice',
  moduleName: 'invoices',
  pageTitle: 'Ongoing Invoices',

  _getStartKeyFromItem(item) {
    let billDateAsTime = item.get('billDateAsTime');
    let id = this._getPouchIdFromItem(item);
    let searchStatus = item.get('status');
    return [searchStatus, billDateAsTime, id];
  },

  _modelQueryParams() {
    return {
      mapReduce: 'invoice_by_status'
    };
  },

  afterModel(model) {
    model
      .filter((invoice) => invoice.get('canTransact'))
      .toArray()
      .forEach((invoice) => model.removeObject(invoice));
  },

  setupController(controller, model) {
    this._super(controller, model);
    let currentController = this.controllerFor(this.get('moduleName'));
    currentController.set('subActions', null);
  },

  queryParams: {
    startKey: { refreshModel: true },
    status: { refreshModel: true }
  }
});
