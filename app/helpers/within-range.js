import Ember from 'ember';

export default Ember.Helper.helper(([value, lower, upper]) => {
  return (value >= lower && value <= upper);
});