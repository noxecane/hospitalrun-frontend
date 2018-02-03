import Ember from 'ember';
import ModalHelper from 'hospitalrun/mixins/modal-helper';
import UserSession from 'hospitalrun/mixins/user-session';
import VisitStatus from 'hospitalrun/utils/visit-statuses';
import PatientVisits from 'hospitalrun/mixins/patient-visits';

const {
  computed
} = Ember;

export default Ember.Controller.extend(ModalHelper, UserSession, PatientVisits, {
  queryParams: [],

  visits: computed.filter('model.@each.status', (visit) => {
    return visit.get('status') === VisitStatus.CHECKED_IN  && visit.get('queue');
  }),

  canAddVisit: function() {
    return this.currentUserCan('add_visit');
  }.property(),

  startKey: [],
  actions: {
    dequeue(visit) {
      if (this.get('canAddVisit')) {
        visit.set('queue', 'None');
        visit.set('returnTo', 'patients.queue');
        this.transitionToRoute('visits.edit', visit.get('id'));
      }
    }
  }
});
