import Ember from 'ember';

export default Ember.Helper.helper(([validate, value, lower, upper]) => {
  if (!validate || !value) {
    return 'ignore';
  }
  return (value >= lower && value <= upper) ? 'inside' : 'outside';
});