import Ember from 'ember';
import FilterList from 'hospitalrun/mixins/filter-list';
import ModalHelper from 'hospitalrun/mixins/modal-helper';
import UserSession from 'hospitalrun/mixins/user-session';
import VisitStatus from 'hospitalrun/utils/visit-statuses';
import PatientVisits from 'hospitalrun/mixins/patient-visits';

const {
  computed
} = Ember;

export default Ember.Controller.extend(ModalHelper, UserSession, PatientVisits, FilterList, {
  queryParams: [],

  visits: computed.filter('model.@each.status', (visit) => {
    return visit.get('status') === VisitStatus.CHECKED_IN && !!visit.get('queue');
  }),

  canAddVisit: function() {
    return this.currentUserCan('add_visit');
  }.property(),

  filteredVisits: computed('visits', function() {
    return this.filterList(this.get('visits'), 'queue.role', this.currentUserRole());
  }),

  sortedVisits: computed('filteredVisits', function() {
    this.set('sortByKey', 'queue.date');
    this.set('sortByDesc', true);
    let filteredList = this.get('filteredList');
    return this.sortFilteredList(filteredList);
  }),

  startKey: [],
  actions: {
    dequeue(visit) {
      if (this.get('canAddVisit')) {
        let queue = visit.get('queue');
        visit.set('queue', null);
        visit.set('returnTo', 'patients.queue');
        this.transitionToRoute(queue.route, queue.id);
      }
    }
  }
});
