import Ember from 'ember';

export default Ember.Service.extend({
  push(visit, role, route, id) {
    if (!route) {
      route = 'visits.edit';
      id = visit.get('id');
    }
    visit.set('queue', {
      role,
      route,
      id,
      date: new Date()
    });
    visit.set('needToUpdateVisit', true);
  },

  pop(visit) {
    visit.set('needToUpdateVisit', true);
    visit.set('queue', null);
  }
});
