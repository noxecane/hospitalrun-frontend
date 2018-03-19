import Ember from 'ember';

export function include([options, selected]) {
  return options.indexOf(selected) > -1;
}

export default Ember.Helper.helper(include);
