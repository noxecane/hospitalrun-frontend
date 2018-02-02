import AbstractIndexRoute from 'hospitalrun/routes/abstract-index-route';
export default AbstractIndexRoute.extend({
  modelName: 'invoice',
  pageTitle: 'Ongoing Invoice Listing',

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

  queryParams: {
    startKey: { refreshModel: true },
    status: { refreshModel: true }
  }
});
