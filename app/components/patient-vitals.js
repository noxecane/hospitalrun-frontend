import Ember from 'ember';
import UserSession from 'hospitalrun/mixins/user-session';

export default Ember.Component.extend(UserSession, {
  canAddVitals: function() {
    return this.currentUserCan('add_vitals');
  }.property(),

  canDeleteVitals: function() {
    return this.currentUserCan('delete_vitals');
  }.property()
});
