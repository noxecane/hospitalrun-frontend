import Ember from 'ember';
import ModalHelper from 'hospitalrun/mixins/modal-helper';
import UserSession from 'hospitalrun/mixins/user-session';

export default Ember.Component.extend(UserSession, ModalHelper, {
  canAddVitals: function() {
    return this.currentUserCan('add_vitals');
  }.property(),

  canDeleteVitals: function() {
    return this.currentUserCan('delete_vitals');
  }.property(),

  actions: {
    showEditVitals(vitals) {
      this.editVitals(vitals);
    },

    showDeleteVitals(vitals) {
      this.deleteVitals(vitals);
    }
  }
});
