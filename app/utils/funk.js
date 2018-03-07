import Ember from 'ember';
export default {
  /**
  * Flatten an array of arrays one level deep
  */
  flatten(arr) {
    let newArr = [];
    arr.forEach((ar) => newArr.push(...ar));
    return newArr;
  },

  /**
  * Get an element or return a defaultValue
  */
  clojureGet(data, key, defaultValue) {
    if (data[key] === undefined || data[key] === null) {
      data[key] = defaultValue;
    }
    return data[key];
  },

  /*
  * Partial application of the function on two levels of variable
  * arguments.
  */
  partial(fn, ...args) {
    return (...args2) => fn(...args, ...args2);
  },

  /**
  * Group the array based on a property of its elements. Note that this
  * function ignores elements without the given properties.
  */
  groupBy(arr, prop) {
    let groups = {};
    arr.forEach((el) => {
      let key = Ember.get(el, prop);
      if (!Ember.isEmpty(key)) {
        this.clojureGet(groups, key, []).push(el);
      }
    });
    return groups;
  },

  /**
  * Split an array into 2 groups. The first failed the predicate and the
  * second passed.
  */
  splitBy(arr, pred) {
    let left = [];
    let right = [];
    arr.forEach((el) => {
      if (pred(el)) {
        right.push(el);
      } else {
        left.push(el);
      }
    });
    return [left, right];
  }
};