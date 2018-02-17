import Ember from 'ember';
import SelectValues from 'hospitalrun/utils/select-values';
 
const HMOLIST = [
   'HYGEIA HMO LIMITED',
   'TOTAL HEALTH TRUST LIMITED',
   'CLEARLINE INTERNATIONAL LIMITED',
   'HEALTHCARE INTERNATIONAL LIMITED',
   'LIFE WORTH MEDICARE LTD',
   'GREENFIELD HEALTH MANAGEMENT LTD',
   'METROHEALTH HMO LIMITED',
   'ANCHOR HMO INTERNATIONAL COMPANY LTD'
 ];

export default Ember.Mixin.create({
   hmoTypes: HMOLIST.map(SelectValues.selectValuesMap)
}); 
