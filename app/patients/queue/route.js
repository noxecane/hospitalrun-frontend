import AbstractIndexRoute from 'hospitalrun/routes/abstract-index-route';
import DateFormat from 'hospitalrun/mixins/date-format';
// import moment from 'moment';

export default AbstractIndexRoute.extend(DateFormat, {
  itemsPerPage: null, // Fetch all outpatient visits as one page
  modelName: 'visit',
  pageTitle: 'Queue',
  hideNewButton: true,

  _getStartKeyFromItem(item) {
    let displayPatientId = item.get('displayPatientId');
    return [displayPatientId, `patient_${item.get('id')}`];
  },

  _modelQueryParams() {
    return {
      mapReduce: 'visit_by_date'
    };
  }
});
